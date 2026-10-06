import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWatchdogHealthRecord,materiallySameWatchdogHealth,validateWatchdogHealthRecord,
  watchdogFastPathDecision,updateWatchdogFastPathCounters,WATCHDOG_HEALTH_VERSION
} from '../lib/watchdog-health.mjs';

const identity={
  active:true,terminal:false,edition_id:'dab-edition-2099-01-01',
  execution_id:'reliable-edition-20990101-run1',execution_key:'2099-01-01-run1',
  branch:'reliable-edition/dab-edition-2099-01-01-run1',
  first_incomplete_task:'03',task_state:'Active',capability:'research_chatgpt',
  last_substantive_progress_at:'2099-01-01T01:00:00Z',
  observed_at:'2099-01-01T01:05:00Z',live_executor_state:'Running',
  evidence_refs:['_records/edition-execution/events/2099-01-01-run1/03-active.json']
};

test('HEALTHY_ACTIVE exits from chatgpt-watchdog-health-v1 compact record only',()=>{
  const record=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'}});
  assert.equal(record.schema_version,WATCHDOG_HEALTH_VERSION);
  assert.equal(record.schema_version,'chatgpt-watchdog-health-v1');
  assert.match(record.source_digest,/^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(validateWatchdogHealthRecord(record),[]);
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z',expected_execution_id:identity.execution_id});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.compact_only,true);
  assert.equal(d.counter_bucket,'compact_exit');
});

test('TERMINAL and no-active states exit from compact record only',()=>{
  const terminal=buildWatchdogHealthRecord({
    observed_at:'2099-01-01T01:05:00Z',active:false,terminal:true,
    edition_id:identity.edition_id,execution_id:identity.execution_id,execution_key:identity.execution_key,
    branch:identity.branch,classification:{state:'TERMINAL'},evidence_refs:[]
  });
  assert.equal(watchdogFastPathDecision(terminal,{now:'2099-01-02T01:10:00Z'}).reason,'terminal_compact_health');
  const idle=buildWatchdogHealthRecord({observed_at:'2099-01-01T01:05:00Z',active:false,terminal:false,evidence_refs:[]});
  const d=watchdogFastPathDecision(idle,{now:'2099-01-01T01:10:00Z'});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.reason,'no_active_execution');
});

test('valid other recovery owner progressing exits without broad reconstruction',()=>{
  const record=buildWatchdogHealthRecord({
    ...identity,classification:{state:'STALE_ACTIVE'},
    watchdog_recovery_owner:'E',watchdog_recovery_owner_progressing:true
  });
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.reason,'valid_recovery_owner_progressing');
});

for(const state of ['STALE_ACTIVE','BLOCKED_ACTIONABLE']){
  test(state+' expands into bounded recovery',()=>{
    const record=buildWatchdogHealthRecord({...identity,classification:{state}});
    const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
    assert.equal(d.action,'EXPAND_RECOVERY');
    assert.equal(d.counter_bucket,'expanded_read');
    assert.equal(d.compact_only,false);
  });
}

test('READY_IDLE exits only when no exact actionable request is queued',()=>{
  const idle=buildWatchdogHealthRecord({...identity,classification:{state:'READY_IDLE'},live_executor_state:'Stopped'});
  assert.equal(watchdogFastPathDecision(idle,{now:'2099-01-01T01:10:00Z'}).reason,'legitimate_ready_idle');
  const queued=buildWatchdogHealthRecord({...identity,classification:{state:'READY_IDLE'},live_executor_state:'Stopped',request_key:'req-1',request_status:'queued'});
  assert.equal(watchdogFastPathDecision(queued,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
});

test('missing, stale, contradictory or wrong-execution compact state never returns false HEALTHY',()=>{
  assert.equal(watchdogFastPathDecision(null,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
  const stale=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'},observed_at:'2099-01-01T00:00:00Z',updated_at:'2099-01-01T00:00:00Z'});
  assert.equal(watchdogFastPathDecision(stale,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
  const healthy=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'}});
  assert.equal(watchdogFastPathDecision(healthy,{now:'2099-01-01T01:10:00Z',expected_execution_id:'other'}).action,'EXPAND_RECOVERY');
  const tampered={...healthy,active:true,terminal:true};
  assert.equal(watchdogFastPathDecision(tampered,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
});

test('material digest excludes observation timestamp noise and changes on decision-critical state',()=>{
  const a=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'},updated_at:'2099-01-01T01:05:00Z'});
  const b=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'},observed_at:'2099-01-01T01:06:00Z',updated_at:'2099-01-01T01:06:00Z'});
  assert.equal(a.source_digest,b.source_digest);
  assert.equal(materiallySameWatchdogHealth(a,b),true);
  const c=buildWatchdogHealthRecord({...identity,classification:{state:'STALE_ACTIVE'},observed_at:'2099-01-01T01:06:00Z',updated_at:'2099-01-01T01:06:00Z'});
  assert.notEqual(a.source_digest,c.source_digest);
  assert.equal(materiallySameWatchdogHealth(a,c),false);
});

test('fast-path counters use public-safe proxy names',()=>{
  let counters={};
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'compact_exit'});
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'expanded_read'});
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'compact_exit'});
  assert.deepEqual(counters,{watchdog_invocations:3,watchdog_compact_exits:2,watchdog_expanded_reads:1});
});


test('degraded Watchdog ring membership is actionable even when task state would otherwise compact-exit',()=>{
  const record=buildWatchdogHealthRecord({
    ...identity,
    classification:{state:'HEALTHY_ACTIVE'},
    watchdog_ring_healthy:false,
    watchdog_ring_enabled_count:4
  });
  assert.equal(record.health_state,'BLOCKED_ACTIONABLE');
  assert.equal(record.actionable,true);
  assert.equal(record.reason_code,'WATCHDOG_RING_DEGRADED');
  assert.equal(record.next_legal_action,'RESTORE_WATCHDOG_RING_MEMBERSHIP');
  assert.equal(record.watchdog_ring_enabled_count,4);
  assert.deepEqual(validateWatchdogHealthRecord(record),[]);
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
  assert.equal(d.action,'EXPAND_RECOVERY');
  assert.equal(d.reason,'degraded_watchdog_ring');
});
