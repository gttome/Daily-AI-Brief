export const REQUIRED_EMERGING_SURFACES=["primary_research","frontier_and_small_labs","open_source","technical_communities","broad_web","youtube_creator_ecosystem"];
export const CONCEPT_CLASSES=["model_family_or_architecture","agent_pattern_or_harness","evaluation_or_benchmark","inference_runtime_or_hardware","developer_tooling","multimodal_or_interface","safety_security_or_governance","knowledge_worker_workflow"];
const isoDate=/^\d{4}-\d{2}-\d{2}$/;
export function validateEmergingSignalSweep(receipt,{editionDate=null}={}){
 const errors=[];
 if(!receipt||receipt.schema_version!=='1.0.0')errors.push('Invalid emerging-signal receipt version');
 if(!isoDate.test(receipt?.edition_date||''))errors.push('Invalid emerging-signal edition date');
 if(editionDate&&receipt?.edition_date!==editionDate)errors.push('Emerging-signal receipt date mismatch');
 if(!Number.isInteger(receipt?.primary_lookback_days)||receipt.primary_lookback_days<7)errors.push('Primary emerging-signal lookback must be at least 7 days');
 if(!receipt?.missed_signal_check?.completed||!Number.isInteger(receipt?.missed_signal_check?.lookback_days)||receipt.missed_signal_check.lookback_days<14)errors.push('14-day missed-signal check required');
 const surfaces=new Map((receipt?.surfaces||[]).map(s=>[s.id,s]));
 for(const id of REQUIRED_EMERGING_SURFACES){
   const s=surfaces.get(id);
   if(!s)errors.push('Missing emerging-signal surface: '+id);
   else{
     if(!['complete','degraded'].includes(s.status))errors.push('Invalid surface status: '+id);
     if(!Array.isArray(s.queries)||s.queries.length<1)errors.push('Search/review evidence required for surface: '+id);
     if(!Number.isInteger(s.candidates_found)||s.candidates_found<0)errors.push('Candidate count required for surface: '+id);
     if(s.status==='degraded'&&!s.reason)errors.push('Degraded surface requires reason: '+id);
   }
 }
 const classes=[...new Set(receipt?.concept_classes_reviewed||[])];
 if(classes.filter(x=>CONCEPT_CLASSES.includes(x)).length<6)errors.push('At least six emerging concept classes must be reviewed');
 const candidates=receipt?.candidates_reviewed;
 if(!Array.isArray(candidates))errors.push('Reviewed emerging candidates required');
 else for(const c of candidates){
   if(!c?.name||!CONCEPT_CLASSES.includes(c.concept_class)||!['new_topic','update_existing','needs_research','rejected'].includes(c.disposition)||!c.rationale)errors.push('Incomplete emerging candidate review');
   if(!Array.isArray(c?.evidence_urls)||c.evidence_urls.length<1||c.evidence_urls.some(u=>!/^https:\/\//.test(u)))errors.push('Emerging candidate evidence URL required');
 }
 if(!Array.isArray(receipt?.new_topic_ids)||!Array.isArray(receipt?.updated_topic_ids))errors.push('Watchlist delta ids required');
 const anyNew=(receipt?.new_topic_ids||[]).length>0;
 if(anyNew&&receipt?.zero_new_certified===true)errors.push('Cannot certify zero new topics when new topics are recorded');
 if(!anyNew){
   if(receipt?.zero_new_certified!==true)errors.push('Zero-new Watchlist state requires explicit certification');
   if((candidates||[]).length<3)errors.push('Zero-new certification requires at least three reviewed candidate concepts');
   if(typeof receipt?.zero_new_justification!=='string'||receipt.zero_new_justification.trim().length<80)errors.push('Zero-new certification requires substantive justification');
   if([...surfaces.values()].some(s=>s.status!=='complete'))errors.push('Zero-new certification requires every required surface complete');
 }
 return errors;
}
