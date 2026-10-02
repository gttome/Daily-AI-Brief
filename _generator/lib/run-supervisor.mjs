import {createHash} from 'node:crypto';

export const RUN_SUPERVISOR_VERSION = 'run-supervisor-v2';
export const DEFAULT_SUPERVISOR_INTERVAL_MS = 60_000;
export const DEFAULT_WRITER_LEASE_MS = 120_000;
export const SUPERVISOR_STATES = Object.freeze([
  'HEALTHY_ACTIVE','READY_IDLE','STALE_ACTIVE','BLOCKED_ACTIONABLE','BLOCKED_EXTERNAL','TERMINAL'
]);
export const WORKER_CAPABILITIES = Object.freeze(['repository','native_chatgpt','protected_ci','deployment','verification']);

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const uniq = values => [...new Set((values || []).filter(Boolean))];

export function activeRunDecision({activeRun = null, request = null} = {}) {
  if (!request?.execution_id || !request?.edition_id || !request?.branch) throw Error('run_request_identity_required');
  if (!activeRun || activeRun.terminal === true) return {action:'start', reason:'no_nonterminal_active_run'};
  if (activeRun.execution_id === request.execution_id && activeRun.edition_id === request.edition_id && activeRun.branch === request.branch)
    return {action:'resume', reason:'same_run_identity'};
  if (activeRun.edition_id === request.edition_id)
    return {action:'reject', reason:'duplicate_execution_for_same_edition', active_execution_id:activeRun.execution_id};
  return {action:'reject', reason:'another_nonterminal_production_run_exists', active_execution_id:activeRun.execution_id};
}

export function acquireWriterLease(current, {
  execution_id, owner_id, now = new Date().toISOString(), ttl_ms = DEFAULT_WRITER_LEASE_MS,
  takeover_dead_owner = false
} = {}) {
  if (!execution_id || !owner_id || !stamp(now) || !Number.isInteger(ttl_ms) || ttl_ms < 1) throw Error('valid_writer_lease_request_required');
  const nowMs = Date.parse(now);
  if (current && current.execution_id !== execution_id && stamp(current.expires_at) && Date.parse(current.expires_at) > nowMs)
    return {acquired:false, reason:'writer_lease_owned_by_other_execution', lease:current};
  if (current && current.execution_id === execution_id && current.owner_id !== owner_id &&
      stamp(current.expires_at) && Date.parse(current.expires_at) > nowMs && takeover_dead_owner !== true)
    return {acquired:false, reason:'writer_lease_owned_by_other_worker', lease:current};
  const sameOwner = current?.execution_id === execution_id && current?.owner_id === owner_id;
  const generation = sameOwner ? current.generation : Math.max(0, Number(current?.generation || 0)) + 1;
  const lease = {
    schema_version:'run-writer-lease-v1',
    execution_id, owner_id, generation,
    acquired_at:sameOwner ? current.acquired_at : now,
    last_heartbeat_at:now,
    expires_at:new Date(nowMs + ttl_ms).toISOString()
  };
  return {acquired:true, reason:sameOwner ? 'lease_renewed' : 'lease_acquired', lease};
}

export function assertWriterFence(lease, {
  execution_id, owner_id, generation, now = new Date().toISOString()
} = {}) {
  if (!lease || !stamp(now)) throw Error('writer_lease_required');
  if (lease.execution_id !== execution_id || lease.owner_id !== owner_id || lease.generation !== generation) throw Error('STALE_WRITER_FENCE');
  if (!stamp(lease.expires_at) || Date.parse(lease.expires_at) <= Date.parse(now)) throw Error('WRITER_LEASE_EXPIRED');
  return true;
}

