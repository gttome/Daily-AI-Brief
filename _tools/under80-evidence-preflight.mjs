#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs,sha256} from '../_generator/lib/util.mjs';
import {retrieveSource,compactDiscoveryHtml} from './discovery-links.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.input||!args.out||!args.receipt)throw Error('Requires --input, --out, and --receipt');
const gate=JSON.parse(fs.readFileSync(path.resolve(args.input),'utf8'));
if(gate.profile_id!=='under80-v1'||gate.coverage_ready!==true)throw Error('coverage_ready_metadata_gate_required');
if(!Array.isArray(gate.candidates)||gate.candidates.length>20)throw Error('bounded_metadata_candidates_required');
const focuses=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const preferred=gate.preferred_agent_skill_candidate_id||gate.candidates.find(x=>x.agent_skill_story_ready)?.candidate_id||null;
if(!preferred)throw Error('preferred_agent_skill_candidate_required');

const byFocus=new Map(focuses.map(f=>[f,gate.candidates.filter(x=>x.focus_hint===f).sort((a,b)=>(b.prefilter_score||0)-(a.prefilter_score||0)||String(a.candidate_id).localeCompare(String(b.candidate_id)))]));
const plan=[];
for(const focus of focuses){
 const pool=byFocus.get(focus);
 if(focus==='agents_non_technical_people'){
  const skill=pool.find(x=>x.candidate_id===preferred);
  if(!skill)throw Error('preferred_agent_skill_candidate_not_in_agent_focus');
  plan.push(skill);
  for(const item of pool)if(plan.filter(x=>x.focus_hint===focus).length<3&&item.candidate_id!==preferred)plan.push(item);
 }else plan.push(...pool.slice(0,3));
}
if(plan.length!==9||focuses.some(f=>plan.filter(x=>x.focus_hint===f).length!==3))throw Error('nine_candidate_balanced_review_plan_required');

const clean=value=>String(value||'')
 .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,' ')
 .replace(/<[^>]+>/g,' ')
 .replace(/&nbsp;|&#160;/gi,' ')
 .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
 .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
 .replace(/\s+/g,' ').trim();
const stop=new Set(['about','after','again','against','agentic','being','could','from','have','into','more','their','there','these','those','through','using','with','without','your','adds','update','generally','available']);
const terms=headline=>[...new Set(String(headline||'').toLowerCase().match(/[a-z0-9][a-z0-9-]{3,}/g)||[])].filter(x=>!stop.has(x));
const excerptFor=(plain,headline,max=650)=>{
 const keys=terms(headline);
 const sentences=plain.split(/(?<=[.!?])\s+/).map((s,i)=>({s:s.trim(),i})).filter(x=>x.s.length>=45&&x.s.length<=700);
 const scored=sentences.map(x=>({...x,score:keys.reduce((n,k)=>n+(x.s.toLowerCase().includes(k)?2:0),0)+( /\b(ai|agent|agents|model|workflow|copilot|skill|skills|evaluation|permission|governance|retrieval)\b/i.test(x.s)?1:0)}));
 const chosen=scored.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,5).sort((a,b)=>a.i-b.i);
 let out=(chosen.length?chosen:sentences.slice(0,4)).map(x=>x.s).join(' ');
 if(out.length>max)out=out.slice(0,max).replace(/\s+\S*$/,'').trim()+'…';
 return out;
};

const fetchedAt=new Date().toISOString(),records=[];
for(const candidate of plan){
 try{
  const result=await retrieveSource(candidate.canonical_url,{maxResponseBytes:1800000,maxNormalizedChars:400000});
  const compact=compactDiscoveryHtml(result.text),plain=clean(compact);
  const wordCount=(plain.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)||[]).length;
  records.push({
   candidate_id:candidate.candidate_id,focus:candidate.focus_hint,headline:candidate.headline,
   canonical_url:candidate.canonical_url,publisher:candidate.publisher||null,published_at:candidate.published_at,
   source_reliability:candidate.source_reliability||null,agent_skill_story_ready:candidate.agent_skill_story_ready===true,
   source_word_count:wordCount,excerpt:excerptFor(plain,candidate.headline),source_content_sha256:sha256(plain),
   retrieval_status:'retrieved',fetched_at:fetchedAt
  });
 }catch(error){
  records.push({candidate_id:candidate.candidate_id,focus:candidate.focus_hint,headline:candidate.headline,canonical_url:candidate.canonical_url,retrieval_status:'unavailable',reason:String(error.message||error),fetched_at:fetchedAt});
 }
}
const retrieved=records.filter(x=>x.retrieval_status==='retrieved');
const focusCounts=Object.fromEntries(focuses.map(f=>[f,retrieved.filter(x=>x.focus===f).length]));
let modelVisible=retrieved.map(x=>({candidate_id:x.candidate_id,focus:x.focus,headline:x.headline,canonical_url:x.canonical_url,publisher:x.publisher,published_at:x.published_at,source_reliability:x.source_reliability,agent_skill_story_ready:x.agent_skill_story_ready,source_word_count:x.source_word_count,excerpt:x.excerpt}));
let chars=JSON.stringify(modelVisible).length;
if(chars>11000){
 const cap=Math.max(300,Math.floor(650*11000/chars));
 modelVisible=modelVisible.map(x=>({...x,excerpt:x.excerpt.length>cap?x.excerpt.slice(0,cap).replace(/\s+\S*$/,'').trim()+'…':x.excerpt}));
 chars=JSON.stringify(modelVisible).length;
}
const ready=retrieved.length===9&&focuses.every(f=>focusCounts[f]===3)&&retrieved.some(x=>x.candidate_id===preferred&&x.agent_skill_story_ready===true)&&chars<=12000;
const evidence={schema_version:'1.0.0',profile_id:'under80-v1',execution_owner:'github_actions',model_calls:0,review_plan_count:plan.length,preferred_agent_skill_candidate_id:preferred,model_visible_chars:chars,model_visible:modelVisible};
const receipt={schema_version:'1.0.0',profile_id:'under80-v1',stage:'deterministic_article_evidence_preflight',execution_owner:'github_actions',model_calls:0,network_retrievals:plan.length,retrieved:retrieved.length,focus_counts:focusCounts,preferred_agent_skill_candidate_id:preferred,model_visible_chars:chars,evidence_sha256:sha256(JSON.stringify(evidence)),ready,failures:records.filter(x=>x.retrieval_status!=='retrieved').map(x=>({candidate_id:x.candidate_id,reason:x.reason}))};
fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});
fs.writeFileSync(path.resolve(args.out),JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(path.resolve(args.receipt),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
if(!ready)process.exitCode=2;
