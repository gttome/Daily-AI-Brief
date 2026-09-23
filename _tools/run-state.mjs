#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {RUN_STATE_VERSION,newRunState,loadRunState,persistRunState,markRunStage,resolveResumeStage,runStatePath} from '../_generator/lib/run-state.mjs';
const a=parseArgs(process.argv.slice(2)),command=a._?.[0]||process.argv[2],root=path.resolve(a.root||'.'),date=a.date;
if(!date)throw Error('date_required');
if(command==='resolve'){const state=loadRunState(root,date);console.log(JSON.stringify({resume_stage:resolveResumeStage({state}),state_path:runStatePath(date)},null,2));process.exit(0);}
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
  ['HANDOFF_COMMITTED',['_records/editorial-handoff/handoff.json']],
  ['DETERMINISTIC_EXPANSION_READY',['_data/editions/'+date+'.json','data/operations/current-edition.json']]
 ];
 for(const [stage,artifacts] of steps){const present=artifacts.filter(p=>fs.existsSync(path.join(root,p)));if(!present.length)throw Error('missing_stage_evidence:'+stage);state=markRunStage(state,stage,{currentSha:current,artifactPaths:present});}
 persistRunState(root,state);console.log(JSON.stringify({stage:state.stage,resume_stage:resolveResumeStage({state})},null,2));process.exit(0);
}
if(command==='finalize'){
 let state=loadRunState(root,date);if(!state)throw Error('candidate_run_state_required_before_finalization');
 const sha=a['production-sha']||state.current_sha,pr=Number(a.pr||0)||null;
 const steps=[
  ['PR_CREATED',[],{prNumber:pr}],['PROTECTED_CI_PASS',[],{}],['MERGED',[],{}],
  ['PAGES_VERIFIED',[a.completion].filter(Boolean),{}],['COMPLETION_PERSISTED',[a.completion].filter(Boolean),{}],
  ['DELTA_VALIDATED',[a.validation].filter(Boolean),{}],['COMMAND_CENTER_RECONCILED',[a.cc].filter(Boolean),{}],['CLOSED',[a.completion,a.validation,a.cc].filter(Boolean),{}]
 ];
 for(const [stage,artifacts,extra] of steps)state=markRunStage(state,stage,{currentSha:sha,artifactPaths:artifacts,...extra});
 persistRunState(root,state);console.log(JSON.stringify({stage:state.stage,lifecycle:state.publication_lifecycle,operational_status:state.operational_status},null,2));process.exit(0);
}
throw Error('unknown_command');
