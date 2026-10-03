import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {publicationWriteBoundary,latestRecoverableImage} from '../lib/run-supervisor.mjs';
import {assertFrozenPublication} from '../lib/frozen-publication.mjs';
import {buildProductionRunCloseout} from '../lib/production-run-closeout.mjs';
import {verifyUnattendedImageQualification} from '../lib/unattended-image-qualification.mjs';
const now='2026-10-02T06:00:00Z',sha='a'.repeat(40);
const tasks=()=>Object.fromEntries(Array.from({length:30},(_,i)=>[String(i).padStart(2,'0'),{title:'Task '+i,state:i<23?'Done':'Backlog'}]));
const events=()=>Array.from({length:23},(_,i)=>({task_id:String(i).padStart(2,'0'),from:'Active',to:'Done',at:'2026-10-02T05:00:00Z'}));
const pointer=()=>({active:true,terminal:false,edition_id:'dab-edition-2026-10-02',execution_id:'reliable-edition-20261002-run5',execution_key:'2026-10-02-run5',branch:'reliable-edition/dab-edition-2026-10-02-run5'});
function closure(){return {pointer:pointer(),tasks:tasks(),events:events(),now,ledgerText:'',
  completion:{edition_id:'dab-edition-2026-10-02',production_sha:sha,deployed_sha:sha,phase:'live_verified',pages:{conclusion:'success'},live_verification:{final_result:'pass'},pr_number:900,ci_run_id:123},
  validation:{date:'2026-10-02',publication_sha:sha,final_result:'pass',checks:['publication_receipt','pages_deployment','live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets'].map(check_id=>({check_id,result:'pass'}))},
  runState:{stage:'CLOSED',current_sha:sha},cc:{edition_date:'2026-10-02',publication_sha:sha,canonical_publication_status:{terminal_outcome:'COMPLETED'}}};}

