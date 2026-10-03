import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {consumeTask17} from '../lib/repository-task-consumer.mjs';

const j=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};
test('Task 17 consumer requires six exact accepted Git-reviewed images and writes accessibility/set evidence',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-task17-'));
  const runKey='2026-10-02-run5', exec='reliable-edition-20261002-run5', branch='reliable-edition/dab-edition-2026-10-02-run5';
  const specs={checks:{distinct_compositions:true},specs:[]};
  for(let i=1;i<=6;i++){
    const id='m'+String(i).padStart(2,'0'), task=String(10+i);
    const asset=`briefs/images/2026-10-02/dab-edition-2026-10-02-${id}-1.png`;
    const bytes=Buffer.from('png-'+id);
    fs.mkdirSync(path.join(root,path.dirname(asset)),{recursive:true});fs.writeFileSync(path.join(root,asset),bytes);
    const sha=crypto.createHash('sha256').update(bytes).digest('hex');
    const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
    specs.specs.push({task_id:task,candidate_id:id,subject:'subject '+id,mechanism:'Show distinct mechanism '+id});
    j(path.join(root,'_records/image-attempts',runKey,`${id}-attempt-1.json`),{
      candidate_id:id,accepted_locked:true,status:'accepted_locked',candidate:{dimensions:'1200x630',sha256:sha,git_blob_sha:blob},
      persistence:{production_path:asset,status:'persisted',png_dimensions:'1200x630',content_address_verified:true,read_back_verified:true},
      review:{saved_git_asset_reviewed:true,subject_match:'PASS',required_mechanism:'PASS',structural_quality:'PASS',editorial_quality:'PASS',professional_finish:'PASS',meaningful_detail:'PASS',explanatory_mechanism:'PASS',information_hierarchy:'PASS',white_background:'PASS',allowed_visible_text:'PASS',extra_visible_text:'NONE',factual_scope:'PASS',people_humanoids:'NONE',product_ui:'NONE',overlap:'NONE',sparse_basic_fallback:false,low_quality_fallback:false}
    });
  }
  j(path.join(root,'_records/image-specs',runKey+'.json'),specs);
  const req=path.join(root,'_records/edition-execution/worker-requests',exec,'17-key.json');
  j(req,{task_id:'17',capability:'repository',status:'queued',request_key:'key',execution_id:exec,edition_id:'dab-edition-2026-10-02',branch,writer_generation:11});
  const r=consumeTask17({runRoot:root,requestPath:req});
  assert.equal(r.result,'PASS'); assert.equal(r.accepted_images,6);
  assert.equal(JSON.parse(fs.readFileSync(req)).status,'completed_pass');
  const q=JSON.parse(fs.readFileSync(path.join(root,'_records/image-quality/2026-10-02-editorial-v2.json')));
  assert.equal(q.set_review.differentiation??q.set_review.composition_differentiation,'PASS');
  assert.equal(q.set_review.accessibility,'PASS');
  assert.ok(fs.existsSync(path.join(root,'_records/edition-execution/events',runKey,'17-done-set-review.json')));
});

test('repository Task 17 workflow takes and releases fenced ownership instead of leaving a passive queue',()=>{
  const y=fs.readFileSync('.github/workflows/repository-task-consumer.yml','utf8');
  assert.match(y,/17-\*\.json/);
  assert.match(y,/writer-lease/);
  assert.match(y,/takeover-dead-owner true/);
  assert.match(y,/TASK17_DONE_HANDOFF_TO_SUPERVISOR/);
  assert.match(y,/repository-task-consumer\.mjs/);
});
