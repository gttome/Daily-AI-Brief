import fs from 'node:fs';
import path from 'node:path';

export const RUN_STATE_VERSION='sep24-reliability-v1';
export const RUN_STAGES=Object.freeze([
 'NOT_STARTED','PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL',
 'EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','PR_CREATED','DETERMINISTIC_EXPANSION_READY',
 'PROTECTED_CI_PASS','MERGED','PAGES_VERIFIED','COMPLETION_PERSISTED','DELTA_VALIDATED','COMMAND_CENTER_RECONCILED','CLOSED'
]);
export const OPERATIONAL_STATUSES=Object.freeze(['PREPARING','READY','EDITORIAL','ASSETS','HANDOFF','CI','MERGED','PAGES','FINAL_VALIDATION','COMMAND_CENTER_SYNC','COMPLETE','BLOCKED']);
export const PUBLICATION_LIFECYCLE=Object.freeze(['staged','candidate','validated','merged','deployed','verified','closed']);
const downstream=stage=>RUN_STAGES.slice(Math.max(1,RUN_STAGES.indexOf(stage)+1));
const safeDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);

export function runStatePath(date){if(!safeDate(date))throw Error('valid_edition_date_required');return '_records/run-state/'+date+'.json';}
export function newRunState({date,baselineSha,contractVersion=RUN_STATE_VERSION}){
 if(!safeDate(date)||!/^[a-f0-9]{40}$/.test(baselineSha||''))throw Error('date_and_baseline_required');
 return {schema_version:'1.0.0',edition_date:date,baseline_main_sha:baselineSha,current_sha:baselineSha,contract_runtime_version:contractVersion,
  stage:'NOT_STARTED',status:'pending',retry_count:0,pr_number:null,workflow_run_ids:[],artifact_paths:[],invalidated_downstream_stages:[],
  publication_lifecycle:'staged',operational_status:'PREPARING',stages:{},history:[]};
}
function proofValid(p,{baselineSha,contractVersion}={}){
 if(!p||p.status!=='pass')return false;
 if(baselineSha&&p.input_baseline_sha&&p.input_baseline_sha!==baselineSha)return false;
 if(contractVersion&&p.contract_runtime_version&&p.contract_runtime_version!==contractVersion)return false;
 if(Array.isArray(p.artifact_paths)&&p.artifact_paths.some(x=>typeof x!=='string'||!x))return false;
 return true;
}
export function resolveResumeStage({state,baselineSha=null,contractVersion=null}={}){
 if(!state)return 'PREFLIGHT_METADATA_READY';
 const baseline=baselineSha||state.baseline_main_sha,contract=contractVersion||state.contract_runtime_version;
 for(const stage of RUN_STAGES.slice(1,-1))if(!proofValid(state.stages?.[stage],{baselineSha:baseline,contractVersion:contract}))return stage;
 return proofValid(state.stages?.CLOSED,{baselineSha:baseline,contractVersion:contract})?'CLOSED':'CLOSED';
}
export function deriveOperationalStatus(resumeStage){
 if(['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY'].includes(resumeStage))return 'PREPARING';
 if(resumeStage==='READINESS_FINAL')return 'READY';
 if(resumeStage==='EDITORIAL_KERNEL_READY')return 'EDITORIAL';
 if(['MEDIA_READY','IMAGES_READY'].includes(resumeStage))return 'ASSETS';
 if(['HANDOFF_COMMITTED','PR_CREATED','DETERMINISTIC_EXPANSION_READY'].includes(resumeStage))return 'HANDOFF';
 if(resumeStage==='PROTECTED_CI_PASS')return 'CI';
 if(resumeStage==='MERGED')return 'MERGED';
 if(resumeStage==='PAGES_VERIFIED')return 'PAGES';
 if(['COMPLETION_PERSISTED','DELTA_VALIDATED'].includes(resumeStage))return 'FINAL_VALIDATION';
 if(resumeStage==='COMMAND_CENTER_RECONCILED')return 'COMMAND_CENTER_SYNC';
 if(resumeStage==='CLOSED')return 'COMPLETE';
 return 'BLOCKED';
}
export function lifecycleForStage(stage){
 const i=RUN_STAGES.indexOf(stage);
 if(i<0)throw Error('unknown_stage');
 if(i<RUN_STAGES.indexOf('PR_CREATED'))return 'staged';
 if(i<RUN_STAGES.indexOf('PROTECTED_CI_PASS'))return 'candidate';
 if(i<RUN_STAGES.indexOf('MERGED'))return 'validated';
 if(i<RUN_STAGES.indexOf('PAGES_VERIFIED'))return 'merged';
 if(i<RUN_STAGES.indexOf('COMPLETION_PERSISTED'))return 'deployed';
 if(i<RUN_STAGES.indexOf('CLOSED'))return 'verified';
 return 'closed';
}
export function markRunStage(state,stage,{timestamp=new Date().toISOString(),currentSha=null,artifactPaths=[],workflowRunIds=[],prNumber=null,status='pass',retryCount=null,note=null}={}){
 if(!RUN_STAGES.includes(stage)||stage==='NOT_STARTED')throw Error('unknown_or_nonterminal_stage');
 const next=structuredClone(state);
 const priorIndex=RUN_STAGES.indexOf(next.stage),index=RUN_STAGES.indexOf(stage);
 if(index<priorIndex&&!next.invalidated_downstream_stages.includes(stage))throw Error('backward_transition_requires_invalidation');
 const proof={stage,timestamp,status,input_baseline_sha:next.baseline_main_sha,current_sha:currentSha||next.current_sha,
  artifact_paths:[...new Set(artifactPaths)].sort(),workflow_run_ids:[...new Set(workflowRunIds.map(String))],pr_number:prNumber??next.pr_number,
  contract_runtime_version:next.contract_runtime_version,note};
 next.stages[stage]=proof;next.stage=stage;next.status=status;next.current_sha=proof.current_sha||next.current_sha;
 next.artifact_paths=[...new Set([...next.artifact_paths,...proof.artifact_paths])].sort();
 next.workflow_run_ids=[...new Set([...next.workflow_run_ids,...proof.workflow_run_ids])];
 if(prNumber!==null&&prNumber!==undefined)next.pr_number=Number(prNumber);
 if(retryCount!==null)next.retry_count=retryCount;
 next.publication_lifecycle=lifecycleForStage(stage);
 next.operational_status=status==='pass'?deriveOperationalStatus(resolveResumeStage({state:next})): 'BLOCKED';
 next.history.push({stage,timestamp,status,current_sha:next.current_sha,pr_number:next.pr_number,note});
 return next;
}
export function invalidateRunState(state,stage,{reason='artifact_or_contract_changed'}={}){
 if(!RUN_STAGES.includes(stage)||stage==='NOT_STARTED')throw Error('unknown_stage');
 const next=structuredClone(state),invalid=[stage,...downstream(stage)];
 for(const s of invalid)delete next.stages[s];
 next.invalidated_downstream_stages=[...new Set([...next.invalidated_downstream_stages,...invalid])];
 next.stage=RUN_STAGES[Math.max(0,RUN_STAGES.indexOf(stage)-1)];next.status='pending';next.retry_count=(next.retry_count||0)+1;
 next.operational_status=deriveOperationalStatus(stage);next.publication_lifecycle=lifecycleForStage(next.stage);
 next.history.push({stage:'INVALIDATED',timestamp:new Date().toISOString(),status:'pending',reason,from_stage:stage});
 return next;
}
export function persistRunState(root,state){
 const file=path.join(root,runStatePath(state.edition_date));fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n');fs.renameSync(temp,file);return file;
}
export function loadRunState(root,date){try{return JSON.parse(fs.readFileSync(path.join(root,runStatePath(date)),'utf8'));}catch{return null;}}

