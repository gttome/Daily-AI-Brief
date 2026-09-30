import {buildQualificationImageWorkerPayload,buildQualificationImageGenerationInstruction,validateQualificationImageWorkerPayload} from './image-story-packet.mjs';
export {IMAGE_WORKER_PACKET_KEYS,APPROVED_COMPOSITION_MODES,buildQualificationImageWorkerPayload,buildQualificationImageGenerationInstruction,validateQualificationImageWorkerPayload} from './image-story-packet.mjs';
// The current qualification entry points are the production implementation itself.
export {IMAGE_GENERATION_EXECUTION_KEYS,buildImageGenerationExecution as buildQualificationImageGenerationExecution,validateImageGenerationExecution as validateQualificationImageGenerationExecution} from './image-execution.mjs';

export const IMAGE_HARNESS_STORY_ORDER=['m02','m04','m06','m07','m01','m08'];

export const IMAGE_HARNESS_STATES=[
  'PACKET_READY','WORKER_STARTED','IMAGE_GENERATED','DURABLE_LIBRARY_CAPTURED',
  'WORKER_EXITED','RAW_FILE_MATERIALIZED','SUBJECT_LINEAGE_PASS','FACTUAL_SUPPORT_PASS',
  'STRUCTURAL_QUALITY_PASS','EDITORIAL_QUALITY_PASS','EXACT_GIT_BLOB_PERSISTED','ACCEPTED_LOCKED'
];

// Historical IH execution validators remain available for explicit archival replay only.
export const LEGACY_IMAGE_GENERATION_EXECUTION_KEYS=[
  'context_mode','inherit_parent_context','prior_messages','attachments',
  'sealed_story_packet','generation_instruction','review_in_same_context'
];

export function buildLegacyQualificationImageGenerationExecution(packet){
  const sealedStoryPacket=buildQualificationImageWorkerPayload(packet);
  const generationInstruction=buildQualificationImageGenerationInstruction(sealedStoryPacket);
  return {
    context_mode:'fresh_image_only',
    inherit_parent_context:false,
    prior_messages:[],
    attachments:[],
    sealed_story_packet:sealedStoryPacket,
    generation_instruction:generationInstruction,
    review_in_same_context:false
  };
}

export function validateLegacyQualificationImageGenerationExecution(execution){
  const errors=[];
  if(!execution||typeof execution!=='object'||Array.isArray(execution))return ['image_generation_execution_required'];
  const keys=Object.keys(execution);
  for(const key of LEGACY_IMAGE_GENERATION_EXECUTION_KEYS){
    if(!(key in execution))errors.push(`missing_generation_execution_key_${key}`);
  }
  for(const key of keys){
    if(!LEGACY_IMAGE_GENERATION_EXECUTION_KEYS.includes(key))errors.push(`prohibited_generation_execution_key_${key}`);
  }
  if(execution.context_mode!=='fresh_image_only')errors.push('generation_context_mode_must_be_fresh_image_only');
  if(execution.inherit_parent_context!==false)errors.push('generation_parent_context_inheritance_must_be_false');
  if(!Array.isArray(execution.prior_messages)||execution.prior_messages.length!==0)errors.push('generation_prior_messages_must_be_empty');
  if(!Array.isArray(execution.attachments)||execution.attachments.length!==0)errors.push('generation_attachments_must_be_empty');
  if(execution.review_in_same_context!==false)errors.push('generation_review_must_be_separate');
  for(const payloadError of validateQualificationImageWorkerPayload(execution.sealed_story_packet))errors.push(payloadError);
  try{
    const expected=buildQualificationImageGenerationInstruction(execution.sealed_story_packet);
    if(execution.generation_instruction!==expected)errors.push('generation_instruction_must_derive_only_from_sealed_story_packet');
  }catch{
    errors.push('generation_instruction_invalid');
  }
  return [...new Set(errors)];
}

export function validateQualificationImageRenderedText(renderedText,allowedImageText){
  const errors=[];
  if(!Array.isArray(renderedText))return ['rendered_text_strings_required'];
  if(!Array.isArray(allowedImageText)||allowedImageText.length<1)return ['allowed_image_text_required'];
  const counts=new Map();
  for(const text of renderedText){
    if(typeof text!=='string'||text.trim()!==text||text.length<1){errors.push('rendered_text_string_invalid');continue;}
    if(text.length>120||text.trim().split(/\s+/).length>16)errors.push(`rendered_text_unbounded:${text}`);
    counts.set(text,(counts.get(text)||0)+1);
  }
  for(const label of allowedImageText){
    const count=counts.get(label)||0;
    if(count===0)errors.push(`required_rendered_text_missing:${label}`);
  }
  return [...new Set(errors)];
}

