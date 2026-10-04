import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  activeRunDecision,
  acquireWriterLease,
  assertWriterFence,
  releaseWriterLease,
  classifyRunHealth,
  applyImmediateImageRecovery,
  normalizeTaskEvent,
  recoverableBlockerEvidence,
  refreshScheduledWorkerFence,
  buildTaskWriterHandoffRelease,
  validateTaskRecoveryContracts,
  taskRecoveryDecision,
  buildWorkerRequest,
  buildEngineeringRepairRequest,
  projectKanbanFromEvents,
  validateKanbanContract,
  kanbanProjectionFresh,
  latestRecoverableImage,
  classifyRepositoryQueueLiveness
} from '../lib/run-supervisor.mjs';

function contract(){
  const tasks={};
  for(let i=0;i<=29;i++){
    const id=String(i).padStart(2,'0');
    tasks[id]={
      task_id:id,title:'Task '+id,capability:id==='15'?'native_chatgpt':'repository',
      normal_operation:'Execute task '+id,
      success_evidence:'Durable success receipt',
      stale_after_seconds:900,
      first_recovery:'Resume the same durable operation',
      alternate_recovery:'Reconcile durable evidence then retry bounded work',
      retry_limit:2,
      terminal_failure_condition:'Only external nonrecoverable failure after bounded recovery',
      invalidate_downstream:[],
      simplification_rule:'Preserve valid prior work and repair only the affected task'
    };
  }
  return {
    schema_version:'task-recovery-contracts-v1',
    tasks,
    protected_repair_autonomy:{
      schema_version:'protected-repair-autonomy-contract-v1',
      enabled:true,
      executor_workflow:'.github/workflows/protected-repair-executor.yml',
      exact_one_pr_per_repair_key:true,
      exact_head_ci_required:true,
      active_execution_and_task_revalidation_before_merge:true,
      direct_main_write_allowed:false,
      merge_is_recovery_success:false,
      same_execution_resume_required:true,
      same_task_resume_required:true,
      real_executor_required_for_success:true,
      substantive_durable_progress_required_for_success:true,
      invariant:'actionable_recovery_must_not_terminate_at_owner_prompt_boundary',
      dead_writer_cleanup:{
        live_writer_takeover_allowed:false,
        terminal_workflow_status_required:'completed',
        terminal_conclusions:['failure','cancelled'],
        workflow_run_identity_must_match_owner:true,
        child_worker_live_forbids_takeover:true,
        post_terminal_substantive_write_forbids_takeover:true
      },
      cost_boundary:{
        chatgpt_work:false,codex:false,paid_apis:false,paid_external_services:false,
        new_credentials:false,alternate_accounts:false,browser_automation:false
      }
    }
  };
}

test('task event normalization accepts safe from_state/to_state aliases without overriding canonical fields',()=>{
  const aliased=normalizeTaskEvent({task_id:'11',from_state:'Active',to_state:'Done',at:'2026-10-03T07:04:53.132Z'});
  assert.equal(aliased.from,'Active');
  assert.equal(aliased.to,'Done');
  const canonical=normalizeTaskEvent({task_id:'11',from:'Blocked',to:'Done',from_state:'Active',to_state:'Blocked',at:'2026-10-03T07:04:53.132Z'});
  assert.equal(canonical.from,'Blocked');
  assert.equal(canonical.to,'Done');
});

test('duplicate run is rejected while same identity resumes',()=>{
  const active={execution_id:'run4',edition_id:'dab-edition-2026-10-01',branch:'b',terminal:false};
  assert.equal(activeRunDecision({activeRun:active,request:{...active}}).action,'resume');
  assert.equal(activeRunDecision({activeRun:active,request:{execution_id:'run4b',edition_id:active.edition_id,branch:'c'}}).reason,'duplicate_execution_for_same_edition');
});

