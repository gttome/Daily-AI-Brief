import fs from 'node:fs';
import path from 'node:path';

export const PUBLICATION_LIFECYCLE_VERSION='publication-lifecycle-v1';
export const PUBLICATION_STATUS_SCHEMA_VERSION='2.0.0';
export const OPERATOR_PUBLICATION_STATES=Object.freeze(['PLANNED','RUNNING','BLOCKED','CANDIDATE_READY','AWAITING_CI','MERGED','DEPLOYING','LIVE_VERIFIED','COMPLETED','FAILED','CC_SYNCED']);
export const PUBLICATION_STAGES=Object.freeze([
  'PLANNED','PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED','FAILED','EXPLICITLY_SKIPPED'
]);
export const TERMINAL_OUTCOMES=Object.freeze(['COMPLETED','FAILED_UNRESOLVED','EXPLICITLY_SKIPPED']);
const LINEAR=PUBLICATION_STAGES.slice(0,11);
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
const evidence=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length>0;
const completedStage=stage=>['COMPLETED','CC_SYNCED'].includes(stage);

export function lifecyclePath(editionDate){if(!date(editionDate))throw Error('valid_edition_date_required');return `_records/publication/${editionDate}/lifecycle.json`;}
export function completionPath(editionDate){if(!date(editionDate))throw Error('valid_edition_date_required');return `_records/publication/${editionDate}/completion.json`;}

export function newPublicationLifecycle({editionDate,runId,baselineSha=null,createdAt=new Date().toISOString(),migration=false}={}){
  if(!date(editionDate)||typeof runId!=='string'||!runId.trim())throw Error('edition_date_and_run_id_required');
  if(baselineSha!==null&&!sha(baselineSha))throw Error('baseline_sha_invalid');
  return {
    schema_version:'1.0.0',lifecycle_version:PUBLICATION_LIFECYCLE_VERSION,edition_date:editionDate,edition_id:`dab-edition-${editionDate}`,run_id:runId,
    baseline_sha:baselineSha,candidate_sha:null,publication_merge_sha:null,production_sha:null,deployed_sha:null,publication_pr_number:null,repair_pr_numbers:[],ci_run_id:null,pages_deployment_id:null,
    stage:'PLANNED',status:'RUNNING',terminal_outcome:null,completion_record:null,command_center_sync:'pending',retry_count:0,last_error:null,blocker:null,next_legal_action:'Complete preflight.',
    created_at:createdAt,updated_at:createdAt,migration:Boolean(migration),history:[{stage:'PLANNED',at:createdAt,evidence:{kind:migration?'migration_start':'run_start'}}]
  };
}

function expectedNext(stage){const i=LINEAR.indexOf(stage);return i>=0&&i<LINEAR.length-1?LINEAR[i+1]:null;}
function statusFor(stage){if(stage==='COMPLETED'||stage==='CC_SYNCED')return 'COMPLETED';if(stage==='FAILED')return 'FAILED';if(stage==='EXPLICITLY_SKIPPED')return 'SKIPPED';return 'RUNNING';}
function nextAction(stage){return ({PLANNED:'Complete preflight.',PREFLIGHT_READY:'Complete editorial inputs.',EDITORIAL_READY:'Build deterministic candidate.',CANDIDATE_READY:'Open publication PR.',PR_OPEN:'Require protected CI.',CI_PASS:'Merge exact passing candidate.',MERGED:'Wait for exact-SHA Pages deployment.',PAGES_DEPLOYED:'Verify live reader and required routes.',LIVE_VERIFIED:'Persist valid completion record.',COMPLETED:'Synchronize Command Center from canonical status.',CC_SYNCED:null,FAILED:'Resume from the earliest invalid stage.',EXPLICITLY_SKIPPED:null})[stage]??null;}

