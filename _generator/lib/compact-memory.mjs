import fs from 'node:fs';
import path from 'node:path';
import {parseHistoricalBrief} from './historical.mjs';
import {noveltyMatches} from './novelty.mjs';
import {sha256} from './util.mjs';
const VERSION='compact-memory-v1';
export function compactMemory(repoRoot,endDate,{cacheFile=null,days=30}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||days!==30)throw Error('A dated 30-day novelty window is required');
 const end=Date.parse(endDate+'T00:00:00Z');
 if(!Number.isFinite(end)||new Date(end).toISOString().slice(0,10)!==endDate)throw Error('Invalid end date');
 const startDate=new Date(end-29*86400000).toISOString().slice(0,10);
 const dates=fs.readdirSync(path.join(repoRoot,'briefs')).map(n=>n.match(/^(\d{4}-\d{2}-\d{2})\.md$/)?.[1]).filter(d=>d&&d>=startDate&&d<=endDate).sort();
 const implementation=sha256(fs.readFileSync(new URL('./historical.mjs',import.meta.url),'utf8')+fs.readFileSync(new URL('./compact-memory.mjs',import.meta.url),'utf8'));
 let cached=null;try{cached=JSON.parse(fs.readFileSync(cacheFile,'utf8'));}catch{}
 if(cached?.version!==VERSION||cached?.implementation!==implementation||cached?.entries_hash!==sha256(JSON.stringify(cached.entries)))cached=null;
 const entries={},stories=[];let reused=0,parsed=0;
 for(const date of dates){
   const text=fs.readFileSync(path.join(repoRoot,'briefs',date+'.md'),'utf8'),hash=sha256(text);
   const previous=cached?.entries?.[date];
   let records;
   if(previous?.source_hash===hash&&Array.isArray(previous.stories)){records=previous.stories;reused++;}
   else{records=parseHistoricalBrief(text,date).map(s=>({story_id:s.story_id,brief_date:s.brief_date,headline:s.headline,
     concept_tokens:s.concept_tokens,normalized_urls:s.normalized_urls,normalized_topic:s.topics,
     headline_fingerprint:sha256(s.headline),entities:s.source_organization?[s.source_organization]:[],
     event_type:null,semantic_summary:s.summary.slice(0,240),canonical_url:s.normalized_urls[0]||null,
     evidence_ref:'briefs/'+date+'.md'}));parsed++;}
   entries[date]={source_hash:hash,stories:records};stories.push(...records);
 }
 const memory={schema_version:'1.0.0',window:{start_date:startDate,end_date:endDate,days},editions_scanned:dates,stories};
 if(cacheFile){fs.mkdirSync(path.dirname(cacheFile),{recursive:true});fs.writeFileSync(cacheFile,JSON.stringify({version:VERSION,implementation,entries_hash:sha256(JSON.stringify(entries)),entries}));}
 return {memory,telemetry:{historical_index_records_loaded:stories.length,historical_context_chars:JSON.stringify(memory).length,briefs_reparsed:parsed,briefs_reused:reused}};
}
export function queryCompactMemory(candidate,memory,options={}){
 const matches=noveltyMatches(candidate,memory.stories,options);
 return {matches,requires_historical_evidence_review:matches.length>0,evidence_refs:matches.map(m=>memory.stories.find(s=>s.story_id===m.prior_story_id)?.evidence_ref),
   note:'The existing concept/source matching rules are preserved. Ambiguous matches require original historical evidence; this result does not authorize a repeat.'};
}