test('writer lease fences stale executors and permits takeover only after expiry',()=>{
  const first=acquireWriterLease(null,{execution_id:'run4',owner_id:'supervisor-a',now:'2026-10-01T20:00:00Z',ttl_ms:120000});
  assert.equal(first.acquired,true);
  const blocked=acquireWriterLease(first.lease,{execution_id:'run4',owner_id:'supervisor-b',now:'2026-10-01T20:01:00Z',ttl_ms:120000});
  assert.equal(blocked.acquired,false);
  const takeover=acquireWriterLease(first.lease,{execution_id:'run4',owner_id:'supervisor-b',now:'2026-10-01T20:03:00Z',ttl_ms:120000});
  assert.equal(takeover.acquired,true);
  assert.ok(takeover.lease.generation>first.lease.generation);
  const unprovenForced=acquireWriterLease(first.lease,{execution_id:'run4',owner_id:'supervisor-c',now:'2026-10-01T20:01:30Z',ttl_ms:120000,takeover_dead_owner:true});
  assert.equal(unprovenForced.acquired,false);
  assert.equal(unprovenForced.reason,'live_or_unproven_writer_cannot_be_stolen');
  assert.throws(()=>assertWriterFence(first.lease,{execution_id:'run4',owner_id:'supervisor-a',generation:first.lease.generation,now:'2026-10-01T20:03:01Z'}),/WRITER_LEASE_EXPIRED/);
});

test('generic writer release ends authority at a protected repair boundary',()=>{
  const first=acquireWriterLease(null,{execution_id:'run4',owner_id:'supervisor-a',now:'2026-10-01T20:00:00Z',ttl_ms:120000});
  const released=releaseWriterLease(first.lease,{
    execution_id:'run4',owner_id:'supervisor-a',generation:first.lease.generation,
    reason:'PROTECTED_REPAIR_IN_PROGRESS',now:'2026-10-01T20:00:30Z'
  });
  assert.equal(released.state,'RELEASED');
  assert.equal(released.expires_at,'2026-10-01T20:00:30Z');
  const replacement=acquireWriterLease(released,{
    execution_id:'run4',owner_id:'supervisor-b',now:'2026-10-01T20:00:31Z',ttl_ms:120000
  });
  assert.equal(replacement.acquired,true);
  assert.ok(replacement.lease.generation>first.lease.generation);
});

test('same-owner lease renewal never shortens an existing fence',()=>{
  const first=acquireWriterLease(null,{execution_id:'run5',owner_id:'supervisor-a',now:'2026-10-02T12:00:00Z',ttl_ms:21_600_000});
  const renewed=acquireWriterLease(first.lease,{execution_id:'run5',owner_id:'supervisor-a',now:'2026-10-02T12:05:00Z',ttl_ms:1_800_000});
  assert.equal(renewed.acquired,true);
  assert.equal(renewed.reason,'lease_renewed');
  assert.equal(renewed.lease.generation,first.lease.generation);
  assert.equal(renewed.lease.expires_at,first.lease.expires_at);
});

test('stale Active is detected without an owner status request',()=>{
  const d=classifyRunHealth({task_state:'Active',executor_state:'Stopped',last_progress_at:'2026-10-01T20:00:00Z',now:'2026-10-01T20:01:00Z'});
  assert.equal(d.state,'STALE_ACTIVE');
  assert.equal(d.action,'resume_or_reconcile_same_task');
});

test('actionable Blocked automatically selects recovery contract',()=>{
  const c=contract();
  const classification=classifyRunHealth({task_state:'Blocked',blocked_recoverable:true});
  assert.equal(classification.state,'BLOCKED_ACTIONABLE');
  const decision=taskRecoveryDecision({classification,taskContract:c.tasks['15'],recoveryAttempts:0});
  assert.equal(decision.action,'first_recovery');
  assert.equal(decision.capability,'native_chatgpt');
});

