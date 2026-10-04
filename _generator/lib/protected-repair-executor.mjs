import {createHash} from 'node:crypto';

export const PROTECTED_REPAIR_EXECUTOR_VERSION = 'protected-repair-executor-v1';
export const PROTECTED_REPAIR_RECORD_VERSION = 'protected-repair-required-v1';
export const DEAD_WRITER_PROOF_VERSION = 'dead-writer-recovery-v1';

export const PROTECTED_REPAIR_STATES = Object.freeze([
  'PROTECTED_REPAIR_REQUIRED',
  'REPAIR_PR_OPENED',
  'REPAIR_CI_RUNNING',
  'REPAIR_CI_PASS',
  'REPAIR_PR_CONTEXT_REFRESH_REQUIRED',
  'REPAIR_MERGED',
  'SAME_TASK_RESUME_REQUIRED',
  'SAME_TASK_RESUMED',
  'RECOVERY_VERIFIED_PROGRESSING'
]);

export const PROTECTED_REPAIR_FAILURE_STATES = Object.freeze([
  'REPAIR_CI_FAIL',
  'REPAIR_HEAD_CHANGED',
  'REPAIR_EXECUTION_MISMATCH',
  'REPAIR_MERGE_CONFLICT',
  'REPAIR_RESUME_FAILED'
]);

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
const taskId = value => value === null || value === undefined || value === '' ? null : String(value).padStart(2,'0');
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const uniq = values => [...new Set((values || []).filter(Boolean))];

export function buildRepairKey({execution_id, task_id, incident_id, repair_scope_digest} = {}) {
  if (!execution_id || !taskId(task_id) || !incident_id || !repair_scope_digest) throw Error('repair_key_identity_required');
  return 'repair-' + hash({execution_id, task_id:taskId(task_id), incident_id, repair_scope_digest}).slice(0,40);
}

export function buildProtectedRepairRecord({
  execution_id,
  edition_id,
  execution_key,
  production_branch,
  task_id,
  incident_id,
  repair_branch,
  repair_branch_head_sha,
  repair_scope_digest,
  required_checks = ['validate'],
  created_at = new Date().toISOString()
} = {}) {
  if (!execution_id || !edition_id || !execution_key || !production_branch || !taskId(task_id) || !incident_id ||
      !repair_branch || !isSha(repair_branch_head_sha) || !repair_scope_digest || !stamp(created_at)) {
    throw Error('protected_repair_record_identity_required');
  }
  const repair_key = buildRepairKey({execution_id, task_id, incident_id, repair_scope_digest});
  return {
    schema_version:PROTECTED_REPAIR_RECORD_VERSION,
    state:'PROTECTED_REPAIR_REQUIRED',
    repair_key,
    execution_id,
    edition_id,
    execution_key,
    production_branch,
    task_id:taskId(task_id),
    incident_id,
    repair_branch,
    repair_branch_head_sha,
    repair_scope_digest,
    required_checks:uniq(required_checks),
    created_at,
    invariant:'actionable_recovery_must_not_terminate_at_owner_prompt_boundary'
  };
}

export function validateProtectedRepairRecord(record = {}, activePointer = null) {
  const errors = [];
  if (record.schema_version !== PROTECTED_REPAIR_RECORD_VERSION) errors.push('schema_version');
  if (record.state !== 'PROTECTED_REPAIR_REQUIRED' && !PROTECTED_REPAIR_FAILURE_STATES.includes(record.state)) errors.push('state');
  for (const key of ['repair_key','execution_id','edition_id','execution_key','production_branch','task_id','incident_id','repair_branch','repair_branch_head_sha','repair_scope_digest','created_at']) {
    if (!record[key]) errors.push('missing:' + key);
  }
  if (!/^\d{2}$/.test(String(record.task_id || ''))) errors.push('task_id');
  if (!isSha(record.repair_branch_head_sha)) errors.push('repair_branch_head_sha');
  if (!stamp(record.created_at)) errors.push('created_at');
  if (!Array.isArray(record.required_checks) || record.required_checks.length < 1) errors.push('required_checks');
  if (record.execution_id && record.task_id && record.incident_id && record.repair_scope_digest) {
    const expected = buildRepairKey(record);
    if (record.repair_key !== expected) errors.push('repair_key');
  }
  if (activePointer) {
    if (activePointer.active !== true || activePointer.terminal === true) errors.push('active_execution_required');
    if (activePointer.execution_id !== record.execution_id) errors.push('execution_mismatch');
    if (activePointer.edition_id !== record.edition_id) errors.push('edition_mismatch');
    if (activePointer.branch !== record.production_branch) errors.push('production_branch_mismatch');
  }
  return errors;
}

