import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  activeRunDecision,
  acquireWriterLease,
  assertWriterFence,
  classifyRunHealth,
  applyImmediateImageRecovery,
  validateTaskRecoveryContracts,
  taskRecoveryDecision,
  buildWorkerRequest,
  buildEngineeringRepairRequest,
  projectKanbanFromEvents,
  kanbanProjectionFresh
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
  return {schema_version:'task-recovery-contracts-v1',tasks};
}

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
  const forced=acquireWriterLease(first.lease,{execution_id:'run4',owner_id:'supervisor-c',now:'2026-10-01T20:01:30Z',ttl_ms:120000,takeover_dead_owner:true});
  assert.equal(forced.acquired,true);
  assert.ok(forced.lease.generation>first.lease.generation);
  assert.throws(()=>assertWriterFence(first.lease,{execution_id:'run4',owner_id:'supervisor-a',generation:first.lease.generation,now:'2026-10-01T20:03:01Z'}),/WRITER_LEASE_EXPIRED/);
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

test('Kanban drift is detected and corrected from authoritative events',()=>{
  const tasks={ '00':{title:'Readiness'}, '01':{title:'Bind'} };
  const events=[
    {task_id:'00',from:'Backlog',to:'Active',at:'2026-10-01T20:00:00Z'},
    {task_id:'00',from:'Active',to:'Done',at:'2026-10-01T20:01:00Z'},
    {task_id:'01',from:'Backlog',to:'Active',at:'2026-10-01T20:01:01Z'}
  ];
  const k=projectKanbanFromEvents({tasks,events,execution_id:'run4',edition_id:'dab-edition-2026-10-01',observed_at:'2026-10-01T20:02:00Z'});
  assert.equal(k.tasks['00'].state,'Done');
  assert.equal(k.tasks['01'].state,'Active');
  assert.equal(kanbanProjectionFresh({events,kanban:k}).fresh,true);
  const stale={...k,source_event_digest:'sha256:'+'0'.repeat(64)};
  assert.equal(kanbanProjectionFresh({events,kanban:stale}).fresh,false);
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
  assert.match(y,/timeout-minutes: 330/);
  assert.doesNotMatch(y,/schedule:/);
});

test('watchdog runs every five minutes and can only restart the active pointer identity',()=>{
  const y=fs.readFileSync('.github/workflows/run-supervisor-watchdog.yml','utf8');
  assert.match(y,/cron: '\*\/5 \* \* \* \*'/);
  assert.match(y,/data\/operations\/active-production-run\.json/);
  assert.match(y,/gh workflow run run-supervisor\.yml/);
  assert.match(y,/takeover_dead_owner=true/);
  assert.doesNotMatch(y,/create.*run/i);
});
