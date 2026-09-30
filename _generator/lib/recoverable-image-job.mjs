import {createHash} from 'node:crypto';
import {drainOperations, OperationBlocked, hashBytes, operationKey} from './durable-operation.mjs';
import {IMAGE_EXECUTION_POLICY, imageExecutionHash, validateImageGenerationExecution, validateImageExecutionReceipt} from './image-execution.mjs';
import {inspectHandoffAsset} from './image-gate.mjs';

const blob = bytes => createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
const usageOK = value => value && ['work_invocations','codex_invocations','paid_model_api_calls'].every(k => value[k] === 0);
const empty = value => Array.isArray(value) && value.length === 0;
const timeOK = value => typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const idOK = value => typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
const assert = (ok, message) => { if (!ok) throw Error(message); };

/** A producer-side job: the supervisor consumes its durable result, not a filename search.
 * Real native host + complete-byte transport must be provided by the execution host.
 * This module never substitutes a paid API, claims a hidden native adapter, or generates
 * an image merely to test a connection. Interrupted operations resume from this journal.
 */
export async function executeRecoverableImage(execution, {store, host, transport, executionMode,
  editionId, editionDate, releaseSha, attempt = 1, trigger = 'active_chat', evidenceType = 'live',
  admission, now = () => new Date().toISOString(), ...runnerOptions} = {}) {
  const errors = validateImageGenerationExecution(execution);
  assert(!errors.length, errors.join(';'));
  assert(['production','qualification_nonproduction'].includes(executionMode), 'invalid_execution_mode');
  assert(['active_chat','scheduled','fixture'].includes(trigger) && ['live','fixture'].includes(evidenceType) &&
    ((trigger === 'fixture') === (evidenceType === 'fixture')), 'invalid_evidence_mode');
  assert(idOK(editionId) && /^\d{4}-\d{2}-\d{2}$/.test(editionDate || '') && /^[a-f0-9]{40}$/.test(releaseSha || ''), 'edition_release_binding_required');
  assert(Number.isInteger(attempt) && attempt >= 1 && attempt <= 4, 'attempt_budget_invalid');
  const candidate = execution.sealed_story_packet.candidate_id, requestHash = imageExecutionHash(execution);
  assert(idOK(candidate), 'unsafe_candidate_id');
  if (!host || typeof host.generate !== 'function' || typeof host.recover !== 'function' || typeof host.review !== 'function' ||
      !transport || ['ensure','read'].some(k => typeof transport[k] !== 'function')) {
    return {status: 'CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF', accepted_locked: false, attempts_allocated: 0};
  }
  assert(admission?.schema_version === 'image-handoff-proof-v2' && admission.host_id === host.id &&
    admission.release_sha === releaseSha && admission.evidence_type === evidenceType &&
    timeOK(admission.verified_at) && timeOK(admission.expires_at) &&
    /^[a-f0-9]{64}$/.test(admission.raw_sha256 || '') && typeof admission.native_result_id === 'string' && admission.native_result_id &&
    typeof admission.invocation_id === 'string' && admission.invocation_id && admission.git_readback_verified === true,
    'valid_current_host_handoff_proof_required');
  const binding = {schema_version: 'recoverable-image-job-v1', edition_id: editionId, edition_date: editionDate,
    request_sha256: requestHash, candidate_id: candidate, attempt, release_sha: releaseSha,
    execution_mode: executionMode, trigger, evidence_type: evidenceType, host_id: host.id};
  // Refreshing a capability proof must never create a new logical image job.
  const prior = await store.load(operationKey(binding));
  const generationRequested = Boolean(prior?.results?.generate || prior?.current?.id === 'generate');
  if (!generationRequested && (Date.parse(admission.verified_at) > Date.parse(now()) || Date.parse(admission.expires_at) <= Date.parse(now())))
    return {status: 'HOST_ADMISSION_EXPIRED', blocker: 'HOST_ADMISSION_EXPIRED', accepted_locked: false, attempts_allocated: 0};
  const rawPath = `_records/image-attempts/${editionId}/${candidate}/attempt-${attempt}/raw.png`;
  const finalPath = `briefs/images/${editionDate}/${editionId}-${candidate}-${attempt}.png`;
  async function retainGenerated(g, put) {
    assert(Buffer.isBuffer(g?.bytes) && g.bytes.length && g.call_id && g.artifact_id && timeOK(g.generated_at), 'native_result_required');
    assert(g.executor === 'native_chatgpt_image_generation' && g.evidence_type === evidenceType && usageOK(g.usage) && empty(g.owner_interventions), 'native_provenance_or_cost_invalid');
    const bytes = Buffer.from(g.bytes), object = await put(bytes);
    const {bytes: ignored, ...metadata} = g;
    return {metadata, object, raw_sha256: hashBytes(bytes)};
  }
  async function exactStore(file, bytes, key) {
    const result = await transport.ensure(file, bytes, {key});
    assert(result.path === file && empty(result.owner_interventions) && timeOK(result.persisted_at), 'invalid_transport_result');
    const back = await transport.read(file, result.commit_sha);
    assert(Buffer.isBuffer(back) && back.equals(bytes) && blob(back) === result.git_blob_sha, 'exact_byte_readback_failed');
    return {...result, sha256: hashBytes(back), read_back_verified: true};
  }
  const steps = [
    {id: 'generate', run: async c => {
      return retainGenerated(await host.generate(structuredClone(execution), {key: c.key, attempt}), c.put);
    },
      recover: async c => {
        const recovered = await host.recover(c.key);
        if (recovered?.status !== 'complete') throw new OperationBlocked('NATIVE_RESULT_PENDING_OR_UNOBSERVABLE', {retryAt: recovered?.retry_at ?? null, outcomeUnknown: true});
        assert(recovered.operation_key === c.key, 'native_result_operation_binding_mismatch');
        return retainGenerated(recovered.result, c.put);
      }},
    {id: 'capture', replaySafe: true, run: async c => exactStore(rawPath, await c.read(c.results.generate.object), c.key)},
    {id: 'prepare', replaySafe: true, run: async c => {
      const raw = await c.read(c.results.generate.object);
      const bytes = host.prepareFinal ? await host.prepareFinal(Buffer.from(raw)) : raw;
      assert(Buffer.isBuffer(bytes), 'final_bytes_required');
      const inspected = inspectHandoffAsset(bytes, '.png');
      assert(inspected.pass && inspected.width === 1200 && inspected.height === 630, 'final_canvas_invalid');
      return {object: await c.put(bytes), sha256: hashBytes(bytes), git_blob_sha: blob(bytes)};
    }},
    {id: 'review', replaySafe: true, run: async c => {
      const bytes = await c.read(c.results.prepare.object);
      const review = await host.review(bytes, structuredClone(execution), {key: c.key, attempt, sha256: hashBytes(bytes)});
      assert(review && usageOK(review.usage) && empty(review.owner_interventions) && review.mode === 'automated' &&
        review.phase === 'after_generation' && review.call_id && timeOK(review.reviewed_at) &&
        Date.parse(review.reviewed_at) >= Date.parse(c.results.generate.metadata.generated_at) &&
        review.asset_sha256 === hashBytes(bytes) && ['subject_match','factual_support','structural_quality','editorial_quality'].every(k => ['pass','fail'].includes(review[k])),
        'invalid_review_evidence');
      return review;
    }},
    {id: 'persist', replaySafe: true, run: async c => {
      if (['subject_match','factual_support','structural_quality','editorial_quality'].some(k => c.results.review[k] !== 'pass')) throw new OperationBlocked('IMAGE_QUALITY_REJECTED');
      return exactStore(finalPath, await c.read(c.results.prepare.object), c.key);
    }},
    {id: 'receipt', replaySafe: true, run: async c => {
      const r = c.results, g = r.generate.metadata;
      const receipt = {schema_version: '2.0.0', policy_id: IMAGE_EXECUTION_POLICY, request_sha256: requestHash,
        story_id: execution.sealed_story_packet.story_id, candidate_id: candidate, execution_mode: executionMode,
        evidence_type: evidenceType, trigger, owner_interventions: [], runtime_context_isolation: 'not_asserted', attempt,
        fallback_used: false, work_invocations: 0, codex_invocations: 0, paid_model_api_calls: 0, account_billing_observed: false,
        generation: {...g, raw_sha256: r.generate.raw_sha256, raw_capture: r.capture},
        review: r.review, persistence: r.persist, status: evidenceType === 'live' ? 'accepted_locked' : 'fixture_pass'};
      assert(!validateImageExecutionReceipt(receipt, execution, {assetSha256: r.prepare.sha256, gitBlobSha: r.prepare.git_blob_sha, allowFixture: evidenceType === 'fixture'}).length,
        'v2_acceptance_failed');
      return receipt;
    }}
  ];
  const outcome = await drainOperations({store, binding, steps, now, ...runnerOptions});
  if (outcome.state.status === 'complete') {
    const receipt = outcome.state.results.receipt;
    // Always recheck saved final bytes before reuse, without repeating generation or review.
    const bytes = await transport.read(receipt.persistence.path, receipt.persistence.commit_sha);
    assert(Buffer.isBuffer(bytes) && hashBytes(bytes) === receipt.persistence.sha256 && blob(bytes) === receipt.persistence.git_blob_sha, 'accepted_bytes_changed');
    return {...receipt, job_key: outcome.key, journal_revision: outcome.state.version, reused: outcome.executed === 0};
  }
  return {...outcome, accepted_locked: false, quality_rejected: outcome.blocker === 'IMAGE_QUALITY_REJECTED'};
}

