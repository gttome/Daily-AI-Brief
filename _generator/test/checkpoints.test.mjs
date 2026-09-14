import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {CheckpointStore,boundedTasks,repairPlan} from '../lib/checkpoints.mjs';
test('recoverable late QA failure resumes research and retains immutable checkpoint history',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-resume-'));
 try{
 fs.writeFileSync(path.join(root,'input'),'original');
 const store=new CheckpointStore({root,directory:path.join(root,'checkpoints'),attemptId:'attempt-1',pipelineVersion:'v1',dependencies:{research:[],generation:['research'],qa:['generation']}});
 let research=0,generation=0,qa=0;
 const first=()=>store.run('research',{inputs:['input'],execute:async()=>{research++;fs.writeFileSync(path.join(root,'research'),'verified');return ['research'];}});
 const second=()=>store.run('generation',{inputs:['input'],execute:async()=>{generation++;fs.writeFileSync(path.join(root,'generation'),'pages');return ['generation'];}});
 const third=()=>store.run('qa',{inputs:['input'],execute:async()=>{qa++;if(qa===1)throw Error('recoverable fixture failure');fs.writeFileSync(path.join(root,'qa'),'PASS');return ['qa'];}});
 await first();await second();await assert.rejects(third(),/recoverable/);
 await first();await second();await third();
 assert.deepEqual([research,generation,qa],[1,1,2]);assert.equal(store.metrics.checkpoint_hits,2);
 fs.writeFileSync(path.join(root,'input'),'changed');
 assert.equal(store.valid('research'),null);assert.equal(store.valid('generation'),null);assert.equal(store.valid('qa'),null);
 await first();assert.equal(research,2);assert.equal(fs.readdirSync(path.join(root,'checkpoints/attempt-1/history')).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('output corruption and version changes invalidate a checkpoint',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-hash-'));
 try{
 fs.writeFileSync(path.join(root,'in'),'a');fs.writeFileSync(path.join(root,'out'),'b');
 const options={root,directory:path.join(root,'state'),attemptId:'a',pipelineVersion:'v1',dependencies:{stage:[]}};
 const store=new CheckpointStore(options);store.save('stage',{inputs:['in'],outputs:['out']});
 assert.ok(store.valid('stage'));assert.equal(new CheckpointStore({...options,pipelineVersion:'v2'}).valid('stage'),null);
 fs.writeFileSync(path.join(root,'out'),'tampered');assert.equal(store.valid('stage'),null);
 assert.throws(()=>store.hashes(['../outside']),/within/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('parallel tasks preserve bounded concurrency and report every failure',async()=>{
 let active=0,peak=0;
 const results=await boundedTasks(Array.from({length:6},(_,i)=>async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;if(i===2)throw Error('failure');return i;}),2);
 assert.equal(peak,2);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 assert.deepEqual(results.filter(r=>r.status==='fulfilled').map(r=>r.value),[0,1,3,4,5]);
 assert.equal(repairPlan('test_fixture').research_reused,true);
 assert.equal(repairPlan('image').invalidated_stages.includes('evidence'),false);
 assert.equal(repairPlan('factual_story').invalidated_stages.includes('evidence'),true);
});