export function transitionPublicationLifecycle(record,nextStage,{at=new Date().toISOString(),evidence:proof,patch={}}={}){
  validateLifecycleShape(record);
  if(!PUBLICATION_STAGES.includes(nextStage))throw Error('unknown_publication_stage');
  if(record.terminal_outcome&&nextStage!=='CC_SYNCED')throw Error('terminal_lifecycle_cannot_advance');
  if(nextStage==='FAILED'){
    if(!evidence(proof))throw Error('failed_transition_requires_evidence');
    const next={...structuredClone(record),...patch,stage:'FAILED',status:'FAILED',terminal_outcome:'FAILED_UNRESOLVED',last_error:patch.last_error||proof.error||'publication_failed',blocker:patch.blocker||proof.error||'publication_failed',next_legal_action:patch.next_legal_action||nextAction('FAILED'),updated_at:at};
    next.history.push({stage:'FAILED',at,evidence:proof});return next;
  }
  if(nextStage==='EXPLICITLY_SKIPPED'){
    if(!evidence(proof))throw Error('skip_requires_evidence');
    const next={...structuredClone(record),...patch,stage:nextStage,status:'SKIPPED',terminal_outcome:'EXPLICITLY_SKIPPED',blocker:null,next_legal_action:null,updated_at:at};
    next.history.push({stage:nextStage,at,evidence:proof});return next;
  }
  if(expectedNext(record.stage)!==nextStage)throw Error(`illegal_lifecycle_transition:${record.stage}->${nextStage}`);
  if(!evidence(proof))throw Error('transition_evidence_required');
  if(nextStage==='CANDIDATE_READY'&&!sha(patch.candidate_sha))throw Error('candidate_ready_requires_candidate_sha');
  if(nextStage==='PR_OPEN'&&(!Number.isInteger(patch.publication_pr_number)||patch.publication_pr_number<1))throw Error('pr_open_requires_pr_number');
  if(nextStage==='CI_PASS'&&(!Number.isInteger(patch.ci_run_id)||patch.ci_run_id<1))throw Error('ci_pass_requires_run_id');
  if(nextStage==='MERGED'&&!sha(patch.publication_merge_sha))throw Error('merged_requires_merge_sha');
  if(nextStage==='PAGES_DEPLOYED'&&(!sha(patch.production_sha)||!sha(patch.deployed_sha)||patch.production_sha!==patch.deployed_sha||!Number.isInteger(patch.pages_deployment_id)||patch.pages_deployment_id<1))throw Error('pages_deployed_requires_exact_sha_evidence');
  if(nextStage==='LIVE_VERIFIED'&&(!sha(patch.production_sha)||patch.production_sha!==patch.deployed_sha||proof.final_result!=='pass'||proof.homepage_edition_date!==record.edition_date))throw Error('live_verified_requires_exact_reader_evidence');
  if(nextStage==='COMPLETED'&&(typeof patch.completion_record!=='string'||!patch.completion_record))throw Error('completed_requires_completion_record');
  if(nextStage==='CC_SYNCED'){
    if(record.stage!=='COMPLETED')throw Error(`illegal_lifecycle_transition:${record.stage}->${nextStage}`);
    if(proof.result!=='pass'||proof.source_edition!==record.edition_date||proof.source_production_sha!==record.production_sha||proof.source_deployed_sha!==record.deployed_sha||typeof proof.source_status_sha256!=='string'||!/^sha256:[a-f0-9]{64}$/.test(proof.source_status_sha256))throw Error('cc_synced_requires_exact_canonical_status_evidence');
  }
  const next={...structuredClone(record),...patch,stage:nextStage,status:statusFor(nextStage),updated_at:at,last_error:null,blocker:null,next_legal_action:nextAction(nextStage)};
  if(nextStage==='COMPLETED')next.terminal_outcome='COMPLETED';
  if(nextStage==='CC_SYNCED')next.command_center_sync='complete';
  next.history.push({stage:nextStage,at,evidence:proof});
  validateLifecycleShape(next);
  return next;
}