/** Probe existing native result -> exact stored bytes before admitting research.
 * Producer recovery must supply the actual association. A caller-written boolean or
 * a matching filename alone cannot pass this procedure. It never generates a probe.
 */
export async function proveImageHandoff({host, transport, probeKey, expected, releaseSha, now = () => new Date().toISOString(), validityMs = 3600000}) {
  assert(host?.id && typeof host.recover === 'function' && transport?.ensure && transport?.read, 'supported_host_and_transport_required');
  assert(/^[a-f0-9]{64}$/.test(probeKey || '') && /^[a-f0-9]{40}$/.test(releaseSha || ''), 'probe_release_identity_required');
  assert(Number.isInteger(validityMs) && validityMs > 0 && validityMs <= 86400000, 'bounded_capability_validity_required');
  const recovered = await host.recover(probeKey);
  assert(recovered?.status === 'complete' && recovered.operation_key === probeKey && recovered.invocation_id, 'explicit_task_result_association_required');
  const g = recovered.result;
  assert(g?.executor === 'native_chatgpt_image_generation' && g.call_id === expected.native_result_id && g.artifact_id === expected.artifact_id &&
    Buffer.isBuffer(g.bytes) && hashBytes(g.bytes) === expected.sha256 && usageOK(g.usage) && empty(g.owner_interventions) &&
    ['live','fixture'].includes(g.evidence_type), 'native_probe_bytes_or_identity_mismatch');
  const destination = `_records/image-attempts/handoff-proof/${probeKey}/raw.png`;
  const stored = await transport.ensure(destination, g.bytes, {key: probeKey});
  const readback = await transport.read(destination, stored.commit_sha);
  assert(Buffer.isBuffer(readback) && readback.equals(g.bytes) && stored.git_blob_sha === blob(readback), 'probe_git_readback_failed');
  const verifiedAt = now(); assert(timeOK(verifiedAt), 'timezone_timestamp_required');
  return {schema_version: 'image-handoff-proof-v2', host_id: host.id, release_sha: releaseSha, evidence_type: g.evidence_type,
    invocation_id: recovered.invocation_id, operation_key: probeKey, native_result_id: g.call_id, artifact_id: g.artifact_id,
    raw_sha256: hashBytes(readback), git_blob_sha: blob(readback), git_commit_sha: stored.commit_sha,
    git_readback_verified: true, verified_at: verifiedAt, expires_at: new Date(Date.parse(verifiedAt) + validityMs).toISOString()};
}
