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
const maxAgeHours=Number(args['max-age-hours']||168);
if(!Number.isFinite(maxAgeHours)||maxAgeHours<=0)throw Error('positive_max_age_hours_required');

const raw=JSON.parse(fs.readFileSync(path.resolve(args.input),'utf8'));
const source=Array.isArray(raw)?raw:Array.isArray(raw.candidates)?raw.candidates:[];
const text=v=>String(v??'').replace(/\s+/g,' ').trim();
const boilerplate=/^(?:home|about(?: us)?|contact(?: us)?|privacy(?: policy)?|terms(?: of service)?|sign in|log in|training(?: &| and)? certification|links in the anthology)$/i;
const obviousNonStoryUrl=url=>/searchtype=author|\/author\/|\/authors\/|\/tag\/|\/tags\/|\/category\/|\/categories\/|\/legal\/|\/privacy(?:\/|$)|\/terms(?:\/|$)/i.test(url);
const reliabilityRank=v=>({publisher_authored:40,official_announcement:40,primary_source:40,research:32,standards:32,preprint:24,discovery_signal:12}[v]||8);
const ageRank=stamp=>{
 if(!Number.isFinite(stamp))return 0;
 const h=(cutoff-stamp)/3600000;
 if(h<0)return -1000;
 if(h<=24)return 16;
 if(h<=72)return 10;
 if(h<=168)return 4;
 return -1000;
};
const relevanceRank=value=>{
 const v=text(value).toLowerCase();
 let n=0;
 if(/\b(agent|agents|skill|skills|workflow|automation|tool use|computer use|assistant)\b/.test(v))n+=4;
 if(/\b(ai|llm|model|gemini|claude|copilot|gpt|rag|retrieval|prompt|context|evaluation|benchmark|safety|coding|github|developer)\b/.test(v))n+=3;
 if(/\b(workplace|knowledge worker|enterprise|productivity|no-code|low-code|salesforce|microsoft 365|docs|search)\b/.test(v))n+=2;
 return n;
};
const focusHint=value=>{
 const v=text(value).toLowerCase();
 if(/\b(agent|agents|skill|skills|workflow|automation|tool use|computer use|assistant)\b/.test(v))return 'agents_non_technical_people';
 if(/\b(workplace|knowledge worker|enterprise|productivity|no-code|low-code|salesforce|microsoft 365|business|docs)\b/.test(v))return 'applied_genai_knowledge_workers';
 return 'technical_ai_engineering';
};

const byUrl=new Map();
for(const item of source){
 const title=text(item.headline||item.title);
 if(title.length<20||title.length>200||boilerplate.test(title))continue;
 let url;try{url=normalizeUrl(item.canonical_url||item.url);}catch{continue;}
 if(!url.startsWith('https://')||obviousNonStoryUrl(url))continue;
 const published=item.published_at||item.publication_date||null;
 const stamp=published?Date.parse(published):NaN;
 if(Number.isFinite(stamp)&&((cutoff-stamp)/3600000>maxAgeHours||stamp>cutoff))continue;
 const normalized={
  candidate_id:text(item.candidate_id)||null,
  headline:title,
  canonical_url:url,
  publisher:text(item.publisher)||null,
  source_id:text(item.source_id)||null,
  source_reliability:text(item.source_reliability)||null,
  published_at:Number.isFinite(stamp)?new Date(stamp).toISOString():null,
  date_status:Number.isFinite(stamp)?'metadata_date_present':'metadata_date_unresolved',
  snippet:text(item.snippet).slice(0,360)||null,
  focus_hint:focusHint(title+' '+text(item.snippet)),
  status:'metadata_prefiltered_not_deep_reviewed'
 };
 const score=reliabilityRank(normalized.source_reliability)+ageRank(stamp)+relevanceRank(title+' '+normalized.snippet)+Number(!!normalized.snippet);
 const candidate={...normalized,prefilter_score:score};
 const prior=byUrl.get(url);
 if(!prior||candidate.prefilter_score>prior.prefilter_score)byUrl.set(url,candidate);
}
const eligible=[...byUrl.values()].filter(x=>x.prefilter_score>-900);
eligible.sort((a,b)=>b.prefilter_score-a.prefilter_score||String(b.published_at||'').localeCompare(String(a.published_at||''))||a.canonical_url.localeCompare(b.canonical_url));

// Source-diverse round robin after deterministic ranking.
const groups=new Map();
for(const item of eligible){
 const key=item.source_id||item.publisher||'unknown';
 if(!groups.has(key))groups.set(key,[]);
 groups.get(key).push(item);
}
const keys=[...groups.keys()].sort((a,b)=>{
 const aa=groups.get(a)[0]?.prefilter_score??0,bb=groups.get(b)[0]?.prefilter_score??0;
 return bb-aa||a.localeCompare(b);
});
const selected=[];
while(selected.length<limit&&keys.some(k=>groups.get(k).length)){
 for(const key of keys){
  if(selected.length>=limit)break;
  const item=groups.get(key).shift();
  if(item)selected.push(item);
 }
}
const candidates=selected.map((x,i)=>({...x,candidate_id:x.candidate_id||`m${String(i+1).padStart(2,'0')}`}));
if(candidates.length>limit)throw Error('under80_metadata_gate_internal_limit_violation');
const result={
 schema_version:'1.0.0',
 profile_id:'under80-v1',
 gate:'metadata_prefilter_before_model_exposure',
 cutoff:new Date(cutoff).toISOString(),
 max_age_hours:maxAgeHours,
 metadata_candidate_limit:limit,
 raw_queue_count:source.length,
 eligible_after_deterministic_filter:eligible.length,
 retained_metadata_candidates:candidates.length,
 deferred_count:Math.max(0,eligible.length-candidates.length),
 invariant:'Only the candidates array in this file is permitted as model-visible article discovery input. The raw discovery queue is traceability-only and must not be opened by the editorial model.',
 candidates
};
fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});
fs.writeFileSync(path.resolve(args.out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({out:path.resolve(args.out),raw_queue_count:source.length,eligible:eligible.length,retained:candidates.length,limit,model_visible_candidates:candidates.length}));
