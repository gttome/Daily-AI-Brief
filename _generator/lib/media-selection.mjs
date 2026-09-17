// Candidates are editorial evidence records, not inferred metadata.
export const VIDEO_METADATA_TARGET=15;
export const VIDEO_METADATA_MAX=20;
export const VIDEO_TRUSTED_SOURCE_TARGET=8;
export const VIDEO_TRUSTED_SOURCE_MAX=10;
export const VIDEO_DEEP_REVIEW_MAX=5;
export const VIDEO_DEEP_REVIEW_MIN=3;
export const VIDEO_MAX_AGE_HOURS=72;
export const PODCAST_PRIMARY_AGE_DAYS=2;
export const PODCAST_FALLBACK_AGE_DAYS=7;
export const PODCAST_EXCEPTION_AGE_DAYS=30;

const ageDays=(date,published)=>{const a=Date.parse(date),b=Date.parse(published);return Number.isFinite(a)&&Number.isFinite(b)?(a-b)/86400000:NaN;};

export function videoDurationTier(seconds){
 if(!Number.isInteger(seconds)||seconds<=0||seconds>1200)return null;
 if(seconds<=600)return 'preferred';
 if(seconds<=900)return 'fallback';
 return 'last_resort';
}

function scoreSort(a,b){return (b.score||0)-(a.score||0)||String(b.upload_date||b.publication_date||'').localeCompare(String(a.upload_date||a.publication_date||''))||String(a.url).localeCompare(String(b.url));}
function eligibleVideos(candidates,slot,date){
 return candidates.filter(c=>{
  const hours=ageDays(date,c.upload_date)*24;
  return c.slot===slot&&c.verified===true&&c.editorial_pass===true&&c.duplicate!==true&&videoDurationTier(c.runtime_seconds)&&Number.isFinite(hours)&&hours>=0&&hours<=VIDEO_MAX_AGE_HOURS;
 });
}

export function selectVideo(candidates,slot,date){
 const eligible=eligibleVideos(candidates,slot,date);
 for(const duration_tier of ['preferred','fallback','last_resort']){
  const tier=eligible.filter(c=>videoDurationTier(c.runtime_seconds)===duration_tier).sort(scoreSort);
  if(tier.length){
   const shortEvidence=duration_tier==='preferred'?[]:eligible.filter(c=>videoDurationTier(c.runtime_seconds)==='preferred').map(c=>`${c.url}: ${c.rejection_reason || 'not selected'}`);
   const fallbackEvidence=duration_tier!=='last_resort'?[]:eligible.filter(c=>videoDurationTier(c.runtime_seconds)==='fallback').map(c=>`${c.url}: ${c.rejection_reason || 'not selected'}`);
   return {candidate:tier[0],tier:duration_tier==='preferred'?'short':'fallback',duration_tier,short_search_evidence:shortEvidence,fallback_search_evidence:fallbackEvidence,maximum_age_hours:VIDEO_MAX_AGE_HOURS};
  }
 }
 return {candidate:null,tier:'empty',duration_tier:null,maximum_age_hours:VIDEO_MAX_AGE_HOURS};
}

export function videoDiscoveryReceipt(candidates,{deepReviewedIds=[],date=null}={}){
 const metadata=candidates.filter(c=>c&&c.url&&(!date||eligibleVideos([c],c.slot,date).length));
 const sources=new Set(metadata.map(c=>c.source_id||c.channel||c.publisher).filter(Boolean));
 const slots=new Set(metadata.map(c=>c.slot).filter(Boolean));
 const durationTiers=new Set(metadata.map(c=>videoDurationTier(c.runtime_seconds)).filter(Boolean));
 const deep=new Set(deepReviewedIds);
 const complete=metadata.length>=VIDEO_METADATA_TARGET&&sources.size>=VIDEO_TRUSTED_SOURCE_TARGET&&slots.has('general')&&slots.has('agents_non_technical_people')&&durationTiers.has('preferred')&&durationTiers.has('fallback')&&deep.size>=VIDEO_DEEP_REVIEW_MIN&&deep.size<=VIDEO_DEEP_REVIEW_MAX;
 return {schema_version:'1.0.0',metadata_candidates:metadata.length,trusted_sources:sources.size,slots:[...slots].sort(),duration_tiers:[...durationTiers].sort(),deep_reviewed:deep.size,maximum_age_hours:VIDEO_MAX_AGE_HOURS,complete,
  bounded:metadata.length<=VIDEO_METADATA_MAX&&sources.size<=VIDEO_TRUSTED_SOURCE_MAX&&deep.size<=VIDEO_DEEP_REVIEW_MAX,
  zero_video_allowed:complete,
  rule:'0 videos is valid only after bounded 72-hour coverage includes both video intents, at least 15 metadata candidates across at least 8 trusted sources, preferred and fallback duration tiers, and 3-5 deep reviews.'};
}

function podcastTier(candidate,date){
 const age=ageDays(date,candidate.publication_date);
 if(!Number.isFinite(age)||age<0||age>PODCAST_EXCEPTION_AGE_DAYS)return null;
 if(age<=PODCAST_PRIMARY_AGE_DAYS)return 'primary_48h';
 if(age<=PODCAST_FALLBACK_AGE_DAYS)return 'fallback_7d';
 return 'exception_30d';
}

export function selectPodcasts(candidates,{date,limit=2,restrictedShow='The AI Daily Brief'}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Explicit edition date required for podcast freshness');
 if(limit!==2)throw Error('Daily podcast target is exactly two when two qualifying selections exist');
 const eligible=candidates.filter(c=>c?.verified===true&&c.editorial_pass===true&&c.duplicate!==true&&c.url&&c.show&&podcastTier(c,date));
 const selected=[];
 for(const tier of ['primary_48h','fallback_7d','exception_30d']){
  for(const candidate of eligible.filter(c=>podcastTier(c,date)===tier).sort(scoreSort)){
   if(selected.length>=limit)break;
   if(candidate.show===restrictedShow&&selected.some(x=>x.show===restrictedShow))continue;
   if(selected.some(x=>x.show===candidate.show))continue;
   if(tier!=='primary_48h'&&!String(candidate.freshness_exception_reason||'').trim())continue;
   selected.push({...candidate,freshness_tier:tier});
  }
  if(selected.length>=limit)break;
 }
 return {selected,target:2,restricted_show:restrictedShow,restricted_show_count:selected.filter(x=>x.show===restrictedShow).length,source_diverse:selected.length<2||new Set(selected.map(x=>x.show)).size===selected.length,primary_age_days:PODCAST_PRIMARY_AGE_DAYS,fallback_age_days:PODCAST_FALLBACK_AGE_DAYS,exception_age_days:PODCAST_EXCEPTION_AGE_DAYS};
}
