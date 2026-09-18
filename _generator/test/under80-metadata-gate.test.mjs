import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const runGate=(candidates,{cutoff='2026-09-18T13:00:00Z',limit=20}={})=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-gate-'));
 const input=path.join(dir,'in.json'),out=path.join(dir,'out.json');
 fs.writeFileSync(input,JSON.stringify({updated_at:'2026-09-18T13:05:00Z',candidates}));
 execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',input,'--out',out,'--limit',String(limit),'--cutoff',cutoff],{cwd:process.cwd()});
 return JSON.parse(fs.readFileSync(out,'utf8'));
};

test('under80 metadata gate never exposes more than 20 dated candidates',()=>{
 const candidates=Array.from({length:37},(_,i)=>({
  source_id:'s'+(i%7),publisher:'Publisher '+(i%7),
  headline:`AI model evaluation release number ${String(i+1).padStart(2,'0')} adds practical controls`,
  canonical_url:`https://example.com/news/${i+1}`,
  published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'
 }));
 const result=runGate(candidates);
 assert.equal(result.retained_metadata_candidates,20);
 assert.equal(result.candidates.length,20);
 assert.equal(result.metadata_candidate_limit,20);
 assert.ok(result.candidates.every(x=>x.date_status==='resolved_metadata_date'));
 assert.match(result.invariant,/raw discovery queue/i);
});

test('under80 metadata gate removes navigation and unresolved-date entries',()=>{
 const result=runGate([
  {source_id:'a',headline:'Links in the Anthology',canonical_url:'https://aclanthology.org/faq/linking/',source_reliability:'discovery_signal'},
  {source_id:'b',headline:'New AI agent workflow controls for enterprise teams',canonical_url:'https://example.com/undated',source_reliability:'publisher_authored'},
  {source_id:'c',headline:'New AI model evaluation controls for enterprise teams',canonical_url:'https://example.com/story',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].canonical_url,'https://example.com/story');
 assert.equal(result.rejected.unresolved_date,1);
});

test('agent skills may use a recent updated date within the seven-day exception',()=>{
 const result=runGate([
  {source_id:'skills',headline:'Using Agent Skills for reusable knowledge-worker workflows',canonical_url:'https://example.com/skills',published_at:'2026-04-10T12:00:00Z',updated_at:'2026-09-17T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].agent_skill_signal,true);
 assert.equal(result.candidates[0].date_basis,'updated_at_requires_material_update_review');
});

test('coverage readiness requires three metadata candidates per focus and one Agent Skills signal',()=>{
 const technical=Array.from({length:3},(_,i)=>({source_id:'t'+i,headline:`AI model evaluation benchmark release ${i} for developer reliability`,canonical_url:`https://example.com/t/${i}`,published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}));
 const applied=Array.from({length:3},(_,i)=>({source_id:'k'+i,headline:`Enterprise workplace AI productivity update ${i} for knowledge workers`,canonical_url:`https://example.com/k/${i}`,published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}));
 const agents=[
  {source_id:'s',headline:'Using Agent Skills for reusable knowledge-worker workflows',canonical_url:'https://example.com/a/skill',updated_at:'2026-09-17T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills'},
  {source_id:'a1',headline:'Agent workflow automation for business teams without coding',canonical_url:'https://example.com/a/1',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'a2',headline:'AI assistant workflow automation for business users',canonical_url:'https://example.com/a/2',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}
 ];
 const result=runGate([...technical,...applied,...agents]);
 assert.equal(result.coverage_ready,true);
 assert.equal(result.agent_skill_signals,1);
 assert.ok(Object.values(result.coverage_counts).every(n=>n>=3));
});
