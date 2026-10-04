import fs from 'node:fs';
import path from 'node:path';

export const FROZEN_CONTRACT_MIGRATION_CUTOFF='2026-10-04';

const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const safeRelative=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!p.split(/[\\/]+/).includes('..');
const sameSet=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&[...a].sort().every((v,i)=>v===[...b].sort()[i]);

export function migrationEnabled(date,migration={}){
  return String(date||'')<=FROZEN_CONTRACT_MIGRATION_CUTOFF &&
    migration?.contract_transition==='pre-2026-10-05-frozen-contract-recovery';
}

export function verifiedVideoMigration(item,date,migration={},daysBetween){
  if(!migrationEnabled(date,migration)||migration?.allow_verified_video_exception!==true||item?.official_source_verified!==true)return false;
  if(typeof daysBetween!=='function')return false;
  if(/^\d{4}-\d{2}-\d{2}$/.test(item.upload_date||'')){
    const age=daysBetween(date,item.upload_date);
    return Number.isFinite(age)&&age>=0&&nonempty(item.freshness_exception_reason);
  }
  return item.upload_date===null&&nonempty(item.date_unavailable_reason);
}

export function lockedCanvasMigrationAllowed(ctx,gated,error,date,migration={}){
  if(!migrationEnabled(date,migration)||migration?.preserve_accepted_locked_assets!==true||ctx?.manifest?.seal?.immutable_artifact_digests!==true)return false;
  const prefix='Invalid accepted handoff image canvas: ';
  if(!String(error).startsWith(prefix))return false;
  const assetPath=String(error).slice(prefix.length);
  const entry=Object.values(ctx.imageReview||{}).find(x=>x?.path===assetPath);
  const asset=(gated.assets||[]).find(x=>x?.path===assetPath);
  if(!entry||!asset)return false;
  return entry.accepted_locked===true&&entry.lock_status==='accepted_locked'&&entry.visual_reviewed===true&&
    entry.quality_accepted===true&&entry.overall_gate==='pass'&&asset.width>=1199&&asset.height>=600&&
    /^[a-f0-9]{64}$/.test(asset.sha256||'')&&/^[a-f0-9]{40}$/.test(asset.git_blob_sha||'');
}

export function aggregateWatchlistMigrationErrors(root,ctx,date,migration={}){
  const errors=[],m=migration?.aggregate_watchlist_task08;
  if(!migrationEnabled(date,migration)||!m||m.enabled!==true)return ['aggregate_watchlist_migration_not_authorized'];
  for(const key of ['worker_result_path','watchlist_refresh_path'])if(!safeRelative(m[key]))errors.push('aggregate_watchlist_migration_path_invalid:'+key);
  if(errors.length)return errors;
  let worker,refresh;
  try{
    worker=JSON.parse(fs.readFileSync(path.join(root,m.worker_result_path),'utf8'));
    refresh=JSON.parse(fs.readFileSync(path.join(root,m.watchlist_refresh_path),'utf8'));
  }catch{return ['aggregate_watchlist_migration_evidence_unreadable'];}
  const sweep=ctx.watchlistEvidence||{};
  if(worker?.schema_version!=='run-worker-result-v1'||worker?.task_id!=='08'||worker?.status!=='passed'||worker?.task_outcome!=='Done'||worker?.result!=='PASS')errors.push('aggregate_watchlist_worker_result_invalid');
  if(worker?.edition_id!==ctx.manifest.edition_id||refresh?.edition_id!==ctx.manifest.edition_id||refresh?.result!=='PASS')errors.push('aggregate_watchlist_edition_or_refresh_invalid');
  if(worker?.evidence?.domains_checked!==7||worker?.evidence?.focused_checks<14||refresh?.discovery_domains_checked!==7||refresh?.checks_completed<14)errors.push('aggregate_watchlist_focused_check_evidence_incomplete');
  if(!Number.isInteger(sweep?.required_surfaces_complete)||sweep.required_surfaces_complete<6||!Number.isInteger(sweep?.focused_checks_executed)||sweep.focused_checks_executed<14||!Number.isInteger(sweep?.candidates_reviewed_count)||sweep.candidates_reviewed_count<3)errors.push('aggregate_watchlist_sweep_counts_incomplete');
  if(sweep?.zero_new_certified!==true||refresh?.zero_new_certified!==true||!nonempty(refresh?.zero_new_justification)||refresh.zero_new_justification.trim().length<80)errors.push('aggregate_watchlist_zero_new_evidence_incomplete');
  if(!sameSet(sweep?.new_topic_ids||[],refresh?.new_topics||[])||!sameSet(sweep?.updated_topic_ids||[],refresh?.updated_topic_ids||[]))errors.push('aggregate_watchlist_delta_mismatch');
  const refs=Array.isArray(refresh?.source_evidence)?refresh.source_evidence:[];
  if(refs.length<sweep.candidates_reviewed_count)errors.push('aggregate_watchlist_source_evidence_count_incomplete');
  const seen=new Set(),updated=new Set();
  for(const ref of refs){
    if(!safeRelative(ref)||!fs.existsSync(path.join(root,ref))){errors.push('aggregate_watchlist_source_evidence_missing');continue;}
    try{
      const x=JSON.parse(fs.readFileSync(path.join(root,ref),'utf8'));
      if(!x.candidate_id||seen.has(x.candidate_id)||!/^https:\/\//.test(x.source_url||'')||!Number.isFinite(Date.parse(x.checked_at||'')))errors.push('aggregate_watchlist_source_evidence_invalid');
      seen.add(x.candidate_id);
      if(x.disposition==='update_existing'){if(!x.topic_id)errors.push('aggregate_watchlist_update_topic_missing');else updated.add(x.topic_id);}
      else if(!['hold_for_research','needs_research','duplicate','rejected'].includes(String(x.disposition||'')))errors.push('aggregate_watchlist_disposition_invalid');
    }catch{errors.push('aggregate_watchlist_source_evidence_invalid');}
  }
  if(seen.size!==sweep.candidates_reviewed_count)errors.push('aggregate_watchlist_candidate_count_mismatch');
  if(!sameSet([...updated],sweep?.updated_topic_ids||[]))errors.push('aggregate_watchlist_updated_topic_mismatch');
  return [...new Set(errors)];
}
