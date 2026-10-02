export const RUN_READINESS_VERSION = 'run-learning-readiness-v2';
export const RUN_PROMOTION_VERSION = 'run-promotion-review-v2';
export const DEFAULT_STALE_ACTIVE_MS = 15 * 60 * 1000;
export const MAX_SUPERVISOR_HEARTBEAT_SECONDS = 90;
export const PROVEN_IMAGE_PATH = 'production-image-execution-v2:generate-transfer-verify-review-accept';
export const SMALL_PNG_ROUTES = Object.freeze(['direct_git_data_create_blob_base64','bounded_base64_chunk_bridge','bounded_same_visual_png_transport_optimization']);
export const TERMINAL_RUN_STATES = Object.freeze(['PUBLIC_CLOSED','FAILED']);

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const bool = value => value === true;

export function staleActiveDecision({
  task_state,
  executor_state,
  last_progress_at,
  now = new Date().toISOString(),
  threshold_ms = DEFAULT_STALE_ACTIVE_MS
} = {}) {
  if (!stamp(now) || !Number.isInteger(threshold_ms) || threshold_ms < 1) throw Error('valid_liveness_clock_required');
  if (task_state !== 'Active') return {action:'none', reason:'task_not_active', stale:false};
  if (!stamp(last_progress_at)) return {action:'resume_same_operation_or_block', reason:'active_without_progress_timestamp', stale:true};
  const age_ms = Math.max(0, Date.parse(now) - Date.parse(last_progress_at));
  if (age_ms < threshold_ms && ['Running','Recovering'].includes(executor_state))
    return {action:'none', reason:'within_liveness_window', stale:false, age_ms};
  if (executor_state === 'Running') return {action:'verify_then_resume', reason:'stale_active_despite_running_executor', stale:true, age_ms};
  if (executor_state === 'Recovering') return {action:'verify_recovery_progress', reason:'recovery_exceeded_liveness_window', stale:true, age_ms};
  return {action:'resume_same_operation_or_block', reason:'stale_active_without_live_executor', stale:true, age_ms};
}

