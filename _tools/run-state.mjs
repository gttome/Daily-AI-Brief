#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {
 RUN_STATE_VERSION,RUN_STAGES,newRunState,loadRunState,persistRunState,checkpointRunStage,resolveResumeStageFromRepository,runStatePath,
 proofRepositoryErrors,recoveryDecision,applyRecoveryDecision,consequentialActionDecision,recordConsequentialAction
} from '../_generator/lib/run-state.mjs';

const a=parseArgs(process.argv.slice(2)),command=a._?.[0]||process.argv[2],root=path.resolve(a.root||'.'),date=a.date;
if(!date)throw Error('date_required');
const split=value=>String(value||'').split(';').map(x=>x.trim()).filter(Boolean);
const validProof=(state,stage)=>state?.stages?.[stage]&&proofRepositoryErrors(root,state.stages[stage],{baselineSha:state.baseline_main_sha,contractVersion:state.contract_runtime_version}).length===0;
const ensureRecoverable=(state,stage,reason)=>{
 if(!state)return state;
 const targetIndex=RUN_STAGES.indexOf(stage),currentIndex=RUN_STAGES.indexOf(state.stage);
 if(targetIndex<currentIndex&&!validProof(state,stage))return applyRecoveryDecision(root,state,{failureStage:stage,rootError:reason}).state;
 return state;
};