export function validateHandoffCheckpoint({baselineSha,branchHeadSha,parentSha,actualStagingRef,manifest,requiredFileExists,imageEntries=[],candidateHeadSha=null,prHeadSha=null}={}){
 const errors=[];
 if(!/^[a-f0-9]{40}$/.test(baselineSha||''))errors.push('trusted_baseline_sha_required');
 if(!/^[a-f0-9]{40}$/.test(branchHeadSha||'')||branchHeadSha===baselineSha)errors.push('handoff_branch_must_advance_from_main');
 if(parentSha!==baselineSha)errors.push('handoff_commit_parent_must_equal_trusted_main');
 if(!manifest||manifest.staging_ref!==actualStagingRef)errors.push('handoff_manifest_staging_ref_mismatch');
 for(const key of ['kernel_path','facts_path','media_path','images_path']){
  const p=manifest?.[key];if(!p||requiredFileExists?.(p)!==true)errors.push('missing_handoff_artifact:'+key);
 }
 if(imageEntries.length!==6)errors.push('six_accepted_image_entries_required');
 for(const entry of imageEntries)if(!entry?.path||requiredFileExists?.(entry.path)!==true||entry.accepted_locked!==true||entry.lock_status!=='accepted_locked')errors.push('invalid_or_missing_locked_image');
 if(candidateHeadSha&&prHeadSha&&candidateHeadSha!==prHeadSha)errors.push('pr_head_sha_must_equal_committed_candidate_sha');
 return [...new Set(errors)];
}

export const RECOVERY_MATRIX=Object.freeze({
 metadata_preflight:'PREFLIGHT_METADATA_READY',discovery_preflight:'PREFLIGHT_DISCOVERY_READY',readiness_receipt:'READINESS_FINAL',
 editorial_kernel:'EDITORIAL_KERNEL_READY',image:'IMAGES_READY',media_slot:'MEDIA_READY',watchlist:'DETERMINISTIC_EXPANSION_READY',
 handoff_write:'HANDOFF_COMMITTED',pr_ci:'PROTECTED_CI_PASS',merge:'MERGED',pages:'PAGES_VERIFIED',
 completion:'COMPLETION_PERSISTED',command_center_sync:'COMMAND_CENTER_RECONCILED'
});
