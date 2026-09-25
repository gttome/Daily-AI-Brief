import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const RUN_STATE_VERSION='sep24-reliability-v1';
export const CHECKPOINT_DIGEST_VERSION='checkpoint-digests-v1';
export const RUN_STAGES=Object.freeze([
 'NOT_STARTED','PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY','READINESS_FINAL',
 'EDITORIAL_KERNEL_READY','MEDIA_READY','IMAGES_READY','HANDOFF_COMMITTED','DETERMINISTIC_EXPANSION_READY','PR_CREATED',
 'PROTECTED_CI_PASS','MERGED','PAGES_VERIFIED','COMPLETION_PERSISTED','DELTA_VALIDATED','COMMAND_CENTER_RECONCILED','CLOSED'
]);
export const OPERATIONAL_STATUSES=Object.freeze(['PREPARING','READY','EDITORIAL','ASSETS','HANDOFF','CI','MERGED','PAGES','FINAL_VALIDATION','COMMAND_CENTER_SYNC','COMPLETE','BLOCKED']);
export const PUBLICATION_LIFECYCLE=Object.freeze(['staged','candidate','validated','merged','deployed','verified','closed']);
export const CONSEQUENTIAL_ACTION_TYPES=Object.freeze(['publication_pr','merge','completion','command_center_sync','image_generation']);
const downstream=stage=>RUN_STAGES.slice(Math.max(1,RUN_STAGES.indexOf(stage)+1));
const safeDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const sortedUnique=values=>[...new Set((values||[]).filter(Boolean))].sort();

