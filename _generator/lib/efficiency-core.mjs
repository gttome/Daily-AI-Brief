
export const METRICS={"stages":["discovery_seconds","filtering_seconds","deep_retrieval_seconds","evidence_packet_seconds","selection_writing_seconds","images_seconds","media_seconds","watchlist_seconds","generation_seconds","qa_seconds","publication_seconds","live_verification_seconds"],"research":["registered_sources_available","metadata_sources_scanned","article_sources_fulltext_retrieved","watchlist_sources_scanned","watchlist_sources_returning_candidate_links","watchlist_sources_fulltext_retrieved","watchlist_sources_requiring_followup","cache_hits","cache_misses","candidate_count","deep_candidates","selected_stories"],"context":["evidence_packets_created","evidence_packet_chars","historical_index_records_loaded","historical_context_chars","source_text_chars_retrieved","downstream_context_chars","model_calls_observable","input_tokens_observable","output_tokens_observable"],"media":["image_attempts","image_rejects","accepted_images","video_candidates_checked","videos_selected","podcast_candidates_checked","podcasts_selected"],"qa":["deterministic_tests_run","contract_fixtures_run","semantic_checks_run","live_routes_checked","targeted_repair_cycles","full_pipeline_restarts","publication_prs","repair_prs"]};
export const QUALITY=['six_story_requirement','allocation_2_2_2','novelty_gate','source_verification','images','videos','podcast','watchlist','ratings_sharing','feeds_archive_parity','accessibility','private_operations','subscriber_delivery','initial_local_qa','final_public_qa','overall_run_status'];
const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export function newEfficiency({editionId,attemptId,baselineSha,pipelineVersion='efficiency-v1',scope='publication_generation'}){
 const result={schema_version:'1.0.0',edition_id:editionId,attempt_id:attemptId,pipeline_version:pipelineVersion,baseline_sha:baselineSha,scope,start_time:null,end_time:null,wall_seconds:null};
 for(const [group,fields]of Object.entries(METRICS))result[group]=Object.fromEntries(fields.map(f=>[f,null]));
 result.research.early_stop_triggered=null;
 result.quality={...Object.fromEntries(QUALITY.map(f=>[f,null])),critical_high_defects:null,subscriber_delivery:'NOT_APPLICABLE'};
 result.usage={exact_platform_tokens:null,exact_platform_credits:null,weekly_usage_percent_remaining_before:null,weekly_usage_percent_remaining_after:null,weekly_usage_percentage_points_consumed:null,weekly_usage_before_captured_at:null,weekly_usage_after_captured_at:null,weekly_reset_at:null,concurrent_work_codex_activity:null,allowance_changing_event:null,weekly_usage_measurement_status:'unavailable',measurement_note:null};
 return result;
}
export function validateEfficiency(r){
 const errors=[];
 if(r?.schema_version!=='1.0.0')return ['Unsupported efficiency schema'];
 if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(r.edition_id||''))errors.push('Invalid edition ID');
 if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,160}$/.test(r.attempt_id||''))errors.push('Invalid attempt ID');
 if(!/^[a-f0-9]{40}$/.test(r.baseline_sha||''))errors.push('Invalid baseline SHA');
 if(typeof r.pipeline_version!=='string'||!r.pipeline_version)errors.push('Missing pipeline version');
 if(!['publication_generation','publication_complete','research_shadow','historical'].includes(r.scope))errors.push('Invalid measurement scope');
 for(const [group,fields]of Object.entries(METRICS))for(const field of fields)if(r[group]?.[field]!==null&&!numeric(r[group]?.[field]))errors.push(group+'.'+field+' must be measured nonnegative number or null');
 if(r.wall_seconds!==null&&!numeric(r.wall_seconds))errors.push('Invalid wall time');
 for(const field of ['start_time','end_time'])if(r[field]!==null&&!Number.isFinite(Date.parse(r[field])))errors.push('Invalid '+field);
 if(r.start_time&&r.end_time){const elapsed=(Date.parse(r.end_time)-Date.parse(r.start_time))/1000;if(elapsed<0||r.wall_seconds!==null&&Math.abs(elapsed-r.wall_seconds)>1)errors.push('Wall time does not match timestamps');}
 if(![null,true,false].includes(r.research?.early_stop_triggered))errors.push('Invalid early-stop observation');
 const statuses=[null,'PASS','FAIL','DEGRADED','NOT_APPLICABLE','PENDING','UNAVAILABLE'];
 for(const field of QUALITY)if(!statuses.includes(r.quality?.[field]))errors.push('Invalid quality status '+field);
 if(r.quality?.critical_high_defects!==null&&!Number.isInteger(r.quality?.critical_high_defects))errors.push('Defect count must be integer or null');
 if(r.quality?.critical_high_defects<0)errors.push('Negative defect count');
 if(r.quality?.final_public_qa==='PASS'&&r.quality?.critical_high_defects!==0)errors.push('Public QA PASS requires observed zero blocking defects');
 if(r.scope==='publication_complete'&&(!r.start_time||!r.end_time||r.wall_seconds===null))errors.push('Complete publication requires measured boundaries');
 const usage=r.usage;
 if(!usage||!['valid','contaminated','below_display_resolution','unavailable'].includes(usage.weekly_usage_measurement_status))errors.push('Invalid usage status');
 for(const f of ['exact_platform_tokens','exact_platform_credits','weekly_usage_percentage_points_consumed'])if(usage?.[f]!==null&&!numeric(usage?.[f]))errors.push('Invalid usage metric '+f);
 for(const f of ['weekly_usage_percent_remaining_before','weekly_usage_percent_remaining_after'])if(usage?.[f]!==null&&(!numeric(usage?.[f])||usage[f]>100))errors.push('Invalid allowance reading');
 if(['valid','below_display_resolution'].includes(usage?.weekly_usage_measurement_status)){
   const before=usage.weekly_usage_percent_remaining_before,after=usage.weekly_usage_percent_remaining_after;
   const t1=Date.parse(usage.weekly_usage_before_captured_at),t2=Date.parse(usage.weekly_usage_after_captured_at),reset=Date.parse(usage.weekly_reset_at),start=Date.parse(r.start_time),end=Date.parse(r.end_time);
   if(before===null||after===null||before<after||usage.concurrent_work_codex_activity!==false||usage.allowance_changing_event!==false||!Number.isFinite(t1)||!Number.isFinite(t2)||!Number.isFinite(reset)||!(t1<=start&&start-t1<=60000&&t2>=end&&t2-end<=60000&&t2<reset))errors.push('Usage controls not satisfied');
   if(usage.weekly_usage_measurement_status==='valid'&&(before===after||usage.weekly_usage_percentage_points_consumed!==before-after))errors.push('Invalid consumed percentage points');
   if(usage.weekly_usage_measurement_status==='below_display_resolution'&&(before!==after||usage.weekly_usage_percentage_points_consumed!==null))errors.push('Equal readings must not claim zero resource use');
 }
 return errors;
}
export function assertEfficiency(r){const errors=validateEfficiency(r);if(errors.length)throw Error(errors.join('; '));return r;}
export function efficiencyPath(r){assertEfficiency(r);return '_records/efficiency/'+r.edition_id.slice(-10)+'/dab-efficiency-'+r.edition_id.slice(-10)+'-'+r.attempt_id+'-'+r.scope+'.json';}
export function comparison(baseline,observed){return numeric(baseline)&&numeric(observed)?{absolute_change:observed-baseline,improvement_percent:baseline>0?(baseline-observed)/baseline*100:null}:{absolute_change:null,improvement_percent:null};}
export function summarizeEfficiency(records){
 const byEdition=new Map();
 for(const r of records.filter(r=>!validateEfficiency(r).length&&r.scope==='publication_complete'&&r.pipeline_version.startsWith('efficiency-')&&r.quality.final_public_qa==='PASS'&&r.quality.critical_high_defects===0)){
  const prior=byEdition.get(r.edition_id);if(!prior||r.end_time>prior.end_time)byEdition.set(r.edition_id,r);
 }
 const runs=[...byEdition.values()],fields=['wall_seconds',...Object.entries(METRICS).flatMap(([g,keys])=>keys.map(k=>g+'.'+k))],averages={};
 for(const key of fields){const values=runs.map(r=>key.split('.').reduce((o,k)=>o?.[k],r)).filter(numeric);averages[key]={mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,observations:values.length,total_runs:runs.length};}
 const usage=runs.filter(r=>r.usage.weekly_usage_measurement_status==='valid').map(r=>r.usage.weekly_usage_percentage_points_consumed);
 return {optimized_editions:runs.length,averages,weekly_allowance_consumed:{mean:usage.length?usage.reduce((a,b)=>a+b,0)/usage.length:null,valid_observations:usage.length},runs};
}

export function publicEfficiency(record){
 assertEfficiency(record);
 if(record.usage.weekly_usage_percent_remaining_before!==null||record.usage.weekly_usage_percent_remaining_after!==null)throw Error('Raw account allowance readings must remain private');
 return record;
}
