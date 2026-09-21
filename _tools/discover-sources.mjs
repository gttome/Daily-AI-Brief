import {acquisition} from './discovery-context.mjs';
import {retainCandidates} from '../_generator/lib/discovery-queue.mjs';
import {extractCandidateMetadata} from './discovery-links.mjs';
import fs from 'node:fs';
const retrievalCache=acquisition.cache;
const registry=JSON.parse(fs.readFileSync('_data/source-registry.json'));
const early=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));
const requiredTopics=JSON.parse(fs.readFileSync('_data/required-topic-sources.json','utf8'));
const preflightPlan=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
const cutoffMs=process.env.DAB_RESEARCH_CUTOFF?Date.parse(process.env.DAB_RESEARCH_CUTOFF):Date.now();
if(!Number.isFinite(cutoffMs))throw Error('Invalid DAB_RESEARCH_CUTOFF');
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date(cutoffMs));
const freshDiscovery=process.env.DAB_DISCOVERY_FRESH==='1';
const previous=!freshDiscovery&&fs.existsSync('_data/media-candidate-queue.json')?JSON.parse(fs.readFileSync('_data/media-candidate-queue.json')).candidates:[];
const candidates=new Map(previous.filter(c=>{const discovered=Date.parse(c.discovered_at);return Number.isFinite(discovered)&&cutoffMs-discovered>=0&&cutoffMs-discovered<=30*86400000;}).map(c=>[c.url,c]));const sources=[];
const preflightSources=(preflightPlan.sources||[]).map(source=>({...source,preflight_priority:true}));
const preferredRegistrySources=registry.sources.map(source=>{
 const feed=(source.publisher_linked_feed_leads||[]).find(url=>typeof url==='string'&&url.startsWith('https://'));
 if(!feed)return source;
 return {...source,discovery_endpoint:feed,format:/atom/i.test(feed)?'atom':'rss',catalog_endpoint:source.discovery_endpoint,feed_preferred:true};
});
const requiredSources=requiredTopics.topics.flatMap(topic=>topic.sources.map(source=>({
 ...source,required_topic:topic.topic_id,required_topic_fallback_days:topic.fallback_days,required_topic_slot:topic.required_slots
})));
const earlySources=early.channels.flatMap(channel=>channel.endpoints.map(endpoint=>({
 source_id:endpoint.source_id,discovery_endpoint:endpoint.url,status:endpoint.automated?'active':'assisted_review',
 format:endpoint.format,channel_id:channel.channel_id,broad_discovery:true,evidence_class:/preprint/.test(channel.kind)?'preprint':/official_lab/.test(channel.kind)?'publisher_authored':'discovery_signal'
})));
for(const channel of early.channels.filter(channel=>channel.endpoints.length===0||channel.endpoints.every(endpoint=>!endpoint.automated)))sources.push({source_id:channel.channel_id,status:'assisted_review_required',reason:channel.evidence_treatment});
for(const source of earlySources.filter(source=>source.status==='assisted_review'))sources.push({source_id:source.source_id,status:'assisted_review_required',reason:'This endpoint requires identity, access, runtime, and original-evidence review.'});
const monitored=[...preflightSources,...requiredSources,...preferredRegistrySources,...earlySources].filter((source,index,all)=>source.discovery_endpoint&&source.status==='active'&&all.findIndex(candidate=>candidate.discovery_endpoint===source.discovery_endpoint)===index);

