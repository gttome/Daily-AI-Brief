import {normalizeUrl,sha256} from './util.mjs';
const url=value=>{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw Error('Public HTTPS evidence URL required');return normalizeUrl(u.href);};
const timestamp=value=>{if(!value)return null;const t=Date.parse(value);if(!Number.isFinite(t)||!/^\d{4}-\d{2}-\d{2}T/.test(value)||new Date(value.slice(0,10)).toISOString().slice(0,10)!==value.slice(0,10)||!/(Z|[+-]\d{2}:\d{2})$/.test(value))throw Error('Explicit timestamp and timezone required');return new Date(t).toISOString();};
export function mediaIdentity(record){
 const canonical=url(record.canonical_url),u=new URL(canonical);
 if(record.kind==='video'){
  const id=u.hostname==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)?u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1]:null;
  if(id){if(!/^[\w-]{11}$/.test(id))throw Error('Invalid video identity');return 'youtube:'+id;}
 }
 if(record.kind==='podcast'&&record.episode_guid){if(!record.feed_url)throw Error('Episode GUID requires its publisher feed');return 'episode:'+sha256(url(record.feed_url)+'\n'+record.episode_guid);}
 if(!['video','podcast'].includes(record.kind))throw Error('Video or podcast evidence required');
 return record.kind+':'+sha256(canonical);
}
export function normalizeMediaEvidence(record){
 const identity=mediaIdentity(record),canonical_url=url(record.canonical_url),aliases=[...new Set([canonical_url,...(record.aliases||[]).map(url)])].sort();
 if(identity.startsWith('youtube:')&&aliases.some(alias=>{const other=mediaIdentity({kind:'video',canonical_url:alias});return other.startsWith('youtube:')&&other!==identity;}))throw Error('Distinct video IDs cannot share identity');
 if(aliases.length>1&&record.aliases_reviewed!==true)throw Error('Cross-platform identity requires explicit alias review');
 const source=record.source,review=record.review;
 if(!source||typeof source.text!=='string'||!source.text.trim()||!review||review.status!=='reviewed'||!review.reviewer||!timestamp(review.reviewed_at)||review.source_content_hash!==sha256(source.text))throw Error('Matching reviewed source evidence required');
 if(!Array.isArray(review.excerpts)||!review.excerpts.length||review.excerpts.some(x=>typeof x!=='string'||!x.trim()||!source.text.includes(x)))throw Error('Exact reviewed source excerpts required');
 const published_at=timestamp(record.published_at),checked_at=timestamp(source.checked_at);
 if(!checked_at)throw Error('Evidence observation time required');
 const runtime_seconds=record.runtime_seconds??null;
 if(runtime_seconds!==null&&(!Number.isInteger(runtime_seconds)||runtime_seconds<=0))throw Error('Runtime must be positive seconds or unknown');
 return {schema_version:'1.0.0',identity,kind:record.kind,canonical_url,aliases,title:record.title||null,published_at,runtime_seconds,metadata_status:published_at&&runtime_seconds&&Date.parse(published_at)<=Date.parse(checked_at)?'reviewed':'unresolved',source:{url:url(source.url),content_hash:sha256(source.text),checked_at},review:{...review,reviewed_at:timestamp(review.reviewed_at)},audience_fit:record.audience_fit||null,selection_history:record.selection_history||[],rejection_reason:record.rejection_reason||null};
}
export function mergeMediaCatalog(previous=[],incoming=[]){
 const catalog=new Map(previous.map(x=>[x.identity,x])),aliasOwners=new Map();
 for(const item of previous)for(const alias of item.aliases){if(aliasOwners.has(alias)&&aliasOwners.get(alias)!==item.identity)throw Error('Conflicting alias identities');aliasOwners.set(alias,item.identity);}
 for(const input of incoming){const item=normalizeMediaEvidence(input),old=catalog.get(item.identity);
  for(const alias of item.aliases){if(aliasOwners.has(alias)&&aliasOwners.get(alias)!==item.identity)throw Error('Alias identity conflict requires review');aliasOwners.set(alias,item.identity);}
  const conflict=old&&(['published_at','runtime_seconds'].some(k=>old[k]!==null&&item[k]!==null&&old[k]!==item[k]));
  const metadata_conflicts=[...(old?.metadata_conflicts||[]),...(conflict?[{previous:{published_at:old.published_at,runtime_seconds:old.runtime_seconds},incoming:{published_at:item.published_at,runtime_seconds:item.runtime_seconds}}]:[])];
  catalog.set(item.identity,{...item,aliases:[...new Set([...(old?.aliases||[]),...item.aliases])].sort(),selection_history:[...new Map([...(old?.selection_history||[]),...item.selection_history].map(x=>[JSON.stringify(x),x])).values()],metadata_conflicts,metadata_status:metadata_conflicts.length?'unresolved':item.metadata_status,prior_source_hashes:[...new Set([...(old?.prior_source_hashes||[]),...(old&&old.source.content_hash!==item.source.content_hash?[old.source.content_hash]:[])])]});
 }
 return [...catalog.values()].sort((a,b)=>a.identity.localeCompare(b.identity));
}
