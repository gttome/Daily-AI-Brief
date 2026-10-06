import test from 'node:test';
import assert from 'node:assert/strict';
import {
  substantiveTransition,buildCanonicalTransitionEvent,dispatchTransitionEvent,
  compactWatchdogDecision,transitionFailureFingerprint
} from '../lib/transition-dispatcher.mjs';

const raw={task_id:'16',from:'Active',to:'Done',at:'2026-10-07T03:00:00Z',request_key:'req-16'};
const contracts={'17':{capability:'repository',normal_operation:'Review the exact accepted image set.'}};
const event=()=>buildCanonicalTransitionEvent({
  raw,execution_id:'reliable-edition-20261007-run11',edition_id:'dab-edition-2026-10-07',
  writer_generation:7,content_state:{result_sha:'a'.repeat(40)},next_task_contract:contracts['17'],next_task_id:'17'
});

test('one durable transition dispatches the next worker exactly once',()=>{
  const first=dispatchTransitionEvent({event:event(),task_contracts:contracts,branch:'reliable-edition/dab-edition-2026-10-07-run11'});
  assert.equal(first.status,'DISPATCHED');
  assert.equal(first.request.task_id,'17');
  const second=dispatchTransitionEvent({event:event(),task_contracts:contracts,branch:'reliable-edition/dab-edition-2026-10-07-run11',existing_dispatches:[first.record]});
  assert.equal(second.status,'ALREADY_CONSUMED');
  assert.equal(second.request,null);
});

test('duplicate event bytes reconstruct the identical idempotency key after restart',()=>{
  const a=event(),b=event();
  assert.equal(a.idempotency_key,b.idempotency_key);
  assert.equal(a.content_state_digest,b.content_state_digest);
});

test('result survives writer expiry because dispatch identity is bound to durable transition state',()=>{
  const before=event();
  const after=buildCanonicalTransitionEvent({
    raw,execution_id:before.execution_id,edition_id:before.edition_id,writer_generation:7,
    content_state:{result_sha:'a'.repeat(40)},next_task_contract:contracts['17'],next_task_id:'17'
  });
  assert.equal(after.idempotency_key,before.idempotency_key);
});

test('heartbeat and unchanged health are never substantive progress',()=>{
  assert.equal(substantiveTransition({task_id:'16',from:'Active',to:'Active',at:'2026-10-07T03:01:00Z',event_type:'heartbeat'}),false);
  assert.equal(substantiveTransition({task_id:'16',from:'Active',to:'Done',at:'2026-10-07T03:01:00Z'}),true);
});

test('healthy Watchdog path is compact and does not steal a progressing worker',()=>{
  assert.deepEqual(compactWatchdogDecision({worker_progressing:true}),{action:'COMPACT_EXIT',expanded_read:false,reason:'worker_substantively_progressing'});
  assert.deepEqual(compactWatchdogDecision({event_consumed:true}),{action:'COMPACT_EXIT',expanded_read:false,reason:'transition_consumed'});
});

test('failed consumer recovers the exact transition rather than the whole task',()=>{
  const d=compactWatchdogDecision({stalled:true,recovery_action:'resume transition '+event().idempotency_key});
  assert.equal(d.action,'RECOVER_EXACT_TRANSITION');
  assert.equal(d.expanded_read,true);
});

test('failure fingerprints are stable for strategy-interrupt accounting',()=>{
  const a=transitionFailureFingerprint({event:event(),operation_type:'dispatch',error_class:'consumer_timeout',contract_version:'v1'});
  const b=transitionFailureFingerprint({event:event(),operation_type:'dispatch',error_class:'consumer_timeout',contract_version:'v1'});
  assert.equal(a,b);
});

test('terminal Task 29 Done emits no further dispatch',()=>{
  const terminal=buildCanonicalTransitionEvent({
    raw:{task_id:'29',from:'Active',to:'Done',at:'2026-10-07T08:00:00Z'},
    execution_id:'reliable-edition-20261007-run11',edition_id:'dab-edition-2026-10-07',
    writer_generation:9,content_state:{closed:true}
  });
  assert.equal(terminal.dispatch_required,false);
  const decision=dispatchTransitionEvent({event:terminal,task_contracts:{},branch:'reliable-edition/dab-edition-2026-10-07-run11'});
  assert.equal(decision.status,'NO_DISPATCH_REQUIRED');
});