// Keep a small high-authority core on every run and rotate the remaining source budget daily.
// This preserves breadth without paying to sweep every registered catalog before enough fresh evidence exists.
const sourceRank=s=>(s.preflight_priority?100:0)+(s.required_topic?60:0)+(s.evidence_class==='publisher_authored'?30:s.evidence_class==='preprint'?20:10)+(s.format==='rss'||s.format==='atom'?8:0)+(s.broad_discovery?0:2);
const ordered=[...monitored].sort((a,b)=>sourceRank(b)-sourceRank(a)||a.source_id.localeCompare(b.source_id));
const balanceFocusOrder=list=>{
 const focusOrder=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
 const buckets=new Map(focusOrder.map(f=>[f,list.filter(s=>s.focus_hint===f)]));
 const other=list.filter(s=>!focusOrder.includes(s.focus_hint));
 const balanced=[];
 while(focusOrder.some(f=>buckets.get(f).length)){
  for(const f of focusOrder){const next=buckets.get(f).shift();if(next)balanced.push(next);}
 }
 return [...balanced,...other];
};
const preflightCore=balanceFocusOrder(ordered.filter(s=>s.preflight_priority)),requiredCore=ordered.filter(s=>s.required_topic&&!s.preflight_priority),ordinary=ordered.filter(s=>!s.required_topic&&!s.preflight_priority),core=[...preflightCore,...requiredCore,...ordinary.slice(0,6)],rest=ordinary.slice(6),rotation=rest.length?Math.abs([...date].reduce((n,c)=>n+c.charCodeAt(0),0))%rest.length:0;
const rotated=rest.length?[...rest.slice(rotation),...rest.slice(0,rotation)]:[];
const scanPlan=[...core,...rotated].filter(s=>s.pinned_candidate!==true).filter((s,index,all)=>all.findIndex(x=>x.discovery_endpoint===s.discovery_endpoint)===index);
const MIN_SOURCES_SCANNED=Math.max(1,Math.min(24,Number(process.env.DAB_SOURCE_SCAN_MIN||12)));
const MAX_SOURCES_SCANNED=Math.max(MIN_SOURCES_SCANNED,Math.min(64,Number(process.env.DAB_SOURCE_SCAN_MAX||24)));
const FRESH_METADATA_TARGET=Math.max(9,Math.min(40,Number(process.env.DAB_FRESH_METADATA_TARGET||20))),FRESH_HOURS=72;
let scanned=0,stopReason=null;
const isFreshMetadata=c=>{
 const published=Date.parse(c.published_at||c.publication_date),updated=Date.parse(c.updated_at);
 const ordinary=Number.isFinite(published)&&cutoffMs-published>=0&&cutoffMs-published<=FRESH_HOURS*3600000;
 const required=c.required_topic&&Number.isFinite(updated)&&cutoffMs-updated>=0&&cutoffMs-updated<=(c.required_topic_fallback_days||7)*86400000;
 return ordinary||required;
};
const freshMetadataCount=()=>[...candidates.values()].filter(isFreshMetadata).length;
const freshFocusCoverage=()=>Object.fromEntries(['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'].map(f=>[f,[...candidates.values()].filter(c=>isFreshMetadata(c)&&c.focus_hint===f).length]));

// Seed explicitly pinned first-party candidates whose catalog pages are reliable but whose own title/date
// may not be discoverable from the catalog markup. These remain metadata-only and still require evidence review.
for(const s of preflightSources.filter(source=>source.pinned_candidate===true&&source.canonical_url&&source.candidate_title)){
  try{
    const key=new URL(s.canonical_url).href;
    const published=s.known_publication_date||null;
    if(!candidates.has(key))candidates.set(key,{
      source_id:s.source_id,publisher:s.owner||null,headline:s.candidate_title,canonical_url:key,url:key,
      published_at:published,publication_date:published,publication_dates:published?[published]:[],
      date_conflict:false,updated_at:null,date_source:'pinned_first_party_metadata',
      snippet:s.candidate_snippet||null,content_type:'article',retrieval_status:'metadata_only',
      source_reliability:s.evidence_class||'publisher_authored',format:'article',discovered_at:new Date().toISOString(),
      runtime_seconds:null,focus_hint:s.focus_hint||null,background_only:false,material_update_verified:false,
      status:'needs_editorial_and_metadata_review'
    });
  }catch{}
}

