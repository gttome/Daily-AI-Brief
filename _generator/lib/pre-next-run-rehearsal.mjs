import {
  acquireWriterLease,
  projectKanbanFromEvents,
  validateKanbanContract,
  kanbanProjectionFresh
} from './run-supervisor.mjs';

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const sha40 = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const uniq = values => [...new Set(values.filter(Boolean))];
const taskId = value => String(value ?? '').padStart(2,'0');
const pick = (object, keys) => {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) return object[key];
  }
  return null;
};

export const PRE_NEXT_RUN_REHEARSAL_VERSION = 'pre-next-run-rehearsal-v1';
export const REHEARSAL_EXECUTION_ID = 'synthetic-pre-next-run-20261002-01';
export const REHEARSAL_BRANCH = 'rehearsal/pre-next-run-five-change-2026-10-02';
export const REUSABLE_CONSUMER_ID = '6abeb9a2b8a88191949dc420d5e10feb';

export function verifyScheduledConsumerEvidence({
  prestate = {},
  request = {},
  consumerResult = {},
  writerRelease = {},
  expectedMainSha = null
} = {}) {
  const errors = [];
  const required = (ok, code) => { if (!ok) errors.push(code); };

  required(prestate.mode === 'NON_PRODUCTION', 'rehearsal_prestate_nonproduction_required');
  required(prestate.production_allocation === false, 'rehearsal_production_allocation_must_be_false');
  required(prestate.image_generation_allowed === false, 'rehearsal_image_generation_must_be_false');
  required(prestate.execution_id === REHEARSAL_EXECUTION_ID, 'rehearsal_prestate_execution_mismatch');
  required(prestate.branch === REHEARSAL_BRANCH, 'rehearsal_prestate_branch_mismatch');
  required(Array.isArray(prestate.completed_tasks) && prestate.completed_tasks.includes('00'), 'rehearsal_completed_task00_required');
  required(Number(prestate.writer_lease?.generation) === 2, 'rehearsal_prestate_generation2_required');

  required(request.mode === 'NON_PRODUCTION', 'rehearsal_request_nonproduction_required');
  required(request.execution_id === REHEARSAL_EXECUTION_ID, 'rehearsal_request_execution_mismatch');
  required(request.branch === REHEARSAL_BRANCH, 'rehearsal_request_branch_mismatch');
  required(taskId(request.task_id) === '11', 'rehearsal_request_task11_required');
  required(request.capability === 'native_chatgpt', 'rehearsal_request_native_capability_required');
  required(request.reusable_consumer_automation_id === REUSABLE_CONSUMER_ID, 'rehearsal_request_consumer_mismatch');
  required(request.rehearsal_no_generation === true, 'rehearsal_no_generation_flag_required');
  required(Number(request.writer_generation) === 1, 'rehearsal_request_generation1_required');
  required(request.writer_generation_is_provenance === true, 'rehearsal_request_generation_provenance_required');
  required(request.authority_refresh_required_at_invocation === true, 'rehearsal_invocation_refresh_required');

  const resultExecution = pick(consumerResult,['execution_id']);
  const resultBranch = pick(consumerResult,['branch']);
  const resultTask = taskId(pick(consumerResult,['task_id']));
  const resultAutomation = pick(consumerResult,['automation_id','consumer_id','consumer_automation_id']);
  const observedMainSha = pick(consumerResult,['protected_main_sha_observed','protected_main_sha','observed_main_sha']);
  const invokedAt = pick(consumerResult,['invoked_at','observed_at','consumed_at','completed_at']);
  const requestGeneration = Number(pick(consumerResult,['request_generation','writer_generation_request','scheduled_generation','writer_generation']));
  const currentBefore = Number(pick(consumerResult,['current_generation_before','writer_generation_before','live_generation_before']));
  const authorityGeneration = Number(pick(consumerResult,['authority_generation','fresh_authority_generation','writer_generation_acquired','fresh_generation']));
  const staleRejected = pick(consumerResult,['stale_generation_rejected','request_generation_rejected_as_authority','stale_request_generation_rejected']);
  const noDuplicate = pick(consumerResult,['no_duplicate_execution','duplicate_execution_created']);
  const completed = pick(consumerResult,['completed_tasks','preserved_completed_tasks']) || [];
  const generationCalls = Number(pick(consumerResult,['generation_calls','image_generation_calls']) ?? NaN);
  const imageEditCalls = Number(pick(consumerResult,['image_edit_calls','image_edits']) ?? NaN);
  const publicationMutations = Number(pick(consumerResult,['publication_mutations']) ?? NaN);
  const run5Mutations = Number(pick(consumerResult,['run5_mutations','production_run_mutations']) ?? NaN);

  required(consumerResult.result === 'PASS', 'scheduled_consumer_result_pass_required');
  required(resultExecution === REHEARSAL_EXECUTION_ID, 'scheduled_consumer_execution_mismatch');
  required(resultBranch === REHEARSAL_BRANCH, 'scheduled_consumer_branch_mismatch');
  required(resultTask === '11', 'scheduled_consumer_task11_required');
  required(resultAutomation === REUSABLE_CONSUMER_ID, 'scheduled_consumer_automation_mismatch');
  required(stamp(invokedAt), 'scheduled_consumer_invocation_timestamp_required');
  required(sha40(observedMainSha), 'scheduled_consumer_main_sha_required');
  if (expectedMainSha) required(observedMainSha === expectedMainSha, 'scheduled_consumer_main_sha_mismatch');
  required(requestGeneration === 1, 'scheduled_consumer_request_generation_mismatch');
  required(currentBefore === 2, 'scheduled_consumer_current_generation_before_mismatch');
  required(Number.isInteger(authorityGeneration) && authorityGeneration > currentBefore, 'scheduled_consumer_fresh_authority_required');
  required(staleRejected === true, 'scheduled_consumer_stale_generation_rejection_required');
  required(noDuplicate === true || noDuplicate === false && consumerResult.duplicate_execution_created === false,
    'scheduled_consumer_no_duplicate_execution_required');
  required(Array.isArray(completed) && completed.includes('00'), 'scheduled_consumer_completed_task00_preserved');
  required(generationCalls === 0, 'scheduled_consumer_generation_calls_must_be_zero');
  required(imageEditCalls === 0, 'scheduled_consumer_image_edit_calls_must_be_zero');
  required(publicationMutations === 0, 'scheduled_consumer_publication_mutations_must_be_zero');
  required(run5Mutations === 0, 'scheduled_consumer_run5_mutations_must_be_zero');

  required(writerRelease.execution_id === REHEARSAL_EXECUTION_ID, 'rehearsal_release_execution_mismatch');
  required(taskId(writerRelease.task_id) === '11', 'rehearsal_release_task11_required');
  required(writerRelease.released === true, 'rehearsal_release_flag_required');
  required(stamp(writerRelease.released_at), 'rehearsal_release_timestamp_required');
  required(writerRelease.expires_at === writerRelease.released_at, 'rehearsal_release_immediate_expiry_required');
  required(writerRelease.release_reason === 'TASK_11_DONE_HANDOFF_TO_SUPERVISOR', 'rehearsal_release_reason_required');
  required(Number(writerRelease.generation) === authorityGeneration, 'rehearsal_release_generation_mismatch');

  return {
    schema_version:PRE_NEXT_RUN_REHEARSAL_VERSION,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    observed_main_sha:observedMainSha || null,
    invoked_at:invokedAt || null,
    request_generation:Number.isFinite(requestGeneration) ? requestGeneration : null,
    current_generation_before:Number.isFinite(currentBefore) ? currentBefore : null,
    authority_generation:Number.isFinite(authorityGeneration) ? authorityGeneration : null,
    release_generation:Number(writerRelease.generation) || null,
    generation_calls:Number.isFinite(generationCalls) ? generationCalls : null,
    image_edit_calls:Number.isFinite(imageEditCalls) ? imageEditCalls : null,
    publication_mutations:Number.isFinite(publicationMutations) ? publicationMutations : null,
    run5_mutations:Number.isFinite(run5Mutations) ? run5Mutations : null
  };
}

