import test from 'node:test';
import assert from 'node:assert/strict';
import {WATCHDOG_MEMBERSHIP_SLOTS,validateWatchdogMembershipObservation,watchdogMembershipHealthProjection,watchdogScheduleMutationAllowed,watchdogMembershipRepairPlan} from '../lib/watchdog-membership.mjs';

function observation(){
  return {
    schema_version:'watchdog-ring-membership-v1',
    live_observation_verified:true,
    observed_at:'2026-10-06T13:30:00Z',
    scheduler_kind:'chatgpt_automation',
    all_slots_equivalent:true,
    self_heal_enabled:true,
    maintenance_override_active:false,
    members:WATCHDOG_MEMBERSHIP_SLOTS.map(x=>({...x,enabled:true,timing_mode:'exact_schedule',recurring_hourly:true}))
  };
}

test('healthy six-slot membership passes',()=>{
  const x=observation();
  assert.deepEqual(validateWatchdogMembershipObservation(x),[]);
  assert.equal(watchdogMembershipHealthProjection(x).healthy,true);
});

test('degraded membership becomes actionable',()=>{
  const x=observation();
  x.members[2].enabled=false;
  const health=watchdogMembershipHealthProjection(x);
  assert.equal(health.healthy,false);
  assert.equal(health.actionable,true);
  assert.equal(health.reason_code,'WATCHDOG_RING_DEGRADED');
});

test('permanent watchdog cannot be disabled by normal recovery or cleanup',()=>{
  assert.deepEqual(
    watchdogScheduleMutationAllowed({slot:'C',enabled:false,now:'2026-10-06T14:00:00Z'}),
    {allowed:false,reason:'permanent_watchdog_disable_prohibited'}
  );
});

test('bounded explicit owner maintenance override is the only disable exception',()=>{
  const result=watchdogScheduleMutationAllowed({
    slot:'D',enabled:false,now:'2026-10-06T14:00:00Z',
    maintenance_override:{requested_by_owner:true,reason:'scheduled maintenance',expires_at:'2026-10-06T15:00:00Z'}
  });
  assert.equal(result.allowed,true);
  assert.equal(result.reason,'bounded_owner_maintenance_override');
});

test('disabled peers produce deterministic re-enable plan',()=>{
  const x=observation();
  x.members[2].enabled=false;
  x.members[3].enabled=false;
  assert.deepEqual(watchdogMembershipRepairPlan(x),{
    action:'REENABLE_DISABLED_WATCHDOGS',
    reenable_slots:['C','D'],
    blocking_errors:[]
  });
});