test('rejected Active image attempt becomes immediately actionable without waiting for stale timeout',()=>{
  const c=contract(); c.tasks['15'].retry_limit=4;
  const override=applyImmediateImageRecovery({
    task_id:'15',
    task_state:'Active',
    image_recovery:{status:'rejected',attempt:3,recovery_action:'Generate m08 attempt 4 from the sealed spec only.'},
    recovery_attempts:0
  });
  assert.equal(override.immediate_recovery,true);
  assert.equal(override.task_state,'Blocked');
  assert.equal(override.recovery_attempts,3);
  const classification=classifyRunHealth({
    task_state:override.task_state,
    blocked_recoverable:override.blocked_recoverable,
    last_progress_at:'2026-10-01T22:57:13Z',
    now:'2026-10-01T22:57:14Z'
  });
  assert.equal(classification.state,'BLOCKED_ACTIONABLE');
  const decision=taskRecoveryDecision({classification,taskContract:c.tasks['15'],recoveryAttempts:override.recovery_attempts});
  assert.equal(decision.action,'alternate_recovery');
});

test('subject/context mismatch bypasses same-context retries and enters engineering repair immediately',()=>{
  const c=contract();
  c.tasks['15'].retry_limit=4;
  c.tasks['15'].engineering_repair={
    enabled:true,max_epochs:1,capability:'repository',
    instruction:'Repair execution-context binding before another native image attempt.',
    required_proofs:['fresh_single_story_worker_isolation'],
    post_repair_attempt_limit:1,
    post_repair_operation:'Execute one fresh-context attempt using only the sealed single-story specification.'
  };
  const record={
    task_id:'15',candidate_id:'m08',status:'rejected',attempt:1,
    targeted_next_action:'Retry the same sealed single-story specification in fresh isolated image context.',
    observed_at:'2026-10-03T06:54:19Z',
    review:{rejection_code:'WRONG_SUBJECT_AND_CONTEXT_CONTAMINATION',rejection_reason:'Unrelated orchestration subject displaced the sealed prompt.'}
  };
  const latest=latestRecoverableImage([record],{task_id:'15',candidate_id:'m08'});
  assert.equal(latest.recovery_action,record.targeted_next_action);
  const override=applyImmediateImageRecovery({task_id:'15',task_state:'Active',image_recovery:latest});
  assert.equal(override.force_engineering_repair,true);
  assert.equal(override.recovery_attempts,1);
  const classification=classifyRunHealth({task_state:override.task_state,blocked_recoverable:override.blocked_recoverable});
  const decision=taskRecoveryDecision({
    classification,taskContract:c.tasks['15'],recoveryAttempts:override.recovery_attempts,
    forceEngineeringRepair:override.force_engineering_repair
  });
  assert.equal(decision.action,'engineering_repair');
  assert.equal(decision.repair_epoch,1);
});

test('Blocked image task inherits rejected attempt count for repair-epoch decision',()=>{
  const c=contract();
  c.tasks['15'].retry_limit=4;
  c.tasks['15'].engineering_repair={
    enabled:true,max_epochs:1,capability:'repository',
    instruction:'Repair image mechanism before another attempt.',
    required_proofs:['fresh_single_story_worker_isolation','small_png_exact_byte_transport_preflight_pass']
  };
  const override=applyImmediateImageRecovery({
    task_id:'15',
    task_state:'Blocked',
    image_recovery:{status:'rejected',attempt:4,recovery_action:'Do not create attempt 5.'},
    recovery_attempts:0
  });
  assert.equal(override.task_state,'Blocked');
  assert.equal(override.blocked_recoverable,true);
  assert.equal(override.recovery_attempts,4);
  const classification=classifyRunHealth({task_state:'Blocked',blocked_recoverable:override.blocked_recoverable});
  const decision=taskRecoveryDecision({
    classification,
    taskContract:c.tasks['15'],
    recoveryAttempts:override.recovery_attempts,
    repairEpochs:0
  });
  assert.equal(decision.action,'engineering_repair');
  assert.equal(decision.repair_epoch,1);
});

test('image retry budget exhaustion produces terminal failure instead of a fifth attempt',()=>{
  const c=contract(); c.tasks['15'].retry_limit=4;
  const override=applyImmediateImageRecovery({
    task_id:'15',
    task_state:'Active',
    image_recovery:{status:'rejected',attempt:4,recovery_action:'Attempt budget exhausted; preserve evidence.'},
    recovery_attempts:0
  });
  const classification=classifyRunHealth({task_state:override.task_state,blocked_recoverable:override.blocked_recoverable});
  const decision=taskRecoveryDecision({classification,taskContract:c.tasks['15'],recoveryAttempts:override.recovery_attempts});
  assert.equal(decision.action,'terminal_failure');
});