export function classifyRunHealth({
  terminal = false,
  task_state,
  executor_state = 'Unknown',
  last_progress_at = null,
  blocked_recoverable = false,
  blocked_external = false,
  next_task_ready = false,
  now = new Date().toISOString(),
  stale_threshold_ms = 15 * 60 * 1000
} = {}) {
  if (!stamp(now) || !Number.isInteger(stale_threshold_ms) || stale_threshold_ms < 1) throw Error('valid_supervisor_clock_required');
  if (terminal) return {state:'TERMINAL', action:'task29_or_stop'};
  if (task_state === 'Blocked') {
    if (blocked_recoverable) return {state:'BLOCKED_ACTIONABLE', action:'execute_recovery_contract'};
    return {state:'BLOCKED_EXTERNAL', action:'preserve_and_recheck', external:blocked_external === true};
  }
  if (task_state === 'Active') {
    if (!stamp(last_progress_at)) return {state:'STALE_ACTIVE', action:'resume_or_reconcile_same_task', reason:'active_without_progress_timestamp'};
    const age_ms = Math.max(0, Date.parse(now) - Date.parse(last_progress_at));
    if (age_ms >= stale_threshold_ms || ['Stopped','Idle'].includes(executor_state))
      return {state:'STALE_ACTIVE', action:'resume_or_reconcile_same_task', age_ms, executor_state};
    return {state:'HEALTHY_ACTIVE', action:'observe', age_ms, executor_state};
  }
  if (next_task_ready || ['Backlog','Ready','Tested','Done',null,undefined].includes(task_state))
    return {state:'READY_IDLE', action:'start_next_eligible_task'};
  return {state:'READY_IDLE', action:'start_next_eligible_task'};
}

export function applyImmediateImageRecovery({
  task_id,
  task_state,
  image_recovery = null,
  recovery_attempts = 0
} = {}) {
  const taskId = String(task_id || '').padStart(2,'0');
  const isImageTask = ['11','12','13','14','15','16'].includes(taskId);
  const rejectedWithRecoveryEvidence = isImageTask &&
    image_recovery?.status === 'rejected' &&
    typeof image_recovery?.recovery_action === 'string' &&
    image_recovery.recovery_action.trim().length > 0;
  const promoteActiveToBlocked = rejectedWithRecoveryEvidence && task_state === 'Active';
  const actionableBlocked = rejectedWithRecoveryEvidence && ['Active','Blocked'].includes(task_state);
  const attempt = rejectedWithRecoveryEvidence ? Number(image_recovery.attempt || 0) : 0;
  const baseRecoveries = Number(recovery_attempts || 0);
  return {
    task_state: promoteActiveToBlocked ? 'Blocked' : task_state,
    blocked_recoverable: actionableBlocked,
    recovery_attempts: rejectedWithRecoveryEvidence && Number.isFinite(attempt)
      ? Math.max(baseRecoveries, attempt)
      : baseRecoveries,
    immediate_recovery: actionableBlocked,
    recovery_reason: rejectedWithRecoveryEvidence ? 'rejected_image_attempt_with_explicit_recovery_action' : null
  };
}

export function validateTaskRecoveryContracts(contract = {}) {
  const errors = [];
  if (contract.schema_version !== 'task-recovery-contracts-v1') errors.push('task_recovery_schema_version');
  const tasks = contract.tasks || {};
  for (let n = 0; n <= 29; n++) {
    const id = String(n).padStart(2,'0');
    const task = tasks[id];
    if (!task) { errors.push(`task_recovery_missing:${id}`); continue; }
    if (task.task_id !== id) errors.push(`task_recovery_identity:${id}`);
    if (!WORKER_CAPABILITIES.includes(task.capability)) errors.push(`task_recovery_capability:${id}`);
    for (const field of ['normal_operation','success_evidence','first_recovery','alternate_recovery','terminal_failure_condition','simplification_rule'])
      if (typeof task[field] !== 'string' || !task[field].trim()) errors.push(`task_recovery_field:${id}:${field}`);
    if (!Number.isInteger(task.stale_after_seconds) || task.stale_after_seconds < 60) errors.push(`task_recovery_stale_threshold:${id}`);
    if (!Number.isInteger(task.retry_limit) || task.retry_limit < 0) errors.push(`task_recovery_retry_limit:${id}`);
    if (!Array.isArray(task.invalidate_downstream)) errors.push(`task_recovery_invalidation:${id}`);
    if (task.engineering_repair !== undefined) {
      const repair = task.engineering_repair;
      if (!repair || repair.enabled !== true) errors.push(`engineering_repair_enabled:${id}`);
      if (!Number.isInteger(repair.max_epochs) || repair.max_epochs < 1) errors.push(`engineering_repair_max_epochs:${id}`);
      if (repair.capability !== 'repository') errors.push(`engineering_repair_capability:${id}`);
      if (typeof repair.instruction !== 'string' || !repair.instruction.trim()) errors.push(`engineering_repair_instruction:${id}`);
      if (!Array.isArray(repair.required_proofs) || !repair.required_proofs.length) errors.push(`engineering_repair_required_proofs:${id}`);
    }
  }
  return uniq(errors);
}

