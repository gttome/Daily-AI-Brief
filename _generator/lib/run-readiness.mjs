export const RUN_READINESS_VERSION = 'run-learning-readiness-v1';
export const RUN_PROMOTION_VERSION = 'run-promotion-review-v1';
export const DEFAULT_STALE_ACTIVE_MS = 15 * 60 * 1000;
export const PROVEN_IMAGE_PATH = 'production-image-execution-v2:generate-transfer-verify-review-accept';
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
  if (!stamp(last_progress_at)) return {action:'block', reason:'active_without_progress_timestamp', stale:true};
  const age_ms = Math.max(0, Date.parse(now) - Date.parse(last_progress_at));
  if (age_ms < threshold_ms) return {action:'none', reason:'within_liveness_window', stale:false, age_ms};
  if (executor_state === 'Running') return {action:'verify_then_resume', reason:'stale_active_despite_running_executor', stale:true, age_ms};
  if (['Idle','Stopped','Unknown',null,undefined].includes(executor_state))
    return {action:'resume_same_operation_or_block', reason:'stale_active_without_live_executor', stale:true, age_ms};
  if (executor_state === 'Recovering') return {action:'verify_recovery_progress', reason:'recovery_exceeded_liveness_window', stale:true, age_ms};
  return {action:'resume_same_operation_or_block', reason:'stale_active_unrecognized_executor_state', stale:true, age_ms};
}

export function validateRunReadiness(input = {}) {
  const errors = [];
  const required = (ok, code) => { if (!ok) errors.push(code); };
  required(input.schema_version === RUN_READINESS_VERSION, 'readiness_schema_version_required');
  required(Number.isInteger(input.run_number) && input.run_number > 0, 'run_number_required');
  required(/^\d{4}-\d{2}-\d{2}$/.test(input.edition_date || ''), 'edition_date_required');
  required(typeof input.edition_id === 'string' && input.edition_id === 'dab-edition-' + input.edition_date, 'edition_identity_required');
  required(input.latest_successful_run?.terminal_state === 'PUBLIC_CLOSED' && stamp(input.latest_successful_run?.closed_at), 'latest_successful_run_required');
  required(input.previous_run_cleanup?.result === 'PASS', 'previous_run_cleanup_pass_required');

  required(bool(input.control_plane?.one_writer), 'one_writer_required');
  required(bool(input.control_plane?.controller_available), 'controller_available_required');
  required(bool(input.control_plane?.run_scoped_keeper_enabled), 'run_scoped_keeper_required');
  required(input.control_plane?.keeper_scope === input.edition_id, 'keeper_scope_mismatch');
  required(bool(input.control_plane?.keeper_until_terminal_cleanup), 'keeper_terminal_cleanup_binding_required');
  required(Number.isInteger(input.control_plane?.stale_active_threshold_ms) &&
    input.control_plane.stale_active_threshold_ms > 0 &&
    input.control_plane.stale_active_threshold_ms <= DEFAULT_STALE_ACTIVE_MS, 'stale_active_guard_required');
  required(bool(input.control_plane?.no_competing_writer), 'competing_writer_detected');

  required(input.image_pipeline?.path === PROVEN_IMAGE_PATH, 'proven_image_path_required');
  required(bool(input.image_pipeline?.exact_byte_capture), 'exact_byte_capture_required');
  required(bool(input.image_pipeline?.saved_asset_review), 'saved_asset_review_required');
  required(bool(input.image_pipeline?.accepted_locked_required), 'accepted_locked_required');
  required(input.image_pipeline?.svg_fallback_enabled === false, 'svg_fallback_must_be_disabled');
  required(input.image_pipeline?.low_quality_fallback_enabled === false, 'low_quality_fallback_must_be_disabled');

  required(bool(input.timing?.append_only_transition_ledger), 'transition_ledger_required');
  required(bool(input.timing?.kanban_derived_from_events), 'kanban_event_projection_required');
  required(bool(input.timing?.executor_state_visible), 'executor_state_visibility_required');
  required(bool(input.timing?.missing_timestamps_never_inferred), 'timestamp_integrity_required');

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

  const cost = input.cost_boundary || {};
  for (const key of ['chatgpt_work','codex','paid_apis','billable_overage','new_credentials'])
    required(cost[key] === false, 'cost_boundary_violation:' + key);

  const inheritance = input.inheritance || {};
  required(bool(inheritance.controller_matches_latest_success), 'controller_inheritance_required');
  required(bool(inheritance.keeper_matches_latest_success), 'keeper_inheritance_required');
  required(bool(inheritance.image_path_matches_latest_success), 'image_path_inheritance_required');
  required(bool(inheritance.publication_path_matches_latest_success), 'publication_path_inheritance_required');
  required(bool(inheritance.unexplained_regressions_absent), 'unexplained_regression_detected');

  return {
    schema_version: RUN_READINESS_VERSION,
    run_number: input.run_number ?? null,
    edition_id: input.edition_id ?? null,
    evaluated_at: input.evaluated_at || new Date().toISOString(),
    result: errors.length ? 'FAIL' : 'PASS',
    errors: [...new Set(errors)],
    start_authorized: errors.length === 0
  };
}

export function assertRunReady(receipt) {
  if (receipt?.schema_version !== RUN_READINESS_VERSION || receipt.result !== 'PASS' || receipt.start_authorized !== true)
    throw Error('RUN_READINESS_NOT_PASS');
  return true;
}

export function terminalCleanupReceipt({
  edition_id,
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
  next_run_pointer_cleared
} = {}) {
  const errors = [];
  if (!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id || '')) errors.push('edition_identity_required');
  if (!Number.isInteger(run_number) || run_number < 1) errors.push('run_number_required');
  if (!TERMINAL_RUN_STATES.includes(terminal_state)) errors.push('terminal_state_required');
  if (!stamp(terminal_at) || !stamp(cleanup_at)) errors.push('terminal_cleanup_timestamp_required');
  for (const [key,value] of Object.entries({run_specific_executors_disabled,no_active_writer,transition_ledger_reconciled,kanban_reconciled,timers_frozen,production_state_preserved,next_run_pointer_cleared}))
    if (value !== true) errors.push('cleanup_check_failed:' + key);
  return {
    schema_version:'daily-brief-run-cleanup-v1',
    edition_id, run_number, terminal_state, terminal_at, cleanup_at,
    result: errors.length ? 'FAIL' : 'PASS',
    errors:[...new Set(errors)],
    next_run_ready: errors.length === 0
  };
}

export function buildPromotionReview({
  edition_id,
  run_number,
  terminal_state,
  reviewed_at = new Date().toISOString(),
  keep = [],
  fix = [],
  simplify = [],
  validate_next = []
} = {}) {
  if (!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id || '') || !Number.isInteger(run_number) ||
      !TERMINAL_RUN_STATES.includes(terminal_state) || !stamp(reviewed_at)) throw Error('valid_run_promotion_identity_required');
  return {
    schema_version: RUN_PROMOTION_VERSION,
    edition_id, run_number, terminal_state, reviewed_at,
    keep:[...new Set(keep)],
    fix:[...new Set(fix)],
    simplify:[...new Set(simplify)],
    validate_next:[...new Set(validate_next)],
    revise_living_plan:true
  };
}
