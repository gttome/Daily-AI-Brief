import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

function readyRegistration(){
  return {
    status:'READY',
    host_id:'chatgpt-automation:6abfb619185c819194646f77c3b314a4',
    qualification_receipt_path:'_records/live-qualified.json',
    reusable_consumer:{
      scheduler_kind:'chatgpt_automation',
      automation_id:'6abeb9a2b8a88191949dc420d5e10feb',
      enabled:true,
      role:'scheduled_native_image_request_consumer'
    }
  };
}

test('qualified host routes the exact fenced request to the enabled reusable scheduled consumer',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'scheduled-route-'));
  try{
    const request=path.join(root,'request.json'),registration=path.join(root,'host.json');
    fs.writeFileSync(request,JSON.stringify({execution_id:'next-run',writer_generation:3,task_id:'11',capability:'native_chatgpt',status:'queued',request_key:'immutable-key'}));
    fs.writeFileSync(registration,JSON.stringify(readyRegistration()));
    const args=['_tools/native-image-worker.py','--run-root',root,'--request',request,'--execution-key','next-run','--execution-id','next-run','--edition-id','next-edition','--writer-generation','3','--host-registration',registration];
    const result=JSON.parse(execFileSync('python3',args));
    assert.equal(result.status,'QUEUED_FOR_SCHEDULED_CONSUMER');
    assert.equal(result.consumer_id,'6abeb9a2b8a88191949dc420d5e10feb');
    assert.equal(result.generation_started,false);
    assert.equal(result.accepted_locked,false);
    assert.equal(result.writer_generation_is_provenance,true);
    assert.equal(result.authority_refresh_required_at_invocation,true);
    const queued=JSON.parse(fs.readFileSync(request));
    assert.equal(queued.request_key,'immutable-key');
    assert.equal(queued.status,'queued_for_scheduled_consumer');
    const before=fs.readFileSync(request,'utf8');
    execFileSync('python3',args);
    assert.equal(fs.readFileSync(request,'utf8'),before);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('READY qualification without an enabled reusable consumer fails closed instead of waiting consumerless',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'scheduled-route-'));
  try{
    const request=path.join(root,'request.json'),registration=path.join(root,'host.json');
    fs.writeFileSync(request,JSON.stringify({execution_id:'next-run',writer_generation:3,task_id:'11',capability:'native_chatgpt',status:'queued',request_key:'immutable-key'}));
    fs.writeFileSync(registration,JSON.stringify({
      status:'READY',
      host_id:'chatgpt-automation:6abfb619185c819194646f77c3b314a4',
      qualification_receipt_path:'_records/live-qualified.json'
    }));
    const args=['_tools/native-image-worker.py','--run-root',root,'--request',request,'--execution-key','next-run','--execution-id','next-run','--edition-id','next-edition','--writer-generation','3','--host-registration',registration];
    const result=JSON.parse(execFileSync('python3',args));
    assert.equal(result.status,'CAPABILITY_BLOCKED');
    assert.equal(result.reason,'NO_ENABLED_REUSABLE_SCHEDULED_IMAGE_CONSUMER');
    assert.notEqual(result.status,'AWAITING_SCHEDULED_EXECUTOR');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('unqualified host remains capability blocked',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'scheduled-route-'));
  try{
    const request=path.join(root,'request.json'),registration=path.join(root,'host.json');
    fs.writeFileSync(request,JSON.stringify({execution_id:'next-run',writer_generation:3,task_id:'11',capability:'native_chatgpt',status:'queued',request_key:'immutable-key'}));
    fs.writeFileSync(registration,JSON.stringify({status:'CAPABILITY_BLOCKED',host_id:null}));
    const args=['_tools/native-image-worker.py','--run-root',root,'--request',request,'--execution-key','next-run','--execution-id','next-run','--edition-id','next-edition','--writer-generation','3','--host-registration',registration];
    assert.equal(JSON.parse(execFileSync('python3',args)).status,'CAPABILITY_BLOCKED');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