export function taskRecoveryDecision({
  classification, taskContract, attempts = 0, recoveryAttempts = 0, repairEpochs = 0
} = {}) {
  if (!classification?.state || !taskContract) throw Error('classification_and_task_contract_required');
  if (classification.state === 'HEALTHY_ACTIVE') return {action:'observe'};
  if (classification.state === 'READY_IDLE') return {action:'dispatch_normal', capability:taskContract.capability, instruction:taskContract.normal_operation};
  if (classification.state === 'BLOCKED_EXTERNAL') return {action:'recheck', instruction:'Preserve exact blocker evidence; do not request owner status to advance.'};
  if (classification.state === 'TERMINAL') return {action:'task29'};
  if (attempts >= taskContract.retry_limit && classification.state === 'STALE_ACTIVE')
    return {action:'alternate_recovery', capability:taskContract.capability, instruction:taskContract.alternate_recovery};
  if (recoveryAttempts === 0)
    return {action:'first_recovery', capability:taskContract.capability, instruction:taskContract.first_recovery};
  if (recoveryAttempts < taskContract.retry_limit)
    return {action:'alternate_recovery', capability:taskContract.capability, instruction:taskContract.alternate_recovery};
  const repair = taskContract.engineering_repair;
  if (repair?.enabled === true && Number.isInteger(repair.max_epochs) && repairEpochs < repair.max_epochs)
    return {
      action:'engineering_repair',
      capability:repair.capability || 'repository',
      instruction:repair.instruction,
      repair_epoch:repairEpochs + 1,
      required_proofs:[...(repair.required_proofs || [])]
    };
  return {action:'terminal_failure', instruction:taskContract.terminal_failure_condition};
}

export function buildEngineeringRepairRequest({
  execution_id, edition_id, branch, task_id, instruction, writer_generation,
  repair_epoch, required_proofs = [], created_at = new Date().toISOString()
} = {}) {
  if (!execution_id || !edition_id || !branch || !/^\d{2}$/.test(task_id || '') ||
      !instruction || !Number.isInteger(writer_generation) || writer_generation < 1 ||
      !Number.isInteger(repair_epoch) || repair_epoch < 1 ||
      !Array.isArray(required_proofs) || !required_proofs.length || !stamp(created_at))
    throw Error('valid_engineering_repair_request_required');
  const request_key = hash(JSON.stringify({execution_id,task_id,repair_epoch,instruction,required_proofs}));
  return {
    schema_version:'run-engineering-repair-request-v1',
    request_key, request_kind:'engineering_repair',
    execution_id, edition_id, branch, task_id,
    capability:'repository', instruction, writer_generation,
    repair_epoch, required_proofs:[...required_proofs],
    created_at, status:'queued'
  };
}

