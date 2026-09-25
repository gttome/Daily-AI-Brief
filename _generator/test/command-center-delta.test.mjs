import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCommandCenterParity,canonicalStatusDigest,commandCenterDeltaPacket} from '../lib/command-center-delta.mjs';

const sha='a'.repeat(40);
const canonical=()=>({
 schema_version:'2.0.0',projection_version:'publication-status-v2',edition_date:'2026-09-25',edition_id:'dab-edition-2026-09-25',
 lifecycle_stage:'COMPLETED',lifecycle_state:'COMPLETED',operator_state:'COMPLETED',status:'COMPLETED',terminal_outcome:'COMPLETED',
 current_blocker:null,earliest_failed_stage:null,last_successful_stage:'COMPLETED',preserved_completed_work:['PLANNED','PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED','COMPLETED'],
 next_automatic_recovery_step:'Synchronize Command Center from canonical status.',next_legal_recovery_action:'Synchronize Command Center from canonical status.',operator_intervention_required:null,
 baseline_sha:'b'.repeat(40),candidate_sha:'c'.repeat(40),production_sha:sha,publication_merge_sha:'d'.repeat(40),pr_number:217,ci_run_id:10,ci:{state:'passed',run_id:10},
 pages_deployment_id:11,deployed_sha:sha,pages:{state:'succeeded',run_id:11,deployed_sha:sha},live_verification_timestamp:'2026-09-25T16:28:00Z',live_reader:{state:'verified',verified_at:'2026-09-25T16:28:00Z'},
 completion_path:'_records/publication/2026-09-25/completion.json',completion:{state:'verified',path:'_records/publication/2026-09-25/completion.json'},
 command_center_sync:'pending',command_center:{state:'pending',result:'pending',last_synced_at:null,source_status_sha256:null,stale:null},
 last_authoritative_state_transition:{stage:'COMPLETED',at:'2026-09-25T16:28:00Z'},
 source_evidence:{lifecycle_path:'_records/publication/2026-09-25/lifecycle.json',completion_path:'_records/publication/2026-09-25/completion.json',current_edition_path:'data/operations/current-edition.json',run_state_path:'_records/run-state/2026-09-25.json'},
 consistency:{state:'pass',errors:[]},updated_at:'2026-09-25T16:28:00Z'
});

test('Command Center delta is canonical-status bound and excludes private or arbitrary fields',()=>{
 const status=canonical();
 const packet=commandCenterDeltaPacket({
  canonicalStatus:status,
  validation:{date:'2026-09-25',publication_sha:sha,final_result:'pass',model_calls:0,semantic_escalation_required:false,automatic_ai_recovery_runs:0,coverage:{articles:6,videos:2,podcasts:1,included_items:9},image_readiness:{expected:6,accepted_locked:6,integrity_passed:6,canonical_hosted:6,status:'pass'},domain_states:{publication:'verified'},private_reader_data:{ratings:[1]},checks:[{check_id:'routes',result:'pass',severity:'critical',evidence:'do not copy detailed evidence',owner_email:'private@example.com'}]},
  watchlist:{changed_topics:['topic-a'],carried_topics:['topic-b'],removed_topics:[],normal_semantic_input_topic_ids:['topic-a'],model_calls:0,private_reviews:{notes:'secret'}},
  policy:{profile_id:'under80-v1',daily_system_credit_target_lt:80,metadata_candidate_limit:20,normal_deep_review_limit:9,image:{quality_protected:true},secret:'never copy'},
  incidentHistory:{incident_id:'i1',edition_date:'2026-09-19',status:'resolved',summary:'Resolved.',hardening:[{pr:164,control:'Fail closed media'}],private_owner_note:'never copy'},
  generatedAt:'2026-09-25T19:45:00Z'
 });
 assert.equal(packet.schema_version,'2.0.0');
 assert.equal(packet.canonical_publication_status.edition_date,'2026-09-25');
 assert.equal(packet.canonical_publication_status.lifecycle_state,'COMPLETED');
 assert.equal(packet.canonical_publication_status.production_sha,sha);
 assert.equal(packet.synchronization.source_status_sha256,canonicalStatusDigest(status));
 assert.equal(packet.synchronization.result,'pending');
 assert.equal(packet.synchronization.mutation_permitted,false);
 assert.equal(packet.presentation.operational_status_source,'canonical_publication_status');
 assert.equal(packet.validation.final_result,'pass');
 assert.deepEqual(packet.validation.checks,[{check_id:'routes',result:'pass',severity:'critical'}]);
 assert.equal(packet.operating_policy.profile_id,'under80-v1');
 assert.equal(packet.privacy.private_reader_records_included,false);
 const text=JSON.stringify(packet);
 for(const forbidden of ['private@example.com','secret','private_reader_data','private_reviews','detailed evidence','private_owner_note'])assert.equal(text.includes(forbidden),false);
});

test('matching synchronized state proves exact repository to Command Center parity',()=>{
 const status=canonical(),digest=canonicalStatusDigest(status);
 const synchronized={source_status_sha256:digest,edition_date:status.edition_date,lifecycle_state:status.lifecycle_state,production_sha:sha,deployed_sha:sha,completion_state:'verified',live_reader_state:'verified',refresh_result:'pass'};
 const parity=assessCommandCenterParity(status,synchronized);
 assert.deepEqual(parity.mismatches,[]);
 assert.equal(parity.result,'pass');
 assert.equal(parity.stale,false);
});

test('stale synchronized copy is detected instead of displayed as current',()=>{
 const status=canonical(),digest=canonicalStatusDigest(status);
 const synchronized={source_status_sha256:digest,edition_date:'2026-09-24',lifecycle_state:'COMPLETED',production_sha:'e'.repeat(40),deployed_sha:'e'.repeat(40),completion_state:'verified',live_reader_state:'verified',refresh_result:'pass'};
 const parity=assessCommandCenterParity(status,synchronized);
 assert.equal(parity.result,'fail');
 assert.equal(parity.stale,true);
 assert.ok(parity.mismatches.includes('edition_date_mismatch'));
 assert.ok(parity.mismatches.includes('production_sha_mismatch'));
});

test('failed refresh remains a refresh failure and cannot relabel old state current',()=>{
 const status=canonical(),digest=canonicalStatusDigest(status);
 const synchronized={source_status_sha256:digest,edition_date:status.edition_date,lifecycle_state:status.lifecycle_state,production_sha:sha,deployed_sha:sha,completion_state:'verified',live_reader_state:'verified',refresh_result:'failure'};
 const parity=assessCommandCenterParity(status,synchronized);
 assert.equal(parity.result,'fail');
 assert.ok(parity.mismatches.includes('refresh_failed'));
});

test('Command Center handoff fails closed without canonical status',()=>{
 assert.throws(()=>commandCenterDeltaPacket({policy:{}}),/canonical_publication_status_v2_required/);
});
