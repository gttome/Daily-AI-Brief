import {createHash} from 'node:crypto';
import {writerTakeoverDecision} from './protected-repair-executor.mjs';

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
  takeover_dead_owner = false, dead_owner_proof = null, authorized_handoff = false
} = {}) {
  if (!execution_id || !owner_id || !stamp(now) || !Number.isInteger(ttl_ms) || ttl_ms < 1) throw Error('valid_writer_lease_request_required');
  const nowMs = Date.parse(now);
  if (current && current.execution_id !== execution_id && stamp(current.expires_at) && Date.parse(current.expires_at) > nowMs)
    return {acquired:false, reason:'writer_lease_owned_by_other_execution', lease:current};

  let takeover = {allowed:true,reason:'no_existing_writer'};
  if (current && current.owner_id !== owner_id) {
    takeover = writerTakeoverDecision({
      lease:current,
      request_execution_id:execution_id,
      request_owner_id:owner_id,
      dead_writer_proof:dead_owner_proof,
      authorized_handoff,
      now
    });
    if (!takeover.allowed) {
      return {acquired:false, reason:takeover.reason, lease:current, takeover_dead_owner_requested:takeover_dead_owner === true};
    }
  }

  const currentReleased = current?.state === 'RELEASED' || Boolean(current?.released_at);
  const currentActive = current && !currentReleased && stamp(current.expires_at) && Date.parse(current.expires_at) > nowMs;
  const sameOwner = currentActive && current?.execution_id === execution_id && current?.owner_id === owner_id;
  const generation = sameOwner ? current.generation : Math.max(0, Number(current?.generation || 0)) + 1;
  const requestedExpiryMs = nowMs + ttl_ms;
  const currentExpiryMs = sameOwner && stamp(current.expires_at) ? Date.parse(current.expires_at) : 0;
  const lease = {
    schema_version:'run-writer-lease-v1',
    execution_id, owner_id, generation,
    acquired_at:sameOwner ? current.acquired_at : now,
    last_heartbeat_at:now,
    expires_at:new Date(Math.max(requestedExpiryMs,currentExpiryMs)).toISOString()
  };
  return {
    acquired:true,
    reason:sameOwner ? 'lease_renewed' : 'lease_acquired',
    takeover_reason:current && current.owner_id !== owner_id ? takeover.reason : null,
    lease
  };
}

export function assertWriterFence(lease, {
  execution_id, owner_id, generation, now = new Date().toISOString()
} = {}) {
  if (!lease || !stamp(now)) throw Error('writer_lease_required');
  if (lease.execution_id !== execution_id || lease.owner_id !== owner_id || lease.generation !== generation) throw Error('STALE_WRITER_FENCE');
  if (!stamp(lease.expires_at) || Date.parse(lease.expires_at) <= Date.parse(now)) throw Error('WRITER_LEASE_EXPIRED');
  return true;
}

export function releaseWriterLease(lease, {
  execution_id, owner_id, generation, reason = 'SAFE_RECOVERY_BOUNDARY', now = new Date().toISOString()
} = {}) {
  if (!reason || !stamp(now)) throw Error('writer_lease_release_context_required');
  assertWriterFence(lease,{execution_id,owner_id,generation,now});
  return {
    ...lease,
    state:'RELEASED',
    released_at:now,
    release_reason:reason,
    last_heartbeat_at:now,
    expires_at:now
  };
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
  const recoveryAction = image_recovery?.recovery_action || image_recovery?.targeted_next_action || '';
  const rejectedWithRecoveryEvidence = isImageTask &&
    image_recovery?.status === 'rejected' &&
    typeof recoveryAction === 'string' &&
    recoveryAction.trim().length > 0;
  const rejectionCode = String(image_recovery?.review?.rejection_code || image_recovery?.rejection_code || '');
  const rejectionReason = String(image_recovery?.review?.rejection_reason || image_recovery?.rejection_reason || '');
  const recoveryText = [rejectionCode,rejectionReason,recoveryAction].join(' ').toLowerCase();
  const forceEngineeringRepair = rejectedWithRecoveryEvidence && (
    /context[_ -]?contamination/.test(recoveryText) ||
    /wrong[_ -]?subject/.test(recoveryText) ||
    /sealed[_ -]?prompt[_ -]?displaced/.test(recoveryText) ||
    /execution[_ -]?context/.test(recoveryText) ||
    /fresh[_ -]?(isolated|single[_ -]?story|context)/.test(recoveryText)
  );
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
    force_engineering_repair: actionableBlocked && forceEngineeringRepair,
    recovery_reason: rejectedWithRecoveryEvidence
      ? forceEngineeringRepair
        ? 'image_subject_or_context_mismatch_requires_engineering_repair'
        : 'rejected_image_attempt_with_explicit_recovery_action'
      : null
  };
}

