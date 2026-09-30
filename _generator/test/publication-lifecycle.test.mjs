import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {newPublicationLifecycle,transitionPublicationLifecycle,validateCompletionIntegrity,deriveCurrentEdition,derivePublicationStatus,evaluateContinuity,validateCurrentProjection,lifecyclePath,completionPath} from '../lib/publication-lifecycle.mjs';

const sha='a'.repeat(40),candidate='b'.repeat(40);
function completedLifecycle(){
 let s=newPublicationLifecycle({editionDate:'2026-09-25',runId:'kernel-1',baselineSha:'c'.repeat(40),createdAt:'2026-09-25T12:00:00Z'});
 for(const stage of ['PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED'])s=transitionPublicationLifecycle(s,stage,{at:'2026-09-25T12:01:00Z',evidence:stage==='LIVE_VERIFIED'?{final_result:'pass',homepage_edition_date:'2026-09-25'}:{proof:stage},patch:stage==='CANDIDATE_READY'?{candidate_sha:candidate}:stage==='PR_OPEN'?{publication_pr_number:217}:stage==='CI_PASS'?{ci_run_id:1}:stage==='MERGED'?{publication_merge_sha:sha,production_sha:sha}:stage==='PAGES_DEPLOYED'?{production_sha:sha,deployed_sha:sha,pages_deployment_id:2}:stage==='LIVE_VERIFIED'?{production_sha:sha,deployed_sha:sha}:{}});
 const completion={schema_version:'2.0.0',phase:'live_verified',edition_id:s.edition_id,run_id:s.run_id,production_sha:sha,deployed_sha:sha,live_verified_at:'2026-09-25T12:02:00Z',pages:{run_id:2,conclusion:'success',deployed_sha:sha},live_verification:{final_result:'pass',homepage_edition_date:'2026-09-25',route_count:16}};
 s=transitionPublicationLifecycle(s,'COMPLETED',{at:'2026-09-25T12:03:00Z',evidence:{completion:'validated'},patch:{completion_record:completionPath('2026-09-25')}});
 return {s,completion};
}

