import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {PROVEN_IMAGE_PATH, RUN_READINESS_VERSION} from '../lib/run-readiness.mjs';
import {
  REHEARSAL_EXECUTION_ID,
  REHEARSAL_BRANCH,
  REUSABLE_CONSUMER_ID,
  verifyScheduledConsumerEvidence,
  verifyAutomaticSupervisorResume,
  buildAndVerifySyntheticKanban,
  buildRehearsalReceipt
} from '../lib/pre-next-run-rehearsal.mjs';

function prestate(){
  const tasks={};
  for(let n=0;n<=29;n++){
    const id=String(n).padStart(2,'0');
    tasks[id]={title:`Synthetic Task ${id}`};
  }
  return {
    schema_version:'pre-next-run-synthetic-state-v1',
    rehearsal_id:'pre-next-run-five-change-20261002-r1',
    mode:'NON_PRODUCTION',
    production_allocation:false,
    image_generation_allowed:false,
    execution_id:REHEARSAL_EXECUTION_ID,
    edition_id:'synthetic-edition-pre-next-run-2026-10-02',
    branch:REHEARSAL_BRANCH,
    created_at:'2026-10-02T21:32:43Z',
    completed_tasks:['00'],
    current_task:'11',
    writer_lease:{
      schema_version:'run-writer-lease-v1',
      execution_id:REHEARSAL_EXECUTION_ID,
      owner_id:'synthetic-supervisor:pre-next-run-five-change',
      generation:2,
      acquired_at:'2026-10-02T21:32:43Z',
      last_heartbeat_at:'2026-10-02T21:32:43Z',
      expires_at:'2026-10-02T22:32:43Z',
      released:false
    },
    tasks
  };
}

function request(){
  return {
    schema_version:'pre-next-run-synthetic-scheduled-request-v1',
    mode:'NON_PRODUCTION',
    status:'queued_for_scheduled_consumer',
    execution_id:REHEARSAL_EXECUTION_ID,
    edition_id:'synthetic-edition-pre-next-run-2026-10-02',
    branch:REHEARSAL_BRANCH,
    task_id:'11',
    capability:'native_chatgpt',
    reusable_consumer_automation_id:REUSABLE_CONSUMER_ID,
    writer_generation:1,
    writer_generation_is_provenance:true,
    authority_refresh_required_at_invocation:true,
    rehearsal_no_generation:true
  };
}

function consumerResult(){
  return {
    schema_version:'pre-next-run-synthetic-consumer-result-v1',
    result:'PASS',
    observed_at:'2026-10-02T21:44:05Z',
    execution_id:REHEARSAL_EXECUTION_ID,
    branch:REHEARSAL_BRANCH,
    task_id:'11',
    automation_id:REUSABLE_CONSUMER_ID,
    protected_main_sha_observed:'2'.repeat(40),
    request_generation:1,
    current_generation_before:2,
    authority_generation:3,
    stale_generation_rejected:true,
    no_duplicate_execution:true,
    preserved_completed_tasks:['00'],
    generation_calls:0,
    image_edit_calls:0,
    publication_mutations:0,
    run5_mutations:0
  };
}

function release(){
  return {
    schema_version:'run-writer-lease-v1',
    execution_id:REHEARSAL_EXECUTION_ID,
    owner_id:'scheduled-image:synthetic-task11',
    generation:3,
    task_id:'11',
    released:true,
    released_at:'2026-10-02T21:44:06Z',
    expires_at:'2026-10-02T21:44:06Z',
    release_reason:'TASK_11_DONE_HANDOFF_TO_SUPERVISOR'
  };
}

