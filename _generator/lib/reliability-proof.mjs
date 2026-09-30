import {validateLifecycleShape} from './publication-lifecycle.mjs';

export const WAVE5_PROOF_SCHEMA_VERSION='1.0.0';
export const WAVE5_QUALIFICATION_WINDOW_ID='wave5-post-iteration4-2026-09-25';
export const WAVE5_FIRST_QUALIFYING_EDITION='2026-09-26';
export const WAVE5_MINIMUM_CONSECUTIVE=5;
export const WAVE5_STRONGER_TARGET=7;
const UNKNOWN='unavailable';
const PENDING='pending';
const NEGATIVE_KPIS=Object.freeze([
  'manual_repository_repair','full_pipeline_restart','duplicate_publication_pr','live_reader_mismatch',
  'missing_completion_record','command_center_parity_mismatch','valid_stage_reexecuted_unnecessarily',
  'image_fallback_downgrade','unexplained_state_transition'
]);
const EXPECTED_HISTORY=Object.freeze([
  'PLANNED','PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED',
  'PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED'
]);
const boolOr=value=>typeof value==='boolean'?value:UNKNOWN;
const last=(items,predicate)=>[...(items||[])].reverse().find(predicate)||null;
const asArray=value=>Array.isArray(value)?value:[];
const cleanSha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value)?value:null;
const qualityPathFromObservation=observation=>typeof observation?.image_quality_evidence_path==='string'?observation.image_quality_evidence_path:null;

function lifecycleHistoryErrors(lifecycle){
  const errors=validateLifecycleShape(lifecycle);
  const history=asArray(lifecycle?.history).map(item=>item?.stage).filter(Boolean);
  if(history.includes('FAILED'))errors.push('failed_lifecycle_transition_present');
  if(history.includes('EXPLICITLY_SKIPPED'))errors.push('skipped_lifecycle_transition_present');
  const expected=EXPECTED_HISTORY.slice(0,Math.max(0,EXPECTED_HISTORY.indexOf(lifecycle?.stage)+1));
  if(expected.length&&JSON.stringify(history)!==JSON.stringify(expected))errors.push('lifecycle_history_not_linear_and_explained');
  return [...new Set(errors)];
}

function imageFallbackState(record){
  if(!record||typeof record!=='object')return UNKNOWN;
  if(record.schema_version!=='2.0.0'||record.record_kind!=='editorial_image_quality')return true;
  if(record.review_status!=='complete'||record.set_review?.result!=='pass')return true;
  const images=asArray(record.images);
  if(images.length!==6)return true;
  for(const image of images){
    if(image?.structural_gate?.result!=='pass'||image?.editorial_quality_gate?.result!=='pass'||image?.overall_gate!=='pass')return true;
    if(image?.editorial_quality_gate?.generic_or_sparse!==false||image?.editorial_quality_gate?.decorative_only!==false)return true;
  }
  return false;
}

function actionDuplicateState(runState,type){
  if(!runState||!Array.isArray(runState.consequential_actions))return UNKNOWN;
  const actions=runState.consequential_actions.filter(action=>action?.type===type&&action?.status==='completed');
  if(actions.length===0)return UNKNOWN;
  const identities=new Set(actions.map(action=>String(action.scope||'edition')+'|'+String(action.key||'')));
  return actions.length>1||identities.size>1;
}

function fullRestartState(runState,recoveryEvidence,observation){
  if(typeof observation?.full_pipeline_restart==='boolean')return observation.full_pipeline_restart;
  if(!runState||!Number.isInteger(runState.retry_count))return UNKNOWN;
  if(runState.retry_count===0)return false;
  if(typeof recoveryEvidence?.full_pipeline_restart==='boolean')return recoveryEvidence.full_pipeline_restart;
  return UNKNOWN;
}

function validStageReexecutionState(runState,recoveryEvidence,observation){
  if(typeof observation?.valid_stage_reexecuted_unnecessarily==='boolean')return observation.valid_stage_reexecuted_unnecessarily;
  if(!runState||!Number.isInteger(runState.retry_count))return UNKNOWN;
  if(runState.retry_count===0)return false;
  if(Array.isArray(recoveryEvidence?.reexecuted_valid_stages))return recoveryEvidence.reexecuted_valid_stages.length>0;
  return UNKNOWN;
}

function manualRepairState(lifecycle,observation){
  if(typeof observation?.manual_repository_repair==='boolean')return observation.manual_repository_repair;
  if(!Array.isArray(lifecycle?.repair_pr_numbers))return UNKNOWN;
  return lifecycle.repair_pr_numbers.length>0;
}

function liveMismatchState(lifecycle,completion,status){
  const prod=cleanSha(lifecycle?.production_sha||status?.production_sha),deployed=cleanSha(lifecycle?.deployed_sha||status?.deployed_sha);
  if(prod&&deployed&&prod!==deployed)return true;
  if(status?.live_reader?.state==='verified'&&completion?.live_verification?.final_result==='pass'&&completion?.live_verification?.homepage_edition_date===lifecycle?.edition_date&&prod&&deployed&&prod===deployed)return false;
  if(status?.live_reader?.state==='pending')return PENDING;
  return UNKNOWN;
}

