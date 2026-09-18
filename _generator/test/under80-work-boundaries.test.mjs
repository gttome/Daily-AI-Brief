import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

test('new under80 preflight and image validator scripts parse successfully',()=>{
 for(const script of ['_tools/under80-evidence-preflight.mjs','_tools/validate-handoff-images.mjs']){
  execFileSync(process.execPath,['--check',script],{cwd:process.cwd(),stdio:'pipe'});
 }
});

test('handoff image validator rejects missing binary assets before push',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-image-handoff-'));
 const kernelPath=path.join(dir,'kernel.json'),imagesPath=path.join(dir,'images.json');
 const stories=Array.from({length:6},(_,i)=>({candidate_id:'m'+String(i+1).padStart(2,'0')}));
 fs.writeFileSync(kernelPath,JSON.stringify({brief_date:'2026-09-18',stories}));
 const manifest=Object.fromEntries(stories.map((s,i)=>[s.candidate_id,{
  path:'briefs/images/2026-09-18/missing-'+(i+1)+'.png',
  quality_accepted:true,
  generation_method:'openai_image_generation',
  width:1200,height:630
 }]));
 fs.writeFileSync(imagesPath,JSON.stringify(manifest));
 const result=spawnSync(process.execPath,['_tools/validate-handoff-images.mjs','--kernel',kernelPath,'--images',imagesPath],{cwd:process.cwd(),encoding:'utf8'});
 assert.notEqual(result.status,0);
 const receipt=JSON.parse(result.stdout);
 assert.equal(receipt.images_expected,6);
 assert.equal(receipt.images_valid,0);
 assert.ok(receipt.records.every(x=>x.errors.includes('image_file_missing')));
});

test('workflows require zero-model article evidence and native-git PNG transport',()=>{
 const preflight=fs.readFileSync('.github/workflows/under80-discovery-preflight.yml','utf8');
 const handoff=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
 assert.match(preflight,/Pre-fetch bounded article evidence outside Work/);
 assert.match(preflight,/under80-evidence-preflight\.mjs/);
 assert.match(handoff,/article_evidence_path/);
 assert.match(handoff,/native_git/);
 assert.match(handoff,/Validate six native-git handoff PNGs/);
 assert.match(handoff,/Validate precomputed article evidence packet/);
});