test('illegal lifecycle transitions fail closed',()=>{const s=newPublicationLifecycle({editionDate:'2026-09-25',runId:'x',baselineSha:sha});assert.throws(()=>transitionPublicationLifecycle(s,'MERGED',{evidence:{x:1}}),/illegal_lifecycle_transition/);});
test('production/deployed SHA mismatch blocks completion integrity',()=>{const {s,completion}=completedLifecycle();const bad={...completion,deployed_sha:'d'.repeat(40)};assert.ok(validateCompletionIntegrity(s,bad).includes('completion_production_deployed_sha_mismatch'));});
test('wrong completion edition fails',()=>{const {s,completion}=completedLifecycle();assert.ok(validateCompletionIntegrity(s,{...completion,edition_id:'dab-edition-2026-09-24'}).includes('completion_edition_mismatch'));});
test('incorrect live homepage edition blocks completion',()=>{const {s,completion}=completedLifecycle();const errors=validateCompletionIntegrity(s,{...completion,live_verification:{...completion.live_verification,homepage_edition_date:'2026-09-23'}});assert.ok(errors.includes('live_reader_verification_required'));});
test('valid live-verified completion derives current edition',()=>{const {s,completion}=completedLifecycle();const current=deriveCurrentEdition(s,completion);assert.equal(current.brief_date,'2026-09-25');assert.equal(current.production_sha,sha);});
test('missing completion prevents current-edition validity',()=>{const {s}=completedLifecycle();const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-lifecycle-'));try{fs.mkdirSync(path.join(root,path.dirname(lifecyclePath('2026-09-25'))),{recursive:true});fs.mkdirSync(path.join(root,'data/operations'),{recursive:true});fs.writeFileSync(path.join(root,lifecyclePath('2026-09-25')),JSON.stringify(s));fs.writeFileSync(path.join(root,'data/operations/current-edition.json'),JSON.stringify({schema_version:'2.0.0',edition_id:s.edition_id,brief_date:s.edition_date,lifecycle_path:lifecyclePath(s.edition_date),completion_path:completionPath(s.edition_date),production_sha:sha,deployed_sha:sha}));assert.ok(validateCurrentProjection(root).includes('current_edition_completion_missing'));}finally{fs.rmSync(root,{recursive:true,force:true});}});
test('current-edition projection is valid only with matching completion and lifecycle',()=>{const {s,completion}=completedLifecycle();const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-lifecycle-'));try{fs.mkdirSync(path.join(root,path.dirname(lifecyclePath('2026-09-25'))),{recursive:true});fs.mkdirSync(path.join(root,'data/operations'),{recursive:true});fs.writeFileSync(path.join(root,lifecyclePath('2026-09-25')),JSON.stringify(s));fs.writeFileSync(path.join(root,completionPath('2026-09-25')),JSON.stringify(completion));fs.writeFileSync(path.join(root,'data/operations/current-edition.json'),JSON.stringify(deriveCurrentEdition(s,completion)));assert.deepEqual(validateCurrentProjection(root),[]);}finally{fs.rmSync(root,{recursive:true,force:true});}});
test('incomplete previous publishing date is explicit',()=>{assert.equal(evaluateContinuity({previousDate:'2026-09-24',previousLifecycle:null}).result,'fail');});
test('failed previous date is a durable terminal outcome',()=>{let s=newPublicationLifecycle({editionDate:'2026-09-24',runId:'x',baselineSha:null,migration:true});s=transitionPublicationLifecycle(s,'FAILED',{evidence:{error:'no_canonical_edition'},patch:{last_error:'no_canonical_edition'}});assert.equal(evaluateContinuity({previousDate:'2026-09-24',previousLifecycle:s}).result,'pass');});
test('publication status exposes next legal action',()=>{const {s,completion}=completedLifecycle();const status=derivePublicationStatus(s,{completion,currentEdition:deriveCurrentEdition(s,completion)});assert.equal(status.lifecycle_stage,'COMPLETED');assert.equal(status.next_legal_recovery_action,'Synchronize Command Center from canonical status.');});


function lifecycleThrough(target){
 let s=newPublicationLifecycle({editionDate:'2026-09-25',runId:'kernel-stage',baselineSha:'c'.repeat(40),createdAt:'2026-09-25T12:00:00Z'});
 const stages=['PREFLIGHT_READY','EDITORIAL_READY','CANDIDATE_READY','PR_OPEN','CI_PASS','MERGED','PAGES_DEPLOYED','LIVE_VERIFIED'];
 for(const stage of stages){
  if(stages.indexOf(stage)>stages.indexOf(target)&&target!=='COMPLETED')break;
  s=transitionPublicationLifecycle(s,stage,{at:'2026-09-25T12:01:00Z',evidence:stage==='LIVE_VERIFIED'?{final_result:'pass',homepage_edition_date:'2026-09-25'}:{proof:stage},patch:stage==='CANDIDATE_READY'?{candidate_sha:candidate}:stage==='PR_OPEN'?{publication_pr_number:217}:stage==='CI_PASS'?{ci_run_id:1}:stage==='MERGED'?{publication_merge_sha:sha,production_sha:sha}:stage==='PAGES_DEPLOYED'?{production_sha:sha,deployed_sha:sha,pages_deployment_id:2}:stage==='LIVE_VERIFIED'?{production_sha:sha,deployed_sha:sha}:{}});
  if(stage===target)return s;
 }
 return s;
}

test('merged with Pages pending remains a deployment state',()=>{
 const s=lifecycleThrough('MERGED');
 const status=derivePublicationStatus(s);
 assert.equal(status.lifecycle_state,'MERGED');
 assert.equal(status.pages.state,'pending');
 assert.notEqual(status.lifecycle_state,'COMPLETED');
});

test('Pages deployed without live verification is DEPLOYING, never completed',()=>{
 const s=lifecycleThrough('PAGES_DEPLOYED');
 const status=derivePublicationStatus(s);
 assert.equal(status.lifecycle_state,'DEPLOYING');
 assert.equal(status.live_reader.state,'pending');
 assert.notEqual(status.completion.state,'verified');
});

test('live verified without completion receipt is LIVE_VERIFIED, never completed',()=>{
 const s=lifecycleThrough('LIVE_VERIFIED');
 const status=derivePublicationStatus(s);
 assert.equal(status.lifecycle_state,'LIVE_VERIFIED');
 assert.equal(status.completion.state,'pending');
 assert.notEqual(status.lifecycle_state,'COMPLETED');
});

test('contradictory current-edition evidence fails closed to BLOCKED',()=>{
 const {s,completion}=completedLifecycle();
 const current={...deriveCurrentEdition(s,completion),brief_date:'2026-09-24'};
 const status=derivePublicationStatus(s,{completion,currentEdition:current});
 assert.equal(status.lifecycle_state,'BLOCKED');
 assert.equal(status.consistency.state,'blocked');
 assert.ok(status.consistency.errors.includes('current_edition_projection_mismatch'));
 assert.equal(status.operator_intervention_required,true);
});

test('completed status exposes preserved work and decision-quality recovery fields',()=>{
 const {s,completion}=completedLifecycle(),current=deriveCurrentEdition(s,completion);
 const status=derivePublicationStatus(s,{completion,currentEdition:current});
 assert.equal(status.schema_version,'2.0.0');
 assert.equal(status.lifecycle_state,'COMPLETED');
 assert.equal(status.last_successful_stage,'COMPLETED');
 assert.ok(status.preserved_completed_work.includes('LIVE_VERIFIED'));
 assert.equal(status.next_automatic_recovery_step,'Synchronize Command Center from canonical status.');
 assert.equal(status.production_sha,sha);
 assert.equal(status.deployed_sha,sha);
 assert.equal(status.live_reader.state,'verified');
 assert.equal(status.command_center.state,'pending');
});

test('CC_SYNCED requires exact canonical sync evidence and becomes explicit operator state',()=>{
 const {s,completion}=completedLifecycle(),current=deriveCurrentEdition(s,completion);
 assert.throws(()=>transitionPublicationLifecycle(s,'CC_SYNCED',{evidence:{result:'pass'}}),/cc_synced_requires_exact_canonical_status_evidence/);
 const proof={result:'pass',source_edition:s.edition_date,source_production_sha:s.production_sha,source_deployed_sha:s.deployed_sha,source_status_sha256:'sha256:'+'f'.repeat(64)};
 const synced=transitionPublicationLifecycle(s,'CC_SYNCED',{at:'2026-09-25T12:04:00Z',evidence:proof});
 const status=derivePublicationStatus(synced,{completion,currentEdition:current});
 assert.equal(status.lifecycle_state,'CC_SYNCED');
 assert.equal(status.command_center.state,'complete');
 assert.equal(status.command_center.result,'pass');
 assert.equal(status.command_center.stale,false);
 assert.equal(status.next_automatic_recovery_step,null);
});