export function validateLifecycleShape(record){
  const errors=[];
  if(record?.schema_version!=='1.0.0'||record?.lifecycle_version!==PUBLICATION_LIFECYCLE_VERSION)errors.push('unsupported_lifecycle_schema');
  if(!date(record?.edition_date)||record?.edition_id!==`dab-edition-${record?.edition_date}`)errors.push('edition_identity_invalid');
  if(typeof record?.run_id!=='string'||!record.run_id)errors.push('run_id_required');
  if(record?.baseline_sha!==null&&!sha(record?.baseline_sha))errors.push('baseline_sha_invalid');
  if(!PUBLICATION_STAGES.includes(record?.stage))errors.push('stage_invalid');
  for(const key of ['candidate_sha','publication_merge_sha','production_sha','deployed_sha'])if(record?.[key]!==null&&!sha(record[key]))errors.push(`${key}_invalid`);
  if(!Array.isArray(record?.history)||record.history.length===0)errors.push('history_required');
  if(record?.terminal_outcome!==null&&!TERMINAL_OUTCOMES.includes(record.terminal_outcome))errors.push('terminal_outcome_invalid');
  if((record?.stage==='COMPLETED'||record?.stage==='CC_SYNCED')&&record?.terminal_outcome!=='COMPLETED')errors.push('completed_stage_requires_completed_outcome');
  if(record?.stage==='FAILED'&&record?.terminal_outcome!=='FAILED_UNRESOLVED')errors.push('failed_stage_requires_failed_unresolved');
  if(record?.stage==='EXPLICITLY_SKIPPED'&&record?.terminal_outcome!=='EXPLICITLY_SKIPPED')errors.push('skipped_stage_requires_skipped_outcome');
  if(record?.production_sha&&record?.deployed_sha&&record.production_sha!==record.deployed_sha&&['LIVE_VERIFIED','COMPLETED','CC_SYNCED'].includes(record.stage))errors.push('production_deployed_sha_mismatch');
  if(record?.stage==='CC_SYNCED'&&record?.command_center_sync!=='complete')errors.push('cc_synced_stage_requires_complete_sync');
  return errors;
}

export function validateCompletionIntegrity(lifecycle,completion){
  const errors=[...validateLifecycleShape(lifecycle)];
  if(completion?.schema_version!=='2.0.0')errors.push('completion_schema_v2_required');
  if(completion?.phase!=='live_verified')errors.push('completion_phase_live_verified_required');
  if(completion?.edition_id!==lifecycle?.edition_id)errors.push('completion_edition_mismatch');
  if(completion?.run_id!==lifecycle?.run_id)errors.push('completion_run_id_mismatch');
  if(!sha(completion?.production_sha)||!sha(completion?.deployed_sha))errors.push('completion_sha_required');
  if(completion?.production_sha!==completion?.deployed_sha)errors.push('completion_production_deployed_sha_mismatch');
  if(lifecycle?.production_sha&&completion?.production_sha!==lifecycle.production_sha)errors.push('completion_lifecycle_production_sha_mismatch');
  if(lifecycle?.deployed_sha&&completion?.deployed_sha!==lifecycle.deployed_sha)errors.push('completion_lifecycle_deployed_sha_mismatch');
  if(completion?.pages?.conclusion!=='success'||!completion?.pages?.run_id)errors.push('successful_pages_evidence_required');
  if(completion?.live_verification?.final_result!=='pass'||completion?.live_verification?.homepage_edition_date!==lifecycle?.edition_date||!completion?.live_verified_at)errors.push('live_reader_verification_required');
  return [...new Set(errors)];
}

