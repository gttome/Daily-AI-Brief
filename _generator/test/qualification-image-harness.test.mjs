import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_HARNESS_STATES,IMAGE_HARNESS_STORY_ORDER,IMAGE_WORKER_PACKET_KEYS,APPROVED_COMPOSITION_MODES,
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

test('generation instruction keeps factual boundaries but allows story-fit composition',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  const instruction=buildQualificationImageGenerationInstruction(payload);
  assert.match(instruction,/story_id: story-m02/);
  assert.doesNotMatch(instruction,/IH2/);
  assert.match(instruction,/professional, detailed, readable textbook\/editorial illustration/);
  assert.match(instruction,/Linear flows, card\/panel structures, comparisons, taxonomies/);
  assert.match(instruction,/Short generic non-factual headings, descriptors, legends, and technical symbols\/glyphs are permitted/);
  assert.match(instruction,/Unsupported factual prose and invented specifics remain prohibited/);
});

test('approved composition archetypes are accepted',()=>{
  for (const mode of APPROVED_COMPOSITION_MODES) {
    const payload=buildQualificationImageWorkerPayload({...sealedPacket,composition_mode:mode});
    assert.deepEqual(validateQualificationImageWorkerPayload(payload),[]);
  }
  const payload=buildQualificationImageWorkerPayload({...sealedPacket,composition_mode:'decorative_collage'});
  assert.ok(validateQualificationImageWorkerPayload(payload).includes('composition_mode_not_approved'));
});

test('essential labels must appear but useful duplicates and bounded generic labels may appear',()=>{
  const essential=['Target Software','AI-powered Fuzzing Workflow'];
  assert.deepEqual(validateQualificationImageRenderedText(
    ['Target Software','AI-powered Fuzzing Workflow','Review','</>','Target Software'],
    essential
  ),[]);
  const missing=validateQualificationImageRenderedText(['Target Software','Review'],essential);
  assert.ok(missing.includes('required_rendered_text_missing:AI-powered Fuzzing Workflow'));
});

test('unbounded visible prose still fails deterministic text hygiene',()=>{
  const essential=['Target Software'];
  const long='This is an intentionally very long explanatory sentence that exceeds the bounded generic label policy and should not be accepted as ordinary image microcopy';
  const errors=validateQualificationImageRenderedText(['Target Software',long],essential);
  assert.ok(errors.some(x=>x.startsWith('rendered_text_unbounded:')));
});

test('worker payload rejects prose-like essential labels that exceed bounded label size',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.allowed_image_text=['This explanatory sentence is much too long to be an approved image label'];
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('allowed_image_text_label_too_long'));
});

test('one accepted harness attempt requires the complete exact-byte state path',()=>{
  const attempt={candidate_id:'m02',attempt:1,states:[...IMAGE_HARNESS_STATES],accepted_locked:true,fallback:false,cross_story_contamination:false,sha256:'a'.repeat(64),git_blob_sha:'deadbeef',width:1200,height:630,allowed_image_text:['Target Software'],rendered_text_strings:['Target Software','</>']};
  assert.deepEqual(validateImageHarnessAttempt(attempt,{candidateId:'m02'}),[]);
});

test('accepted harness attempt fails if subject-lineage proof is skipped',()=>{
  const states=IMAGE_HARNESS_STATES.filter(x=>x!=='SUBJECT_LINEAGE_PASS');
  const attempt={candidate_id:'m02',attempt:1,states,accepted_locked:true,fallback:false,cross_story_contamination:false,sha256:'a'.repeat(64),git_blob_sha:'deadbeef',width:1200,height:630,allowed_image_text:['Target Software'],rendered_text_strings:['Target Software']};
  assert.ok(validateImageHarnessAttempt(attempt).includes('accepted_locked_missing_SUBJECT_LINEAGE_PASS'));
});

test('bounded generation attempts increase to four',()=>{
  const base={candidate_id:'m02',states:['PACKET_READY'],accepted_locked:false};
  assert.deepEqual(validateImageHarnessAttempt({...base,attempt:4}),[]);
  assert.ok(validateImageHarnessAttempt({...base,attempt:5}).includes('attempt_out_of_bounds'));
});

test('six-story final PASS still requires exact fixed order and 6/6 accepted_locked',()=>{
  const summary={status:'PASS',production_mutation:false,work_usage:0,codex_usage:0,paid_api_usage:0,fallback_used:false,cross_story_contamination_count:0,accepted_locked_count:6,story_results:IMAGE_HARNESS_STORY_ORDER.map(candidate_id=>({candidate_id,accepted_locked:true}))};
  assert.deepEqual(validateImageHarnessSummary(summary),[]);
});

test('qualification may advance with exactly one isolated remediation lane while final publication still requires six',()=>{
  const story_results=IMAGE_HARNESS_STORY_ORDER.map((candidate_id,i)=>({candidate_id,accepted_locked:i<5}));
  const summary={status:'QUALIFICATION_ADVANCE_WITH_REMEDIATION',isolated_remediation_lane:true,production_mutation:false,work_usage:0,codex_usage:0,paid_api_usage:0,fallback_used:false,cross_story_contamination_count:0,accepted_locked_count:5,story_results};
  assert.deepEqual(validateImageHarnessSummary(summary),[]);
  assert.ok(validateImageHarnessSummary({...summary,isolated_remediation_lane:false}).includes('isolated_remediation_lane_required'));
});

test('reference policy presence remains required without magic phrase matching',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.reference_policy='   ';
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('reference_policy_required'));
});
