import {createHash} from 'node:crypto';

export const IMAGE_PERSISTENCE_REGISTRY_VERSION='image-persistence-registry-v1';
export const IMAGE_PERSISTENCE_MATRIX_VERSION='image-persistence-compatibility-matrix-v1';
export const IMAGE_PERSISTENCE_MODES=Object.freeze([
  'native_capture',
  'normalization',
  'protected_exact_byte_transport',
  'stable_exact_persistence'
]);

const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const nonempty=v=>typeof v==='string'&&v.length>0;
const sha256=v=>/^[a-f0-9]{64}$/.test(v||'');
const blob=v=>/^[a-f0-9]{40}$/.test(v||'');

export function persistenceModeForAttempt(attempt={}){
  if(attempt.normalization?.path)return 'normalization';
  if(attempt.native_capture?.persisted===true&&attempt.native_capture?.transport_receipt)return 'protected_exact_byte_transport';
  if(attempt.native_capture?.persisted===true)return 'native_capture';
  if(attempt.persistence?.path&&attempt.persistence?.read_back_verified===true)return 'stable_exact_persistence';
  return null;
}

function sourceFor(attempt,mode){
  if(mode==='normalization')return attempt.normalization;
  if(mode==='native_capture'||mode==='protected_exact_byte_transport')return attempt.native_capture;
  if(mode==='stable_exact_persistence')return attempt.persistence;
  return null;
}

export function normalizeAcceptedImageEvidence({lock,attempt,review,expected={}}={}){
  const mode=persistenceModeForAttempt(attempt||{});
  if(!IMAGE_PERSISTENCE_MODES.includes(mode))throw Error('unsupported_accepted_image_persistence_mode');
  const source=sourceFor(attempt,mode)||{},final=lock?.final||{},saved=review?.final||{};
  const identity=[lock,attempt,review].every(x=>x&&x.execution_id===lock?.execution_id&&x.edition_id===lock?.edition_id&&x.candidate_id===lock?.candidate_id);
  const normalized={
    schema_version:IMAGE_PERSISTENCE_REGISTRY_VERSION,
    candidate_id:lock?.candidate_id||null,
    execution_id:lock?.execution_id||null,
    edition_id:lock?.edition_id||null,
    task_id:String(lock?.task_id||attempt?.task_id||'').padStart(2,'0'),
    path:source.path||null,
    sha256:source.sha256||null,
    git_blob_sha:source.git_blob_sha||null,
    exact_readback:source.exact_readback||saved.exact_readback||(source.read_back_verified===true?'PASS_READBACK_VERIFIED':null),
    persistence_mode:mode,
    visual_review_result:review?.result||review?.visual_review?.result||null,
    quality_gate_result:lock?.quality_gate||null,
    lock_identity:'sha256:'+hash({
      execution_id:lock?.execution_id,edition_id:lock?.edition_id,candidate_id:lock?.candidate_id,
      task_id:lock?.task_id,attempt_receipt:lock?.attempt_receipt,saved_git_review:lock?.saved_git_review,
      final:lock?.final,accepted_at:lock?.accepted_at
    }),
    width:Number(final.width||source.width||0),
    height:Number(final.height||source.height||0),
    bytes:Number(final.bytes||source.bytes||0),
    review_timestamp:review?.reviewed_at||null,
    persistence_timestamp:source.persisted_at||source.normalized_at||attempt?.generated_at||null,
    transport_receipt:source.transport_receipt||null,
    checks:{
      identity,
      expected_execution:!expected.execution_id||lock?.execution_id===expected.execution_id,
      expected_edition:!expected.edition_id||lock?.edition_id===expected.edition_id,
      expected_candidate:!expected.candidate_id||lock?.candidate_id===expected.candidate_id,
      immutable_lock:lock?.schema_version==='image-acceptance-lock-v1'&&lock?.accepted_locked===true&&lock?.immutable===true,
      attempt_accepted:attempt?.disposition==='ACCEPTED_LOCKED'||attempt?.status==='accepted_locked',
      saved_git_reviewed:review?.accepted_locked===true&&review?.result==='PASS',
      final_path_bound:source.path===final.path&&saved.path===final.path,
      final_sha_bound:source.sha256===final.sha256&&saved.sha256===final.sha256,
      final_blob_bound:source.git_blob_sha===final.git_blob_sha&&saved.git_blob_sha===final.git_blob_sha,
      exact_readback:String(source.exact_readback||saved.exact_readback||(source.read_back_verified===true?'PASS_READBACK_VERIFIED':'')).startsWith('PASS'),
      quality_gate:lock?.quality_gate==='PASS',
      visible_text_gate:lock?.visible_text_guard==='PASS',
      review_not_stale:stamp(review?.reviewed_at)&&(!stamp(source.normalized_at)&&!stamp(source.persisted_at)&&!stamp(attempt?.generated_at)||
        Date.parse(review.reviewed_at)>=Date.parse(source.persisted_at||source.normalized_at||attempt.generated_at)),
      professional_quality:review?.visual_review?.professional_quality===true,
      story_specific:review?.visual_review?.story_specific===true,
      detailed:review?.visual_review?.detailed===true,
      legibility:review?.visual_review?.legibility==='PASS',
      no_people:review?.visual_review?.no_people_or_humanoids===true,
      no_artifacts:review?.visual_review?.artifacts_or_corruption===false,
      no_context_contamination:review?.visual_review?.context_contamination===false,
      low_quality_fallback_prohibited:source.low_quality_fallback!==true,
      svg_fallback_prohibited:source.svg_fallback!==true,
      normalization_same_visual:mode!=='normalization'||source.same_visual===true,
      protected_transport_bound:mode!=='protected_exact_byte_transport'||nonempty(source.transport_receipt),
      stable_readback_bound:mode!=='stable_exact_persistence'||source.read_back_verified===true
    }
  };
  return normalized;
}

