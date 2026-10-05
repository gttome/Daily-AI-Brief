import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPublicSafeBudgetDelta,evaluatePublicSafeBudget,newPublicSafeBudget,
  setPublicSafeRunWallSeconds,validatePublicSafeBudget
} from '../lib/public-safe-budget.mjs';

const make=()=>newPublicSafeBudget({
  execution_id:'reliable-edition-20990101-run1',edition_id:'dab-edition-2099-01-01',
  execution_key:'2099-01-01-run1',started_at:'2099-01-01T00:00:00Z'
});

test('public-safe budget starts GREEN with all required counters and no account metrics',()=>{
  const r=make();
  assert.equal(r.budget_level,'GREEN');
  assert.deepEqual(validatePublicSafeBudget(r),[]);
  assert.equal(Object.keys(r).some(k=>/weekly|allowance|balance|billing/i.test(k)),false);
  assert.equal(r.counters.watchdog_invocations,0);
  assert.equal(r.counters.semantic_editorial_passes,0);
});

test('compact Watchdog decisions can be counted without private billing telemetry',()=>{
  let r=make();
  r=applyPublicSafeBudgetDelta(r,{watchdog_invocations:10,watchdog_compact_exits:9,watchdog_expanded_reads:1},'2099-01-01T01:00:00Z');
  assert.equal(r.budget_level,'GREEN');
  assert.deepEqual(validatePublicSafeBudget(r),[]);
});

test('one semantic editorial pass remains GREEN but a second pass is RED',()=>{
  const one=applyPublicSafeBudgetDelta(make(),{semantic_editorial_passes:1},'2099-01-01T01:00:00Z');
  assert.equal(one.budget_level,'GREEN');
  const two=applyPublicSafeBudgetDelta(one,{semantic_editorial_passes:1},'2099-01-01T02:00:00Z');
  assert.equal(two.budget_level,'RED');
});

test('unchanged health commit is a RED control-plane regression',()=>{
  const r=applyPublicSafeBudgetDelta(make(),{unchanged_health_commits:1},'2099-01-01T01:00:00Z');
  assert.equal(r.budget_level,'RED');
  assert.ok(evaluatePublicSafeBudget(r).reasons.some(x=>x.reason==='unchanged_health_commit_detected'));
});

test('private account usage fields are rejected if someone attempts to add them to public Git data',()=>{
  const r=make();
  r.weekly_usage_percent_remaining_before=51;
  assert.ok(validatePublicSafeBudget(r).some(x=>x.includes('private_usage_field_prohibited')));
});

test('run wall seconds are measured as a public-safe process proxy',()=>{
  const r=setPublicSafeRunWallSeconds(make(),3600,'2099-01-01T01:00:00Z');
  assert.equal(r.counters.run_wall_seconds,3600);
  assert.deepEqual(validatePublicSafeBudget(r),[]);
});
