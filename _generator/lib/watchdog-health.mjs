import {createHash} from 'node:crypto';

export const WATCHDOG_HEALTH_VERSION='chatgpt-watchdog-health-v1';
export const WATCHDOG_HEALTH_DEFAULT_MAX_AGE_MS=12*60*1000;
export const WATCHDOG_HEALTH_PATH_PATTERN='_records/edition-execution/health/<execution-id>.json';
export const WATCHDOG_HEALTH_RUNTIME_PATH='data/operations/watchdog-health.json';

const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const taskId=value=>value===null||value===undefined||value===''?null:String(value).padStart(2,'0');
const text=value=>typeof value==='string'&&value.trim()?value.trim():null;

function normalizedFault(classification,explicit=null){
  if(explicit)return String(explicit);
  const state=classification?.state||classification||'AMBIGUOUS';
  if(['HEALTHY_ACTIVE','TERMINAL','NO_ACTIVE_EXECUTION','RECOVERY_OWNER_PROGRESSING'].includes(state))return null;
  if(state==='READY_IDLE')return 'READY_IDLE';
  if(state==='STALE_ACTIVE')return 'STALE_ACTIVE';
  if(state==='BLOCKED_ACTIONABLE')return 'BLOCKED_ACTIONABLE';
  if(state==='BLOCKED_EXTERNAL')return 'BLOCKED_EXTERNAL';
  return 'AMBIGUOUS_HEALTH_STATE';
}

function materialState(record={}){
  return {
    schema_version:WATCHDOG_HEALTH_VERSION,
    active:record.active===true,
    terminal:record.terminal===true,
    edition_id:record.edition_id||null,
    execution_id:record.execution_id||null,
    execution_key:record.execution_key||null,
    branch:record.branch||null,
    first_incomplete_task:taskId(record.first_incomplete_task),
    task_state:record.task_state||record.first_incomplete_task_state||null,
    capability:record.capability||null,
    request_key:record.request_key||record.queued_authoritative_request_key||null,
    request_status:record.request_status||null,
    writer_owner:record.writer_owner||null,
    writer_generation:Number.isInteger(record.writer_generation)?record.writer_generation:null,
    writer_expires_at:record.writer_expires_at||null,
    watchdog_owner:record.watchdog_owner||record.watchdog_recovery_owner||null,
    watchdog_expires_at:record.watchdog_expires_at||null,
    last_substantive_progress_at:record.last_substantive_progress_at||null,
    last_substantive_progress_type:record.last_substantive_progress_type||null,
    executor_active:record.executor_active===true,
    executor_progressing:record.executor_progressing===true,
    watchdog_recovery_owner_progressing:record.watchdog_recovery_owner_progressing===true,
    protected_repair_stage:record.protected_repair_stage||null,
    health_state:record.health_state||null,
    actionable:record.actionable===true,
    reason_code:record.reason_code||record.normalized_fault_code||null,
    next_legal_action:record.next_legal_action||null,
    accepted_locked_images:Number.isInteger(record.accepted_locked_images)?record.accepted_locked_images:0,
    watchdog_ring_healthy:record.watchdog_ring_healthy!==false,
    watchdog_ring_enabled_count:Number.isInteger(record.watchdog_ring_enabled_count)?record.watchdog_ring_enabled_count:null,
    watchdog_ring_fault_code:record.watchdog_ring_fault_code||null,
    evidence_refs:Array.isArray(record.evidence_refs)?[...new Set(record.evidence_refs)].sort():[]
  };
}

export function watchdogHealthSourceDigest(record={}){
  return 'sha256:'+digest(materialState(record));
}

export function materiallySameWatchdogHealth(a,b){
  return Boolean(a&&b&&a.schema_version===WATCHDOG_HEALTH_VERSION&&b.schema_version===WATCHDOG_HEALTH_VERSION&&
    a.execution_id===b.execution_id&&watchdogHealthSourceDigest(a)===watchdogHealthSourceDigest(b));
}