export function normalizeTaskEvent(event = {}) {
  const normalized = {...event};
  if (!normalized.from && typeof normalized.from_state === 'string') normalized.from = normalized.from_state;
  if (!normalized.to && typeof normalized.to_state === 'string') normalized.to = normalized.to_state;
  if (!normalized.to && typeof normalized.state === 'string') normalized.to = normalized.state;
  if (!normalized.at && typeof normalized.blocker?.at === 'string') normalized.at = normalized.blocker.at;
  if (normalized.recoverable === undefined && typeof normalized.blocker?.recoverable === 'boolean')
    normalized.recoverable = normalized.blocker.recoverable;
  if (normalized.external_blocker === undefined && typeof normalized.blocker?.external_blocker === 'boolean')
    normalized.external_blocker = normalized.blocker.external_blocker;
  if (!normalized.recovery_action && typeof normalized.targeted_next_action === 'string')
    normalized.recovery_action = normalized.targeted_next_action;
  if (!normalized.recovery_action && typeof normalized.blocker?.recovery_action === 'string')
    normalized.recovery_action = normalized.blocker.recovery_action;
  if (!normalized.recovery_action && typeof normalized.blocker?.targeted_next_action === 'string')
    normalized.recovery_action = normalized.blocker.targeted_next_action;
  if (normalized.task_id !== undefined) normalized.task_id = String(normalized.task_id).padStart(2,'0');
  return normalized;
}

export function recoverableBlockerEvidence(event = {}) {
  const normalized = normalizeTaskEvent(event);
  const actionable =
    /^\d{2}$/.test(normalized.task_id || '') &&
    normalized.to === 'Blocked' &&
    stamp(normalized.at) &&
    normalized.recoverable === true &&
    normalized.external_blocker !== true &&
    typeof normalized.recovery_action === 'string' &&
    normalized.recovery_action.trim().length > 0;
  return {
    actionable,
    normalized,
    reason: actionable ? 'recoverable_blocker_machine_readable' : 'recoverable_blocker_not_actionable'
  };
}

export function refreshScheduledWorkerFence(current, {
  request, owner_id, now = new Date().toISOString(), ttl_ms = DEFAULT_WRITER_LEASE_MS
} = {}) {
  const taskId = String(request?.task_id || '').padStart(2,'0');
  if (!current || !request?.execution_id || current.execution_id !== request.execution_id ||
      request.capability !== 'native_chatgpt' || !['11','12','13','14','15','16'].includes(taskId) ||
      !owner_id || !stamp(now))
    throw Error('valid_scheduled_worker_handoff_required');
  const schedulingGeneration = Number(request.writer_generation);
  const currentGeneration = Number(current.generation);
  const result = acquireWriterLease(current,{
    execution_id:request.execution_id, owner_id, now, ttl_ms, authorized_handoff:true
  });
  if (!result.acquired) throw Error('scheduled_worker_fence_acquire_failed');
  return {
    ...result,
    task_id:taskId,
    scheduling_generation:Number.isInteger(schedulingGeneration) ? schedulingGeneration : null,
    current_generation_before:Number.isInteger(currentGeneration) ? currentGeneration : null,
    stale_scheduling_generation:Number.isInteger(schedulingGeneration) && schedulingGeneration !== currentGeneration,
    request_generation_is_provenance:true,
    authority_generation:result.lease.generation
  };
}

