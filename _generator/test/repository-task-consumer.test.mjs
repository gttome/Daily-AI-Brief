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

test('Task 17 consumes immutable acceptance locks that reference repair-epoch attempts and saved-Git reviews',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-task17-locks-'));
  const runKey='2026-10-04-run8', exec='reliable-edition-20261004-run8', edition='dab-edition-2026-10-04', branch='reliable-edition/dab-edition-2026-10-04-run8';
  const specs={checks:{distinct_compositions:true},specs:[]};
  for(let i=1;i<=6;i++){
    const id='m'+String(i).padStart(2,'0'), task=String(10+i), asset=`briefs/images/2026-10-04/${edition}-${id}.png`;
    const bytes=Buffer.from('locked-png-'+id); fs.mkdirSync(path.join(root,path.dirname(asset)),{recursive:true}); fs.writeFileSync(path.join(root,asset),bytes);
    const sha=crypto.createHash('sha256').update(bytes).digest('hex'), blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
    const attemptRel=`_records/image-attempts/${runKey}/${id}-repair-epoch-2-attempt-1.json`, reviewRel=`_records/image-reviews/${runKey}/${id}-repair-epoch-2-attempt-1-saved-git-review.json`;
    specs.specs.push({task_id:task,candidate_id:id,subject:'subject '+id,composition:'distinct composition '+id});
    j(path.join(root,attemptRel),{execution_id:exec,edition_id:edition,candidate_id:id,disposition:'ACCEPTED_LOCKED',normalization:{path:asset,sha256:sha,git_blob_sha:blob,same_visual:true,low_quality_fallback:false,svg_fallback:false}});
    j(path.join(root,reviewRel),{execution_id:exec,edition_id:edition,candidate_id:id,accepted_locked:true,result:'PASS',final:{path:asset,sha256:sha,git_blob_sha:blob,exact_readback:'PASS_EXACT_BYTES'},visual_review:{professional_quality:true,story_specific:true,detailed:true,legibility:'PASS',visible_text_guard:'PASS',extra_visible_text:[],no_people_or_humanoids:true,artifacts_or_corruption:false,context_contamination:false}});
    j(path.join(root,'_records/image-acceptance',runKey,`${id}.json`),{schema_version:'image-acceptance-lock-v1',execution_id:exec,edition_id:edition,candidate_id:id,accepted_locked:true,immutable:true,quality_gate:'PASS',visible_text_guard:'PASS',attempt_receipt:attemptRel,saved_git_review:reviewRel,final:{path:asset,sha256:sha,git_blob_sha:blob,width:1199,height:630}});
  }
  j(path.join(root,'_records/image-specs',runKey+'.json'),specs);
  const req=path.join(root,'_records/edition-execution/worker-requests',exec,'17-key.json');
  j(req,{task_id:'17',capability:'repository',status:'queued',request_key:'key',execution_id:exec,edition_id:edition,branch,writer_generation:44});
  const result=consumeTask17({runRoot:root,requestPath:req});
  assert.equal(result.result,'PASS'); assert.equal(result.accepted_images,6);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'_records/editorial-handoff/images-2026-10-04.json')));
  assert.equal(manifest.m01.execution_receipt_path,`_records/image-attempts/${runKey}/m01-repair-epoch-2-attempt-1.json`);
  assert.equal(manifest.m01.width,1199); assert.equal(manifest.m01.height,630);
});

test('repository Task 17 workflow takes and releases fenced ownership instead of leaving a passive queue',()=>{
  const y=fs.readFileSync('.github/workflows/repository-task-consumer.yml','utf8');
  assert.match(y,/17-\*\.json/);
  assert.match(y,/writer-lease/);
  assert.match(y,/takeover-dead-owner true/);
  assert.match(y,/TASK17_DONE_HANDOFF_TO_SUPERVISOR/);
  assert.match(y,/repository-task-consumer\.mjs/);
});
