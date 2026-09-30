import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {hashBytes, stableJson, drainOperations, OperationBlocked, operationView} from './durable-operation.mjs';
import {proveImageHandoff} from './recoverable-image-job.mjs';
import {validatePublicationManifest} from './publication-manifest.mjs';
import {resolveResumeStageFromRepository, RUN_STAGES, newRunState} from './run-state.mjs';

export const EDITION_EXECUTION_PROFILE = 'reliable-edition-v1';
export const EDITION_OPERATIONS = Object.freeze(['admission','discovery','editorial','media','images','seal_bundle','qualification','production_admission','publication','public_closed']);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const validSha = value => /^[a-f0-9]{40}$/.test(value || '');
const stamp = value => typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
function fileAt(root, relative) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) && !relative.includes('\\') && !relative.split('/').some(p => !p || p === '.' || p === '..'), 'unsafe_artifact_path');
  const base = fs.realpathSync(root), file = path.join(base, relative);
  const real = fs.realpathSync(file);
  assert(real.startsWith(base + path.sep) && !fs.lstatSync(file).isSymbolicLink() && fs.statSync(file).isFile(), 'unsafe_artifact_file');
  return real;
}

/** One edition identity is distinct from test attempts. A failed qualification stays
 * failed. A later compatible attempt may reuse content, not rewrite the old result.
 */
export function editionBinding({editionId, date, cutoff, releaseSha, researchBaselineSha, policies, executionId}) {
  assert(editionId === 'dab-edition-' + date && /^\d{4}-\d{2}-\d{2}$/.test(date || '') && stamp(cutoff), 'edition_identity_and_original_cutoff_required');
  assert(validSha(releaseSha) && validSha(researchBaselineSha) && /^[\w-]+$/.test(executionId || '') && policies && Object.keys(policies).length, 'pinned_execution_contract_required');
  return {profile: EDITION_EXECUTION_PROFILE, evidence_type:'live', edition_id: editionId, edition_date: date, cutoff,
    release_sha: releaseSha, research_baseline_sha: researchBaselineSha, policies: structuredClone(policies), execution_id: executionId};
}

/** Admission runs FIRST. No discovery callback is called without an actual result
 * recovery/read-back probe. The same controller drains every eligible handler.
 * Handlers are trusted executable integrations, never shell commands from JSON.
 */
export async function executeEdition({binding, store, host, transport, probeKey, expectedProbe, handlers = {}, terminalResult = null, ...options}) {
  assert(binding?.profile === EDITION_EXECUTION_PROFILE, 'versioned_edition_binding_required');
  if (terminalResult) return {status: 'terminal', result: terminalResult.result, run_id: terminalResult.run_id,
    resume_permitted: false, publication_complete: false, reason: 'historical_qualification_is_immutable'};
  const admission = async () => {
    if (!host || !transport) throw new OperationBlocked('CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');
    const proof=await proveImageHandoff({host, transport, probeKey, expected: expectedProbe, releaseSha: binding.release_sha, now: options.now});
    assert(proof.evidence_type==='live','fixture_cannot_admit_live_edition');
    const publicationState=newRunState({date:binding.edition_date,baselineSha:binding.research_baseline_sha});
    publicationState.execution_profile=EDITION_EXECUTION_PROFILE;
    publicationState.original_cutoff=binding.cutoff;
    publicationState.pinned_release_sha=binding.release_sha;
    return {result:'pass',proof,publication_state:publicationState};
  };
  const steps = EDITION_OPERATIONS.map(id => {
    if (id === 'admission') return {id, run: admission, recover: admission};
    const h = handlers[id];
    const run=h && typeof h.validate!=='function' ? async()=>{throw new OperationBlocked('STAGE_VALIDATOR_REQUIRED:'+id);} : h?.run;
    return {id, run, recover: h?.recover, replaySafe: id==='seal_bundle' && h?.replaySafe === true,
      validate: async (result, context) => {
        if (typeof h?.validate !== 'function') throw new OperationBlocked('STAGE_VALIDATOR_REQUIRED:' + id);
        await h.validate(result, context);
        assert(result?.result === 'pass', 'operation_evidence_not_pass:' + id);
        if (id === 'qualification') assert(result.execution_mode === 'qualification_nonproduction' && result.bundle_sha256 === context.results.seal_bundle?.bundle_sha256,
          'qualification_bundle_binding_required');
        if (id === 'production_admission') assert(result.production_identity && result.bundle_sha256 === context.results.seal_bundle?.bundle_sha256,
          'production_admission_bundle_binding_required');
        if (id === 'public_closed') assert(result.verified === true && result.execution_mode === 'production' && result.lifecycle === 'CLOSED' &&
          validSha(result.deployed_sha) && result.deployed_sha === context.results.publication?.deployed_sha &&
          Array.isArray(result.evidence_paths) && result.evidence_paths.length >= 3, 'real_public_closure_evidence_required');
      }};
  });
  return drainOperations({store, binding, steps, ...options});
}