export function buildTaskWriterHandoffRelease(lease, {
  execution_id, owner_id, generation, task_id, boundary = 'Done', now = new Date().toISOString()
} = {}) {
  const taskId = String(task_id || '').padStart(2,'0');
  if (!['11','12','13','14','15','16'].includes(taskId) || !['Done','Blocked'].includes(boundary) || !stamp(now))
    throw Error('valid_task_specific_handoff_release_required');
  assertWriterFence(lease,{execution_id,owner_id,generation,now});
  return {
    ...lease,
    released:true,
    released_at:now,
    release_reason:`TASK_${taskId}_${boundary.toUpperCase()}_HANDOFF_TO_SUPERVISOR`,
    expires_at:now
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
      if (!Number.isInteger(repair.post_repair_attempt_limit) || repair.post_repair_attempt_limit < 1) errors.push(`engineering_repair_post_attempt_limit:${id}`);
      if (typeof repair.post_repair_operation !== 'string' || !repair.post_repair_operation.trim()) errors.push(`engineering_repair_post_operation:${id}`);
    }
  }
  const autonomy=contract.protected_repair_autonomy;
  if(!autonomy||autonomy.schema_version!=='protected-repair-autonomy-contract-v1'||autonomy.enabled!==true)
    errors.push('protected_repair_autonomy_contract');
  else{
    if(autonomy.executor_workflow!=='.github/workflows/protected-repair-executor.yml')errors.push('protected_repair_executor_workflow');
    if(autonomy.exact_one_pr_per_repair_key!==true)errors.push('protected_repair_one_pr');
    if(autonomy.exact_head_ci_required!==true)errors.push('protected_repair_exact_head_ci');
    if(autonomy.active_execution_and_task_revalidation_before_merge!==true)errors.push('protected_repair_revalidation');
    if(autonomy.direct_main_write_allowed!==false)errors.push('protected_repair_no_direct_main');
    if(autonomy.merge_is_recovery_success!==false)errors.push('protected_repair_merge_not_success');
    if(autonomy.same_execution_resume_required!==true||autonomy.same_task_resume_required!==true)errors.push('protected_repair_same_task_resume');
    if(autonomy.real_executor_required_for_success!==true||autonomy.substantive_durable_progress_required_for_success!==true)errors.push('protected_repair_progress_semantics');
    if(autonomy.invariant!=='actionable_recovery_must_not_terminate_at_owner_prompt_boundary')errors.push('protected_repair_owner_boundary_invariant');
    if(autonomy.protected_pr_authority!=='scheduled_chatgpt_connected_github')errors.push('protected_repair_pr_authority');
    if(autonomy.repository_executor_pr_creation_allowed!==false||autonomy.repository_executor_protected_merge_allowed!==false)
      errors.push('protected_repair_repository_executor_boundary');
    if(autonomy.repository_executor_exact_head_ci_dispatch_allowed!==true)errors.push('protected_repair_executor_ci_dispatch');
    if(autonomy.connected_watchdog_pr_creation_required!==true||autonomy.connected_watchdog_protected_merge_required!==true)
      errors.push('protected_repair_connected_watchdog_authority');
    if(autonomy.connected_watchdog_merge_must_use_expected_head!==true||autonomy.connected_watchdog_merge_bypass_allowed!==false)
      errors.push('protected_repair_connected_watchdog_merge_safety');
    if(autonomy.bot_authored_protected_pr_allowed!==false||autonomy.bot_authored_protected_merge_allowed!==false)
      errors.push('protected_repair_bot_pr_forbidden');
    if(autonomy.protection_policy_must_remain_enforced!==true)errors.push('protected_repair_policy_enforcement');
    const sync=autonomy.base_sync_policy||{};
    if(sync.allowed!==true||sync.actor!=='scheduled_chatgpt_connected_github'||sync.repair_scope_digest_must_remain_identical!==true||
       sync.updated_head_must_be_persisted_before_ci!==true||sync.exact_head_ci_must_run_after_sync!==true)
      errors.push('protected_repair_base_sync_contract');
    const dead=autonomy.dead_writer_cleanup||{};
    if(dead.live_writer_takeover_allowed!==false||dead.terminal_workflow_status_required!=='completed')errors.push('dead_writer_takeover_contract');
    if(JSON.stringify(dead.terminal_conclusions)!==JSON.stringify(['failure','cancelled']))errors.push('dead_writer_terminal_conclusions');
    if(dead.workflow_run_identity_must_match_owner!==true||dead.child_worker_live_forbids_takeover!==true||dead.post_terminal_substantive_write_forbids_takeover!==true)
      errors.push('dead_writer_evidence_contract');
    for(const key of ['chatgpt_work','codex','paid_apis','paid_external_services','new_credentials','alternate_accounts','browser_automation'])
      if(autonomy.cost_boundary?.[key]!==false)errors.push('protected_repair_cost_boundary:'+key);
  }
  return uniq(errors);
}

