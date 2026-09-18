import {sha256} from './util.mjs';
const hour=3600000;
export const WATCHLIST_MINIMUM_FRESH_OBSERVATIONS=3;
export const WATCHLIST_MAX_FALLBACK_CHECKS=5;
export function watchlistDue(source,previous,now,{force=false}={}){
 const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw Error('Valid check time required');
 if(force||!previous||previous.endpoint!==source.endpoint)return true;
 const next=Date.parse(previous.next_check_at);
 if(!Number.isFinite(next)||Date.parse(previous.last_attempt_at)>stamp)return true;
 return stamp>=next;
}
export function recordWatchlistCheck(source,previous,{now,text=null,fingerprint:semanticFingerprint=null,candidates=[],status,reason=null}){
 const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw Error('Valid check time required');
 if(!['retrieved','no_candidate_links','unavailable','assisted_review_required'].includes(status))throw Error('Unknown Watchlist outcome');
 const success=['retrieved','no_candidate_links'].includes(status);
 if(success&&typeof text!=='string')throw Error('Successful check requires source content');
 const sameEndpoint=previous?.endpoint===source.endpoint;
 const prior=sameEndpoint?previous:null;
 const failures=success?0:(prior?.consecutive_failures||0)+1;
 const cadence=source.high_velocity===true?6*hour:source.check_cadence==='weekly'?7*24*hour:24*hour;
 const retry=status==='assisted_review_required'?7*24*hour:Math.min(24*hour,Math.pow(2,Math.min(failures,5))*hour);
 const fingerprint=success?(semanticFingerprint||sha256(text)):prior?.last_content_fingerprint||null;
 return {schema_version:'1.0.0',source_id:source.source_id,endpoint:source.endpoint,last_attempt_at:now,
   last_successful_check:success?now:prior?.last_successful_check||null,
   last_content_fingerprint:fingerprint,
   unchanged:success&&fingerprint===prior?.last_content_fingerprint,
   latest_known_item_date:success?(candidates.map(c=>c.published_at).filter(Boolean).sort().at(-1)||prior?.latest_known_item_date||null):prior?.latest_known_item_date||null,
   candidate_urls:success?candidates.map(c=>c.url||c.canonical_url):prior?.candidate_urls||[],
   status,reason,consecutive_failures:failures,assisted_review:status==='assisted_review_required',
   review_state:status==='assisted_review_required'?'pending':prior?.review_state||null,
   review_due_at:status==='assisted_review_required'?(prior?.review_due_at||now):prior?.review_due_at||null,
   next_check_at:new Date(stamp+(success?cadence:retry)).toISOString()};
}
export function freshWatchlistSuccesses(checks){
 return checks.filter(c=>['retrieved','no_candidate_links'].includes(c.status)).length;
}
export function watchlistFallbackPlan(sources,checks,{minimumFresh=WATCHLIST_MINIMUM_FRESH_OBSERVATIONS,maxFallbackChecks=WATCHLIST_MAX_FALLBACK_CHECKS}={}){
 if(!Number.isInteger(minimumFresh)||minimumFresh<1||!Number.isInteger(maxFallbackChecks)||maxFallbackChecks<1)throw Error('Positive Watchlist coverage floor and fallback bound required');
 const fresh=freshWatchlistSuccesses(checks);
 if(fresh>=minimumFresh)return {needed:false,fresh_successes:fresh,minimum_fresh:minimumFresh,max_fallback_checks:maxFallbackChecks,sources:[]};
 const byId=new Map(checks.map(c=>[c.source_id,c]));
 const rank=source=>{
   if(Number.isFinite(source.priority_rank))return source.priority_rank;
   if(source.high_velocity===true)return 10;
   if(source.check_cadence==='daily')return 20;
   if(source.check_cadence==='weekly')return 40;
   return 30;
 };
 const eligible=sources.map((source,index)=>({source,index,check:byId.get(source.source_id)})).filter(({source,check})=>
   source.automated!==false&&source.endpoint&&check?.status==='not_due'&&check.previous_status!=='assisted_review_required'
 ).sort((a,b)=>rank(a.source)-rank(b.source)||a.index-b.index).slice(0,maxFallbackChecks).map(({source})=>({source_id:source.source_id,endpoint:source.endpoint,force:true,reason:'bounded_minimum_daily_coverage'}));
 return {needed:true,fresh_successes:fresh,minimum_fresh:minimumFresh,max_fallback_checks:maxFallbackChecks,sources:eligible};
}
// Execute fallback sequentially; a successful observation can end the plan early.
export async function runWatchlistFallback(sources,checks,checkSource,options={}){
 const plan=watchlistFallbackPlan(sources,checks,options),outcomes=[];
 for(const selected of plan.sources){
  if(freshWatchlistSuccesses(checks)>=plan.minimum_fresh)break;
  const index=checks.findIndex(c=>c.source_id===selected.source_id);
  const previous=checks[index];
  const result=await checkSource(sources.find(s=>s.source_id===selected.source_id),true);
  if(result?.source_id!==selected.source_id||!['retrieved','no_candidate_links','unavailable'].includes(result.status))throw Error('Forced automated check must return a matching observation');
  checks.splice(index,1,result);
  outcomes.push({source_id:selected.source_id,previous_disposition:previous,result});
 }
 return {plan,checks:outcomes};
}
export function incrementalCoverage(checks,{minimumFresh=WATCHLIST_MINIMUM_FRESH_OBSERVATIONS}={}){
 const fresh=freshWatchlistSuccesses(checks);
 const hasIssues=checks.some(c=>['unavailable','assisted_review_required'].includes(c.status)||['unavailable','assisted_review_required'].includes(c.previous_status));
 return {sources_considered:checks.length,sources_checked:checks.filter(c=>!['not_due','assisted_review_required'].includes(c.status)).length,
   retained_not_due:checks.filter(c=>c.status==='not_due').length,
   unchanged_sources:checks.filter(c=>c.unchanged).length,
   sources_returning_candidate_links:checks.filter(c=>c.status==='retrieved').length,
   fresh_successful_observations:fresh,
   minimum_fresh_observations:minimumFresh,
   coverage_floor_met:fresh>=minimumFresh,
   assisted_review_required:checks.filter(c=>c.status==='assisted_review_required'||c.previous_status==='assisted_review_required').length,
   unavailable:checks.filter(c=>c.status==='unavailable'||c.previous_status==='unavailable').length,
   fulltext_retrievals:0,
   coverage_status:fresh<minimumFresh||hasIssues?'degraded':'incremental',
   note:'Catalog discovery only. Retained state is not a new source check. If fresh successful observations are below the floor, run only the bounded high-value fallback plan; never sweep the whole registry. No links does not establish no news.'};
}
