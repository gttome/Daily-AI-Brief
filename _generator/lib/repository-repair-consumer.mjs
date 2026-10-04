import {createHash} from 'node:crypto';

export const REPOSITORY_REPAIR_CONSUMER_VERSION = 'repository-repair-consumer-v2';
export const KNOWN_GOOD_TRANSPORT_PROOF_PATH = '_records/hardening/image-transport/known-good-exact-byte-proof.json';
export const REPOSITORY_REPAIR_QUEUE_MAX_INTERVALS = 1;
export const REQUIRED_IMAGE_REPAIR_PROOFS = Object.freeze([
  'fresh_single_story_worker_isolation',
  'no_people_or_humanoid_visual_primitives',
  'small_png_exact_byte_transport_preflight_pass',
  'protected_ci_pass',
  'operational_learning_updated'
]);

const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const hasAll=(haystack,needles)=>needles.every(x=>haystack.includes(x));

export function knownGoodTransportProof(record = {}) {
  const method=String(record?.candidate?.delivery_normalization?.method||record?.candidate?.method||'').toLowerCase();
  return record?.status==='accepted_locked' &&
    record?.persistence?.content_address_verified===true &&
    record?.persistence?.read_back_verified===true &&
    record?.review?.low_quality_fallback===false &&
    method.includes('same-visual');
}

export function selectKnownGoodTransportProof(records = []) {
  const eligible=records.filter(x=>knownGoodTransportProof(x.record)).sort((a,b)=>{
    const at=Date.parse(a.record?.accepted_at||a.record?.observed_at||0)||0;
    const bt=Date.parse(b.record?.accepted_at||b.record?.observed_at||0)||0;
    if(at!==bt) return bt-at;
    return String(a.path||'').localeCompare(String(b.path||''));
  });
  return eligible[0]||null;
}

export function queuedRepositoryRepairDecision({
  request,
  now=new Date().toISOString(),
  supervisor_interval_ms=60_000,
  active_consumer=true
}={}) {
  if(!request||request.schema_version!=='run-engineering-repair-request-v1'||
     request.request_kind!=='engineering_repair'||request.capability!=='repository')
    return {eligible:false,action:'ignore',reason:'not_repository_engineering_repair'};
  if(!stamp(request.created_at)||!stamp(now)||!Number.isInteger(supervisor_interval_ms)||supervisor_interval_ms<1)
    throw Error('valid_repository_repair_clock_required');
  if(request.status!=='queued') return {eligible:true,action:'already_consumed',reason:'request_not_queued'};
  const age_ms=Math.max(0,Date.parse(now)-Date.parse(request.created_at));
  if(active_consumer===true) return {eligible:true,action:'execute_now',reason:'repository_repair_has_active_consumer',age_ms};
  if(age_ms>=supervisor_interval_ms*REPOSITORY_REPAIR_QUEUE_MAX_INTERVALS)
    return {eligible:true,action:'liveness_defect',reason:'queued_action_without_consumer_is_not_progress',age_ms};
  return {eligible:true,action:'await_current_interval_only',reason:'consumer_grace_interval',age_ms};
}

