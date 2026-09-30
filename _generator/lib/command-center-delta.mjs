import {createHash} from 'node:crypto';

const POLICY_KEYS=new Set([
 'metadata_candidate_limit','normal_deep_review_limit','exception_deep_review_limit',
 'normal_retrieved_char_limit','absolute_retrieved_char_limit','research_capsule_char_limit',
 'work_context_char_limit','normal_editorial_model_passes','normal_post_editorial_model_passes',
 'normal_validation_model_passes','reader_focus_order','canonical_focus_order_unchanged',
 'visual_quality_baseline','image','video','podcast','autonomous_main_merge_enabled','profile_id','daily_system_credit_target_lt','credit_admission_threshold','daily_ai_task_limit','daily_validation_ai_tasks','deep_review_expansion_enabled','model_visible_evidence_char_limit','semantic_rule_context_char_limit','broad_fallback_searches','automatic_ai_recovery_runs','ai_release_polling','deterministic_validation','failure_policy'
]);
const STATUS_STATES=new Set(['PLANNED','RUNNING','BLOCKED','CANDIDATE_READY','AWAITING_CI','MERGED','DEPLOYING','LIVE_VERIFIED','COMPLETED','FAILED','CC_SYNCED']);

function publicPolicy(policy={}){
 const safe={};
 for(const [key,value] of Object.entries(policy))if(POLICY_KEYS.has(key))safe[key]=value;
 return safe;
}
const scalar=(value,fallback=null)=>value===undefined?fallback:value;
const strings=value=>Array.isArray(value)?value.map(String):[];
const nested=(value,keys)=>{
 const out={};
 for(const key of keys)out[key]=scalar(value?.[key]);
 return out;
};

export function canonicalStatusView(status={}){
 if(status?.schema_version!=='2.0.0')throw Error('canonical_publication_status_v2_required');
 if(!STATUS_STATES.has(status.lifecycle_state||status.operator_state||status.status))throw Error('canonical_publication_state_invalid');
 return {
  schema_version:'2.0.0',
  projection_version:String(status.projection_version||'publication-status-v2'),
  edition_date:scalar(status.edition_date),
  edition_id:scalar(status.edition_id),
  lifecycle_stage:scalar(status.lifecycle_stage),
  lifecycle_state:scalar(status.lifecycle_state),
  operator_state:scalar(status.operator_state),
  status:scalar(status.status),
  terminal_outcome:scalar(status.terminal_outcome),
  current_blocker:scalar(status.current_blocker),
  earliest_failed_stage:scalar(status.earliest_failed_stage),
  last_successful_stage:scalar(status.last_successful_stage),
  preserved_completed_work:strings(status.preserved_completed_work),
  next_automatic_recovery_step:scalar(status.next_automatic_recovery_step),
  next_legal_recovery_action:scalar(status.next_legal_recovery_action),
  operator_intervention_required:scalar(status.operator_intervention_required),
  baseline_sha:scalar(status.baseline_sha),
  candidate_sha:scalar(status.candidate_sha),
  production_sha:scalar(status.production_sha),
  publication_merge_sha:scalar(status.publication_merge_sha),
  pr_number:scalar(status.pr_number),
  ci_run_id:scalar(status.ci_run_id),
  ci:nested(status.ci,['state','run_id']),
  pages_deployment_id:scalar(status.pages_deployment_id),
  deployed_sha:scalar(status.deployed_sha),
  pages:nested(status.pages,['state','run_id','deployed_sha']),
  live_verification_timestamp:scalar(status.live_verification_timestamp),
  live_reader:nested(status.live_reader,['state','verified_at']),
  completion_path:scalar(status.completion_path),
  completion:nested(status.completion,['state','path']),
  command_center_sync:scalar(status.command_center_sync),
  command_center:nested(status.command_center,['state','result','last_synced_at','source_status_sha256','stale']),
  last_authoritative_state_transition:nested(status.last_authoritative_state_transition,['stage','at']),
  source_evidence:nested(status.source_evidence,['lifecycle_path','completion_path','current_edition_path','run_state_path']),
  consistency:{state:scalar(status.consistency?.state),errors:strings(status.consistency?.errors)},
  updated_at:scalar(status.updated_at)
 };
}

export function canonicalStatusDigest(status){
 const view=canonicalStatusView(status);
 return 'sha256:'+createHash('sha256').update(JSON.stringify(view)).digest('hex');
}

export function assessCommandCenterParity(canonicalStatus,synchronizedState=null){
 const canonical=canonicalStatusView(canonicalStatus),sourceStatusSha256=canonicalStatusDigest(canonical);
 if(!synchronizedState||typeof synchronizedState!=='object')return {result:'pending',stale:null,mismatches:[],source_status_sha256:sourceStatusSha256,reason:'synchronized_command_center_state_unavailable'};
 const expected={
  source_status_sha256:sourceStatusSha256,
  edition_date:canonical.edition_date,
  lifecycle_state:canonical.lifecycle_state,
  production_sha:canonical.production_sha,
  deployed_sha:canonical.deployed_sha,
  completion_state:canonical.completion.state,
  live_reader_state:canonical.live_reader.state
 };
 const mismatches=[];
 for(const [key,value] of Object.entries(expected))if(synchronizedState[key]!==value)mismatches.push(`${key}_mismatch`);
 const refreshResult=String(synchronizedState.refresh_result||synchronizedState.result||'unknown');
 if(refreshResult==='failure'||refreshResult==='failed')mismatches.push('refresh_failed');
 return {result:mismatches.length?'fail':'pass',stale:mismatches.some(x=>x.endsWith('_mismatch')),mismatches:[...new Set(mismatches)],source_status_sha256:sourceStatusSha256,reason:mismatches.length?'command_center_state_does_not_match_canonical_repository_status':null};
}

