import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWatchdogHealthRecord,validateWatchdogHealthRecord,watchdogFastPathDecision,
  updateWatchdogFastPathCounters,WATCHDOG_HEALTH_VERSION
} from '../lib/watchdog-health.mjs';

const identity={
  active:true,terminal:false,edition_id:'dab-edition-2099-01-01',
  execution_id:'reliable-edition-20990101-run1',execution_key:'2099-01-01-run1',
  branch:'reliable-edition/dab-edition-2099-01-01-run1',
  first_incomplete_task:'03',first_incomplete_task_state:'Active',
  last_substantive_progress_at:'2099-01-01T01:00:00Z',
  observed_at:'2099-01-01T01:05:00Z',live_executor_state:'Running',
  evidence_refs:['_records/edition-execution/events/2099-01-01-run1/03-active.json']
};

test('HEALTHY_ACTIVE exits from compact record only',()=>{
  const record=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'}});
  assert.equal(record.schema_version,WATCHDOG_HEALTH_VERSION);
  assert.deepEqual(validateWatchdogHealthRecord(record),[]);
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z',expected_execution_id:identity.execution_id});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.compact_only,true);
  assert.equal(d.counter_bucket,'healthy_noop');
});

test('TERMINAL exits from compact record only',()=>{
  const record=buildWatchdogHealthRecord({
    observed_at:'2099-01-01T01:05:00Z',active:false,terminal:true,
    edition_id:identity.edition_id,execution_id:identity.execution_id,execution_key:identity.execution_key,
    branch:identity.branch,classification:{state:'TERMINAL'},evidence_refs:[]
  });
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.reason,'terminal_compact_health');
});

test('valid other recovery owner progressing exits without broad reconstruction',()=>{
  const record=buildWatchdogHealthRecord({
    ...identity,classification:{state:'STALE_ACTIVE'},
    watchdog_recovery_owner:'slot-E',watchdog_recovery_owner_progressing:true
  });
  const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
  assert.equal(d.action,'EXIT_SILENT');
  assert.equal(d.reason,'valid_recovery_owner_progressing');
});

for(const state of ['STALE_ACTIVE','BLOCKED_ACTIONABLE','READY_IDLE']){
  test(state+' expands into bounded recovery',()=>{
    const record=buildWatchdogHealthRecord({...identity,classification:{state}});
    const d=watchdogFastPathDecision(record,{now:'2099-01-01T01:10:00Z'});
    assert.equal(d.action,'EXPAND_RECOVERY');
    assert.equal(d.counter_bucket,'escalated');
    assert.equal(d.compact_only,false);
  });
}

test('missing, stale, contradictory or wrong-execution compact state never returns false HEALTHY',()=>{
  assert.equal(watchdogFastPathDecision(null,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
  const stale=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'},observed_at:'2099-01-01T00:00:00Z'});
  assert.equal(watchdogFastPathDecision(stale,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
  const healthy=buildWatchdogHealthRecord({...identity,classification:{state:'HEALTHY_ACTIVE'}});
  assert.equal(watchdogFastPathDecision(healthy,{now:'2099-01-01T01:10:00Z',expected_execution_id:'other'}).action,'EXPAND_RECOVERY');
  const tampered={...healthy,active:true,terminal:true};
  assert.equal(watchdogFastPathDecision(tampered,{now:'2099-01-01T01:10:00Z'}).action,'EXPAND_RECOVERY');
});

test('fast-path counters distinguish healthy no-op and escalation decisions',()=>{
  let counters={};
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'healthy_noop'});
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'escalated'});
  counters=updateWatchdogFastPathCounters(counters,{counter_bucket:'healthy_noop'});
  assert.deepEqual(counters,{healthy_noop:2,escalated:1,total:3});
});