export function validateRunReadiness(input = {}) {
  const errors = [];
  const required = (ok, code) => { if (!ok) errors.push(code); };
  required(input.schema_version === RUN_READINESS_VERSION, 'readiness_schema_version_required');
  required(Number.isInteger(input.run_number) && input.run_number > 0, 'run_number_required');
  required(/^\d{4}-\d{2}-\d{2}$/.test(input.edition_date || ''), 'edition_date_required');
  required(typeof input.edition_id === 'string' && input.edition_id === 'dab-edition-' + input.edition_date, 'edition_identity_required');
  required(typeof input.execution_id === 'string' && input.execution_id.length > 4, 'execution_id_required');
  required(input.latest_successful_run?.terminal_state === 'PUBLIC_CLOSED' && stamp(input.latest_successful_run?.closed_at), 'latest_successful_run_required');
  required(input.previous_run_cleanup?.result === 'PASS', 'previous_run_cleanup_pass_required');

  const learning = input.operational_learning || {};
  required(learning.result === 'PASS', 'operational_learning_readiness_pass_required');
  required(/^sha256:[a-f0-9]{64}$/.test(learning.ledger_digest || ''), 'operational_learning_ledger_digest_required');
  required(Number.isInteger(learning.event_count) && learning.event_count > 0, 'operational_learning_event_count_required');
  required(Number.isInteger(learning.problem_count) && learning.problem_count > 0, 'operational_learning_problem_count_required');
  required(Array.isArray(learning.required_invariants), 'operational_learning_invariants_required');
  required(Array.isArray(learning.unresolved_risks), 'operational_learning_unresolved_risks_required');

  const changes = input.system_changes || {};
  required(changes.result === 'PASS', 'system_change_readiness_pass_required');
  required(/^sha256:[a-f0-9]{64}$/.test(changes.ledger_digest || ''), 'system_change_ledger_digest_required');
  required(Number.isInteger(changes.change_count) && changes.change_count > 0, 'system_change_count_required');
  required(Array.isArray(changes.changes_since_last_known_good), 'changes_since_last_known_good_required');
  required(changes.last_known_good_run_id === input.latest_successful_run?.run_id ||
    changes.last_known_good_run_id === input.latest_successful_run?.execution_id,
    'system_change_last_known_good_binding_required');

  const control = input.control_plane || {};
  required(bool(control.one_writer), 'one_writer_required');
  required(bool(control.controller_available), 'controller_available_required');
  required(bool(control.run_supervisor_enabled), 'run_supervisor_required');
  required(control.supervisor_scope === input.execution_id, 'supervisor_scope_mismatch');
  required(bool(control.supervisor_until_terminal_cleanup), 'supervisor_terminal_cleanup_binding_required');
  required(bool(control.watchdog_enabled), 'supervisor_watchdog_required');
  required(bool(control.writer_fencing_enabled), 'writer_fencing_required');
  required(Number.isInteger(control.supervisor_interval_seconds) && control.supervisor_interval_seconds > 0 &&
    control.supervisor_interval_seconds <= MAX_SUPERVISOR_HEARTBEAT_SECONDS, 'supervisor_heartbeat_required');
  required(Number.isInteger(control.stale_active_threshold_ms) &&
    control.stale_active_threshold_ms > 0 &&
    control.stale_active_threshold_ms <= DEFAULT_STALE_ACTIVE_MS, 'stale_active_guard_required');
  required(bool(control.no_competing_writer), 'competing_writer_detected');
  required(bool(control.actionable_blocked_recovery_tested), 'actionable_blocked_recovery_test_required');
  required(bool(control.stale_active_recovery_tested), 'stale_active_recovery_test_required');
  required(bool(control.duplicate_run_rejection_tested), 'duplicate_run_rejection_test_required');

  const image = input.image_pipeline || {};
  const host = image.host_admission || {};
  const scheduledImageHostReady =
    host.evidence_type === 'live' && host.trigger === 'scheduled' &&
    ['production','qualification_nonproduction'].includes(host.execution_mode) &&
    host.generation_executor === 'native_chatgpt_image_generation' &&
    host.review_method === 'saved_image_visual_inspection' &&
    host.saved_bytes_recovered === true && host.zero_production_cost_verified === true &&
    typeof host.receipt_path === 'string' && host.receipt_path.startsWith('_records/') &&
    /^[a-f0-9]{64}$/.test(host.receipt_sha256 || '');
  required(image.path === PROVEN_IMAGE_PATH, 'proven_image_path_required');
  required(bool(image.exact_byte_capture), 'exact_byte_capture_required');
  required(bool(image.saved_asset_review), 'saved_asset_review_required');
  required(bool(image.accepted_locked_required), 'accepted_locked_required');
  required(image.svg_fallback_enabled === false, 'svg_fallback_must_be_disabled');
  required(image.low_quality_fallback_enabled === false, 'low_quality_fallback_must_be_disabled');
  required(SMALL_PNG_ROUTES.includes(image.small_png_persistence_route), 'small_png_persistence_route_required');
  required(bool(image.small_png_readback_identity_verified), 'small_png_readback_identity_required');

  const timing = input.timing || {};
  required(bool(timing.append_only_transition_ledger), 'transition_ledger_required');
  required(bool(timing.kanban_derived_from_events), 'kanban_event_projection_required');
  required(bool(timing.kanban_digest_bound), 'kanban_digest_binding_required');
  required(bool(timing.executor_state_visible), 'executor_state_visibility_required');
  required(bool(timing.missing_timestamps_never_inferred), 'timestamp_integrity_required');

  const content = input.content_contract || {};
  required(content.story_count === 6, 'six_stories_required');
  required(content.allocation === '2/2/2', 'story_allocation_required');
  required(content.agent_skills_story_count === 1, 'exactly_one_agent_skills_story_required');
  required(content.videos === 2, 'two_videos_required');
  required(content.podcasts === 2 && bool(content.podcast_source_diversity), 'two_source_diverse_podcasts_required');
  required(bool(content.watchlist_refresh), 'watchlist_refresh_required');
  required(content.professional_series_books_considered === 4, 'four_book_review_required');
  required(content.professional_story_images === 6, 'six_professional_images_required');

  const publication = input.publication || {};
  required(bool(publication.protected_ci), 'protected_ci_required');
  required(bool(publication.exact_sha_deploy), 'exact_sha_deploy_required');
  required(bool(publication.independent_live_verification), 'independent_live_verification_required');
  required(publication.success_state === 'PUBLIC_CLOSED', 'public_closed_success_required');
  required(bool(publication.cleanup_after_terminal), 'terminal_cleanup_required');
  if(input.run_number>=5) {
    required(bool(publication.candidate_write_freeze), 'publication_candidate_write_freeze_required');
    required(bool(publication.generic_task29_closeout), 'generic_task29_closeout_required');
  }

  const cost = input.cost_boundary || {};
  for (const key of ['chatgpt_work','codex','paid_apis','billable_overage','new_credentials'])
    required(cost[key] === false, 'cost_boundary_violation:' + key);

  const inheritance = input.inheritance || {};
  required(bool(inheritance.controller_matches_latest_success), 'controller_inheritance_required');
  required(bool(inheritance.supervisor_matches_latest_success_or_current_baseline), 'supervisor_inheritance_required');
  required(bool(inheritance.image_path_matches_latest_success), 'image_path_inheritance_required');
  required(bool(inheritance.publication_path_matches_latest_success), 'publication_path_inheritance_required');
  required(bool(inheritance.all_permanent_fixes_present), 'permanent_fix_inheritance_required');
  required(bool(inheritance.unexplained_regressions_absent), 'unexplained_regression_detected');

  return {
    schema_version:RUN_READINESS_VERSION,
    run_number:input.run_number ?? null,
    edition_id:input.edition_id ?? null,
    execution_id:input.execution_id ?? null,
    evaluated_at:input.evaluated_at || new Date().toISOString(),
    operational_learning_ledger_digest:learning.ledger_digest || null,
    system_change_ledger_digest:changes.ledger_digest || null,
    changes_since_last_known_good:changes.changes_since_last_known_good || [],
    result:errors.length ? 'FAIL' : 'PASS',
    errors:[...new Set(errors)],
    deferred_blockers:scheduledImageHostReady ? [] : ['proven_scheduled_image_host_required'],
    start_scope:errors.length ? 'blocked' : (scheduledImageHostReady ? 'full_production' : 'non_image_production'),
    start_authorized:errors.length === 0,
    image_tasks_authorized:errors.length === 0 && scheduledImageHostReady,
    publication_authorized:errors.length === 0 && scheduledImageHostReady
  };
}

