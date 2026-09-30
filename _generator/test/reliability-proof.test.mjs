import assert from 'node:assert/strict';
import test from 'node:test';
import {buildWave5EditionProof,summarizeWave5Proof,assessWave5RecoveryQualification,WAVE5_FIRST_QUALIFYING_EDITION} from '../lib/reliability-proof.mjs';
import {acceptedImageReusable,consequentialActionDecision} from '../lib/run-state.mjs';
import {assessCommandCenterParity} from '../lib/command-center-delta.mjs';

const sha='a'.repeat(40),candidate='b'.repeat(40),merge='c'.repeat(40);
const historyStages=['PLANNED','PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED','CC_SYNCED'];
function lifecycle(date='2026-09-26'){
 return {
  schema_version:'1.0.0',lifecycle_version:'publication-lifecycle-v1',edition_date:date,edition_id:'dab-edition-'+date,run_id:'run-'+date,
  baseline_sha:'d'.repeat(40),candidate_sha:candidate,publication_merge_sha:merge,production_sha:sha,deployed_sha:sha,publication_pr_number:225,repair_pr_numbers:[],
  ci_run_id:101,pages_deployment_id:202,stage:'CC_SYNCED',status:'COMPLETED',terminal_outcome:'COMPLETED',completion_record:'_records/publication/'+date+'/completion.json',
  command_center_sync:'complete',retry_count:0,last_error:null,blocker:null,next_legal_action:null,created_at:date+'T12:00:00Z',updated_at:date+'T13:00:00Z',migration:false,
  history:historyStages.map((stage,index)=>({stage,at:date+'T'+String(12+Math.min(index,9)).padStart(2,'0')+':00:00Z',evidence:stage==='CC_SYNCED'?{result:'pass',source_edition:date,source_production_sha:sha,source_deployed_sha:sha,source_status_sha256:'sha256:'+'e'.repeat(64)}:{kind:'test'}}))
 };
}
function completion(date='2026-09-26'){
 return {schema_version:'2.0.0',run_id:'run-'+date,phase:'live_verified',edition_id:'dab-edition-'+date,production_sha:sha,deployed_sha:sha,pages:{run_id:202,conclusion:'success'},live_verified_at:date+'T13:00:00Z',live_verification:{final_result:'pass',homepage_edition_date:date,source_validation_run_id:303}};
}
function status(date='2026-09-26'){
 return {schema_version:'2.0.0',edition_date:date,production_sha:sha,deployed_sha:sha,completion:{state:'verified'},live_reader:{state:'verified'},command_center_sync:'complete',command_center:{state:'complete',result:'pass',stale:false},consistency:{state:'pass'}};
}
function runState(date='2026-09-26'){
 return {schema_version:'1.1.0',edition_date:date,retry_count:0,workflow_run_ids:['404'],consequential_actions:[{type:'publication_pr',scope:'edition',status:'completed',key:'pr:225'}]};
}
function quality(date='2026-09-26'){
 const image=index=>({story_id:'s'+index,asset_path:'briefs/images/'+date+'/'+index+'.svg',structural_gate:{result:'pass'},editorial_quality_gate:{result:'pass',generic_or_sparse:false,decorative_only:false},overall_gate:'pass'});
 return {schema_version:'2.0.0',record_kind:'editorial_image_quality',edition_date:date,review_status:'complete',images:[1,2,3,4,5,6].map(image),set_review:{result:'pass'}};
}
function cleanProof(date='2026-09-26'){
 return buildWave5EditionProof({editionDate:date,productionMainSha:sha,lifecycle:lifecycle(date),completion:completion(date),status:status(date),runState:runState(date),imageQualityEvidence:quality(date),recordedAt:date+'T14:00:00Z'});
}

test('clean post-Iteration-4 production evidence qualifies only when every KPI is proven',()=>{
 const proof=cleanProof();
 assert.equal(proof.edition_date,WAVE5_FIRST_QUALIFYING_EDITION);
 assert.equal(proof.proof_qualifies,true);
 for(const key of ['manual_repository_repair','full_pipeline_restart','duplicate_publication_pr','live_reader_mismatch','missing_completion_record','command_center_parity_mismatch','valid_stage_reexecuted_unnecessarily','image_fallback_downgrade','unexplained_state_transition'])assert.equal(proof[key],false,key);
 assert.deepEqual(proof.disqualification_reasons,[]);
});

test('pending Command Center synchronization disqualifies rather than inferring parity',()=>{
 const life=lifecycle();life.stage='COMPLETED';life.command_center_sync='pending';life.history=life.history.filter(item=>item.stage!=='CC_SYNCED');
 const s=status();s.command_center_sync='pending';s.command_center={state:'pending',result:'pending',stale:null};
 const proof=buildWave5EditionProof({editionDate:'2026-09-26',productionMainSha:sha,lifecycle:life,completion:completion(),status:s,runState:runState(),imageQualityEvidence:quality()});
 assert.equal(proof.proof_qualifies,false);assert.equal(proof.command_center_parity_mismatch,'pending');
 assert.ok(proof.disqualification_reasons.includes('lifecycle_not_cc_synced'));
 assert.ok(proof.disqualification_reasons.includes('metric_unproven:command_center_parity_mismatch'));
});

