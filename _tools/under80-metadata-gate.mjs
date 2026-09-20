#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs,normalizeUrl} from '../_generator/lib/util.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.input||!args.out)throw Error('Requires --input <json> --out <json>');
const limit=Number(args.limit||20);
if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('under80_metadata_limit_must_be_1_to_20');
const cutoff=args.cutoff?Date.parse(args.cutoff):Date.now();
if(!Number.isFinite(cutoff))throw Error('valid_cutoff_required');
const ordinaryAgeHours=Number(args['ordinary-max-age-hours']||72);
const skillAgeHours=Number(args['skill-max-age-hours']||168);
if(!Number.isFinite(ordinaryAgeHours)||ordinaryAgeHours<=0||!Number.isFinite(skillAgeHours)||skillAgeHours<ordinaryAgeHours)throw Error('valid_metadata_age_windows_required');

const raw=JSON.parse(fs.readFileSync(path.resolve(args.input),'utf8'));
const source=Array.isArray(raw)?raw:Array.isArray(raw.candidates)?raw.candidates:[];
const text=v=>String(v??'').replace(/\s+/g,' ').trim();
const boilerplate=/^(?:home|about(?: us)?|contact(?: us)?|privacy(?: policy)?|terms(?: of service)?|sign in|log in|training(?: &| and)? certification|links in the anthology|documentation|docs|developers?|resources?|research|news|blog|articles?|events?|careers?|press|learn more|read more|view all|see all)$/i;
const obviousNonStoryUrl=url=>/searchtype=author|\/author\/|\/authors\/|\/tag\/|\/tags\/|\/category\/|\/categories\/|\/legal\/|\/privacy(?:\/|$)|\/terms(?:\/|$)|\/careers?(?:\/|$)|\/contact(?:\/|$)|\/about(?:\/|$)|\/search(?:[/?]|$)|[?&](?:q|query|search)=/i.test(url);
const allowedContent=item=>!item.content_type||['article','rss','atom','preprint'].includes(String(item.content_type).toLowerCase())||['article','rss','atom'].includes(String(item.format||'').toLowerCase());
const reliabilityRank=v=>({publisher_authored:40,official_announcement:40,primary_source:40,research:32,standards:32,preprint:24,discovery_signal:12}[v]||8);
const ageHours=stamp=>(cutoff-stamp)/3600000;
const ageRank=(stamp,maxAge)=>{
 const h=ageHours(stamp);
 if(!Number.isFinite(h)||h<0||h>maxAge)return -1000;
 if(h<=24)return 18;
 if(h<=72)return 12;
 return 6;
};
const skillSignal=value=>{
 const v=text(value).toLowerCase();
 const explicit=/\b(agent skills?|ai skills?|skill\.md|skills\.md|reusable agent workflows?|reusable workflows?|custom skills?|build(?:ing)? skills?|create(?:ing)? skills?)\b/.test(v);
 const contextual=/\bskills?\b/.test(v)&&/\b(copilot|plugin|plugins|cli|workflow|workflows|customization|customizations|reusable|invocations?|skill totals?|custom agents?)\b/.test(v);
 return explicit||contextual;
};
const relevanceRank=value=>{
 const v=text(value).toLowerCase();
 let n=0;
 if(/\b(agent|agents|workflow|automation|tool use|computer use|assistant)\b/.test(v))n+=4;
 if(/\b(ai|artificial intelligence|llm|model|gemini|claude|copilot|gpt|rag|retrieval|prompt|context|evaluation|benchmark|safety|coding|github|developer)\b/.test(v))n+=4;
 if(/\b(workplace|knowledge worker|enterprise|productivity|no-code|low-code|salesforce|microsoft 365|workspace|docs|search)\b/.test(v))n+=2;
 if(skillSignal(v))n+=5;
 return n;
};
const focusHint=(value,isSkill)=>{
 const v=text(value).toLowerCase();
 if(isSkill)return 'agents_non_technical_people';
 if(/\b(agent|agents|workflow automation|computer use|assistant)\b/.test(v)&&!/\b(api|sdk|framework|developer|code|benchmark|model)\b/.test(v))return 'agents_non_technical_people';
 if(/\b(workplace|knowledge worker|enterprise|productivity|no-code|low-code|salesforce|microsoft 365|google workspace|office|business users?|impact dashboard|feature engagement|adoption|docs)\b/.test(v))return 'applied_genai_knowledge_workers';
 return 'technical_ai_engineering';
};

