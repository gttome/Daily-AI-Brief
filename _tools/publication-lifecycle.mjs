#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {newPublicationLifecycle,transitionPublicationLifecycle,validateCompletionIntegrity,deriveCurrentEdition,derivePublicationStatus,validateCurrentProjection,lifecyclePath,completionPath} from '../_generator/lib/publication-lifecycle.mjs';

const parseArgs=argv=>{const out={_:[]};for(let i=0;i<argv.length;i++){const v=argv[i];if(v.startsWith('--')){const k=v.slice(2),n=argv[i+1];if(n!==undefined&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;}else out._.push(v);}return out;};
const a=parseArgs(process.argv.slice(2)),command=a._?.[0]||process.argv[2],root=path.resolve(a.root||'.');
const write=(relative,value)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));

if(command==='validate'){
 const errors=validateCurrentProjection(root);
 if(!errors.length){const current=read('data/operations/current-edition.json'),lifecycle=read(current.lifecycle_path),completion=read(current.completion_path),status=read('data/operations/publication-status.json'),expected=derivePublicationStatus(lifecycle,{completion,currentEdition:current});for(const key of ['edition_date','lifecycle_stage','status','terminal_outcome','production_sha','deployed_sha','completion_path'])if(status?.[key]!==expected?.[key])errors.push('publication_status_mismatch:'+key);}
 console.log(JSON.stringify({result:errors.length?'FAIL':'PASS',errors},null,2));if(errors.length)process.exitCode=1;
}else if(command==='finalize'){
 const date=a.date,completionFile=a.completion||completionPath(date),completion=read(completionFile);
 let state=newPublicationLifecycle({editionDate:date,runId:completion.run_id,baselineSha:completion.baseline_main_sha||null,createdAt:a['created-at']||completion.observed_at||new Date().toISOString(),migration:a.migration===true});
 const common={at:a['updated-at']||completion.live_verified_at||new Date().toISOString()};
 state=transitionPublicationLifecycle(state,'PREFLIGHT_READY',{...common,evidence:{kind:'durable_run_state_or_handoff',path:`_records/run-state/${date}.json`}});
 state=transitionPublicationLifecycle(state,'EDITORIAL_READY',{...common,evidence:{kind:'approved_editorial_handoff',path:'_records/editorial-handoff/handoff.json'}});
 state=transitionPublicationLifecycle(state,'CANDIDATE_READY',{...common,evidence:{kind:'deterministic_candidate',sha:a['candidate-sha']||completion.candidate_sha||completion.production_sha},patch:{candidate_sha:a['candidate-sha']||completion.candidate_sha||completion.production_sha}});
 state=transitionPublicationLifecycle(state,'PR_OPEN',{...common,evidence:{kind:'publication_pr',number:Number(a.pr||completion.pr_number||0)},patch:{publication_pr_number:Number(a.pr||completion.pr_number||0)||null,repair_pr_numbers:String(a['repair-prs']||'').split(',').map(Number).filter(Boolean)}});
 state=transitionPublicationLifecycle(state,'CI_PASS',{...common,evidence:{kind:'protected_ci',run_id:Number(a['ci-run-id']||completion.ci_run_id||0)},patch:{ci_run_id:Number(a['ci-run-id']||completion.ci_run_id||0)||null}});
 state=transitionPublicationLifecycle(state,'MERGED',{...common,evidence:{kind:'protected_merge',sha:a['publication-merge-sha']||completion.publication_merge_sha||completion.production_sha},patch:{publication_merge_sha:a['publication-merge-sha']||completion.publication_merge_sha||completion.production_sha,production_sha:completion.production_sha}});
 state=transitionPublicationLifecycle(state,'PAGES_DEPLOYED',{...common,evidence:{kind:'pages_deployment',run_id:completion.pages?.run_id,sha:completion.deployed_sha},patch:{production_sha:completion.production_sha,deployed_sha:completion.deployed_sha,pages_deployment_id:completion.pages?.run_id||null}});
 state=transitionPublicationLifecycle(state,'LIVE_VERIFIED',{...common,evidence:{kind:'live_verification',...completion.live_verification},patch:{production_sha:completion.production_sha,deployed_sha:completion.deployed_sha}});
 const integrity=validateCompletionIntegrity(state,completion);if(integrity.length)throw Error('completion_integrity_failed:'+integrity.join(','));
 state=transitionPublicationLifecycle(state,'COMPLETED',{...common,evidence:{kind:'completion_record',path:completionFile},patch:{completion_record:completionFile}});
 const current=deriveCurrentEdition(state,completion),status=derivePublicationStatus(state,{completion,currentEdition:current});
 write(lifecyclePath(date),state);write('data/operations/current-edition.json',current);write('data/operations/publication-status.json',status);
 console.log(JSON.stringify({result:'PASS',lifecycle:lifecyclePath(date),completion:completionFile,current_edition:'data/operations/current-edition.json',publication_status:'data/operations/publication-status.json'},null,2));
}else throw Error('Usage: publication-lifecycle.mjs <validate|finalize> [options]');
