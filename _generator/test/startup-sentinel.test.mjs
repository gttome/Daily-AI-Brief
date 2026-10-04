import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateStartupSentinel,STARTUP_SENTINEL_VERSION} from '../lib/startup-sentinel.mjs';

const basePointer={
  active:false,terminal:true,edition_id:'dab-edition-2026-10-04',
  execution_id:'reliable-edition-20261004-run8',execution_key:'2026-10-04-run8',
  branch:'reliable-edition/dab-edition-2026-10-04-run8',current_task:'29',current_task_state:'Done'
};
const now='2026-10-05T00:05:00Z';

test('sentinel is inert outside the 19:00 Chicago admission window',()=>{
  const r=evaluateStartupSentinel({pointer:basePointer,now:'2026-10-04T23:05:00Z'});
  assert.equal(r.schema_version,STARTUP_SENTINEL_VERSION);
  assert.equal(r.status,'OUTSIDE_START_WINDOW');
  assert.equal(r.escalation_required,false);
  assert.equal(r.production_allocation_performed,false);
});

test('terminal prior edition after 19:00 produces explicit MISSED_START evidence for next day',()=>{
  const r=evaluateStartupSentinel({pointer:basePointer,now});
  assert.equal(r.target_edition_id,'dab-edition-2026-10-05');
  assert.equal(r.status,'MISSED_START');
  assert.equal(r.normalized_fault_code,'MISSED_START_NO_TARGET_EXECUTION');
  assert.equal(r.escalation_required,true);
  assert.equal(r.production_allocation_performed,false);
});

test('target execution must have substantive Task 00 progress, allocation alone is insufficient',()=>{
  const pointer={...basePointer,active:true,terminal:false,edition_id:'dab-edition-2026-10-05',
    execution_id:'reliable-edition-20261005-run9',execution_key:'2026-10-05-run9',
    branch:'reliable-edition/dab-edition-2026-10-05-run9',current_task:'00',current_task_state:'Active'};
  const noProgress=evaluateStartupSentinel({pointer,now,events:[{
    task_id:'00',from:'Backlog',to:'Active',at:'2026-10-05T00:00:10Z',
    reason_code:'PRODUCTION_EXECUTION_ALLOCATED'
  }]});
  assert.equal(noProgress.status,'MISSED_START');
  assert.equal(noProgress.normalized_fault_code,'MISSED_START_TASK00_PROGRESS_NOT_PROVEN');

  const progressed=evaluateStartupSentinel({pointer,now,events:[{
    task_id:'00',from:'Active',to:'Done',at:'2026-10-05T00:03:00Z',proof:{readiness:'PASS'}
  }]});
  assert.equal(progressed.status,'STARTED_OR_RESUMED_WITH_PROGRESS');
  assert.equal(progressed.escalation_required,false);
});

test('already terminal target edition is a no-op and never reopened',()=>{
  const pointer={...basePointer,edition_id:'dab-edition-2026-10-05'};
  const r=evaluateStartupSentinel({pointer,now});
  assert.equal(r.status,'TARGET_ALREADY_TERMINAL');
  assert.equal(r.escalation_required,false);
});

test('another active edition fails closed instead of authorizing duplicate allocation',()=>{
  const pointer={...basePointer,active:true,terminal:false,edition_id:'dab-edition-2026-10-03'};
  const r=evaluateStartupSentinel({pointer,now});
  assert.equal(r.status,'ACTIVE_OTHER_EXECUTION');
  assert.equal(r.normalized_fault_code,'ACTIVE_OTHER_EXECUTION_AT_SCHEDULED_START');
  assert.equal(r.escalation_required,true);
  assert.equal(r.production_allocation_performed,false);
});
