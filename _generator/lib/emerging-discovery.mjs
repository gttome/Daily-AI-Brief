export const EMERGING_REDESIGN_DATE='2026-09-30';
export const DISCOVERY_DOMAINS=Object.freeze({
 frontier_models:['new model family reasoning world model memory architecture','efficient small specialized scientific model inference routing'],
 agents_harnesses:['agent memory orchestration always-on multi-agent harness','agent verification self-repair sandbox browser computer use'],
 developer_tooling:['coding agent SDK MCP observability release','AI IDE deployment autonomous testing model routing'],
 multimodal_interface:['voice video live multimodal interface research','screen interaction multimodal document creator workflow'],
 knowledge_worker_workflows:['enterprise collaborative agent autonomous research','AI productivity no-code low-code always-on assistant'],
 safety_governance:['agent permission approval containment verification rollback','AI security incident goal conflict task completion evaluation'],
 open_source_community:['GitHub Hugging Face new AI project model release','arXiv independent lab researcher technical community emerging AI']
});
export function emergingDiscoveryPlan(date){
 return {schema_version:'2.0.0',edition_date:date,independent_of_selected_stories:true,primary_lookback_days:7,missed_signal_lookback_days:14,domains:Object.entries(DISCOVERY_DOMAINS).map(([id,queries])=>({id,checks:queries.map((query,i)=>({check_id:`${id}-${i+1}`,query:`${query} as of ${date} (review prior 7 days; missed signals 14 days)`}))})),instruction:'Execute each focused check independently of editorial selection; record actual query/endpoint, method, checked_at, outcome and every candidate_id found. Failed checks are degraded, never completed. Review all discovered candidates in a complete disposition ledger. Reuse acquisition bytes where appropriate, never substitute the six selected stories for discovery.'};
}
const https=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
export function decideEmergingCandidate(c,topics=[]){
 if(c.routine_update===true||c.promotional_only===true||c.relevant===false)return {disposition:'rejected',reason:'Routine, promotional-only, or outside reader relevance'};
 if(!c.evidence?.some(e=>e.kind==='primary'&&e.credible===true&&e.review_depth&&https(e.url)))return {disposition:'needs_research',reason:'A reviewed credible primary/original technical source is needed'};
 // A broad theme or similar vocabulary is insufficient for a merge. The reviewer
 // must name the same mechanism and explain its identity, or retain a distinct signal.
 const match=topics.find(t=>t.topic_id===c.same_mechanism_topic_id);
 if(match&&c.mechanism_comparison?.trim()){
  const known=new Set((match.evidence||[]).map(e=>e.development_id));
  const changed=c.meaningful_new_evidence===true&&c.evidence.some(e=>e.kind==='primary'&&!known.has(e.development_id));
  return {disposition:changed?'update_existing':'duplicate',topic_id:match.topic_id,reason:c.mechanism_comparison};
 }
 if(c.materially_new!==true||c.relevant!==true||!c.mechanism?.trim())return {disposition:'needs_research',reason:'Establish material novelty, mechanism and reader relevance'};
 return {disposition:'new_topic',status:'early_signal',confidence:'limited',reason:'Materially new relevant mechanism with a reviewed primary source; independent corroboration can follow'};
}
export function emergingDiscoveryTelemetry(receipt){
 const domains=receipt.domain_checks||[],checks=domains.flatMap(d=>d.checks||[]),candidates=receipt.candidates_reviewed||[];
 const dispositions=Object.fromEntries(['new_topic','update_existing','duplicate','rejected','needs_research'].map(k=>[k,candidates.filter(c=>c.disposition===k).length]));
 return {discovery_surfaces_required:Object.keys(DISCOVERY_DOMAINS).length,discovery_surfaces_attempted:new Set(domains.filter(d=>Object.hasOwn(DISCOVERY_DOMAINS,d.id)&&(d.checks||[]).some(c=>c.checked_at)).map(d=>d.id)).size,discovery_surfaces_complete:new Set(domains.filter(d=>Object.hasOwn(DISCOVERY_DOMAINS,d.id)&&(d.checks||[]).length>=2&&d.checks.every(c=>c.status==='complete')).map(d=>d.id)).size,focused_checks_executed:checks.filter(c=>c.checked_at).length,candidates_discovered:new Set(checks.flatMap(c=>c.candidate_ids||[])).size,candidates_reviewed:candidates.length,new_topics_admitted:new Set(receipt.new_topic_ids||[]).size,existing_topics_updated:new Set(receipt.updated_topic_ids||[]).size,candidates_rejected:dispositions.rejected,candidates_held_for_research:dispositions.needs_research,duplicates:dispositions.duplicate};
}
export function validateEmergingDiscovery(receipt,{topics=[]}={}){
 const errors=[],domains=receipt.domain_checks||[],checks=domains.flatMap(d=>d.checks||[]),candidates=receipt.candidates_reviewed||[];
 if(receipt.schema_version!=='2.0.0'||receipt.discovery_scope!=='independent_watchlist')errors.push('Independent Watchlist discovery v2 required');
 if(new Set(domains.map(d=>d.id)).size!==domains.length)errors.push('Duplicate discovery domain');
 for(const id of Object.keys(DISCOVERY_DOMAINS)){
  const d=domains.find(d=>d.id===id);
  if(!d||d.checks?.length<2||new Set((d.checks||[]).map(c=>c.query||c.endpoint)).size<2)errors.push('Two distinct focused checks required: '+id);
 }
 if(checks.some(c=>!c.check_id||!(c.query||https(c.endpoint))||!['web_search','primary_retrieval','community_review'].includes(c.method)||!Number.isFinite(Date.parse(c.checked_at))||!['complete','degraded'].includes(c.status)||!Array.isArray(c.candidate_ids)||!c.result_summary||(c.status==='degraded'&&!c.reason)))errors.push('Incomplete discovery check evidence');
 if(new Set(checks.map(c=>c.check_id)).size!==checks.length)errors.push('Duplicate focused check');
 const discovered=new Set(checks.flatMap(c=>c.candidate_ids||[])),reviewed=new Set(candidates.map(c=>c.candidate_id));
 if(candidates.some(c=>!c.candidate_id)||reviewed.size!==candidates.length||discovered.size!==reviewed.size||[...discovered].some(id=>!reviewed.has(id)))errors.push('Complete candidate/disposition ledger required for every discovered candidate');
 const newIds=new Set(),updatedIds=new Set();
 for(const c of candidates){
  // The bound topic is the post-review projection. Compare against the explicit
  // pre-update evidence inventory, not against evidence just added to that topic.
  const prior=topics.map(t=>t.topic_id===c.same_mechanism_topic_id&&Array.isArray(c.prior_development_ids)?{...t,evidence:c.prior_development_ids.map(development_id=>({development_id}))}:t);
  const decision=decideEmergingCandidate(c,prior);
  if(c.disposition==='update_existing'&&!Array.isArray(c.prior_development_ids))errors.push('Evidence update requires prior development inventory');
  if(['new_topic','update_existing'].includes(c.disposition)&&c.evidence?.some(e=>!e.title||!e.publisher||!e.development_id||!Number.isFinite(Date.parse(e.checked_at))))errors.push('Admission evidence requires title, publisher, development and check time');
  if(decision.disposition!==c.disposition)errors.push('Candidate admission contradicts evidence/novelty policy: '+c.candidate_id);
  if(['new_topic','update_existing','duplicate'].includes(c.disposition)&&(!c.topic_id||!c.limitations))errors.push('Admitted/merged candidate requires topic identity and uncertainty');
  if(c.disposition==='new_topic'){
   newIds.add(c.topic_id);
   if(c.status!=='early_signal'||c.confidence!=='limited')errors.push('First admission requires early_signal / limited');
  }
  if(c.disposition==='update_existing')updatedIds.add(c.topic_id);
  if(['update_existing','duplicate'].includes(c.disposition)&&c.topic_id!==decision.topic_id)errors.push('Merge target must match reviewed mechanism');
  if(c.disposition==='new_topic'&&topics.length){const t=topics.find(t=>t.topic_id===c.topic_id);if(!t||t.status!=='early_signal'||t.confidence!=='limited'||t.limitations!==c.limitations||!c.evidence.filter(e=>e.kind==='primary').every(e=>t.evidence.some(x=>x.url===e.url&&x.development_id===e.development_id)))errors.push('New topic must retain admission evidence and uncertainty');}
 }
 const same=(set,ids)=>Array.isArray(ids)&&set.size===ids.length&&ids.every(id=>set.has(id));
 if(!same(newIds,receipt.new_topic_ids)||!same(updatedIds,receipt.updated_topic_ids))errors.push('Candidate dispositions must match daily topic deltas');
 const telemetry=emergingDiscoveryTelemetry(receipt);
 if(!receipt.telemetry||Object.entries(telemetry).some(([k,v])=>receipt.telemetry[k]!==v))errors.push('Discovery telemetry must match check and candidate ledger');
 if(!newIds.size&&telemetry.discovery_surfaces_complete!==7)errors.push('Zero-new certification requires all seven discovery domains complete');
 return errors;
}