test('all Tasks 00 through 29 require recovery contracts',()=>{
  assert.deepEqual(validateTaskRecoveryContracts(contract()),[]);
  const bad=contract(); delete bad.tasks['16'];
  assert.ok(validateTaskRecoveryContracts(bad).includes('task_recovery_missing:16'));
});

test('retry exhaustion enters one engineering repair epoch instead of dead-ending',()=>{
  const c=contract();
  c.tasks['15'].retry_limit=4;
  c.tasks['15'].engineering_repair={
    enabled:true,max_epochs:1,capability:'repository',
    instruction:'Repair image mechanism before another attempt.',
    required_proofs:['fresh_single_story_worker_isolation','small_png_exact_byte_transport_preflight_pass']
  };
  const classification=classifyRunHealth({task_state:'Blocked',blocked_recoverable:true});
  const first=taskRecoveryDecision({classification,taskContract:c.tasks['15'],recoveryAttempts:4,repairEpochs:0});
  assert.equal(first.action,'engineering_repair');
  assert.equal(first.repair_epoch,1);
  const after=taskRecoveryDecision({classification,taskContract:c.tasks['15'],recoveryAttempts:4,repairEpochs:1});
  assert.equal(after.action,'terminal_failure');
});

test('successful repair epoch authorizes exactly one post-repair attempt',()=>{
  const c=contract();
  c.tasks['15'].retry_limit=4;
  c.tasks['15'].engineering_repair={
    enabled:true,max_epochs:1,capability:'repository',
    instruction:'Repair image mechanism before another attempt.',
    required_proofs:['proof-a'],
    post_repair_attempt_limit:1,
    post_repair_operation:'Run one fresh post-repair image attempt.'
  };
  const classification=classifyRunHealth({task_state:'Blocked',blocked_recoverable:true});
  const allowed=taskRecoveryDecision({
    classification,taskContract:c.tasks['15'],recoveryAttempts:4,
    repairEpochs:1,repairReady:true,postRepairAttempts:0
  });
  assert.equal(allowed.action,'post_repair_attempt');
  assert.equal(allowed.post_repair_attempt,1);
  const exhausted=taskRecoveryDecision({
    classification,taskContract:c.tasks['15'],recoveryAttempts:4,
    repairEpochs:1,repairReady:true,postRepairAttempts:1
  });
  assert.equal(exhausted.action,'terminal_failure');
});

test('engineering repair request is deterministic and bound to exact run/task/epoch',()=>{
  const args={
    execution_id:'run4',edition_id:'dab-edition-2026-10-01',branch:'b',task_id:'15',
    instruction:'Repair exact mechanism',writer_generation:3,repair_epoch:1,
    required_proofs:['proof-a','proof-b'],created_at:'2026-10-01T20:00:00Z'
  };
  const a=buildEngineeringRepairRequest(args), b=buildEngineeringRepairRequest(args);
  assert.equal(a.request_key,b.request_key);
  assert.equal(a.request_kind,'engineering_repair');
  assert.equal(a.capability,'repository');
  assert.equal(a.repair_epoch,1);
});

test('worker request is idempotent for the same durable recovery request',()=>{
  const args={execution_id:'run4',edition_id:'dab-edition-2026-10-01',branch:'b',task_id:'15',capability:'native_chatgpt',instruction:'Resume same image attempt',writer_generation:3,recovery_attempt:1,created_at:'2026-10-01T20:00:00Z'};
  assert.equal(buildWorkerRequest(args).request_key,buildWorkerRequest(args).request_key);
});

test('recoverable blocker schema drift is normalized into one actionable machine contract',()=>{
  const drift={
    task_id:'11',state:'Blocked',at:'2026-10-02T14:03:56Z',
    recoverable:true,external_blocker:false,
    targeted_next_action:'Generate the bounded targeted retry from the sealed story spec.'
  };
  const normalized=normalizeTaskEvent(drift);
  assert.equal(normalized.to,'Blocked');
  assert.equal(normalized.recovery_action,drift.targeted_next_action);
  const evidence=recoverableBlockerEvidence(drift);
  assert.equal(evidence.actionable,true);
  assert.equal(evidence.normalized.to,'Blocked');
  assert.equal(evidence.normalized.recovery_action,drift.targeted_next_action);
  assert.equal(recoverableBlockerEvidence({...drift,recoverable:false}).actionable,false);
});

