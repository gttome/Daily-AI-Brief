import {normalizeUrl} from './util.mjs';
// Stable ordering and source round-robin avoid network-completion-order selection.
export function retainCandidates(items,{limit=500}={}){
 if(!Number.isInteger(limit)||limit<1)throw Error('Positive queue limit required');
 const byUrl=new Map();
 const score=x=>Number(x.owner_priority==='high')*10+Number(!!(x.published_at||x.publication_date))*2+Number(!!x.snippet);
 for(const input of [...items].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))){
  let url;try{const parsed=new URL(input.canonical_url||input.url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)continue;url=normalizeUrl(parsed.href);}catch{continue;}
  const prior=byUrl.get(url),x={...input,url,canonical_url:url};
  const chosen=prior&&score(prior)>score(x)?prior:x;
  const sources=[...new Set([...(prior?.source_ids||[]),prior?.source_id,...(x.source_ids||[]),x.source_id].filter(Boolean))].sort();
  byUrl.set(url,{...chosen,source_ids:sources,source_id:sources[0]||chosen.source_id||null});
 }
 const compare=(a,b)=>score(b)-score(a)||String(b.published_at||b.publication_date||'').localeCompare(String(a.published_at||a.publication_date||''))||a.url.localeCompare(b.url);
 const groups=new Map();for(const item of [...byUrl.values()].sort(compare)){const key=item.source_id||'unknown';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
 const keys=[...groups.keys()].sort(),selected=[];
 while(selected.length<limit&&keys.some(k=>groups.get(k).length))for(const k of keys){if(selected.length>=limit)break;const item=groups.get(k).shift();if(item)selected.push(item);}
 const kept=new Set(selected.map(x=>x.url));
 return {candidates:selected,retention:{policy:'source_round_robin_priority_recency_url_v1',discovered_unique:byUrl.size,retained:selected.length,
  overflow:[...byUrl.values()].filter(x=>!kept.has(x.url)).sort(compare).map(x=>({url:x.url,source_ids:x.source_ids,reason:'queue_capacity_not_editorial_rejection'}))}};
}
