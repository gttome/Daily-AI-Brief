import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQualificationImageArtifactHandoff,validateQualificationImageReviewReceipt} from '../lib/qualification-image-artifact.mjs';

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