function missingCompletionState(lifecycle,completion,status){
  const completed=['COMPLETED','CC_SYNCED'].includes(lifecycle?.stage);
  if(completed&&!completion)return true;
  if(completion?.phase==='live_verified'&&status?.completion?.state==='verified')return false;
  if(completed)return true;
  return PENDING;
}

function commandCenterMismatchState(lifecycle,status){
  if(status?.command_center?.result==='fail'||status?.command_center?.result==='invalid'||status?.command_center?.stale===true)return true;
  if(lifecycle?.stage==='CC_SYNCED'&&lifecycle?.command_center_sync==='complete'&&status?.command_center?.result==='pass'&&status?.command_center?.stale===false)return false;
  if(status?.command_center?.state==='pending'||lifecycle?.command_center_sync==='pending')return PENDING;
  return UNKNOWN;
}

function completedState(lifecycle,completion,status){
  return ['COMPLETED','CC_SYNCED'].includes(lifecycle?.stage)&&lifecycle?.terminal_outcome==='COMPLETED'&&completion?.phase==='live_verified'&&status?.completion?.state==='verified'&&status?.live_reader?.state==='verified';
}

function disqualificationReasons(record){
  const reasons=[];
  if(record.edition_date<WAVE5_FIRST_QUALIFYING_EDITION)reasons.push('edition_before_wave5_window');
  if(record.lifecycle_state!=='CC_SYNCED')reasons.push('lifecycle_not_cc_synced');
  if(record.consistency_state!=='pass')reasons.push('canonical_consistency_not_pass');
  if(record.scheduled_edition_completed!==true)reasons.push('scheduled_edition_not_completed');
  for(const key of NEGATIVE_KPIS){
    if(record[key]===true)reasons.push('metric_failed:'+key);
    else if(record[key]!==false)reasons.push('metric_unproven:'+key);
  }
  return reasons;
}

export function buildWave5EditionProof({
  editionDate,productionMainSha=null,lifecycle,completion,status,runState=null,imageQualityEvidence=null,
  recoveryEvidence=null,observation={},recordedAt=new Date().toISOString(),sourcePaths={}
}={}){
  if(typeof editionDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(editionDate))throw Error('valid_edition_date_required');
  if(!lifecycle||lifecycle.edition_date!==editionDate)throw Error('matching_lifecycle_required');
  if(!status||status.edition_date!==editionDate)throw Error('matching_publication_status_required');
  const historyErrors=lifecycleHistoryErrors(lifecycle);
  const ccEvent=last(lifecycle.history,item=>item?.stage==='CC_SYNCED');
  const duplicatePublicationPr=typeof observation?.duplicate_publication_pr==='boolean'?observation.duplicate_publication_pr:actionDuplicateState(runState,'publication_pr');
  const record={
    schema_version:WAVE5_PROOF_SCHEMA_VERSION,
    edition_date:editionDate,
    qualification_window_id:WAVE5_QUALIFICATION_WINDOW_ID,
    production_main_sha:cleanSha(productionMainSha)||UNKNOWN,
    publication_candidate_sha:cleanSha(lifecycle.candidate_sha)||UNKNOWN,
    publication_merge_sha:cleanSha(lifecycle.publication_merge_sha)||UNKNOWN,
    deployed_sha:cleanSha(lifecycle.deployed_sha)||UNKNOWN,
    lifecycle_state:lifecycle.stage||UNKNOWN,
    completion_state:status.completion?.state||UNKNOWN,
    live_reader_state:status.live_reader?.state||UNKNOWN,
    command_center_sync_state:status.command_center?.result||status.command_center?.state||UNKNOWN,
    consistency_state:status.consistency?.state||UNKNOWN,
    scheduled_edition_completed:completedState(lifecycle,completion,status),
    manual_repository_repair:manualRepairState(lifecycle,observation),
    full_pipeline_restart:fullRestartState(runState,recoveryEvidence,observation),
    duplicate_publication_pr:duplicatePublicationPr,
    live_reader_mismatch:typeof observation?.live_reader_mismatch==='boolean'?observation.live_reader_mismatch:liveMismatchState(lifecycle,completion,status),
    missing_completion_record:typeof observation?.missing_completion_record==='boolean'?observation.missing_completion_record:missingCompletionState(lifecycle,completion,status),
    command_center_parity_mismatch:typeof observation?.command_center_parity_mismatch==='boolean'?observation.command_center_parity_mismatch:commandCenterMismatchState(lifecycle,status),
    valid_stage_reexecuted_unnecessarily:validStageReexecutionState(runState,recoveryEvidence,observation),
    image_fallback_downgrade:typeof observation?.image_fallback_downgrade==='boolean'?observation.image_fallback_downgrade:imageFallbackState(imageQualityEvidence),
    unexplained_state_transition:typeof observation?.unexplained_state_transition==='boolean'?observation.unexplained_state_transition:historyErrors.length>0,
    earliest_invalid_stage_if_any:recoveryEvidence?.earliest_invalid_stage||null,
    preserved_valid_stages:asArray(recoveryEvidence?.preserved_stages),
    invalidated_stages:asArray(recoveryEvidence?.invalidated_stages),
    recovery_action_if_any:recoveryEvidence?.safe_next_action||null,
    publication_ci_run_id:Number.isInteger(lifecycle.ci_run_id)?lifecycle.ci_run_id:UNKNOWN,
    pages_run_id:Number.isInteger(lifecycle.pages_deployment_id)?lifecycle.pages_deployment_id:UNKNOWN,
    validation_run_id:Number.isInteger(completion?.live_verification?.source_validation_run_id)?completion.live_verification.source_validation_run_id:UNKNOWN,
    command_center_refresh_evidence:ccEvent?.evidence||status.command_center||UNKNOWN,
    source_paths:{
      lifecycle:sourcePaths.lifecycle||'_records/publication/'+editionDate+'/lifecycle.json',
      completion:sourcePaths.completion||'_records/publication/'+editionDate+'/completion.json',
      publication_status:sourcePaths.publication_status||'data/operations/publication-status.json',
      run_state:sourcePaths.run_state||'_records/run-state/'+editionDate+'.json',
      image_quality_evidence:sourcePaths.image_quality_evidence||qualityPathFromObservation(observation)
    },
    source_run_ids:[...new Set([
      ...(asArray(runState?.workflow_run_ids).map(String)),
      Number.isInteger(lifecycle.ci_run_id)?String(lifecycle.ci_run_id):null,
      Number.isInteger(lifecycle.pages_deployment_id)?String(lifecycle.pages_deployment_id):null,
      Number.isInteger(completion?.live_verification?.source_validation_run_id)?String(completion.live_verification.source_validation_run_id):null
    ].filter(Boolean))],
    recorded_at:recordedAt
  };
  record.disqualification_reasons=disqualificationReasons(record);
  record.proof_qualifies=record.disqualification_reasons.length===0;
  return record;
}