const rejected={invalid_title:0,nonstory_url:0,nonarticle_content:0,date_conflict:0,unresolved_date:0,outside_window:0,low_relevance:0,duplicate:0};
const byUrl=new Map();
for(const item of source){
 const title=text(item.headline||item.title);
 if(title.length<20||title.length>200||boilerplate.test(title)){rejected.invalid_title++;continue;}
 let url;try{url=normalizeUrl(item.canonical_url||item.url);}catch{rejected.nonstory_url++;continue;}
 if(!url.startsWith('https://')||obviousNonStoryUrl(url)){rejected.nonstory_url++;continue;}
 if(!allowedContent(item)){rejected.nonarticle_content++;continue;}
 if(item.date_conflict===true){rejected.date_conflict++;continue;}
 const combined=title+' '+text(item.snippet)+' '+text(item.required_topic);
 const isSkill=item.required_topic==='agent_skills'||skillSignal(combined);
 const publishedRaw=item.published_at||item.publication_date||null;
 const published=publishedRaw?Date.parse(publishedRaw):NaN;
 const updated=item.updated_at?Date.parse(item.updated_at):NaN;
 const maxAge=isSkill?skillAgeHours:ordinaryAgeHours;
 let eventStamp=NaN,dateBasis=null;
 if(Number.isFinite(published)&&ageHours(published)>=0&&ageHours(published)<=maxAge){eventStamp=published;dateBasis='published_at';}
 else if(isSkill&&Number.isFinite(updated)&&ageHours(updated)>=0&&ageHours(updated)<=skillAgeHours){eventStamp=updated;dateBasis='updated_at_requires_material_update_review';}
 else if(!Number.isFinite(published)&&!(isSkill&&Number.isFinite(updated))){rejected.unresolved_date++;continue;}
 else {rejected.outside_window++;continue;}
 const relevance=relevanceRank(combined)+(item.required_topic==='agent_skills'?8:0);
 if(relevance<4){rejected.low_relevance++;continue;}
 const providedFocus=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'].includes(item.focus_hint)?item.focus_hint:null;
 // Treat upstream focus hints as advisory. Reclassify clear knowledge-worker adoption/engagement stories deterministically so technical-heavy source defaults cannot starve the 2/2/2 coverage gate.
 const inferredFocus=focusHint(combined,false);
 const appliedOverride=inferredFocus==='applied_genai_knowledge_workers'&&/\b(impact dashboard|feature engagement|adoption|knowledge worker|workplace|productivity|business users?|enterprise)\b/i.test(combined);
 // Upstream source hints are advisory for agent-facing work too. An explicit end-user/support agent
 // story must not remain technical merely because it came from a research-heavy source.
 const agentOverride=inferredFocus==='agents_non_technical_people'&&/\b(customer support|support agents?|troubleshooting agents?|workflow automation|assistant|business users?|knowledge worker)\b/i.test(combined);
 const focus=isSkill?'agents_non_technical_people':agentOverride?'agents_non_technical_people':appliedOverride?'applied_genai_knowledge_workers':providedFocus||inferredFocus;
 const skillStoryReady=isSkill&&(dateBasis==='published_at'||(dateBasis==='updated_at_requires_material_update_review'&&item.material_update_verified===true));
 const normalized={
  candidate_id:text(item.candidate_id)||null,
  headline:title,
  canonical_url:url,
  publisher:text(item.publisher)||null,
  source_id:text(item.source_id)||null,
  source_reliability:text(item.source_reliability)||null,
  published_at:Number.isFinite(published)?new Date(published).toISOString():null,
  updated_at:Number.isFinite(updated)?new Date(updated).toISOString():null,
  metadata_event_at:new Date(eventStamp).toISOString(),
  date_basis:dateBasis,
  date_status:'resolved_metadata_date',
  snippet:text(item.snippet).slice(0,360)||null,
  focus_hint:focus,
  agent_skill_signal:isSkill,
  agent_skill_story_ready:skillStoryReady,
  material_update_verified:item.material_update_verified===true,
  background_only:item.background_only===true,
  required_topic:item.required_topic||null,
  status:'metadata_prefiltered_not_deep_reviewed'
 };
 const score=reliabilityRank(normalized.source_reliability)+ageRank(eventStamp,maxAge)+relevance+Number(!!normalized.snippet)+(skillStoryReady?12:0)+(item.required_topic?4:0)-(item.background_only?8:0);
 const candidate={...normalized,prefilter_score:score};
 const prior=byUrl.get(url);
 if(!prior||candidate.prefilter_score>prior.prefilter_score)byUrl.set(url,candidate);else rejected.duplicate++;
}