test('scheduled worker refreshes current fence at invocation and stale embedded generation cannot mutate',()=>{
  const supervisor=acquireWriterLease(null,{
    execution_id:'run5',owner_id:'run-supervisor:37017573659',
    now:'2026-10-02T14:06:59Z',ttl_ms:21600000
  }).lease;
  supervisor.generation=6;
  const request=buildWorkerRequest({
    execution_id:'run5',edition_id:'dab-edition-2026-10-02',branch:'b',task_id:'11',
    capability:'native_chatgpt',instruction:'same task',writer_generation:5,
    created_at:'2026-10-02T14:10:44Z'
  });
  const refreshed=refreshScheduledWorkerFence(supervisor,{
    request,owner_id:'scheduled-image:task11',now:'2026-10-02T14:10:45Z',ttl_ms:1800000
  });
  assert.equal(refreshed.acquired,true);
  assert.equal(refreshed.stale_scheduling_generation,true);
  assert.equal(refreshed.request_generation_is_provenance,true);
  assert.ok(refreshed.authority_generation>6);
  assert.throws(()=>assertWriterFence(refreshed.lease,{
    execution_id:'run5',owner_id:'scheduled-image:task11',generation:5,now:'2026-10-02T14:10:46Z'
  }),/STALE_WRITER_FENCE/);
  assert.equal(assertWriterFence(refreshed.lease,{
    execution_id:'run5',owner_id:'scheduled-image:task11',generation:refreshed.authority_generation,now:'2026-10-02T14:10:46Z'
  }),true);
});

test('task-specific worker release is explicit and event-driven Supervisor handoff compatible',()=>{
  const lease=acquireWriterLease(null,{
    execution_id:'run5',owner_id:'scheduled-image:task16',now:'2026-10-02T15:18:00Z',ttl_ms:1800000
  }).lease;
  const released=buildTaskWriterHandoffRelease(lease,{
    execution_id:'run5',owner_id:'scheduled-image:task16',generation:lease.generation,
    task_id:'16',boundary:'Done',now:'2026-10-02T15:20:58Z'
  });
  assert.equal(released.released,true);
  assert.equal(released.released_at,'2026-10-02T15:20:58Z');
  assert.equal(released.release_reason,'TASK_16_DONE_HANDOFF_TO_SUPERVISOR');
  assert.equal(released.expires_at,released.released_at);
});

test('Kanban contract is exactly Backlog to WIP to Done with all 30 task durations and total elapsed',()=>{
  const tasks=Object.fromEntries(Array.from({length:30},(_,i)=>[String(i).padStart(2,'0'),{title:'Task '+String(i).padStart(2,'0')}]));
  const events=[
    {task_id:'00',from:'Backlog',to:'Active',at:'2026-10-01T20:00:00Z'},
    {task_id:'00',from:'Active',to:'Done',at:'2026-10-01T20:01:00Z'},
    {task_id:'01',from:'Backlog',to:'Active',at:'2026-10-01T20:01:01Z'}
  ];
  const k=projectKanbanFromEvents({tasks,events,execution_id:'run4',edition_id:'dab-edition-2026-10-01',observed_at:'2026-10-01T20:02:00Z'});
  assert.deepEqual(k.columns,['Backlog','WIP','Done']);
  assert.equal(Object.keys(k.tasks).length,30);
  assert.equal(k.tasks['00'].column,'Done');
  assert.equal(k.tasks['01'].column,'WIP');
  assert.equal(k.tasks['02'].column,'Backlog');
  assert.equal(k.tasks['00'].duration,'60s');
  assert.equal(k.tasks['01'].duration,'59s');
  assert.equal(k.tasks['02'].duration,'unavailable');
  assert.equal(k.total_brief_elapsed,'120s');
  assert.deepEqual(validateKanbanContract({kanban:k,events,require_all_tasks:true}),[]);
  assert.equal(kanbanProjectionFresh({events,kanban:k}).fresh,true);
});

