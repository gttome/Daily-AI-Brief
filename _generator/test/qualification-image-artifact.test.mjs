import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQualificationImageArtifactHandoff,validateQualificationImageReviewReceipt,validateSerializedQualificationImageEvents,validateQualificationImageWorkerContextReceipt} from '../lib/qualification-image-artifact.mjs';

test('durable Library artifact handoff requires stable lineage and exact-file metadata',()=>{
  const receipt={story_id:'story-m01',candidate_id:'m01',library_file_id:'libfile_abc',file_id:'file_abc',current_version_number:1,library_path:'/Daily AI Brief Qualification Images/m01/output.png',mime_type:'image/png',size_bytes:123456};
  assert.deepEqual(validateQualificationImageArtifactHandoff(receipt,{storyId:'story-m01',candidateId:'m01'}),[]);
});

test('ephemeral-only image handoff fails closed',()=>{
  const receipt={story_id:'story-m01',candidate_id:'m01',file_id:'file_abc',mime_type:'image/png',size_bytes:123456,ephemeral_only:true};
  const errors=validateQualificationImageArtifactHandoff(receipt,{storyId:'story-m01',candidateId:'m01'});
  assert.ok(errors.includes('missing_library_file_id'));
  assert.ok(errors.includes('durable_library_file_id_required'));
  assert.ok(errors.includes('ephemeral_only_prohibited'));
});

test('accepted image review requires raw-byte hash, all visual gates, and exact Git persistence',()=>{
  const receipt={story_id:'story-m01',candidate_id:'m01',library_file_id:'libfile_abc',sha256:'a'.repeat(64),width:1731,height:909,git_blob_sha:'deadbeef',subject_identity:'pass',factual_support:'pass',structural_quality:'pass',editorial_quality:'pass',fallback:false,exact_bytes_persisted:true,accepted_locked:true};
  assert.deepEqual(validateQualificationImageReviewReceipt(receipt),[]);
});


test('serial image event guard rejects overlapping or cross-story starts',()=>{
  const order=['m02','m04','m06','m07','m01','m08'];
  const bad=[
    {type:'worker_started',candidate_id:'m02'},
    {type:'worker_started',candidate_id:'m04'}
  ];
  const errors=validateSerializedQualificationImageEvents(bad,order);
  assert.ok(errors.some(x=>x.includes('overlapping_worker')));
  assert.ok(errors.some(x=>x.includes('out_of_order_start')));
});

test('serial image event guard accepts generate-capture-review-persist-terminal before next story',()=>{
  const order=['m02','m04','m06','m07','m01','m08'];
  const events=[
    {type:'worker_started',candidate_id:'m02'},
    {type:'library_captured',candidate_id:'m02'},
    {type:'worker_exited',candidate_id:'m02'},
    {type:'review_completed',candidate_id:'m02'},
    {type:'git_persisted',candidate_id:'m02'},
    {type:'story_terminal',candidate_id:'m02',status:'accepted_locked'},
    {type:'worker_started',candidate_id:'m04'},
    {type:'library_captured',candidate_id:'m04'},
    {type:'worker_exited',candidate_id:'m04'},
    {type:'review_completed',candidate_id:'m04'},
    {type:'git_persisted',candidate_id:'m04'},
    {type:'story_terminal',candidate_id:'m04',status:'accepted_locked'}
  ];
  assert.deepEqual(validateSerializedQualificationImageEvents(events,order),[]);
});


test('image worker context receipt requires a fresh sealed-packet-only execution context',()=>{
  const packetSha='b'.repeat(64);
  const receipt={
    story_id:'story-m02',
    candidate_id:'m02',
    packet_sha256:packetSha,
    fresh_execution_context:true,
    generation_instruction_source:'sealed_story_packet_only',
    visible_context_classes:['sealed_story_packet'],
    other_story_context_present:false,
    operational_context_present:false,
    prior_image_worker_history_present:false,
    parent_conversation_history_present:false,
    reused_execution_context:false,
    context_attested_before_generation:true
  };
  assert.deepEqual(validateQualificationImageWorkerContextReceipt(receipt,{storyId:'story-m02',candidateId:'m02',packetSha256:packetSha}),[]);
});

test('image worker context receipt fails closed when inherited or other-story context is visible',()=>{
  const packetSha='c'.repeat(64);
  const receipt={
    story_id:'story-m02',
    candidate_id:'m02',
    packet_sha256:packetSha,
    fresh_execution_context:false,
    generation_instruction_source:'mixed_parent_context',
    visible_context_classes:['sealed_story_packet','other_story_prompt','qualification_status'],
    other_story_context_present:true,
    operational_context_present:true,
    prior_image_worker_history_present:true,
    parent_conversation_history_present:true,
    reused_execution_context:true,
    context_attested_before_generation:true
  };
  const errors=validateQualificationImageWorkerContextReceipt(receipt,{storyId:'story-m02',candidateId:'m02',packetSha256:packetSha});
  assert.ok(errors.includes('fresh_execution_context_required'));
  assert.ok(errors.includes('sealed_story_packet_only_required'));
  assert.ok(errors.includes('prohibited_visible_context_other_story_prompt'));
  assert.ok(errors.includes('prohibited_visible_context_qualification_status'));
  assert.ok(errors.includes('other_story_context_prohibited'));
  assert.ok(errors.includes('operational_context_prohibited'));
  assert.ok(errors.includes('prior_image_worker_history_prohibited'));
  assert.ok(errors.includes('parent_conversation_history_prohibited'));
  assert.ok(errors.includes('reused_execution_context_prohibited'));
});
