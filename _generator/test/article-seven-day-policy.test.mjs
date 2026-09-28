import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ARTICLE_FRESHNESS_POLICY as policy,LEGACY_ARTICLE_FRESHNESS_POLICY as legacy,articleFreshness,compareArticleFreshness,balancedArticleEvidencePlan} from '../lib/article-freshness.mjs';
import {extractCandidateMetadata,publicationTimestamp} from '../../_tools/discovery-links.mjs';
import {validateEdition} from '../lib/validate.mjs';
import {renderReadingSupport} from '../lib/reading-support.mjs';
import {VIDEO_MAX_AGE_HOURS} from '../lib/media-selection.mjs';
const cutoff='2026-09-28T17:00:00Z';
const published=hours=>new Date(Date.parse(cutoff)-hours*3600000).toISOString();
for(const [hours,expected] of [[0,'primary'],[24,'primary'],[24+1/3600,'normal'],[72,'normal'],[72+1/3600,'extended'],[168,'extended'],[168+1/3600,null],[-1,null]]){
 test(`current article boundary ${hours} hours`,()=>{
  const f=articleFreshness(published(hours),cutoff);assert.equal(f?(f.tier==='primary'?'primary':f.fallback_band):null,expected);
 });
}
test('unresolved dates, future sources and unknown policy fail closed',()=>{
 for(const x of ['',null,'not a date'])assert.equal(articleFreshness(x,cutoff),null);
 assert.throws(()=>articleFreshness(published(1),cutoff,{policy:'unknown'}),/unknown/);
});
test('historical ordinary ceiling is not widened while legacy Skills retains 168 hours',()=>{
 assert.equal(articleFreshness(published(73),cutoff,{policy:legacy}),null);
 assert.equal(articleFreshness(published(168),cutoff,{policy:legacy,agentSkill:true}).fallback_band,'extended');
 const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-26.json','utf8'));
 edition.research_cutoff_at='2026-09-26T17:00:00Z';
 edition.stories[0].freshness={tier:'fallback',source_published_at:'2026-09-22T17:00:00Z',fallback_reason:'No qualifying newer technical article survived the source evidence and novelty checks.'};
 assert.ok(validateEdition(edition).some(x=>x.includes('exceeds 72 hours')));
 edition.article_freshness_policy=policy;edition.stories[0].freshness.fallback_band='extended';
 assert.ok(!validateEdition(edition).some(x=>x.includes('stories[0].freshness')));
 edition.stories[0].freshness.fallback_band='normal';assert.ok(validateEdition(edition).some(x=>x.includes('fallback_band')));
});
test('new-policy ordinary article disclosure is independent of optional reading-support catalog',()=>{
 const f={tier:'fallback',fallback_band:'extended',source_published_at:published(90),fallback_reason:'No qualifying primary or normal-fallback article met the required focus and evidence checks.'};
 const html=renderReadingSupport({freshness:f},'test-no-catalog-entry','2026-09-28');
 assert.match(html,/Extended recency fallback/);assert.ok(html.includes(f.source_published_at));assert.ok(html.includes(f.fallback_reason));
});
test('Notion observed RSS numeric timezone with display name yields paired publication dates',()=>{
 const text=fs.readFileSync('_generator/test/fixtures/notion-publication-zone.xml','utf8');
 const items=extractCandidateMetadata(text,'https://www.notion.com/releases/rss.xml',{source_id:'notion-releases-rss',format:'rss',evidence_class:'publisher_authored'});
 assert.equal(items.length,2);assert.equal(items[0].published_at,'2026-09-15T00:00:00.000Z');assert.match(items[0].headline,/Notion 3.7/);assert.match(items[0].canonical_url,/2026-09-15/);
 assert.equal(items[1].published_at,'2026-09-09T00:00:00.000Z');assert.match(items[1].headline,/Control which AI models/);
 assert.equal(articleFreshness(items[0].published_at,cutoff),null);
 assert.equal(publicationTimestamp('Tue Sep 15 2026 00:00:00 (Coordinated Universal Time)'),null);
});
const focuses=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const candidate=(focus,i,hours)=>({candidate_id:`${focus}-${i}`,source_id:`source-${i}`,headline:focus===focuses[0]?`AI developer model evaluation release number ${i}`:focus===focuses[1]?`Enterprise AI productivity for knowledge workers number ${i}`:`AI assistant agent workflow automation number ${i}`,canonical_url:`https://example.com/${focus}/${i}`,published_at:published(hours),source_reliability:i===0?'discovery_signal':'publisher_authored',focus_hint:focus,content_type:'article',prefilter_score:i===0?1:999,agent_skill_story_ready:focus===focuses[2]&&i===0});
test('balanced nine-candidate evidence plan prefers freshness before high scores',()=>{
 const candidates=focuses.flatMap(f=>[candidate(f,0,1),candidate(f,1,30),candidate(f,2,40),candidate(f,3,100)]);
 const gate={article_freshness_policy:policy,cutoff,candidates,preferred_agent_skill_candidate_id:candidates.find(x=>x.agent_skill_story_ready).candidate_id};
 const plan=balancedArticleEvidencePlan(gate);assert.equal(plan.length,9);assert.ok(!plan.some(x=>x.candidate_id.endsWith('-3')));
 for(const f of focuses)assert.equal(plan.find(x=>x.focus_hint===f).published_at,published(1));
});
test('metadata reservation and source-diverse fill retain primary before high-score extended leads',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-seven-day-'));
 try{
  const candidates=focuses.flatMap(f=>[candidate(f,0,1),candidate(f,1,30),candidate(f,2,40),candidate(f,3,100)]);
  candidates.find(x=>x.agent_skill_story_ready).headline='Reusable Agent Skills workflow release for business agents';
  fs.writeFileSync(path.join(dir,'in.json'),JSON.stringify({candidates}));
  execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',path.join(dir,'in.json'),'--out',path.join(dir,'out.json'),'--limit','9','--cutoff',cutoff,'--published-editions-dir',dir]);
  const g=JSON.parse(fs.readFileSync(path.join(dir,'out.json'),'utf8'));
  assert.equal(g.article_freshness_policy,policy);assert.equal(g.ordinary_max_age_hours,168);assert.equal(g.coverage_ready,true);
  assert.ok(!g.candidates.some(x=>x.candidate_id.endsWith('-3')));assert.equal(g.candidates.length,9);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('current gate cannot admit a stale source merely through a recent modified date',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-seven-day-modified-'));
 try{
  fs.writeFileSync(path.join(dir,'in.json'),JSON.stringify({candidates:[{...candidate(focuses[2],0,200),headline:'Reusable Agent Skills workflows for business automation',updated_at:published(1),material_update_verified:true}]}));
  execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',path.join(dir,'in.json'),'--out',path.join(dir,'out.json'),'--cutoff',cutoff]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'out.json'),'utf8')).candidates.length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('active policy contracts agree and all required living docs accompany the change',()=>{
 for(const p of ['under80-runtime-contract.json','efficiency-operating-policy.json','continuous-qualification-contract.json']){
  const x=JSON.parse(fs.readFileSync(`docs/operations/${p}`,'utf8')),f=x.freshness||x.article_freshness;assert.equal(f.policy_id,policy);assert.equal(f.prefer_hours,24);assert.equal(f.normal_fallback_hours,72);assert.equal(f.ordinary_fallback_hours,168);assert.equal(f.media_rules_changed,false);
 }
 for(const p of ['freshness-policy.md','CONTINUOUS-QUALIFICATION-PLAN.md','LIVING-SYSTEM-OPERATIONS.md','START-HERE.md'])assert.ok(fs.readFileSync(`docs/operations/${p}`,'utf8').includes(policy));
 assert.equal(VIDEO_MAX_AGE_HOURS,72);
});
test('only qualified date paths are activated and their freshness limitations remain explicit',()=>{
 const registry=JSON.parse(fs.readFileSync('_data/source-registry.json','utf8'));
 for(const id of ['make','adobe','box'])assert.notEqual(registry.sources.find(s=>s.source_id===id).status,'active');
 const plan=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
 for(const id of ['n8n-rss','notion-releases-rss']){
  const s=plan.sources.find(s=>s.source_id===id);assert.equal(s.status,'active');assert.equal(s.format,'rss');assert.ok(s.verification.limitation);
 }
});
import {expandEditorialKernel} from '../lib/editorial-kernel.mjs';
const kernelInputs=()=>{
 const k={schema_version:'1.0.0',brief_date:'2026-09-28',edition_id:'dab-edition-2026-09-28',baseline_sha:'a'.repeat(40),normal_model_passes:1,normal_post_editorial_model_passes:0,editorial_takeaway:'Use verified evidence and explicit category-specific fallback reasons.',media_decisions:{},changed_watchlist_topics:[],stories:[]};
 const facts={},images={},metadata={article_freshness_policy:policy,cutoff,candidates:[]};
 for(let i=0;i<6;i++){
  const id=`c${i}`,url=`https://example.com/story-${i}`;
  k.stories.push({story_id:`s${i}`,candidate_id:id,headline:`Verified AI article headline number ${i}`,summary:'A source-supported account of the verified development.',why_it_matters:'This development supports a practical verified learning objective.',editorial_limitation:'Evidence is limited to the source claims in the frozen packet.',visual:{},what_to_do_now:{action:'evaluate',label:'Evaluate',rationale:'Evaluate the verified capability against a bounded practical task.'},focus:focuses[Math.floor(i/2)],canonical_ordinal:i+1,agent_skill:i===4,topic_labels:[i===4?'Agent Skills':'AI'],source_url:url,fallback_reason:'No qualifying newer article survived evidence, novelty and focus-fit review for this required slot.'});
  facts[id]={event_date:'2026-09-24',source:{url,title:'Verified article',organization:'Example'},selection_rationale:'Verified focus-specific editorial selection.'};
  images[id]={path:`briefs/images/2026-09-28/${i}.webp`,alt:'Test fixture only.'};
  metadata.candidates.push({candidate_id:id,canonical_url:url,published_at:published(i===0?100:2)});
 }
 return {k,args:{candidateFacts:facts,imageAssets:images,metadataCandidates:metadata,publishedAt:cutoff,coveragePeriod:'24-hour primary window with explicit recency fallback.'}};
};
test('current kernel carries extended label metadata and original publication timestamp without inventing reason',()=>{
 const {k,args}=kernelInputs();const e=expandEditorialKernel(k,args);
 assert.equal(e.article_freshness_policy,policy);assert.equal(e.stories[0].freshness.fallback_band,'extended');assert.equal(e.stories[0].freshness.source_published_at,published(100));assert.equal(e.stories[0].freshness.fallback_reason,k.stories[0].fallback_reason);assert.match(e.coverage_period,/recency fallback/);
 delete k.stories[0].fallback_reason;assert.throws(()=>expandEditorialKernel(k,args),/fallback_reason required/);
});
test('current kernel rejects over-seven-day and modified-only article timestamps',()=>{
 const {k,args}=kernelInputs();args.metadataCandidates.candidates[0].published_at=published(169);assert.throws(()=>expandEditorialKernel(k,args),/ceiling/);
 args.metadataCandidates.candidates[0].published_at=null;args.metadataCandidates.candidates[0].metadata_event_at=published(1);assert.throws(()=>expandEditorialKernel(k,args),/timestamp/);
});
