import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const root=process.cwd(), q='_records/qualification/2026-09-28-Q24', base=q+'/image-execution-v2';
assert.equal(process.env.GITHUB_REF_NAME,'editorial-handoff/qualification/2026-09-28-Q24');
assert.ok(!fs.existsSync(q+'/result.json'),'Q24 terminal; stop');
const code=path.join(root,'.image-execution-code');
const {validateImageGenerationExecution,validateImageExecutionReceipt,imageExecutionHash}=await import(pathToFileURL(path.join(code,'_generator/lib/image-execution.mjs')));
const {inspectHandoffAsset}=await import(pathToFileURL(path.join(code,'_generator/lib/image-gate.mjs')));
const {buildNativeImageDelivery,assertNativeImageTaskPrompt,planNativeImageContinuation}=await import(pathToFileURL(path.join(code,'_generator/lib/native-image-delivery.mjs')));
const out='/tmp/q24-saved-image-readback';
const digest=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:20*1024*1024});
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function checkedPath(p){assert.equal(typeof p,'string');assert.ok(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>!s||s==='.'||s==='..'));assert.ok(!fs.lstatSync(p).isSymbolicLink());return p;}
function committedBytes(p){checkedPath(p);const bytes=git('show','HEAD:'+p);assert.ok(bytes.equals(fs.readFileSync(p)));assert.equal(blob(bytes),git('rev-parse','HEAD:'+p).toString().trim());return bytes;}
function save(p,value){const f=path.join(out,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
const prep=json(base+'/preparation.json');
assert.equal(prep.cutoff,'2026-09-28T20:04:36Z');
for(const r of prep.requests){const bytes=committedBytes(r.path);assert.equal(digest(bytes),r.file_sha256);const e=JSON.parse(bytes);assert.deepEqual(validateImageGenerationExecution(e),[]);assert.equal(imageExecutionHash(e),r.execution_sha256);}
const usage={work_invocations:0,codex_invocations:0,paid_model_api_calls:0};
const finals=[];
for(const name of fs.readdirSync(base+'/persistence').filter(n=>n.endsWith('-final-binding.json')).sort()){
 const b=json(base+'/persistence/'+name),a=json(base+'/attempts/'+b.candidate_id+'-attempt-'+b.attempt+'.json');
 assert.equal(b.qualification_id,'2026-09-28-Q24');assert.equal(a.preserved_cutoff,prep.cutoff);assert.deepEqual(a.owner_interventions,[]);
 assert.equal(a.candidate_id,b.candidate_id);assert.equal(a.attempt,b.attempt);assert.ok(a.generation_completed&&a.raw_capture_complete&&a.raw_git_read_back_verified);
 const req=json(b.request_path);assert.equal(imageExecutionHash(req),b.request_sha256);
 const reviewBytes=committedBytes(b.review_path),v=JSON.parse(reviewBytes);
 assert.equal(blob(reviewBytes),b.review_git_blob_sha);assert.equal(v.result,'pass');assert.equal(v.asset.sha256,b.sha256);assert.equal(v.asset.computed_git_blob_sha,b.git_blob_sha);
 assert.equal(v.reviewed_at,b.review_completed_at);assert.equal(v.candidate_id,b.candidate_id);assert.equal(v.attempt,b.attempt);assert.equal(v.request_binding.execution_sha256,b.request_sha256);
 for(const k of ['subject_match','factual_support','structural_quality','editorial_quality'])assert.equal(v[k],'pass');
 assert.equal(v.asset.bytes_match_previously_preserved_candidate,true);assert.deepEqual(v.owner_interventions,[]);
 assert.ok(b.path.startsWith('briefs/images/2026-09-28/'));assert.ok(b.raw_path.startsWith('_records/image-attempts/2026-09-28-Q24/'));
 const raw=committedBytes(b.raw_path),final=committedBytes(b.path);
 assert.equal(digest(raw),b.raw_sha256);assert.equal(blob(raw),b.raw_git_blob_sha);assert.equal(a.raw_sha256,b.raw_sha256);
 assert.equal(digest(final),b.sha256);assert.equal(blob(final),b.git_blob_sha);assert.equal(final.length,b.bytes);
 const inspection=inspectHandoffAsset(final,path.extname(b.path));assert.equal(inspection.pass,true);assert.equal(inspection.width,1200);assert.equal(inspection.height,630);
 const persisted=git('log','-1','--format=%cI','--',b.path).toString().trim();
 assert.ok(Date.parse(persisted)>=Date.parse(v.reviewed_at),'persistence precedes actual review');
 assert.ok(a.native_gen_id&&a.native_artifact_id&&a.embedded_creation_timestamp);
 const receipt={schema_version:'2.0.0',policy_id:'production-image-execution-v2',request_sha256:b.request_sha256,story_id:a.story_id,candidate_id:b.candidate_id,execution_mode:'qualification_nonproduction',evidence_type:'live',trigger:a.trigger,owner_interventions:[],runtime_context_isolation:'not_asserted',attempt:b.attempt,fallback_used:false,...usage,account_billing_observed:false,
 generation:{executor:'native_chatgpt_image_generation',call_id:a.native_gen_id,artifact_id:a.native_artifact_id,generated_at:a.embedded_creation_timestamp,generated_at_source:'Parsed embedded c2pa.created metadata; signature not independently verified. Actual native result identity is recorded in the generation/recovery event.',raw_sha256:b.raw_sha256,raw_capture:{path:b.raw_path,sha256:b.raw_sha256,git_blob_sha:b.raw_git_blob_sha,read_back_verified:true,original_verification:a.raw_capture},evidence_type:'live',usage,owner_interventions:[]},
 review:{mode:'automated',phase:'after_generation',call_id:'review-record:'+b.review_git_blob_sha,call_id_kind:'content-addressed durable review record; not a claimed provider opaque tool-call ID',review_record_path:b.review_path,review_record_sha256:digest(reviewBytes),review_record_git_blob_sha:b.review_git_blob_sha,render_artifact_id:v.review_evidence.candidate_render_file_id,trigger:v.review_trigger,reviewed_at:v.reviewed_at,asset_sha256:b.sha256,subject_match:v.subject_match,factual_support:v.factual_support,structural_quality:v.structural_quality,editorial_quality:v.editorial_quality,usage,owner_interventions:[],limitations:v.review_limitations},
 persistence:{path:b.path,sha256:b.sha256,git_blob_sha:b.git_blob_sha,persisted_at:persisted,commit_sha:git('log','-1','--format=%H','--',b.path).toString().trim(),read_back_verified:true,verification_commit:process.env.GITHUB_SHA,workflow_run_id:process.env.GITHUB_RUN_ID},status:'accepted_locked',scope:'One image execution receipt only; full six-image differentiation, assembled image gate, Q24 closure and unattended production remain unproven'};
 const errors=validateImageExecutionReceipt(receipt,req,{assetSha256:b.sha256,gitBlobSha:b.git_blob_sha});assert.deepEqual(errors,[]);
 const mutations=[r=>r.persistence.read_back_verified=false,r=>r.review.asset_sha256='0'.repeat(64),r=>r.generation.raw_capture.read_back_verified=false,r=>r.owner_interventions.push('manual'),r=>r.review.editorial_quality='fail'];
 for(const mutate of mutations){const bad=structuredClone(receipt);mutate(bad);assert.ok(validateImageExecutionReceipt(bad,req,{assetSha256:b.sha256,gitBlobSha:b.git_blob_sha}).length>0);}
 save('final-receipts/'+b.candidate_id+'.json',receipt);save(b.path,final);save(b.review_path,reviewBytes);save(b.request_path,fs.readFileSync(b.request_path));
 finals.push({candidate_id:b.candidate_id,attempt:b.attempt,path:b.path,sha256:b.sha256,git_blob_sha:b.git_blob_sha,bytes:final.length,width:1200,height:630,inspection,read_back_verified:true,receipt_errors:errors,negative_mutations_rejected:mutations.length,receipt_path:'final-receipts/'+b.candidate_id+'.json',receipt_sha256:digest(Buffer.from(JSON.stringify(receipt,null,2)+'\n'))});
}
assert.ok(finals.length>0&&finals.length<=6);
const order=prep.requests.map(r=>r.candidate_id),complete=new Set(finals.map(x=>x.candidate_id));
const next=order.find(id=>!complete.has(id));
let continuation=null;
if(next){
 const attempts=fs.readdirSync(base+'/attempts').filter(n=>n.startsWith(next+'-attempt-'));
 if(attempts.length===0){const item=prep.requests.find(x=>x.candidate_id===next),e=json(item.path),plan=planNativeImageContinuation(e,[]),d=buildNativeImageDelivery(e);assert.equal(plan.next_action,'PREPARE_IMAGE_ONLY_TASK');assertNativeImageTaskPrompt(d.task_prompt,d,e);save(next+'-delivery.json',d);save(next+'-task-prompt.txt',d.task_prompt);save(next+'-plan.json',plan);continuation={candidate_id:next,plan,task_prompt_sha256:d.task_prompt_sha256,task_created:false};}
 else continuation={candidate_id:next,existing_attempts:attempts,task_created:false,next_action:'RESOLVE_EXISTING_ATTEMPT'};
}
save('final-validation.json',{schema_version:'1.0.0',qualification_id:'2026-09-28-Q24',result:'pass',scope:'Committed final-byte and existing individual-review binding plus unchanged V2 receipt validation; not full qualification or six-image set approval',verified_at:new Date().toISOString(),execution_commit:process.env.GITHUB_SHA,release_code_commit:execFileSync('git',['-C',code,'rev-parse','HEAD']).toString().trim(),workflow_run_id:process.env.GITHUB_RUN_ID,finals,continuation,visual_review_repeated:false,generation_calls:0,normalizations:0,owner_interventions:[],production_mutation:false});
console.log(JSON.stringify({result:'pass',verified_final_images:finals.length,next_candidate:next,task_created:false}));
