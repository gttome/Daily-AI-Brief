import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyQualificationScheduler,verifyUnattendedImageQualification,verifyImageMetadataCorrection,pngDimensions} from '../lib/unattended-image-qualification.mjs';
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

test('completed one-time scheduler proof requires exact identity and bounded DTSTART to last-run timing',()=>{
  const schedule='BEGIN:VEVENT\nDTSTART:20261002T164540Z\nEND:VEVENT',started='2026-10-02T16:55:04.724Z';
  const task={id,is_enabled:false,conversation_id:'actual-conversation',schedule,last_run_time:started};
  const bytes=Buffer.from(JSON.stringify({source:'automations.peek',observed_at:'2026-10-02T16:56:00Z',automations:[task]}));
  const report={commit_sha:'a'.repeat(40),scheduler:{kind:'chatgpt_automation',automation_id:id,conversation_id:task.conversation_id,schedule,
    started_at:started,completed_one_time:true,max_start_delay_seconds:1800,observation_path:'_records/qualification/completed.json',
    observation_sha256:createHash('sha256').update(bytes).digest('hex')}};
  const options={hostId:'chatgpt-automation:'+id,readCommitted:()=>bytes};
  assert.deepEqual(verifyQualificationScheduler(report,options),[]);
  for(const patch of [{conversation_id:'wrong'},{schedule:'BEGIN:VEVENT\nDTSTART:20261002T164540Z\nRRULE:FREQ=DAILY\nEND:VEVENT'},{max_start_delay_seconds:60}])
    assert.ok(verifyQualificationScheduler({...report,scheduler:{...report.scheduler,...patch}},options).length);
});

test('an enabled one-time task cannot reuse a stale last_run_time from before DTSTART',()=>{
  const schedule='BEGIN:VEVENT\nDTSTART:20261002T172506Z\nEND:VEVENT',started='2026-10-02T16:55:04.724Z';
  const task={id,is_enabled:true,conversation_id:'actual-conversation',schedule,last_run_time:started};
  const bytes=Buffer.from(JSON.stringify({source:'automations.peek',observed_at:'2026-10-02T17:26:00Z',automations:[task]}));
  const report={commit_sha:'a'.repeat(40),scheduler:{kind:'chatgpt_automation',automation_id:id,conversation_id:task.conversation_id,schedule,
    started_at:started,max_start_delay_seconds:1800,observation_path:'_records/qualification/stale.json',
    observation_sha256:createHash('sha256').update(bytes).digest('hex')}};
  assert.ok(verifyQualificationScheduler(report,{hostId:'chatgpt-automation:'+id,readCommitted:()=>bytes}).includes('active_one_time_scheduler_timing_required'));
});

function png(width=1731,height=909,extra=Buffer.alloc(0)){
  const bytes=Buffer.alloc(24+extra.length);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(13,8);
  bytes.write('IHDR',12,'ascii');bytes.writeUInt32BE(width,16);bytes.writeUInt32BE(height,20);extra.copy(bytes,24);return bytes;
}
function gitBlob(bytes){return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');}
function correctionFixture(){
  const raw=png(),candidate_id='m07',attempt=1;
  const receipt=Buffer.from(JSON.stringify({candidate_id,attempt,accepted_locked:true,generation:{exact_returned_png:{dimensions:'1730x909'}}}));
  const recovery={candidate_id,attempt,source_attempt_receipt:{path:'_records/image-attempts/2026-10-02-run5/m07-attempt-1.json'},
    original:{qualification_path:'_records/image-trials/2026-10-02-scheduled/recovered-six-image/m07-attempt-1-original.png',
      bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),git_blob_sha:gitBlob(raw),receipt_dimensions:'1730x909',actual_dimensions:'1731x909'}};
  const correction={schema_version:'image-attempt-metadata-correction-v1',append_only:true,receipt_unchanged:true,png_unchanged:true,
    reason:'IMMUTABLE_RECEIPT_RAW_DIMENSIONS_METADATA_ERROR',candidate_id,attempt,
    immutable_receipt:{source_path:recovery.source_attempt_receipt.path,qualification_copy_path:'_records/image-trials/2026-10-02-scheduled/recovered-six-image/source-receipts/m07-attempt-1.json',git_blob_sha:gitBlob(receipt)},
    original:{path:recovery.original.qualification_path,bytes:raw.length,sha256:recovery.original.sha256,git_blob_sha:recovery.original.git_blob_sha},
    recorded_dimensions:'1730x909',actual_dimensions:'1731x909',inspection:{method:'png_ihdr_uint32_be',png_signature_hex:'89504e470d0a1a0a',ihdr_chunk_type:'IHDR'}};
  return {correction,recovery,receiptBytes:receipt,rawBytes:raw};
}
test('metadata correction is exact-bound to immutable receipt, bytes, identity and PNG IHDR dimensions',()=>{
  const x=correctionFixture();assert.equal(pngDimensions(x.rawBytes),'1731x909');
  assert.deepEqual(verifyImageMetadataCorrection(x.correction,x),[]);
  const cases=[
    {...x.correction,candidate_id:'m08'},
    {...x.correction,actual_dimensions:'1730x909'},
    {...x.correction,original:{...x.correction.original,bytes:x.correction.original.bytes+1}},
    {...x.correction,immutable_receipt:{...x.correction.immutable_receipt,git_blob_sha:'a'.repeat(40)}}
  ];
  for(const bad of cases)assert.ok(verifyImageMetadataCorrection(bad,{...x,correction:bad}).length);
  assert.ok(verifyImageMetadataCorrection(x.correction,{...x,rawBytes:png(1732,909)}).length);
});
