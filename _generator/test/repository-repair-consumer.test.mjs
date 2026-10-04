import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queuedRepositoryRepairDecision,
  buildImageEngineeringRepairReceipt,
  knownGoodTransportProof,
  selectKnownGoodTransportProof,
  REQUIRED_IMAGE_REPAIR_PROOFS
} from '../lib/repository-repair-consumer.mjs';

const request={
  schema_version:'run-engineering-repair-request-v1',request_kind:'engineering_repair',
  request_key:'a'.repeat(64),execution_id:'reliable-edition-20261001-run4',
  edition_id:'dab-edition-2026-10-01',branch:'reliable-edition/dab-edition-2026-10-01-run4',
  task_id:'15',capability:'repository',repair_epoch:1,required_proofs:[...REQUIRED_IMAGE_REPAIR_PROOFS],
  created_at:'2026-10-02T00:14:13Z',status:'queued'
};
const contract={engineering_repair:{enabled:true,capability:'repository',
  post_repair_operation:'Execute exactly one fresh-context post-repair image attempt using only the sealed single-story specification; no people, avatar, humanoid primitives.'}};
const transport={status:'accepted_locked',candidate:{method:'same-visual 32-color PNG transport optimization'},
  persistence:{path:'briefs/images/2026-10-01/x.png',git_blob_sha:'b'.repeat(40),content_address_verified:true,read_back_verified:true},
  review:{low_quality_fallback:false}};
const ci={run_id:123,control_sha:'c'.repeat(40),conclusion:'success'};
const learning=['queued_action_without_consumer_is_not_progress','repository_repair_request_must_have_active_consumer','fresh_single_story_image_worker_after_context_mismatch'];

test('queued repository repair executes in the active control loop',()=>{
  const d=queuedRepositoryRepairDecision({request,now:'2026-10-02T00:14:14Z',active_consumer:true});
  assert.equal(d.action,'execute_now');
});
test('queued repository repair without a consumer becomes a liveness defect by one interval',()=>{
  const d=queuedRepositoryRepairDecision({request,now:'2026-10-02T00:15:14Z',supervisor_interval_ms:60000,active_consumer:false});
  assert.equal(d.action,'liveness_defect');assert.equal(d.reason,'queued_action_without_consumer_is_not_progress');
});
test('image engineering repair proves isolation, non-human imagery, final PNG identity, protected CI and learning',()=>{
  const r=buildImageEngineeringRepairReceipt({request,taskContract:contract,transportAttempt:transport,protectedCi:ci,learningInvariants:learning,consumerWriterGeneration:4,consumedAt:'2026-10-02T01:00:00Z'});
  assert.equal(r.result,'PASS');assert.equal(r.epoch.required_proofs_passed,true);
  assert.equal(r.epoch.post_repair_attempts,0);
  for(const proof of REQUIRED_IMAGE_REPAIR_PROOFS) assert.equal(r.proofs[proof].result,'PASS');
});


test('known-good transport evidence is selected by proof properties rather than current execution identity',()=>{
  const valid={...transport,accepted_at:'2026-10-01T21:55:58Z'};
  const invalid={...transport,status:'rejected',review_status:'rejected'};
  assert.equal(knownGoodTransportProof(valid),true);
  assert.equal(knownGoodTransportProof(invalid),false);
  const selected=selectKnownGoodTransportProof([
    {path:'older.json',record:{...valid,accepted_at:'2026-09-30T20:00:00Z'}},
    {path:'newer.json',record:valid},
    {path:'invalid.json',record:invalid}
  ]);
  assert.equal(selected.path,'newer.json');
});
