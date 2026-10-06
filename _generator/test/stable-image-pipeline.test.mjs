import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStableImageOperation,transitionStableImageOperation,stableImageStateFromResult,
  buildAcceptedImageTaskTransition,emitAcceptedImageTaskTransition,stableImagePipelineMetrics,
  STABLE_IMAGE_OPERATION_STATES
} from '../lib/stable-image-pipeline.mjs';

const base=()=>createStableImageOperation({
  execution_id:'reliable-edition-20261007-run11',edition_id:'dab-edition-2026-10-07',
  task_id:'11',candidate_id:'m01',request_key:'req-m01',created_at:'2026-10-07T01:00:00Z'
});
const accepted=(candidate='m01',task='11')=>({
  status:'accepted_locked',candidate_id:candidate,attempt:1,
  review:{reviewed_at:'2026-10-07T01:04:00Z'},
  persistence:{path:`briefs/images/2026-10-07/${candidate}.png`,sha256:'a'.repeat(64),git_blob_sha:'b'.repeat(40),persisted_at:'2026-10-07T01:03:00Z',read_back_verified:true}
});

test('canonical state set exactly covers admission through done',()=>{
  assert.deepEqual(STABLE_IMAGE_OPERATION_STATES,[
    'QUEUED','ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED',
    'READBACK_VERIFIED','REVIEWING','ACCEPTED_LOCKED','REJECTED_QUALITY',
    'BLOCKED_INFRASTRUCTURE','DONE'
  ]);
});

test('happy path is one legal operation with no wake PR',()=>{
  let o=base();
  for(const state of ['ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED','READBACK_VERIFIED','REVIEWING','ACCEPTED_LOCKED','DONE'])
    o=transitionStableImageOperation(o,state,{at:new Date(Date.parse(o.updated_at)+1000).toISOString()});
  assert.equal(o.generation_attempts,1);
  assert.equal(o.infrastructure_failures,0);
  assert.equal(o.accepted_locked,true);
  assert.equal(o.wake_pr_required,false);
});

test('admission failure consumes zero generation attempts',()=>{
  let o=transitionStableImageOperation(base(),'ADMISSION_CHECK',{at:'2026-10-07T01:00:01Z'});
  o=transitionStableImageOperation(o,'BLOCKED_INFRASTRUCTURE',{at:'2026-10-07T01:00:02Z'});
  assert.equal(o.generation_attempts,0);
  assert.equal(o.infrastructure_failures,1);
});

test('transport infrastructure recovery resumes same generation attempt',()=>{
  let o=base();
  for(const s of ['ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED'])o=transitionStableImageOperation(o,s,{at:new Date(Date.parse(o.updated_at)+1000).toISOString()});
  o=transitionStableImageOperation(o,'BLOCKED_INFRASTRUCTURE',{at:'2026-10-07T01:00:10Z'});
  o=transitionStableImageOperation(o,'PERSISTED',{at:'2026-10-07T01:00:11Z'});
  assert.equal(o.generation_attempts,1);
  assert.equal(o.infrastructure_failures,1);
});

test('quality rejection alone permits bounded regeneration',()=>{
  let o=base();
  for(const s of ['ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED','READBACK_VERIFIED','REVIEWING','REJECTED_QUALITY'])
    o=transitionStableImageOperation(o,s,{at:new Date(Date.parse(o.updated_at)+1000).toISOString()});
  o=transitionStableImageOperation(o,'GENERATING',{at:'2026-10-07T01:00:20Z'});
  assert.equal(o.generation_attempts,2);
  assert.equal(o.quality_rejections,1);
  assert.equal(o.infrastructure_failures,0);
});

test('accepted saved bytes emit deterministic next-transition with no wake',async()=>{
  const args={execution_id:'reliable-edition-20261007-run11',edition_id:'dab-edition-2026-10-07',task_id:'11',
    request_key:'req-m01',candidate_id:'m01',result:accepted(),writer_generation:4};
  const a=buildAcceptedImageTaskTransition(args),b=buildAcceptedImageTaskTransition(args);
  assert.deepEqual(a,b);
  assert.equal(a.from,'Active');assert.equal(a.to,'Done');
  assert.equal(a.wake_pr_required,false);
  const seen=[];const emitted=await emitAcceptedImageTaskTransition(args,{eventSink:async e=>seen.push(e),requireSink:true});
  assert.equal(emitted.emitted,true);assert.deepEqual(seen,[a]);
});

test('six sequential accepted fixtures require zero wake PRs',async()=>{
  const events=[];
  for(let i=0;i<6;i++){
    const id=String(11+i),candidate='m'+String(i+1).padStart(2,'0'),result=accepted(candidate,id);
    await emitAcceptedImageTaskTransition({
      execution_id:'synthetic-p1p2-rehearsal',edition_id:'dab-rehearsal-p1p2',task_id:id,
      request_key:'req-'+candidate,candidate_id:candidate,result,writer_generation:9
    },{eventSink:async e=>events.push(e),requireSink:true});
  }
  assert.equal(events.length,6);
  assert.equal(events.every(x=>x.wake_pr_required===false&&x.owner_liveness_prompt_required===false),true);
  assert.deepEqual(events.map(x=>x.task_id),['11','12','13','14','15','16']);
});

test('duplicate accepted delivery keeps identical transition identity',()=>{
  const args={execution_id:'run',edition_id:'edition',task_id:'16',request_key:'r',candidate_id:'m06',result:accepted('m06','16'),writer_generation:2};
  assert.equal(buildAcceptedImageTaskTransition(args).image_transition_key,buildAcceptedImageTaskTransition(args).image_transition_key);
});

test('locked target with different bytes cannot masquerade as same transition',()=>{
  const args={execution_id:'run',edition_id:'edition',task_id:'16',request_key:'r',candidate_id:'m06',result:accepted('m06','16'),writer_generation:2};
  const a=buildAcceptedImageTaskTransition(args);
  const changed=structuredClone(args);changed.result.persistence.sha256='c'.repeat(64);
  const b=buildAcceptedImageTaskTransition(changed);
  assert.notEqual(a.image_transition_key,b.image_transition_key);
});

test('result projection separates quality from infrastructure faults',()=>{
  assert.equal(stableImageStateFromResult({quality_rejected:true,blocker:'IMAGE_QUALITY_REJECTED'}),'REJECTED_QUALITY');
  assert.equal(stableImageStateFromResult({status:'CAPABILITY_BLOCKED_DURABLE_STORE_REQUIRED'}),'BLOCKED_INFRASTRUCTURE');
  assert.equal(stableImageStateFromResult(accepted()),'DONE');
});

test('metrics prove no wake or owner-liveness path',()=>{
  const results=Array.from({length:6},(_,i)=>({...accepted('m0'+(i+1)),pipeline:{generation_attempts:1,infrastructure_failures:i===2?1:0}}));
  const m=stableImagePipelineMetrics(results);
  assert.equal(m.accepted_images,6);assert.equal(m.wake_prs,0);assert.equal(m.owner_liveness_prompts,0);
  assert.equal(m.image_infrastructure_failures,1);assert.equal(m.image_regenerations,0);
});
