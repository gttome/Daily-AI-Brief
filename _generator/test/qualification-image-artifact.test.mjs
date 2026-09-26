import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQualificationImageArtifactHandoff,validateQualificationImageReviewReceipt,validateSerializedQualificationImageEvents} from '../lib/qualification-image-artifact.mjs';

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
