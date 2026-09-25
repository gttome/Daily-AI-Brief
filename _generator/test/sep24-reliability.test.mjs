import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {newRunState,markRunStage,invalidateRunState,resolveResumeStage,resolveResumeStageFromRepository,deriveOperationalStatus,validateHandoffCheckpoint,RECOVERY_MATRIX,acceptedImageReusable,mediaReceiptReusable} from '../lib/run-state.mjs';
import {publicWatchlist,watchlistDailySummary} from '../lib/watchlist.mjs';
import {expectedWatchlistSurface} from '../lib/publication-candidate-lint.mjs';
import {sha256} from '../lib/util.mjs';

const baseline='a'.repeat(40);
test('run-state transitions are durable and resume at first incomplete stage',()=>{
 let s=newRunState({date:'2026-09-24',baselineSha:baseline});
 assert.equal(resolveResumeStage({state:s}),'PREFLIGHT_METADATA_READY');
 s=markRunStage(s,'PREFLIGHT_METADATA_READY',{artifactPaths:['metadata.json']});
 s=markRunStage(s,'PREFLIGHT_DISCOVERY_READY',{artifactPaths:['discovery.json']});
 assert.equal(resolveResumeStage({state:s}),'READINESS_PRELIMINARY');
 assert.equal(deriveOperationalStatus(resolveResumeStage({state:s})),'PREPARING');
});
test('completed upstream stages are not rerun and invalidation is downstream only',()=>{
 let s=newRunState({date:'2026-09-24',baselineSha:baseline});
 for(const stage of ['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL','EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY'])s=markRunStage(s,stage,{artifactPaths:[stage+'.json']});
 const before=structuredClone(s.stages.PREFLIGHT_METADATA_READY);
 s=invalidateRunState(s,'IMAGES_READY',{reason:'one_bad_image'});
 assert.deepEqual(s.stages.PREFLIGHT_METADATA_READY,before);
 assert.equal(resolveResumeStage({state:s}),'IMAGES_READY');
});
test('targeted recovery matrix confines representative failures',()=>{
 assert.equal(RECOVERY_MATRIX.image,'IMAGES_READY');assert.equal(RECOVERY_MATRIX.media_slot,'MEDIA_READY');assert.equal(RECOVERY_MATRIX.pages,'PAGES_VERIFIED');
 assert.equal(RECOVERY_MATRIX.completion,'COMPLETION_PERSISTED');assert.equal(RECOVERY_MATRIX.command_center_sync,'COMMAND_CENTER_RECONCILED');
});
test('handoff branch existence without advancement and missing artifacts fail',()=>{
 const manifest={staging_ref:'editorial-handoff/production/2026-09-24',kernel_path:'kernel',facts_path:'facts',media_path:'media',images_path:'images'};
 const exists=p=>p!=='media';
 let errors=validateHandoffCheckpoint({baselineSha:baseline,branchHeadSha:baseline,parentSha:baseline,actualStagingRef:manifest.staging_ref,manifest,requiredFileExists:exists,imageEntries:[]});
 assert.ok(errors.includes('handoff_branch_must_advance_from_main'));assert.ok(errors.some(x=>x.includes('missing_handoff_artifact:media')));
});
test('handoff parent and PR head SHA are bound to trusted commits',()=>{
 const manifest={staging_ref:'editorial-handoff/production/2026-09-24',kernel_path:'kernel',facts_path:'facts',media_path:'media',images_path:'images'};
 const images=Array.from({length:6},(_,i)=>({path:'i'+i,accepted_locked:true,lock_status:'accepted_locked'}));
 const errors=validateHandoffCheckpoint({baselineSha:baseline,branchHeadSha:'b'.repeat(40),parentSha:'c'.repeat(40),actualStagingRef:manifest.staging_ref,manifest,requiredFileExists:()=>true,imageEntries:images,candidateHeadSha:'d'.repeat(40),prHeadSha:'e'.repeat(40)});
 assert.ok(errors.includes('handoff_commit_parent_must_equal_trusted_main'));assert.ok(errors.includes('pr_head_sha_must_equal_committed_candidate_sha'));
});
test('public Watchlist is generated-only and September 23 research_score drift is caught',()=>{
 const canonical=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8')),generated=publicWatchlist(canonical),drift=structuredClone(generated);
 drift.topics[0].research_score=(drift.topics[0].research_score||0)+1;
 assert.notDeepEqual(drift,generated);assert.deepEqual(publicWatchlist(canonical),generated);
});
test('September 23 Watchlist fixture remains 0 new, 3 updated, 13 carried forward',()=>{
 const canonical=JSON.parse(fs.readFileSync('_records/watchlist/2026-09-23-canonical-fixture.json','utf8'));
 assert.equal(canonical.edition_date,'2026-09-23');
 assert.deepEqual(watchlistDailySummary(canonical),{new_today:0,updated_today:3,carried_forward:13});
 const surface=expectedWatchlistSurface(canonical);assert.equal(surface.changed_topics.length,3);
});
test('September 23 accepted WebP bytes remain locked and distinct',()=>{
 const manifest=JSON.parse(fs.readFileSync('_records/editorial-handoff/final-image-review-2026-09-23.json','utf8')),hashes=new Set();
 for(const item of Object.values(manifest)){assert.equal(item.accepted_locked,true);assert.equal(item.lock_status,'accepted_locked');assert.equal(item.format,'webp');const bytes=fs.readFileSync(item.path);assert.equal(sha256(bytes),item.sha256);hashes.add(item.sha256);}
 assert.equal(hashes.size,6);
});
test('historical PNG compatibility remains supported',()=>{
 const manifest=JSON.parse(fs.readFileSync('_records/editorial-handoff/final-image-review-2026-09-22.json','utf8'));
 assert.ok(Object.values(manifest).some(x=>String(x.path).endsWith('.png')));
});
test('lifecycle closes only after delta validation and command-center reconciliation',()=>{
 let s=newRunState({date:'2026-09-24',baselineSha:baseline});
 const order=['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL','EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','DETERMINISTIC_EXPANSION_READY','PR_CREATED','PROTECTED_CI_PASS','MERGED','PAGES_VERIFIED','COMPLETION_PERSISTED'];
 for(const stage of order)s=markRunStage(s,stage,{artifactPaths:[stage+'.json']});
 assert.notEqual(s.publication_lifecycle,'closed');assert.equal(resolveResumeStage({state:s}),'DELTA_VALIDATED');
 s=markRunStage(s,'DELTA_VALIDATED',{artifactPaths:['delta.json']});assert.equal(resolveResumeStage({state:s}),'COMMAND_CENTER_RECONCILED');
 s=markRunStage(s,'COMMAND_CENTER_RECONCILED',{artifactPaths:['cc.json']});assert.equal(resolveResumeStage({state:s}),'CLOSED');
 s=markRunStage(s,'CLOSED',{artifactPaths:['completion.json']});assert.equal(s.publication_lifecycle,'closed');assert.equal(s.operational_status,'COMPLETE');
});

