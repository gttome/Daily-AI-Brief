// Candidates are editorial evidence records, not inferred metadata.
export const VIDEO_METADATA_TARGET=15;
export const VIDEO_METADATA_MAX=20;
export const VIDEO_TRUSTED_SOURCE_TARGET=8;
export const VIDEO_TRUSTED_SOURCE_MAX=10;
export const VIDEO_DEEP_REVIEW_MAX=5;
export const VIDEO_DEEP_REVIEW_MIN=3;

export function videoDurationTier(seconds){
 if(!Number.isInteger(seconds)||seconds<=0||seconds>1200)return null;
 if(seconds<=600)return 'preferred';
 if(seconds<=900)return 'fallback';
 return 'last_resort';
}

function scoreSort(a,b){return (b.score||0)-(a.score||0)||String(b.upload_date||'').localeCompare(String(a.upload_date||''))||String(a.url).localeCompare(String(b.url));}
function eligibleVideos(candidates,slot,date){
 return candidates.filter(c=>c.slot===slot && c.verified===true && c.editorial_pass===true && c.duplicate!==true && videoDurationTier(c.runtime_seconds) && c.upload_date && (Date.parse(date)-Date.parse(c.upload_date))/86400000>=0 && (Date.parse(date)-Date.parse(c.upload_date))/86400000<=30);
}

export function selectVideo(candidates,slot,date){
 const eligible=eligibleVideos(candidates,slot,date);
 for(const duration_tier of ['preferred','fallback','last_resort']){
  const tier=eligible.filter(c=>videoDurationTier(c.runtime_seconds)===duration_tier).sort(scoreSort);
  if(tier.length){
   const shortEvidence=duration_tier==='preferred'?[]:candidates.filter(c=>c.slot===slot&&videoDurationTier(c.runtime_seconds)==='preferred').map(c=>`${c.url}: ${c.rejection_reason || 'not selected'}`);
   const fallbackEvidence=duration_tier!=='last_resort'?[]:candidates.filter(c=>c.slot===slot&&videoDurationTier(c.runtime_seconds)==='fallback').map(c=>`${c.url}: ${c.rejection_reason || 'not selected'}`);
   return {candidate:tier[0],tier:duration_tier==='preferred'?'short':'fallback',duration_tier,short_search_evidence:shortEvidence,fallback_search_evidence:fallbackEvidence};
  }
 }
 return {candidate:null,tier:'empty',duration_tier:null};
}

export function videoDiscoveryReceipt(candidates,{deepReviewedIds=[]}={}){
 const metadata=candidates.filter(c=>c&&c.url),sources=new Set(metadata.map(c=>c.source_id||c.channel||c.publisher).filter(Boolean));
 const slots=new Set(metadata.map(c=>c.slot).filter(Boolean));
 const durationTiers=new Set(metadata.map(c=>videoDurationTier(c.runtime_seconds)).filter(Boolean));
 const deep=new Set(deepReviewedIds);
 const complete=metadata.length>=VIDEO_METADATA_TARGET&&sources.size>=VIDEO_TRUSTED_SOURCE_TARGET&&slots.has('general')&&slots.has('agents_non_technical_people')&&durationTiers.has('preferred')&&durationTiers.has('fallback')&&deep.size>=VIDEO_DEEP_REVIEW_MIN&&deep.size<=VIDEO_DEEP_REVIEW_MAX;
 return {schema_version:'1.0.0',metadata_candidates:metadata.length,trusted_sources:sources.size,slots:[...slots].sort(),duration_tiers:[...durationTiers].sort(),deep_reviewed:deep.size,complete,
  bounded:metadata.length<=VIDEO_METADATA_MAX&&sources.size<=VIDEO_TRUSTED_SOURCE_MAX&&deep.size<=VIDEO_DEEP_REVIEW_MAX,
  zero_video_allowed:complete,
  rule:'0 videos is valid only after bounded coverage includes both video intents, at least 15 metadata candidates across at least 8 trusted sources, preferred and fallback duration tiers, and 3-5 deep reviews.'};
}

export function selectPodcasts(candidates,{limit=2,restrictedShow='The AI Daily Brief'}={}){
 if(limit!==2)throw Error('Daily podcast target is exactly two when two qualifying selections exist');
 const eligible=candidates.filter(c=>c?.verified===true&&c.editorial_pass===true&&c.duplicate!==true&&c.url&&c.show).sort(scoreSort);
 const selected=[];
 for(const candidate of eligible){
  if(selected.length>=limit)break;
  if(candidate.show===restrictedShow&&selected.some(x=>x.show===restrictedShow))continue;
  if(selected.some(x=>x.show===candidate.show))continue;
  selected.push(candidate);
 }
 return {selected,target:2,restricted_show:restrictedShow,restricted_show_count:selected.filter(x=>x.show===restrictedShow).length,source_diverse:selected.length<2||new Set(selected.map(x=>x.show)).size===selected.length};
}
