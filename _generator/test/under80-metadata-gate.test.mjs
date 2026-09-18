import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('under80 metadata gate never exposes more than 20 candidates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-gate-'));
 const input=path.join(dir,'in.json'),out=path.join(dir,'out.json');
 const candidates=Array.from({length:37},(_,i)=>({
  source_id:'s'+(i%7),
  publisher:'Publisher '+(i%7),
  headline:`AI agent workflow release number ${String(i+1).padStart(2,'0')} adds practical controls`,
  canonical_url:`https://example.com/news/${i+1}`,
  published_at:'2026-09-18T12:00:00Z',
  source_reliability:'publisher_authored',
  content_type:'article'
 }));
 fs.writeFileSync(input,JSON.stringify({candidates}));
 execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',input,'--out',out,'--limit','20','--cutoff','2026-09-18T13:00:00Z'],{cwd:process.cwd()});
 const result=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(result.retained_metadata_candidates,20);
 assert.equal(result.candidates.length,20);
 assert.equal(result.metadata_candidate_limit,20);
 assert.match(result.invariant,/raw discovery queue/i);
});

test('under80 metadata gate removes obvious non-story navigation entries',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-gate-'));
 const input=path.join(dir,'in.json'),out=path.join(dir,'out.json');
 fs.writeFileSync(input,JSON.stringify({candidates:[
  {source_id:'a',headline:'Links in the Anthology',canonical_url:'https://aclanthology.org/faq/linking/',source_reliability:'discovery_signal'},
  {source_id:'b',headline:'New AI agent workflow controls for enterprise teams',canonical_url:'https://example.com/story',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored'}
 ]}));
 execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',input,'--out',out,'--cutoff','2026-09-18T13:00:00Z'],{cwd:process.cwd()});
 const result=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].canonical_url,'https://example.com/story');
});
