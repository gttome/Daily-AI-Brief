import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WATCHDOG_SLOTS,WATCHDOG_NATIVE_IMAGE_TASKS,WATCHDOG_MINIMUM_ACTION_LADDER,WATCHDOG_ORDINARY_WRITER_LEASE_MS,buildWatchdogIncidentId,buildWatchdogActionKey,acquireWatchdogRecoveryLease,releaseWatchdogRecoveryLease,watchdogLeaseActive,watchdogLeaseWritePlan,selectAuthoritativeRequest,watchdogNativeImageRequestEligible,watchdogQueuedRequestEligible,watchdogOrdinaryWriterPolicy,watchdogDecision,nextWatchdogCorrectiveAction,verifyWatchdogRecoveryProgress,watchdogRecoveryContinuation,buildWatchdogEvent,buildWatchdogProtectedRepairRequirement,validateWatchdogRingContract} from '../lib/chatgpt-watchdog-ring.mjs';
import {classifyRunHealth} from '../lib/run-supervisor.mjs';

const active={active:true,terminal:false,execution_id:'synthetic-watchdog-execution',edition_id:'dab-edition-2099-01-01',branch:'synthetic/watchdog'};
const incArgs={execution_id:active.execution_id,task_id:'18',latest_authoritative_state:'Active',reason_code:'repository_consumer_unclaimed',request_key:'req-current'};
const incident=buildWatchdogIncidentId(incArgs);
const action=buildWatchdogActionKey({incident_id:incident,action_type:'CONSUME_EXACT_QUEUED_REQUEST',target:'req-current',attempt_generation:1});

test('ring slots are exactly 03 13 23 33 43 53',()=>assert.deepEqual(WATCHDOG_SLOTS,{A:3,B:13,C:23,D:33,E:43,F:53}));

test('native image tasks are exactly 11 through 16',()=>assert.deepEqual(WATCHDOG_NATIVE_IMAGE_TASKS,['11','12','13','14','15','16']));
test('all six slots are equally eligible to consume an unclaimed queued native-image request without waiting for stale classification',()=>{
  const req={execution_id:active.execution_id,task_id:'11',request_key:'img-11',capability:'native_chatgpt',status:'QUEUED_FOR_SCHEDULED_CONSUMER'};
  assert.equal(watchdogNativeImageRequestEligible(req,{execution_id:active.execution_id}),true);
  for(const slot of Object.keys(WATCHDOG_SLOTS)){
    const d=watchdogDecision({active_pointer:active,classification:{state:'READY_IDLE'},owner_slot:slot,authoritative_request:req,now:'2026-10-03T19:01:00Z'});
    assert.equal(d.action,'CONSUME_NATIVE_IMAGE_REQUEST');
    assert.equal(d.owner_slot,slot);
    assert.equal(d.request_key,'img-11');
  }
});
test('native-image consumer eligibility is exact-execution and Tasks 11-16 only',()=>{
  assert.equal(watchdogNativeImageRequestEligible({execution_id:active.execution_id,task_id:'16',capability:'native_chatgpt',status:'queued'},{execution_id:active.execution_id}),true);
  assert.equal(watchdogNativeImageRequestEligible({execution_id:active.execution_id,task_id:'17',capability:'native_chatgpt',status:'queued'},{execution_id:active.execution_id}),false);
  assert.equal(watchdogNativeImageRequestEligible({execution_id:'other',task_id:'11',capability:'native_chatgpt',status:'queued'},{execution_id:active.execution_id}),false);
  assert.equal(watchdogNativeImageRequestEligible({execution_id:active.execution_id,task_id:'11',capability:'repository',status:'queued'},{execution_id:active.execution_id}),false);
});

