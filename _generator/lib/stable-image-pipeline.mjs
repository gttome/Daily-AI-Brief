import {createHash} from 'node:crypto';

export const STABLE_IMAGE_PIPELINE_VERSION='stable-image-pipeline-v1';
export const STABLE_IMAGE_OPERATION_STATES=Object.freeze([
  'QUEUED','ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED',
  'READBACK_VERIFIED','REVIEWING','ACCEPTED_LOCKED','REJECTED_QUALITY',
  'BLOCKED_INFRASTRUCTURE','DONE'
]);

const allowed=Object.freeze({
  QUEUED:['ADMISSION_CHECK'],
  ADMISSION_CHECK:['ADMITTED','BLOCKED_INFRASTRUCTURE'],
  ADMITTED:['GENERATING','BLOCKED_INFRASTRUCTURE'],
  GENERATING:['BYTES_RECEIVED','BLOCKED_INFRASTRUCTURE'],
  BYTES_RECEIVED:['PERSISTED','BLOCKED_INFRASTRUCTURE'],
  PERSISTED:['READBACK_VERIFIED','BLOCKED_INFRASTRUCTURE'],
  READBACK_VERIFIED:['REVIEWING','BLOCKED_INFRASTRUCTURE'],
  REVIEWING:['ACCEPTED_LOCKED','REJECTED_QUALITY','BLOCKED_INFRASTRUCTURE'],
  ACCEPTED_LOCKED:['DONE'],
  REJECTED_QUALITY:['GENERATING','BLOCKED_INFRASTRUCTURE'],
  BLOCKED_INFRASTRUCTURE:[
    'ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED',
    'READBACK_VERIFIED','REVIEWING','ACCEPTED_LOCKED','DONE'
  ],
  DONE:[]
});
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const sha=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const task=v=>String(v??'').padStart(2,'0');

export function createStableImageOperation({
  execution_id,edition_id,task_id,candidate_id,request_key,created_at=new Date().toISOString()
}={}){
  const id=task(task_id);
  if(!execution_id||!edition_id||!/^1[1-6]$/.test(id)||!candidate_id||!request_key||!stamp(created_at))
    throw Error('stable_image_operation_identity_required');
  return {
    schema_version:STABLE_IMAGE_PIPELINE_VERSION,
    execution_id,edition_id,task_id:id,candidate_id,request_key,
    state:'QUEUED',generation_attempts:0,infrastructure_failures:0,quality_rejections:0,
    accepted_locked:false,wake_pr_required:false,owner_intervention_required:false,
    created_at,updated_at:created_at,history:[{state:'QUEUED',at:created_at}]
  };
}

export function transitionStableImageOperation(operation,next,{at=new Date().toISOString(),evidence=null}={}){
  if(operation?.schema_version!==STABLE_IMAGE_PIPELINE_VERSION)throw Error('stable_image_operation_required');
  if(!STABLE_IMAGE_OPERATION_STATES.includes(next)||!allowed[operation.state]?.includes(next))
    throw Error('illegal_stable_image_transition:'+operation.state+'->'+next);
  if(!stamp(at))throw Error('stable_image_transition_timestamp_required');
  let generation_attempts=operation.generation_attempts;
  let infrastructure_failures=operation.infrastructure_failures;
  let quality_rejections=operation.quality_rejections;
  if(next==='GENERATING'&&operation.state!=='BLOCKED_INFRASTRUCTURE')generation_attempts++;
  if(next==='BLOCKED_INFRASTRUCTURE')infrastructure_failures++;
  if(next==='REJECTED_QUALITY')quality_rejections++;
  if(generation_attempts>4)throw Error('stable_image_generation_attempt_budget_exceeded');
  const accepted_locked=next==='ACCEPTED_LOCKED'||next==='DONE'?true:operation.accepted_locked;
  return {
    ...operation,state:next,generation_attempts,infrastructure_failures,quality_rejections,
    accepted_locked,updated_at:at,
    history:[...operation.history,{state:next,at,...(evidence?{evidence}: {})}]
  };
}