if(command==='resolve'){
 const state=loadRunState(root,date);
 const decision=recoveryDecision(root,state,{baselineSha:a.baseline||null,contractVersion:a.contract||null});
 console.log(JSON.stringify({...decision,state_path:runStatePath(date)},null,2));
 process.exit(0);
}
if(command==='recover'){
 let state=loadRunState(root,date);
 const options={failureStage:a['failure-stage']||null,rootError:a['root-error']||null,baselineSha:a.baseline||null,contractVersion:a.contract||null};
 const result=a.apply===true?applyRecoveryDecision(root,state,options):{state,decision:recoveryDecision(root,state,options)};
 if(a.apply===true&&result.state)persistRunState(root,result.state);
 if(a.out){const out=path.resolve(a.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result.decision,null,2)+'\n');}
 console.log(JSON.stringify({...result.decision,state_path:runStatePath(date),applied:a.apply===true},null,2));
 process.exit(0);
}
if(command==='checkpoint'){
 if(!a.baseline||!a.stage)throw Error('checkpoint_requires_baseline_and_stage');
 const contract=a.contract||RUN_STATE_VERSION;
 let state=loadRunState(root,date);
 if(!state||state.baseline_main_sha!==a.baseline||state.contract_runtime_version!==contract)state=newRunState({date,baselineSha:a.baseline,contractVersion:contract});
 if(validProof(state,a.stage)){
  console.log(JSON.stringify({stage:state.stage,resume_stage:resolveResumeStageFromRepository(root,state),state_path:runStatePath(date),reused_checkpoint:a.stage},null,2));process.exit(0);
 }
 state=ensureRecoverable(state,a.stage,'checkpoint_content_or_dependency_changed');
 const artifacts=split(a['artifact-paths']),inputs=split(a['input-paths']);
 if(!artifacts.length)throw Error('checkpoint_artifacts_required');
 const dependencies=a['dependency-paths']===undefined?null:split(a['dependency-paths']);
 state=checkpointRunStage(root,state,a.stage,{currentSha:a.current||state.current_sha,artifactPaths:artifacts,inputPaths:inputs,dependencyPaths:dependencies,workflowRunIds:a['workflow-run-id']?[String(a['workflow-run-id'])]:[]});
 persistRunState(root,state);
 console.log(JSON.stringify({stage:state.stage,resume_stage:resolveResumeStageFromRepository(root,state),state_path:runStatePath(date),reused_checkpoint:null},null,2));
 process.exit(0);
}
if(command==='seed-candidate'){
 let state=loadRunState(root,date)||newRunState({date,baselineSha:a.baseline,contractVersion:a.contract||RUN_STATE_VERSION});
 const current=a.current||state.current_sha,steps=[
  ['PREFLIGHT_METADATA_READY',['_records/editorial-handoff/metadata-candidates.json']],
  ['PREFLIGHT_DISCOVERY_READY',['_records/editorial-handoff/article-evidence.json']],
  ['READINESS_PRELIMINARY',['_records/editorial-handoff/metadata-candidates.json']],
  ['READINESS_FINAL',['_records/editorial-handoff/kernel.json']],
  ['EDITORIAL_KERNEL_READY',['_records/editorial-handoff/kernel.json','_records/editorial-handoff/facts.json']],
  ['MEDIA_READY',['_records/editorial-handoff/media.json','_records/editorial/media-preflight/'+date+'.json']],
  ['IMAGES_READY',['_records/editorial-handoff/final-image-review-'+date+'.json']],
  ['HANDOFF_COMMITTED',['_records/editorial-handoff/handoff.json',...(fs.existsSync(path.join(root,'_records/editorial-handoff/publication-manifest.json'))?['_records/editorial-handoff/publication-manifest.json']:[])]],
  ['DETERMINISTIC_EXPANSION_READY',['_data/editions/'+date+'.json']]
 ];
 for(const [stage,artifacts] of steps){
  if(validProof(state,stage))continue;
  state=ensureRecoverable(state,stage,'seed_candidate_checkpoint_changed');
  const present=artifacts.filter(p=>fs.existsSync(path.join(root,p)));if(!present.length)throw Error('missing_stage_evidence:'+stage);
  let dependencyPaths=null;
  if(stage==='HANDOFF_COMMITTED'&&fs.existsSync(path.join(root,'_records/editorial-handoff/publication-manifest.json'))){
   const manifest=JSON.parse(fs.readFileSync(path.join(root,'_records/editorial-handoff/publication-manifest.json'),'utf8'));
   dependencyPaths=Object.values(manifest.artifacts||{}).map(x=>x?.path).filter(Boolean);
  }
  state=checkpointRunStage(root,state,stage,{currentSha:current,artifactPaths:present,dependencyPaths});
 }
 persistRunState(root,state);console.log(JSON.stringify({stage:state.stage,...recoveryDecision(root,state)},null,2));process.exit(0);
}
if(command==='finalize'){
 let state=loadRunState(root,date);if(!state)throw Error('candidate_run_state_required_before_finalization');
 const sha=a['production-sha']||state.current_sha,pr=Number(a.pr||0)||null;
 const steps=[
  ['PR_CREATED',[],{prNumber:pr}],['PROTECTED_CI_PASS',[],{}],['MERGED',[],{}],
  ['PAGES_VERIFIED',[a.completion].filter(Boolean),{}],['COMPLETION_PERSISTED',[a.completion].filter(Boolean),{}],
  ['DELTA_VALIDATED',[a.validation].filter(Boolean),{}],['COMMAND_CENTER_RECONCILED',[a.cc].filter(Boolean),{}],['CLOSED',[a.completion,a.validation,a.cc].filter(Boolean),{}]
 ];
 for(const [stage,artifacts,extra] of steps){
  if(validProof(state,stage))continue;
  state=ensureRecoverable(state,stage,'finalization_checkpoint_changed');
  state=checkpointRunStage(root,state,stage,{currentSha:sha,artifactPaths:artifacts,...extra});
  if(stage==='PR_CREATED'&&pr){
   const action=recordConsequentialAction(state,{type:'publication_pr',key:'pr:'+pr,evidence:{pr_number:pr}});state=action.state;
  }else if(stage==='MERGED'){
   const action=recordConsequentialAction(state,{type:'merge',key:'sha:'+sha,evidence:{production_sha:sha}});state=action.state;
  }else if(stage==='COMPLETION_PERSISTED'){
   const action=recordConsequentialAction(state,{type:'completion',key:'sha:'+sha,evidence:{completion_path:a.completion||null}});state=action.state;
  }else if(stage==='COMMAND_CENTER_RECONCILED'){
   const action=recordConsequentialAction(state,{type:'command_center_sync',key:'sha:'+sha,evidence:{command_center_delta:a.cc||null}});state=action.state;
  }
 }
 persistRunState(root,state);console.log(JSON.stringify({stage:state.stage,lifecycle:state.publication_lifecycle,operational_status:state.operational_status,...recoveryDecision(root,state)},null,2));process.exit(0);
}
if(command==='action-check'){
 const state=loadRunState(root,date);if(!state)throw Error('run_state_required');
 console.log(JSON.stringify(consequentialActionDecision(state,{type:a.type,key:a.key,scope:a.scope||'edition'}),null,2));process.exit(0);
}
if(command==='action-record'){
 let state=loadRunState(root,date);if(!state)throw Error('run_state_required');
 const result=recordConsequentialAction(state,{type:a.type,key:a.key,scope:a.scope||'edition',status:a.status||'completed',evidence:a.evidence?JSON.parse(a.evidence):null});
 state=result.state;persistRunState(root,state);console.log(JSON.stringify({reused:result.reused,state_path:runStatePath(date)},null,2));process.exit(0);
}
throw Error('unknown_command');