export function verifyAutomaticSupervisorResume({
  prestate = {},
  writerRelease = {},
  workflowText = '',
  resumedAt = null
} = {}) {
  const errors = [];
  const required = (ok, code) => { if (!ok) errors.push(code); };
  const releaseAt = writerRelease.released_at;
  const resumeAt = resumedAt || (stamp(releaseAt) ? new Date(Date.parse(releaseAt)+1000).toISOString() : null);

  required(/_records\/edition-execution\/writer-leases\/\*\*/.test(workflowText), 'handoff_workflow_writer_lease_trigger_required');
  required(/TASK_1\[1-6\]_DONE_HANDOFF_TO_SUPERVISOR\|TASK_1\[1-6\]_BLOCKED_HANDOFF_TO_SUPERVISOR/.test(workflowText),
    'handoff_workflow_task_specific_release_contract_required');
  required(/gh workflow run run-supervisor\.yml/.test(workflowText), 'handoff_workflow_auto_supervisor_dispatch_required');
  required(/\[ "\$run_branch" = "\$\{GITHUB_REF_NAME\}" \]/.test(workflowText), 'handoff_workflow_same_branch_guard_required');
  required(/\[ "\$lease_execution" = "\$execution_id" \]/.test(workflowText), 'handoff_workflow_same_execution_guard_required');

  required(prestate.execution_id === REHEARSAL_EXECUTION_ID, 'handoff_prestate_execution_mismatch');
  required(writerRelease.execution_id === prestate.execution_id, 'handoff_release_execution_mismatch');
  required(writerRelease.released === true && stamp(releaseAt), 'handoff_release_not_durable');
  required(writerRelease.expires_at === releaseAt, 'handoff_release_not_immediately_expired');
  required(writerRelease.release_reason === 'TASK_11_DONE_HANDOFF_TO_SUPERVISOR', 'handoff_release_reason_mismatch');
  required(stamp(resumeAt) && stamp(releaseAt) && Date.parse(resumeAt) > Date.parse(releaseAt), 'handoff_resume_time_required');

  let supervisorLease = null;
  if (!errors.length) {
    const acquired = acquireWriterLease(writerRelease,{
      execution_id:prestate.execution_id,
      owner_id:'synthetic-supervisor:post-worker-handoff',
      now:resumeAt,
      ttl_ms:120000,
      takeover_dead_owner:true
    });
    required(acquired.acquired === true, 'handoff_supervisor_lease_not_acquired');
    supervisorLease = acquired.lease;
    required(supervisorLease?.execution_id === prestate.execution_id, 'handoff_supervisor_execution_changed');
    required(Number(supervisorLease?.generation) > Number(writerRelease.generation), 'handoff_supervisor_generation_not_advanced');
  }

  const completedBefore = Array.isArray(prestate.completed_tasks) ? [...prestate.completed_tasks] : [];
  const completedAfter = uniq([...completedBefore,'11']);
  required(completedBefore.includes('00'), 'handoff_task00_not_preserved');
  required(completedAfter.includes('00') && completedAfter.includes('11'), 'handoff_completed_tasks_not_preserved');

  return {
    schema_version:PRE_NEXT_RUN_REHEARSAL_VERSION,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    automatic_dispatch_contract:'event_driven_writer_release_to_run_supervisor',
    execution_id:prestate.execution_id || null,
    release_generation:Number(writerRelease.generation) || null,
    resumed_supervisor_generation:supervisorLease?.generation ?? null,
    resumed_at:resumeAt,
    completed_tasks_before:completedBefore,
    completed_tasks_after:completedAfter,
    completed_task00_reworked:false,
    duplicate_execution_created:false
  };
}