export function taskRecoveryDecision({
  classification, taskContract, attempts = 0, recoveryAttempts = 0, repairEpochs = 0,
  repairReady = false, postRepairAttempts = 0, forceEngineeringRepair = false
} = {}) {
  if (!classification?.state || !taskContract) throw Error('classification_and_task_contract_required');
  if (classification.state === 'HEALTHY_ACTIVE') return {action:'observe'};
  if (classification.state === 'READY_IDLE') return {action:'dispatch_normal', capability:taskContract.capability, instruction:taskContract.normal_operation};
  if (classification.state === 'BLOCKED_EXTERNAL') return {action:'recheck', instruction:'Preserve exact blocker evidence; do not request owner status to advance.'};
  if (classification.state === 'TERMINAL') return {action:'task29'};
  const repair = taskContract.engineering_repair;
  if (forceEngineeringRepair && repair?.enabled === true) {
    if (repairReady === true && Number.isInteger(repair.post_repair_attempt_limit) &&
        postRepairAttempts < repair.post_repair_attempt_limit)
      return {
        action:'post_repair_attempt',
        capability:taskContract.capability,
        instruction:repair.post_repair_operation || taskContract.normal_operation,
        repair_epoch:Math.max(1,repairEpochs),
        post_repair_attempt:postRepairAttempts + 1
      };
    if (Number.isInteger(repair.max_epochs) && repairEpochs < repair.max_epochs)
      return {
        action:'engineering_repair',
        capability:repair.capability || 'repository',
        instruction:repair.instruction,
        repair_epoch:repairEpochs + 1,
        required_proofs:[...(repair.required_proofs || [])]
      };
  }
  if (attempts >= taskContract.retry_limit && classification.state === 'STALE_ACTIVE')
    return {action:'alternate_recovery', capability:taskContract.capability, instruction:taskContract.alternate_recovery};
  if (recoveryAttempts === 0)
    return {action:'first_recovery', capability:taskContract.capability, instruction:taskContract.first_recovery};
  if (recoveryAttempts < taskContract.retry_limit)
    return {action:'alternate_recovery', capability:taskContract.capability, instruction:taskContract.alternate_recovery};
  if (repair?.enabled === true && Number.isInteger(repair.max_epochs) && repairEpochs < repair.max_epochs)
    return {
      action:'engineering_repair',
      capability:repair.capability || 'repository',
      instruction:repair.instruction,
      repair_epoch:repairEpochs + 1,
      required_proofs:[...(repair.required_proofs || [])]
    };
  if (repair?.enabled === true && repairReady === true &&
      Number.isInteger(repair.post_repair_attempt_limit) &&
      postRepairAttempts < repair.post_repair_attempt_limit)
    return {
      action:'post_repair_attempt',
      capability:taskContract.capability,
      instruction:repair.post_repair_operation || taskContract.normal_operation,
      repair_epoch:Math.max(1,repairEpochs),
      post_repair_attempt:postRepairAttempts + 1
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
  writer_generation, recovery_attempt = 0, repair_epoch = 0, post_repair_attempt = 0,
  created_at = new Date().toISOString()
} = {}) {
  if (!execution_id || !edition_id || !branch || !/^\d{2}$/.test(task_id || '') ||
      !WORKER_CAPABILITIES.includes(capability) || !instruction || !Number.isInteger(writer_generation) || writer_generation < 1 || !stamp(created_at))
    throw Error('valid_worker_request_required');
  const key = hash(JSON.stringify({execution_id,task_id,capability,instruction,recovery_attempt,repair_epoch,post_repair_attempt}));
  return {
    schema_version:'run-worker-request-v1',
    request_key:key,
    execution_id,edition_id,branch,task_id,capability,instruction,
    writer_generation,recovery_attempt,repair_epoch,post_repair_attempt,created_at,
    writer_generation_is_provenance:capability==='native_chatgpt',
    authority_refresh_required_at_invocation:capability==='native_chatgpt',
    status:'queued'
  };
}