/** Immutable content bundle. Validation is the SAME full production manifest gate,
 * not a second set of relaxed checks. Source dates and original baseline are retained.
 */
export function sealPublicationBundle(root, manifestPath, {releaseSha, cutoff}) {
  assert(validSha(releaseSha) && stamp(cutoff), 'release_and_cutoff_required');
  const manifest = JSON.parse(fs.readFileSync(fileAt(root, manifestPath), 'utf8'));
  const validation = validatePublicationManifest(root, manifest);
  assert(validation.result === 'PASS', 'bundle_not_publishable:' + validation.errors.join(';'));
  const paths = new Set([manifestPath, ...Object.values(manifest.artifacts).map(a => a.path)]);
  for (const name of ['image_manifest','image_review']) {
    const images = JSON.parse(fs.readFileSync(fileAt(root, manifest.artifacts[name].path), 'utf8'));
    for (const value of Object.values(images)) if (value && typeof value === 'object' && value.path) paths.add(value.path);
  }
  const qualitySpec=manifest.artifacts.image_quality_evidence;
  if(qualitySpec){
    const quality=JSON.parse(fs.readFileSync(fileAt(root,qualitySpec.path),'utf8'));
    if(quality.benchmark_profile_path)paths.add(quality.benchmark_profile_path);
    for(const image of quality.images||[]){
      const context=image.generation_context||{};
      if(context.request_path)paths.add(context.request_path);
      if(context.execution_receipt_path){
        paths.add(context.execution_receipt_path);
        const r=JSON.parse(fs.readFileSync(fileAt(root,context.execution_receipt_path),'utf8'));
        if(r.generation?.raw_capture?.path)paths.add(r.generation.raw_capture.path);
      }
    }
  }
  const artifacts = [...paths].sort().map(relative => {
    const bytes = fs.readFileSync(fileAt(root, relative));
    return {path: relative, sha256: hashBytes(bytes), bytes: bytes.length};
  });
  const metadata = JSON.parse(fs.readFileSync(fileAt(root, manifest.artifacts.metadata_candidates.path), 'utf8'));
  assert(metadata.cutoff === cutoff || metadata.research_cutoff === cutoff, 'original_cutoff_binding_mismatch');
  const bundle = {schema_version: 'sealed-edition-bundle-v1', edition_id: manifest.edition_id, edition_date: manifest.edition_date,
    research_baseline_sha: manifest.baseline_sha, release_sha: releaseSha, cutoff, manifest_path: manifestPath, artifacts};
  return {...bundle, bundle_sha256: hashBytes(stableJson(bundle))};
}
export function verifyPublicationBundle(root, bundle) {
  const {bundle_sha256: expected, ...data} = bundle;
  assert(bundle.schema_version === 'sealed-edition-bundle-v1' && hashBytes(stableJson(data)) === expected, 'bundle_identity_changed');
  assert(Array.isArray(bundle.artifacts) && new Set(bundle.artifacts.map(a => a.path)).size === bundle.artifacts.length, 'bundle_artifacts_invalid');
  for (const artifact of bundle.artifacts) {
    const bytes = fs.readFileSync(fileAt(root, artifact.path));
    assert(bytes.length === artifact.bytes && hashBytes(bytes) === artifact.sha256, 'bundle_bytes_changed:' + artifact.path);
  }
  // Reconstruct the complete inventory so deleting a required binary from the list
  // cannot turn a partial, self-hashed bundle into a valid publication input.
  const rebuilt = sealPublicationBundle(root, bundle.manifest_path, {releaseSha: bundle.release_sha, cutoff: bundle.cutoff});
  assert(rebuilt.bundle_sha256 === expected, 'bundle_inventory_incomplete');
  return {result: 'pass', bundle_sha256: expected};
}
export function promotionDecision(bundle, {targetReleaseSha, qualification, productionIdentity}) {
  assert(/^[a-f0-9]{64}$/.test(bundle?.bundle_sha256||'')&&validSha(bundle?.release_sha),'verified_bundle_identity_required');
  assert(validSha(targetReleaseSha) && /^editorial-handoff\/production\/[\w.-]+$/.test(productionIdentity || ''), 'explicit_production_identity_required');
  if (qualification?.result !== 'pass' || qualification.execution_mode !== 'qualification_nonproduction' ||
      qualification.bundle_sha256 !== bundle.bundle_sha256) return {action: 'BLOCK', reason: 'qualification_not_bound_to_bundle'};
  if (targetReleaseSha !== bundle.release_sha || (bundle.research_baseline_sha && targetReleaseSha !== bundle.research_baseline_sha)) return {action: 'COMPATIBILITY_MIGRATION_REQUIRED',
    preserve_bundle: true, source_release: bundle.release_sha, target_release: targetReleaseSha, restart_editorial: false};
  return {action: 'PROMOTE_VERIFIED_BUNDLE', bundle_sha256: bundle.bundle_sha256, production_identity: productionIdentity,
    regenerate_images: false, repeat_editorial: false, public_closed: false, protected_production_gates_required: true};
}

