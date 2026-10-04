import {createHash} from 'node:crypto';
import {buildProtectedRepairRecord} from './protected-repair-executor.mjs';

export const WATCHDOG_RING_VERSION='chatgpt-watchdog-ring-v1';
export const WATCHDOG_RECOVERY_LEASE_VERSION='chatgpt-watchdog-recovery-lease-v1';
export const WATCHDOG_EVENT_VERSION='chatgpt-watchdog-event-v1';
export const DEFAULT_WATCHDOG_LEASE_MS=15*60*1000;
export const WATCHDOG_SLOTS=Object.freeze({A:3,B:13,C:23,D:33,E:43,F:53});
export const WATCHDOG_NATIVE_IMAGE_TASKS=Object.freeze(['11','12','13','14','15','16']);
export const WATCHDOG_RELEASE_REASONS=Object.freeze(['RECOVERY_VERIFIED_PROGRESSING','RECOVERY_NO_LONGER_NEEDED','WAITING_ON_PROTECTED_EXTERNAL_EXECUTOR','BLOCKED_EXTERNAL','TERMINAL_EXECUTION','SAFE_BOUNDARY_REACHED']);
export const WATCHDOG_MINIMUM_ACTION_LADDER=Object.freeze(['RECONCILE_AUTHORITATIVE_STATE','REDISPATCH_SAME_EXECUTOR','RESTORE_SAME_EXECUTION_AUTHORITY','CONSUME_EXACT_QUEUED_REQUEST','MINIMAL_PROTECTED_REPAIR']);

const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const tid=v=>v===null||v===undefined||v===''?null:String(v).padStart(2,'0');
const validSlot=v=>Object.prototype.hasOwnProperty.call(WATCHDOG_SLOTS,v);
const uniq=v=>[...new Set(v)];

