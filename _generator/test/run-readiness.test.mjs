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
    run_number:4,
    edition_date:'2026-10-01',
    edition_id:'dab-edition-2026-10-01-r4',
    latest_successful_run:{terminal_state:'PUBLIC_CLOSED',closed_at:'2026-10-01T05:00:00Z'},
    previous_run_cleanup:{result:'PASS'},
    control_plane:{
      one_writer:true,controller_available:true,run_scoped_keeper_enabled:true,
      keeper_scope:'dab-edition-2026-10-01-r4',keeper_until_terminal_cleanup:true,
      stale_active_threshold_ms:15*60*1000,no_competing_writer:true
    },
    image_pipeline:{
      path:PROVEN_IMAGE_PATH,exact_byte_capture:true,saved_asset_review:true,
      accepted_locked_required:true,svg_fallback_enabled:false,low_quality_fallback_enabled:false
    },
    timing:{
      append_only_transition_ledger:true,kanban_derived_from_events:true,
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
      controller_matches_latest_success:true,keeper_matches_latest_success:true,
      image_path_matches_latest_success:true,publication_path_matches_latest_success:true,
      unexplained_regressions_absent:true
    }
  };
}

test('valid readiness passes and authorizes start',()=>{
  const input=goodInput();
  // Current contract requires canonical date edition identity. Run numbers are tracked separately.
  input.edition_id='dab-edition-2026-10-01';
  input.control_plane.keeper_scope=input.edition_id;
  const receipt=validateRunReadiness(input);
  assert.equal(receipt.result,'PASS');
  assert.equal(receipt.start_authorized,true);
  assert.equal(assertRunReady(receipt),true);
});

test('one-shot-only control and SVG fallback fail readiness',()=>{
  const input=goodInput();
  input.edition_id='dab-edition-2026-10-01';
  input.control_plane.keeper_scope=input.edition_id;
  input.control_plane.run_scoped_keeper_enabled=false;
  input.image_pipeline.path='svg-editorial-v1';
  input.image_pipeline.svg_fallback_enabled=true;
  const receipt=validateRunReadiness(input);
  assert.equal(receipt.result,'FAIL');
  assert.equal(receipt.start_authorized,false);
  assert.ok(receipt.errors.includes('run_scoped_keeper_required'));
  assert.ok(receipt.errors.includes('proven_image_path_required'));
  assert.ok(receipt.errors.includes('svg_fallback_must_be_disabled'));
});

test('stale active task requires same-operation recovery or block',()=>{
  const result=staleActiveDecision({
    task_state:'Active',executor_state:'Stopped',
    last_progress_at:'2026-10-01T18:00:00Z',now:'2026-10-01T18:16:00Z'
  });
  assert.equal(result.stale,true);
  assert.equal(result.action,'resume_same_operation_or_block');
});

test('active task inside liveness window does not trigger recovery',()=>{
  const result=staleActiveDecision({
    task_state:'Active',executor_state:'Running',
    last_progress_at:'2026-10-01T18:10:00Z',now:'2026-10-01T18:20:00Z'
  });
  assert.equal(result.stale,false);
  assert.equal(result.action,'none');
});

test('terminal cleanup requires every cleanup invariant',()=>{
  const pass=terminalCleanupReceipt({
    edition_id:'dab-edition-2026-10-01',run_number:3,terminal_state:'FAILED',
    terminal_at:'2026-10-01T19:42:42Z',cleanup_at:'2026-10-01T19:43:36Z',
    run_specific_executors_disabled:true,no_active_writer:true,transition_ledger_reconciled:true,
    kanban_reconciled:true,timers_frozen:true,production_state_preserved:true,next_run_pointer_cleared:true
  });
  assert.equal(pass.result,'PASS');
  assert.equal(pass.next_run_ready,true);

  const fail=terminalCleanupReceipt({
    edition_id:'dab-edition-2026-10-01',run_number:3,terminal_state:'FAILED',
    terminal_at:'2026-10-01T19:42:42Z',cleanup_at:'2026-10-01T19:43:36Z',
    run_specific_executors_disabled:false,no_active_writer:true,transition_ledger_reconciled:true,
    kanban_reconciled:true,timers_frozen:true,production_state_preserved:true,next_run_pointer_cleared:true
  });
  assert.equal(fail.result,'FAIL');
});

test('promotion review always revises living plan',()=>{
  const review=buildPromotionReview({
    edition_id:'dab-edition-2026-10-01',run_number:3,terminal_state:'FAILED',
    reviewed_at:'2026-10-01T19:45:00Z',
    keep:['append-only timing'],fix:['persistent keeper'],simplify:['remove SVG shortcut'],validate_next:['keeper bound before start']
  });
  assert.equal(review.revise_living_plan,true);
  assert.deepEqual(review.fix,['persistent keeper']);
});