// Seed exact required-topic pages with authoritative registry dates so mandatory topics are not lost
// merely because a single article page has weak catalog markup. These remain metadata-only candidates
// and still require deep review before selection.
for(const s of requiredSources){
  if(!s.canonical_url)continue;
  const title=s.source_id==='openai-academy-skills'?'Skills — OpenAI Academy':
    s.source_id==='anthropic-research-skills'?'Claude Skills: Customize AI for your workflows':
    s.source_id==='anthropic-engineering-agent-skills'?'Equipping agents for the real world with Agent Skills':s.source_id;
  const published=s.known_publication_date||null,updated=s.known_updated_at||null;
  const key=new URL(s.canonical_url).href;
  if(!candidates.has(key))candidates.set(key,{
    source_id:s.source_id,publisher:s.owner||null,headline:title,canonical_url:key,url:key,
    published_at:published,publication_date:published,publication_dates:published?[published]:[],
    date_conflict:false,updated_at:updated,date_source:s.date_source||'required_topic_registry',
    snippet:'Authoritative required-topic source for reusable Agent Skills.',
    content_type:'article',retrieval_status:'metadata_only',source_reliability:s.evidence_class||'publisher_authored',
    format:'article',discovered_at:new Date().toISOString(),runtime_seconds:null,
    required_topic:s.required_topic||'agent_skills',required_topic_fallback_days:s.required_topic_fallback_days||7,
    background_only:s.background_only===true,material_update_verified:s.material_update_verified===true,
    status:'needs_editorial_and_metadata_review'
  });
}

