import fs from 'node:fs';import {createHash} from 'node:crypto';
const registry=JSON.parse(fs.readFileSync('_data/watchlist-sources.json','utf8'));
const early=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));
const now=new Date().toISOString(),date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const prior=fs.existsSync('_data/watchlist-discoveries.json')?JSON.parse(fs.readFileSync('_data/watchlist-discoveries.json')).candidates:[];
const candidates=new Map(prior.map(x=>[x.url,x])),checks=[];
function clean(s){return s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
const earlySources=early.channels.flatMap(channel=>channel.endpoints.map(endpoint=>({source_id:endpoint.source_id,name:endpoint.name,endpoint:endpoint.url,automated:endpoint.automated,channel_id:channel.channel_id})));
for(const channel of early.channels.filter(channel=>channel.endpoints.length===0))checks.push({source_id:channel.channel_id,status:'assisted_review_required',reason:channel.evidence_treatment,checked_at:now});
const monitored=[...registry.sources,...earlySources].filter((source,index,all)=>source.endpoint&&all.findIndex(candidate=>candidate.endpoint===source.endpoint)===index);
for(let i=0;i<monitored.length;i+=4)await Promise.allSettled(monitored.slice(i,i+4).map(async s=>{
 if(s.automated===false){checks.push({source_id:s.source_id,status:'assisted_review_required',reason:'This channel requires identity, access, and original-evidence review.',checked_at:now});return;}
 if(!s.endpoint){checks.push({source_id:s.source_id,status:'unverified',reason:'Discovery endpoint not verified',checked_at:now});return;}
 try{const r=await fetch(s.endpoint,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'DailyAIBriefDiscovery/1.0'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const text=await r.text();let found=0;
 // Deliberately no AI-keyword whitelist: unfamiliar concepts must remain discoverable.
 for(const m of text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
 const title=clean(m[2]);if(title.length<24||title.length>220)continue;
 let u;try{u=new URL(m[1],s.endpoint);}catch{continue;}if(u.protocol!=='https:'||/login|signup|privacy|terms|subscribe|javascript/i.test(u.pathname))continue;u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^ref$/.test(k))u.searchParams.delete(k);
 const existing=candidates.get(u.href);if(existing){existing.last_seen=now;existing.source_ids=[...new Set([...existing.source_ids,s.source_id])];}else candidates.set(u.href,{id:'lead-'+createHash('sha256').update(u.href).digest('hex').slice(0,16),url:u.href,title,source_ids:[s.source_id],first_seen:now,last_seen:now,publication_date:null,disposition:'needs_research'});found++;
 }
 checks.push({source_id:s.source_id,status:found?'retrieved':'no_candidate_links',candidate_links:found,checked_at:now});
 }catch(e){checks.push({source_id:s.source_id,status:'unavailable',reason:e.message,checked_at:now});}
}));
const data={updated_at:now,candidates:[...candidates.values()].sort((a,b)=>b.last_seen.localeCompare(a.last_seen)).slice(0,2000),sources:checks.sort((a,b)=>a.source_id.localeCompare(b.source_id)),early_signal_channels:early.channels.length,note:'Discovery leads only. Work research must group by meaning, verify original evidence and dates, and evaluate novel topics before promotion. A failed retrieval is not no news; community and aggregator activity is not proof.'};
fs.writeFileSync('_data/watchlist-discoveries.json',JSON.stringify(data,null,2)+'\n');
fs.mkdirSync('_records/watchlist-discovery',{recursive:true});fs.writeFileSync(`_records/watchlist-discovery/${date}-${now.replace(/[^0-9]/g,'')}.json`,JSON.stringify(data,null,2)+'\n');
for(const source of registry.sources) source.last_check=checks.find(x=>x.source_id===source.source_id);
registry.updated_at=now;fs.writeFileSync('_data/watchlist-sources.json',JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({sources:checks.length,retrieved:checks.filter(x=>x.status==='retrieved').length,queue:data.candidates.length}));