test('ordinary repository and research requests are generic Watchdog-consumer work while Task 17 retains its dedicated consumer',()=>{
  const repoReq={execution_id:active.execution_id,task_id:'09',request_key:'repo-09',capability:'repository',status:'queued'};
  const researchReq={execution_id:active.execution_id,task_id:'08',request_key:'research-08',capability:'research_chatgpt',status:'queued'};
  const dedicated17={execution_id:active.execution_id,task_id:'17',request_key:'repo-17',capability:'repository',status:'queued'};
  assert.equal(watchdogQueuedRequestEligible(repoReq,{execution_id:active.execution_id}),true);
  assert.equal(watchdogQueuedRequestEligible(researchReq,{execution_id:active.execution_id}),true);
  assert.equal(watchdogQueuedRequestEligible(dedicated17,{execution_id:active.execution_id}),false);
  for(const req of [repoReq,researchReq]){
    const d=watchdogDecision({active_pointer:active,classification:{state:'READY_IDLE'},owner_slot:'A',authoritative_request:req,now:'2026-10-05T02:00:00Z'});
    assert.equal(d.action,'CONSUME_QUEUED_REQUEST');
    assert.equal(d.request_key,req.request_key);
    assert.equal(d.capability,req.capability);
  }
});

test('ordinary ChatGPT writer leases are short and lease presence alone never proves progress',()=>{
  assert.equal(WATCHDOG_ORDINARY_WRITER_LEASE_MS,8*60*1000);
  const lease={execution_id:active.execution_id,owner_id:'watchdog-F-task08',generation:20,acquired_at:'2026-10-05T01:53:54Z',last_heartbeat_at:'2026-10-05T01:53:54Z',expires_at:'2026-10-05T02:13:54Z'};
  const p=watchdogOrdinaryWriterPolicy({lease,capability:'research_chatgpt',substantive_progress_at:null,now:'2026-10-05T02:03:54Z'});
  assert.equal(p.writer_active,true);
  assert.equal(p.substantive_progress,false);
  assert.equal(p.recovery_required,true);
  assert.equal(p.reason,'writer_lease_without_substantive_progress');
  const d=watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},owner_slot:'A',task_writer_active:true,task_writer_substantive_progress:false,task_writer_fence_takeover_safe:false,authoritative_request:{execution_id:active.execution_id,task_id:'08',request_key:'research-08',capability:'research_chatgpt',status:'queued'},now:'2026-10-05T02:03:54Z'});
  assert.equal(d.action,'WAIT_FOR_WRITER_FENCE');
  assert.equal(d.recovery_required,true);
  const safe=watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},owner_slot:'B',task_writer_active:true,task_writer_substantive_progress:false,task_writer_fence_takeover_safe:true,authoritative_request:{execution_id:active.execution_id,task_id:'08',request_key:'research-08',capability:'research_chatgpt',status:'queued'},now:'2026-10-05T02:14:00Z'});
  assert.equal(safe.action,'RECOVER');
});

test('current task writer prevents duplicate native-image pickup by another slot',()=>{
  const req={execution_id:active.execution_id,task_id:'12',request_key:'img-12',capability:'native_chatgpt',status:'queued'};
  const d=watchdogDecision({active_pointer:active,classification:{state:'READY_IDLE'},owner_slot:'E',authoritative_request:req,task_writer_active:true,now:'2026-10-03T19:01:00Z'});
  assert.equal(d.action,'NO_ACTION');
  assert.equal(d.reason,'current_task_writer_owns_request');
});

test('existing recovery ownership prevents a second slot from consuming the same queued native image',()=>{
  const lease=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'}).lease;
  const req={execution_id:active.execution_id,task_id:'11',request_key:'img-11',capability:'native_chatgpt',status:'queued'};
  const d=watchdogDecision({active_pointer:active,classification:{state:'READY_IDLE'},recovery_lease:lease,owner_slot:'B',authoritative_request:req,now:'2026-10-03T19:01:00Z'});
  assert.equal(d.action,'NO_ACTION');
  assert.equal(d.reason,'another_watchdog_recovery_owner_active');
});

