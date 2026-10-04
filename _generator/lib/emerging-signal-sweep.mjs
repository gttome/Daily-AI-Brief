import {fileURLToPath} from 'node:url';
import {aggregateWatchlistMigrationErrors} from './frozen-contract-migration.mjs';
import {EMERGING_REDESIGN_DATE,validateEmergingDiscovery} from './emerging-discovery.mjs';
export const REQUIRED_EMERGING_SURFACES=["primary_research","frontier_and_small_labs","open_source","technical_communities","broad_web","youtube_creator_ecosystem"];
export const CONCEPT_CLASSES=["model_family_or_architecture","agent_pattern_or_harness","evaluation_or_benchmark","inference_runtime_or_hardware","developer_tooling","multimodal_or_interface","safety_security_or_governance","knowledge_worker_workflow"];
const isoDate=/^\d{4}-\d{2}-\d{2}$/;
const FROZEN_SWEEP_MIGRATION_CUTOFF='2026-10-04';
const REPO_ROOT=fileURLToPath(new URL('../../',import.meta.url));
function frozenSweepMigration(receipt,date){
 const m=receipt?.migration;
 return date<=FROZEN_SWEEP_MIGRATION_CUTOFF&&m?.contract_transition==='pre-2026-10-05-frozen-contract-recovery'&&m?.aggregate_watchlist_task08?.enabled===true?m:null;
}
export function validateEmergingSignalSweep(receipt,{editionDate=null,topics=[]}={}){
 const errors=[],date=editionDate||receipt?.edition_date;
 if(!receipt||!['1.0.0','2.0.0'].includes(receipt.schema_version))errors.push('Invalid emerging-signal receipt version');
 if(!isoDate.test(receipt?.edition_date||''))errors.push('Invalid emerging-signal edition date');
 if(editionDate&&receipt?.edition_date!==editionDate)errors.push('Emerging-signal receipt date mismatch');
 if(!Number.isInteger(receipt?.primary_lookback_days)||receipt.primary_lookback_days<7)errors.push('Primary emerging-signal lookback must be at least 7 days');
 if(!receipt?.missed_signal_check?.completed||!Number.isInteger(receipt?.missed_signal_check?.lookback_days)||receipt.missed_signal_check.lookback_days<14)errors.push('14-day missed-signal check required');
 if(date>=EMERGING_REDESIGN_DATE){
   const migration=frozenSweepMigration(receipt,date);
   if(migration){
     const aggregate=aggregateWatchlistMigrationErrors(REPO_ROOT,{manifest:{edition_id:'dab-edition-'+date},watchlistEvidence:receipt},date,migration);
     errors.push(...aggregate.map(e=>'Frozen aggregate Watchlist migration: '+e));
     if(!Array.isArray(receipt?.new_topic_ids)||!Array.isArray(receipt?.updated_topic_ids))errors.push('Watchlist delta ids required');
     if(receipt?.result!=='PASS')errors.push('Frozen aggregate Watchlist receipt must be PASS');
     return errors;
   }
   errors.push(...validateEmergingDiscovery(receipt||{},{topics}));
 }
 const surfaces=new Map((receipt?.surfaces||[]).map(s=>[s.id,s]));
 for(const id of REQUIRED_EMERGING_SURFACES){
   const surface=surfaces.get(id);
   if(!surface)errors.push('Missing emerging-signal surface: '+id);
   else{
     if(!['complete','degraded'].includes(surface.status))errors.push('Invalid surface status: '+id);
     if(!Array.isArray(surface.queries)||surface.queries.length<1)errors.push('Search/review evidence required for surface: '+id);
     if(!Number.isInteger(surface.candidates_found)||surface.candidates_found<0)errors.push('Candidate count required for surface: '+id);
     if(surface.status==='degraded'&&!surface.reason)errors.push('Degraded surface requires reason: '+id);
   }
 }
 const classes=[...new Set(receipt?.concept_classes_reviewed||[])];
 if(classes.filter(x=>CONCEPT_CLASSES.includes(x)).length<6)errors.push('At least six emerging concept classes must be reviewed');
 const candidates=receipt?.candidates_reviewed;
 if(!Array.isArray(candidates))errors.push('Reviewed emerging candidates required');
 else for(const c of candidates){
   if(!c?.name||!CONCEPT_CLASSES.includes(c.concept_class)||!['new_topic','update_existing','duplicate','needs_research','rejected'].includes(c.disposition)||!c.rationale)errors.push('Incomplete emerging candidate review');
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
