import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {VISUAL_CRITERIA,visualReviewErrors,visualReviewAccepted} from '../lib/image-review-evidence.mjs';
const sha='a'.repeat(64);
const review=()=>({method:'saved_image_visual_inspection',reviewer_kind:'assistant_visual_inspection',reviewer_id:'test-reviewer',inspection_reference:'view_image:test',reviewed_at:'2026-10-02T05:00:00Z',asset_sha256:sha,criteria:Object.fromEntries(VISUAL_CRITERIA.map(k=>[k,{verdict:'pass',observation:'Fixture observation for '+k}]))});
test('renderer self-certification is insufficient',()=>{assert.ok(visualReviewErrors({editorial_quality:'PASS',saved_asset_reviewed:true},sha).length);assert.equal(visualReviewAccepted({editorial_quality:'PASS'},sha),false);});
test('saved review binds exact bytes and can reject visual quality',()=>{let r=review();assert.equal(visualReviewAccepted(r,sha),true);assert.equal(visualReviewAccepted(r,'b'.repeat(64)),false);r.criteria.contrast={verdict:'fail',observation:'Pale labels are unreadable at delivery size.'};assert.equal(visualReviewAccepted(r,sha),false);assert.deepEqual(visualReviewErrors(r,sha),[]);});
test('registered native worker queues all six image tasks without generating or declaring Done',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'image-worker-'));
 try{for(const task of ['11','12','13','14','15','16']){
 const req=path.join(root,'request.json');fs.writeFileSync(req,JSON.stringify({capability:'native_chatgpt',task_id:task,execution_id:'trial',writer_generation:1}));
 const args=['_tools/native-image-worker.py','--run-root',root,'--request',req,'--execution-key','trial','--execution-id','trial','--edition-id','trial','--writer-generation','1'];
 const result=JSON.parse(execFileSync('python3',args));assert.equal(result.status,'AWAITING_SCHEDULED_EXECUTOR');assert.equal(result.generation_started,false);assert.match(result.host_id,/^chatgpt-automation:/);
 assert.equal(fs.existsSync(path.join(root,'_records/edition-execution/events/trial/'+task+'-blocked-image-capability.json')),false);
 const before=fs.readFileSync(req,'utf8');const replay=JSON.parse(execFileSync('python3',args));assert.equal(replay.status,'AWAITING_SCHEDULED_EXECUTOR');assert.equal(fs.readFileSync(req,'utf8'),before);
 assert.equal(fs.existsSync(path.join(root,'_records/edition-execution/events/trial/'+task+'-done.json')),false);
 }assert.equal(fs.existsSync(path.join(root,'briefs')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