test('manual repair and weak image evidence break the streak without rewriting history',()=>{
 const life=lifecycle();life.repair_pr_numbers=[999];
 const weak=quality();weak.images[0].editorial_quality_gate.result='fail';weak.images[0].overall_gate='fail';
 const proof=buildWave5EditionProof({editionDate:'2026-09-26',productionMainSha:sha,lifecycle:life,completion:completion(),status:status(),runState:runState(),imageQualityEvidence:weak});
 assert.equal(proof.manual_repository_repair,true);assert.equal(proof.image_fallback_downgrade,true);assert.equal(proof.proof_qualifies,false);
});

test('unproven retry semantics fail closed instead of assuming no unnecessary reexecution',()=>{
 const state=runState();state.retry_count=1;
 const proof=buildWave5EditionProof({editionDate:'2026-09-26',productionMainSha:sha,lifecycle:lifecycle(),completion:completion(),status:status(),runState:state,imageQualityEvidence:quality()});
 assert.equal(proof.full_pipeline_restart,'unavailable');assert.equal(proof.valid_stage_reexecuted_unnecessarily,'unavailable');assert.equal(proof.proof_qualifies,false);
});

test('summary counts only consecutive qualifying editions and gates cleanup at five',()=>{
 const records=[];
 for(let day=26;day<=30;day++)records.push(cleanProof('2026-09-'+day));
 let summary=summarizeWave5Proof(records,{recordedAt:'2026-09-30T14:00:00Z'});
 assert.equal(summary.current_consecutive_qualifying_editions,5);assert.equal(summary.cleanup_permitted,true);assert.equal(summary.stronger_target_met,false);
 const failed=cleanProof('2026-10-01');failed.proof_qualifies=false;failed.disqualification_reasons=['metric_failed:live_reader_mismatch'];records.push(failed);
 summary=summarizeWave5Proof(records,{recordedAt:'2026-10-01T14:00:00Z'});
 assert.equal(summary.current_consecutive_qualifying_editions,0);assert.equal(summary.maximum_consecutive_qualifying_editions,5);assert.equal(summary.cleanup_permitted,false);
});

test('bounded recovery qualification requires complete recovery, preservation and zero duplicate actions',()=>{
 const cases=[
  'completion_unavailable','deployed_sha_mismatch','command_center_sync_failure','frozen_artifact_changed','accepted_image_reuse','duplicate_pr_suppressed'
 ].map(name=>({name,recovery_success:true,preserved_valid_stages:true,duplicate_consequential_actions:0}));
 const result=assessWave5RecoveryQualification(cases,{recordedAt:'2026-09-25T21:00:00Z'});
 assert.equal(result.result,'pass');assert.equal(result.recovery_success_rate,1);assert.equal(result.preserved_valid_stage_rate,1);assert.equal(result.duplicate_consequential_actions,0);
 cases[0].duplicate_consequential_actions=1;assert.equal(assessWave5RecoveryQualification(cases).result,'fail');
});

test('existing recovery primitives prove image reuse and duplicate publication PR suppression',()=>{
 const image={accepted_locked:true,lock_status:'accepted_locked',git_blob_sha:'abc123'};
 assert.equal(acceptedImageReusable(image),true);
 const state={consequential_actions:[{type:'publication_pr',scope:'edition',status:'completed',key:'pr:225'}]};
 const decision=consequentialActionDecision(state,{type:'publication_pr',key:'pr:225'});
 assert.equal(decision.allow,false);assert.equal(decision.reuse,true);
});

test('Command Center failure injection is detected as a mismatch, not current state',()=>{
 const canonical={schema_version:'2.0.0',projection_version:'publication-status-v2',edition_date:'2026-09-26',edition_id:'dab-edition-2026-09-26',lifecycle_stage:'COMPLETED',lifecycle_state:'COMPLETED',operator_state:'COMPLETED',status:'COMPLETED',terminal_outcome:'COMPLETED',current_blocker:null,earliest_failed_stage:null,last_successful_stage:'COMPLETED',preserved_completed_work:[],next_automatic_recovery_step:null,next_legal_recovery_action:null,operator_intervention_required:null,baseline_sha:null,candidate_sha:candidate,production_sha:sha,publication_merge_sha:merge,pr_number:225,ci_run_id:101,ci:{state:'passed',run_id:101},pages_deployment_id:202,deployed_sha:sha,pages:{state:'succeeded',run_id:202,deployed_sha:sha},live_verification_timestamp:'2026-09-26T13:00:00Z',live_reader:{state:'verified',verified_at:'2026-09-26T13:00:00Z'},completion_path:'x',completion:{state:'verified',path:'x'},command_center_sync:'pending',command_center:{state:'pending',result:'pending',last_synced_at:null,source_status_sha256:null,stale:null},last_authoritative_state_transition:{stage:'COMPLETED',at:'2026-09-26T13:00:00Z'},source_evidence:{lifecycle_path:'l',completion_path:'c',current_edition_path:'e',run_state_path:'r'},consistency:{state:'pass',errors:[]},updated_at:'2026-09-26T13:00:00Z'};
 const sync={source_status_sha256:'wrong',edition_date:'2026-09-26',lifecycle_state:'COMPLETED',production_sha:sha,deployed_sha:sha,completion_state:'verified',live_reader_state:'verified',refresh_result:'failure'};
 const parity=assessCommandCenterParity(canonical,sync);assert.equal(parity.result,'fail');assert.ok(parity.mismatches.includes('refresh_failed'));
});