export function runStatePath(date){if(!safeDate(date))throw Error('valid_edition_date_required');return '_records/run-state/'+date+'.json';}
export function newRunState({date,baselineSha,contractVersion=RUN_STATE_VERSION}){
 if(!safeDate(date)||!/^[a-f0-9]{40}$/.test(baselineSha||''))throw Error('date_and_baseline_required');
 return {schema_version:'1.1.0',checkpoint_digest_version:CHECKPOINT_DIGEST_VERSION,edition_date:date,baseline_main_sha:baselineSha,current_sha:baselineSha,contract_runtime_version:contractVersion,
  stage:'NOT_STARTED',status:'pending',retry_count:0,pr_number:null,workflow_run_ids:[],artifact_paths:[],invalidated_downstream_stages:[],consequential_actions:[],
  publication_lifecycle:'staged',operational_status:'PREPARING',stages:{},history:[]};
}
export function digestPathSet(root,paths=[]){
 const records=sortedUnique(paths).map(relative=>{
  const file=path.join(root,relative);
  if(!fs.existsSync(file))return {path:relative,state:'missing',sha256:null};
  const stat=fs.statSync(file);if(!stat.isFile())return {path:relative,state:'not_file',sha256:null};
  return {path:relative,state:'file',sha256:sha256(fs.readFileSync(file))};
 });
 return 'sha256:'+sha256(JSON.stringify(records));
}
function inputDigest(root,{stage,baselineSha,contractVersion,currentSha,inputPaths=[]}){
 return 'sha256:'+sha256(JSON.stringify({stage,baseline_sha:baselineSha,contract_version:contractVersion,current_sha:currentSha||null,input_paths:sortedUnique(inputPaths),input_files_digest:digestPathSet(root,inputPaths)}));
}
function priorProof(state,stage){
 const index=RUN_STAGES.indexOf(stage);
 for(let i=index-1;i>0;i--){const proof=state?.stages?.[RUN_STAGES[i]];if(proof?.status==='pass')return proof;}
 return null;
}
function requiredPathsExist(root,paths){return sortedUnique(paths).every(relative=>fs.existsSync(path.join(root,relative))&&fs.statSync(path.join(root,relative)).isFile());}
function proofValid(p,{baselineSha,contractVersion}={}){
 if(!p||p.status!=='pass')return false;
 if(baselineSha&&p.input_baseline_sha&&p.input_baseline_sha!==baselineSha)return false;
 if(contractVersion&&p.contract_runtime_version&&p.contract_runtime_version!==contractVersion)return false;
 if(Array.isArray(p.artifact_paths)&&p.artifact_paths.some(x=>typeof x!=='string'||!x))return false;
 return true;
}
export function proofRepositoryErrors(root,p,{baselineSha=null,contractVersion=null}={}){
 const errors=[];if(!proofValid(p,{baselineSha,contractVersion}))errors.push('checkpoint_structural_invalid');
 if((p?.artifact_paths||[]).some(relative=>!fs.existsSync(path.join(root,relative))))errors.push('checkpoint_output_missing');
 if(p?.checkpoint_digest_version===CHECKPOINT_DIGEST_VERSION){
  if(!requiredPathsExist(root,p.artifact_paths||[]))errors.push('checkpoint_output_not_file');
  if(!requiredPathsExist(root,p.input_paths||[]))errors.push('checkpoint_input_missing');
  if(!requiredPathsExist(root,p.dependency_paths||[]))errors.push('checkpoint_dependency_missing');
  const currentInput=inputDigest(root,{stage:p.stage,baselineSha:p.input_baseline_sha,contractVersion:p.contract_runtime_version,currentSha:p.current_sha,inputPaths:p.input_paths||[]});
  if(currentInput!==p.input_digest)errors.push('checkpoint_input_digest_changed');
  if(digestPathSet(root,p.dependency_paths||[])!==p.dependency_digest)errors.push('checkpoint_dependency_digest_changed');
  if(digestPathSet(root,p.artifact_paths||[])!==p.output_digest)errors.push('checkpoint_output_digest_changed');
 }
 return [...new Set(errors)];
}
export function resolveResumeStage({state,baselineSha=null,contractVersion=null}={}){
 if(!state)return 'PREFLIGHT_METADATA_READY';
 const baseline=baselineSha||state.baseline_main_sha,contract=contractVersion||state.contract_runtime_version;
 if(baselineSha&&state.baseline_main_sha!==baselineSha)return 'PREFLIGHT_METADATA_READY';
 if(contractVersion&&state.contract_runtime_version!==contractVersion)return 'PREFLIGHT_METADATA_READY';
 for(const stage of RUN_STAGES.slice(1,-1))if(!proofValid(state.stages?.[stage],{baselineSha:baseline,contractVersion:contract}))return stage;
 return 'CLOSED';
}
export function resolveResumeStageFromRepository(root,state,{baselineSha=null,contractVersion=null}={}){
 const structural=resolveResumeStage({state,baselineSha,contractVersion});
 if(!state||structural==='PREFLIGHT_METADATA_READY')return structural;
 const baseline=baselineSha||state.baseline_main_sha,contract=contractVersion||state.contract_runtime_version;
 for(const stage of RUN_STAGES.slice(1,-1)){
  const proof=state.stages?.[stage];
  if(proofRepositoryErrors(root,proof,{baselineSha:baseline,contractVersion:contract}).length)return stage;
 }
 return 'CLOSED';
}
export function deriveOperationalStatus(resumeStage){
 if(['PREFLIGHT_METADATA_READY','PREFLIGHT_DISCOVERY_READY','READINESS_PRELIMINARY'].includes(resumeStage))return 'PREPARING';
 if(resumeStage==='READINESS_FINAL')return 'READY';
 if(resumeStage==='EDITORIAL_KERNEL_READY')return 'EDITORIAL';
 if(['MEDIA_READY','IMAGES_READY'].includes(resumeStage))return 'ASSETS';
 if(['HANDOFF_COMMITTED','DETERMINISTIC_EXPANSION_READY','PR_CREATED'].includes(resumeStage))return 'HANDOFF';
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
export function markRunStage(state,stage,{timestamp=new Date().toISOString(),currentSha=null,artifactPaths=[],workflowRunIds=[],prNumber=null,status='pass',retryCount=null,note=null,inputPaths=[],dependencyPaths=[],inputDigestValue=null,dependencyDigest=null,outputDigest=null}={}){
 if(!RUN_STAGES.includes(stage)||stage==='NOT_STARTED')throw Error('unknown_or_nonterminal_stage');
 const next=structuredClone(state);
 const priorIndex=RUN_STAGES.indexOf(next.stage),index=RUN_STAGES.indexOf(stage);
 if(index<priorIndex&&!next.invalidated_downstream_stages.includes(stage))throw Error('backward_transition_requires_invalidation');
 const proof={stage,timestamp,status,input_baseline_sha:next.baseline_main_sha,current_sha:currentSha||next.current_sha,
  artifact_paths:sortedUnique(artifactPaths),input_paths:sortedUnique(inputPaths),dependency_paths:sortedUnique(dependencyPaths),
  input_digest:inputDigestValue,dependency_digest:dependencyDigest,output_digest:outputDigest,checkpoint_digest_version:outputDigest?CHECKPOINT_DIGEST_VERSION:null,
  workflow_run_ids:[...new Set(workflowRunIds.map(String))],pr_number:prNumber??next.pr_number,contract_runtime_version:next.contract_runtime_version,note};
 next.schema_version='1.1.0';next.checkpoint_digest_version=CHECKPOINT_DIGEST_VERSION;
 if(!Array.isArray(next.consequential_actions))next.consequential_actions=[];
 next.stages[stage]=proof;next.stage=stage;next.status=status;next.current_sha=proof.current_sha||next.current_sha;
 next.artifact_paths=sortedUnique([...next.artifact_paths,...proof.artifact_paths]);
 next.workflow_run_ids=[...new Set([...next.workflow_run_ids,...proof.workflow_run_ids])];
 if(prNumber!==null&&prNumber!==undefined)next.pr_number=Number(prNumber);
 if(retryCount!==null)next.retry_count=retryCount;
 next.publication_lifecycle=lifecycleForStage(stage);
 next.operational_status=status==='pass'?deriveOperationalStatus(resolveResumeStage({state:next})): 'BLOCKED';
 next.history.push({stage,timestamp,status,current_sha:next.current_sha,pr_number:next.pr_number,note,input_digest:proof.input_digest,dependency_digest:proof.dependency_digest,output_digest:proof.output_digest});
 return next;
}
export function checkpointRunStage(root,state,stage,{timestamp=new Date().toISOString(),currentSha=null,artifactPaths=[],inputPaths=[],dependencyPaths=null,workflowRunIds=[],prNumber=null,status='pass',retryCount=null,note=null}={}){
 const outputs=sortedUnique(artifactPaths),inputs=sortedUnique(inputPaths),prior=priorProof(state,stage);
 const dependencies=dependencyPaths===null?sortedUnique(prior?.artifact_paths||[]):sortedUnique(dependencyPaths);
 if(!requiredPathsExist(root,outputs))throw Error('checkpoint_output_missing_or_not_file');
 if(inputs.length&&!requiredPathsExist(root,inputs))throw Error('checkpoint_input_missing_or_not_file');
 if(dependencies.length&&!requiredPathsExist(root,dependencies))throw Error('checkpoint_dependency_missing_or_not_file');
 const effectiveSha=currentSha||state.current_sha;
 return markRunStage(state,stage,{timestamp,currentSha:effectiveSha,artifactPaths:outputs,inputPaths:inputs,dependencyPaths:dependencies,workflowRunIds,prNumber,status,retryCount,note,
  inputDigestValue:inputDigest(root,{stage,baselineSha:state.baseline_main_sha,contractVersion:state.contract_runtime_version,currentSha:effectiveSha,inputPaths:inputs}),
  dependencyDigest:digestPathSet(root,dependencies),outputDigest:digestPathSet(root,outputs)});
}
export function invalidateRunState(state,stage,{reason='artifact_or_contract_changed',timestamp=new Date().toISOString()}={}){
 if(!RUN_STAGES.includes(stage)||stage==='NOT_STARTED')throw Error('unknown_stage');
 const next=structuredClone(state),invalid=[stage,...downstream(stage)];
 for(const s of invalid)delete next.stages[s];
 next.invalidated_downstream_stages=[...new Set([...next.invalidated_downstream_stages,...invalid])];
 next.stage=RUN_STAGES[Math.max(0,RUN_STAGES.indexOf(stage)-1)];next.status='pending';next.retry_count=(next.retry_count||0)+1;
 next.operational_status=deriveOperationalStatus(stage);next.publication_lifecycle=lifecycleForStage(next.stage);
 next.history.push({stage:'INVALIDATED',timestamp,status:'pending',reason,from_stage:stage});
 return next;
}
const recoveryAction=stage=>({
 PREFLIGHT_METADATA_READY:'Resume metadata preflight only.',
 PREFLIGHT_DISCOVERY_READY:'Resume discovery/evidence preflight; preserve valid metadata.',
 READINESS_PRELIMINARY:'Recompute preliminary readiness only.',
 READINESS_FINAL:'Recompute final readiness only.',
 EDITORIAL_KERNEL_READY:'Resume editorial kernel from preserved preflight evidence.',
 MEDIA_READY:'Repair or revalidate media only.',
 IMAGES_READY:'Reuse accepted images; regenerate only invalidated story images.',
 HANDOFF_COMMITTED:'Rewrite/validate handoff only.',
 DETERMINISTIC_EXPANSION_READY:'Regenerate deterministic publication outputs only.',
 PR_CREATED:'Reuse an existing matching publication PR or create exactly one.',
 PROTECTED_CI_PASS:'Run required CI for the exact candidate only.',
 MERGED:'Merge the exact passing candidate once.',
 PAGES_VERIFIED:'Verify the exact production SHA deployment.',
 COMPLETION_PERSISTED:'Persist one completion record after live verification.',
 DELTA_VALIDATED:'Run post-deployment delta validation only.',
 COMMAND_CENTER_RECONCILED:'Synchronize Command Center once.',
 CLOSED:'No recovery action required.'
})[stage]||'Inspect the earliest invalid stage.';
export function recoveryDecision(root,state,{failureStage=null,rootError=null,baselineSha=null,contractVersion=null}={}){
 const resume=resolveResumeStageFromRepository(root,state,{baselineSha,contractVersion});
 if(!state)return {failure_stage:failureStage,root_error:rootError,earliest_invalid_stage:resume,preserved_stages:[],invalidated_stages:[],resume_stage:resume,safe_next_action:recoveryAction(resume)};
 const resumeIndex=RUN_STAGES.indexOf(resume),preserved=[],invalidated=[];
 for(const stage of RUN_STAGES.slice(1)){
  const proof=state.stages?.[stage];if(!proof)continue;
  const index=RUN_STAGES.indexOf(stage);
  if(index<resumeIndex&&!proofRepositoryErrors(root,proof,{baselineSha:baselineSha||state.baseline_main_sha,contractVersion:contractVersion||state.contract_runtime_version}).length)preserved.push(stage);
  else if(resume!=='CLOSED'&&index>=resumeIndex)invalidated.push(stage);
 }
 return {failure_stage:failureStage||((state.status&&state.status!=='pass')?state.stage:null),root_error:rootError||null,earliest_invalid_stage:resume,preserved_stages:preserved,invalidated_stages:invalidated,resume_stage:resume,safe_next_action:recoveryAction(resume)};
}
export function applyRecoveryDecision(root,state,options={}){
 const decision=recoveryDecision(root,state,options);
 if(!state||decision.resume_stage==='CLOSED')return {state,decision};
 return {state:invalidateRunState(state,decision.resume_stage,{reason:options.rootError||'dependency_or_output_digest_changed'}),decision};
}
export function persistRunState(root,state){
 const file=path.join(root,runStatePath(state.edition_date));fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n');fs.renameSync(temp,file);return file;
}
export function loadRunState(root,date){try{return JSON.parse(fs.readFileSync(path.join(root,runStatePath(date)),'utf8'));}catch{return null;}}

export function consequentialActionDecision(state,{type,key,scope='edition'}={}){
 if(!CONSEQUENTIAL_ACTION_TYPES.includes(type)||typeof key!=='string'||!key)throw Error('valid_consequential_action_required');
 const actions=Array.isArray(state?.consequential_actions)?state.consequential_actions:[];
 const existing=actions.find(action=>action.type===type&&action.scope===scope&&action.status==='completed');
 if(!existing)return {allow:true,reuse:false,reason:'no_completed_action',existing:null};
 if(existing.key===key)return {allow:false,reuse:true,reason:'identical_action_already_completed',existing};
 return {allow:false,reuse:false,reason:'conflicting_completed_action',existing};
}
export function recordConsequentialAction(state,{type,key,scope='edition',status='completed',evidence=null,timestamp=new Date().toISOString()}={}){
 const decision=consequentialActionDecision(state,{type,key,scope});
 if(decision.reuse)return {state:structuredClone(state),reused:true};
 if(!decision.allow)throw Error('consequential_action_conflict:'+type+':'+scope);
 const next=structuredClone(state);if(!Array.isArray(next.consequential_actions))next.consequential_actions=[];
 next.consequential_actions.push({type,key,scope,status,evidence,timestamp});
 next.history.push({stage:'ACTION_RECORDED',timestamp,status:'pass',action_type:type,action_key:key,scope});
 return {state:next,reused:false};
}

export function validateHandoffCheckpoint({baselineSha,branchHeadSha,parentSha,actualStagingRef,manifest,requiredFileExists,imageEntries=[],candidateHeadSha=null,prHeadSha=null}={}){
 const errors=[];
 if(!/^[a-f0-9]{40}$/.test(baselineSha||''))errors.push('trusted_baseline_sha_required');
 if(!/^[a-f0-9]{40}$/.test(branchHeadSha||'')||branchHeadSha===baselineSha)errors.push('handoff_branch_must_advance_from_main');
 if(parentSha!==baselineSha)errors.push('handoff_commit_parent_must_equal_trusted_main');
 if(!manifest||manifest.staging_ref!==actualStagingRef)errors.push('handoff_manifest_staging_ref_mismatch');
 const requiredKeys=['kernel_path','facts_path','media_path','images_path'];
 if(manifest?.schema_version!=='1.0.0'||manifest?.publication_manifest_path)requiredKeys.push('publication_manifest_path');
 for(const key of requiredKeys){
  const p=manifest?.[key];if(!p||requiredFileExists?.(p)!==true)errors.push('missing_handoff_artifact:'+key);
 }
 if(imageEntries.length!==6)errors.push('six_accepted_image_entries_required');
 for(const entry of imageEntries)if(!entry?.path||requiredFileExists?.(entry.path)!==true||entry.accepted_locked!==true||entry.lock_status!=='accepted_locked')errors.push('invalid_or_missing_locked_image');
 if(candidateHeadSha&&prHeadSha&&candidateHeadSha!==prHeadSha)errors.push('pr_head_sha_must_equal_committed_candidate_sha');
 return [...new Set(errors)];
}

export const RECOVERY_MATRIX=Object.freeze({
 metadata_preflight:'PREFLIGHT_METADATA_READY',discovery_preflight:'PREFLIGHT_DISCOVERY_READY',readiness_receipt:'READINESS_FINAL',
 editorial_kernel:'EDITORIAL_KERNEL_READY',image:'IMAGES_READY',media_slot:'MEDIA_READY',watchlist:'HANDOFF_COMMITTED',publication_manifest:'HANDOFF_COMMITTED',
 handoff_write:'HANDOFF_COMMITTED',publication_pr:'PR_CREATED',pr_ci:'PROTECTED_CI_PASS',merge:'MERGED',pages:'PAGES_VERIFIED',
 completion:'COMPLETION_PERSISTED',command_center_sync:'COMMAND_CENTER_RECONCILED'
});

export function acceptedImageReusable(entry,{storyChanged=false,observedSha256=null,observedGitBlobSha=null}={}){
 if(storyChanged||!entry||entry.accepted_locked!==true||entry.lock_status!=='accepted_locked')return false;
 const stable=entry.sha256||entry.git_blob_sha||entry.cache_key||null;if(!stable)return false;
 if(observedSha256&&entry.sha256&&entry.sha256!==observedSha256)return false;
 if(observedGitBlobSha&&entry.git_blob_sha&&entry.git_blob_sha!==observedGitBlobSha)return false;
 return true;
}
export function mediaReceiptReusable(receipt,kernelSha256){
 if(!receipt||receipt.editorial_kernel_sha256!==kernelSha256||!/^[a-f0-9]{64}$/.test(kernelSha256||''))return false;
 if(receipt.podcast_source_diversity?.pass!==true)return false;
 const items=receipt.items||[];return items.length===4&&items.filter(x=>x.kind==='video').length===2&&items.filter(x=>x.kind==='podcast').length===2&&items.every(x=>x.verification_evidence&&x.verification_timestamp);
}
