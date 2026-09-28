export const IMAGE_HARNESS_STORY_ORDER=['m02','m04','m06','m07','m01','m08'];

export const IMAGE_HARNESS_STATES=[
  'PACKET_READY','WORKER_STARTED','IMAGE_GENERATED','DURABLE_LIBRARY_CAPTURED',
  'WORKER_EXITED','RAW_FILE_MATERIALIZED','SUBJECT_LINEAGE_PASS','FACTUAL_SUPPORT_PASS',
  'STRUCTURAL_QUALITY_PASS','EDITORIAL_QUALITY_PASS','EXACT_GIT_BLOB_PERSISTED','ACCEPTED_LOCKED'
];

export const IMAGE_WORKER_PACKET_KEYS=[
  'story_id','candidate_id','headline','source_url','verified_visual_facts',
  'generic_conceptual_elements','prohibited_specifics','visual_brief','reference_policy',
  'acceptance_order','wrong_subject_action','low_quality_fallback','allowed_image_text','composition_mode','prohibited_composition_patterns'
];

export const APPROVED_COMPOSITION_MODES=[
  'mechanism_rich_textbook_plate','linear_flow','layered_architecture','comparison',
  'taxonomy','annotated_system','panel_based_explanation','story_fit_editorial'
];

export const IMAGE_GENERATION_EXECUTION_KEYS=[
  'context_mode','inherit_parent_context','prior_messages','attachments',
  'sealed_story_packet','generation_instruction','review_in_same_context'
];

export function buildQualificationImageGenerationExecution(packet){
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

export function validateQualificationImageGenerationExecution(execution){
  const errors=[];
  if(!execution||typeof execution!=='object'||Array.isArray(execution))return ['image_generation_execution_required'];
  const keys=Object.keys(execution);
  for(const key of IMAGE_GENERATION_EXECUTION_KEYS){
    if(!(key in execution))errors.push(`missing_generation_execution_key_${key}`);
  }
  for(const key of keys){
    if(!IMAGE_GENERATION_EXECUTION_KEYS.includes(key))errors.push(`prohibited_generation_execution_key_${key}`);
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

export function buildQualificationImageWorkerPayload(packet){
  if(!packet||typeof packet!=='object')throw new Error('sealed_story_packet_required');
  const payload={};
  for(const key of IMAGE_WORKER_PACKET_KEYS){
    if(packet[key]===undefined||packet[key]===null||packet[key]==='')throw new Error(`missing_${key}`);
    payload[key]=packet[key];
  }
  return payload;
}

export function validateQualificationImageWorkerPayload(payload){
  const errors=[];
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return ['image_worker_payload_required'];
  const keys=Object.keys(payload);
  for(const key of IMAGE_WORKER_PACKET_KEYS){
    if(payload[key]===undefined||payload[key]===null||payload[key]==='')errors.push(`missing_${key}`);
  }
  for(const key of keys){
    if(!IMAGE_WORKER_PACKET_KEYS.includes(key))errors.push(`prohibited_worker_payload_key_${key}`);
  }
  for(const field of ['verified_visual_facts','generic_conceptual_elements','prohibited_specifics','acceptance_order','allowed_image_text','prohibited_composition_patterns']){
    if(!Array.isArray(payload[field])||payload[field].length<1)errors.push(`${field}_array_required`);
  }
  if(payload.low_quality_fallback!==false)errors.push('low_quality_fallback_must_be_false');
  if(!APPROVED_COMPOSITION_MODES.includes(payload.composition_mode))errors.push('composition_mode_not_approved');
  if(Array.isArray(payload.allowed_image_text)){
    const seen=new Set();
    for(const label of payload.allowed_image_text){
      if(typeof label!=='string'||label.trim()!==label||label.length<1||label.length>80)errors.push('allowed_image_text_label_invalid');
      if(typeof label==='string'&&label.trim().split(/\s+/).length>8)errors.push('allowed_image_text_label_too_long');
      if(seen.has(label))errors.push('allowed_image_text_duplicate');
      seen.add(label);
    }
  }
  if(typeof payload.reference_policy!=='string'||payload.reference_policy.trim().length<1)errors.push('reference_policy_required');
  if(typeof payload.wrong_subject_action!=='string'||!payload.wrong_subject_action.toLowerCase().includes('discard'))errors.push('wrong_subject_action_must_discard');
  return [...new Set(errors)];
}

export function buildQualificationImageGenerationInstruction(payload){
  const errors=validateQualificationImageWorkerPayload(payload);
  if(errors.length)throw new Error(`invalid_image_worker_payload:${errors.join(',')}`);
  return [
    `story_id: ${payload.story_id}`,
    `candidate_id: ${payload.candidate_id}`,
    `headline: ${payload.headline}`,
    `source_url: ${payload.source_url}`,
    `verified_visual_facts: ${payload.verified_visual_facts.join('; ')}`,
    `generic_conceptual_elements: ${payload.generic_conceptual_elements.join('; ')}`,
    `prohibited_specifics: ${payload.prohibited_specifics.join('; ')}`,
    `visual_brief: ${payload.visual_brief}`,
    `reference_policy: ${payload.reference_policy}`,
    `acceptance_order: ${payload.acceptance_order.join(' -> ')}`,
    `wrong_subject_action: ${payload.wrong_subject_action}`,
    `essential_image_text: ${payload.allowed_image_text.join(' | ')}`,
    `composition_mode: ${payload.composition_mode}`,
    `historical_low_quality_patterns: ${payload.prohibited_composition_patterns.join(' | ')}`,
    'COMPOSITION CONTRACT: Create a professional, detailed, readable textbook/editorial illustration whose composition fits the story. A central mechanism, multiple interacting layers, or nonlinear feedback are encouraged only when they truthfully improve explanation. Linear flows, card/panel structures, comparisons, taxonomies, layered architectures, and annotated systems are acceptable when they are the clearest story-fit structure and remain sufficiently detailed, integrated, story-specific, and professionally executed.',
    'QUALITY CONTRACT: Reject genuinely sparse, generic, decorative, repetitive, or low-information layouts. Do not reject an image solely because it is linear, panel-based, card-based, or uses a dashboard/system-view metaphor when that structure is appropriate and does not invent unsupported product UI or operational state.',
    'VISIBLE TEXT POLICY: Treat allowed_image_text as essential story-specific labels. Each essential label must be present and readable at least once. Useful duplicates are permitted when they materially improve clarity. Short generic non-factual headings, descriptors, legends, and technical symbols/glyphs are permitted when they do not introduce unsupported factual claims, metrics, identifiers, code, vulnerabilities, filenames, product-specific details, or misleading product UI.',
    'FACTUAL TEXT SAFETY: Unsupported factual prose and invented specifics remain prohibited. Generic technical notation, punctuation, arrows, brackets, digits used decoratively, and symbolic motifs do not fail solely because they are outside allowed_image_text; factual-support review must reject them only when they convey an unsupported claim or specific fact.',
    'HUMAN FIGURES: People or human figures may be used when human workflow, review, collaboration, or adoption is materially relevant. Keep them professional/editorial and do not depict an identifiable real person unless explicitly supported and intended.',
    'low_quality_fallback: prohibited',
    'Generate exactly one illustration for this story. Return only the generated illustration.'
  ].join('\n');
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