test('Kanban failing fixtures enforce wrong order, Current column, missing durations, missing total elapsed and stale projection',()=>{
  const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/kanban-contract-failures.json',import.meta.url),'utf8'));
  const tasks=Object.fromEntries(Array.from({length:30},(_,i)=>[String(i).padStart(2,'0'),{title:'Task '+i}]));
  const events=[{task_id:'00',from:'Backlog',to:'Active',at:'2026-10-01T20:00:00Z'}];
  const base=projectKanbanFromEvents({tasks,events,execution_id:'run4',edition_id:'dab-edition-2026-10-01',observed_at:'2026-10-01T20:02:00Z'});
  const setPath=(obj,dotted,value)=>{
    const keys=dotted.split('.'); let cur=obj;
    for(const key of keys.slice(0,-1)) cur=cur[key];
    cur[keys.at(-1)]=value;
  };
  const deletePath=(obj,dotted)=>{
    const keys=dotted.split('.'); let cur=obj;
    for(const key of keys.slice(0,-1)) cur=cur[key];
    delete cur[keys.at(-1)];
  };
  assert.equal(fixtures.length,5);
  for(const fixture of fixtures){
    const candidate=structuredClone(base);
    if(fixture.set) setPath(candidate,fixture.set.path,fixture.set.value);
    if(fixture.delete) deletePath(candidate,fixture.delete);
    const errors=validateKanbanContract({kanban:candidate,events});
    assert.ok(errors.includes(fixture.expected_error),`${fixture.name}: ${errors.join(',')}`);
    assert.equal(kanbanProjectionFresh({events,kanban:candidate}).fresh,false,fixture.name);
  }
});

test('terminal classification always goes to Task 29 before supervisor stop',()=>{
  const d=classifyRunHealth({terminal:true,task_state:'Done'});
  assert.equal(d.state,'TERMINAL');
  assert.equal(taskRecoveryDecision({classification:d,taskContract:contract().tasks['29']}).action,'task29');
});

test('Supervisor workflow contains the one-minute loop, single concurrency lane and fenced writer',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/group: daily-ai-brief-run-supervisor/);
  assert.match(y,/cancel-in-progress: true/);
  assert.match(y,/_generator\/lib\/run-supervisor\.mjs/);
  assert.match(y,/docs\/operations\/task-recovery-contracts\.json/);
  assert.match(y,/takeover=true/);
  assert.match(y,/sleep 60/);
  assert.match(y,/writer-lease/);
  assert.match(y,/assert-fence/);
  const loop=y.slice(y.indexOf('Persistent approximately one-minute supervision loop'));
  const assertFence=loop.indexOf('run-supervisor.mjs assert-fence');
  const renewLease=loop.indexOf('run-supervisor.mjs writer-lease');
  assert.ok(assertFence>=0 && renewLease>=0 && assertFence<renewLease);
  assert.ok(renewLease<loop.indexOf('image-chunk-bridge.mjs consume'));
  assert.match(loop,/image-transport-requests/);
  assert.match(loop,/image-transport-results/);
  assert.match(y,/timeout-minutes: 330/);
  assert.doesNotMatch(y,/schedule:/);
});


test('Supervisor dead-writer proof path avoids indented shell heredocs',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  const acquire=y.slice(y.indexOf('Acquire fenced writer authority for this exact execution'),y.indexOf('Persistent approximately one-minute supervision loop'));
  assert.match(acquire,/proof_rel="\$\(node -e '/);
  assert.doesNotMatch(acquire,/node - <<'NODE'/);
  assert.match(acquire,/dead-writer-proof-final\.json/);
});