const eligible=[...byUrl.values()].sort((a,b)=>b.prefilter_score-a.prefilter_score||String(b.metadata_event_at).localeCompare(String(a.metadata_event_at))||a.canonical_url.localeCompare(b.canonical_url));
const selected=[],selectedUrls=new Set();
const add=item=>{if(item&&selected.length<limit&&!selectedUrls.has(item.canonical_url)){selected.push(item);selectedUrls.add(item.canonical_url);return true;}return false;};

// Reserve the mandatory Agent Skills signal before general ranking.
add(eligible.find(x=>x.agent_skill_story_ready));

// Guarantee metadata breadth for the eventual 2/2/2 editorial allocation before filling by score.
for(const focus of ['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people']){
 let count=selected.filter(x=>x.focus_hint===focus).length;
 for(const item of eligible){
  if(count>=3||selected.length>=limit)break;
  if(item.focus_hint===focus&&add(item))count++;
 }
}

// Fill the remaining slots source-diversely.
const remaining=eligible.filter(x=>!selectedUrls.has(x.canonical_url));
const groups=new Map();
for(const item of remaining){
 const key=item.source_id||item.publisher||'unknown';
 if(!groups.has(key))groups.set(key,[]);
 groups.get(key).push(item);
}
const keys=[...groups.keys()].sort((a,b)=>{
 const aa=groups.get(a)[0]?.prefilter_score??0,bb=groups.get(b)[0]?.prefilter_score??0;
 return bb-aa||a.localeCompare(b);
});
while(selected.length<limit&&keys.some(k=>groups.get(k).length)){
 for(const key of keys){
  if(selected.length>=limit)break;
  add(groups.get(key).shift());
 }
}

const candidates=selected.map((x,i)=>({...x,candidate_id:x.candidate_id||`m${String(i+1).padStart(2,'0')}`}));
if(candidates.length>limit)throw Error('under80_metadata_gate_internal_limit_violation');
const coverageCounts=Object.fromEntries(['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'].map(f=>[f,candidates.filter(x=>x.focus_hint===f).length]));
const agentSkillSignals=candidates.filter(x=>x.agent_skill_signal).length;
const agentSkillStoryReadySignals=candidates.filter(x=>x.agent_skill_story_ready).length;
const preferredAgentSkillCandidateId=candidates.find(x=>x.agent_skill_story_ready)?.candidate_id||null;
const coverageReady=Object.values(coverageCounts).every(n=>n>=3)&&agentSkillStoryReadySignals>=1;
const result={
 schema_version:'1.1.0',
 profile_id:'under80-v1',
 gate:'metadata_prefilter_before_model_exposure',
 cutoff:new Date(cutoff).toISOString(),
 ordinary_max_age_hours:ordinaryAgeHours,
 agent_skills_max_age_hours:skillAgeHours,
 metadata_candidate_limit:limit,
 raw_queue_count:source.length,
 eligible_after_deterministic_filter:eligible.length,
 retained_metadata_candidates:candidates.length,
 deferred_count:Math.max(0,eligible.length-candidates.length),
 coverage_counts:coverageCounts,
 agent_skill_signals:agentSkillSignals,
 agent_skill_story_ready_signals:agentSkillStoryReadySignals,
 preferred_agent_skill_candidate_id:preferredAgentSkillCandidateId,
 coverage_ready:coverageReady,
 rejected,
 invariant:'Only the candidates array in this file is permitted as model-visible article discovery input. Every retained candidate has a resolved in-window metadata date. The raw discovery queue is traceability-only and must not be opened by the editorial model.',
 candidates
};
fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});
fs.writeFileSync(path.resolve(args.out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({out:path.resolve(args.out),raw_queue_count:source.length,eligible:eligible.length,retained:candidates.length,limit,coverage_counts:coverageCounts,agent_skill_signals:agentSkillSignals,agent_skill_story_ready_signals:agentSkillStoryReadySignals,preferred_agent_skill_candidate_id:preferredAgentSkillCandidateId,coverage_ready:coverageReady,rejected}));
