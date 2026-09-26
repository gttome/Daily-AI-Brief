import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {runShadowCheck} from '../lib/shadow.mjs';
import {generatedFiles} from '../lib/render.mjs';
import {validateDerivedParity} from '../lib/integrity.mjs';

const sourceRoot=process.cwd();
const date='2026-09-25';

function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-shadow-watchlist-'));
  const edition=JSON.parse(fs.readFileSync(path.join(sourceRoot,'_data','editions',date+'.json'),'utf8'));
  fs.mkdirSync(path.join(root,'_data','editions'),{recursive:true});
  fs.mkdirSync(path.join(root,'data'),{recursive:true});
  fs.writeFileSync(path.join(root,'_data','editions',date+'.json'),JSON.stringify(edition,null,2)+'\n');

  const topics=[];
  for(let i=1;i<=4;i++)topics.push({topic_id:'updated-'+i,name:'Updated topic '+i,status:'gaining_evidence',first_detected:'2026-09-20T12:00:00Z',updated_at:date+'T12:00:00Z'});
  for(let i=1;i<=12;i++)topics.push({topic_id:'carried-'+i,name:'Carried topic '+i,status:'early_signal',first_detected:'2026-09-10T12:00:00Z',updated_at:'2026-09-24T12:00:00Z'});
  const watchlist={schema_version:'1.0.0',edition_date:date,topics};
  fs.writeFileSync(path.join(root,'data','watchlist.json'),JSON.stringify(watchlist,null,2)+'\n');

  fs.mkdirSync(path.join(root,'briefs'),{recursive:true});
  fs.writeFileSync(path.join(root,'README.md'),'# Fixture\n');
  for(const [name,content] of generatedFiles(edition,root,{watchlist})){
    const target=path.join(root,name);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,content.endsWith('\n')?content:content+'\n');
  }
  fs.writeFileSync(path.join(root,'archive.md'),'['+date+'](/briefs/'+date+'/ )\n');
  for(const story of edition.stories){
    const target=path.join(root,story.image.path);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,'image');
  }
  return {root,watchlist};
}

test('shadow comparison reuses generated same-edition Watchlist state and still rejects real reader drift',()=>{
  const {root}=fixture();
  try{
    const passing=runShadowCheck(root,date,'fixture');
    assert.equal(passing.result,'pass',passing.errors.join('\n'));
    assert.deepEqual(validateDerivedParity(JSON.parse(fs.readFileSync(path.join(root,'_data','editions',date+'.json'),'utf8')),root),[]);
    for(const name of ['briefs/'+date+'.md','latest.md','index.md']){
      const body=fs.readFileSync(path.join(root,name),'utf8');
      assert.match(body,/0 new today · 4 updated · 12 carried forward\./);
      for(let i=1;i<=4;i++)assert.ok(body.includes('Updated topic '+i));
    }
    const latest=path.join(root,'latest.md');
    fs.writeFileSync(latest,fs.readFileSync(latest,'utf8').replace('0 new today · 4 updated · 12 carried forward.','0 new today · 3 updated · 13 carried forward.'));
    const failing=runShadowCheck(root,date,'fixture');
    assert.equal(failing.result,'fail');
    assert.ok(failing.errors.some(x=>x.includes('latest: reader output differs from canonical rendering')));
    assert.ok(validateDerivedParity(JSON.parse(fs.readFileSync(path.join(root,'_data','editions',date+'.json'),'utf8')),root).some(x=>x.includes('latest.md: derived output does not match canonical generation')));
  }finally{
    fs.rmSync(root,{recursive:true,force:true});
  }
});