export function stableImageStateFromResult(result={}){
  if(result.status==='accepted_locked')return 'DONE';
  if(result.status==='fixture_pass')return 'DONE';
  if(result.quality_rejected===true||result.blocker==='IMAGE_QUALITY_REJECTED')return 'REJECTED_QUALITY';
  if(String(result.status||'').startsWith('IMAGE_EXECUTION_ADMISSION_BLOCKED'))return 'ADMISSION_CHECK';
  if(String(result.status||'').startsWith('CAPABILITY_BLOCKED'))return 'BLOCKED_INFRASTRUCTURE';
  if(result.blocker)return 'BLOCKED_INFRASTRUCTURE';
  if(result.persistence?.read_back_verified===true&&result.review)return 'ACCEPTED_LOCKED';
  if(result.review)return 'REVIEWING';
  if(result.persistence?.read_back_verified===true)return 'READBACK_VERIFIED';
  if(result.persistence)return 'PERSISTED';
  if(result.generation?.raw_sha256)return 'BYTES_RECEIVED';
  return 'BLOCKED_INFRASTRUCTURE';
}

export function buildAcceptedImageTaskTransition({
  execution_id,edition_id,task_id,request_key,candidate_id,result,writer_generation=1,at=null
}={}){
  const id=task(task_id);
  if(!execution_id||!edition_id||!/^1[1-6]$/.test(id)||!request_key||!candidate_id||
     !['accepted_locked','fixture_pass'].includes(result?.status))
    throw Error('accepted_image_transition_identity_required');
  const persistence=result.persistence||result.native_capture||{};
  const assetSha=persistence.sha256||result.final?.sha256;
  const path=persistence.path||result.final?.path;
  if(!/^[a-f0-9]{64}$/.test(assetSha||'')||!path)throw Error('accepted_image_saved_asset_required');
  const timestamp=at||result.review?.reviewed_at||persistence.persisted_at||result.generated_at;
  if(!stamp(timestamp)||!Number.isInteger(writer_generation)||writer_generation<1)
    throw Error('accepted_image_transition_timestamp_or_generation_invalid');
  const key=sha(JSON.stringify({execution_id,edition_id,id,request_key,candidate_id,assetSha,path}));
  return {
    schema_version:'stable-image-task-transition-v1',
    task_id:id,from:'Active',to:'Done',at:timestamp,
    event_type:'IMAGE_ACCEPTED_LOCKED',
    execution_id,edition_id,request_key,candidate_id,
    writer_generation,
    accepted_locked:true,saved_asset:{path,sha256:assetSha,git_blob_sha:persistence.git_blob_sha||result.final?.git_blob_sha||null},
    image_transition_key:key,
    wake_pr_required:false,owner_liveness_prompt_required:false
  };
}

export async function emitAcceptedImageTaskTransition(args,{eventSink,requireSink=false}={}){
  const event=buildAcceptedImageTaskTransition(args);
  if(typeof eventSink!=='function'){
    if(requireSink)throw Error('stable_image_transition_sink_required');
    return {event,emitted:false};
  }
  await eventSink(event);
  return {event,emitted:true};
}

export function stableImagePipelineMetrics(results=[]){
  return {
    schema_version:'stable-image-pipeline-metrics-v1',
    accepted_images:results.filter(x=>x?.status==='accepted_locked').length,
    image_generation_attempts:results.reduce((n,x)=>n+Number(x?.pipeline?.generation_attempts||x?.attempt||0),0),
    image_infrastructure_failures:results.reduce((n,x)=>n+Number(x?.pipeline?.infrastructure_failures||0),0),
    image_regenerations:results.reduce((n,x)=>n+Math.max(0,Number(x?.pipeline?.generation_attempts||x?.attempt||0)-1),0),
    wake_prs:0,owner_liveness_prompts:0
  };
}
