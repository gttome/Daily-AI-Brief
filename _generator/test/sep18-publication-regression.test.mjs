import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generatedFiles} from '../lib/render.mjs';
import {runShadowCheck} from '../lib/shadow.mjs';
const root=path.resolve(new URL('../../',import.meta.url).pathname);
const qualificationNonproduction=process.env.DAB_QUALIFICATION_NONPRODUCTION==='1';
const edition=JSON.parse(fs.readFileSync(path.join(root,'_data/editions/2026-09-18.json')));
test('first generation includes stars before the canonical edition exists on disk',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-first-stage-'));
 try{
  for(const name of ['_data','_records','_architecture','briefs','stories','podcasts','README.md'])fs.cpSync(path.join(root,name),path.join(temp,name),{recursive:true});
  fs.rmSync(path.join(temp,'_data/editions/2026-09-18.json'));
  fs.rmSync(path.join(temp,'briefs/2026-09-18.md'));
  const files=generatedFiles(edition,temp);
  for(const s of edition.stories){const page=files.get(`stories/${edition.brief_date}/${s.slug}.md`);assert.equal((page.match(/data-feedback-rating=/g)||[]).length,5);}
  for(const [name,content] of files)if(/^(stories|podcasts)\/2026-09-(16|17)\//.test(name))assert.equal(content,fs.readFileSync(path.join(root,name),'utf8'));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('modern shadow supports reader order and two podcasts while detecting page corruption',{skip:qualificationNonproduction?'production Sep18 fixture is intentionally replaced in qualification_nonproduction':false},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-modern-shadow-'));
 try{
  for(const name of ['_data','briefs','latest.md','index.md','archive.md','README.md'])fs.cpSync(path.join(root,name),path.join(temp,name),{recursive:true});
  // Pin the historical shadow fixture to Sep 18 even when a newer edition has been staged.
  fs.copyFileSync(path.join(temp,'briefs/2026-09-18.md'),path.join(temp,'latest.md'));
  assert.equal(runShadowCheck(temp,'2026-09-18').result,'pass');
  const file=path.join(temp,'latest.md');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('How to get discovered in AI search','CORRUPTED PODCAST TITLE'));
  const check=runShadowCheck(temp,'2026-09-18');assert.equal(check.result,'fail');assert.ok(check.errors.some(x=>x.includes('latest: reader output differs')));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
