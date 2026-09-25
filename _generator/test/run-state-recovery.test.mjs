import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
 RUN_STAGES,newRunState,checkpointRunStage,resolveResumeStageFromRepository,recoveryDecision,applyRecoveryDecision,
 consequentialActionDecision,recordConsequentialAction,acceptedImageReusable,CHECKPOINT_DIGEST_VERSION
} from '../lib/run-state.mjs';

const baseline='a'.repeat(40);
const stages=[
 'PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL','EDITORIAL_KERNEL_READY',
 'MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','DETERMINISTIC_EXPANSION_READY','PR_CREATED','PROTECTED_CI_PASS','MERGED',
 'PAGES_VERIFIED','COMPLETION_PERSISTED','DELTA_VALIDATED','COMMAND_CENTER_RECONCILED'
];
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-recovery-'));
 let state=newRunState({date:'2026-09-26',baselineSha:baseline,contractVersion:'under80-v1/sep24-reliability-v1'});
 const files={};
 for(const [index,stage] of stages.entries()){
  const relative='evidence/'+String(index+1).padStart(2,'0')+'-'+stage+'.json';files[stage]=relative;
  fs.mkdirSync(path.join(root,'evidence'),{recursive:true});fs.writeFileSync(path.join(root,relative),JSON.stringify({stage,version:1})+'\n');
  state=checkpointRunStage(root,state,stage,{currentSha:String(index+1).padStart(40,'0').slice(-40),artifactPaths:[relative]});
 }
 return {root,state,files};
}
function cleanup(root){fs.rmSync(root,{recursive:true,force:true});}

test('deterministic expansion is ordered before PR creation',()=>{
 assert.ok(RUN_STAGES.indexOf('DETERMINISTIC_EXPANSION_READY')<RUN_STAGES.indexOf('PR_CREATED'));
});