export function buildWatchdogHealthRecord({
  observed_at=new Date().toISOString(),updated_at=observed_at,active=false,terminal=false,
  edition_id=null,execution_id=null,execution_key=null,branch=null,
  first_incomplete_task=null,first_incomplete_task_state=null,task_state=first_incomplete_task_state,
  capability=null,request_key=null,request_status=null,
  writer_owner=null,writer_generation=null,writer_expires_at=null,
  watchdog_recovery_owner=null,watchdog_owner=watchdog_recovery_owner,watchdog_expires_at=null,
  last_substantive_progress_at=null,last_substantive_progress_type=null,live_executor_state='Unknown',
  executor_active=null,executor_progressing=null,
  queued_authoritative_request_key=null,watchdog_recovery_owner_progressing=false,protected_repair_stage=null,
  classification=null,normalized_fault_code=null,reason_code=normalized_fault_code,next_legal_action=null,
  actionable=null,accepted_locked_images=0,watchdog_ring_healthy=true,watchdog_ring_enabled_count=6,watchdog_ring_fault_code=null,evidence_refs=[]
}={}){
  if(!stamp(observed_at)||!stamp(updated_at))throw Error('valid_watchdog_health_clock_required');
  if(active===true&&terminal===true)throw Error('watchdog_health_active_terminal_contradiction');
  if(active===true&&(!edition_id||!execution_id||!execution_key||!branch))
    throw Error('watchdog_health_active_identity_required');
  if(last_substantive_progress_at!==null&&!stamp(last_substantive_progress_at))
    throw Error('watchdog_health_last_progress_invalid');
  if(writer_expires_at!==null&&!stamp(writer_expires_at))throw Error('watchdog_health_writer_expiry_invalid');
  if(watchdog_expires_at!==null&&!stamp(watchdog_expires_at))throw Error('watchdog_health_watchdog_expiry_invalid');
  if(!Array.isArray(evidence_refs))throw Error('watchdog_health_evidence_refs_array_required');
  if(!Number.isInteger(accepted_locked_images)||accepted_locked_images<0||accepted_locked_images>6)
    throw Error('watchdog_health_accepted_locked_images_invalid');

  const ringDegraded=watchdog_ring_healthy===false;
  const baseState=terminal===true?'TERMINAL':
    active!==true?'NO_ACTIVE_EXECUTION':
    watchdog_recovery_owner_progressing===true?'RECOVERY_OWNER_PROGRESSING':
    classification?.state||classification||'AMBIGUOUS';
  const state=ringDegraded?'BLOCKED_ACTIONABLE':baseState;
  const fault=ringDegraded?'WATCHDOG_RING_DEGRADED':normalizedFault(state,reason_code||normalized_fault_code);
  const hasRequest=Boolean(request_key||queued_authoritative_request_key);
  const isActionable=ringDegraded?true:(actionable===null
    ? ['STALE_ACTIVE','BLOCKED_ACTIONABLE'].includes(state)||(state==='READY_IDLE'&&hasRequest)
    : actionable===true);
  const refs=[...new Set(evidence_refs.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))].sort();
  const executorState=text(live_executor_state)||'Unknown';
  const record={
    schema_version:WATCHDOG_HEALTH_VERSION,
    observed_at,updated_at,active:active===true,terminal:terminal===true,
    edition_id,execution_id,execution_key,branch,
    first_incomplete_task:taskId(first_incomplete_task),
    task_state:task_state||first_incomplete_task_state||null,
    first_incomplete_task_state:task_state||first_incomplete_task_state||null,
    capability:text(capability),
    request_key:text(request_key)||text(queued_authoritative_request_key),
    request_status:text(request_status),
    queued_authoritative_request_key:text(request_key)||text(queued_authoritative_request_key),
    writer_owner:text(writer_owner),
    writer_generation:Number.isInteger(writer_generation)?writer_generation:null,
    writer_expires_at,
    watchdog_owner:text(watchdog_owner)||text(watchdog_recovery_owner),
    watchdog_recovery_owner:text(watchdog_owner)||text(watchdog_recovery_owner),
    watchdog_expires_at,
    last_substantive_progress_at,
    last_substantive_progress_type:text(last_substantive_progress_type),
    live_executor_state:executorState,
    executor_active:executor_active===null?['Running','Recovering','Claimed'].includes(executorState):executor_active===true,
    executor_progressing:executor_progressing===null?state==='HEALTHY_ACTIVE':executor_progressing===true,
    watchdog_recovery_owner_progressing:watchdog_recovery_owner_progressing===true,
    protected_repair_stage:protected_repair_stage||null,
    health_state:state,
    actionable:isActionable,
    reason_code:fault,
    normalized_fault_code:fault,
    next_legal_action:isActionable?(ringDegraded?'RESTORE_WATCHDOG_RING_MEMBERSHIP':(next_legal_action||'NARROW_RECOVERY_REQUIRED')):null,
    accepted_locked_images,
    watchdog_ring_healthy:!ringDegraded,
    watchdog_ring_enabled_count:Number.isInteger(watchdog_ring_enabled_count)?watchdog_ring_enabled_count:null,
    watchdog_ring_fault_code:ringDegraded?'WATCHDOG_RING_DEGRADED':watchdog_ring_fault_code,
    evidence_refs:refs,
    evidence_digest:'sha256:'+digest(refs)
  };
  return {...record,source_digest:watchdogHealthSourceDigest(record)};
}

