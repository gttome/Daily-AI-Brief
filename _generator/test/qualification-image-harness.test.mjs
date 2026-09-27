import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_HARNESS_STATES,IMAGE_HARNESS_STORY_ORDER,IMAGE_WORKER_PACKET_KEYS,
  buildQualificationImageWorkerPayload,buildQualificationImageGenerationInstruction,
  validateQualificationImageWorkerPayload,validateQualificationImageRenderedText,validateImageHarnessAttempt,validateImageHarnessSummary
} from '../lib/qualification-image-harness.mjs';

const sealedPacket={
  story_id:'story-m02',
  candidate_id:'m02',
  headline:'GitHub Security Lab uses a Taskflow Agent to drive AI-powered fuzzing workflows',
  source_url:'https://github.blog/security/application-security/ai-powered-fuzzing-with-the-github-security-lab-taskflow-agent/',
  verified_visual_facts:['GitHub Security Lab Taskflow Agent','AI-powered fuzzing','fuzzing taskflow','software testing workflow'],
  generic_conceptual_elements:['target software block','generated test-input stream','failure signal','human review gate'],
  prohibited_specifics:['invented vulnerability names','invented code','invented repository files','unsupported exploit results','unsupported product UI'],
  visual_brief:'White-background 1200x630 landscape technical/editorial textbook plate.',
  reference_policy:'Use only frozen evidence phrases above for concrete labels; all other elements must remain generic conceptual symbols.',
  acceptance_order:['candidate/story lineage','subject identity','factual support','structural quality','editorial quality'],
  wrong_subject_action:'discard; do not adapt or transform',
  low_quality_fallback:false,
  allowed_image_text:['Target Software','GitHub Security Lab Taskflow Agent','AI-powered Fuzzing Workflow','Generated Test Inputs','Observed Failure Signal','Review Checkpoint'],
  composition_mode:'mechanism_rich_textbook_plate',
  prohibited_composition_patterns:['card_grid','dashboard','status_flow','six_panel_icon_strip'],
  harness_id:'2026-09-26-IH2',
  scheduler_state:'running'
};

test('worker launcher emits only sealed story packet keys',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  assert.deepEqual(Object.keys(payload),IMAGE_WORKER_PACKET_KEYS);
  assert.equal('harness_id' in payload,false);
  assert.equal('scheduler_state' in payload,false);
  assert.deepEqual(validateQualificationImageWorkerPayload(payload),[]);
});

test('worker payload validator accepts frozen reference policy but rejects orchestration keys',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  assert.deepEqual(validateQualificationImageWorkerPayload(payload),[]);
  payload.harness_id='2026-09-26-IH2';
  payload.parent_conversation='present';
  payload.other_story_context='present';
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('prohibited_worker_payload_key_harness_id'));
  assert.ok(errors.includes('prohibited_worker_payload_key_parent_conversation'));
  assert.ok(errors.includes('prohibited_worker_payload_key_other_story_context'));
});

test('generation instruction is built only from validated sealed payload',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  const instruction=buildQualificationImageGenerationInstruction(payload);
  assert.match(instruction,/story_id: story-m02/);
  assert.match(instruction,/candidate_id: m02/);
  assert.doesNotMatch(instruction,/IH2/);
  assert.doesNotMatch(instruction,/scheduler_state/);
  assert.doesNotMatch(instruction,/parent_conversation/);
  assert.match(instruction,/VISIBLE TEXT POLICY/);
  assert.match(instruction,/Review Checkpoint/);
  assert.match(instruction,/composition_mode: mechanism_rich_textbook_plate/);
  assert.match(instruction,/central process or mechanism core/);
  assert.match(instruction,/Do not use card grids, dashboards, status flows, six-panel icon strips/);
});

test('rendered image text must exactly equal the allowlist set',()=>{
  const allowed=['Target Software','Generated Test Inputs','Observed Failure Signal'];
  assert.deepEqual(validateQualificationImageRenderedText([...allowed],allowed),[]);
  const missing=validateQualificationImageRenderedText(['Target Software','Observed Failure Signal'],allowed);
  assert.ok(missing.includes('required_rendered_text_missing:Generated Test Inputs'));
  const extra=validateQualificationImageRenderedText([...allowed,'Runs tests and analyzes results'],allowed);
  assert.ok(extra.includes('rendered_text_not_allowlisted:Runs tests and analyzes results'));
  const duplicate=validateQualificationImageRenderedText(['Target Software','Generated Test Inputs','Observed Failure Signal','Observed Failure Signal'],allowed);
  assert.ok(duplicate.includes('rendered_text_duplicate:Observed Failure Signal'));
});

test('worker payload rejects prose-like allowlist labels that exceed the bounded label size',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.allowed_image_text=['This explanatory sentence is much too long to be an approved image label'];
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('allowed_image_text_label_too_long'));
});

test('one accepted harness attempt requires the complete exact-byte state path',()=>{
  const attempt={candidate_id:'m02',attempt:1,states:[...IMAGE_HARNESS_STATES],accepted_locked:true,fallback:false,cross_story_contamination:false,sha256:'a'.repeat(64),git_blob_sha:'deadbeef',width:1200,height:630,allowed_image_text:['Target Software'],rendered_text_strings:['Target Software']};
  assert.deepEqual(validateImageHarnessAttempt(attempt,{candidateId:'m02'}),[]);
});

test('accepted harness attempt fails if subject-lineage proof is skipped',()=>{
  const states=IMAGE_HARNESS_STATES.filter(x=>x!=='SUBJECT_LINEAGE_PASS');
  const attempt={candidate_id:'m02',attempt:1,states,accepted_locked:true,fallback:false,cross_story_contamination:false,sha256:'a'.repeat(64),git_blob_sha:'deadbeef',width:1200,height:630};
  assert.ok(validateImageHarnessAttempt(attempt).includes('accepted_locked_missing_SUBJECT_LINEAGE_PASS'));
});

test('six-story harness PASS requires exact fixed order and 6/6 accepted_locked',()=>{
  const summary={status:'PASS',production_mutation:false,work_usage:0,codex_usage:0,paid_api_usage:0,fallback_used:false,cross_story_contamination_count:0,accepted_locked_count:6,story_results:IMAGE_HARNESS_STORY_ORDER.map(candidate_id=>({candidate_id,accepted_locked:true}))};
  assert.deepEqual(validateImageHarnessSummary(summary),[]);
});


test('worker payload requires mechanism-rich textbook composition mode',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.composition_mode='card_grid';
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('composition_mode_must_be_mechanism_rich_textbook_plate'));
});

test('worker payload requires all sparse-layout prohibitions',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.prohibited_composition_patterns=['card_grid','dashboard'];
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('missing_prohibited_composition_pattern_status_flow'));
  assert.ok(errors.includes('missing_prohibited_composition_pattern_six_panel_icon_strip'));
});

test('composition hardening preserves exact visible-text allowlist policy',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  const instruction=buildQualificationImageGenerationInstruction(payload);
  assert.match(instruction,/VISIBLE TEXT POLICY: Render every string in allowed_image_text exactly once/);
  assert.match(instruction,/Do not satisfy density by adding unapproved text/);
  assert.deepEqual(validateQualificationImageRenderedText([...payload.allowed_image_text],payload.allowed_image_text),[]);
});


test('reference policy presence is required without magic phrase matching',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.reference_policy='   ';
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('reference_policy_required'));
});
