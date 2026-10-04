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

export const STRICT_IMAGE_RENDER_SPEC_POLICY='strict-image-render-spec-v1';

const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const clean=value=>String(value).trim().replace(/\s+/g,' ');
const lower=value=>clean(value).toLowerCase();

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

/**
 * Compile the sealed story packet into the smallest render-only specification.
 * Headline, source URL, story ID, candidate ID and orchestration metadata remain bound
 * in the request object for provenance, but are deliberately excluded from the image
 * prompt so they cannot become accidental visible copy.
 */
export function compileImageRenderSpec(payload){
  const errors=validateQualificationImageWorkerPayload(payload);
  if(errors.length)throw new Error(`invalid_image_worker_payload:${errors.join(',')}`);

  const positive=[
    ...payload.verified_visual_facts,
    ...payload.generic_conceptual_elements,
    payload.visual_brief,
    ...payload.allowed_image_text
  ].map(clean).filter(Boolean);
  const positiveText=lower(positive.join(' | '));
  const conflicts=[];
  for(const item of payload.prohibited_specifics){
    const term=clean(item);
    if(term.length>=4&&positiveText.includes(term.toLowerCase()))conflicts.push(term);
  }
  if(conflicts.length)throw new Error(`render_spec_positive_prohibited_conflict:${conflicts.join('|')}`);

  return Object.freeze({
    schema_version:'1.0.0',
    policy_id:STRICT_IMAGE_RENDER_SPEC_POLICY,
    factual_elements:Object.freeze(payload.verified_visual_facts.map(clean)),
    conceptual_elements:Object.freeze(payload.generic_conceptual_elements.map(clean)),
    visual_brief:clean(payload.visual_brief),
    composition_mode:payload.composition_mode,
    visible_text_allowlist:Object.freeze(payload.allowed_image_text.map(clean)),
    prohibited_specifics:Object.freeze(payload.prohibited_specifics.map(clean)),
    prohibited_composition_patterns:Object.freeze(payload.prohibited_composition_patterns.map(clean)),
    reference_policy:clean(payload.reference_policy),
    acceptance_order:Object.freeze(payload.acceptance_order.map(clean)),
    wrong_subject_action:clean(payload.wrong_subject_action),
    people_policy:'prohibited',
    inherited_context_policy:'prohibited',
    visible_text_policy:'exact_allowlist_only',
    fallback_policy:'prohibited'
  });
}

export function validateImageRenderSpec(spec){
  const errors=[];
  if(!spec||typeof spec!=='object'||Array.isArray(spec))return ['image_render_spec_required'];
  if(spec.schema_version!=='1.0.0'||spec.policy_id!==STRICT_IMAGE_RENDER_SPEC_POLICY)errors.push('image_render_spec_policy_mismatch');
  for(const field of ['factual_elements','conceptual_elements','visible_text_allowlist','prohibited_specifics','prohibited_composition_patterns','acceptance_order']){
    if(!Array.isArray(spec[field])||spec[field].length<1)errors.push(`${field}_required`);
  }
  for(const field of ['visual_brief','composition_mode','reference_policy','wrong_subject_action']){
    if(!nonempty(spec[field]))errors.push(`${field}_required`);
  }
  if(spec.people_policy!=='prohibited')errors.push('people_policy_must_be_prohibited');
  if(spec.inherited_context_policy!=='prohibited')errors.push('inherited_context_policy_must_be_prohibited');
  if(spec.visible_text_policy!=='exact_allowlist_only')errors.push('visible_text_policy_must_be_exact');
  if(spec.fallback_policy!=='prohibited')errors.push('fallback_policy_must_be_prohibited');
  if(Array.isArray(spec.visible_text_allowlist)){
    const seen=new Set();
    for(const label of spec.visible_text_allowlist){
      if(!nonempty(label)||seen.has(label))errors.push('render_spec_visible_text_invalid');
      seen.add(label);
    }
  }
  return [...new Set(errors)];
}

export function buildQualificationImageGenerationInstruction(payload){
  const spec=compileImageRenderSpec(payload);
  const errors=validateImageRenderSpec(spec);
  if(errors.length)throw new Error(`invalid_image_render_spec:${errors.join(',')}`);
  return [
    'RENDER ONLY THIS SEALED STORY SPECIFICATION. Ignore and do not reuse any prior story, image, visual motif, layout, object set, brand, label set, or subject matter.',
    `VISUAL BRIEF: ${spec.visual_brief}`,
    `VERIFIED FACTUAL ELEMENTS: ${spec.factual_elements.join('; ')}`,
    `CONCEPTUAL ELEMENTS: ${spec.conceptual_elements.join('; ')}`,
    `COMPOSITION MODE: ${spec.composition_mode}`,
    `REFERENCE POLICY: ${spec.reference_policy}`,
    `PROHIBITED SPECIFICS: ${spec.prohibited_specifics.join('; ')}`,
    `PROHIBITED COMPOSITION PATTERNS: ${spec.prohibited_composition_patterns.join(' | ')}`,
    `VISIBLE TEXT ALLOWLIST — EXACT: ${spec.visible_text_allowlist.join(' | ')}`,
    'VISIBLE TEXT CONTRACT: Render every allowlisted label legibly at least once and render NO other visible words, letters, numbers, captions, headings, titles, subtitles, slogans, badges, legends, UI text, filenames, metrics, identifiers, or explanatory prose. Do not paraphrase, expand, duplicate, or decorate the allowlisted labels with extra text.',
    'ISOLATION CONTRACT: This image must be derived only from the specification above. Cross-story carryover is a failure. Do not import provider names, product names, architectures, visual metaphors, labels, colors, icons, or mechanisms from any prior image unless explicitly present above.',
    'HUMAN FIGURE CONTRACT: People, faces, bodies, avatars, group/person icons, humanoids, and identifiable real people are prohibited. Represent human workflow concepts with abstract non-human geometry, connectors, containers, or process symbols.',
    'COMPOSITION CONTRACT: Create one professional, high-detail, mechanism-first textbook/editorial illustration on a clean white background. Use the story-fit composition mode above. The mechanism and relationships must dominate the composition; decorative imagery is prohibited.',
    'QUALITY CONTRACT: Reject sparse, generic, decorative, repetitive, cross-story, stock-photo-like, cinematic, dashboard-like, or low-information layouts. No low-quality fallback is permitted.',
    'Generate exactly one illustration. Return only the generated illustration.'
  ].join('\n');
}