export function validateNormalizedAcceptedImageEvidence(normalized={}){
  const errors=[];
  if(normalized.schema_version!==IMAGE_PERSISTENCE_REGISTRY_VERSION)errors.push('accepted_image_adapter_schema');
  if(!IMAGE_PERSISTENCE_MODES.includes(normalized.persistence_mode))errors.push('accepted_image_persistence_mode');
  if(!normalized.execution_id||!normalized.edition_id||!normalized.candidate_id)errors.push('accepted_image_identity');
  if(!nonempty(normalized.path)||!sha256(normalized.sha256)||!blob(normalized.git_blob_sha))errors.push('accepted_image_exact_bytes_identity');
  if(!/^sha256:[a-f0-9]{64}$/.test(normalized.lock_identity||''))errors.push('accepted_image_lock_identity');
  if(!Number.isFinite(normalized.width)||normalized.width<=0||!Number.isFinite(normalized.height)||normalized.height<=0)errors.push('accepted_image_dimensions');
  for(const [key,value] of Object.entries(normalized.checks||{}))if(value!==true)errors.push('accepted_image_check:'+key);
  return [...new Set(errors)];
}

export function assertNormalizedAcceptedImageEvidence(input){
  const n=normalizeAcceptedImageEvidence(input),errors=validateNormalizedAcceptedImageEvidence(n);
  if(errors.length)throw Error('accepted_image_adapter_failed:'+errors.join(','));
  return n;
}

export function buildPersistenceCompatibilityMatrix(fixtures={}){
  const rows={};
  for(const mode of IMAGE_PERSISTENCE_MODES){
    try{
      const fixture=fixtures[mode];
      if(!fixture)throw Error('fixture_missing');
      const n=assertNormalizedAcceptedImageEvidence(fixture);
      rows[mode]={
        identity:'PASS',exact_bytes:'PASS',saved_git_review:'PASS',quality_evidence:'PASS',task17:'PASS',
        normalized_digest:'sha256:'+hash(n)
      };
    }catch(error){
      rows[mode]={identity:'FAIL',exact_bytes:'FAIL',saved_git_review:'FAIL',quality_evidence:'FAIL',task17:'FAIL',error:error.message};
    }
  }
  const result=Object.values(rows).every(r=>r.task17==='PASS')?'PASS':'FAIL';
  return {schema_version:IMAGE_PERSISTENCE_MATRIX_VERSION,registry_version:IMAGE_PERSISTENCE_REGISTRY_VERSION,result,rows};
}

export function validatePersistenceCompatibilityMatrix(matrix={}){
  const errors=[];
  if(matrix.schema_version!==IMAGE_PERSISTENCE_MATRIX_VERSION)errors.push('persistence_matrix_schema');
  if(matrix.registry_version!==IMAGE_PERSISTENCE_REGISTRY_VERSION)errors.push('persistence_matrix_registry_version');
  for(const mode of IMAGE_PERSISTENCE_MODES){
    const row=matrix.rows?.[mode];
    if(!row)errors.push('persistence_matrix_mode_missing:'+mode);
    else for(const key of ['identity','exact_bytes','saved_git_review','quality_evidence','task17'])
      if(row[key]!=='PASS')errors.push('persistence_matrix_fail:'+mode+':'+key);
  }
  if(matrix.result!==(errors.length?'FAIL':'PASS'))errors.push('persistence_matrix_result_mismatch');
  return [...new Set(errors)];
}