function task00Input(){
  return {
    schema_version:RUN_READINESS_VERSION,
    run_number:6,
    edition_date:'2026-10-03',
    edition_id:'dab-edition-2026-10-03',
    execution_id:REHEARSAL_EXECUTION_ID,
    latest_successful_run:{terminal_state:'PUBLIC_CLOSED',closed_at:'2026-10-02T20:13:26.355Z'},
    previous_run_cleanup:{result:'PASS'},
    operational_learning:{
      result:'PASS',ledger_digest:'sha256:'+'a'.repeat(64),event_count:66,problem_count:21,
      required_invariants:['pre-next-run-five-change-hardening'],unresolved_risks:[]
    },
    control_plane:{
      one_writer:true,controller_available:true,run_supervisor_enabled:true,
      supervisor_scope:REHEARSAL_EXECUTION_ID,supervisor_until_terminal_cleanup:true,
      watchdog_enabled:true,writer_fencing_enabled:true,supervisor_interval_seconds:60,
      stale_active_threshold_ms:15*60*1000,no_competing_writer:true,
      actionable_blocked_recovery_tested:true,stale_active_recovery_tested:true,duplicate_run_rejection_tested:true,terminal_run_reopen_guard_enabled:true,terminal_run_immutability_tested:true
    },
    image_pipeline:{
      path:PROVEN_IMAGE_PATH,exact_byte_capture:true,saved_asset_review:true,
      accepted_locked_required:true,svg_fallback_enabled:false,low_quality_fallback_enabled:false,
      small_png_persistence_route:'direct_git_data_create_blob_base64',
      small_png_readback_identity_verified:true
    },
    timing:{
      append_only_transition_ledger:true,kanban_derived_from_events:true,kanban_digest_bound:true,
      executor_state_visible:true,missing_timestamps_never_inferred:true,kanban_observability_only:true,metrics_observability_only:true,projection_defects_nonblocking:true
    },
    content_contract:{
      story_count:6,allocation:'2/2/2',agent_skills_story_count:1,videos:2,podcasts:2,
      podcast_source_diversity:true,watchlist_refresh:true,professional_series_books_considered:4,
      professional_story_images:6
    },
    publication:{
      protected_ci:true,exact_sha_deploy:true,independent_live_verification:true,
      success_state:'PUBLIC_CLOSED',cleanup_after_terminal:true,candidate_write_freeze:true,generic_task29_closeout:true
    },
    cost_boundary:{chatgpt_work:false,codex:false,paid_apis:false,billable_overage:false,new_credentials:false},
    inheritance:{
      controller_matches_latest_success:true,supervisor_matches_latest_success_or_current_baseline:true,
      image_path_matches_latest_success:true,publication_path_matches_latest_success:true,
      all_permanent_fixes_present:true,unexplained_regressions_absent:true
    }
  };
}