export function deriveCurrentEdition(lifecycle,completion){
  if(!['COMPLETED','CC_SYNCED'].includes(lifecycle?.stage)||lifecycle?.terminal_outcome!=='COMPLETED')throw Error('lifecycle_not_completed');
  const errors=validateCompletionIntegrity(lifecycle,completion);if(errors.length)throw Error(errors.join(';'));
  return {schema_version:'2.0.0',edition_id:lifecycle.edition_id,brief_date:lifecycle.edition_date,lifecycle_path:lifecyclePath(lifecycle.edition_date),completion_path:completionPath(lifecycle.edition_date),production_sha:lifecycle.production_sha,deployed_sha:lifecycle.deployed_sha};
}

function currentEditionErrors(lifecycle,currentEdition){
  const errors=[];
  if(!completedStage(lifecycle.stage))return errors;
  if(!currentEdition){errors.push('current_edition_projection_missing');return errors;}
  if(currentEdition.brief_date!==lifecycle.edition_date)errors.push('current_edition_projection_mismatch');
  if(currentEdition.edition_id!==lifecycle.edition_id)errors.push('current_edition_id_mismatch');
  if(currentEdition.lifecycle_path!==lifecyclePath(lifecycle.edition_date))errors.push('current_edition_lifecycle_path_mismatch');
  if(currentEdition.completion_path!==completionPath(lifecycle.edition_date))errors.push('current_edition_completion_path_mismatch');
  if(currentEdition.production_sha!==lifecycle.production_sha||currentEdition.deployed_sha!==lifecycle.deployed_sha)errors.push('current_edition_sha_mismatch');
  return errors;
}
function operatorStateForLifecycle(lifecycle,blocked=false){
  if(blocked&&lifecycle.stage!=='FAILED')return 'BLOCKED';
  return ({PLANNED:'PLANNED',PREFLIGHT_READY:'RUNNING',EDITORIAL_READY:'RUNNING',CANDIDATE_READY:'CANDIDATE_READY',PR_OPEN:'AWAITING_CI',CI_PASS:'CANDIDATE_READY',MERGED:'MERGED',PAGES_DEPLOYED:'DEPLOYING',LIVE_VERIFIED:'LIVE_VERIFIED',COMPLETED:'COMPLETED',CC_SYNCED:'CC_SYNCED',FAILED:'FAILED',EXPLICITLY_SKIPPED:'FAILED'})[lifecycle.stage]||'BLOCKED';
}
function ciState(lifecycle){
  if(lifecycle.ci_run_id)return {state:'passed',run_id:lifecycle.ci_run_id};
  if(lifecycle.stage==='PR_OPEN')return {state:'pending',run_id:null};
  if(['CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED'].includes(lifecycle.stage))return {state:'unavailable',run_id:null};
  return {state:'not_applicable',run_id:null};
}
function pagesState(lifecycle){
  if(lifecycle.pages_deployment_id&&lifecycle.deployed_sha)return {state:'succeeded',run_id:lifecycle.pages_deployment_id,deployed_sha:lifecycle.deployed_sha};
  if(['MERGED','PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED'].includes(lifecycle.stage))return {state:'pending',run_id:null,deployed_sha:lifecycle.deployed_sha||null};
  return {state:'not_applicable',run_id:null,deployed_sha:null};
}
function liveState(lifecycle,completion){
  if(completion?.live_verified_at&&completion?.live_verification?.final_result==='pass')return {state:'verified',verified_at:completion.live_verified_at};
  if(['PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED'].includes(lifecycle.stage))return {state:'pending',verified_at:null};
  return {state:'not_applicable',verified_at:null};
}
function completionState(lifecycle,completion,errors){
  if(completedStage(lifecycle.stage)&&completion&&errors.length===0)return {state:'verified',path:lifecycle.completion_record};
  if(['LIVE_VERIFIED','COMPLETED','CC_SYNCED'].includes(lifecycle.stage))return {state:completion?'invalid':'pending',path:lifecycle.completion_record||null};
  return {state:'not_applicable',path:lifecycle.completion_record||null};
}

