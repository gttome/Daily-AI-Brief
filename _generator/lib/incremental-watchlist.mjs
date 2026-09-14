import {sha256} from './util.mjs';
const hour=3600000;
export function watchlistDue(source,previous,now,{force=false}={}){
 const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw Error('Valid check time required');
 if(force||!previous||previous.endpoint!==source.endpoint)return true;
 const next=Date.parse(previous.next_check_at);
 if(!Number.isFinite(next)||Date.parse(previous.last_attempt_at)>stamp)return true;
 return stamp>=next;
}
export function recordWatchlistCheck(source,previous,{now,text=null,candidates=[],status,reason=null}){
 const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw Error('Valid check time required');
 if(!['retrieved','no_candidate_links','unavailable','assisted_review_required'].includes(status))throw Error('Unknown Watchlist outcome');
 const success=['retrieved','no_candidate_links'].includes(status);
 if(success&&typeof text!=='string')throw Error('Successful check requires source content');
 const sameEndpoint=previous?.endpoint===source.endpoint;
 const prior=sameEndpoint?previous:null;
 const failures=success?0:(prior?.consecutive_failures||0)+1;
 const cadence=source.high_velocity===true?6*hour:source.check_cadence==='weekly'?7*24*hour:24*hour;
 const retry=status==='assisted_review_required'?7*24*hour:Math.min(24*hour,Math.pow(2,Math.min(failures,5))*hour);
 const fingerprint=success?sha256(text):prior?.last_content_fingerprint||null;
 return {schema_version:'1.0.0',source_id:source.source_id,endpoint:source.endpoint,last_attempt_at:now,
   last_successful_check:success?now:prior?.last_successful_check||null,
   last_content_fingerprint:fingerprint,
   unchanged:success&&fingerprint===prior?.last_content_fingerprint,
   latest_known_item_date:success?(candidates.map(c=>c.published_at).filter(Boolean).sort().at(-1)||prior?.latest_known_item_date||null):prior?.latest_known_item_date||null,
   candidate_urls:success?candidates.map(c=>c.url||c.canonical_url):prior?.candidate_urls||[],
   status,reason,consecutive_failures:failures,assisted_review:status==='assisted_review_required',
   next_check_at:new Date(stamp+(success?cadence:retry)).toISOString()};
}
export function incrementalCoverage(checks){
 return {sources_considered:checks.length,sources_checked:checks.filter(c=>!['not_due','assisted_review_required'].includes(c.status)).length,
   retained_not_due:checks.filter(c=>c.status==='not_due').length,
   unchanged_sources:checks.filter(c=>c.unchanged).length,
   sources_returning_candidate_links:checks.filter(c=>c.status==='retrieved').length,
   assisted_review_required:checks.filter(c=>c.status==='assisted_review_required'||c.previous_status==='assisted_review_required').length,
   unavailable:checks.filter(c=>c.status==='unavailable'||c.previous_status==='unavailable').length,
   fulltext_retrievals:0,
   coverage_status:checks.some(c=>['unavailable','assisted_review_required','no_candidate_links'].includes(c.status)||['unavailable','assisted_review_required','no_candidate_links'].includes(c.previous_status))?'degraded':'incremental',
   note:'Catalog discovery only. Retained state is not a new source check. No links does not establish no news.'};
}
