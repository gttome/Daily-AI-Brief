import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileOperationStore,drainOperations,OperationBlocked,operationTimingSummary} from '../lib/durable-operation.mjs';
import {deriveImageProgress,applyDerivedImageProgress,summarizeImagePerformance} from '../lib/edition-execution.mjs';

const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'dab-self-heal-'));
const clock=()=>{let ms=Date.parse('2026-09-30T14:00:00Z');return()=>new Date(ms+=1000).toISOString();};

test('recoverable blocker clears and retries the same safe operation in one drain',async()=>{
  const store=fileOperationStore(temp()),now=clock();let runs=0,resolves=0;
  const r=await drainOperations({store,binding:{job:'self-heal'},now,maxBlockRecoveries:2,steps:[{
    id:'one',retrySafe:true,
    run:async()=>{runs++;if(runs===1)throw new OperationBlocked('TRANSIENT_STATE',{recoverable:true});return {result:'pass'};},
    resolveBlock:async({code})=>{resolves++;assert.equal(code,'TRANSIENT_STATE');return {resolved:true,action:'retry'};}
  }]});
  assert.equal(r.status,'complete');assert.equal(runs,2);assert.equal(resolves,1);
  assert.equal(r.state.events.filter(e=>e.type==='blocker_cleared').length,1);
});

test('uncertain outcome cannot be blindly retried by self-healing',async()=>{
  const store=fileOperationStore(temp()),now=clock();
  await assert.rejects(drainOperations({store,binding:{job:'uncertain'},now,steps:[{
    id:'one',retrySafe:true,
    run:async()=>{throw new OperationBlocked('ACK_UNKNOWN',{recoverable:true,outcomeUnknown:true});},
    resolveBlock:async()=>({resolved:true,action:'retry'})
  }]}),/unsafe_block_retry_requested/);
});

test('operation timing is passive evidence and never a gate',async()=>{
  const store=fileOperationStore(temp()),now=clock();
  const r=await drainOperations({store,binding:{job:'timing'},now,steps:[{id:'one',run:async()=>({result:'pass'})}]});
  const t=operationTimingSummary(r.state);
  assert.ok(t.completed_ms_by_operation.one>0);
  assert.ok(t.total_completed_ms>0);
  assert.equal(r.status,'complete');
});

test('image progress derives accepted count and next attempt from immutable results',()=>{
  const p=deriveImageProgress({selectedCandidateIds:['m02','m01','m08'],resultsByCandidate:{
    m02:[{attempt:1,disposition:'accepted',accepted:true}],
    m01:[{attempt:1,disposition:'quality_rejected',quality_rejected:true,next_attempt_allowed:true}],
    m08:[]
  }});
  assert.equal(p.accepted_images,1);
  assert.deepEqual(p.accepted_candidate_ids,['m02']);
  assert.equal(p.current_candidate_id,'m01');
  assert.equal(p.current_attempt,2);
  assert.equal(p.next_action,'bind_m01_attempt_2');
});

test('bound unresulted attempt is resumed without allocating another attempt',()=>{
  const p=deriveImageProgress({selectedCandidateIds:['m01'],resultsByCandidate:{m01:[]},bindingsByCandidate:{m01:[{
    attempt:1,operation_key:'op-1',generation_started:false
  }]}});
  assert.equal(p.current_attempt,1);
  assert.equal(p.current_operation_key,'op-1');
  assert.equal(p.next_action,'generate_m01_attempt_1_once');
});

test('controller projection is derived cache, not independent accepted count',()=>{
  const state={schema_version:'reliable-edition-controller-state-v1',current_operation:'images',
    task06:{accepted_images:99,status:'wip'}};
  const progress={source:'immutable_attempt_results',status:'wip',accepted_images:2,accepted_candidate_ids:['a','b'],
    current_candidate_id:'c',current_attempt:1,current_operation_key:null,substage:'c_attempt_1_binding_pending',
    next_action:'bind_c_attempt_1'};
  const next=applyDerivedImageProgress(state,progress);
  assert.equal(next.task06.accepted_images,2);
  assert.deepEqual(next.task06.accepted_candidate_ids,['a','b']);
});

test('image performance summary is advisory and reports first-attempt acceptance',()=>{
  const r=summarizeImagePerformance({
    a:[{attempt:1,accepted:true,disposition:'accepted',timing:{elapsed_seconds:20}}],
    b:[{attempt:1,accepted:false,disposition:'quality_rejected'},{attempt:2,accepted:true,disposition:'accepted',timing:{elapsed_seconds:40}}]
  });
  assert.equal(r.attempts_total,3);
  assert.equal(r.accepted_images,2);
  assert.equal(r.first_attempt_acceptance_rate,0.5);
  assert.equal(r.median_accepted_wall_seconds,30);
  assert.equal(r.publication_gate,false);
});