test('Supervisor delegates only when the newest unfinished Tasks 11-16 request is queued for the scheduled image consumer',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/Yield while a scheduled image consumer owns the next operation/);
  assert.match(y,/const latest=new Map\(\)/);
  assert.match(y,/Date\.parse\(x\.created_at\|\|0\)/);
  assert.match(y,/ts>pts\|\|\(ts===pts&&n>prior\.n\)/);
  assert.match(y,/eventNames\.some\(n=>n\.startsWith\(t\+"-done"\)&&n\.endsWith\("\.json"\)\)/);
  assert.match(y,/x\.capability==="native_chatgpt"&&String\(x\.status\|\|""\)==="queued_for_scheduled_consumer"/);
  assert.match(y,/Supervisor will not acquire or take over the writer fence/);
  const configure=y.indexOf('- name: Configure run-branch writer');
  const delegation=y.indexOf('- name: Yield while a scheduled image consumer owns the next operation');
  assert.ok(delegation>=0 && configure>delegation);
  assert.match(y,/Configure run-branch writer\n        if: steps\.boundary\.outputs\.write_allowed == 'true' && steps\.image_delegation\.outputs\.delegated != 'true'/);
  assert.match(y,/Acquire fenced writer authority for this exact execution\n        if: steps\.boundary\.outputs\.write_allowed == 'true' && steps\.image_delegation\.outputs\.delegated != 'true'/);
  assert.match(y,/Persistent approximately one-minute supervision loop\n        if: steps\.boundary\.outputs\.write_allowed == 'true' && steps\.image_delegation\.outputs\.delegated != 'true'/);
});

test('watchdog runs every five minutes and can only restart the active pointer identity',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-watchdog.yml','utf8');
  assert.match(y,/cron: '\*\/5 \* \* \* \*'/);
  assert.match(y,/data\/operations\/active-production-run\.json/);
  assert.match(y,/gh workflow run run-supervisor\.yml/);
  assert.match(y,/takeover_dead_owner=true/);
  assert.doesNotMatch(y,/create.*run/i);
});

test('watchdog immediately reacts to a failed Supervisor completion',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-watchdog.yml','utf8');
  assert.match(y,/workflow_run:/);
  assert.match(y,/Daily AI Brief Run Supervisor/);
  assert.match(y,/conclusion != 'success'/);
});

test('explicit worker release can hand the same run back to the Supervisor',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-handoff.yml','utf8');
  assert.match(y,/writer-leases/);
  assert.match(y,/HANDOFF_TO_SUPERVISOR/);
  assert.match(y,/released_at/);
  assert.match(y,/release_reason/);
  assert.match(y,/active-production-run\.json/);
  assert.match(y,/gh workflow run run-supervisor\.yml/);
  assert.match(y,/takeover_dead_owner=true/);
});

test('Supervisor yields cleanly when another fenced writer takes ownership',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/if ! node control\/_tools\/run-supervisor\.mjs assert-fence/);
  assert.match(y,/Supervisor yields without treating the handoff as a production failure/);
  assert.match(y,/cat \/tmp\/fence-check\.err \|\| true/);
  assert.match(y,/Writer fence changed during renewal; Supervisor yields without treating the handoff as a production failure/);
  assert.match(y,/cat \/tmp\/writer-renewal\.err \|\| true/);
  assert.match(y,/break/);
});

test('Supervisor consumes repository engineering repairs instead of leaving passive queue entries',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/repository-repair-consumer\.mjs consume/);
  assert.match(y,/request_kind.*engineering_repair/);
  assert.match(y,/request_capability.*repository/);
  assert.match(y,/pull-requests: read/);
  assert.match(y,/worker-results repair-epochs/);
});

test('enqueue records the one permitted post-repair dispatch in the repair epoch',()=>{
  const tool=fs.readFileSync('_tools/run-supervisor.mjs','utf8');
  assert.match(tool,/post_repair_attempts:Math\.max/);
  assert.match(tool,/last_post_repair_request_key/);
  assert.match(tool,/post_repair_dispatch_requires_passed_repair_epoch/);
});