export function classifyRepositoryQueueLiveness({
  request,
  now = new Date().toISOString(),
  max_idle_seconds = 60
} = {}) {
  if (!request || request.capability !== 'repository') return {state:'not_repository'};
  if (!stamp(now) || !Number.isInteger(max_idle_seconds) || max_idle_seconds < 60)
    throw Error('valid_repository_liveness_clock_required');
  const task_id=String(request.task_id||'').padStart(2,'0');
  if (!/^\d{2}$/.test(task_id) || !request.execution_id || !request.request_key || !stamp(request.created_at))
    throw Error('valid_repository_request_required');
  if (['completed','completed_pass','done','passed'].includes(String(request.status||'').toLowerCase()))
    return {state:'complete',task_id,request_key:request.request_key};
  const substantiveAt=stamp(request.substantive_progress_at)?request.substantive_progress_at:null;
  const basis=substantiveAt||request.created_at;
  const idle_seconds=Math.max(0,(Date.parse(now)-Date.parse(basis))/1000);
  const fault=idle_seconds>=max_idle_seconds;
  return {
    state:fault?'fault':'healthy_wait',
    fault_code:fault?'repository_consumer_unclaimed':null,
    task_id,
    request_key:request.request_key,
    execution_id:request.execution_id,
    request_status:String(request.status||'unknown'),
    queued_at:request.created_at,
    substantive_progress_at:substantiveAt,
    observed_at:now,
    idle_seconds,
    max_idle_seconds,
    supervisor_bookkeeping_is_progress:false,
    next_action:fault?'The bound ordinary-ChatGPT repository consumer must claim the same request; preserve completed work and do not skip ahead.':null
  };
}

export function eventLedgerDigest(events = []) {
  const normalized = [...events].map(e=>JSON.stringify(e)).sort().join('\n');
  return 'sha256:' + hash(normalized + (normalized ? '\n' : ''));
}

/** A completed candidate becomes read-only before Task 23. Later reconciliation
 * belongs to protected closure, never to the branch whose CI head is being merged. */
export function publicationWriteBoundary(tasks = {}, events = []) {
  const terminal=Array.from({length:30},(_,i)=>tasks[String(i).padStart(2,'0')]?.state==='Done').every(Boolean);
  const candidateReady=Array.from({length:23},(_,i)=>tasks[String(i).padStart(2,'0')]?.state==='Done').every(Boolean);
  const publicationStarted=events.some(e=>Number(e.task_id)>=23 && ['Active','Tested','Done'].includes(e.to));
  return {write_allowed:!terminal && !candidateReady && !publicationStarted,
    frozen:candidateReady || publicationStarted, terminal,
    action:terminal?'none':candidateReady || publicationStarted?'protected_publication_handoff':'supervise',
    reason:terminal?'terminal_run':candidateReady || publicationStarted?'publication_candidate_write_freeze_before_task23':'candidate_in_progress'};
}