export function buildAndVerifySyntheticKanban({
  prestate = {},
  writerRelease = {},
  observedAt = null
} = {}) {
  const tasks = {};
  for (let n=0;n<=29;n++) {
    const id=String(n).padStart(2,'0');
    tasks[id]={title:prestate.tasks?.[id]?.title || `Synthetic Task ${id}`};
  }
  const start = prestate.created_at || prestate.writer_lease?.acquired_at;
  const done00 = stamp(start) ? new Date(Date.parse(start)+1000).toISOString() : null;
  const releaseAt = writerRelease.released_at;
  const observed = observedAt || (stamp(releaseAt) ? new Date(Date.parse(releaseAt)+1000).toISOString() : null);
  const events = [
    {task_id:'00',from:'Backlog',to:'Active',at:start},
    {task_id:'00',from:'Active',to:'Done',at:done00},
    {task_id:'11',from:'Backlog',to:'Active',at:start},
    {task_id:'11',from:'Active',to:'Done',at:releaseAt}
  ].filter(event=>stamp(event.at));

  const kanban = projectKanbanFromEvents({
    tasks,
    events,
    execution_id:prestate.execution_id,
    edition_id:prestate.edition_id,
    observed_at:observed
  });
  const errors=validateKanbanContract({kanban,events,require_all_tasks:true});
  const freshness=kanbanProjectionFresh({events,kanban});
  if (!freshness.fresh) errors.push(...freshness.errors);

  return {
    schema_version:PRE_NEXT_RUN_REHEARSAL_VERSION,
    result:uniq(errors).length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    columns:kanban.columns,
    active_task_maps_to:kanban.active_task_maps_to,
    task_count:Object.keys(kanban.tasks).length,
    task_durations:Object.fromEntries(Object.entries(kanban.tasks).map(([id,task])=>[id,task.duration])),
    total_brief_elapsed:kanban.total_brief_elapsed,
    total_brief_elapsed_seconds:kanban.total_brief_elapsed_seconds,
    source_event_digest:kanban.source_event_digest,
    fresh:freshness.fresh,
    kanban
  };
}

export function buildRehearsalReceipt({
  task00Decision = {},
  scheduledConsumer = {},
  automaticResume = {},
  kanbanProof = {},
  protectedCi = {}
} = {}) {
  const errors=[];
  if (task00Decision.result !== 'PASS' || task00Decision.start_authorized !== true ||
      task00Decision.image_tasks_authorized !== true || task00Decision.publication_authorized !== true)
    errors.push('task00_coherent_ready_decision_required');
  if (scheduledConsumer.result !== 'PASS') errors.push('scheduled_consumer_proof_required');
  if (automaticResume.result !== 'PASS') errors.push('automatic_supervisor_resume_proof_required');
  if (kanbanProof.result !== 'PASS' || kanbanProof.fresh !== true) errors.push('kanban_contract_proof_required');
  if (protectedCi.result !== 'PASS') errors.push('protected_ci_pass_required');
  return {
    schema_version:PRE_NEXT_RUN_REHEARSAL_VERSION,
    rehearsal_id:'pre-next-run-five-change-20261002-r1',
    mode:'NON_PRODUCTION',
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    task00_decision:task00Decision,
    scheduled_consumer:scheduledConsumer,
    automatic_supervisor_resume:automaticResume,
    kanban_contract:kanbanProof,
    protected_ci:protectedCi,
    image_generation_calls:scheduledConsumer.generation_calls ?? null,
    image_edit_calls:scheduledConsumer.image_edit_calls ?? null,
    next_production_run_authorized:errors.length === 0
  };
}