export function selectRepairPr(prs = [], record = {}) {
  const exact = (prs || []).filter(pr => {
    const body = String(pr?.body || '');
    return pr?.baseRefName === 'main' &&
      pr?.headRefName === record.repair_branch &&
      (pr?.headRefOid === record.repair_branch_head_sha || pr?.state === 'MERGED') &&
      body.includes('Repair-Key: ' + record.repair_key);
  });
  if (exact.length > 1) throw Error('duplicate_protected_repair_pr');
  return exact[0] || null;
}

export function exactHeadCiGate({record, observed_head_sha, check_runs = []} = {}) {
  if (!record || !isSha(observed_head_sha)) return {allowed:false,state:'REPAIR_HEAD_CHANGED',reason:'head_missing'};
  if (record.repair_branch_head_sha !== observed_head_sha) {
    return {allowed:false,state:'REPAIR_HEAD_CHANGED',reason:'repair_branch_head_moved'};
  }
  const required = uniq(record.required_checks || []);
  const byName = new Map((check_runs || []).map(check => [String(check.name),check]));
  const missing = required.filter(name => !byName.has(name));
  if (missing.length) return {allowed:false,state:'REPAIR_CI_RUNNING',reason:'required_check_missing',missing};
  const failed = required.filter(name => {
    const check = byName.get(name);
    return check.status === 'completed' && !['success','neutral','skipped'].includes(String(check.conclusion || '').toLowerCase());
  });
  if (failed.length) return {allowed:false,state:'REPAIR_CI_FAIL',reason:'required_check_failed',failed};
  const pending = required.filter(name => byName.get(name)?.status !== 'completed');
  if (pending.length) return {allowed:false,state:'REPAIR_CI_RUNNING',reason:'required_check_pending',pending};
  return {allowed:true,state:'REPAIR_CI_PASS',reason:'exact_head_required_checks_passed'};
}

export function protectedPrContextGate({workflow_run = null, observed_head_sha = null} = {}) {
  if (!workflow_run || !Number(workflow_run.id)) {
    return {allowed:false,state:'REPAIR_CI_RUNNING',reason:'deterministic_ci_run_missing'};
  }
  if (observed_head_sha && workflow_run.head_sha && observed_head_sha !== workflow_run.head_sha) {
    return {allowed:false,state:'REPAIR_HEAD_CHANGED',reason:'deterministic_ci_head_mismatch'};
  }
  if (String(workflow_run.status || '') !== 'completed') {
    return {allowed:false,state:'REPAIR_CI_RUNNING',reason:'deterministic_ci_not_completed'};
  }
  const conclusion = String(workflow_run.conclusion || '').toLowerCase();
  if (conclusion === 'action_required') {
    return {
      allowed:false,
      state:'REPAIR_PR_CONTEXT_REFRESH_REQUIRED',
      reason:'pull_request_validate_requires_connected_identity_refresh',
      connected_github_context_refresh_required:true,
      owner_prompt_required:false
    };
  }
  if (conclusion !== 'success') {
    return {allowed:false,state:'REPAIR_CI_FAIL',reason:'deterministic_ci_failed',conclusion};
  }
  if (String(workflow_run.event || '') !== 'pull_request') {
    return {
      allowed:false,
      state:'REPAIR_PR_CONTEXT_REFRESH_REQUIRED',
      reason:'successful_ci_not_attached_to_pull_request_merge_context',
      connected_github_context_refresh_required:true,
      owner_prompt_required:false
    };
  }
  return {
    allowed:true,
    state:'REPAIR_CI_PASS',
    reason:'exact_head_pull_request_validate_passed',
    connected_github_context_refresh_required:false,
    owner_prompt_required:false
  };
}

