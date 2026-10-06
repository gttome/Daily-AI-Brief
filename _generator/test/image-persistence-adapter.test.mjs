import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_PERSISTENCE_MODES,assertNormalizedAcceptedImageEvidence,buildPersistenceCompatibilityMatrix,
  validatePersistenceCompatibilityMatrix
} from '../lib/image-persistence-adapter.mjs';

const H='a'.repeat(64),B='b'.repeat(40);
function fixture(mode,{candidate='m01',execution='run-x',edition='edition-x'}={}){
  const path='briefs/images/fixture/'+candidate+'.png',reviewed='2026-10-07T01:05:00Z';
  const source={path,sha256:H,git_blob_sha:B,width:1200,height:630,bytes:1000,low_quality_fallback:false,svg_fallback:false};
  const attempt={execution_id:execution,edition_id:edition,task_id:'11',candidate_id:candidate,disposition:'ACCEPTED_LOCKED',generated_at:'2026-10-07T01:00:00Z'};
  if(mode==='normalization')attempt.normalization={...source,normalized_at:'2026-10-07T01:02:00Z',same_visual:true,exact_readback:'PASS_GIT_OBJECT_SHA'};
  if(mode==='native_capture')attempt.native_capture={...source,persisted:true,exact_readback:'PASS_GIT_OBJECT_SHA'};
  if(mode==='protected_exact_byte_transport')attempt.native_capture={...source,persisted:true,exact_readback:'PASS_PROTECTED_CHUNK_BRIDGE',transport_receipt:'_records/transport.json'};
  if(mode==='stable_exact_persistence')attempt.persistence={...source,read_back_verified:true,persisted_at:'2026-10-07T01:02:00Z'};
  const review={execution_id:execution,edition_id:edition,task_id:'11',candidate_id:candidate,reviewed_at:reviewed,accepted_locked:true,result:'PASS',
    final:{path,sha256:H,git_blob_sha:B,exact_readback:'PASS_GIT_OBJECT_SHA'},
    visual_review:{result:'PASS',professional_quality:true,story_specific:true,detailed:true,legibility:'PASS',no_people_or_humanoids:true,artifacts_or_corruption:false,context_contamination:false}};
  const lock={schema_version:'image-acceptance-lock-v1',execution_id:execution,edition_id:edition,task_id:'11',candidate_id:candidate,
    accepted_locked:true,immutable:true,quality_gate:'PASS',visible_text_guard:'PASS',accepted_at:reviewed,attempt_receipt:'attempt.json',saved_git_review:'review.json',
    final:{path,sha256:H,git_blob_sha:B,width:1200,height:630,bytes:1000}};
  return {lock,attempt,review,expected:{execution_id:execution,edition_id:edition,candidate_id:candidate}};
}

test('registry covers native, normalization, protected transport and stable exact persistence',()=>{
  assert.deepEqual(IMAGE_PERSISTENCE_MODES,['native_capture','normalization','protected_exact_byte_transport','stable_exact_persistence']);
  for(const mode of IMAGE_PERSISTENCE_MODES)assert.equal(assertNormalizedAcceptedImageEvidence(fixture(mode)).persistence_mode,mode);
});

test('mixed persistence compatibility matrix passes every Task 17 dimension',()=>{
  const fixtures=Object.fromEntries(IMAGE_PERSISTENCE_MODES.map((mode,i)=>[mode,fixture(mode,{candidate:'m0'+(i+1)})]));
  const matrix=buildPersistenceCompatibilityMatrix(fixtures);
  assert.equal(matrix.result,'PASS');
  assert.deepEqual(validatePersistenceCompatibilityMatrix(matrix),[]);
});

for(const [label,mutate,needle] of [
  ['altered SHA',x=>x.lock.final.sha256='c'.repeat(64),'final_sha_bound'],
  ['wrong candidate',x=>x.expected.candidate_id='other','expected_candidate'],
  ['wrong execution',x=>x.expected.execution_id='other','expected_execution'],
  ['missing saved-Git review',x=>x.review.accepted_locked=false,'saved_git_reviewed'],
  ['stale review',x=>x.review.reviewed_at='2026-10-06T23:00:00Z','review_not_stale'],
  ['exact readback failure',x=>{x.attempt.native_capture.exact_readback='FAIL';x.review.final.exact_readback='FAIL';},'exact_readback']
]) test(label+' is rejected before Task 17 can pass',()=>{
  const x=fixture('native_capture');mutate(x);
  assert.throws(()=>assertNormalizedAcceptedImageEvidence(x),new RegExp(needle));
});

test('omitting any registered persistence adapter fails pre-run compatibility',()=>{
  const fixtures=Object.fromEntries(IMAGE_PERSISTENCE_MODES.slice(0,-1).map(mode=>[mode,fixture(mode)]));
  const matrix=buildPersistenceCompatibilityMatrix(fixtures);
  assert.equal(matrix.result,'FAIL');
  assert.ok(validatePersistenceCompatibilityMatrix(matrix).some(x=>x.includes('stable_exact_persistence')));
});

test('same accepted set normalizes deterministically across duplicate Task 17 invocation',()=>{
  const a=assertNormalizedAcceptedImageEvidence(fixture('protected_exact_byte_transport'));
  const b=assertNormalizedAcceptedImageEvidence(fixture('protected_exact_byte_transport'));
  assert.deepEqual(a,b);
});