test('publication freezes before Task 23 and remains frozen if a projection regresses',()=>{
  assert.equal(publicationWriteBoundary(tasks(),events()).write_allowed,false);
  const t=tasks();t['22'].state='Active';assert.equal(publicationWriteBoundary(t,[]).write_allowed,true);
  assert.equal(publicationWriteBoundary(t,[{task_id:'23',to:'Active'}]).write_allowed,false);
});
test('historical image rejection cannot drive a different task or a locked image',()=>{
  const rows=[{candidate_id:'m04',status:'rejected',recovery_action:'retry',attempt:2}];
  assert.equal(latestRecoverableImage(rows,{task_id:'15',candidate_id:'m08'}),null);
  rows.push({candidate_id:'m04',status:'accepted_locked'});
  assert.equal(latestRecoverableImage(rows,{candidate_id:'m04'}),null);
});
test('frozen publication requires active identity, complete upstream tasks and validated-event bridge',()=>{
  const p=pointer(),v={pointer:p,branch:p.branch,tasks:tasks(),events:events(),baselineSha:sha,
    manifest:{edition_id:p.edition_id,edition_date:'2026-10-02',baseline_sha:sha},
    validated:[{phase:'validated',edition_id:p.edition_id,baseline_main_sha:sha,checks:[{severity:'critical',result:'pass'}]}]};
  assert.equal(assertFrozenPublication(v).execution_id,p.execution_id);
  assert.throws(()=>assertFrozenPublication({...v,validated:[]}),/validated_event/);
  assert.throws(()=>assertFrozenPublication({...v,pointer:{...p,active:false}}),/active_run/);
  assert.throws(()=>assertFrozenPublication({...v,baselineSha:'b'.repeat(40)}),/baseline/);
});
test('generic closeout preserves prior events, produces Task29 cleanup and retains the production SHA',()=>{
  const input=closure(),before=JSON.stringify(input.events),out=buildProductionRunCloseout(input);
  assert.equal(JSON.stringify(input.events),before);
  assert.equal(out.files['data/operations/active-production-run.json'].active,false);
  assert.equal(out.files['_records/edition-execution/public-closed/2026-10-02-run5.json'].production_sha,sha);
  const done=out.files['_records/edition-execution/events/2026-10-02-run5/29-protected-closeout.json'];
  assert.equal(done.to,'Done');assert.equal(done.timestamp_scope,'evidence_reconciliation_observed');
  assert.equal(out.files['_records/edition-execution/cleanup/2026-10-02-run5.json'].next_run_start_authorized,false);
  assert.ok(!Object.keys(out.files).some(p=>/^(briefs|stories|_data)\//.test(p)));
});
test('closeout refuses another SHA, missing live image proof, and an incomplete candidate',()=>{
  const a=closure();a.validation.publication_sha='b'.repeat(40);assert.throws(()=>buildProductionRunCloseout(a),/live_validation/);
  const b=closure();b.validation.checks.pop();assert.throws(()=>buildProductionRunCloseout(b),/live_validation/);
  const c=closure();c.events=c.events.slice(1);assert.throws(()=>buildProductionRunCloseout(c),/frozen_candidate/);
});
test('closed Run4 is preserved without reconstructing or publishing anything',()=>{
  const p={active:false,terminal:true,execution_id:'reliable-edition-20261001-run4'};
  assert.deepEqual(buildProductionRunCloseout({pointer:p}).files,{});
});
test('interactive trial and empty host registration cannot certify unattended readiness',()=>{
  const report=JSON.parse(fs.readFileSync(new URL('../../_records/image-trials/2026-10-02-six-image/summary.json',import.meta.url)));
  let reads=0;const r=verifyUnattendedImageQualification(report,{readCommitted:()=>{reads++;}});
  assert.equal(r.result,'BLOCKED');assert.ok(r.errors.includes('registered_unattended_host_required'));assert.equal(reads,0);
});
test('fixture PASS records cannot stand in for six live scheduled image receipts',()=>{
  const r=verifyUnattendedImageQualification({schema_version:'unattended-image-qualification-v1',host_id:'fixture',evidence_type:'fixture',trigger:'fixture',execution_mode:'qualification_nonproduction',images:Array(6).fill({})},{hostId:'fixture'});
  assert.equal(r.result,'BLOCKED');assert.ok(r.errors.includes('live_unattended_qualification_required'));
});

test('Task00 CLI starts Run5 non-image work while keeping image/publication blocked without a registered host',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'run5-admission-'));
  try {
    const base={
      schema_version:'run-learning-readiness-v2',run_number:5,edition_date:'2026-10-02',
      edition_id:'dab-edition-2026-10-02',execution_id:'reliable-edition-20261002-run5',
      latest_successful_run:{terminal_state:'PUBLIC_CLOSED',closed_at:'2026-10-02T04:00:00Z'},
      previous_run_cleanup:{result:'PASS'},
      operational_learning:{result:'PASS',ledger_digest:'sha256:'+'a'.repeat(64),event_count:43,problem_count:31,required_invariants:[],unresolved_risks:[]},
      control_plane:{one_writer:true,controller_available:true,run_supervisor_enabled:true,supervisor_scope:'reliable-edition-20261002-run5',supervisor_until_terminal_cleanup:true,watchdog_enabled:true,writer_fencing_enabled:true,supervisor_interval_seconds:60,stale_active_threshold_ms:900000,no_competing_writer:true,actionable_blocked_recovery_tested:true,stale_active_recovery_tested:true,duplicate_run_rejection_tested:true,terminal_run_reopen_guard_enabled:true,terminal_run_immutability_tested:true},
      image_pipeline:{path:'production-image-execution-v2:generate-transfer-verify-review-accept',exact_byte_capture:true,saved_asset_review:true,accepted_locked_required:true,svg_fallback_enabled:false,low_quality_fallback_enabled:false,small_png_persistence_route:'direct_git_data_create_blob_base64',small_png_readback_identity_verified:true,host_admission:{evidence_type:'live',trigger:'scheduled',execution_mode:'production',generation_executor:'native_chatgpt_image_generation',review_method:'saved_image_visual_inspection',saved_bytes_recovered:true,zero_production_cost_verified:true,receipt_path:'_records/invented.json',receipt_sha256:'a'.repeat(64)}},
      timing:{append_only_transition_ledger:true,kanban_derived_from_events:true,kanban_digest_bound:true,executor_state_visible:true,missing_timestamps_never_inferred:true,kanban_observability_only:true,metrics_observability_only:true,projection_defects_nonblocking:true},
      content_contract:{story_count:6,allocation:'2/2/2',agent_skills_story_count:1,videos:2,podcasts:2,podcast_source_diversity:true,watchlist_refresh:true,professional_series_books_considered:4,professional_story_images:6},
      publication:{protected_ci:true,exact_sha_deploy:true,independent_live_verification:true,success_state:'PUBLIC_CLOSED',cleanup_after_terminal:true,candidate_write_freeze:true,generic_task29_closeout:true},
      cost_boundary:{chatgpt_work:false,codex:false,paid_apis:false,billable_overage:false,new_credentials:false},
      inheritance:{controller_matches_latest_success:true,supervisor_matches_latest_success_or_current_baseline:true,image_path_matches_latest_success:true,publication_path_matches_latest_success:true,all_permanent_fixes_present:true,unexplained_regressions_absent:true}
    };
    const file=path.join(dir,'input.json');fs.writeFileSync(file,JSON.stringify(base));
    fs.mkdirSync(path.join(dir,'docs/operations'),{recursive:true});
    fs.writeFileSync(path.join(dir,'docs/operations/unattended-image-host.json'),JSON.stringify({host_id:null,status:'CAPABILITY_BLOCKED'}));
    const r=spawnSync(process.execPath,[new URL('../../_tools/run-readiness.mjs',import.meta.url).pathname,'validate','--input',file],{encoding:'utf8',cwd:dir});
    const result=JSON.parse(r.stdout);
    assert.equal(r.status,0);
    assert.equal(result.result,'PASS');
    assert.equal(result.start_authorized,true);
    assert.equal(result.start_scope,'non_image_production');
    assert.equal(result.image_tasks_authorized,false);
    assert.equal(result.publication_authorized,false);
    assert.ok(result.deferred_blockers.includes('image_host:NO_SUPPORTED_UNATTENDED_NATIVE_IMAGE_HOST'));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('purported live qualification must recover real execution receipts and exact files',()=>{
  const report={schema_version:'unattended-image-qualification-v1',host_id:'test',evidence_type:'live',trigger:'scheduled',execution_mode:'qualification_nonproduction',workflow_run_id:1,commit_sha:sha,owner_interventions:[],images:Array.from({length:6},(_,i)=>({execution_path:'_records/'+i+'.json',receipt_path:'_records/'+i+'-receipt.json'})),recovery:{generation_calls:0,raw_files:6,final_files:6}};
  let reads=0;const r=verifyUnattendedImageQualification(report,{hostId:'test',readCommitted:()=>{reads++;throw Error('missing_committed_bytes');}});
  assert.equal(reads,6);assert.equal(r.result,'BLOCKED');assert.ok(r.errors.includes('missing_committed_bytes'));
});