test('new checkpoints persist input, dependency and output digests',()=>{
 const {root,state}=fixture();try{
  const proof=state.stages.IMAGES_READY;
  assert.equal(proof.checkpoint_digest_version,CHECKPOINT_DIGEST_VERSION);
  assert.match(proof.input_digest,/^sha256:[a-f0-9]{64}$/);
  assert.match(proof.dependency_digest,/^sha256:[a-f0-9]{64}$/);
  assert.match(proof.output_digest,/^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(proof.dependency_paths,state.stages.MEDIA_READY.artifact_paths);
 }finally{cleanup(root);}
});

test('unchanged completed checkpoints resume only at the next missing stage',()=>{
 const {root,state}=fixture();try{assert.equal(resolveResumeStageFromRepository(root,state),'CLOSED');}finally{cleanup(root);}
});

test('failure injection finds the exact earliest invalid major stage and preserves upstream work',()=>{
 const injected=['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','DETERMINISTIC_EXPANSION_READY','PR_CREATED','PROTECTED_CI_PASS','MERGED','PAGES_VERIFIED','COMPLETION_PERSISTED','COMMAND_CENTER_RECONCILED'];
 for(const stage of injected){
  const {root,state,files}=fixture();
  try{
   fs.writeFileSync(path.join(root,files[stage]),JSON.stringify({stage,version:2})+'\n');
   const decision=recoveryDecision(root,state,{failureStage:stage,rootError:'injected_failure'});
   assert.equal(decision.earliest_invalid_stage,stage,stage);
   const index=RUN_STAGES.indexOf(stage);
   assert.ok(decision.preserved_stages.every(x=>RUN_STAGES.indexOf(x)<index),stage);
   assert.ok(decision.invalidated_stages.every(x=>RUN_STAGES.indexOf(x)>=index),stage);
  }finally{cleanup(root);}
 }
});

test('dependency mutation invalidates its producing stage before dependent stages',()=>{
 const {root,state,files}=fixture();try{
  fs.writeFileSync(path.join(root,files.MEDIA_READY),'{"changed":true}\n');
  const decision=recoveryDecision(root,state,{rootError:'media_changed'});
  assert.equal(decision.resume_stage,'MEDIA_READY');
  assert.ok(decision.preserved_stages.includes('EDITORIAL_KERNEL_READY'));
  assert.ok(decision.invalidated_stages.includes('IMAGES_READY'));
 }finally{cleanup(root);}
});

test('applying recovery deletes only the invalid stage and its downstream proofs',()=>{
 const {root,state,files}=fixture();try{
  fs.writeFileSync(path.join(root,files.IMAGES_READY),'{"changed":true}\n');
  const {state:recovered,decision}=applyRecoveryDecision(root,state,{rootError:'accepted_image_bytes_changed'});
  assert.equal(decision.resume_stage,'IMAGES_READY');
  assert.ok(recovered.stages.MEDIA_READY);
  assert.equal(recovered.stages.IMAGES_READY,undefined);
  assert.equal(recovered.stages.HANDOFF_COMMITTED,undefined);
  assert.ok(recovered.retry_count===1);
 }finally{cleanup(root);}
});

test('identical consequential action is reused rather than repeated',()=>{
 let state=newRunState({date:'2026-09-26',baselineSha:baseline});
 ({state}=recordConsequentialAction(state,{type:'publication_pr',key:'pr:221',evidence:{pr:221}}));
 const decision=consequentialActionDecision(state,{type:'publication_pr',key:'pr:221'});
 assert.equal(decision.allow,false);assert.equal(decision.reuse,true);
 const replay=recordConsequentialAction(state,{type:'publication_pr',key:'pr:221'});
 assert.equal(replay.reused,true);assert.equal(replay.state.consequential_actions.length,1);
});

test('conflicting consequential action is blocked',()=>{
 let state=newRunState({date:'2026-09-26',baselineSha:baseline});
 ({state}=recordConsequentialAction(state,{type:'completion',key:'sha:'+baseline}));
 const decision=consequentialActionDecision(state,{type:'completion',key:'sha:'+'b'.repeat(40)});
 assert.equal(decision.allow,false);assert.equal(decision.reuse,false);assert.equal(decision.reason,'conflicting_completed_action');
 assert.throws(()=>recordConsequentialAction(state,{type:'completion',key:'sha:'+'b'.repeat(40)}),/consequential_action_conflict/);
});

test('accepted locked SVG image is reusable without regeneration',()=>{
 const entry={path:'briefs/images/2026-09-25/story.svg',accepted_locked:true,lock_status:'accepted_locked',git_blob_sha:'abc123'};
 assert.equal(acceptedImageReusable(entry),true);
 assert.equal(acceptedImageReusable(entry,{storyChanged:true}),false);
});

test('recovery decision includes an explicit safe next action',()=>{
 const {root,state,files}=fixture();try{
  fs.writeFileSync(path.join(root,files.PAGES_VERIFIED),'{"changed":true}\n');
  const decision=recoveryDecision(root,state,{rootError:'pages_evidence_changed'});
  assert.equal(decision.resume_stage,'PAGES_VERIFIED');
  assert.match(decision.safe_next_action,/production SHA deployment/i);
 }finally{cleanup(root);}
});

test('post-editorial workflow reuses valid image and expansion checkpoints',()=>{
 const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
 assert.match(workflow,/Resolve durable recovery checkpoint/);
 assert.match(workflow,/reuse_images/);
 assert.match(workflow,/reuse_expansion/);
 assert.match(workflow,/Reuse accepted image checkpoint/);
 assert.match(workflow,/if: steps\.recovery\.outputs\.reuse_expansion != 'true'/);
 assert.match(workflow,/--images \"\$FINAL_IMAGE_REVIEW_PATH\"/);
 assert.doesNotMatch(workflow,/--images \"\$IMAGE_REVIEW_PATH\"/);
});

test('post-editorial retry suppresses duplicate PRs and records recovery evidence',()=>{
 const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
 assert.match(workflow,/state:'all',per_page:100/);
 assert.match(workflow,/duplicate PR creation suppressed/);
 assert.match(workflow,/Build recovery decision after failure/);
 assert.match(workflow,/\/tmp\/recovery-decision\.json/);
});
