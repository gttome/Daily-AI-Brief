import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const runGate=(candidates,{cutoff='2026-09-18T13:00:00Z',limit=20,qualificationEditionDate=null,publishedEditions=[]}={})=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-gate-'));
 const input=path.join(dir,'in.json'),out=path.join(dir,'out.json'),editions=path.join(dir,'editions');
 fs.mkdirSync(editions,{recursive:true});
 fs.writeFileSync(input,JSON.stringify({updated_at:'2026-09-18T13:05:00Z',candidates}));
 for(const edition of publishedEditions)fs.writeFileSync(path.join(editions,edition.brief_date+'.json'),JSON.stringify(edition));
 const argv=['_tools/under80-metadata-gate.mjs','--input',input,'--out',out,'--limit',String(limit),'--cutoff',cutoff,'--published-editions-dir',editions];
 if(qualificationEditionDate)argv.push('--qualification-edition-date',qualificationEditionDate);
 execFileSync(process.execPath,argv,{cwd:process.cwd()});
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

test('updated Agent Skills metadata is background until material change is verified',()=>{
 const result=runGate([
  {source_id:'skills',headline:'Using Agent Skills for reusable knowledge-worker workflows',canonical_url:'https://example.com/skills',published_at:'2026-04-10T12:00:00Z',updated_at:'2026-09-17T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].agent_skill_signal,true);
 assert.equal(result.candidates[0].agent_skill_story_ready,false);
 assert.equal(result.candidates[0].date_basis,'updated_at_requires_material_update_review');
});

test('coverage readiness requires three metadata candidates per focus and one Agent Skills signal',()=>{
 const technical=Array.from({length:3},(_,i)=>({source_id:'t'+i,headline:`AI model evaluation benchmark release ${i} for developer reliability`,canonical_url:`https://example.com/t/${i}`,published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}));
 const applied=Array.from({length:3},(_,i)=>({source_id:'k'+i,headline:`Enterprise workplace AI productivity update ${i} for knowledge workers`,canonical_url:`https://example.com/k/${i}`,published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}));
 const agents=[
  {source_id:'s',headline:'Agentic CLI customizations now track skills and custom agents',snippet:'Copilot CLI reports count invocations for skills and plugin skills.',canonical_url:'https://example.com/a/skill',published_at:'2026-09-17T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'a1',headline:'Agent workflow automation for business teams without coding',canonical_url:'https://example.com/a/1',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'a2',headline:'AI assistant workflow automation for business users',canonical_url:'https://example.com/a/2',published_at:'2026-09-18T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}
 ];
 const result=runGate([...technical,...applied,...agents]);
 assert.equal(result.coverage_ready,true);
 assert.equal(result.agent_skill_signals,1);
 assert.equal(result.agent_skill_story_ready_signals,1);
 assert.ok(Object.values(result.coverage_counts).every(n=>n>=3));
});


test('required topic survives sparse title wording but does not satisfy freshness without verified material change',()=>{
 const result=runGate([
  {source_id:'openai-academy-skills',headline:'OpenAI Academy Skills for reusable ChatGPT workflows',canonical_url:'https://academy.openai.com/public/clubs/work-users-ynjqu/resources/skills',published_at:'2026-02-25T02:18:07Z',updated_at:'2026-09-17T15:25:07Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills',focus_hint:'agents_non_technical_people'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].agent_skill_signal,true);
 assert.equal(result.candidates[0].date_basis,'updated_at_requires_material_update_review');
});


test('fresh GitHub skills metrics qualifies as a story-ready Agent Skills signal',()=>{
 const result=runGate([
  {source_id:'github-changelog-copilot',publisher:'GitHub Changelog',headline:'Agentic CLI customizations now in the usage metrics API',snippet:'GitHub Copilot expands CLI report coverage with activity metrics for skills, custom agents, MCP servers, slash commands, and plugins. Skill invocations and plugin skills are counted.',canonical_url:'https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/',published_at:'2026-09-17T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',focus_hint:'technical_ai_engineering'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].agent_skill_signal,true);
 assert.equal(result.candidates[0].agent_skill_story_ready,true);
 assert.equal(result.candidates[0].focus_hint,'agents_non_technical_people');
 assert.equal(result.candidates[0].date_basis,'published_at');
 assert.equal(result.preferred_agent_skill_candidate_id,result.candidates[0].candidate_id);
});


test('generic agentic research with incidental skills language is not an Agent Skills story',()=>{
 const result=runGate([
  {source_id:'paper',headline:'Self-Retiring Distillation for Agentic Reinforcement Learning',snippet:'The agent learns complex skills through reinforcement learning and improves policy optimization.',canonical_url:'https://example.com/paper',published_at:'2026-09-17T12:00:00Z',source_reliability:'preprint',content_type:'article'}
 ]);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].agent_skill_signal,false);
 assert.equal(result.candidates[0].agent_skill_story_ready,false);
});


test('qualification preflight removes prior-production Agent Skills duplicates before semantic execution',()=>{
 const url='https://example.com/agent-skill-prior-production';
 const result=runGate([
  {source_id:'skills',headline:'Reusable Agent Skills evaluation update for enterprise agents',snippet:'Agent Skills skill selection and reusable workflow evaluation.',canonical_url:url,published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills'},
  {source_id:'a1',headline:'Agent workflow automation for business teams without coding',canonical_url:'https://example.com/a1',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'a2',headline:'AI assistant workflow automation for business users',canonical_url:'https://example.com/a2',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'t1',headline:'AI model evaluation benchmark release for developer reliability one',canonical_url:'https://example.com/t1',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'t2',headline:'AI model evaluation benchmark release for developer reliability two',canonical_url:'https://example.com/t2',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'t3',headline:'AI model evaluation benchmark release for developer reliability three',canonical_url:'https://example.com/t3',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'k1',headline:'Enterprise workplace AI productivity update for knowledge workers one',canonical_url:'https://example.com/k1',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'k2',headline:'Enterprise workplace AI productivity update for knowledge workers two',canonical_url:'https://example.com/k2',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'},
  {source_id:'k3',headline:'Enterprise workplace AI productivity update for knowledge workers three',canonical_url:'https://example.com/k3',published_at:'2026-09-25T12:00:00Z',source_reliability:'publisher_authored',content_type:'article'}
 ],{cutoff:'2026-09-26T18:00:00Z',qualificationEditionDate:'2026-09-26',publishedEditions:[{brief_date:'2026-09-25',stories:[{source:{url}}]}]});
 const skill=result.candidates.find(x=>x.canonical_url===url);
 assert.equal(skill.production_novelty_eligible,false);
 assert.equal(skill.agent_skill_story_ready,false);
 assert.equal(result.agent_skill_story_ready_signals_after_novelty,0);
 assert.equal(result.preferred_agent_skill_candidate_id,null);
 assert.equal(result.coverage_ready,false);
});

test('qualification novelty ignores same-day production and qualification history',()=>{
 const url='https://example.com/same-day-skill';
 const result=runGate([
  {source_id:'skills',headline:'Reusable Agent Skills evaluation update for enterprise agents',snippet:'Agent Skills reusable workflow evaluation.',canonical_url:url,published_at:'2026-09-26T12:00:00Z',source_reliability:'publisher_authored',content_type:'article',required_topic:'agent_skills'}
 ],{cutoff:'2026-09-26T18:00:00Z',qualificationEditionDate:'2026-09-26',publishedEditions:[{brief_date:'2026-09-26',stories:[{source:{url}}]}]});
 assert.equal(result.candidates[0].production_novelty_eligible,true);
 assert.equal(result.candidates[0].agent_skill_story_ready,true);
});