test('incident and action keys are deterministic',()=>{
  assert.equal(buildWatchdogIncidentId(incArgs),incident);
  assert.equal(buildWatchdogActionKey({incident_id:incident,action_type:'CONSUME_EXACT_QUEUED_REQUEST',target:'req-current',attempt_generation:1}),action);
});
test('healthy active is silent no-op',()=>{
  const health=classifyRunHealth({task_state:'Active',executor_state:'Running',last_progress_at:'2026-10-03T19:00:00Z',now:'2026-10-03T19:01:00Z'});
  assert.equal(watchdogDecision({active_pointer:active,classification:health,owner_slot:'A',substantive_worker_active:true,now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION');
});
test('no active production is no-op',()=>assert.equal(watchdogDecision({active_pointer:{active:false,terminal:true},classification:{state:'TERMINAL'},owner_slot:'A',now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION'));
test('terminal stale pointer never reopens production',()=>{
  assert.equal(watchdogDecision({active_pointer:active,classification:{state:'TERMINAL'},owner_slot:'A',now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION');
  assert.equal(watchdogDecision({active_pointer:active,classification:{state:'TERMINAL'},owner_slot:'A',terminal_pointer_cleanup_authorized:true,now:'2026-10-03T19:01:00Z'}).action,'RECONCILE_TERMINAL_POINTER_ONLY');
});
test('valid recovery owner blocks another watchdog',()=>{
  const one=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'});
  const two=acquireWatchdogRecoveryLease(one.lease,{execution_id:active.execution_id,incident_id:incident,owner_slot:'B',action_key:action,now:'2026-10-03T19:10:00Z'});
  assert.equal(two.acquired,false); assert.equal(two.reason,'recovery_lease_owned_by_other_watchdog');
  assert.equal(watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},recovery_lease:one.lease,owner_slot:'B',now:'2026-10-03T19:10:00Z'}).action,'NO_ACTION');
});
test('expired recovery owner is taken over with incremented generation',()=>{
  const one=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z',ttl_ms:12*60*1000});
  const two=acquireWatchdogRecoveryLease(one.lease,{execution_id:active.execution_id,incident_id:incident,owner_slot:'B',action_key:action,now:'2026-10-03T19:13:00Z'});
  assert.equal(two.acquired,true); assert.equal(two.lease.generation,2); assert.equal(two.lease.owner_slot,'B');
});
test('lease release is explicit and non-active',()=>{
  const one=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'});
  const r=releaseWatchdogRecoveryLease(one.lease,{owner_slot:'A',generation:1,reason:'RECOVERY_VERIFIED_PROGRESSING',now:'2026-10-03T19:05:00Z'});
  assert.equal(r.state,'RELEASED'); assert.equal(r.expires_at,r.released_at); assert.equal(watchdogLeaseActive(r,{now:'2026-10-03T19:05:01Z'}),false);
});
test('simultaneous contenders share exact optimistic SHA precondition',()=>{
  const lease=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'}).lease;
  const sha='a'.repeat(40);
  const a=watchdogLeaseWritePlan({current:lease,current_sha:sha,desired_lease:lease});
  const b=watchdogLeaseWritePlan({current:lease,current_sha:sha,desired_lease:{...lease,owner_slot:'B'}});
  assert.equal(a.expected_sha,sha); assert.equal(b.expected_sha,sha); assert.equal(a.optimistic_concurrency,true);
});
test('post-acquisition race re-read exits if run becomes healthy',()=>{
  const lease=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'}).lease;
  const health=classifyRunHealth({task_state:'Active',executor_state:'Running',last_progress_at:'2026-10-03T19:00:30Z',now:'2026-10-03T19:01:00Z'});
  assert.equal(watchdogDecision({active_pointer:active,classification:health,recovery_lease:lease,owner_slot:'A',substantive_worker_active:true,now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION');
});
test('missing Supervisor redispatches same executor before broader repair',()=>assert.equal(nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',same_executor_missing:true,authoritative_request:{request_key:'r'}}).action,'REDISPATCH_SAME_EXECUTOR'));
test('unclaimed repository request consumes exact request',()=>{
  const r={execution_id:active.execution_id,task_id:'18',request_key:'repo-current'};
  const x=nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',authoritative_request:r});
  assert.equal(x.action,'CONSUME_EXACT_QUEUED_REQUEST'); assert.equal(x.target,'repo-current');
});
test('highest repair epoch wins before timestamp so stale generic requests cannot supersede bounded recovery',()=>{
  const rs=[
    {execution_id:active.execution_id,task_id:'11',request_key:'old',repair_epoch:0,post_repair_attempt:0,created_at:'2026-10-03T19:00:00Z'},
    {execution_id:active.execution_id,task_id:'11',request_key:'bounded-post-repair',repair_epoch:1,post_repair_attempt:1,created_at:'2026-10-03T19:01:00Z'},
    {execution_id:active.execution_id,task_id:'11',request_key:'later-generic',repair_epoch:0,post_repair_attempt:0,created_at:'2026-10-03T19:02:00Z'},
    {execution_id:'history',task_id:'11',request_key:'wrong',repair_epoch:9,post_repair_attempt:9,created_at:'2026-10-03T19:03:00Z'}
  ];
  assert.equal(selectAuthoritativeRequest(rs,{execution_id:active.execution_id,task_id:'11'}).request_key,'bounded-post-repair');
});
test('Watchdog can persist a deterministic protected repair requirement instead of an owner handoff',()=>{
  const r=buildWatchdogProtectedRepairRequirement({
    execution_id:active.execution_id,
    edition_id:active.edition_id,
    execution_key:'2099-01-01-run1',
    production_branch:active.branch,
    task_id:'11',
    incident_id:'wd-repair-incident',
    repair_branch:'repair/synthetic',
    repair_branch_head_sha:'a'.repeat(40),
    repair_scope_digest:'sha256:bounded-scope',
    created_at:'2026-10-03T19:01:00Z'
  });
  assert.equal(r.state,'PROTECTED_REPAIR_REQUIRED');
  assert.equal(r.invariant,'actionable_recovery_must_not_terminate_at_owner_prompt_boundary');
  assert.equal(r.task_id,'11');
});

test('actionable blocker selects smallest repair',()=>assert.equal(nextWatchdogCorrectiveAction({classification:'BLOCKED_ACTIONABLE',stale_derived_state:true,same_executor_missing:true}).action,'RECONCILE_AUTHORITATIVE_STATE'));
test('external blocker is not bypassed',()=>assert.equal(watchdogDecision({active_pointer:active,classification:{state:'BLOCKED_EXTERNAL'},owner_slot:'C',now:'2026-10-03T19:01:00Z'}).action,'WAIT_EXTERNAL'));
test('stale Kanban cannot override authoritative real progress',()=>assert.equal(watchdogDecision({active_pointer:active,classification:{state:'HEALTHY_ACTIVE'},owner_slot:'D',substantive_worker_active:true,now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION'));
test('fresh status cannot hide real stall',()=>assert.equal(watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},owner_slot:'D',now:'2026-10-03T19:01:00Z'}).action,'RECOVER'));
test('Done tasks and accepted assets are protected',()=>{
  assert.equal(nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',task_done:true,same_executor_missing:true}).reason,'completed_task_protected');
  assert.equal(nextWatchdogCorrectiveAction({classification:'BLOCKED_ACTIONABLE',accepted_locked:true,authoritative_request:{request_key:'x'}}).reason,'accepted_asset_protected');
});
test('terminalization mid-repair stops production',()=>assert.equal(watchdogDecision({active_pointer:active,classification:{state:'TERMINAL'},owner_slot:'E',now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION'));
test('dispatch only is not recovery success',()=>{
  const v=verifyWatchdogRecoveryProgress({before:{task_state:'Active'},after:{task_state:'Active',dispatch_recorded:true}});
  assert.equal(v.verified,false); assert.equal(v.dispatch_only,true);
});
test('real active executor plus durable progress verifies recovery',()=>{
  const v=verifyWatchdogRecoveryProgress({before:{task_state:'Blocked',worker_claimed:false},after:{task_state:'Active',worker_claimed:true,worker_state:'Running',substantive_progress_at:'2026-10-03T19:01:00Z'},require_active_executor:true});
  assert.equal(v.verified,true); assert.equal(v.executor_active,true);
});
test('failed minimum action escalates rather than blind retry',()=>assert.equal(nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',same_executor_missing:true,authoritative_request:{request_key:'r'},failed_action_types:['REDISPATCH_SAME_EXECUTOR']}).action,'CONSUME_EXACT_QUEUED_REQUEST'));
test('durable movement without an active executor is not recovery success',()=>{
  const v=verifyWatchdogRecoveryProgress({before:{task_state:'Blocked'},after:{task_state:'Active',worker_result_key:'result'}});
  assert.equal(v.durable_progress,true); assert.equal(v.executor_active,false); assert.equal(v.verified,false);
});
test('one failed repair cannot end recovery while authorized actions remain',()=>{
  const x=watchdogRecoveryContinuation({verification:{verified:false,executor_active:false,durable_progress:false},remaining_authorized_actions:3});
  assert.equal(x.outcome,'CONTINUE_RECOVERY'); assert.equal(x.recovery_required,true); assert.equal(x.recovery_complete,false);
});
test('exhausted local actions re-diagnose instead of inventing an external blocker',()=>{
  const x=nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',failed_action_types:[...WATCHDOG_MINIMUM_ACTION_LADDER]});
  assert.equal(x.action,'REDIAGNOSE_AND_CONTINUE');
});
test('BLOCKED_EXTERNAL requires a verified external condition',()=>{
  const x=nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',failed_action_types:[...WATCHDOG_MINIMUM_ACTION_LADDER],verified_external_blocker:true});
  assert.equal(x.action,'BLOCKED_EXTERNAL');
});
test('safe boundary is an unresolved handoff, never recovery success',()=>{
  const x=watchdogRecoveryContinuation({verification:{verified:false,executor_active:false,durable_progress:false},remaining_authorized_actions:0,safe_boundary_required:true});
  assert.equal(x.outcome,'SAFE_BOUNDARY_HANDOFF'); assert.equal(x.recovery_required,true); assert.equal(x.recovery_complete,false);
});
test('watchdog event shape is append-only incident evidence',()=>{
  const e=buildWatchdogEvent({execution_id:active.execution_id,edition_id:active.edition_id,task_id:'18',incident_id:incident,slot_id:'A',classification:'STALE_ACTIVE',lease_generation:1,action_key:action,action_taken:'CONSUME_EXACT_QUEUED_REQUEST',verification_evidence:{worker_claimed:true},final_outcome:'RECOVERY_VERIFIED_PROGRESSING',occurred_at:'2026-10-03T19:02:00Z'});
  assert.equal(e.schema_version,'chatgpt-watchdog-event-v1'); assert.equal(e.task_id,'18');
});
test('synthetic ACTIVE + HEALTHY is no-op',()=>assert.equal(watchdogDecision({active_pointer:active,classification:{state:'HEALTHY_ACTIVE'},owner_slot:'A',substantive_worker_active:true,now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION'));
test('synthetic ACTIVE + STALLED acquires, repairs, verifies and releases',()=>{
  assert.equal(watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},owner_slot:'A',now:'2026-10-03T19:00:00Z'}).action,'RECOVER');
  const l=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'});
  assert.equal(l.acquired,true);
  assert.equal(nextWatchdogCorrectiveAction({classification:'STALE_ACTIVE',authoritative_request:{request_key:'req-current'}}).action,'CONSUME_EXACT_QUEUED_REQUEST');
  assert.equal(verifyWatchdogRecoveryProgress({before:{task_state:'Blocked',worker_claimed:false},after:{task_state:'Active',worker_claimed:true,worker_state:'Running',worker_result_key:'result',substantive_progress_at:'2026-10-03T19:01:30Z'}}).verified,true);
  assert.equal(releaseWatchdogRecoveryLease(l.lease,{owner_slot:'A',generation:1,reason:'RECOVERY_VERIFIED_PROGRESSING',now:'2026-10-03T19:02:00Z'}).state,'RELEASED');
});
test('synthetic ACTIVE + RECOVERY ALREADY RUNNING prevents duplicate action',()=>{
  const l=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z'}).lease;
  assert.equal(watchdogDecision({active_pointer:active,classification:{state:'STALE_ACTIVE'},recovery_lease:l,owner_slot:'B',now:'2026-10-03T19:05:00Z'}).action,'NO_ACTION');
});
test('synthetic DEAD RECOVERY OWNER takes over same execution',()=>{
  const l=acquireWatchdogRecoveryLease(null,{execution_id:active.execution_id,incident_id:incident,owner_slot:'A',action_key:action,now:'2026-10-03T19:00:00Z',ttl_ms:12*60*1000}).lease;
  const t=acquireWatchdogRecoveryLease(l,{execution_id:active.execution_id,incident_id:incident,owner_slot:'B',action_key:action,now:'2026-10-03T19:13:00Z'});
  assert.equal(t.acquired,true); assert.equal(t.lease.generation,2); assert.equal(t.lease.execution_id,active.execution_id);
});
test('synthetic TERMINAL does no production work',()=>assert.equal(watchdogDecision({active_pointer:{...active,active:false,terminal:true},classification:{state:'TERMINAL'},owner_slot:'F',now:'2026-10-03T19:01:00Z'}).action,'NO_ACTION'));
test('repository ring contract is exact',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/task-recovery-contracts.json','utf8')).chatgpt_watchdog_ring;
  assert.deepEqual(validateWatchdogRingContract(c),[]); assert.deepEqual(c.recovery.minimum_action_ladder,WATCHDOG_MINIMUM_ACTION_LADDER);
});
test('startup and host bind equivalent six-slot image-consumer ring and remove standalone minute 48',()=>{
  const s=fs.readFileSync('docs/operations/DAILY-UNATTENDED-STARTUP.md','utf8');
  assert.match(s,/03, 13, 23, 33, 43 and 53/); assert.match(s,/watchdog-leases/); assert.doesNotMatch(s,/Hourly recovery \/ scheduled native-image consumer/);
  const h=JSON.parse(fs.readFileSync('docs/operations/unattended-image-host.json','utf8'));
  assert.equal(h.reusable_consumer_pool.scheduler_kind,'chatgpt_watchdog_ring');
  assert.equal(h.reusable_consumer_pool.all_slots_equivalent,true);
  assert.deepEqual(h.reusable_consumer_pool.slot_ids,['A','B','C','D','E','F']);
  assert.equal(h.reusable_consumer_pool.automation_ids.length,6);
  assert.equal(h.reusable_consumer_pool.nominal_pickup_minutes,10);
  assert.equal(h.reusable_consumer_pool.normal_queued_native_request_consumption,true);
  assert.equal(h.watchdog_ring.nominal_check_minutes,10);
  assert.equal(h.watchdog_ring.bound_reusable_consumer_slot,null);
});
test('GitHub inner watchdog remains every five minutes',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-watchdog.yml','utf8'); assert.match(y,/cron: '\*\/5 \* \* \* \*'/);
});

test('GitHub inner watchdog publishes compact health to a bounded runtime ref',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-watchdog.yml','utf8');
  assert.match(y,/watchdog-health\.mjs/);
  assert.match(y,/runtime\/watchdog-health/);
  assert.match(y,/data\/operations\/watchdog-health\.json/);
  assert.match(y,/force-with-lease/);
  assert.match(y,/contents: write/);
  assert.match(y,/gh workflow run run-supervisor\.yml[\s\S]*--repo "\$GITHUB_REPOSITORY"/);
});

