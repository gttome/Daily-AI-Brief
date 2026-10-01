import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN_READINESS_VERSION,
  PROVEN_IMAGE_PATH,
  validateRunReadiness,
  assertRunReady,
  staleActiveDecision,
  terminalCleanupReceipt,
  buildPromotionReview
} from '../lib/run-readiness.mjs';

function goodInput(){
  return {
    schema_version:RUN_READINESS_VERSION,
    run_number:5,
    edition_date:'2026-10-02',
    edition_id:'dab-edition-2026-10-02',
    execution_id:'reliable-edition-20261002-run5',
    latest_successful_run:{terminal_state:'PUBLIC_CLOSED',closed_at:'2026-10-01T23:00:00Z'},
    previous_run_cleanup:{result:'PASS'},
    operational_learning:{
      result:'PASS',ledger_digest:'sha256:'+'a'.repeat(64),event_count:20,problem_count:10,
      required_invariants:['run-supervisor-v2'],unresolved_risks:[]
    },
    control_plane:{
      one_writer:true,controller_available:true,run_supervisor_enabled:true,
      supervisor_scope:'reliable-edition-20261002-run5',supervisor_until_terminal_cleanup:true,
      watchdog_enabled:true,writer_fencing_enabled:true,supervisor_interval_seconds:60,
      stale_active_threshold_ms:15*60*1000,no_competing_writer:true,
      actionable_blocked_recovery_tested:true,stale_active_recovery_tested:true,duplicate_run_rejection_tested:true
    },
    image_pipeline:{
      path:PROVEN_IMAGE_PATH,exact_byte_capture:true,saved_asset_review:true,
      accepted_locked_required:true,svg_fallback_enabled:false,low_quality_fallback_enabled:false,
      small_png_persistence_route:'direct_git_data_create_blob_base64',
      small_png_readback_identity_verified:true
    },
    timing:{
      append_only_transition_ledger:true,kanban_derived_from_events:true,kanban_digest_bound:true,
      executor_state_visible:true,missing_timestamps_never_inferred:true
    },
    content_contract:{
      story_count:6,allocation:'2/2/2',agent_skills_story_count:1,videos:2,podcasts:2,
      podcast_source_diversity:true,watchlist_refresh:true,professional_series_books_considered:4,
      professional_story_images:6
    },
    publication:{
      protected_ci:true,exact_sha_deploy:true,independent_live_verification:true,
      success_state:'PUBLIC_CLOSED',cleanup_after_terminal:true
    },
    cost_boundary:{chatgpt_work:false,codex:false,paid_apis:false,billable_overage:false,new_credentials:false},
    inheritance:{
      controller_matches_latest_success:true,supervisor_matches_latest_success_or_current_baseline:true,
      image_path_matches_latest_success:true,publication_path_matches_latest_success:true,
      all_permanent_fixes_present:true,unexplained_regressions_absent:true
    }
  };
}

test('evidence-based readiness passes and authorizes start',()=>{
  const receipt=validateRunReadiness(goodInput());
  assert.equal(receipt.result,'PASS');
  assert.equal(receipt.start_authorized,true);
  assert.equal(assertRunReady(receipt),true);
});

test('missing Supervisor, ledger proof and small-PNG route fail readiness',()=>{
  const input=goodInput();
  input.control_plane.run_supervisor_enabled=false;
  input.operational_learning.result='FAIL';
  input.image_pipeline.small_png_persistence_route=null;
  const receipt=validateRunReadiness(input);
  assert.equal(receipt.result,'FAIL');
  assert.ok(receipt.errors.includes('run_supervisor_required'));
  assert.ok(receipt.errors.includes('operational_learning_readiness_pass_required'));
  assert.ok(receipt.errors.includes('small_png_persistence_route_required'));
});

test('stale Active task requires same-operation recovery without status request',()=>{
  const result=staleActiveDecision({
    task_state:'Active',executor_state:'Stopped',
    last_progress_at:'2026-10-01T18:00:00Z',now:'2026-10-01T18:01:00Z'
  });
  assert.equal(result.stale,true);
  assert.equal(result.action,'resume_same_operation_or_block');
});

test('healthy Active task inside liveness window does not trigger recovery',()=>{
  const result=staleActiveDecision({
    task_state:'Active',executor_state:'Running',
    last_progress_at:'2026-10-01T18:10:00Z',now:'2026-10-01T18:11:00Z'
  });
  assert.equal(result.stale,false);
  assert.equal(result.action,'none');
});

test('Task 29 cleanup requires learning, timing and invariant reconciliation',()=>{
  const base={
    edition_id:'dab-edition-2026-10-01',execution_id:'reliable-edition-20261001-run4',
    run_number:4,terminal_state:'PUBLIC_CLOSED',
    terminal_at:'2026-10-01T23:00:00Z',cleanup_at:'2026-10-01T23:05:00Z',
    run_specific_executors_disabled:true,no_active_writer:true,transition_ledger_reconciled:true,
    kanban_reconciled:true,timers_frozen:true,production_state_preserved:true,active_run_pointer_cleared:true,
    operational_learning_reconciled:true,promotion_review_complete:true,timing_compared:true,
    regression_protection_updated:true,next_run_invariant_set_complete:true
  };
  const pass=terminalCleanupReceipt(base);
  assert.equal(pass.result,'PASS');
  assert.equal(pass.next_run_ready,true);
  const fail=terminalCleanupReceipt({...base,operational_learning_reconciled:false});
  assert.equal(fail.result,'FAIL');
  assert.ok(fail.errors.includes('cleanup_check_failed:operational_learning_reconciled'));
});

test('promotion review is owned by Task 29 and carries ledger/timing evidence',()=>{
  const review=buildPromotionReview({
    edition_id:'dab-edition-2026-10-01',execution_id:'reliable-edition-20261001-run4',
    run_number:4,terminal_state:'PUBLIC_CLOSED',reviewed_at:'2026-10-01T23:06:00Z',
    keep:['fenced supervisor'],fix:[],simplify:['remove duplicate keeper'],validate_next:['fault injection'],
    ledger_digest:'sha256:'+'b'.repeat(64),timing_comparison:{total_run_seconds:1000}
  });
  assert.equal(review.task29_owned,true);
  assert.equal(review.revise_living_plan,true);
  assert.equal(review.ledger_digest,'sha256:'+'b'.repeat(64));
});
