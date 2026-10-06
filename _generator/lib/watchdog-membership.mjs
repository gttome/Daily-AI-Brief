export const WATCHDOG_MEMBERSHIP_VERSION='watchdog-ring-membership-v1';
export const WATCHDOG_MEMBERSHIP_SLOTS=Object.freeze([
  {slot:'A',title:'Daily Brief Watchdog A',minute:3},
  {slot:'B',title:'Daily Brief Watchdog B',minute:13},
  {slot:'C',title:'Daily Brief Watchdog C',minute:23},
  {slot:'D',title:'Daily Brief Watchdog D',minute:33},
  {slot:'E',title:'Daily Brief Watchdog E',minute:43},
  {slot:'F',title:'Daily Brief Watchdog F',minute:53}
]);

const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

export function validateWatchdogMembershipObservation(observation={}){
  const errors=[];
  if(observation.schema_version!==WATCHDOG_MEMBERSHIP_VERSION)errors.push('watchdog_membership_schema_version');
  if(observation.live_observation_verified!==true)errors.push('watchdog_membership_live_observation_required');
  if(!stamp(observation.observed_at))errors.push('watchdog_membership_observed_at_required');
  if(observation.scheduler_kind!=='chatgpt_automation')errors.push('watchdog_membership_scheduler_kind');
  if(observation.maintenance_override_active===true)errors.push('watchdog_membership_maintenance_override_active');
  const members=Array.isArray(observation.members)?observation.members:[];
  for(const expected of WATCHDOG_MEMBERSHIP_SLOTS){
    const matches=members.filter(x=>x?.slot===expected.slot||x?.title===expected.title);
    if(matches.length!==1){errors.push('watchdog_membership_exactly_one:'+expected.slot);continue;}
    const member=matches[0];
    if(member.title!==expected.title)errors.push('watchdog_membership_title:'+expected.slot);
    if(member.enabled!==true)errors.push('watchdog_membership_disabled:'+expected.slot);
    if(member.timing_mode!=='exact_schedule')errors.push('watchdog_membership_timing_mode:'+expected.slot);
    if(member.minute!==expected.minute)errors.push('watchdog_membership_minute:'+expected.slot);
    if(member.recurring_hourly!==true)errors.push('watchdog_membership_recurrence:'+expected.slot);
  }
  if(observation.all_slots_equivalent!==true)errors.push('watchdog_membership_equivalence');
  if(observation.self_heal_enabled!==true)errors.push('watchdog_membership_self_heal');
  return [...new Set(errors)];
}

export function watchdogMembershipHealthProjection(observation={}){
  const errors=validateWatchdogMembershipObservation(observation);
  return {
    healthy:errors.length===0,
    actionable:errors.length>0,
    enabled_count:Array.isArray(observation.members)?observation.members.filter(x=>x?.enabled===true).length:0,
    reason_code:errors.length?'WATCHDOG_RING_DEGRADED':null,
    next_legal_action:errors.length?'RESTORE_WATCHDOG_RING_MEMBERSHIP':null,
    errors
  };
}
