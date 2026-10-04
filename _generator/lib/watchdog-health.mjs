import {createHash} from 'node:crypto';

export const WATCHDOG_HEALTH_VERSION='watchdog-health-v1';
export const WATCHDOG_HEALTH_DEFAULT_MAX_AGE_MS=12*60*1000;
export const WATCHDOG_HEALTH_PATH_PATTERN='_records/edition-execution/watchdog-health/<execution-id>.json';

const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const taskId=value=>value===null||value===undefined||value===''?null:String(value).padStart(2,'0');

function normalizedFault(classification,explicit=null){
  if(explicit)return String(explicit);
  const state=classification?.state||classification||'AMBIGUOUS';
  if(['HEALTHY_ACTIVE','TERMINAL','RECOVERY_OWNER_PROGRESSING'].includes(state))return null;
  if(state==='READY_IDLE')return 'ACTIONABLE_READY_IDLE';
  if(state==='STALE_ACTIVE')return 'STALE_ACTIVE';
  if(state==='BLOCKED_ACTIONABLE')return 'BLOCKED_ACTIONABLE';
  if(state==='BLOCKED_EXTERNAL')return 'BLOCKED_EXTERNAL';
  return 'AMBIGUOUS_HEALTH_STATE';
}

export function buildWatchdogHealthRecord({
  observed_at=new Date().toISOString(),active=false,terminal=false,
  edition_id=null,execution_id=null,execution_key=null,branch=null,
  first_incomplete_task=null,first_incomplete_task_state=null,
  last_substantive_progress_at=null,live_executor_state='Unknown',
  queued_authoritative_request_key=null,watchdog_recovery_owner=null,
  watchdog_recovery_owner_progressing=false,protected_repair_stage=null,
  classification=null,normalized_fault_code=null,evidence_refs=[]
}={}){
  if(!stamp(observed_at))throw Error('valid_watchdog_health_clock_required');
  if(active===true&&terminal===true)throw Error('watchdog_health_active_terminal_contradiction');
  if(active===true&&(!edition_id||!execution_id||!execution_key||!branch))
    throw Error('watchdog_health_active_identity_required');
  if(last_substantive_progress_at!==null&&!stamp(last_substantive_progress_at))
    throw Error('watchdog_health_last_progress_invalid');
  if(!Array.isArray(evidence_refs))throw Error('watchdog_health_evidence_refs_array_required');
  const state=terminal===true?'TERMINAL':
    watchdog_recovery_owner_progressing===true?'RECOVERY_OWNER_PROGRESSING':
    classification?.state||classification||'AMBIGUOUS';
  const fault=normalizedFault(state,normalized_fault_code);
  const escalation=!['HEALTHY_ACTIVE','TERMINAL','RECOVERY_OWNER_PROGRESSING'].includes(state);
  const refs=[...new Set(evidence_refs.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))].sort();
  return {
    schema_version:WATCHDOG_HEALTH_VERSION,
    observed_at,active:active===true,terminal:terminal===true,
    edition_id,execution_id,execution_key,branch,
    first_incomplete_task:taskId(first_incomplete_task),
    first_incomplete_task_state:first_incomplete_task_state||null,
    last_substantive_progress_at,
    live_executor_state:live_executor_state||'Unknown',
    queued_authoritative_request_key:queued_authoritative_request_key||null,
    watchdog_recovery_owner:watchdog_recovery_owner||null,
    watchdog_recovery_owner_progressing:watchdog_recovery_owner_progressing===true,
    protected_repair_stage:protected_repair_stage||null,
    health_state:state,
    normalized_fault_code:fault,
    escalation_required:escalation,
    evidence_refs:refs,
    evidence_digest:'sha256:'+digest(refs)
  };
}

