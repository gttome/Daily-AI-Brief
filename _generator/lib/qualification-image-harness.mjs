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
  if(payload.composition_mode!=='mechanism_rich_textbook_plate')errors.push('composition_mode_must_be_mechanism_rich_textbook_plate');
  if(Array.isArray(payload.prohibited_composition_patterns)){
    const required=['card_grid','dashboard','status_flow','six_panel_icon_strip'];
    for(const pattern of required){if(!payload.prohibited_composition_patterns.includes(pattern))errors.push(`missing_prohibited_composition_pattern_${pattern}`);}
  }
  if(Array.isArray(payload.allowed_image_text)){
    const seen=new Set();
    for(const label of payload.allowed_image_text){
      if(typeof label!=='string'||label.trim()!==label||label.length<1||label.length>80)errors.push('allowed_image_text_label_invalid');
      if(typeof label==='string'&&label.trim().split(/\s+/).length>8)errors.push('allowed_image_text_label_too_long');
      if(seen.has(label))errors.push('allowed_image_text_duplicate');
      seen.add(label);
    }
  }
  if(typeof payload.reference_policy!=='string'||!payload.reference_policy.includes('no other story'))errors.push('reference_policy_must_exclude_other_story_context');
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
    `allowed_image_text: ${payload.allowed_image_text.join(' | ')}`,
    `composition_mode: ${payload.composition_mode}`,
    `prohibited_composition_patterns: ${payload.prohibited_composition_patterns.join(' | ')}`,
    'COMPOSITION CONTRACT: Create a mechanism-rich professional textbook/editorial plate with a central process or mechanism core, multiple interacting visual layers, and causal or functional relationships that extend beyond one straight left-to-right arrow chain. Dense but readable hierarchy is required.',
    'PROHIBITED COMPOSITION: Do not use card grids, dashboards, status flows, six-panel icon strips, isolated icon panels, sparse tile layouts, or simple linear status-chain compositions. Do not satisfy density by adding unapproved text.',
    'VISIBLE TEXT POLICY: Render every exact string listed in allowed_image_text exactly once, and render no other visible text. Do not render the headline unless it is explicitly present in allowed_image_text. Do not omit, duplicate, paraphrase, abbreviate, or add labels. Do not add captions, explanatory prose, summaries, sentences, examples, button text, UI text, or any other words.',
    'low_quality_fallback: prohibited',
    'Generate exactly one illustration for this story. Return only the generated illustration.'
  ].join('\n');
}

export function validateQualificationImageRenderedText(renderedText,allowedImageText){
  const errors=[];
  if(!Array.isArray(renderedText))return ['rendered_text_strings_required'];
  if(!Array.isArray(allowedImageText)||allowedImageText.length<1)return ['allowed_image_text_required'];
  const allowed=new Set(allowedImageText),counts=new Map(allowedImageText.map(label=>[label,0]));
  for(const text of renderedText){
    if(typeof text!=='string'||text.trim()!==text||text.length<1){errors.push('rendered_text_string_invalid');continue;}
    if(!allowed.has(text)){errors.push(`rendered_text_not_allowlisted:${text}`);continue;}
    counts.set(text,(counts.get(text)||0)+1);
  }
  for(const label of allowedImageText){
    const count=counts.get(label)||0;
    if(count===0)errors.push(`rendered_text_missing_required:${label}`);
    if(count>1)errors.push(`rendered_text_duplicate:${label}`);
  }
  return [...new Set(errors)];
}

export function validateImageHarnessAttempt(attempt,{candidateId=null,maxAttempts=2}={}){
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
  for(const result of Array.isArray(summary.story_results)?summary.story_results:[]){
    if(result?.accepted_locked!==true)errors.push(`${result?.candidate_id||'unknown'}_not_accepted_locked`);
  }
  if(summary.accepted_locked_count!==6)errors.push('accepted_locked_count_must_be_six');
  if(summary.status!=='PASS')errors.push('status_must_be_PASS');
  return [...new Set(errors)];
}
