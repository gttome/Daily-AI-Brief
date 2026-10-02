import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('qualified scheduled host keeps the exact fenced request pending without generation or fabricated acceptance',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'scheduled-route-'));
  try{
    const request=path.join(root,'request.json'),registration=path.join(root,'host.json');
    fs.writeFileSync(request,JSON.stringify({execution_id:'next-run',writer_generation:3,task_id:'11',capability:'native_chatgpt',status:'queued',request_key:'immutable-key'}));
    fs.writeFileSync(registration,JSON.stringify({status:'READY',host_id:'chatgpt-automation:6abeba31fe28819184544abf70874a80',qualification_receipt_path:'_records/live-qualified.json'}));
    const args=['_tools/native-image-worker.py','--run-root',root,'--request',request,'--execution-key','next-run','--execution-id','next-run','--edition-id','next-edition','--writer-generation','3','--host-registration',registration];
    const result=JSON.parse(execFileSync('python3',args));
    assert.equal(result.status,'AWAITING_SCHEDULED_EXECUTOR');assert.equal(result.generation_started,false);assert.equal(result.accepted_locked,false);
    assert.equal(JSON.parse(fs.readFileSync(request)).request_key,'immutable-key');
    assert.equal(fs.existsSync(path.join(root,'_records')),false);
    const before=fs.readFileSync(request,'utf8');execFileSync('python3',args);assert.equal(fs.readFileSync(request,'utf8'),before);
    fs.writeFileSync(registration,JSON.stringify({status:'CAPABILITY_BLOCKED',host_id:null}));
    assert.equal(JSON.parse(execFileSync('python3',args)).status,'CAPABILITY_BLOCKED');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