export function commandCenterDeltaPacket({canonicalStatus,validation={},watchlist={},policy={},incidentHistory=null,synchronizedState=null,generatedAt=new Date().toISOString()}={}){
 const canonical=canonicalStatusView(canonicalStatus);
 const parity=assessCommandCenterParity(canonical,synchronizedState);
 const checks=Array.isArray(validation.checks)?validation.checks.map(check=>({
  check_id:String(check.check_id||''),
  result:String(check.result||'unknown'),
  severity:String(check.severity||'unknown')
 })).filter(check=>check.check_id):[];
 const changed=Array.isArray(watchlist.changed_topics)?watchlist.changed_topics.map(String):[];
 const carried=Array.isArray(watchlist.carried_topics)?watchlist.carried_topics.map(String):[];
 const removed=Array.isArray(watchlist.removed_topics)?watchlist.removed_topics.map(String):[];
 return {
  schema_version:'2.0.0',
  mode:'public_safe_command_center_delta_handoff',
  generated_at:generatedAt,
  edition_date:canonical.edition_date,
  publication_sha:canonical.production_sha,
  canonical_publication_status:canonical,
  synchronization:{
   source_edition:canonical.edition_date,
   source_production_sha:canonical.production_sha,
   source_deployed_sha:canonical.deployed_sha,
   source_lifecycle_state:canonical.lifecycle_state,
   source_completion_state:canonical.completion.state,
   source_live_reader_state:canonical.live_reader.state,
   source_status_sha256:parity.source_status_sha256,
   requested_at:generatedAt,
   result:parity.result,
   stale:parity.stale,
   mismatches:parity.mismatches,
   reason:parity.reason,
   mutation_permitted:false
  },
  validation:{
   final_result:validation.final_result||'unavailable',
   model_calls:Number.isInteger(validation.model_calls)?validation.model_calls:null,
   semantic_escalation_required:validation.semantic_escalation_required===true,
   coverage:validation.coverage&&typeof validation.coverage==='object'?validation.coverage:null,
   image_readiness:validation.image_readiness&&typeof validation.image_readiness==='object'?validation.image_readiness:null,
   domain_states:validation.domain_states&&typeof validation.domain_states==='object'?validation.domain_states:null,
   automatic_ai_recovery_runs:Number.isInteger(validation.automatic_ai_recovery_runs)?validation.automatic_ai_recovery_runs:null,
   checks
  },
  presentation:{
   focus_labels:{agents_non_technical_people:'Agents for Everyone',applied_genai_knowledge_workers:'Applied Generative AI for Knowledge Workers',technical_ai_engineering:'Technical AI Engineering'},
   book_series:{mapping_source:'_data/book-reading.json',rendering:'data_driven_optional'},
   github_startup_gate:{required:true,phase:'before_editorial_or_image_work'},
   operational_status_source:'canonical_publication_status'
  },
  watchlist:{
   daily_counts:watchlist.daily_counts&&typeof watchlist.daily_counts==='object'?watchlist.daily_counts:null,
   changed_topic_names:Array.isArray(watchlist.changed_topic_names)?watchlist.changed_topic_names.map(String):[],
   changed_topics:changed,
   carried_topics:carried,
   removed_topics:removed,
   semantic_refresh_topic_ids:Array.isArray(watchlist.normal_semantic_input_topic_ids)?watchlist.normal_semantic_input_topic_ids.map(String):[],
   model_calls:Number.isInteger(watchlist.model_calls)?watchlist.model_calls:null
  },
  incident_history:incidentHistory&&typeof incidentHistory==='object'?{
   incident_id:String(incidentHistory.incident_id||''),
   edition_date:String(incidentHistory.edition_date||''),
   status:String(incidentHistory.status||''),
   summary:String(incidentHistory.summary||''),
   original_publication:incidentHistory.original_publication&&typeof incidentHistory.original_publication==='object'?incidentHistory.original_publication:null,
   correction:incidentHistory.correction&&typeof incidentHistory.correction==='object'?incidentHistory.correction:null,
   hardening:Array.isArray(incidentHistory.hardening)?incidentHistory.hardening.map(item=>({pr:Number(item.pr)||null,control:String(item.control||'')})):[],
   closure_requirements:incidentHistory.closure_requirements&&typeof incidentHistory.closure_requirements==='object'?incidentHistory.closure_requirements:null
  }:null,
  operating_policy:publicPolicy(policy),
  transport:{
   repository_packet:'available',
   live_command_center_owner_state_mutation:'not_configured',
   consumer_contract:'display canonical_publication_status exactly; never infer publication success from timestamps, cache age, or partial validation evidence',
   reason:'No authorized repository-side Command Center owner-state mutation endpoint or credential is part of this repository contract.'
  },
  privacy:{
   private_reader_records_included:false,
   owner_identity_included:false,
   arbitrary_input_fields_copied:false
  }
 };
}
