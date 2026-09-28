// Shared production and qualification story-only input policy.
export const IMAGE_WORKER_PACKET_KEYS=[
  'story_id','candidate_id','headline','source_url','verified_visual_facts',
  'generic_conceptual_elements','prohibited_specifics','visual_brief','reference_policy',
  'acceptance_order','wrong_subject_action','low_quality_fallback','allowed_image_text','composition_mode','prohibited_composition_patterns'
];

export const APPROVED_COMPOSITION_MODES=[
  'mechanism_rich_textbook_plate','linear_flow','layered_architecture','comparison',
  'taxonomy','annotated_system','panel_based_explanation','story_fit_editorial'
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