export function validateWatchdogHealthRecord(record={}){
  const errors=[];
  if(record.schema_version!==WATCHDOG_HEALTH_VERSION)errors.push('watchdog_health_schema_version');
  if(!stamp(record.observed_at)||!stamp(record.updated_at))errors.push('watchdog_health_observed_at');
  if(record.active===true&&record.terminal===true)errors.push('watchdog_health_active_terminal_contradiction');
  if(record.active===true){
    for(const key of ['edition_id','execution_id','execution_key','branch'])
      if(typeof record[key]!=='string'||!record[key])errors.push('watchdog_health_identity:'+key);
  }
  if(record.last_substantive_progress_at!==null&&record.last_substantive_progress_at!==undefined&&!stamp(record.last_substantive_progress_at))
    errors.push('watchdog_health_last_progress');
  if(record.writer_expires_at!==null&&record.writer_expires_at!==undefined&&!stamp(record.writer_expires_at))errors.push('watchdog_health_writer_expiry');
  if(record.watchdog_expires_at!==null&&record.watchdog_expires_at!==undefined&&!stamp(record.watchdog_expires_at))errors.push('watchdog_health_watchdog_expiry');
  if(!Array.isArray(record.evidence_refs))errors.push('watchdog_health_evidence_refs');
  if(typeof record.health_state!=='string'||!record.health_state)errors.push('watchdog_health_state');
  if(typeof record.actionable!=='boolean')errors.push('watchdog_health_actionable_flag');
  if(!Number.isInteger(record.accepted_locked_images)||record.accepted_locked_images<0||record.accepted_locked_images>6)
    errors.push('watchdog_health_accepted_locked_images');
  if(record.watchdog_ring_healthy===false&&record.watchdog_ring_enabled_count!==null&&record.watchdog_ring_enabled_count!==undefined&&(!Number.isInteger(record.watchdog_ring_enabled_count)||record.watchdog_ring_enabled_count<0||record.watchdog_ring_enabled_count>6))
    errors.push('watchdog_health_ring_enabled_count');
  if(record.source_digest!==watchdogHealthSourceDigest(record))errors.push('watchdog_health_source_digest');
  if(['HEALTHY_ACTIVE','TERMINAL','NO_ACTIVE_EXECUTION','RECOVERY_OWNER_PROGRESSING'].includes(record.health_state)&&record.actionable!==false&&record.watchdog_ring_healthy!==false)
    errors.push('watchdog_health_nonactionable_contract');
  if(['STALE_ACTIVE','BLOCKED_ACTIONABLE'].includes(record.health_state)&&record.actionable!==true)
    errors.push('watchdog_health_actionable_must_escalate');
  if(record.health_state==='READY_IDLE'&&Boolean(record.request_key)!==record.actionable)
    errors.push('watchdog_health_ready_idle_request_actionability');
  return [...new Set(errors)];
}

