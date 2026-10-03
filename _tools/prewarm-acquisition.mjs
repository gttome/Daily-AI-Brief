#!/usr/bin/env node
import fs from 'node:fs';
import {acquisition} from './discovery-context.mjs';

const registry=JSON.parse(fs.readFileSync('_data/source-registry.json','utf8'));
const early=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));
const watchlist=JSON.parse(fs.readFileSync('_data/watchlist-sources.json','utf8'));
const endpoints=[];
const add=(url,priority,label)=>{if(url&&/^https:\/\//.test(url)&&!endpoints.some(x=>x.url===url))endpoints.push({url,priority,label});};
for(const source of registry.sources||[])if(source.status==='active')add(source.discovery_endpoint,source.evidence_class==='publisher_authored'?30:source.format==='rss'||source.format==='atom'?20:10,source.source_id);
for(const channel of early.channels||[])for(const endpoint of channel.endpoints||[])if(endpoint.automated!==false)add(endpoint.url,/official_lab/.test(channel.kind)?30:/preprint/.test(channel.kind)?20:10,endpoint.source_id);
for(const source of watchlist.sources||[])if(source.automated!==false)add(source.endpoint,15,source.source_id);
endpoints.sort((a,b)=>b.priority-a.priority||a.label.localeCompare(b.label));
const limit=Math.min(12,endpoints.length),started=new Date().toISOString(),results=[];
for(let i=0;i<limit;i+=4)await Promise.all(endpoints.slice(i,i+4).map(async source=>{
 try{const r=await acquisition.retrieve(source.url);results.push({source_id:source.label,url:source.url,status:r.cache_status||'retrieved',fetched_at:r.fetched_at,response_bytes:r.response_bytes??null,normalized_chars:r.normalized_chars??null});}
 catch(error){results.push({source_id:source.label,url:source.url,status:'unavailable',reason:error.message});}
}));
const ended=new Date().toISOString(),failures=results.filter(x=>x.status==='unavailable');
const receipt={schema_version:'1.0.0',mode:'acquisition_prewarm',started_at:started,ended_at:ended,elapsed_seconds:(Date.parse(ended)-Date.parse(started))/1000,endpoints_planned:limit,endpoints_succeeded:results.length-failures.length,endpoints_failed:failures.length,cache:{...acquisition.cache.metrics},results:results.sort((a,b)=>a.source_id.localeCompare(b.source_id)),rule:'Metadata-only prewarm. The publisher and Watchlist reuse this bounded acquisition cache; no semantic/model work occurs here.'};
const out=process.env.DAB_PREWARM_RECEIPT||'/tmp/dab-prewarm.json';fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
if(results.length-failures.length===0)process.exitCode=1;
