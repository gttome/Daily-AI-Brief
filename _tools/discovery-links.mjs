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
  url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^ref$/.test(key))url.searchParams.delete(key);
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