test('automatic completion persistence is protected and effective only for Sep24+',()=>{
 const workflow=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');
 assert.match(workflow,/2026-09-24/);
 assert.match(workflow,/finalization\/\$EDITION_DATE/);
 assert.match(workflow,/createWorkflowDispatch/);
 assert.match(workflow,/workflow_id:'ci\.yml'/);
 assert.match(workflow,/pulls\.merge/);
 assert.match(workflow,/completion_persistence='protected_pull_request'/);
});
test('runtime contract exposes one durable recovery and status vocabulary',()=>{
 const runtime=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
 assert.equal(runtime.reliability_hardening.run_state_path_pattern,'_records/run-state/YYYY-MM-DD.json');
 assert.equal(runtime.reliability_hardening.pre_pr_lint,'node _tools/publication-candidate-lint.mjs');
 assert.ok(runtime.reliability_hardening.operational_status_vocabulary.includes('COMPLETE'));
 assert.ok(runtime.reliability_hardening.publication_lifecycle.includes('closed'));
});

test('accepted image and media checkpoints are reused across deterministic downstream failure',()=>{
 const image={sha256:'1'.repeat(64),accepted_locked:true,lock_status:'accepted_locked',locked:true};
 assert.equal(acceptedImageReusable(image,{observedSha256:image.sha256}),true);
 assert.equal(acceptedImageReusable(image,{observedSha256:image.sha256,storyChanged:true}),false);
 const kernel='2'.repeat(64),receipt={editorial_kernel_sha256:kernel,podcast_source_diversity:{pass:true},items:[
  {kind:'video',verification_evidence:'date/runtime',verification_timestamp:'2026-09-24T12:00:00Z'},
  {kind:'video',verification_evidence:'date/runtime',verification_timestamp:'2026-09-24T12:00:00Z'},
  {kind:'podcast',verification_evidence:'date/source',verification_timestamp:'2026-09-24T12:00:00Z'},
  {kind:'podcast',verification_evidence:'date/source',verification_timestamp:'2026-09-24T12:00:00Z'}]};
 assert.equal(mediaReceiptReusable(receipt,kernel),true);assert.equal(mediaReceiptReusable(receipt,'3'.repeat(64)),false);
 let s=newRunState({date:'2026-09-24',baselineSha:baseline});
 for(const stage of ['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL','EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','PR_CREATED','DETERMINISTIC_EXPANSION_READY','PROTECTED_CI_PASS'])s=markRunStage(s,stage,{artifactPaths:[stage+'.json']});
 s=invalidateRunState(s,'PROTECTED_CI_PASS',{reason:'deterministic_ci_failure'});
 assert.equal(s.stages.MEDIA_READY.status,'pass');assert.equal(s.stages.IMAGES_READY.status,'pass');
});
test('same-edition Watchlist counts and changed-topic names match all three current reader surfaces',()=>{
 const canonical=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8')),surface=expectedWatchlistSurface(canonical);
 const countText=surface.counts.new_today+' new today · '+surface.counts.updated_today+' updated · '+surface.counts.carried_forward+' carried forward.';
 for(const p of ['index.md','latest.md',`briefs/${canonical.edition_date}.md`]){const body=fs.readFileSync(p,'utf8');assert.ok(body.includes(countText));for(const t of surface.changed_topics)assert.ok(body.includes(t.name));}
});
test('current edition retains all hard counts and Agent Skills identity',()=>{
 const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-23.json','utf8')),kernel=JSON.parse(fs.readFileSync('_records/editorial-handoff/kernel.json','utf8')),media=JSON.parse(fs.readFileSync('_records/editorial-handoff/media.json','utf8')),images=JSON.parse(fs.readFileSync('_records/editorial-handoff/final-image-review-2026-09-23.json','utf8')),runtime=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
 assert.equal(edition.stories.length,6);assert.deepEqual(edition.stories.map(x=>x.focus),['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people']);
 assert.equal(kernel.stories.filter(x=>x.agent_skill===true).length,1);assert.equal(runtime.output.display_focus_labels.agents_non_technical_people,'Agents for Everyone');
 assert.equal(Object.values(images).length,6);assert.equal(Object.values(media.worth_watching).filter(x=>['included','selected'].includes(x.status)).length,2);assert.equal(media.podcasts.filter(x=>['included','selected'].includes(x.status)).length,2);
});
test('completion-finalization retry reuses the same production-SHA-scoped branch',()=>{
 const workflow=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');
 assert.ok(workflow.includes('finalization/$EDITION_DATE-${EXPECTED_SHA:0:8}'));
 assert.match(workflow,/Reusing durable finalization branch/);
 assert.match(workflow,/git ls-remote --exit-code --heads/);
});