export function buildWorkerRequest({
  execution_id, edition_id, branch, task_id, capability, instruction,
  writer_generation, recovery_attempt = 0, created_at = new Date().toISOString()
} = {}) {
  if (!execution_id || !edition_id || !branch || !/^\d{2}$/.test(task_id || '') ||
      !WORKER_CAPABILITIES.includes(capability) || !instruction || !Number.isInteger(writer_generation) || writer_generation < 1 || !stamp(created_at))
    throw Error('valid_worker_request_required');
  const key = hash(JSON.stringify({execution_id,task_id,capability,instruction,recovery_attempt}));
  return {
    schema_version:'run-worker-request-v1',
    request_key:key,
    execution_id,edition_id,branch,task_id,capability,instruction,
    writer_generation,recovery_attempt,created_at,
    status:'queued'
  };
}

export function eventLedgerDigest(events = []) {
  const normalized = [...events].map(e=>JSON.stringify(e)).sort().join('\n');
  return 'sha256:' + hash(normalized + (normalized ? '\n' : ''));
}

export function projectKanbanFromEvents({tasks = {}, events = [], execution_id, edition_id, observed_at = new Date().toISOString()} = {}) {
  if (!execution_id || !edition_id || !stamp(observed_at)) throw Error('kanban_projection_identity_required');
  const projection = {};
  for (const [id, task] of Object.entries(tasks)) {
    projection[id] = {
      id,
      title:task.title || task.normal_operation || `Task ${id}`,
      state:'Backlog',
      entered_backlog_at:task.entered_backlog_at || null,
      active_started_at:null,
      review_started_at:null,
      blocked_started_at:null,
      done_at:null,
      cycle_seconds:null,
      active_seconds:null
    };
  }
  const ordered = [...events].filter(e=>e && e.task_id && e.to && stamp(e.at)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  for (const event of ordered) {
    const task = projection[String(event.task_id).padStart(2,'0')];
    if (!task) continue;
    task.state = event.to;
    if (event.to === 'Active' && !task.active_started_at) task.active_started_at = event.at;
    if (event.to === 'Tested' && !task.review_started_at) task.review_started_at = event.at;
    if (event.to === 'Blocked' && !task.blocked_started_at) task.blocked_started_at = event.at;
    if (event.to === 'Done') task.done_at = event.at;
    if (!task.entered_backlog_at && event.from === 'Backlog') task.entered_backlog_at = event.at;
  }
  for (const task of Object.values(projection)) {
    if (task.done_at && task.entered_backlog_at) task.cycle_seconds = Math.max(0,(Date.parse(task.done_at)-Date.parse(task.entered_backlog_at))/1000);
    if (task.done_at && task.active_started_at) task.active_seconds = Math.max(0,(Date.parse(task.done_at)-Date.parse(task.active_started_at))/1000);
  }
  return {
    schema_version:'production-kanban-projection-v2',
    execution_id,edition_id,observed_at,
    authoritative_source:'append_only_transition_events',
    source_event_digest:eventLedgerDigest(events),
    tasks:projection
  };
}

export function kanbanProjectionFresh({events = [], kanban = null} = {}) {
  if (!kanban) return {fresh:false, reason:'kanban_missing', expected_digest:eventLedgerDigest(events), observed_digest:null};
  const expected = eventLedgerDigest(events), observed = kanban.source_event_digest || null;
  return {fresh:expected === observed, reason:expected === observed ? 'projection_matches_events' : 'projection_digest_mismatch', expected_digest:expected, observed_digest:observed};
}

export function supervisorHeartbeat({
  execution_id, supervisor_run_id, checked_at = new Date().toISOString(), loop_number = 0,
  writer_generation, classification, action
} = {}) {
  if (!execution_id || !supervisor_run_id || !stamp(checked_at) || !Number.isInteger(loop_number) || loop_number < 0 ||
      !Number.isInteger(writer_generation) || writer_generation < 1 || !SUPERVISOR_STATES.includes(classification))
    throw Error('valid_supervisor_heartbeat_required');
  return {
    schema_version:'run-supervisor-heartbeat-v1',
    execution_id,supervisor_run_id,checked_at,loop_number,writer_generation,classification,action:action || null
  };
}
