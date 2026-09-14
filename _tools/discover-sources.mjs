import {acquisition} from './discovery-context.mjs';
import {retainCandidates} from '../_generator/lib/discovery-queue.mjs';
import {extractCandidateMetadata,retrieveSource} from './discovery-links.mjs';
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
const monitored=[...registry.sources,...earlySources].filter((source,index,all)=>source.discovery_endpoint&&all.findIndex(candidate=>candidate.discovery_endpoint===source.discovery_endpoint)===index);
for(let i=0;i<monitored.length;i+=5)await Promise.all(monitored.slice(i,i+5).filter(s=>s.status==='active').map(async s=>{
 try{const result=await acquisition.retrieve(s.discovery_endpoint);let found=0;
 for(const link of extractCandidateMetadata(result.text,result.resolved_url,s)){
 const title=link.headline;if(title.length<20||title.length>200||(!s.broad_discovery&&!/agent|AI|context|retrieval|evaluation|copilot|gemini|claude|skill|prompt|LLM/i.test(title))||found>=100)continue;
 const url=new URL(link.canonical_url);
 if(!candidates.has(url.href))candidates.set(url.href,{...link,url:url.href,title,source_id:s.source_id,format:s.format,discovered_at:new Date().toISOString(),publication_date:link.published_at,runtime_seconds:null,status:'needs_editorial_and_metadata_review'});else { const prior=candidates.get(url.href); for(const field of ['published_at','snippet','publisher','source_reliability','content_type','publication_dates','date_conflict','date_source','updated_at']) if(link[field]!=null) prior[field]=link[field]; if(link.published_at) prior.publication_date=link.published_at; if(link.date_conflict){prior.published_at=null;prior.publication_date=null;} }found++;
 }sources.push({source_id:s.source_id,status:result.cache_status==='hit'?'cached_metadata':'retrieved',cache_status:result.cache_status,fetched_at:result.fetched_at,candidate_links:found,checked_at:new Date().toISOString(),attempts:result.attempts});
 }catch(e){sources.push({source_id:s.source_id,status:'unavailable',reason:e.message,checked_at:new Date().toISOString(),attempts:e.attempts||[]});}
}));
const retained=retainCandidates([...candidates.values()],{limit:500});
fs.writeFileSync('_data/media-candidate-queue.json',JSON.stringify({updated_at:new Date().toISOString(),...retained},null,2)+'\n');
fs.mkdirSync('_records/discovery',{recursive:true});fs.writeFileSync(`_records/discovery/${date}.json`,JSON.stringify({date,sources:sources.sort((a,b)=>a.source_id.localeCompare(b.source_id)),queue_size:retained.candidates.length,queue_discovered:candidates.size,retention:retained.retention,early_signal_channels:early.channels.length,efficiency:{...retrievalCache.metrics,article_sources_fulltext_retrieved:0,scope:'catalog_metadata_discovery_only'},note:'Discovery links are unverified candidates; never select without original evidence, date, runtime where required, duplicate and quality review. Community and aggregator leads require an original-source check.'},null,2)+'\n');
console.log(JSON.stringify({date,sources:sources.length,queue:candidates.size}));