for(let i=0;i<scanPlan.length&&scanned<MAX_SOURCES_SCANNED;i+=4){
 const batch=scanPlan.slice(i,Math.min(i+4,MAX_SOURCES_SCANNED));
 await Promise.all(batch.map(async s=>{
  scanned++;
  try{const result=await acquisition.retrieve(s.discovery_endpoint);let found=0;
   for(const link of extractCandidateMetadata(result.text,result.resolved_url,s)){
    const title=link.headline;if(title.length<20||title.length>200||(!s.broad_discovery&&!/agent|AI|chatgpt|gpt|codex|context|retrieval|evaluation|copilot|gemini|claude|skill|prompt|LLM/i.test(title))||found>=100)continue;
    const url=new URL(link.canonical_url);
    const canonicalRequired=s.required_topic&&(()=>{try{return new URL(s.canonical_url||s.discovery_endpoint).hostname===url.hostname&&new URL(s.canonical_url||s.discovery_endpoint).pathname.replace(/\/$/,'')===url.pathname.replace(/\/$/,'');}catch{return false;}})();
    const topicalRequired=s.required_topic&&/agent skills?|ai skills?|skill\.md|skills\.md|reusable agent workflows?|reusable workflows?/i.test(title+' '+(link.snippet||''));
    const requiredTopic=canonicalRequired||topicalRequired?s.required_topic:null;
    if(!candidates.has(url.href))candidates.set(url.href,{...link,url:url.href,title,source_id:s.source_id,format:s.format,discovered_at:new Date().toISOString(),publication_date:link.published_at,runtime_seconds:null,focus_hint:s.focus_hint||null,required_topic:requiredTopic,required_topic_fallback_days:requiredTopic?(s.required_topic_fallback_days||7):null,background_only:s.background_only===true,material_update_verified:s.material_update_verified===true,status:'needs_editorial_and_metadata_review'});else { const prior=candidates.get(url.href); if(s.focus_hint&&!prior.focus_hint)prior.focus_hint=s.focus_hint; if(requiredTopic){prior.required_topic=requiredTopic;prior.required_topic_fallback_days=s.required_topic_fallback_days||7;} for(const field of ['published_at','snippet','publisher','source_reliability','content_type','publication_dates','date_conflict','date_source','updated_at']) if(link[field]!=null) prior[field]=link[field]; if(link.published_at) prior.publication_date=link.published_at; if(link.date_conflict){prior.published_at=null;prior.publication_date=null;} }
    found++;
   }
   if(s.required_topic&&s.canonical_url&&s.candidate_title){
    try{
     const direct=new URL(s.canonical_url).href;
     if(!candidates.has(direct)){
      candidates.set(direct,{source_id:s.source_id,publisher:s.owner||s.publisher||null,headline:s.candidate_title,title:s.candidate_title,canonical_url:direct,url:direct,published_at:null,publication_date:null,publication_dates:[],date_conflict:false,updated_at:null,date_source:null,snippet:null,content_type:'article',source_reliability:s.evidence_class||'publisher_authored',format:'article',discovered_at:new Date().toISOString(),runtime_seconds:null,focus_hint:s.focus_hint||'agents_non_technical_people',required_topic:s.required_topic,required_topic_fallback_days:s.required_topic_fallback_days||7,background_only:s.background_only===true,material_update_verified:s.material_update_verified===true,status:'needs_editorial_and_metadata_review'});
      found++;
     }
    }catch{}
   }
   sources.push({source_id:s.source_id,status:result.cache_status==='hit'||result.cache_status==='not_modified'?'cached_metadata':'retrieved',cache_status:result.cache_status,fetched_at:result.fetched_at,candidate_links:found,checked_at:new Date().toISOString(),attempts:result.attempts});
  }catch(e){sources.push({source_id:s.source_id,status:'unavailable',reason:e.message,checked_at:new Date().toISOString(),attempts:e.attempts||[]});}
 }));
 const fresh=freshMetadataCount();
 const focusCoverage=freshFocusCoverage();
 if(scanned>=MIN_SOURCES_SCANNED&&fresh>=FRESH_METADATA_TARGET&&Object.values(focusCoverage).every(n=>n>=3)){stopReason='fresh_metadata_and_focus_sufficiency';break;}
 if(retrievalCache.metrics.source_text_chars_retrieved>=retrievalCache.normalCharBudget){stopReason='normal_acquisition_budget';break;}
}
for(const s of scanPlan.slice(scanned,MAX_SOURCES_SCANNED))sources.push({source_id:s.source_id,status:'deferred',reason:stopReason||'source_scan_limit'});
const retained=retainCandidates([...candidates.values()],{limit:500});
fs.writeFileSync('_data/media-candidate-queue.json',JSON.stringify({updated_at:new Date().toISOString(),...retained},null,2)+'\n');
fs.mkdirSync('_records/discovery',{recursive:true});fs.writeFileSync(`_records/discovery/${date}.json`,JSON.stringify({date,research_cutoff_at:new Date(cutoffMs).toISOString(),sources:sources.sort((a,b)=>a.source_id.localeCompare(b.source_id)),queue_size:retained.candidates.length,queue_discovered:candidates.size,retention:retained.retention,early_signal_channels:early.channels.length,efficiency:{...retrievalCache.metrics,article_sources_fulltext_retrieved:0,scope:'bounded_catalog_metadata_discovery',sources_scanned:scanned,source_scan_minimum:MIN_SOURCES_SCANNED,source_scan_maximum:MAX_SOURCES_SCANNED,fresh_metadata_candidates:freshMetadataCount(),fresh_metadata_target:FRESH_METADATA_TARGET,required_topic_sources:requiredSources.length,preferred_feed_sources:preferredRegistrySources.filter(x=>x.feed_preferred).length,preflight_sources:preflightSources.length,stop_reason:stopReason||'source_scan_limit'},note:'Discovery links are unverified candidates; never select without original evidence, date, runtime where required, duplicate and quality review. Catalog acquisition stops after bounded breadth plus sufficient fresh metadata, or at the normal acquisition budget; later editorial research retains at most 20 metadata candidates.'},null,2)+'\n');
console.log(JSON.stringify({date,research_cutoff_at:new Date(cutoffMs).toISOString(),fresh_discovery:freshDiscovery,sources:sources.length,scanned,queue:candidates.size,fresh_metadata:freshMetadataCount(),stop_reason:stopReason||'source_scan_limit'}));
