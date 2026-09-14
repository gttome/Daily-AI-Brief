import {normalizeUrl} from '../_generator/lib/util.mjs';
// Candidate extraction only: every result still needs editorial and metadata review.
export function cleanText(value){
 return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi,entity=>{
  const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
  if(named[entity.toLowerCase()])return named[entity.toLowerCase()];
  const n=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3),16):parseInt(entity.slice(2),10);
  return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';
 }).replace(/\s+/g,' ').trim();
}
export function extractLinks(html,base){
 const links=new Map();
 const source=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 for(const match of source.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)){
  const href=match[1].match(/(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if(!href)continue;
  const raw=cleanText(href[1]??href[2]??href[3]);if(!raw||raw.startsWith('#'))continue;
  let url;try{url=new URL(raw,base);}catch{continue;}
  if(url.protocol!=='https:'||url.username||url.password)continue;
  url=new URL(normalizeUrl(url.href));
  const title=cleanText(match[2]);if(!title)continue;
  if(!links.has(url.href))links.set(url.href,{url:url.href,title});
 }
 return [...links.values()];
}
export async function retrieveSource(url,{fetcher=fetch,timeoutMs=12000}={}){
 const attempts=[];
 for(let i=0;i<2;i++){
  const checked_at=new Date().toISOString();
  try{
   const response=await fetcher(url,{signal:AbortSignal.timeout(timeoutMs),headers:{'user-agent':'DailyAIBriefDiscovery/1.0'}});
   if(!response.ok){const error=new Error(`HTTP ${response.status}`);error.status=response.status;throw error;}
   const text=await response.text();attempts.push({checked_at,status:'retrieved',http_status:response.status});
   return {text,url:response.url||url,attempts};
  }catch(error){
   attempts.push({checked_at,status:'unavailable',reason:error.message});
   // One bounded retry for transport/timeouts and server errors. Do not retry access denials.
   if(i===0&&(!error.status||error.status>=500))continue;
   error.attempts=attempts;throw error;
  }
 }
}

export function extractCandidateMetadata(text, base, source = {}) {
 const candidates = new Map();
 const field = (block, tag) => {
   const match = block.match(new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)</'+tag+'\\s*>','i'));
   return match ? cleanText(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')) : null;
 };
 const add = item => {
   let url;try {url=new URL(item.url,base);}catch{return;}
   if(url.protocol!=='https:'||url.username||url.password)return;
   url=new URL(normalizeUrl(url.href));
   const parsed=publicationTimestamp(item.published_at),prior=candidates.get(url.href);
   const dates=[...new Set([...(prior?.publication_dates||[]),parsed].filter(Boolean))];
   candidates.set(url.href,{source_id:source.source_id||null,publisher:source.owner||source.publisher||null,
     headline:item.title,canonical_url:url.href,published_at:dates.length===1?dates[0]:null,publication_dates:dates,date_conflict:dates.length>1,
     updated_at:publicationTimestamp(item.updated_at)||prior?.updated_at||null,date_source:item.date_source||prior?.date_source||null,
     snippet:item.snippet?item.snippet.slice(0,600):null,content_type:source.format||'article',
     retrieval_status:'metadata_only',source_reliability:source.evidence_class||null});
 };
 for(const link of extractLinks(text,base))add(link);
 for(const match of text.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)){
   const block=match[2],title=field(block,'title');if(!title)continue;
   let url=field(block,'link');
   if(!url)for(const link of block.matchAll(/<link\b([^>]*)\/?\s*>/gi)){
     const rel=link[1].match(/\brel=["']([^"']+)["']/i)?.[1];
     if(rel&&rel!=='alternate')continue;
     url=link[1].match(/\bhref=["']([^"']+)["']/i)?.[1];if(url)break;
   }
   if(url)add({url:cleanText(url),title,published_at:field(block,'pubDate')||field(block,'published'),snippet:field(block,'description')||field(block,'summary')});
 }
 for(const item of structuredArticles(text,base))add(item);
 return [...candidates.values()];
}
// Publication dates belong to an article, never to every link on its catalog page.
export function publicationTimestamp(value){
 if(typeof value!=='string'||!value.trim())return null;
 const v=value.trim();
 if(/^\d{4}-\d{2}-\d{2}$/.test(v)){
  const stamp=Date.parse(v+'T00:00:00Z');return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===v?new Date(stamp).toISOString():null;
 }
 if(!/(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)\s*$/i.test(v))return null;
 const stamp=Date.parse(v);return Number.isFinite(stamp)?new Date(stamp).toISOString():null;
}
export function structuredArticles(html,base){
 const found=[];
 const visit=value=>{
  if(Array.isArray(value)){value.forEach(visit);return;}
  if(!value||typeof value!=='object')return;
  const types=[value['@type']].flat();
  if(types.some(t=>/^(?:Article|NewsArticle|BlogPosting|TechArticle|ScholarlyArticle|VideoObject|PodcastEpisode)$/.test(t))){
   const url=value.url||value.mainEntityOfPage?.['@id']||value.mainEntityOfPage||value['@id'];
   if(typeof url==='string')found.push({url,title:value.headline||value.name,published_at:value.datePublished,updated_at:value.dateModified,snippet:value.description,date_source:'structured_article'});
  }
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);
 };
 for(const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{visit(JSON.parse(script[1]));}catch{}
 for(const card of html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)){
  const content=card[1],date=content.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1];
  if(!date)continue;
  // Only the card headline gets its date, not navigation or related links.
  const heading=content.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  const link=heading&&extractLinks(heading,base)[0];
  if(link)found.push({...link,published_at:date,date_source:'article_card_time'});
 }
 const metas={};for(const tag of html.matchAll(/<meta\b([^>]+)>/gi)){
  const k=tag[1].match(/(?:property|name)=["']([^"']+)["']/i)?.[1],v=tag[1].match(/content=["']([^"']*)["']/i)?.[1];if(k&&v)metas[k.toLowerCase()]=cleanText(v);
 }
 if(metas['article:published_time'])found.push({url:metas['og:url']||base,title:metas['og:title']||cleanText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''),published_at:metas['article:published_time'],updated_at:metas['article:modified_time'],date_source:'article_meta'});
 return found.filter(x=>x.title);
}
export function extractMainText(html){
 const withoutNoise=html.replace(/<(script|style|nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
 const article=withoutNoise.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
 const main=withoutNoise.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
 const text=cleanText(article||main||withoutNoise);
 return {text,extraction_method:article?'article_element':main?'main_element':'page_text_requires_review',main_text_verified:false,
  word_count:text?text.split(/\s+/).length:0,reading_minutes:null};
}
