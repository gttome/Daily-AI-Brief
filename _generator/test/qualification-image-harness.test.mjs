import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_HARNESS_STATES,IMAGE_HARNESS_STORY_ORDER,IMAGE_WORKER_PACKET_KEYS,
  buildQualificationImageWorkerPayload,buildQualificationImageGenerationInstruction,
  validateQualificationImageWorkerPayload,validateImageHarnessAttempt,validateImageHarnessSummary
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
  reference_policy:'use no other story, image, prompt, task, dashboard, qualification status, publication state, scheduler state, repair state, or operational context as visual reference',
  acceptance_order:['candidate/story lineage','subject identity','factual support','structural quality','editorial quality'],
  wrong_subject_action:'discard; do not adapt or transform',
  low_quality_fallback:false,
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

test('worker payload validator rejects orchestration keys',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  payload.harness_id='2026-09-26-IH2';
  payload.parent_conversation='present';
  const errors=validateQualificationImageWorkerPayload(payload);
  assert.ok(errors.includes('prohibited_worker_payload_key_harness_id'));
  assert.ok(errors.includes('prohibited_worker_payload_key_parent_conversation'));
});

test('generation instruction is built only from validated sealed payload',()=>{
  const payload=buildQualificationImageWorkerPayload(sealedPacket);
  const instruction=buildQualificationImageGenerationInstruction(payload);
  assert.match(instruction,/story_id: story-m02/);
  assert.match(instruction,/candidate_id: m02/);
  assert.doesNotMatch(instruction,/IH2/);
  assert.doesNotMatch(instruction,/scheduler_state/);
  assert.doesNotMatch(instruction,/parent_conversation/);
});

test('one accepted harness attempt requires the complete exact-byte state path',()=>{
  const attempt={candidate_id:'m02',attempt:1,states:[...IMAGE_HARNESS_STATES],accepted_locked:true,fallback:false,cross_story_contamination:false,sha256:'a'.repeat(64),git_blob_sha:'deadbeef',width:1200,height:630};
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
