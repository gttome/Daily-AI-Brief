#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs,normalizeUrl} from '../_generator/lib/util.mjs';
import {retrieveSource,extractCandidateMetadata,publicationTimestamp} from './discovery-links.mjs';

const args=parseArgs(process.argv.slice(2));
const input=path.resolve(args.input||'_data/media-candidate-queue.json');
const receiptPath=path.resolve(args.receipt||'_records/preflight/date-enrichment.json');
const limit=Number(args.limit||48);
const cutoffMs=args.cutoff?Date.parse(args.cutoff):Date.now();
if(!Number.isInteger(limit)||limit<1||limit>64)throw Error('metadata_enrichment_limit_must_be_1_to_64');
if(!Number.isFinite(cutoffMs))throw Error('valid_cutoff_required');

const raw=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(raw.candidates))throw Error('candidate_queue_required');
const text=v=>String(v??'').replace(/\s+/g,' ').trim();
const reliability=v=>({publisher_authored:40,official_announcement:40,primary_source:40,research:32,standards:32,preprint:24,discovery_signal:12}[v]||8);
const relevance=v=>{
 const s=text(v).toLowerCase();let n=0;
 if(/\b(agent|agents|skill|skills|workflow|automation|assistant)\b/.test(s))n+=5;
 if(/\b(ai|artificial intelligence|llm|model|gemini|claude|copilot|gpt|rag|retrieval|prompt|context|evaluation|benchmark|safety|coding|developer)\b/.test(s))n+=4;
 if(/\b(workplace|enterprise|knowledge worker|productivity|no-code|low-code|microsoft 365|workspace|salesforce|zapier)\b/.test(s))n+=3;
 return n;
};
const badUrl=url=>/searchtype=author|\/author\/|\/authors\/|\/tag\/|\/tags\/|\/category\/|\/categories\/|\/legal\/|\/privacy(?:\/|$)|\/terms(?:\/|$)|\/search(?:[/?]|$)|[?&](?:q|query|search)=/i.test(url);
const sameUrl=(a,b)=>{
 try{
  const x=new URL(normalizeUrl(a)),y=new URL(normalizeUrl(b));
  return x.hostname===y.hostname&&x.pathname.replace(/\/$/,'')===y.pathname.replace(/\/$/,'');
 }catch{return false;}
};
const parseLooseDate=value=>{
 const v=text(value).replace(/^[·|\-–—,:\s]+|[·|\-–—,:\s]+$/g,'');
 if(!v||!/(?:20\d{2})/.test(v))return null;
 const t=Date.parse(v);return Number.isFinite(t)?new Date(t).toISOString():null;
};
const labeledDates=html=>{
 const clean=text(html.replace(/<[^>]+>/g,' '));
 const published=
  parseLooseDate(clean.match(/(?:published|posted)(?:\s+on)?[:\s]+([A-Z][a-z]+\s+\d{1,2},\s+20\d{2})/i)?.[1])||
  parseLooseDate(clean.match(/\b(20\d{2}-\d{2}-\d{2})(?:T[^\s]+)?\b/)?.[1]);
 const updated=
  parseLooseDate(clean.match(/(?:last\s+updated|updated)(?:\s+on)?[:\s]+([A-Z][a-z]+\s+\d{1,2},\s+20\d{2})/i)?.[1]);
 return {published,updated};
};
const structuredDates=html=>{
 const publishedValues=[],updatedValues=[];
 for(const m of html.matchAll(/["']datePublished["']\s*:\s*["']([^"']+)["']/gi))publishedValues.push(publicationTimestamp(m[1])||parseLooseDate(m[1]));
 for(const m of html.matchAll(/["']dateModified["']\s*:\s*["']([^"']+)["']/gi))updatedValues.push(publicationTimestamp(m[1])||parseLooseDate(m[1]));
 for(const m of html.matchAll(/<meta\b[^>]*(?:property|name)=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/gi))publishedValues.push(publicationTimestamp(m[1])||parseLooseDate(m[1]));
 for(const m of html.matchAll(/<meta\b[^>]*(?:property|name)=["']article:modified_time["'][^>]*content=["']([^"']+)["'][^>]*>/gi))updatedValues.push(publicationTimestamp(m[1])||parseLooseDate(m[1]));
 return {published:publishedValues.find(Boolean)||null,updated:updatedValues.find(Boolean)||null};
};

const unresolved=raw.candidates.filter(item=>{
 if(item.date_conflict===true)return false;
 if(item.published_at||item.publication_date)return false;
 const title=text(item.headline||item.title),url=text(item.canonical_url||item.url);
 if(title.length<20||title.length>200||!url.startsWith('https://')||badUrl(url))return false;
 return relevance(title+' '+text(item.snippet)+' '+text(item.required_topic))>=4;
}).sort((a,b)=>{
 const sa=(a.required_topic?100:0)+reliability(a.source_reliability)+relevance((a.headline||a.title)+' '+text(a.snippet));
 const sb=(b.required_topic?100:0)+reliability(b.source_reliability)+relevance((b.headline||b.title)+' '+text(b.snippet));
 return sb-sa||text(a.canonical_url||a.url).localeCompare(text(b.canonical_url||b.url));
}).slice(0,limit);

let attempted=0,resolved=0,failed=0,publishedResolved=0,updatedResolved=0;
const details=[];
for(let i=0;i<unresolved.length;i+=6){
 const batch=unresolved.slice(i,i+6);
 const results=await Promise.all(batch.map(async item=>{
  attempted++;
  const url=item.canonical_url||item.url;
  try{
   const response=await retrieveSource(url,{timeoutMs:10000,maxResponseBytes:1200000,maxNormalizedChars:900000});
   const sourceMeta={source_id:item.source_id||null,owner:item.publisher||null,publisher:item.publisher||null,format:'article',evidence_class:item.source_reliability||null};
   const extracted=extractCandidateMetadata(response.text,response.url||url,sourceMeta);
   const same=extracted.find(x=>sameUrl(x.canonical_url,url));
   const structured=structuredDates(response.text),labeled=labeledDates(response.text);
   const published=same?.published_at||structured.published||labeled.published||null;
   const updated=same?.updated_at||structured.updated||labeled.updated||null;
   if(published){
    const t=Date.parse(published);
    if(Number.isFinite(t)&&t<=cutoffMs+7*86400000){
      item.published_at=new Date(t).toISOString();
      item.publication_date=item.published_at;
      item.publication_dates=[item.published_at];
      item.date_source=same?.date_source||'article_page_metadata_enrichment';
      publishedResolved++;
    }
   }
   if(updated){
    const t=Date.parse(updated);
    if(Number.isFinite(t)&&t<=cutoffMs+7*86400000){
      item.updated_at=new Date(t).toISOString();
      updatedResolved++;
    }
   }
   if(item.published_at||item.updated_at){resolved++;return {url,status:'resolved',published_at:item.published_at||null,updated_at:item.updated_at||null};}
   return {url,status:'unresolved'};
  }catch(e){failed++;return {url,status:'failed',reason:e.message};}
 }));
 details.push(...results);
}
raw.updated_at=new Date().toISOString();
raw.metadata_enrichment={
 schema_version:'1.0.0',cutoff:new Date(cutoffMs).toISOString(),attempt_limit:limit,attempted,resolved,published_resolved:publishedResolved,updated_resolved:updatedResolved,failed
};
fs.writeFileSync(input,JSON.stringify(raw,null,2)+'\n');
fs.mkdirSync(path.dirname(receiptPath),{recursive:true});
fs.writeFileSync(receiptPath,JSON.stringify({schema_version:'1.0.0',cutoff:new Date(cutoffMs).toISOString(),attempt_limit:limit,attempted,resolved,published_resolved:publishedResolved,updated_resolved:updatedResolved,failed,details},null,2)+'\n');
console.log(JSON.stringify({attempted,resolved,published_resolved:publishedResolved,updated_resolved:updatedResolved,failed}));