export function buildWatchdogIncidentId({execution_id,task_id=null,latest_authoritative_state,reason_code,request_key=null}={}){
  if(!execution_id||!latest_authoritative_state||!reason_code)throw Error('watchdog_incident_identity_required');
  return 'wd-'+digest({execution_id,task_id:tid(task_id),latest_authoritative_state,reason_code,request_key:request_key||null}).slice(0,32);
}
export function buildWatchdogActionKey({incident_id,action_type,target,attempt_generation=1}={}){
  if(!incident_id||!action_type||!target||!Number.isInteger(attempt_generation)||attempt_generation<1)throw Error('watchdog_action_identity_required');
  return 'wa-'+digest({incident_id,action_type,target,attempt_generation}).slice(0,32);
}
export function watchdogLeaseActive(lease,{execution_id=null,now=new Date().toISOString()}={}){
  if(!lease||!stamp(now))return false;
  if(execution_id&&lease.execution_id!==execution_id)return false;
  return lease.schema_version===WATCHDOG_RECOVERY_LEASE_VERSION&&lease.state==='ACTIVE'&&!lease.released_at&&stamp(lease.expires_at)&&Date.parse(lease.expires_at)>Date.parse(now);
}
export function acquireWatchdogRecoveryLease(current,{execution_id,incident_id,owner_slot,action_key,now=new Date().toISOString(),ttl_ms=DEFAULT_WATCHDOG_LEASE_MS}={}){
  if(!execution_id||!incident_id||!validSlot(owner_slot)||!action_key||!stamp(now)||!Number.isInteger(ttl_ms)||ttl_ms<12*60*1000||ttl_ms>15*60*1000)throw Error('valid_watchdog_recovery_lease_request_required');
  const active=watchdogLeaseActive(current,{now});
  if(active&&current.execution_id!==execution_id)return {acquired:false,reason:'recovery_lease_owned_by_other_execution',lease:current};
  if(active&&current.owner_slot!==owner_slot)return {acquired:false,reason:'recovery_lease_owned_by_other_watchdog',lease:current};
  if(active&&current.incident_id!==incident_id)return {acquired:false,reason:'recovery_lease_active_for_other_incident',lease:current};
  const same=active&&current.execution_id===execution_id&&current.owner_slot===owner_slot&&current.incident_id===incident_id;
  const generation=same?Number(current.generation):Math.max(0,Number(current?.generation||0))+1;
  const requested=Date.parse(now)+ttl_ms;
  const prior=same&&stamp(current.expires_at)?Date.parse(current.expires_at):0;
  return {acquired:true,reason:same?'recovery_lease_renewed':'recovery_lease_acquired',lease:{
    schema_version:WATCHDOG_RECOVERY_LEASE_VERSION,execution_id,incident_id,owner_slot,generation,state:'ACTIVE',
    acquired_at:same?current.acquired_at:now,last_heartbeat_at:now,expires_at:new Date(Math.max(requested,prior)).toISOString(),
    action_key,released_at:null,release_reason:null
  }};
}
export function releaseWatchdogRecoveryLease(lease,{owner_slot,generation,reason,now=new Date().toISOString()}={}){
  if(!lease||!validSlot(owner_slot)||!Number.isInteger(generation)||!WATCHDOG_RELEASE_REASONS.includes(reason)||!stamp(now))throw Error('valid_watchdog_recovery_lease_release_required');
  if(lease.owner_slot!==owner_slot||Number(lease.generation)!==generation)throw Error('STALE_WATCHDOG_RECOVERY_LEASE');
  return {...lease,state:'RELEASED',last_heartbeat_at:now,expires_at:now,released_at:now,release_reason:reason};
}
export function watchdogLeaseWritePlan({current=null,current_sha=null,desired_lease=null}={}){
  if(!desired_lease||desired_lease.schema_version!==WATCHDOG_RECOVERY_LEASE_VERSION)throw Error('desired_watchdog_lease_required');
  if(!current)return {operation:'create',expected_absence:true,expected_sha:null,optimistic_concurrency:true};
  if(typeof current_sha!=='string'||!/^[a-f0-9]{40}$/.test(current_sha))throw Error('current_watchdog_lease_sha_required');
  return {operation:'update',expected_absence:false,expected_sha:current_sha,optimistic_concurrency:true};
}
export function selectAuthoritativeRequest(requests=[],{execution_id,task_id}={}){
  if(!execution_id||!tid(task_id))throw Error('watchdog_request_scope_required');
  const id=tid(task_id);
  return [...requests].filter(x=>x?.execution_id===execution_id&&tid(x?.task_id)===id).sort((a,b)=>{
    const ae=Number(a?.repair_epoch||0),be=Number(b?.repair_epoch||0);
    if(ae!==be)return ae-be;
    const ap=Number(a?.post_repair_attempt||0),bp=Number(b?.post_repair_attempt||0);
    if(ap!==bp)return ap-bp;
    const at=stamp(a.created_at)?Date.parse(a.created_at):0,bt=stamp(b.created_at)?Date.parse(b.created_at):0;
    if(at!==bt)return at-bt;
    return String(a._file||a.request_key||'').localeCompare(String(b._file||b.request_key||''));
  }).at(-1)||null;
}

