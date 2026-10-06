export const BRANCH_SEPARATION_VERSION='branch-separation-v1';
export const HARDENING_QUEUE_SCHEMA='hardening-queue-v1';

const SHA=/^[a-f0-9]{40}$/;
const ID=/^[a-z0-9][a-z0-9._-]*$/;
const ISO=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

export const PRODUCTION_CANDIDATE_FORBIDDEN_PREFIXES=Object.freeze([
  '.github/','_generator/','_tools/','_contracts/','docs/operations/'
]);

export function branchRole(branch=''){
  if(/^reliable-edition\/dab-edition-\d{4}-\d{2}-\d{2}-run\d+$/.test(branch))return 'production_candidate';
  if(/^hardening\//.test(branch))return 'hardening';
  if(/^repair\//.test(branch))return 'repair';
  if(branch==='main')return 'protected_main';
  return 'other';
}

export function productionCandidateSeparationErrors({
  branch,changed_paths=[],baseline_main_sha=null,current_main_sha=null
}={}){
  const errors=[];
  if(branchRole(branch)!=='production_candidate')errors.push('production_candidate_branch_required');
  if(!Array.isArray(changed_paths))errors.push('production_candidate_changed_paths_required');
  else for(const raw of changed_paths){
    const path=String(raw||'').replace(/^\.\//,'');
    if(!path)errors.push('production_candidate_empty_path');
    if(PRODUCTION_CANDIDATE_FORBIDDEN_PREFIXES.some(prefix=>path.startsWith(prefix)))
      errors.push('production_candidate_contains_hardening:'+path);
  }
  if(baseline_main_sha!==null&&!SHA.test(baseline_main_sha||''))errors.push('production_candidate_baseline_sha_invalid');
  if(current_main_sha!==null&&!SHA.test(current_main_sha||''))errors.push('production_candidate_current_main_sha_invalid');
  if(SHA.test(baseline_main_sha||'')&&SHA.test(current_main_sha||'')&&baseline_main_sha!==current_main_sha)
    errors.push('production_candidate_stale_main_ancestry');
  return [...new Set(errors)];
}

export function validateHardeningQueueItem(item={}){
  const errors=[];
  const required=['item_id','source_run','source_task','failure_fingerprint','severity','status','owner_type','branch','production_dependency','next_run_gate'];
  for(const key of required)if(!(key in item))errors.push('hardening_queue_missing:'+key);
  if(!ID.test(item.item_id||''))errors.push('hardening_queue_item_id');
  if(!['low','medium','high','critical'].includes(item.severity))errors.push('hardening_queue_severity');
  if(!['queued','in_progress','blocked','merged','verified','deferred'].includes(item.status))errors.push('hardening_queue_status');
  if(!['system_hardening','bounded_repair'].includes(item.owner_type))errors.push('hardening_queue_owner_type');
  const role=branchRole(item.branch||'');
  if(!['hardening','repair'].includes(role))errors.push('hardening_queue_branch_role');
  if(item.pr!==null&&item.pr!==undefined&&(!Number.isInteger(item.pr)||item.pr<1))errors.push('hardening_queue_pr');
  if(item.merged_sha!==null&&item.merged_sha!==undefined&&!SHA.test(item.merged_sha))errors.push('hardening_queue_merged_sha');
  if(item.status==='merged'&&!SHA.test(item.merged_sha||''))errors.push('hardening_queue_merged_requires_sha');
  if(item.regression_test!==null&&item.regression_test!==undefined&&typeof item.regression_test!=='string')errors.push('hardening_queue_regression_test');
  if(typeof item.production_dependency!=='boolean')errors.push('hardening_queue_production_dependency');
  if(typeof item.next_run_gate!=='boolean')errors.push('hardening_queue_next_run_gate');
  return [...new Set(errors)];
}

export function validateHardeningQueue(queue={}){
  const errors=[];
  if(queue.schema_version!==HARDENING_QUEUE_SCHEMA)errors.push('hardening_queue_schema');
  if(!ISO(queue.updated_at))errors.push('hardening_queue_updated_at');
  if(!Array.isArray(queue.items))errors.push('hardening_queue_items');
  else {
    const ids=new Set();
    queue.items.forEach((item,index)=>{
      for(const error of validateHardeningQueueItem(item))errors.push(`item_${index}:${error}`);
      if(ids.has(item.item_id))errors.push('hardening_queue_duplicate_item:'+item.item_id);
      ids.add(item.item_id);
    });
  }
  return [...new Set(errors)];
}

export function candidateResumeDependency({
  execution_id,repair_branch,merged_sha,regression_test,verified_at=new Date().toISOString()
}={}){
  if(!execution_id||branchRole(repair_branch)!=='repair'||!SHA.test(merged_sha||'')||!regression_test||!ISO(verified_at))
    throw Error('valid_external_repair_dependency_required');
  return {
    schema_version:'production-repair-dependency-v1',
    execution_id,repair_branch,merged_sha,regression_test,verified_at,
    preserve_completed_tasks:true,preserve_accepted_locked_images:true,resume_same_execution:true
  };
}
