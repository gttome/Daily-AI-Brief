import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyQualificationScheduler,verifyUnattendedImageQualification} from '../lib/unattended-image-qualification.mjs';
const id='6abeba31fe28819184544abf70874a80',at='2026-10-02T06:10:00Z';
function fixture(){
  const bytes=Buffer.from(JSON.stringify({source:'automations.peek',observed_at:'2026-10-02T06:11:00Z',automations:[{id,is_enabled:true,conversation_id:'actual-conversation',last_run_time:at}]}));
  const report={scheduler:{kind:'chatgpt_automation',automation_id:id,started_at:at,observation_path:'_records/qualification/scheduler.json',observation_sha256:createHash('sha256').update(bytes).digest('hex')},commit_sha:'a'.repeat(40)};
  return {report,options:{hostId:'chatgpt-automation:'+id,readCommitted:()=>bytes}};
}
test('scheduled ChatGPT invocation uses its own observed identity without a fictitious GitHub run',()=>{
  const {report,options}=fixture();assert.deepEqual(verifyQualificationScheduler(report,options),[]);
  assert.deepEqual(verifyQualificationScheduler({workflow_run_id:123}),[]);
});
test('enabled schedule alone, old run, wrong host, and changed observation cannot prove execution',()=>{
  const {report,options}=fixture();
  for(const patch of [{started_at:'2026-10-01T06:10:00Z'},{observation_sha256:'b'.repeat(64)},{observation_path:'../unsafe.json'}])
    assert.ok(verifyQualificationScheduler({...report,scheduler:{...report.scheduler,...patch}},options).length);
  assert.ok(verifyQualificationScheduler(report,{...options,hostId:'different'}).length);
  const missing=Buffer.from(JSON.stringify({source:'automations.peek',observed_at:at,automations:[{id,is_enabled:true,last_run_time:null}]}));
  assert.ok(verifyQualificationScheduler({...report,scheduler:{...report.scheduler,observation_sha256:createHash('sha256').update(missing).digest('hex')}},{...options,readCommitted:()=>missing}).length);
});
test('scheduler observation never replaces six actual live image receipts and recovered files',()=>{
  const {report,options}=fixture();let imageReads=0;
  Object.assign(report,{schema_version:'unattended-image-qualification-v1',host_id:options.hostId,evidence_type:'live',trigger:'scheduled',execution_mode:'qualification_nonproduction',owner_interventions:[],images:Array.from({length:6},(_,i)=>({execution_path:'_records/'+i+'.json',receipt_path:'_records/'+i+'-receipt.json'}))});
  const result=verifyUnattendedImageQualification(report,{...options,readCommitted:(p)=>{if(p===report.scheduler.observation_path)return options.readCommitted();imageReads++;throw Error('missing_live_image');}});
  assert.equal(imageReads,6);assert.equal(result.result,'BLOCKED');assert.ok(result.errors.includes('missing_live_image'));
});