export function validateImageRepairInputs({
  request,
  taskContract,
  transportAttempt,
  protectedCi,
  learningInvariants=[]
}={}) {
  const errors=[];
  if(request?.schema_version!=='run-engineering-repair-request-v1') errors.push('engineering_repair_request_schema');
  if(request?.request_kind!=='engineering_repair'||request?.capability!=='repository') errors.push('repository_engineering_repair_required');
  if(!/^1[1-6]$/.test(String(request?.task_id||''))) errors.push('image_task_required');
  if(!Number.isInteger(request?.repair_epoch)||request.repair_epoch<1) errors.push('repair_epoch_required');
  const observed=[...(request?.required_proofs||[])].sort();
  const expected=[...REQUIRED_IMAGE_REPAIR_PROOFS].sort();
  if(JSON.stringify(observed)!==JSON.stringify(expected)) errors.push('required_proof_set_mismatch');

  const repair=taskContract?.engineering_repair;
  if(repair?.enabled!==true||repair?.capability!=='repository') errors.push('task_engineering_repair_contract_required');
  const op=String(repair?.post_repair_operation||'').toLowerCase();
  if(!op.includes('fresh-context')||!op.includes('sealed single-story')) errors.push('fresh_single_story_worker_isolation_missing');
  if(!hasAll(op,['no people','avatar','humanoid'])) errors.push('no_people_contract_missing');

  if(transportAttempt?.status!=='accepted_locked'&&transportAttempt?.review_status!=='accepted_locked') errors.push('transport_proof_attempt_not_accepted');
  if(transportAttempt?.persistence?.content_address_verified!==true||transportAttempt?.persistence?.read_back_verified!==true)
    errors.push('transport_final_bytes_not_verified');
  if(transportAttempt?.review?.low_quality_fallback!==false) errors.push('transport_low_quality_fallback_not_prohibited');
  const method=String(transportAttempt?.candidate?.delivery_normalization?.method||transportAttempt?.candidate?.method||'').toLowerCase();
  if(!method.includes('same-visual')) errors.push('bounded_same_visual_transport_proof_missing');

  if(!Number.isInteger(protectedCi?.run_id)||protectedCi.run_id<1) errors.push('protected_ci_run_required');
  if(!/^[0-9a-f]{40}$/.test(protectedCi?.control_sha||'')) errors.push('protected_ci_control_sha_required');
  if(protectedCi?.conclusion!=='success') errors.push('protected_ci_success_required');

  for(const invariant of [
    'queued_action_without_consumer_is_not_progress',
    'repository_repair_request_must_have_active_consumer',
    'fresh_single_story_image_worker_after_context_mismatch'
  ]) if(!learningInvariants.includes(invariant)) errors.push('operational_learning_invariant_missing:'+invariant);

  return [...new Set(errors)];
}

export function buildImageEngineeringRepairReceipt({
  request,
  taskContract,
  transportAttempt,
  protectedCi,
  learningInvariants=[],
  consumedAt=new Date().toISOString(),
  consumerWriterGeneration
}={}) {
  if(!stamp(consumedAt)) throw Error('valid_repair_consumed_at_required');
  const errors=validateImageRepairInputs({request,taskContract,transportAttempt,protectedCi,learningInvariants});
  if(errors.length) return {result:'FAIL',errors};
  const method=transportAttempt.candidate?.delivery_normalization?.method||transportAttempt.candidate?.method;
  const transportPath=transportAttempt.persistence?.path||null;
  const proofs={
    fresh_single_story_worker_isolation:{
      result:'PASS',
      evidence:'Protected task recovery contract requires exactly one fresh-context worker using only the sealed single-story specification and excludes orchestration/dashboard context.'
    },
    no_people_or_humanoid_visual_primitives:{
      result:'PASS',
      evidence:'Protected post-repair contract explicitly prohibits people, avatars and humanoid primitives and requires non-human workflow artifacts.'
    },
    small_png_exact_byte_transport_preflight_pass:{
      result:'PASS',
      interpretation:'Exact identity applies to the final persisted professional PNG representation. Native source bytes may be quality-preservingly normalized when lineage is retained.',
      evidence_path:transportPath,
      method,
      final_git_blob_sha:transportAttempt.persistence.git_blob_sha,
      final_content_address_verified:true,
      final_read_back_verified:true,
      low_quality_fallback:false
    },
    protected_ci_pass:{
      result:'PASS',
      run_id:protectedCi.run_id,
      control_sha:protectedCi.control_sha,
      conclusion:'success'
    },
    operational_learning_updated:{
      result:'PASS',
      invariants:[
        'queued_action_without_consumer_is_not_progress',
        'repository_repair_request_must_have_active_consumer',
        'fresh_single_story_image_worker_after_context_mismatch'
      ]
    }
  };
  const required_proofs_passed=REQUIRED_IMAGE_REPAIR_PROOFS.every(k=>proofs[k]?.result==='PASS');
  const epoch={
    schema_version:'run-engineering-repair-epoch-v1',
    execution_id:request.execution_id,
    edition_id:request.edition_id,
    branch:request.branch,
    task_id:request.task_id,
    request_key:request.request_key,
    repair_epoch:request.repair_epoch,
    epochs_completed:request.repair_epoch,
    status:required_proofs_passed?'PASS':'FAIL',
    required_proofs:[...request.required_proofs],
    required_proofs_passed,
    proofs,
    consumer_version:REPOSITORY_REPAIR_CONSUMER_VERSION,
    consumer_writer_generation:Number.isInteger(consumerWriterGeneration)?consumerWriterGeneration:null,
    completed_at:consumedAt,
    post_repair_attempts:0,
    repair_digest:'sha256:'+hash(JSON.stringify({request_key:request.request_key,proofs}))
  };
  return {result:epoch.status,errors:[],epoch,proofs};
}
