
import {extractLinks,retrieveSource} from './discovery-links.mjs';
import {watchlistDue,recordWatchlistCheck,incrementalCoverage} from '../_generator/lib/incremental-watchlist.mjs';
import {sha256} from '../_generator/lib/util.mjs';
import fs from 'node:fs';
const started=Date.now(),registry=JSON.parse(fs.readFileSync('_data/watchlist-sources.json','utf8'));
const early=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));
const now=new Date().toISOString(),date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const prior=fs.existsSync('_data/watchlist-discoveries.json')?JSON.parse(fs.readFileSync('_data/watchlist-discoveries.json')).candidates:[];
const stateFile='_data/watchlist-source-state.json';
let stored={};try{const record=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(record.schema_version==='1.0.0')stored=record.sources||{};}catch{}
const candidates=new Map(prior.map(x=>[x.url,x])),checks=[],nextState={};
const earlySources=early.channels.flatMap(channel=>channel.endpoints.map(endpoint=>({source_id:endpoint.source_id,name:endpoint.name,endpoint:endpoint.url,automated:endpoint.automated,channel_id:channel.channel_id})));
for(const channel of early.channels.filter(channel=>channel.endpoints.length===0))checks.push({source_id:channel.channel_id,status:'assisted_review_required',reason:channel.evidence_treatment,checked_at:now});
const monitored=[...registry.sources,...earlySources].filter((source,index,all)=>source.endpoint&&all.findIndex(candidate=>candidate.endpoint===source.endpoint)===index);
for(let i=0;i<monitored.length;i+=4)await Promise.all(monitored.slice(i,i+4).map(async s=>{
 const previous=stored[s.source_id],force=process.argv.includes('--full-sweep');
 if(!watchlistDue(s,previous,now,{force})){
   nextState[s.source_id]=previous;
   checks.push({source_id:s.source_id,status:'not_due',previous_status:previous.status,last_successful_check:previous.last_successful_check,next_check_at:previous.next_check_at,checked_at:null});
   return;
 }
 if(s.automated===false){
   nextState[s.source_id]=recordWatchlistCheck(s,previous,{now,status:'assisted_review_required'});
   checks.push({source_id:s.source_id,status:'assisted_review_required',reason:'Requires identity, access, and original-evidence review.',checked_at:now});return;
 }
 try{
   const result=await retrieveSource(s.endpoint),fingerprint=sha256(result.text);
   let leads;
   const unchanged=previous?.endpoint===s.endpoint&&previous.last_content_fingerprint===fingerprint;
   if(unchanged&&previous.candidate_urls?.every(url=>candidates.has(url)))leads=previous.candidate_urls.map(url=>({url}));
   else{
     leads=extractLinks(result.text,result.url).filter(link=>link.title.length>=24&&link.title.length<=220&&!/login|signup|privacy|terms|subscribe|javascript/i.test(new URL(link.url).pathname));
     for(const link of leads){
       const existing=candidates.get(link.url);
       if(existing){existing.last_seen=now;existing.source_ids=[...new Set([...existing.source_ids,s.source_id])];}
       else candidates.set(link.url,{id:'lead-'+sha256(link.url).slice(0,16),url:link.url,title:link.title,source_ids:[s.source_id],first_seen:now,last_seen:now,publication_date:null,disposition:'needs_research'});
     }
   }
   const status=leads.length?'retrieved':'no_candidate_links';
   nextState[s.source_id]=recordWatchlistCheck(s,previous,{now,text:result.text,candidates:leads,status});
   checks.push({source_id:s.source_id,status,unchanged,candidate_links:leads.length,attempts:result.attempts,checked_at:new Date().toISOString()});
 }catch(e){
   nextState[s.source_id]=recordWatchlistCheck(s,previous,{now,status:'unavailable',reason:e.message});
   checks.push({source_id:s.source_id,status:'unavailable',reason:e.message,attempts:e.attempts||[],checked_at:new Date().toISOString()});
 }
}));
const incremental=incrementalCoverage(checks);
const coverage={checked:incremental.sources_checked,retrieval_success:checks.filter(x=>['retrieved','no_candidate_links'].includes(x.status)).length,with_candidate_links:incremental.sources_returning_candidate_links,no_candidate_links:checks.filter(x=>x.status==='no_candidate_links').length,retrieval_failures:incremental.unavailable,assisted_review_required:incremental.assisted_review_required,...incremental};
const data={updated_at:now,coverage,candidates:[...candidates.values()].sort((a,b)=>b.last_seen.localeCompare(a.last_seen)).slice(0,2000),sources:checks.sort((a,b)=>a.source_id.localeCompare(b.source_id)),early_signal_channels:early.channels.length,efficiency:{...incremental,watchlist_seconds:(Date.now()-started)/1000},note:'Incremental discovery leads only. Not-due checks retain prior evidence and original timestamps. No links, assisted review and unavailable sources remain distinct. Work must verify original evidence, group related developments and update only affected topics. Verified public topic state is retained independently.'};
fs.writeFileSync('_data/watchlist-discoveries.json',JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(stateFile,JSON.stringify({schema_version:'1.0.0',updated_at:now,sources:nextState},null,2)+'\n');
fs.mkdirSync('_records/watchlist-discovery',{recursive:true});
fs.writeFileSync('_records/watchlist-discovery/'+date+'-'+now.replace(/[^0-9]/g,'')+'.json',JSON.stringify(data,null,2)+'\n',{flag:'wx'});
for(const source of registry.sources){const check=checks.find(x=>x.source_id===source.source_id);if(check?.status!=='not_due')source.last_check=check;}
registry.updated_at=now;fs.writeFileSync('_data/watchlist-sources.json',JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({sources:checks.length,coverage,queue:data.candidates.length}));