export function watchdogFastPathDecision(record,{now=new Date().toISOString(),max_age_ms=WATCHDOG_HEALTH_DEFAULT_MAX_AGE_MS,expected_execution_id=null}={}){
  if(!stamp(now)||!Number.isInteger(max_age_ms)||max_age_ms<60_000)throw Error('valid_watchdog_fast_path_clock_required');
  if(!record)return {action:'EXPAND_RECOVERY',reason:'compact_health_missing',counter_bucket:'expanded_read',compact_only:false};
  const errors=validateWatchdogHealthRecord(record);
  if(errors.length)return {action:'EXPAND_RECOVERY',reason:'compact_health_invalid',errors,counter_bucket:'expanded_read',compact_only:false};
  const age_ms=Math.max(0,Date.parse(now)-Date.parse(record.updated_at||record.observed_at));
  if(record.watchdog_ring_healthy===false)
    return {action:'EXPAND_RECOVERY',reason:'degraded_watchdog_ring',age_ms,counter_bucket:'expanded_read',compact_only:false,next_legal_action:'RESTORE_WATCHDOG_RING_MEMBERSHIP'};
  if(expected_execution_id&&record.execution_id!==expected_execution_id)
    return {action:'EXPAND_RECOVERY',reason:'compact_health_execution_mismatch',age_ms,counter_bucket:'expanded_read',compact_only:false};
  if(record.terminal===true||record.health_state==='TERMINAL')
    return {action:'EXIT_SILENT',reason:'terminal_compact_health',age_ms,counter_bucket:'compact_exit',compact_only:true};
  if(record.active!==true||record.health_state==='NO_ACTIVE_EXECUTION')
    return {action:'EXIT_SILENT',reason:'no_active_execution',age_ms,counter_bucket:'compact_exit',compact_only:true};
  if(age_ms>max_age_ms)return {action:'EXPAND_RECOVERY',reason:'compact_health_stale',age_ms,counter_bucket:'expanded_read',compact_only:false};
  if(record.watchdog_recovery_owner_progressing===true||record.health_state==='RECOVERY_OWNER_PROGRESSING')
    return {action:'EXIT_SILENT',reason:'valid_recovery_owner_progressing',age_ms,counter_bucket:'compact_exit',compact_only:true};
  if(record.health_state==='HEALTHY_ACTIVE'&&record.actionable===false)
    return {action:'EXIT_SILENT',reason:'healthy_active_compact_health',age_ms,counter_bucket:'compact_exit',compact_only:true};
  if(record.health_state==='READY_IDLE'&&record.actionable===false)
    return {action:'EXIT_SILENT',reason:'legitimate_ready_idle',age_ms,counter_bucket:'compact_exit',compact_only:true};
  return {action:'EXPAND_RECOVERY',reason:record.reason_code||'compact_health_actionable_or_ambiguous',age_ms,counter_bucket:'expanded_read',compact_only:false};
}

export function updateWatchdogFastPathCounters(counters={},decision={}){
  const next={
    watchdog_invocations:Number(counters.watchdog_invocations||counters.total||0),
    watchdog_compact_exits:Number(counters.watchdog_compact_exits||counters.healthy_noop||0),
    watchdog_expanded_reads:Number(counters.watchdog_expanded_reads||counters.escalated||0)
  };
  if(decision.counter_bucket==='compact_exit')next.watchdog_compact_exits+=1;
  else if(decision.counter_bucket==='expanded_read')next.watchdog_expanded_reads+=1;
  else throw Error('watchdog_fast_path_counter_bucket_required');
  next.watchdog_invocations+=1;
  return next;
}
