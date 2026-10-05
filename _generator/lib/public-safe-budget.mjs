export const PUBLIC_SAFE_BUDGET_VERSION='daily-brief-public-safe-budget-v1';
export const PUBLIC_SAFE_BUDGET_COUNTERS=Object.freeze([
  'watchdog_invocations','watchdog_compact_exits','watchdog_expanded_reads','watchdog_actionable_recoveries',
  'semantic_editorial_passes','semantic_repair_passes','research_task_invocations','repository_task_invocations',
  'image_generation_attempts','image_execution_preflight_failures','accepted_images','protected_repair_cycles',
  'publication_ci_runs','publication_preflight_failures','unchanged_health_commits','substantive_progress_events',
  'control_plane_events','run_wall_seconds'
]);
const PRIVATE_KEY_RE=/(weekly[_-]?usage|percent[_-]?remaining|account[_-]?(balance|allowance)|platform[_-]?(credit|token)|billing|private[_-]?usage)/i;
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const id=value=>typeof value==='string'&&value.trim().length>0;

function privateKeys(value,prefix=''){
  const found=[];
  if(!value||typeof value!=='object')return found;
  for(const [key,child] of Object.entries(value)){
    const full=prefix?prefix+'.'+key:key;
    if(PRIVATE_KEY_RE.test(key))found.push(full);
    if(child&&typeof child==='object')found.push(...privateKeys(child,full));
  }
  return found;
}

export function evaluatePublicSafeBudget(record={}){
  const c=record.counters||{},reasons=[];
  const push=(level,reason)=>reasons.push({level,reason});
  if(Number(c.semantic_editorial_passes||0)>1)push('RED','semantic_editorial_passes_above_normal_one_pass_envelope');
  if(Number(c.unchanged_health_commits||0)>0)push('RED','unchanged_health_commit_detected');
  if(Number(c.image_generation_attempts||0)>Math.max(6,Number(c.accepted_images||0)+1))
    push('RED','image_attempts_materially_above_clean_run_envelope');
  if(Number(c.protected_repair_cycles||0)>=2)push('AMBER','multiple_protected_repair_cycles');
  if(Number(c.publication_ci_runs||0)>1)push('AMBER','publication_ci_confirmation_loop_detected');
  if(Number(c.publication_preflight_failures||0)>0)push('AMBER','publication_preflight_caught_defect_before_pr');
  const watchdogs=Number(c.watchdog_invocations||0),expanded=Number(c.watchdog_expanded_reads||0);
  if(watchdogs>=6&&expanded/watchdogs>0.6)push('RED','watchdog_expanded_read_ratio_high');
  else if(watchdogs>=6&&expanded/watchdogs>0.35)push('AMBER','watchdog_expanded_read_ratio_above_clean_run_expectation');
  const control=Number(c.control_plane_events||0),substantive=Number(c.substantive_progress_events||0);
  if(control>20&&control>Math.max(1,substantive)*4)push('RED','control_plane_events_materially_outnumber_progress');
  const level=reasons.some(x=>x.level==='RED')?'RED':reasons.some(x=>x.level==='AMBER')?'AMBER':'GREEN';
  return {level,reasons};
}

export function newPublicSafeBudget({
  execution_id,edition_id,execution_key,started_at=new Date().toISOString()
}={}){
  if(!id(execution_id)||!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id||'')||!id(execution_key)||!stamp(started_at))
    throw Error('public_safe_budget_identity_required');
  const counters=Object.fromEntries(PUBLIC_SAFE_BUDGET_COUNTERS.map(key=>[key,0]));
  const evaluation=evaluatePublicSafeBudget({counters});
  return {
    schema_version:PUBLIC_SAFE_BUDGET_VERSION,
    execution_id,edition_id,execution_key,started_at,updated_at:started_at,
    private_usage_fields_prohibited:true,
    owner_observed_weekly_usage_storage:'outside_public_git_only',
    counters,budget_level:evaluation.level,budget_alerts:evaluation.reasons
  };
}

export function applyPublicSafeBudgetDelta(record,deltas={},updated_at=new Date().toISOString()){
  const errors=validatePublicSafeBudget(record);
  if(errors.length)throw Error(errors.join('; '));
  if(!stamp(updated_at))throw Error('public_safe_budget_clock_required');
  const counters={...record.counters};
  for(const [key,value] of Object.entries(deltas)){
    if(!PUBLIC_SAFE_BUDGET_COUNTERS.includes(key))throw Error('unsupported_public_safe_budget_counter:'+key);
    if(!Number.isInteger(value)||value<0)throw Error('public_safe_budget_delta_nonnegative_integer_required:'+key);
    counters[key]+=value;
  }
  const evaluation=evaluatePublicSafeBudget({counters});
  return {...record,counters,updated_at,budget_level:evaluation.level,budget_alerts:evaluation.reasons};
}

export function setPublicSafeRunWallSeconds(record,seconds,updated_at=new Date().toISOString()){
  const errors=validatePublicSafeBudget(record);
  if(errors.length)throw Error(errors.join('; '));
  if(!Number.isInteger(seconds)||seconds<0)throw Error('public_safe_budget_wall_seconds_required');
  const counters={...record.counters,run_wall_seconds:seconds};
  const evaluation=evaluatePublicSafeBudget({counters});
  return {...record,counters,updated_at,budget_level:evaluation.level,budget_alerts:evaluation.reasons};
}

export function validatePublicSafeBudget(record={}){
  const errors=[];
  if(record.schema_version!==PUBLIC_SAFE_BUDGET_VERSION)errors.push('public_safe_budget_schema');
  if(!id(record.execution_id)||!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(record.edition_id||'')||!id(record.execution_key))
    errors.push('public_safe_budget_identity');
  if(!stamp(record.started_at)||!stamp(record.updated_at))errors.push('public_safe_budget_clock');
  if(record.private_usage_fields_prohibited!==true||record.owner_observed_weekly_usage_storage!=='outside_public_git_only')
    errors.push('public_safe_budget_privacy_contract');
  const forbidden=privateKeys(record);
  if(forbidden.length)errors.push(...forbidden.map(key=>'private_usage_field_prohibited:'+key));
  if(!record.counters||typeof record.counters!=='object')errors.push('public_safe_budget_counters');
  else{
    for(const key of PUBLIC_SAFE_BUDGET_COUNTERS){
      if(!Number.isInteger(record.counters[key])||record.counters[key]<0)errors.push('public_safe_budget_counter:'+key);
    }
    for(const key of Object.keys(record.counters))if(!PUBLIC_SAFE_BUDGET_COUNTERS.includes(key))errors.push('unknown_public_safe_budget_counter:'+key);
  }
  const evaluation=evaluatePublicSafeBudget(record);
  if(record.budget_level!==evaluation.level||JSON.stringify(record.budget_alerts)!==JSON.stringify(evaluation.reasons))
    errors.push('public_safe_budget_evaluation_mismatch');
  return [...new Set(errors)];
}