export function derivePublicationStatus(lifecycle,{completion=null,currentEdition=null,recovery=null}={}){
  const lifecycleErrors=validateLifecycleShape(lifecycle);
  const completionErrors=completion?validateCompletionIntegrity(lifecycle,completion):(completedStage(lifecycle.stage)?['completion_record_missing']:[]);
  const projectionErrors=currentEditionErrors(lifecycle,currentEdition);
  const syncEvent=[...(lifecycle.history||[])].reverse().find(item=>item?.stage==='CC_SYNCED')||null;
  const syncErrors=[];
  if(lifecycle.stage==='CC_SYNCED'){
    const proof=syncEvent?.evidence||{};
    if(proof.result!=='pass')syncErrors.push('command_center_sync_result_not_pass');
    if(proof.source_edition!==lifecycle.edition_date)syncErrors.push('command_center_sync_edition_mismatch');
    if(proof.source_production_sha!==lifecycle.production_sha)syncErrors.push('command_center_sync_production_sha_mismatch');
    if(proof.source_deployed_sha!==lifecycle.deployed_sha)syncErrors.push('command_center_sync_deployed_sha_mismatch');
    if(typeof proof.source_status_sha256!=='string'||!/^sha256:[a-f0-9]{64}$/.test(proof.source_status_sha256))syncErrors.push('command_center_sync_status_digest_missing');
  }
  const consistencyErrors=[...new Set([...lifecycleErrors,...completionErrors,...projectionErrors,...syncErrors])];
  const blocker=lifecycle.blocker||null;
  const blocked=Boolean(blocker)||consistencyErrors.length>0;
  const operatorState=operatorStateForLifecycle(lifecycle,blocked);
  const history=Array.isArray(lifecycle.history)?lifecycle.history:[];
  const successful=history.filter(item=>item?.stage!=='FAILED'&&item?.stage!=='EXPLICITLY_SKIPPED');
  const lastSuccessful=successful.length?successful[successful.length-1]?.stage||null:null;
  const preserved=Array.isArray(recovery?.preserved_stages)?recovery.preserved_stages:successful.map(item=>item.stage).filter(Boolean);
  const earliestFailed=recovery?.earliest_invalid_stage||(lifecycle.stage==='FAILED'?lifecycle.stage:(consistencyErrors.length?'OPERATIONAL_INTEGRITY':null));
  const nextRecovery=recovery?.safe_next_action||(blocked?'Repair the failing integrity condition; preserve earlier valid work.':lifecycle.next_legal_action);
  const lastTransition=history.length?history[history.length-1]:null;
  const completionView=completionState(lifecycle,completion,completionErrors);
  const commandCenter={
    state:lifecycle.command_center_sync||'pending',
    result:lifecycle.stage==='CC_SYNCED'&&syncErrors.length===0?'pass':(lifecycle.command_center_sync==='complete'?'invalid':'pending'),
    last_synced_at:syncEvent?.at||null,
    source_status_sha256:syncEvent?.evidence?.source_status_sha256||null,
    stale:lifecycle.stage==='CC_SYNCED'&&syncErrors.length===0?false:null
  };
  return {
    schema_version:PUBLICATION_STATUS_SCHEMA_VERSION,
    projection_version:'publication-status-v2',
    edition_date:lifecycle.edition_date,
    edition_id:lifecycle.edition_id,
    lifecycle_stage:lifecycle.stage,
    lifecycle_state:operatorState,
    operator_state:operatorState,
    status:operatorState,
    terminal_outcome:lifecycle.terminal_outcome,
    current_blocker:blocker||(consistencyErrors.length?'operational_integrity:'+consistencyErrors.join(','):null),
    earliest_failed_stage:earliestFailed,
    last_successful_stage:lastSuccessful,
    preserved_completed_work:[...new Set(preserved)],
    next_automatic_recovery_step:nextRecovery,
    next_legal_recovery_action:nextRecovery,
    operator_intervention_required:lifecycle.stage==='FAILED'||consistencyErrors.length>0?true:null,
    baseline_sha:lifecycle.baseline_sha,
    candidate_sha:lifecycle.candidate_sha,
    production_sha:lifecycle.production_sha,
    publication_merge_sha:lifecycle.publication_merge_sha,
    pr_number:lifecycle.publication_pr_number,
    ci_run_id:lifecycle.ci_run_id,
    ci:ciState(lifecycle),
    pages_deployment_id:lifecycle.pages_deployment_id,
    deployed_sha:lifecycle.deployed_sha,
    pages:pagesState(lifecycle),
    live_verification_timestamp:completion?.live_verified_at||null,
    live_reader:liveState(lifecycle,completion),
    completion_path:lifecycle.completion_record,
    completion:completionView,
    command_center_sync:lifecycle.command_center_sync,
    command_center:commandCenter,
    last_authoritative_state_transition:lastTransition?{stage:lastTransition.stage||null,at:lastTransition.at||null}:null,
    source_evidence:{lifecycle_path:lifecyclePath(lifecycle.edition_date),completion_path:lifecycle.completion_record||completionPath(lifecycle.edition_date),current_edition_path:'data/operations/current-edition.json',run_state_path:'_records/run-state/'+lifecycle.edition_date+'.json'},
    consistency:{state:consistencyErrors.length?'blocked':'pass',errors:consistencyErrors},
    updated_at:lifecycle.updated_at
  };
}