test('synthetic Task 00 returns one coherent READY decision from protected host registration',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pre-next-run-task00-'));
  try{
    const file=path.join(root,'input.json');
    fs.writeFileSync(file,JSON.stringify(task00Input()));
    const raw=execFileSync('node',['_tools/run-readiness.mjs','validate','--input',file],{encoding:'utf8'});
    const decision=JSON.parse(raw);
    assert.equal(decision.result,'PASS');
    assert.equal(decision.start_authorized,true);
    assert.equal(decision.start_scope,'full_production');
    assert.equal(decision.image_tasks_authorized,true);
    assert.equal(decision.publication_authorized,true);
    assert.deepEqual(decision.errors,[]);
    assert.deepEqual(decision.deferred_blockers,[]);
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('scheduled consumer proof rejects stale generation as authority and performs zero generation/edit mutations',()=>{
  const proof=verifyScheduledConsumerEvidence({
    prestate:prestate(),request:request(),consumerResult:consumerResult(),writerRelease:release(),
    expectedMainSha:'2'.repeat(40)
  });
  assert.equal(proof.result,'PASS');
  assert.equal(proof.request_generation,1);
  assert.equal(proof.current_generation_before,2);
  assert.equal(proof.authority_generation,3);
  assert.equal(proof.generation_calls,0);
  assert.equal(proof.image_edit_calls,0);
  assert.equal(proof.publication_mutations,0);
  assert.equal(proof.run5_mutations,0);
});

test('scheduled consumer proof fails if request generation becomes mutation authority',()=>{
  const bad=consumerResult();
  bad.authority_generation=1;
  bad.stale_generation_rejected=false;
  const proof=verifyScheduledConsumerEvidence({
    prestate:prestate(),request:request(),consumerResult:bad,writerRelease:{...release(),generation:1}
  });
  assert.equal(proof.result,'FAIL');
  assert.ok(proof.errors.includes('scheduled_consumer_fresh_authority_required'));
  assert.ok(proof.errors.includes('scheduled_consumer_stale_generation_rejection_required'));
});

test('explicit worker release satisfies event-driven Supervisor handoff and resumes same execution without rework',()=>{
  const workflow=fs.readFileSync('.github/workflows/run-supervisor-handoff.yml','utf8');
  const proof=verifyAutomaticSupervisorResume({
    prestate:prestate(),writerRelease:release(),workflowText:workflow,
    resumedAt:'2026-10-02T21:44:07Z'
  });
  assert.equal(proof.result,'PASS');
  assert.equal(proof.execution_id,REHEARSAL_EXECUTION_ID);
  assert.equal(proof.resumed_supervisor_generation,4);
  assert.deepEqual(proof.completed_tasks_before,['00']);
  assert.deepEqual(proof.completed_tasks_after,['00','11']);
  assert.equal(proof.completed_task00_reworked,false);
  assert.equal(proof.duplicate_execution_created,false);
});

test('synthetic Kanban satisfies exact Backlog to WIP to Done contract with all task durations and total elapsed',()=>{
  const proof=buildAndVerifySyntheticKanban({
    prestate:prestate(),writerRelease:release(),observedAt:'2026-10-02T21:44:07Z'
  });
  assert.equal(proof.result,'PASS');
  assert.deepEqual(proof.columns,['Backlog','WIP','Done']);
  assert.equal(proof.task_count,30);
  assert.equal(proof.fresh,true);
  assert.equal(proof.task_durations['00'],'1s');
  assert.equal(proof.task_durations['11'],'683s');
  assert.equal(proof.task_durations['12'],'unavailable');
  assert.equal(typeof proof.total_brief_elapsed,'string');
  assert.notEqual(proof.total_brief_elapsed,'unavailable');
});

test('final receipt cannot authorize production until protected CI itself is PASS',()=>{
  const scheduled=verifyScheduledConsumerEvidence({
    prestate:prestate(),request:request(),consumerResult:consumerResult(),writerRelease:release(),
    expectedMainSha:'2'.repeat(40)
  });
  const automatic=verifyAutomaticSupervisorResume({
    prestate:prestate(),writerRelease:release(),
    workflowText:fs.readFileSync('.github/workflows/run-supervisor-handoff.yml','utf8'),
    resumedAt:'2026-10-02T21:44:07Z'
  });
  const kanban=buildAndVerifySyntheticKanban({
    prestate:prestate(),writerRelease:release(),observedAt:'2026-10-02T21:44:07Z'
  });
  const receipt=buildRehearsalReceipt({
    task00Decision:{result:'PASS',start_authorized:true,image_tasks_authorized:true,publication_authorized:true},
    scheduledConsumer:scheduled,automaticResume:automatic,kanbanProof:kanban,
    protectedCi:{result:'PENDING'}
  });
  assert.equal(receipt.result,'FAIL');
  assert.equal(receipt.next_production_run_authorized,false);
  assert.ok(receipt.errors.includes('protected_ci_pass_required'));
});

test('actual scheduled rehearsal evidence proves consumption, stale-generation rejection, zero mutation, handoff contract and Kanban',()=>{
  const base='_records/hardening/pre-next-run-five-change-2026-10-02';
  const actualPrestate=JSON.parse(fs.readFileSync(base+'/synthetic-prestate.json','utf8'));
  const actualRequest=JSON.parse(fs.readFileSync(base+'/synthetic-task11-request.json','utf8'));
  const actualConsumer=JSON.parse(fs.readFileSync(base+'/synthetic-consumer-result.json','utf8'));
  const actualRelease=JSON.parse(fs.readFileSync(base+'/synthetic-writer-release.json','utf8'));
  const scheduled=verifyScheduledConsumerEvidence({
    prestate:actualPrestate,request:actualRequest,consumerResult:actualConsumer,writerRelease:actualRelease,
    expectedMainSha:'25675f9e13e2cdf77ebc109cf2c33f31303004f1'
  });
  assert.equal(scheduled.result,'PASS',scheduled.errors.join(','));
  assert.equal(scheduled.request_generation,1);
  assert.equal(scheduled.current_generation_before,2);
  assert.equal(scheduled.authority_generation,3);
  assert.equal(scheduled.release_generation,3);
  assert.equal(scheduled.generation_calls,0);
  assert.equal(scheduled.image_edit_calls,0);
  assert.equal(scheduled.publication_mutations,0);
  assert.equal(scheduled.run5_mutations,0);

  const workflow=fs.readFileSync('.github/workflows/run-supervisor-handoff.yml','utf8');
  const releaseMs=Date.parse(actualRelease.released_at);
  const automatic=verifyAutomaticSupervisorResume({
    prestate:actualPrestate,writerRelease:actualRelease,workflowText:workflow,
    resumedAt:new Date(releaseMs+1000).toISOString()
  });
  assert.equal(automatic.result,'PASS',automatic.errors.join(','));
  assert.equal(automatic.execution_id,REHEARSAL_EXECUTION_ID);
  assert.equal(automatic.completed_task00_reworked,false);
  assert.equal(automatic.duplicate_execution_created,false);

  const kanban=buildAndVerifySyntheticKanban({
    prestate:actualPrestate,writerRelease:actualRelease,
    observedAt:new Date(releaseMs+1000).toISOString()
  });
  assert.equal(kanban.result,'PASS',kanban.errors.join(','));
  assert.deepEqual(kanban.columns,['Backlog','WIP','Done']);
  assert.equal(kanban.task_count,30);
  assert.equal(kanban.fresh,true);
  assert.equal(kanban.task_durations['12'],'unavailable');
  assert.notEqual(kanban.total_brief_elapsed,'unavailable');
});