test('repository-aware resume rejects a completed stage whose durable artifact is missing',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-resume-'));
 try{
  let s=newRunState({date:'2026-09-24',baselineSha:baseline});
  s=markRunStage(s,'PREFLIGHT_METADATA_READY',{artifactPaths:['metadata.json']});
  assert.equal(resolveResumeStage({state:s}),'PREFLIGHT_DISCOVERY_READY');
  assert.equal(resolveResumeStageFromRepository(root,s),'PREFLIGHT_METADATA_READY');
  fs.writeFileSync(path.join(root,'metadata.json'),'{}\n');
  assert.equal(resolveResumeStageFromRepository(root,s),'PREFLIGHT_DISCOVERY_READY');
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('baseline or contract drift invalidates the cursor from metadata preflight',()=>{
 let s=newRunState({date:'2026-09-24',baselineSha:baseline,contractVersion:'v1'});
 s=markRunStage(s,'PREFLIGHT_METADATA_READY',{artifactPaths:['metadata.json']});
 assert.equal(resolveResumeStage({state:s,baselineSha:'b'.repeat(40)}),'PREFLIGHT_METADATA_READY');
 assert.equal(resolveResumeStage({state:s,contractVersion:'v2'}),'PREFLIGHT_METADATA_READY');
});
test('scheduled preflights require durable receipt validity rather than branch existence',()=>{
 const metadata=fs.readFileSync('.github/workflows/under80-metadata-preflight.yml','utf8');
 const discovery=fs.readFileSync('.github/workflows/under80-discovery-preflight.yml','utf8');
 assert.match(metadata,/valid durable receipt/);
 assert.match(metadata,/incomplete or invalid; rebuilding only metadata preflight/);
 assert.match(metadata,/run-state\.mjs checkpoint[\s\S]*PREFLIGHT_METADATA_READY/);
 assert.match(discovery,/valid durable receipt/);
 assert.match(discovery,/incomplete or invalid; rebuilding only discovery preflight/);
 assert.match(discovery,/Push-trigger duplicate suppressed/);
 assert.match(discovery,/PREFLIGHT_METADATA_READY/);
 assert.match(discovery,/PREFLIGHT_DISCOVERY_READY/);
 assert.match(discovery,/_records\/run-state\/\$date\.json/);
});