test('Supervisor explicitly dispatches queued Task 17 repository work despite GITHUB_TOKEN push suppression',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/request_capability\" = \"repository\"/);
  assert.match(y,/request_task\" = \"17\"/);
  assert.match(y,/repository-task-consumer\.yml\/runs/);
  assert.match(y,/gh workflow run repository-task-consumer\.yml --ref \"\$RUN_BRANCH\"/);
  assert.match(y,/pushes created by GITHUB_TOKEN do not recursively trigger workflows/);
  assert.match(y,/active_repository_consumers/);
});


test('repository recovery contracts enforce the 60-second substantive-progress liveness boundary',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/task-recovery-contracts.json','utf8'));
  for(const id of ['17','18','19','20','21','22','24','27','28','29'])
    assert.equal(c.tasks[id].stale_after_seconds,60,id);
  assert.equal(c.repository_liveness_policy.max_idle_seconds,60);
  assert.match(c.repository_liveness_policy.rule,/substantive durable worker progress/i);
  assert.match(c.repository_liveness_policy.rule,/lease\/heartbeat\/Kanban-only/i);
  assert.match(c.repository_liveness_policy.primary_post_image_path,/same invocation/i);
  assert.match(c.repository_liveness_policy.fault_evidence_path,/liveness-faults/);
  assert.match(c.repository_liveness_policy.fault_semantics,/not substantive worker progress/i);
  assert.match(c.repository_liveness_policy.unsupported_event_wake,/does not currently admit/i);
  assert.match(c.repository_liveness_policy.forbidden_terminal_claim,/AWAITING_SCHEDULED_EXECUTOR/);
});

test('repository queue liveness faults after 60 seconds without substantive progress',()=>{
  const request={capability:'repository',task_id:'18',execution_id:'run-x',request_key:'abc',status:'queued',created_at:'2026-10-03T12:00:00.000Z'};
  assert.equal(classifyRepositoryQueueLiveness({request,now:'2026-10-03T12:00:59.999Z'}).state,'healthy_wait');
  const fault=classifyRepositoryQueueLiveness({request,now:'2026-10-03T12:01:00.000Z'});
  assert.equal(fault.state,'fault');
  assert.equal(fault.fault_code,'repository_consumer_unclaimed');
  assert.equal(fault.supervisor_bookkeeping_is_progress,false);
});

test('Supervisor persists an unclaimed repository-worker fault without globally stopping the run',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');
  assert.match(y,/repository-liveness/);
  assert.match(y,/--max-idle-seconds 60/);
  assert.match(y,/edition-execution\/liveness-faults/);
  assert.match(y,/route-specific fault is not a global stop/);
});


test('production writer handoff resumes the same execution for any Task 00-29 durable boundary',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-handoff.yml','utf8');
  assert.match(y,/TASK_\[0-2\]\[0-9\]_DONE_HANDOFF_TO_SUPERVISOR/);
  assert.match(y,/TASK_\[0-2\]\[0-9\]_BLOCKED_HANDOFF_TO_SUPERVISOR/);
  assert.match(y,/run_branch.*GITHUB_REF_NAME/);
  assert.match(y,/Supervisor already queued\/running/);
  assert.match(y,/gh workflow run run-supervisor\.yml/);
});

test('repeated post-repair context failure enters the next bounded repair epoch',()=>{
  const c=JSON.parse(fs.readFileSync(new URL('../../docs/operations/task-recovery-contracts.json',import.meta.url),'utf8'));
  const repair=c.tasks['11'].engineering_repair;
  assert.equal(repair.max_epochs,2);
  assert.equal(repair.post_repair_attempt_limit,1);
  assert.match(repair.instruction,/remains internal and actionable/i);
  assert.match(repair.post_repair_operation,/only the sealed prompt/i);
  const classification=classifyRunHealth({task_state:'Blocked',blocked_recoverable:true});
  const next=taskRecoveryDecision({
    classification,
    taskContract:c.tasks['11'],
    recoveryAttempts:4,
    repairEpochs:1,
    repairReady:true,
    postRepairAttempts:1,
    forceEngineeringRepair:true
  });
  assert.equal(next.action,'engineering_repair');
  assert.equal(next.repair_epoch,2);
  for(const id of ['11','12','13','14','15','16']){
    assert.equal(c.tasks[id].engineering_repair.max_epochs,2,id);
    assert.equal(c.tasks[id].engineering_repair.post_repair_attempt_limit,1,id);
  }
});
