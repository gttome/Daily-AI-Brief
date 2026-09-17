import {acquisition} from './discovery-context.mjs';
import {retainCandidates} from '../_generator/lib/discovery-queue.mjs';
import {extractCandidateMetadata} from './discovery-links.mjs';
import fs from 'node:fs';
const retrievalCache=acquisition.cache;
const registry=JSON.parse(fs.readFileSync('_data/source-registry.json'));
const early=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const previous=fs.existsSync('_data/media-candidate-queue.json')?JSON.parse(fs.readFileSync('_data/media-candidate-queue.json')).candidates:[];
const candidates=new Map(previous.filter(c=>(Date.now()-Date.parse(c.discovered_at))/86400000<=30).map(c=>[c.url,c]));const sources=[];
const earlySources=early.channels.flatMap(channel=>channel.endpoints.map(endpoint=>({
 source_id:endpoint.source_id,discovery_endpoint:endpoint.url,status:endpoint.automated?'active':'assisted_review',
 format:endpoint.format,channel_id:channel.channel_id,broad_discovery:true,evidence_class:/preprint/.test(channel.kind)?'preprint':/official_lab/.test(channel.kind)?'publisher_authored':'discovery_signal'
})));
for(const channel of early.channels.filter(channel=>channel.endpoints.length===0||channel.endpoints.every(endpoint=>!endpoint.automated)))sources.push({source_id:channel.channel_id,status:'assisted_review_required',reason:channel.evidence_treatment});
for(const source of earlySources.filter(source=>source.status==='assisted_review'))sources.push({source_id:source.source_id,status:'assisted_review_required',reason:'This endpoint requires identity, access, runtime, and original-evidence review.'});
const monitored=[...registry.sources,...earlySources].filter((source,index,all)=>source.discovery_endpoint&&source.status==='active'&&all.findIndex(candidate=>candidate.discovery_endpoint===source.discovery_endpoint)===index);

// Keep a small high-authority core on every run and rotate the remaining source budget daily.
// This preserves breadth without paying to sweep every registered catalog before enough fresh evidence exists.
const sourceRank=s=>(s.evidence_class==='publisher_authored'?30:s.evidence_class==='preprint'?20:10)+(s.format==='rss'||s.format==='atom'?5:0)+(s.broad_discovery?0:2);
const ordered=[...monitored].sort((a,b)=>sourceRank(b)-sourceRank(a)||a.source_id.localeCompare(b.source_id));
const core=ordered.slice(0,8),rest=ordered.slice(8),rotation=rest.length?Math.abs([...date].reduce((n,c)=>n+c.charCodeAt(0),0))%rest.length:0;
const rotated=rest.length?[...rest.slice(rotation),...rest.slice(0,rotation)]:[];
const scanPlan=[...core,...rotated].filter((s,index,all)=>all.findIndex(x=>x.discovery_endpoint===s.discovery_endpoint)===index);
const MIN_SOURCES_SCANNED=12,MAX_SOURCES_SCANNED=20,FRESH_METADATA_TARGET=20,FRESH_HOURS=72;
let scanned=0,stopReason=null;
const freshMetadataCount=()=>[...candidates.values()].filter(c=>{const stamp=Date.parse(c.published_at||c.publication_date);return Number.isFinite(stamp)&&Date.now()-stamp>=0&&Date.now()-stamp<=FRESH_HOURS*3600000;}).length;

for(let i=0;i<scanPlan.length&&scanned<MAX_SOURCES_SCANNED;i+=4){
 const batch=scanPlan.slice(i,Math.min(i+4,MAX_SOURCES_SCANNED));
 await Promise.all(batch.map(async s=>{
  scanned++;
  try{const result=await acquisition.retrieve(s.discovery_endpoint);let found=0;
   for(const link of extractCandidateMetadata(result.text,result.resolved_url,s)){
    const title=link.headline;if(title.length<20||title.length>200||(!s.broad_discovery&&!/agent|AI|context|retrieval|evaluation|copilot|gemini|claude|skill|prompt|LLM/i.test(title))||found>=100)continue;
    const url=new URL(link.canonical_url);
    if(!candidates.has(url.href))candidates.set(url.href,{...link,url:url.href,title,source_id:s.source_id,format:s.format,discovered_at:new Date().toISOString(),publication_date:link.published_at,runtime_seconds:null,status:'needs_editorial_and_metadata_review'});else { const prior=candidates.get(url.href); for(const field of ['published_at','snippet','publisher','source_reliability','content_type','publication_dates','date_conflict','date_source','updated_at']) if(link[field]!=null) prior[field]=link[field]; if(link.published_at) prior.publication_date=link.published_at; if(link.date_conflict){prior.published_at=null;prior.publication_date=null;} }
    found++;
   }
   sources.push({source_id:s.source_id,status:result.cache_status==='hit'||result.cache_status==='not_modified'?'cached_metadata':'retrieved',cache_status:result.cache_status,fetched_at:result.fetched_at,candidate_links:found,checked_at:new Date().toISOString(),attempts:result.attempts});
  }catch(e){sources.push({source_id:s.source_id,status:'unavailable',reason:e.message,checked_at:new Date().toISOString(),attempts:e.attempts||[]});}
 }));
 const fresh=freshMetadataCount();
 if(scanned>=MIN_SOURCES_SCANNED&&fresh>=FRESH_METADATA_TARGET){stopReason='fresh_metadata_sufficiency';break;}
 if(retrievalCache.metrics.source_text_chars_retrieved>=retrievalCache.normalCharBudget){stopReason='normal_acquisition_budget';break;}
}
for(const s of scanPlan.slice(scanned,MAX_SOURCES_SCANNED))sources.push({source_id:s.source_id,status:'deferred',reason:stopReason||'source_scan_limit'});
const retained=retainCandidates([...candidates.values()],{limit:500});
fs.writeFileSync('_data/media-candidate-queue.json',JSON.stringify({updated_at:new Date().toISOString(),...retained},null,2)+'\n');
fs.mkdirSync('_records/discovery',{recursive:true});fs.writeFileSync(`_records/discovery/${date}.json`,JSON.stringify({date,sources:sources.sort((a,b)=>a.source_id.localeCompare(b.source_id)),queue_size:retained.candidates.length,queue_discovered:candidates.size,retention:retained.retention,early_signal_channels:early.channels.length,efficiency:{...retrievalCache.metrics,article_sources_fulltext_retrieved:0,scope:'bounded_catalog_metadata_discovery',sources_scanned:scanned,source_scan_minimum:MIN_SOURCES_SCANNED,source_scan_maximum:MAX_SOURCES_SCANNED,fresh_metadata_candidates:freshMetadataCount(),fresh_metadata_target:FRESH_METADATA_TARGET,stop_reason:stopReason||'source_scan_limit'},note:'Discovery links are unverified candidates; never select without original evidence, date, runtime where required, duplicate and quality review. Catalog acquisition stops after bounded breadth plus sufficient fresh metadata, or at the normal acquisition budget; later editorial research retains at most 20 metadata candidates.'},null,2)+'\n');
console.log(JSON.stringify({date,sources:sources.length,scanned,queue:candidates.size,fresh_metadata:freshMetadataCount(),stop_reason:stopReason||'source_scan_limit'}));