export function summarizeWave5Proof(records,{recordedAt=new Date().toISOString()}={}){
  const sorted=[...(records||[])].filter(record=>record&&typeof record.edition_date==='string').sort((a,b)=>a.edition_date.localeCompare(b.edition_date));
  const eligible=sorted.filter(record=>record.edition_date>=WAVE5_FIRST_QUALIFYING_EDITION);
  let current=0,max=0;
  for(const record of eligible){
    if(record.proof_qualifies===true){current+=1;max=Math.max(max,current);}else current=0;
  }
  return {
    schema_version:WAVE5_PROOF_SCHEMA_VERSION,
    qualification_window_id:WAVE5_QUALIFICATION_WINDOW_ID,
    first_qualifying_edition:WAVE5_FIRST_QUALIFYING_EDITION,
    minimum_consecutive_required:WAVE5_MINIMUM_CONSECUTIVE,
    stronger_target:WAVE5_STRONGER_TARGET,
    current_consecutive_qualifying_editions:current,
    maximum_consecutive_qualifying_editions:max,
    minimum_threshold_met:current>=WAVE5_MINIMUM_CONSECUTIVE,
    stronger_target_met:current>=WAVE5_STRONGER_TARGET,
    cleanup_permitted:current>=WAVE5_MINIMUM_CONSECUTIVE,
    qualifying_editions:eligible.filter(record=>record.proof_qualifies===true).map(record=>record.edition_date),
    nonqualifying_editions:eligible.filter(record=>record.proof_qualifies!==true).map(record=>({edition_date:record.edition_date,reasons:asArray(record.disqualification_reasons)})),
    proof_records:eligible.map(record=>'_records/reliability-proof/wave5/'+record.edition_date+'.json'),
    recorded_at:recordedAt
  };
}

export function assessWave5RecoveryQualification(cases,{recordedAt=new Date().toISOString()}={}){
  const rows=asArray(cases).map(item=>({
    name:String(item?.name||'unnamed'),
    recovery_success:boolOr(item?.recovery_success),
    preserved_valid_stages:boolOr(item?.preserved_valid_stages),
    duplicate_consequential_actions:Number.isInteger(item?.duplicate_consequential_actions)?item.duplicate_consequential_actions:UNKNOWN
  }));
  const pass=rows.length>0&&rows.every(item=>item.recovery_success===true&&item.preserved_valid_stages===true&&item.duplicate_consequential_actions===0);
  return {
    schema_version:WAVE5_PROOF_SCHEMA_VERSION,
    result:pass?'pass':'fail',
    recovery_success_rate:rows.length?rows.filter(item=>item.recovery_success===true).length/rows.length:0,
    preserved_valid_stage_rate:rows.length?rows.filter(item=>item.preserved_valid_stages===true).length/rows.length:0,
    duplicate_consequential_actions:rows.reduce((sum,item)=>sum+(Number.isInteger(item.duplicate_consequential_actions)?item.duplicate_consequential_actions:0),0),
    cases:rows,
    recorded_at:recordedAt
  };
}
