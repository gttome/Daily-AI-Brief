import {createHash} from 'node:crypto';
import {buildQualificationImageWorkerPayload,buildQualificationImageGenerationInstruction,validateQualificationImageWorkerPayload} from './image-story-packet.mjs';

export const IMAGE_EXECUTION_POLICY='production-image-execution-v2';
export const AUTOMATED_IMAGE_EFFECTIVE_DATE='2026-09-28';
export const IMAGE_GENERATION_EXECUTION_KEYS=Object.freeze([
  'schema_version','policy_id','mode','story_ids','includes_edition_context',
  'request_scope','runtime_context_isolation','requires_fresh_conversation',
  'manual_intervention_allowed','output_count','review_phase',
  'sealed_story_packet','generation_instruction','prompt'
]);
const digest=value=>createHash('sha256').update(value).digest('hex');
const blob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const stamp=x=>typeof x==='string'&&/(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const fail=errors=>{if(errors.length)throw Error(errors.join('; '));};
const zeroUsage=x=>x&&['work_invocations','codex_invocations','paid_model_api_calls'].every(k=>x[k]===0);
const noOwner=x=>Array.isArray(x)&&x.length===0;
const safePath=x=>nonempty(x)&&!x.startsWith('/')&&!x.includes('\\')&&!x.split('/').some(p=>p==='..'||p==='.'||!p);

/** Request scope is observable; hidden platform context isolation is not asserted. */
export function buildImageGenerationExecution(packet){
  const sealed=structuredClone(buildQualificationImageWorkerPayload(packet));
  fail(validateQualificationImageWorkerPayload(sealed));
  if(!nonempty(sealed.story_id)||!nonempty(sealed.candidate_id))throw Error('single_story_identity_required');
  const instruction=buildQualificationImageGenerationInstruction(sealed);
  return {
    schema_version:'2.0.0',policy_id:IMAGE_EXECUTION_POLICY,
    mode:'single_story',story_ids:[sealed.story_id],includes_edition_context:false,
    request_scope:'sealed_story_payload_only',runtime_context_isolation:'not_asserted',
    requires_fresh_conversation:false,manual_intervention_allowed:false,
    output_count:1,review_phase:'after_generation',sealed_story_packet:sealed,
    generation_instruction:instruction,prompt:instruction
  };
}
export const buildProductionImageGenerationExecution=buildImageGenerationExecution;

export function validateImageGenerationExecution(execution){
  if(!execution||typeof execution!=='object'||Array.isArray(execution))return ['image_generation_execution_required'];
  const errors=[];
  for(const key of IMAGE_GENERATION_EXECUTION_KEYS)if(!(key in execution))errors.push('missing_generation_execution_key_'+key);
  for(const key of Object.keys(execution))if(!IMAGE_GENERATION_EXECUTION_KEYS.includes(key))errors.push('prohibited_generation_execution_key_'+key);
  try{
    const expected=buildImageGenerationExecution(execution.sealed_story_packet);
    errors.push(...validateQualificationImageWorkerPayload(execution.sealed_story_packet));
    for(const key of IMAGE_GENERATION_EXECUTION_KEYS){
      if(JSON.stringify(execution[key])!==JSON.stringify(expected[key]))errors.push(key==='generation_instruction'?'generation_instruction_must_derive_only_from_sealed_story_packet':'image_execution_mismatch:'+key);
    }
  }catch(e){errors.push('invalid_sealed_story_packet:'+e.message);}
  return [...new Set(errors)];
}
export function imageExecutionHash(execution){fail(validateImageGenerationExecution(execution));return digest(JSON.stringify(execution));}

/** A receipt documents actual tool calls and exact bytes, never a prepared request alone. */
export function validateImageExecutionReceipt(r,e,{assetSha256=null,gitBlobSha=null,allowFixture=false}={}){
  const errors=[...validateImageGenerationExecution(e)];
  if(errors.length)return errors;
  if(!r||typeof r!=='object'||Array.isArray(r))return ['image_execution_receipt_required'];
  if(r.schema_version!=='2.0.0'||r.policy_id!==IMAGE_EXECUTION_POLICY)errors.push('image_execution_receipt_policy_mismatch');
  if(r.request_sha256!==imageExecutionHash(e)||r.story_id!==e.sealed_story_packet.story_id||r.candidate_id!==e.sealed_story_packet.candidate_id)errors.push('image_execution_receipt_binding_mismatch');
  if(!['production','qualification_nonproduction'].includes(r.execution_mode))errors.push('image_execution_mode_invalid');
  if(!['scheduled','active_chat','fixture'].includes(r.trigger))errors.push('image_execution_trigger_invalid');
  if(r.evidence_type!=='live'&&!(allowFixture&&r.evidence_type==='fixture'))errors.push('live_image_execution_evidence_required');
  if(r.evidence_type==='live'&&r.trigger==='fixture')errors.push('fixture_cannot_be_live_evidence');
  if(r.evidence_type==='fixture'&&r.trigger!=='fixture')errors.push('fixture_trigger_required');
  if(!Array.isArray(r.owner_interventions)||r.owner_interventions.length!==0)errors.push('manual_image_intervention_prohibited');
  if(r.runtime_context_isolation!=='not_asserted')errors.push('unsupported_runtime_isolation_attestation');
  if(!Number.isInteger(r.attempt)||r.attempt<1||r.attempt>4)errors.push('image_attempt_out_of_bounds');
  if(r.fallback_used!==false||r.account_billing_observed!==false)errors.push('image_receipt_boundary_invalid');
  for(const key of ['work_invocations','codex_invocations','paid_model_api_calls'])if(r[key]!==0)errors.push('image_cost_boundary:'+key);
  const g=r.generation||{},v=r.review||{},p=r.persistence||{},raw=g.raw_capture||{};
  if(!safePath(raw.path)||!raw.path.startsWith('_records/image-attempts/')||raw.sha256!==g.raw_sha256||!/^[a-f0-9]{40}$/.test(raw.git_blob_sha||'')||
    !(raw.content_address_verified===true||raw.read_back_verified===true))errors.push('durable_raw_image_capture_required');
  if(g.evidence_type!==r.evidence_type||!zeroUsage(g.usage)||!noOwner(g.owner_interventions)||g.executor!=='native_chatgpt_image_generation'||!nonempty(g.call_id)||!nonempty(g.artifact_id)||!stamp(g.generated_at)||!/^[a-f0-9]{64}$/.test(g.raw_sha256||''))errors.push('native_image_generation_evidence_required');
  if(!zeroUsage(v.usage)||!noOwner(v.owner_interventions)||v.mode!=='automated'||v.phase!=='after_generation'||!nonempty(v.call_id)||!stamp(v.reviewed_at)||Date.parse(v.reviewed_at)<Date.parse(g.generated_at))errors.push('automated_post_generation_review_required');
  for(const key of ['subject_match','factual_support','structural_quality','editorial_quality'])if(v[key]!=='pass')errors.push('automated_image_review_not_pass:'+key);
  if(!/^[a-f0-9]{64}$/.test(v.asset_sha256||'')||v.asset_sha256!==p.sha256)errors.push('reviewed_image_bytes_mismatch');
  if(!safePath(p.path)||!p.path.startsWith('briefs/images/')||!/^[a-f0-9]{40}$/.test(p.git_blob_sha||'')||
    !(p.content_address_verified===true||p.read_back_verified===true)||!stamp(p.persisted_at)||Date.parse(p.persisted_at)<Date.parse(v.reviewed_at))errors.push('exact_image_persistence_required');
  if(assetSha256&&p.sha256!==assetSha256)errors.push('persisted_image_sha256_mismatch');
  if(gitBlobSha&&p.git_blob_sha!==gitBlobSha)errors.push('persisted_image_git_blob_mismatch');
  if(r.status!==(r.evidence_type==='live'?'accepted_locked':'fixture_pass'))errors.push('image_receipt_status_invalid');
  return [...new Set(errors)];
}

/** Shared serial orchestration. Adapters must be supplied by the actual execution host.
 * There is intentionally no paid API adapter, owner-upload callback, or implied scheduler.
 * eventSink must durably record each attempted call/result; fixture tests cannot certify live readiness.
 */
async function executeLegacyImageRequest(execution,{adapter,eventSink,executionMode,trigger='active_chat',evidenceType='live',maxAttempts=4,resume=null}={}){
  fail(validateImageGenerationExecution(execution));
  if(!['production','qualification_nonproduction'].includes(executionMode))throw Error('image_execution_mode_invalid');
  if(!['live','fixture'].includes(evidenceType)||!['scheduled','active_chat','fixture'].includes(trigger)||((evidenceType==='fixture')!==(trigger==='fixture')))throw Error('image_execution_evidence_mode_invalid');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>4)throw Error('image_attempt_budget_invalid');
  if(typeof eventSink!=='function')throw Error('durable_image_event_sink_required');
  const requestHash=imageExecutionHash(execution),candidate=execution.sealed_story_packet.candidate_id;
  const emit=event=>eventSink({policy_id:IMAGE_EXECUTION_POLICY,request_sha256:requestHash,candidate_id:candidate,...event});
  if(!adapter||['generate','capture','review','persist','read'].some(k=>typeof adapter[k]!=='function')){
    await emit({status:'CAPABILITY_BLOCKED',reason:'native_generation_review_or_exact_transport_unavailable',manual_intervention_required:false});
    return {status:'CAPABILITY_BLOCKED',manual_intervention_required:false,accepted_locked:false};
  }
  if(resume){
    fail(validateImageExecutionReceipt(resume,execution,{allowFixture:evidenceType==='fixture'}));
    if(resume.execution_mode!==executionMode||resume.evidence_type!==evidenceType)throw Error('image_resume_mode_mismatch');
    const bytes=await adapter.read(resume.persistence.path);
    if(!Buffer.isBuffer(bytes)||digest(bytes)!==resume.persistence.sha256||blob(bytes)!==resume.persistence.git_blob_sha)throw Error('image_resume_bytes_changed');
    await emit({status:'REUSED_ACCEPTED_BYTES',sha256:resume.persistence.sha256});
    return {...resume,reused:true};
  }
  const failures=[];
  try{
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    await emit({status:'GENERATION_REQUESTED',attempt});
    let generated;
    try{generated=await adapter.generate(structuredClone(execution),{attempt});}
    catch(error){failures.push({attempt,stage:'generation',reason:error.message});await emit({status:'ATTEMPT_FAILED',...failures.at(-1)});continue;}
    if(!Buffer.isBuffer(generated?.bytes)||!generated.bytes.length||!nonempty(generated.call_id)||!nonempty(generated.artifact_id)||!stamp(generated.generated_at))throw Error('native_generation_result_invalid');
    if(generated.executor!=='native_chatgpt_image_generation'||generated.evidence_type!==evidenceType||!zeroUsage(generated.usage)||!noOwner(generated.owner_interventions))throw Error('native_generation_provenance_or_cost_boundary_invalid');
    const rawHash=digest(generated.bytes);
    await emit({status:'IMAGE_GENERATED',attempt,call_id:generated.call_id,artifact_id:generated.artifact_id,raw_sha256:rawHash});
    const captured=await adapter.capture(Buffer.from(generated.bytes),{request_sha256:requestHash,candidate_id:candidate,attempt,sha256:rawHash});
    if(!safePath(captured?.path)||!captured.path.startsWith('_records/image-attempts/')||!noOwner(captured.owner_interventions))throw Error('automatic_durable_raw_capture_required');
    const rawReadback=await adapter.read(captured.path);
    if(!Buffer.isBuffer(rawReadback)||digest(rawReadback)!==rawHash||blob(rawReadback)!==blob(generated.bytes))throw Error('raw_image_capture_readback_mismatch');
    const rawCapture={path:captured.path,sha256:rawHash,git_blob_sha:blob(rawReadback),read_back_verified:true};
    await emit({status:'RAW_IMAGE_CAPTURED',attempt,raw_capture:rawCapture});
    // Normalize canvas, if necessary, BEFORE review; never alter approved bytes afterward.
    const bytes=adapter.prepareFinal?await adapter.prepareFinal(Buffer.from(generated.bytes)):Buffer.from(generated.bytes);
    if(!Buffer.isBuffer(bytes)||!bytes.length)throw Error('image_final_bytes_required');
    const hash=digest(bytes);
    const review=await adapter.review(Buffer.from(bytes),structuredClone(execution),{attempt,sha256:hash});
    const reviewOK=zeroUsage(review?.usage)&&noOwner(review?.owner_interventions)&&review?.asset_sha256===hash&&review.mode==='automated'&&review.phase==='after_generation'&&nonempty(review.call_id)&&stamp(review.reviewed_at)&&Date.parse(review.reviewed_at)>=Date.parse(generated.generated_at)&&['subject_match','factual_support','structural_quality','editorial_quality'].every(k=>review[k]==='pass');
    if(!reviewOK){failures.push({attempt,stage:'review',reason:'image_review_failed',raw_sha256:rawHash,asset_sha256:hash,artifact_id:generated.artifact_id,review});await emit({status:'ATTEMPT_REJECTED',...failures.at(-1)});continue;}
    await emit({status:'IMAGE_REVIEWED',attempt,asset_sha256:hash,review});
    const stored=await adapter.persist(Buffer.from(bytes),{candidate_id:candidate,story_id:execution.sealed_story_packet.story_id,sha256:hash,git_blob_sha:blob(bytes),attempt});
    if(!noOwner(stored?.owner_interventions))throw Error('manual_image_persistence_prohibited');
    if(!safePath(stored?.path)||!stored.path.startsWith('briefs/images/'))throw Error('unsafe_image_persistence_path');
    const recovered=await adapter.read(stored.path);
    if(!Buffer.isBuffer(recovered)||digest(recovered)!==hash||blob(recovered)!==blob(bytes))throw Error('image_persistence_readback_mismatch');
    const receipt={schema_version:'2.0.0',policy_id:IMAGE_EXECUTION_POLICY,request_sha256:requestHash,
      story_id:execution.sealed_story_packet.story_id,candidate_id:candidate,execution_mode:executionMode,
      evidence_type:evidenceType,trigger,owner_interventions:[],runtime_context_isolation:'not_asserted',attempt,
      fallback_used:false,work_invocations:0,codex_invocations:0,paid_model_api_calls:0,account_billing_observed:false,
      generation:{executor:'native_chatgpt_image_generation',call_id:generated.call_id,artifact_id:generated.artifact_id,generated_at:generated.generated_at,raw_sha256:rawHash,raw_capture:rawCapture,evidence_type:generated.evidence_type,usage:structuredClone(generated.usage),owner_interventions:structuredClone(generated.owner_interventions)},
      review:structuredClone(review),persistence:{path:stored.path,sha256:hash,git_blob_sha:blob(bytes),persisted_at:stored.persisted_at,read_back_verified:true},
      status:evidenceType==='live'?'accepted_locked':'fixture_pass'};
    fail(validateImageExecutionReceipt(receipt,execution,{assetSha256:hash,gitBlobSha:blob(bytes),allowFixture:evidenceType==='fixture'}));
    await emit({status:'RECEIPT_PERSISTED',receipt});
    return {...receipt,reused:false};
  }
  }catch(error){await emit({status:'EXECUTION_FAILED',reason:error.message,manual_intervention_required:false});throw error;}
  await emit({status:'ATTEMPT_LIMIT_EXHAUSTED',failures,manual_intervention_required:false});
  return {status:'ATTEMPT_LIMIT_EXHAUSTED',accepted_locked:false,manual_intervention_required:false,failures};
}