/** Terminal JSON is authoritative; narrative checkpoints are generated projections. */
export function canonicalExecutionStatus({terminalResult = null, journal = null, checkpointText = ''}) {
  if (terminalResult) {
    assert(['pass','fail'].includes(terminalResult.result), 'invalid_terminal_result');
    return {status: 'terminal_' + terminalResult.result, run_id: terminalResult.run_id, resume_permitted: false,
      publication_complete: false, failure_code: terminalResult.failure_code || null,
      narrative_conflict: /(?:is|remains) nonterminal/i.test(checkpointText), source: 'terminal_result'};
  }
  return {...operationView(journal), source: 'operation_journal'};
}
export function renderExecutionCheckpoint(status) {
  return '# Execution status\n\n' + Object.entries(status).map(([key,value]) => `**${key}:** ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join('\n\n') + '\n';
}


/** Immutable attempt results are authoritative. Bindings describe only the one in-flight
 * attempt. The mutable controller is a projection/cursor and may be rebuilt at any time.
 */
export function deriveImageProgress({selectedCandidateIds, resultsByCandidate = {}, bindingsByCandidate = {}}) {
  assert(Array.isArray(selectedCandidateIds) && selectedCandidateIds.length > 0 &&
    new Set(selectedCandidateIds).size === selectedCandidateIds.length, 'selected_image_candidates_required');
  const acceptedCandidateIds = [];
  const rejectedAttempts = {};
  const normalizedResults = {};
  for (const candidate of selectedCandidateIds) {
    const results = [...(resultsByCandidate[candidate] || [])].sort((a,b) => a.attempt - b.attempt);
    normalizedResults[candidate] = results;
    const accepted = results.filter(r => r?.accepted === true && r?.disposition === 'accepted');
    assert(accepted.length <= 1, 'multiple_accepted_attempts:' + candidate);
    if (accepted.length === 1) acceptedCandidateIds.push(candidate);
    rejectedAttempts[candidate] = results.filter(r => r?.quality_rejected === true && r?.disposition === 'quality_rejected').map(r => r.attempt);
  }
  if (acceptedCandidateIds.length === selectedCandidateIds.length) {
    return {source:'immutable_attempt_results', status:'done', accepted_images:acceptedCandidateIds.length,
      accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:null, current_attempt:null,
      current_operation_key:null, substage:'all_images_accepted', next_action:'seal_bundle', rejected_attempts:rejectedAttempts};
  }
  const candidate = selectedCandidateIds.find(id => !acceptedCandidateIds.includes(id));
  const results = normalizedResults[candidate];
  const bindings = [...(bindingsByCandidate[candidate] || [])].sort((a,b) => a.attempt - b.attempt);
  const lastResult = results.at(-1) || null, lastBinding = bindings.at(-1) || null;
  if (lastResult?.quality_rejected === true) {
    assert(lastResult.next_attempt_allowed !== false && lastResult.attempt < 4, 'image_attempt_budget_exhausted:' + candidate);
    const attempt = lastResult.attempt + 1;
    return {source:'immutable_attempt_results', status:'wip', accepted_images:acceptedCandidateIds.length,
      accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:attempt,
      current_operation_key:null, substage:`${candidate}_attempt_${attempt}_binding_pending`,
      next_action:`bind_${candidate}_attempt_${attempt}`, rejected_attempts:rejectedAttempts};
  }
  if (lastBinding && (!lastResult || lastBinding.attempt > lastResult.attempt)) {
    const attempt = lastBinding.attempt;
    const operationKeyValue = lastBinding.operation_key || null;
    if (lastBinding.generation_started !== true) {
      return {source:'immutable_attempt_results_plus_binding', status:'wip', accepted_images:acceptedCandidateIds.length,
        accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:attempt,
        current_operation_key:operationKeyValue, substage:`${candidate}_attempt_${attempt}_bound_pending_generation`,
        next_action:`generate_${candidate}_attempt_${attempt}_once`, rejected_attempts:rejectedAttempts};
    }
    if (lastBinding.review?.result === 'pass' && lastBinding.persistence?.final_path) {
      return {source:'immutable_attempt_results_plus_binding', status:'wip', accepted_images:acceptedCandidateIds.length,
        accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:attempt,
        current_operation_key:operationKeyValue, substage:`${candidate}_attempt_${attempt}_acceptance_reconciliation_pending`,
        next_action:`reconcile_${candidate}_attempt_${attempt}_acceptance`, rejected_attempts:rejectedAttempts};
    }
    if (lastBinding.review?.result === 'reject') {
      return {source:'immutable_attempt_results_plus_binding', status:'wip', accepted_images:acceptedCandidateIds.length,
        accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:attempt,
        current_operation_key:operationKeyValue, substage:`${candidate}_attempt_${attempt}_rejection_reconciliation_pending`,
        next_action:`reconcile_${candidate}_attempt_${attempt}_rejection`, rejected_attempts:rejectedAttempts};
    }
    return {source:'immutable_attempt_results_plus_binding', status:'wip', accepted_images:acceptedCandidateIds.length,
      accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:attempt,
      current_operation_key:operationKeyValue, substage:`${candidate}_attempt_${attempt}_review_or_persistence_pending`,
      next_action:`resume_${candidate}_attempt_${attempt}`, rejected_attempts:rejectedAttempts};
  }
  return {source:'immutable_attempt_results', status:'wip', accepted_images:acceptedCandidateIds.length,
    accepted_candidate_ids:acceptedCandidateIds, current_candidate_id:candidate, current_attempt:1,
    current_operation_key:null, substage:`${candidate}_attempt_1_binding_pending`,
    next_action:`bind_${candidate}_attempt_1`, rejected_attempts:rejectedAttempts};
}

export function applyDerivedImageProgress(state, progress) {
  assert(state?.schema_version === 'reliable-edition-controller-state-v1' && state.task06 && progress?.source,
    'image_controller_state_required');
  const next = structuredClone(state);
  next.task06 = {...next.task06,
    status: progress.status,
    accepted_images: progress.accepted_images,
    current_candidate_id: progress.current_candidate_id,
    current_attempt: progress.current_attempt,
    current_operation_key: progress.current_operation_key,
    substage: progress.substage,
    next_action: progress.next_action,
    progress_source: progress.source};
  next.task06.accepted_candidate_ids = [...progress.accepted_candidate_ids];
  if (progress.status === 'done') next.current_operation = 'seal_bundle';
  return next;
}

export function summarizeImagePerformance(resultsByCandidate = {}) {
  const rows = Object.values(resultsByCandidate).flat().filter(Boolean);
  const accepted = rows.filter(r => r.accepted === true && r.disposition === 'accepted');
  const firstAttemptAccepted = accepted.filter(r => r.attempt === 1).length;
  const elapsed = accepted.map(r => r.timing?.elapsed_seconds).filter(Number.isFinite).sort((a,b)=>a-b);
  const median = elapsed.length ? (elapsed.length % 2 ? elapsed[(elapsed.length-1)/2] :
    (elapsed[elapsed.length/2-1] + elapsed[elapsed.length/2]) / 2) : null;
  return {policy:'passive-image-performance-v1', attempts_total:rows.length, accepted_images:accepted.length,
    first_attempt_accepts:firstAttemptAccepted,
    first_attempt_acceptance_rate:accepted.length ? firstAttemptAccepted / accepted.length : null,
    median_accepted_wall_seconds:median, timing_samples:elapsed.length, publication_gate:false};
}

/** New admitted editions pin the original execution release. A later main commit
 * requests compatibility packaging, never silently discards editorial checkpoints.
 * Historical run-state behavior remains unchanged unless the new profile is present.
 */
export function pinnedResumeDecision(root, state, currentMainSha) {
  assert(validSha(currentMainSha), 'current_main_sha_required');
  const resume = resolveResumeStageFromRepository(root, state, {baselineSha: state.baseline_main_sha, contractVersion: state.contract_runtime_version});
  return {resume_stage: resume, preserved_stages: RUN_STAGES.filter(s => state.stages?.[s]?.status === 'pass' && RUN_STAGES.indexOf(s) < RUN_STAGES.indexOf(resume)),
    deployment_rebinding_required: currentMainSha !== state.baseline_main_sha, current_main_sha: currentMainSha,
    pinned_research_baseline_sha: state.baseline_main_sha, restart_editorial_due_to_main_change: false};
}

/** Offline admission verifier for an ALREADY observed producer result, persisted by
 * proveImageHandoff. It validates evidence bindings; it cannot invent host capability.
 * Called before new discovery requests, not after an edition has been researched.
 */
export function verifyAdmissionEvidence(root, proof, {releaseSha, now = new Date().toISOString()} = {}) {
  assert(validSha(releaseSha) && stamp(now), 'admission_release_and_time_required');
  assert(proof?.schema_version === 'image-handoff-proof-v2' && proof.evidence_type === 'live' && proof.release_sha === releaseSha &&
    typeof proof.host_id === 'string' && proof.host_id && typeof proof.invocation_id === 'string' && proof.invocation_id &&
    typeof proof.native_result_id === 'string' && proof.native_result_id && typeof proof.artifact_id === 'string' && proof.artifact_id &&
    /^[a-f0-9]{64}$/.test(proof.operation_key || '') &&
    (proof.git_content_address_verified === true || proof.git_readback_verified === true) && validSha(proof.git_commit_sha),
    'CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');
  assert(stamp(proof.verified_at) && stamp(proof.expires_at) && Date.parse(proof.verified_at) <= Date.parse(now) &&
    Date.parse(proof.expires_at) > Date.parse(now) && Date.parse(proof.expires_at)-Date.parse(proof.verified_at) <= 86400000,
    'HOST_ADMISSION_EXPIRED_OR_INVALID');
  const bytes=fs.readFileSync(fileAt(root,`_records/image-attempts/handoff-proof/${proof.operation_key}/raw.png`));
  const gitBlob=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  assert(hashBytes(bytes)===proof.raw_sha256&&gitBlob===proof.git_blob_sha,'ADMISSION_RAW_BYTES_MISMATCH');
  return {result:'pass',profile:EDITION_EXECUTION_PROFILE,host_id:proof.host_id,release_sha:releaseSha,probe_sha256:proof.raw_sha256};
}