export function validateImageHarnessAttempt(attempt,{candidateId=null,maxAttempts=4}={}){
  const errors=[];
  if(!attempt||typeof attempt!=='object')return ['image_harness_attempt_required'];
  if(candidateId&&attempt.candidate_id!==candidateId)errors.push('candidate_id_mismatch');
  if(!IMAGE_HARNESS_STORY_ORDER.includes(attempt.candidate_id))errors.push('candidate_not_in_fixed_harness_set');
  if(!Number.isInteger(attempt.attempt)||attempt.attempt<1||attempt.attempt>maxAttempts)errors.push('attempt_out_of_bounds');
  if(!Array.isArray(attempt.states))return [...new Set([...errors,'states_array_required'])];
  let last=-1;
  for(const state of attempt.states){
    const idx=IMAGE_HARNESS_STATES.indexOf(state);
    if(idx<0){errors.push(`unknown_state_${state}`);continue;}
    if(idx<=last)errors.push(`state_order_invalid_${state}`);
    last=idx;
  }
  if(attempt.accepted_locked===true){
    const missing=IMAGE_HARNESS_STATES.filter(s=>!attempt.states.includes(s));
    for(const state of missing)errors.push(`accepted_locked_missing_${state}`);
    if(attempt.fallback!==false)errors.push('fallback_must_be_false');
    if(attempt.cross_story_contamination!==false)errors.push('cross_story_contamination_must_be_false');
    if(!/^[a-f0-9]{64}$/.test(attempt.sha256||''))errors.push('sha256_invalid');
    if(typeof attempt.git_blob_sha!=='string'||attempt.git_blob_sha.length<7)errors.push('git_blob_sha_required');
    if(!Number.isInteger(attempt.width)||attempt.width<1||!Number.isInteger(attempt.height)||attempt.height<1)errors.push('dimensions_invalid');
    for(const textError of validateQualificationImageRenderedText(attempt.rendered_text_strings,attempt.allowed_image_text))errors.push(textError);
  }
  return [...new Set(errors)];
}

export function validateImageHarnessSummary(summary){
  const errors=[];
  if(!summary||typeof summary!=='object')return ['image_harness_summary_required'];
  if(summary.production_mutation!==false)errors.push('production_mutation_must_be_false');
  if(summary.work_usage!==0)errors.push('work_usage_must_be_zero');
  if(summary.codex_usage!==0)errors.push('codex_usage_must_be_zero');
  if(summary.paid_api_usage!==0)errors.push('paid_api_usage_must_be_zero');
  if(summary.fallback_used!==false)errors.push('fallback_used_must_be_false');
  if(summary.cross_story_contamination_count!==0)errors.push('cross_story_contamination_must_be_zero');
  if(!Array.isArray(summary.story_results)||summary.story_results.length!==6)errors.push('six_story_results_required');
  const ids=Array.isArray(summary.story_results)?summary.story_results.map(x=>x?.candidate_id):[];
  if(JSON.stringify(ids)!==JSON.stringify(IMAGE_HARNESS_STORY_ORDER))errors.push('story_order_mismatch');

  const accepted=Array.isArray(summary.story_results)?summary.story_results.filter(x=>x?.accepted_locked===true).length:0;
  const remediationOpen=summary.isolated_remediation_lane===true;
  const qualificationAdvance=summary.status==='QUALIFICATION_ADVANCE_WITH_REMEDIATION';

  if(summary.status==='PASS'){
    for(const result of Array.isArray(summary.story_results)?summary.story_results:[]){
      if(result?.accepted_locked!==true)errors.push(`${result?.candidate_id||'unknown'}_not_accepted_locked`);
    }
    if(summary.accepted_locked_count!==6||accepted!==6)errors.push('accepted_locked_count_must_be_six');
  }else if(qualificationAdvance){
    if(!remediationOpen)errors.push('isolated_remediation_lane_required');
    if(summary.accepted_locked_count!==5||accepted!==5)errors.push('qualification_advance_requires_five_locked');
  }else{
    errors.push('status_must_be_PASS_or_QUALIFICATION_ADVANCE_WITH_REMEDIATION');
  }
  return [...new Set(errors)];
}