export function latestRecoverableImage(records, {task_id,candidate_id} = {}) {
  const relevant=records.filter(r=>String(r.task_id||'').padStart(2,'0')===String(task_id||'').padStart(2,'0') || (candidate_id && r.candidate_id===candidate_id));
  if(relevant.some(r=>r.status==='accepted_locked')) return null;
  const latest = relevant.filter(r=>r.status==='rejected' && (r.recovery_action || r.targeted_next_action))
    .sort((a,b)=>Date.parse(a.rejected_at||a.observed_at||a.reviewed_at||0)-Date.parse(b.rejected_at||b.observed_at||b.reviewed_at||0)).at(-1)||null;
  return latest && !latest.recovery_action && latest.targeted_next_action
    ? {...latest,recovery_action:latest.targeted_next_action}
    : latest;
}

export const KANBAN_VISUAL_COLUMNS = Object.freeze(['Backlog','WIP','Done']);

const durationText = value => Number.isFinite(value) ? `${Number(value.toFixed(3))}s` : 'unavailable';
const visualColumn = state => state === 'Done' ? 'Done' : state === 'Backlog' ? 'Backlog' : 'WIP';

export function projectKanbanFromEvents({tasks = {}, events = [], execution_id, edition_id, observed_at = new Date().toISOString()} = {}) {
  if (!execution_id || !edition_id || !stamp(observed_at)) throw Error('kanban_projection_identity_required');
  const projection = {};
  for (const [id, task] of Object.entries(tasks)) {
    projection[id] = {
      id,
      title:task.title || task.normal_operation || `Task ${id}`,
      state:'Backlog',
      column:'Backlog',
      entered_backlog_at:task.entered_backlog_at || null,
      active_started_at:null,
      review_started_at:null,
      blocked_started_at:null,
      done_at:null,
      cycle_seconds:null,
      active_seconds:null,
      duration_seconds:null,
      duration:'unavailable'
    };
  }
  const ordered = [...events]
    .map(normalizeTaskEvent)
    .filter(e=>e && e.task_id && e.to && stamp(e.at))
    .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  for (const event of ordered) {
    const task = projection[String(event.task_id).padStart(2,'0')];
    if (!task) continue;
    task.state = event.to;
    task.column = visualColumn(event.to);
    if (event.to === 'Active' && !task.active_started_at) task.active_started_at = event.at;
    if (event.to === 'Tested' && !task.review_started_at) task.review_started_at = event.at;
    if (event.to === 'Blocked' && !task.blocked_started_at) task.blocked_started_at = event.at;
    if (event.to === 'Done') task.done_at = event.at;
    if (!task.entered_backlog_at && event.from === 'Backlog') task.entered_backlog_at = event.at;
  }
  for (const task of Object.values(projection)) {
    if (task.done_at && task.entered_backlog_at)
      task.cycle_seconds = Math.max(0,(Date.parse(task.done_at)-Date.parse(task.entered_backlog_at))/1000);
    if (task.done_at && task.active_started_at)
      task.active_seconds = Math.max(0,(Date.parse(task.done_at)-Date.parse(task.active_started_at))/1000);
    const durationEnd = task.done_at || (task.column === 'WIP' ? observed_at : null);
    if (durationEnd && task.entered_backlog_at)
      task.duration_seconds = Math.max(0,(Date.parse(durationEnd)-Date.parse(task.entered_backlog_at))/1000);
    task.duration = durationText(task.duration_seconds);
  }
  const eventTimes=ordered.map(e=>Date.parse(e.at)).filter(Number.isFinite);
  const runStartedAt=eventTimes.length ? new Date(Math.min(...eventTimes)).toISOString() : null;
  const terminal=Object.keys(projection).length>0 && Object.values(projection).every(t=>t.state==='Done');
  const doneTimes=Object.values(projection).map(t=>Date.parse(t.done_at||'')).filter(Number.isFinite);
  const elapsedEnd=runStartedAt ? (terminal && doneTimes.length ? new Date(Math.max(...doneTimes)).toISOString() : observed_at) : null;
  const totalSeconds=runStartedAt && elapsedEnd ? Math.max(0,(Date.parse(elapsedEnd)-Date.parse(runStartedAt))/1000) : null;
  return {
    schema_version:'production-kanban-projection-v3',
    execution_id,edition_id,observed_at,
    columns:[...KANBAN_VISUAL_COLUMNS],
    current_column_prohibited:true,
    active_task_maps_to:'WIP',
    authoritative_source:'append_only_transition_events',
    missing_timestamps_policy:'never_infer_use_unavailable',
    source_event_digest:eventLedgerDigest(events.map(normalizeTaskEvent)),
    run_started_at:runStartedAt,
    terminal_at:terminal && doneTimes.length ? new Date(Math.max(...doneTimes)).toISOString() : null,
    total_brief_elapsed_seconds:totalSeconds,
    total_brief_elapsed:durationText(totalSeconds),
    tasks:projection
  };
}