export function evaluateContinuity({previousDate,previousLifecycle}={}){
  if(!date(previousDate))throw Error('previous_date_required');
  if(!previousLifecycle)return {result:'fail',previous_date:previousDate,terminal_outcome:null,reason:'previous_date_has_no_durable_terminal_outcome'};
  const errors=validateLifecycleShape(previousLifecycle);if(errors.length)return {result:'fail',previous_date:previousDate,terminal_outcome:previousLifecycle.terminal_outcome||null,reason:`previous_lifecycle_invalid:${errors.join(',')}`};
  if(!TERMINAL_OUTCOMES.includes(previousLifecycle.terminal_outcome))return {result:'fail',previous_date:previousDate,terminal_outcome:previousLifecycle.terminal_outcome||null,reason:'previous_date_nonterminal'};
  return {result:'pass',previous_date:previousDate,terminal_outcome:previousLifecycle.terminal_outcome,reason:null};
}

export function validateCurrentProjection(root){
  const currentFile=path.join(root,'data/operations/current-edition.json');
  if(!fs.existsSync(currentFile))return ['current_edition_projection_missing'];
  let current;try{current=JSON.parse(fs.readFileSync(currentFile,'utf8'));}catch{return ['current_edition_projection_invalid_json'];}
  if(!date(current?.brief_date))return ['current_edition_date_invalid'];
  const lp=path.join(root,lifecyclePath(current.brief_date)),cp=path.join(root,completionPath(current.brief_date));
  if(!fs.existsSync(lp))return ['current_edition_lifecycle_missing'];if(!fs.existsSync(cp))return ['current_edition_completion_missing'];
  const lifecycle=JSON.parse(fs.readFileSync(lp,'utf8')),completion=JSON.parse(fs.readFileSync(cp,'utf8'));
  const errors=validateCompletionIntegrity(lifecycle,completion);
  if(!['COMPLETED','CC_SYNCED'].includes(lifecycle.stage)||lifecycle.terminal_outcome!=='COMPLETED')errors.push('current_edition_lifecycle_not_completed');
  if(current.edition_id!==lifecycle.edition_id)errors.push('current_edition_id_mismatch');
  if(current.completion_path!==completionPath(current.brief_date))errors.push('current_edition_completion_path_mismatch');
  if(current.lifecycle_path!==lifecyclePath(current.brief_date))errors.push('current_edition_lifecycle_path_mismatch');
  if(current.production_sha!==lifecycle.production_sha||current.deployed_sha!==lifecycle.deployed_sha)errors.push('current_edition_sha_mismatch');
  return [...new Set(errors)];
}