export function assertRunReady(receipt) {
  if (receipt?.schema_version !== RUN_READINESS_VERSION || receipt.result !== 'PASS' || receipt.start_authorized !== true)
    throw Error('RUN_READINESS_NOT_PASS');
  return true;
}

export function assertImageTasksReady(receipt) {
  if (receipt?.schema_version !== RUN_READINESS_VERSION || receipt.result !== 'PASS' ||
      receipt.start_authorized !== true || receipt.image_tasks_authorized !== true)
    throw Error('IMAGE_TASKS_NOT_AUTHORIZED');
  return true;
}

export function terminalCleanupReceipt({
  edition_id,
  execution_id,
  run_number,
  terminal_state,
  terminal_at,
  cleanup_at = new Date().toISOString(),
  run_specific_executors_disabled,
  no_active_writer,
  transition_ledger_reconciled,
  kanban_reconciled,
  timers_frozen,
  production_state_preserved,
  active_run_pointer_cleared,
  operational_learning_reconciled,
  system_changes_reconciled,
  promotion_review_complete,
  timing_compared,
  regression_protection_updated,
  next_run_invariant_set_complete
} = {}) {
  const errors = [];
  if (!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id || '')) errors.push('edition_identity_required');
  if (typeof execution_id !== 'string' || execution_id.length < 5) errors.push('execution_id_required');
  if (!Number.isInteger(run_number) || run_number < 1) errors.push('run_number_required');
  if (!TERMINAL_RUN_STATES.includes(terminal_state)) errors.push('terminal_state_required');
  if (!stamp(terminal_at) || !stamp(cleanup_at)) errors.push('terminal_cleanup_timestamp_required');
  for (const [key,value] of Object.entries({
    run_specific_executors_disabled,no_active_writer,transition_ledger_reconciled,kanban_reconciled,timers_frozen,
    production_state_preserved,active_run_pointer_cleared,operational_learning_reconciled,promotion_review_complete,
    timing_compared,regression_protection_updated,next_run_invariant_set_complete
  })) if (value !== true) errors.push('cleanup_check_failed:' + key);
  return {
    schema_version:'daily-brief-run-cleanup-v2',
    edition_id,execution_id,run_number,terminal_state,terminal_at,cleanup_at,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:[...new Set(errors)],
    next_run_ready:errors.length === 0
  };
}

export function buildPromotionReview({
  edition_id,
  execution_id,
  run_number,
  terminal_state,
  reviewed_at = new Date().toISOString(),
  keep = [],
  fix = [],
  simplify = [],
  validate_next = [],
  ledger_digest = null,
  timing_comparison = null
} = {}) {
  if (!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id || '') || typeof execution_id !== 'string' ||
      !Number.isInteger(run_number) || !TERMINAL_RUN_STATES.includes(terminal_state) || !stamp(reviewed_at))
    throw Error('valid_run_promotion_identity_required');
  return {
    schema_version:RUN_PROMOTION_VERSION,
    edition_id,execution_id,run_number,terminal_state,reviewed_at,
    ledger_digest,timing_comparison,
    keep:[...new Set(keep)],fix:[...new Set(fix)],simplify:[...new Set(simplify)],validate_next:[...new Set(validate_next)],
    revise_living_plan:true,
    task29_owned:true
  };
}