export function validateKanbanContract({kanban = null, events = [], require_all_tasks = true} = {}) {
  const errors=[];
  if (!kanban || typeof kanban !== 'object') return ['kanban_missing'];
  if (JSON.stringify(kanban.columns)!==JSON.stringify(KANBAN_VISUAL_COLUMNS)) errors.push('kanban_column_order_required');
  if ((kanban.columns||[]).includes('Current') || Object.prototype.hasOwnProperty.call(kanban,'current_column'))
    errors.push('kanban_current_column_prohibited');
  if (kanban.active_task_maps_to!=='WIP') errors.push('kanban_active_maps_to_wip_required');
  if (kanban.authoritative_source!=='append_only_transition_events') errors.push('kanban_event_timing_source_required');
  if (kanban.missing_timestamps_policy!=='never_infer_use_unavailable') errors.push('kanban_missing_timestamp_policy_required');
  const tasks=kanban.tasks||{};
  if (require_all_tasks) {
    for(let n=0;n<=29;n++){
      const id=String(n).padStart(2,'0');
      if(!tasks[id]) errors.push(`kanban_task_missing:${id}`);
    }
  }
  for(const [id,task] of Object.entries(tasks)){
    if(!KANBAN_VISUAL_COLUMNS.includes(task.column)) errors.push(`kanban_task_column_invalid:${id}`);
    if(task.state==='Active' && task.column!=='WIP') errors.push(`kanban_active_task_not_wip:${id}`);
    if(typeof task.duration!=='string' || !task.duration.trim()) errors.push(`kanban_task_duration_missing:${id}`);
    if(task.duration==='unavailable' && task.duration_seconds!==null) errors.push(`kanban_unavailable_duration_mismatch:${id}`);
  }
  if(typeof kanban.total_brief_elapsed!=='string' || !kanban.total_brief_elapsed.trim())
    errors.push('kanban_total_elapsed_missing');
  const expected=eventLedgerDigest(events.map(normalizeTaskEvent));
  if(kanban.source_event_digest!==expected) errors.push('kanban_projection_stale');
  return uniq(errors);
}

export function kanbanProjectionFresh({events = [], kanban = null} = {}) {
  if (!kanban) return {fresh:false, reason:'kanban_missing', expected_digest:eventLedgerDigest(events.map(normalizeTaskEvent)), observed_digest:null, errors:['kanban_missing']};
  const expected = eventLedgerDigest(events.map(normalizeTaskEvent)), observed = kanban.source_event_digest || null;
  const errors=validateKanbanContract({kanban,events,require_all_tasks:true});
  const fresh=expected===observed && errors.length===0;
  return {fresh, reason:fresh ? 'projection_matches_events_and_contract' : (expected!==observed ? 'projection_digest_mismatch' : 'projection_contract_invalid'), expected_digest:expected, observed_digest:observed, errors};
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