export function mergeGate({
  record,
  activePointer,
  current_task,
  observed_head_sha,
  ciGate,
  repair_already_merged = false
} = {}) {
  if (!record || !activePointer) return {allowed:false,state:'REPAIR_EXECUTION_MISMATCH',reason:'identity_missing'};
  if (activePointer.active !== true || activePointer.terminal === true) {
    return {allowed:false,state:'REPAIR_EXECUTION_MISMATCH',reason:'terminal_or_inactive_execution'};
  }
  if (activePointer.execution_id !== record.execution_id || activePointer.branch !== record.production_branch) {
    return {allowed:false,state:'REPAIR_EXECUTION_MISMATCH',reason:'active_execution_changed'};
  }
  if (current_task !== undefined && current_task !== null && taskId(current_task) !== record.task_id) {
    return {allowed:false,state:'REPAIR_EXECUTION_MISMATCH',reason:'active_task_changed'};
  }
  if (record.repair_branch_head_sha !== observed_head_sha) {
    return {allowed:false,state:'REPAIR_HEAD_CHANGED',reason:'repair_branch_head_moved'};
  }
  if (repair_already_merged) return {allowed:false,state:'REPAIR_MERGED',reason:'idempotent_already_merged'};
  if (ciGate?.allowed !== true) {
    return {allowed:false,state:ciGate?.state || 'REPAIR_CI_RUNNING',reason:ciGate?.reason || 'ci_not_passed'};
  }
  return {allowed:true,state:'REPAIR_CI_PASS',reason:'safe_merge_permitted'};
}

export function parseGitHubActionsOwner(owner_id) {
  const match = /^github-actions-(\d+)-(\d+)$/.exec(String(owner_id || ''));
  return match ? {workflow_run_id:Number(match[1]),run_attempt:Number(match[2])} : null;
}

export function buildDeadWriterProof({
  lease,
  workflow_run,
  child_workers_live = false,
  substantive_write_after_terminal = false,
  proved_dead_at = new Date().toISOString()
} = {}) {
  const owner = parseGitHubActionsOwner(lease?.owner_id);
  if (!lease || !owner || !workflow_run || !stamp(proved_dead_at)) throw Error('dead_writer_evidence_required');
  const conclusion = String(workflow_run.conclusion || '').toLowerCase();
  const terminal = String(workflow_run.status || '').toLowerCase() === 'completed';
  if (Number(workflow_run.id) !== owner.workflow_run_id) throw Error('dead_writer_run_mismatch');
  if (!terminal || !['failure','cancelled'].includes(conclusion)) throw Error('dead_writer_terminal_failure_or_cancel_required');
  if (child_workers_live === true) throw Error('dead_writer_child_worker_live');
  if (substantive_write_after_terminal === true) throw Error('dead_writer_post_terminal_write');
  return {
    schema_version:DEAD_WRITER_PROOF_VERSION,
    execution_id:lease.execution_id,
    dead_owner_id:lease.owner_id,
    dead_generation:Number(lease.generation),
    workflow_run_id:owner.workflow_run_id,
    workflow_conclusion:conclusion,
    workflow_status:'completed',
    workflow_updated_at:workflow_run.updated_at || null,
    proved_dead_at,
    child_workers_live:false,
    substantive_write_after_terminal:false,
    recovery_reason:'terminal_' + conclusion + '_writer'
  };
}

export function validateDeadWriterProof(proof = {}, lease = {}) {
  const errors = [];
  if (proof.schema_version !== DEAD_WRITER_PROOF_VERSION) errors.push('schema_version');
  if (proof.execution_id !== lease.execution_id) errors.push('execution_id');
  if (proof.dead_owner_id !== lease.owner_id) errors.push('dead_owner_id');
  if (Number(proof.dead_generation) !== Number(lease.generation)) errors.push('dead_generation');
  const owner = parseGitHubActionsOwner(lease.owner_id);
  if (!owner || Number(proof.workflow_run_id) !== owner.workflow_run_id) errors.push('workflow_run_id');
  if (proof.workflow_status !== 'completed') errors.push('workflow_status');
  if (!['failure','cancelled'].includes(String(proof.workflow_conclusion || '').toLowerCase())) errors.push('workflow_conclusion');
  if (proof.child_workers_live !== false) errors.push('child_workers_live');
  if (proof.substantive_write_after_terminal !== false) errors.push('post_terminal_write');
  if (!stamp(proof.proved_dead_at)) errors.push('proved_dead_at');
  return errors;
}