export function buildWatchdogProtectedRepairRequirement({
  execution_id,edition_id,execution_key,production_branch,task_id,incident_id,
  repair_branch,repair_branch_head_sha,repair_scope_digest,required_checks=['validate'],
  created_at=new Date().toISOString()
}={}){
  return buildProtectedRepairRecord({
    execution_id,edition_id,execution_key,production_branch,task_id,incident_id,
    repair_branch,repair_branch_head_sha,repair_scope_digest,required_checks,created_at
  });
}
export function watchdogNativeImageRequestEligible(request,{execution_id}={}){
  const state=String(request?.status||request?.state||'').toLowerCase();
  return Boolean(
    execution_id&&request?.execution_id===execution_id&&
    WATCHDOG_NATIVE_IMAGE_TASKS.includes(tid(request?.task_id))&&
    request?.capability==='native_chatgpt'&&
    ['queued','pending','queued_for_scheduled_consumer'].includes(state)
  );
}
export function watchdogDecision({active_pointer=null,classification=null,recovery_lease=null,owner_slot,now=new Date().toISOString(),substantive_worker_active=false,protected_executor_active=false,task_writer_active=false,pending_actionable_request=false,authoritative_request=null,terminal_pointer_cleanup_authorized=false}={}){
  if(!validSlot(owner_slot)||!stamp(now))throw Error('watchdog_decision_context_required');
  if(!active_pointer?.active||active_pointer?.terminal===true)return {action:'NO_ACTION',reason:'no_active_nonterminal_production'};
  if(classification?.state==='TERMINAL')return terminal_pointer_cleanup_authorized?{action:'RECONCILE_TERMINAL_POINTER_ONLY',reason:'terminal_cleanup_explicitly_authorized'}:{action:'NO_ACTION',reason:'terminal_execution_production_immutable'};
  if(watchdogLeaseActive(recovery_lease,{execution_id:active_pointer.execution_id,now})&&recovery_lease.owner_slot!==owner_slot)return {action:'NO_ACTION',reason:'another_watchdog_recovery_owner_active'};
  if(substantive_worker_active||protected_executor_active)return {action:'NO_ACTION',reason:'real_executor_progressing'};
  if(task_writer_active)return {action:'NO_ACTION',reason:'current_task_writer_owns_request'};
  if(watchdogNativeImageRequestEligible(authoritative_request,{execution_id:active_pointer.execution_id}))return {action:'CONSUME_NATIVE_IMAGE_REQUEST',reason:'unclaimed_native_image_request_ring_consumer',request_key:authoritative_request.request_key||null,task_id:tid(authoritative_request.task_id),owner_slot};
  if(classification?.state==='HEALTHY_ACTIVE')return {action:'NO_ACTION',reason:'healthy_active'};
  if(classification?.state==='READY_IDLE'&&!pending_actionable_request)return {action:'NO_ACTION',reason:'legitimate_ready_idle'};
  if(classification?.state==='BLOCKED_EXTERNAL')return {action:'WAIT_EXTERNAL',reason:'external_block_verified_no_bypass'};
  if(['STALE_ACTIVE','BLOCKED_ACTIONABLE'].includes(classification?.state)||(classification?.state==='READY_IDLE'&&pending_actionable_request))return {action:'RECOVER',reason:'same_execution_recovery_required'};
  return {action:'WAIT_EXTERNAL',reason:'unknown_state_fails_closed'};
}
export function nextWatchdogCorrectiveAction({classification,task_done=false,accepted_locked=false,stale_derived_state=false,same_executor_missing=false,authority_broken=false,authoritative_request=null,deterministic_infrastructure_defect=false,failed_action_types=[],verified_external_blocker=false}={}){
  if(task_done)return {action:'NO_ACTION',reason:'completed_task_protected'};
  if(accepted_locked)return {action:'NO_ACTION',reason:'accepted_asset_protected'};
  if(!['STALE_ACTIVE','BLOCKED_ACTIONABLE','READY_IDLE'].includes(classification))return {action:'NO_ACTION',reason:'classification_not_recoverable'};
  const failed=new Set(failed_action_types);
  const candidates=[
    stale_derived_state&&{action:'RECONCILE_AUTHORITATIVE_STATE',level:1,target:'derived_state'},
    same_executor_missing&&{action:'REDISPATCH_SAME_EXECUTOR',level:2,target:'same_execution_executor'},
    authority_broken&&{action:'RESTORE_SAME_EXECUTION_AUTHORITY',level:3,target:'same_execution_authority'},
    authoritative_request&&{action:'CONSUME_EXACT_QUEUED_REQUEST',level:4,target:authoritative_request.request_key||authoritative_request.task_id},
    deterministic_infrastructure_defect&&{action:'MINIMAL_PROTECTED_REPAIR',level:5,target:'deterministic_infrastructure_defect'}
  ].filter(Boolean);
  const next=candidates.find(x=>!failed.has(x.action));
  if(next)return next;
  if(verified_external_blocker)return {action:'BLOCKED_EXTERNAL',level:6,target:null,reason:'verified_external_condition_after_authorized_options'};
  return {action:'REDIAGNOSE_AND_CONTINUE',level:6,target:'fresh_authoritative_state',reason:'authorized_options_exhausted_without_verified_external_blocker'};
}
export function verifyWatchdogRecoveryProgress({before={},after={},require_active_executor=true}={}){
  const signals={
    task_transition:Boolean(after.task_state&&before.task_state&&after.task_state!==before.task_state),
    worker_claimed:after.worker_claimed===true&&before.worker_claimed!==true,
    worker_result:Boolean(after.worker_result_key&&after.worker_result_key!==before.worker_result_key),
    accepted_asset:Number(after.accepted_asset_count||0)>Number(before.accepted_asset_count||0),
    first_incomplete_advanced:Boolean(after.first_incomplete_task&&before.first_incomplete_task&&after.first_incomplete_task!==before.first_incomplete_task),
    substantive_progress_timestamp:stamp(after.substantive_progress_at)&&(!stamp(before.substantive_progress_at)||Date.parse(after.substantive_progress_at)>Date.parse(before.substantive_progress_at)),
    protected_executor_activated:['queued','in_progress'].includes(String(after.protected_executor_state||'').toLowerCase())&&String(after.protected_executor_state||'')!==String(before.protected_executor_state||'')
  };
  const durable=Object.values(signals).some(Boolean);
  const executorActive=['running','claimed','recovering'].includes(String(after.worker_state||'').toLowerCase())||['queued','in_progress'].includes(String(after.protected_executor_state||'').toLowerCase())||signals.worker_claimed;
  return {verified:durable&&(!require_active_executor||executorActive),durable_progress:durable,executor_active:executorActive,dispatch_only:after.dispatch_recorded===true&&!durable,signals};
}
export function watchdogRecoveryContinuation({verification=null,terminal=false,verified_external_blocker=false,remaining_authorized_actions=0,safe_boundary_required=false}={}){
  if(terminal)return {outcome:'TERMINAL_EXECUTION',recovery_complete:false,recovery_required:false,reason:'terminal_execution_immutable'};
  if(verification?.verified===true&&verification?.executor_active===true&&verification?.durable_progress===true)return {outcome:'RECOVERY_VERIFIED_PROGRESSING',recovery_complete:true,recovery_required:false,reason:'active_executor_and_durable_progress_verified'};
  if(verified_external_blocker)return {outcome:'BLOCKED_EXTERNAL',recovery_complete:false,recovery_required:false,reason:'verified_external_non_actionable_condition'};
  if(Number(remaining_authorized_actions)>0)return {outcome:'CONTINUE_RECOVERY',recovery_complete:false,recovery_required:true,reason:'authorized_repair_options_remain'};
  if(safe_boundary_required)return {outcome:'SAFE_BOUNDARY_HANDOFF',recovery_complete:false,recovery_required:true,reason:'unresolved_actionable_incident_must_resume_next_watchdog'};
  return {outcome:'REDIAGNOSE_AND_CONTINUE',recovery_complete:false,recovery_required:true,reason:'no_verified_success_or_external_blocker'};
}
export function buildWatchdogEvent({execution_id,edition_id,task_id=null,incident_id,slot_id,classification,observed_substantive_progress_at=null,authoritative_request_key=null,blocker=null,lease_generation,action_key,action_taken,verification_evidence=null,final_outcome,occurred_at=new Date().toISOString()}={}){
  if(!execution_id||!edition_id||!incident_id||!validSlot(slot_id)||!classification||!Number.isInteger(lease_generation)||lease_generation<1||!action_key||!action_taken||!final_outcome||!stamp(occurred_at))throw Error('valid_watchdog_event_required');
  return {schema_version:WATCHDOG_EVENT_VERSION,execution_id,edition_id,task_id:tid(task_id),incident_id,slot_id,classification,observed_substantive_progress_at,authoritative_request_key,blocker,lease_generation,action_key,action_taken,verification_evidence,final_outcome,occurred_at};
}
export function validateWatchdogRingContract(contract={}){
  const e=[];
  if(contract.schema_version!=='chatgpt-watchdog-ring-contract-v1')e.push('watchdog_ring_schema_version');
  if(contract.enabled!==true)e.push('watchdog_ring_enabled');
  if(contract.role!=='outer_autonomous_recovery_and_native_image_consumer_pool')e.push('watchdog_ring_role');
  const slots=contract.schedule?.slots||{};
  for(const [s,m] of Object.entries(WATCHDOG_SLOTS))if(Number(slots[s])!==m)e.push('watchdog_ring_slot:'+s);
  if(contract.schedule?.timing_mode!=='exact_schedule')e.push('watchdog_ring_exact_schedule');
  if(contract.schedule?.per_slot_recurrence!=='hourly')e.push('watchdog_ring_hourly_per_slot');
  if(contract.schedule?.nominal_check_minutes!==10)e.push('watchdog_ring_nominal_10_minutes');
  if(contract.lease?.schema_version!==WATCHDOG_RECOVERY_LEASE_VERSION)e.push('watchdog_ring_lease_schema');
  if(contract.lease?.path_pattern!=='_records/edition-execution/watchdog-leases/<execution-id>.json')e.push('watchdog_ring_lease_path');
  if(contract.lease?.ttl_minutes<12||contract.lease?.ttl_minutes>15)e.push('watchdog_ring_lease_ttl');
  if(contract.lease?.optimistic_concurrency!==true)e.push('watchdog_ring_optimistic_concurrency');
  if(contract.lease?.replaces_writer_fence!==false)e.push('watchdog_ring_writer_fence_separation');
  if(contract.events?.append_only!==true||contract.events?.healthy_noop_writes!==false)e.push('watchdog_ring_event_noise_policy');
  if(contract.no_op?.healthy_no_mutation!==true||contract.no_op?.other_recovery_owner_no_mutation!==true)e.push('watchdog_ring_noop_contract');
  if(contract.recovery?.verification_required!==true||contract.recovery?.dispatch_only_is_success!==false)e.push('watchdog_ring_verification_contract');
  if(contract.progress?.active_executor_required_for_recovery_success!==true)e.push('watchdog_ring_active_executor_required');
  if(contract.recovery?.continue_until_active_and_progressing!==true)e.push('watchdog_ring_continue_until_progress');
  if(contract.recovery?.exhaust_safe_authorized_options_before_handoff!==true)e.push('watchdog_ring_exhaust_authorized_options');
  if(contract.recovery?.one_failed_attempt_may_end_recovery!==false)e.push('watchdog_ring_one_attempt_not_terminal');
  if(contract.recovery?.safe_boundary_is_handoff_not_success!==true)e.push('watchdog_ring_safe_boundary_handoff');
  if(contract.recovery?.blocked_external_requires_verified_external_condition!==true)e.push('watchdog_ring_external_verification');
  if(contract.native_image_consumer?.all_slots_equivalent!==true)e.push('watchdog_ring_image_slots_equivalent');
  if(JSON.stringify(contract.native_image_consumer?.eligible_slots)!==JSON.stringify(Object.keys(WATCHDOG_SLOTS)))e.push('watchdog_ring_image_eligible_slots');
  if(contract.native_image_consumer?.normal_queued_request_consumption!==true)e.push('watchdog_ring_image_normal_consumption');
  if(contract.native_image_consumer?.single_owner_required!==true||contract.native_image_consumer?.writer_fence_required!==true)e.push('watchdog_ring_image_single_owner_fence');
  if(contract.native_image_consumer?.duplicate_generation_prohibited!==true)e.push('watchdog_ring_image_duplicate_generation');
  if(contract.native_image_consumer?.legacy_slot_f_special_role!==false)e.push('watchdog_ring_no_special_f_role');
  if(contract.native_image_consumer?.nominal_pickup_minutes!==10)e.push('watchdog_ring_image_pickup_cadence');
  if(JSON.stringify(contract.recovery?.minimum_action_ladder)!==JSON.stringify(WATCHDOG_MINIMUM_ACTION_LADDER))e.push('watchdog_ring_action_ladder');
  if(contract.protections?.terminal_reopen_allowed!==false||contract.protections?.completed_task_rework_allowed!==false||contract.protections?.accepted_asset_regeneration_allowed!==false)e.push('watchdog_ring_protection_contract');
  for(const k of ['chatgpt_work','codex','paid_apis','billable_overage','event_triggered_work_tasks','browser_automation','new_credentials'])if(contract.cost_boundary?.[k]!==false)e.push('watchdog_ring_cost_boundary:'+k);
  return uniq(e);
}