export function validateWatchdogHealthRecord(record={}){
  const errors=[];
  if(record.schema_version!==WATCHDOG_HEALTH_VERSION)errors.push('watchdog_health_schema_version');
  if(!stamp(record.observed_at))errors.push('watchdog_health_observed_at');
  if(record.active===true&&record.terminal===true)errors.push('watchdog_health_active_terminal_contradiction');
  if(record.active===true){
    for(const key of ['edition_id','execution_id','execution_key','branch'])
      if(typeof record[key]!=='string'||!record[key])errors.push('watchdog_health_identity:'+key);
  }
  if(record.last_substantive_progress_at!==null&&record.last_substantive_progress_at!==undefined&&!stamp(record.last_substantive_progress_at))
    errors.push('watchdog_health_last_progress');
  if(!Array.isArray(record.evidence_refs))errors.push('watchdog_health_evidence_refs');
  if(typeof record.health_state!=='string'||!record.health_state)errors.push('watchdog_health_state');
  if(typeof record.escalation_required!=='boolean')errors.push('watchdog_health_escalation_flag');
  if(record.health_state==='HEALTHY_ACTIVE'&&record.escalation_required!==false)errors.push('watchdog_health_false_healthy_contract');
  if(['STALE_ACTIVE','BLOCKED_ACTIONABLE','READY_IDLE','AMBIGUOUS'].includes(record.health_state)&&record.escalation_required!==true)
    errors.push('watchdog_health_actionable_must_escalate');
  return [...new Set(errors)];
}

export function watchdogFastPathDecision(record,{now=new Date().toISOString(),max_age_ms=WATCHDOG_HEALTH_DEFAULT_MAX_AGE_MS,expected_execution_id=null}={}){
  if(!stamp(now)||!Number.isInteger(max_age_ms)||max_age_ms<60_000)throw Error('valid_watchdog_fast_path_clock_required');
  if(!record)return {action:'EXPAND_RECOVERY',reason:'compact_health_missing',counter_bucket:'escalated',compact_only:false};
  const errors=validateWatchdogHealthRecord(record);
  if(errors.length)return {action:'EXPAND_RECOVERY',reason:'compact_health_invalid',errors,counter_bucket:'escalated',compact_only:false};
  const age_ms=Math.max(0,Date.parse(now)-Date.parse(record.observed_at));
  if(expected_execution_id&&record.execution_id!==expected_execution_id)
    return {action:'EXPAND_RECOVERY',reason:'compact_health_execution_mismatch',age_ms,counter_bucket:'escalated',compact_only:false};
  if(record.terminal===true||record.health_state==='TERMINAL')
    return {action:'EXIT_SILENT',reason:'terminal_compact_health',age_ms,counter_bucket:'healthy_noop',compact_only:true};
  if(age_ms>max_age_ms)return {action:'EXPAND_RECOVERY',reason:'compact_health_stale',age_ms,counter_bucket:'escalated',compact_only:false};
  if(record.watchdog_recovery_owner_progressing===true||record.health_state==='RECOVERY_OWNER_PROGRESSING')
    return {action:'EXIT_SILENT',reason:'valid_recovery_owner_progressing',age_ms,counter_bucket:'healthy_noop',compact_only:true};
  if(record.active===true&&record.health_state==='HEALTHY_ACTIVE'&&record.escalation_required===false)
    return {action:'EXIT_SILENT',reason:'healthy_active_compact_health',age_ms,counter_bucket:'healthy_noop',compact_only:true};
  return {action:'EXPAND_RECOVERY',reason:record.normalized_fault_code||'compact_health_actionable_or_ambiguous',age_ms,counter_bucket:'escalated',compact_only:false};
}

export function updateWatchdogFastPathCounters(counters={},decision={}){
  const next={
    healthy_noop:Number(counters.healthy_noop||0),
    escalated:Number(counters.escalated||0),
    total:Number(counters.total||0)
  };
  if(decision.counter_bucket==='healthy_noop')next.healthy_noop+=1;
  else if(decision.counter_bucket==='escalated')next.escalated+=1;
  else throw Error('watchdog_fast_path_counter_bucket_required');
  next.total+=1;
  return next;
}