/** New admitted editions use the durable producer job; historical callers retain
 * their original behavior. No new-profile call may silently fall back to volatile
 * execution just because a host/store capability is unavailable. */
export async function executeImageRequest(execution, options={}) {
  if (options.executionProfile !== 'reliable-edition-v1') return executeLegacyImageRequest(execution, options);
  if (!options.operationStore) return {status:'CAPABILITY_BLOCKED_DURABLE_STORE_REQUIRED',accepted_locked:false,attempts_allocated:0};
  if (options.resume) {
    fail(validateImageExecutionReceipt(options.resume,execution,{allowFixture:options.evidenceType==='fixture'}));
    if(options.resume.execution_mode!==options.executionMode||options.resume.evidence_type!==(options.evidenceType||'live'))throw Error('image_resume_mode_mismatch');
    const bytes=await options.transport.read(options.resume.persistence.path,options.resume.persistence.commit_sha);
    if(!Buffer.isBuffer(bytes)||digest(bytes)!==options.resume.persistence.sha256||blob(bytes)!==options.resume.persistence.git_blob_sha)throw Error('image_resume_bytes_changed');
    return {...options.resume,reused:true};
  }
  const {executeRecoverableImage}=await import('./recoverable-image-job.mjs');
  const maximum=options.maxAttempts??4;
  if(!Number.isInteger(maximum)||maximum<1||maximum>4)throw Error('image_attempt_budget_invalid');
  for(let attempt=1;attempt<=maximum;attempt++) {
    const result=await executeRecoverableImage(execution,{...options,store:options.operationStore,attempt});
    if(!result.quality_rejected)return result;
  }
  return {status:'ATTEMPT_LIMIT_EXHAUSTED',accepted_locked:false,manual_intervention_required:false};
}

export async function executeImageBatch(executions,options={}){
  if(!Array.isArray(executions)||executions.length!==6)throw Error('six_image_requests_required');
  for(const e of executions)fail(validateImageGenerationExecution(e));
  if(new Set(executions.map(e=>e.sealed_story_packet.story_id)).size!==6||new Set(executions.map(e=>e.sealed_story_packet.candidate_id)).size!==6)throw Error('unique_image_story_identity_required');
  const results=[],hashes=new Set();
  for(const execution of executions){
    const result=await executeImageRequest(execution,{...options,resume:options.resumeByCandidate?.[execution.sealed_story_packet.candidate_id]||null});
    results.push(result);
    if(!['accepted_locked','fixture_pass'].includes(result.status))return {status:result.status,results,unattended_image_stage_evidence_complete:false};
    if(hashes.has(result.persistence.sha256))return {status:'DUPLICATE_STORY_IMAGE_REJECTED',results,unattended_image_stage_evidence_complete:false};
    hashes.add(result.persistence.sha256);
  }
  return {status:options.evidenceType==='fixture'?'fixture_pass':'images_complete',results,
    unattended_image_stage_evidence_complete:options.evidenceType!=='fixture'&&options.executionMode==='production'&&options.trigger==='scheduled'};
}
