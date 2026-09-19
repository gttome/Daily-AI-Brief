const POLICY_KEYS=new Set([
 'metadata_candidate_limit','normal_deep_review_limit','exception_deep_review_limit',
 'normal_retrieved_char_limit','absolute_retrieved_char_limit','research_capsule_char_limit',
 'work_context_char_limit','normal_editorial_model_passes','normal_post_editorial_model_passes',
 'normal_validation_model_passes','reader_focus_order','canonical_focus_order_unchanged',
 'visual_quality_baseline','image','video','podcast','autonomous_main_merge_enabled','profile_id','daily_system_credit_target_lt','credit_admission_threshold','daily_ai_task_limit','daily_validation_ai_tasks','deep_review_expansion_enabled','model_visible_evidence_char_limit','semantic_rule_context_char_limit','broad_fallback_searches','automatic_ai_recovery_runs','ai_release_polling','deterministic_validation','failure_policy'
]);

function publicPolicy(policy={}){
 const safe={};
 for(const [key,value] of Object.entries(policy))if(POLICY_KEYS.has(key))safe[key]=value;
 return safe;
}

export function commandCenterDeltaPacket({validation={},watchlist={},policy={},generatedAt=new Date().toISOString()}={}){
 const checks=Array.isArray(validation.checks)?validation.checks.map(check=>({
  check_id:String(check.check_id||''),
  result:String(check.result||'unknown'),
  severity:String(check.severity||'unknown')
 })).filter(check=>check.check_id):[];
 const changed=Array.isArray(watchlist.changed_topics)?watchlist.changed_topics.map(String):[];
 const carried=Array.isArray(watchlist.carried_topics)?watchlist.carried_topics.map(String):[];
 const removed=Array.isArray(watchlist.removed_topics)?watchlist.removed_topics.map(String):[];
 return {
  schema_version:'1.0.0',
  mode:'public_safe_command_center_delta_handoff',
  generated_at:generatedAt,
  edition_date:validation.date||watchlist.next_edition_date||null,
  publication_sha:validation.publication_sha||null,
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
   github_startup_gate:{required:true,phase:'before_editorial_or_image_work'}
  },
  watchlist:{
   changed_topics:changed,
   carried_topics:carried,
   removed_topics:removed,
   semantic_refresh_topic_ids:Array.isArray(watchlist.normal_semantic_input_topic_ids)?watchlist.normal_semantic_input_topic_ids.map(String):[],
   model_calls:Number.isInteger(watchlist.model_calls)?watchlist.model_calls:null
  },
  operating_policy:publicPolicy(policy),
  transport:{
   repository_packet:'available',
   live_command_center_owner_state_mutation:'not_configured',
   reason:'No authorized repository-side Command Center owner-state mutation endpoint or credential is part of this repository contract.'
  },
  privacy:{
   private_reader_records_included:false,
   owner_identity_included:false,
   arbitrary_input_fields_copied:false
  }
 };
}
