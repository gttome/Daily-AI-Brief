import test from 'node:test';
import assert from 'node:assert/strict';
import {IMAGE_HARNESS_STATES,IMAGE_HARNESS_STORY_ORDER,validateImageHarnessAttempt,validateImageHarnessSummary} from '../lib/qualification-image-harness.mjs';

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