export function writerTakeoverDecision({
  lease,
  request_execution_id,
  request_owner_id,
  dead_writer_proof = null,
  authorized_handoff = false,
  now = new Date().toISOString()
} = {}) {
  if (!request_execution_id || !request_owner_id || !stamp(now)) throw Error('writer_takeover_request_required');
  if (!lease) return {allowed:true,reason:'no_existing_writer'};
  if (lease.execution_id !== request_execution_id) return {allowed:false,reason:'other_execution_writer'};
  if (lease.owner_id === request_owner_id) return {allowed:true,reason:'same_writer'};
  if (authorized_handoff === true) return {allowed:true,reason:'explicit_exact_task_handoff'};
  const active = stamp(lease.expires_at) && Date.parse(lease.expires_at) > Date.parse(now) && lease.state !== 'RELEASED' && !lease.released_at;
  if (!active) return {allowed:true,reason:'expired_or_released_writer'};
  if (dead_writer_proof && validateDeadWriterProof(dead_writer_proof,lease).length === 0) {
    return {allowed:true,reason:'conclusively_dead_writer'};
  }
  return {allowed:false,reason:'live_or_unproven_writer_cannot_be_stolen'};
}

export function verifyProtectedRepairProgress({
  record,
  merge_sha = null,
  same_task_resumed = false,
  executor_active = false,
  durable_progress = false,
  task_done = false,
  accepted_locked_changed = false,
  post_repair_attempts = 0
} = {}) {
  if (!record) return {verified:false,reason:'record_required'};
  if (task_done && same_task_resumed === false) return {verified:false,reason:'task_completed_elsewhere_no_stale_resume'};
  if (accepted_locked_changed === true) return {verified:false,reason:'accepted_locked_immutability_violation'};
  if (Number(post_repair_attempts) > 1) return {verified:false,reason:'post_repair_attempt_bound_exceeded'};
  if (!isSha(merge_sha || '')) return {verified:false,reason:'merge_alone_or_merge_missing'};
  if (!same_task_resumed) return {verified:false,reason:'same_task_not_resumed'};
  if (!executor_active) return {verified:false,reason:'real_executor_not_active'};
  if (!durable_progress) return {verified:false,reason:'substantive_durable_progress_not_proven'};
  return {verified:true,reason:'protected_repair_same_task_progress_verified',state:'RECOVERY_VERIFIED_PROGRESSING'};
}

export function syntheticProtectedRepairTrace() {
  const record = buildProtectedRepairRecord({
    execution_id:'synthetic-execution',
    edition_id:'synthetic-edition',
    execution_key:'synthetic-run',
    production_branch:'synthetic/production',
    task_id:'11',
    incident_id:'synthetic-incident',
    repair_branch:'synthetic/repair',
    repair_branch_head_sha:'a'.repeat(40),
    repair_scope_digest:'sha256:synthetic',
    required_checks:['validate'],
    created_at:'2099-01-01T00:00:00Z'
  });
  const ci = exactHeadCiGate({
    record,
    observed_head_sha:'a'.repeat(40),
    check_runs:[{name:'validate',status:'completed',conclusion:'success'}]
  });
  const merge = mergeGate({
    record,
    activePointer:{active:true,terminal:false,execution_id:record.execution_id,edition_id:record.edition_id,branch:record.production_branch},
    current_task:'11',
    observed_head_sha:record.repair_branch_head_sha,
    ciGate:ci
  });
  const progress = verifyProtectedRepairProgress({
    record,
    merge_sha:'b'.repeat(40),
    same_task_resumed:true,
    executor_active:true,
    durable_progress:true,
    post_repair_attempts:1
  });
  return {
    record,
    ci,
    merge,
    progress,
    states:[
      'PROTECTED_REPAIR_REQUIRED',
      'REPAIR_PR_OPENED',
      'REPAIR_CI_PASS',
      'REPAIR_MERGED',
      'SAME_TASK_RESUMED',
      'RECOVERY_VERIFIED_PROGRESSING'
    ]
  };
}
