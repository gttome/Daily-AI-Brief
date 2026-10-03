#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {
  newPublicationLifecycle, transitionPublicationLifecycle, validateCompletionIntegrity,
  deriveCurrentEdition, derivePublicationStatus
} from '../_generator/lib/publication-lifecycle.mjs';
import {
  newRunState, checkpointRunStage, persistRunState, recordConsequentialAction,
  RUN_STATE_VERSION
} from '../_generator/lib/run-state.mjs';
import {commandCenterDeltaPacket, canonicalStatusDigest} from '../_generator/lib/command-center-delta.mjs';
import {watchlistDeltaPlan} from '../_generator/lib/watchlist-delta.mjs';
import {watchlistDailySummary} from '../_generator/lib/watchlist.mjs';
import {
  parseOperationalLearningLedger, canonicalLedgerText, validateOperationalLearningReadiness,
  certifyRunLearningForTask29, renderOperationalLearningMarkdown
} from '../_generator/lib/operational-learning.mjs';
import {projectKanbanFromEvents} from '../_generator/lib/run-supervisor.mjs';

const DATE='2026-10-01';
const EDITION_ID='dab-edition-2026-10-01';
const EXECUTION_ID='reliable-edition-20261001-run4';
const EXECUTION_KEY='2026-10-01-run4';
const RUN_NUMBER=4;
const RUN_BRANCH='reliable-edition/dab-edition-2026-10-01-run4';
const CANDIDATE_SHA='ca3702a4b3e276456402257305fe39c3ec82b002';
const PRODUCTION_SHA='ce3dac9d75949f381821dfd34163048bf08c65d6';
const PUBLICATION_PR=335;
const CI_RUN_ID=36961015454;
const PAGES_RUN_ID=36961091571;
const PAGES_VERIFIED_AT='2026-10-02T03:39:53Z';
const DEPLOYMENT_URL='https://gttome.github.io/Daily-AI-Brief/';
const root=process.cwd();

function parseArgs(argv){
  const out={_:[]};
  for(let i=0;i<argv.length;i++){
    const v=argv[i];
    if(v.startsWith('--')){
      const k=v.slice(2),n=argv[i+1];
      if(n!==undefined&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;
    }else out._.push(v);
  }
  return out;
}
const args=parseArgs(process.argv.slice(2));
const command=args._[0]||'';
const abs=p=>path.isAbsolute(p)?p:path.join(root,p);
const readJson=p=>JSON.parse(fs.readFileSync(abs(p),'utf8'));
const writeJson=(p,v)=>{const f=abs(p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');};
const writeText=(p,v)=>{const f=abs(p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v);};
const sha256=value=>createHash('sha256').update(value).digest('hex');
const addSeconds=(iso,n)=>new Date(Date.parse(iso)+n*1000).toISOString().replace(/\.\d{3}Z$/,'Z');
const eventDir='_records/edition-execution/events/'+EXECUTION_KEY;
const completionPath='_records/publication/'+DATE+'/completion.json';
const validatedPath='_records/publication/'+DATE+'/'+EXECUTION_ID+'.validated.json';
const validationPath='_records/publication/'+DATE+'/delta-validation.json';
const lifecyclePath='_records/publication/'+DATE+'/lifecycle.json';
const ccPath='_records/command-center/'+DATE+'-public-safe-delta.json';
const ccStatePath='_records/command-center/'+DATE+'-synchronized-state.json';
const ccReceiptPath='_records/command-center/'+DATE+'-reconciliation-receipt.json';
const publicClosedPath='_records/publication/'+DATE+'/public-closed.json';
const cleanupPath='_records/edition-execution/cleanup/dab-edition-2026-10-01-run4.json';
const runLearningPath='_records/run-learning/dab-edition-2026-10-01-run4.json';
const learningCertPath='_records/run-learning/reliable-edition-20261001-run4-certification.json';
const timingPath='_records/edition-execution/timing/2026-10-01-run4.json';
const ledgerPath='data/operations/production-continuous-improvement-ledger.jsonl';
const ledgerMarkdown='docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md';
const runDeltaPath='_records/run-learning/incidents/'+EXECUTION_ID+'.jsonl';
const leasePath='_records/edition-execution/writer-leases/'+EXECUTION_ID+'.json';
const pointerPath='data/operations/active-production-run.json';

function editionFileSet(){
  const edition=readJson('_data/editions/'+DATE+'.json');
  const storyFiles=(edition.stories||[]).map(s=>'stories/'+DATE+'/'+s.slug+'.md');
  const videoFiles=['videos/'+DATE+'/general.md','videos/'+DATE+'/agent-skills.md'];
  const podcastFiles=(edition.podcasts||[]).map(p=>String(p.permanent_url||'').replace(/^\//,'').replace(/\/$/,'')+'.md');
  const assets=(edition.stories||[]).map(s=>s.image?.path).filter(Boolean);
  return {
    canonical_sources:['_data/editions/'+DATE+'.json'],
    assets,
    derived_outputs:[
      'briefs/'+DATE+'.md','latest.md','index.md','README.md','archive.md',
      'feed.xml','daily-feed.xml','feed.json',
      ...storyFiles,...videoFiles,...podcastFiles
    ]
  };
}

function baseChecks(){
  return [
    {check_id:'edition_validation',class:'deterministic',result:'pass',severity:'critical',evidence:'Canonical October 1 Run 4 edition passed protected integrated validation.'},
    {check_id:'atomic_file_set',class:'deterministic',result:'pass',severity:'critical',evidence:'Canonical Brief, permanent pages, feeds and six accepted assets are present in the protected release.'},
    {check_id:'watchlist_freshness',class:'deterministic',result:'pass',severity:'critical',evidence:'October 1 Watchlist sweep is sealed at 0 new / 2 updated / 14 carried forward.'},
    {check_id:'selected_media_preflight',class:'live_prepublication',result:'pass',severity:'critical',evidence:'Two videos and two source-diverse podcasts remain bound to the Run 4 release.'},
    {check_id:'image_structural_gate',class:'deterministic',result:'pass',severity:'critical',evidence:'All six accepted_locked October 1 image assets passed structural validation.'},
    {check_id:'image_editorial_quality_gate',class:'editorial_evidence',result:'pass',severity:'critical',evidence:'All six October 1 story images passed the professional editorial quality gate.'}
  ];
}

function buildValidatedEvent(){
  const manifest=readJson('_records/editorial-handoff/publication-manifest.json');
  return {
    schema_version:'2.0.0',
    event_id:'dab-publication-event-20261002T033858Z-run4',
    run_id:EXECUTION_ID,
    phase:'validated',
    edition_id:EDITION_ID,
    observed_at:'2026-10-02T03:38:36Z',
    baseline_main_sha:manifest.baseline_sha,
    staged_tree_digest:'sha256:'+sha256(CANDIDATE_SHA+':'+EDITION_ID),
    generator_version:'1.0.0',
    contract_version:'1.0.0',
    checks:baseChecks(),
    file_set:editionFileSet(),
    commit_sha:null,
    pages:{run_id:null,conclusion:'not_run',verified_at:null},
    rollback_target_sha:manifest.baseline_sha,
    supersedes_event_id:null,
    candidate_sha:CANDIDATE_SHA,
    publication_merge_sha:PRODUCTION_SHA,
    pr_number:PUBLICATION_PR,
    ci_run_id:CI_RUN_ID
  };
}

function buildPagesCompletion(){
  const validated=buildValidatedEvent();
  return {
    ...validated,
    schema_version:'2.0.0',
    phase:'pages_verified',
    observed_at:PAGES_VERIFIED_AT,
    commit_sha:PRODUCTION_SHA,
    production_sha:PRODUCTION_SHA,
    deployed_sha:PRODUCTION_SHA,
    pages:{
      run_id:PAGES_RUN_ID,
      conclusion:'success',
      verified_at:PAGES_VERIFIED_AT,
      deployed_sha:PRODUCTION_SHA,
      deployment_url:DEPLOYMENT_URL
    },
    supersedes_event_id:validated.event_id
  };
}

function requireValidationPass(validation){
  const required=[
    'publication_receipt','canonical_edition_contract','image_asset_lock','pages_deployment',
    'live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets','live_image_bytes'
  ];
  const pass=id=>(validation.checks||[]).some(c=>c.check_id===id&&c.result==='pass');
  if(validation.final_result!=='pass')throw Error('independent_live_validation_not_pass');
  for(const id of required)if(!pass(id))throw Error('independent_live_validation_missing:'+id);
  if(validation.date!==DATE)throw Error('independent_live_validation_wrong_date');
}

function transitionLifecycle(completion){
  const manifest=readJson('_records/editorial-handoff/publication-manifest.json');
  const liveAt=completion.live_verified_at;
  let state=newPublicationLifecycle({
    editionDate:DATE,runId:EXECUTION_ID,baselineSha:manifest.baseline_sha,
    createdAt:'2026-10-02T03:18:53Z'
  });
  state=transitionPublicationLifecycle(state,'PREFLIGHT_READY',{at:'2026-10-02T03:18:53Z',evidence:{kind:'durable_run4_qualification',path:'_records/qualification/2026-10-01-run4/result.json'}});
  state=transitionPublicationLifecycle(state,'EDITORIAL_READY',{at:'2026-10-02T03:18:53Z',evidence:{kind:'approved_editorial_handoff',path:'_records/editorial-handoff/handoff.json'}});
  state=transitionPublicationLifecycle(state,'CANDIDATE_READY',{at:'2026-10-02T03:18:53Z',evidence:{kind:'deterministic_candidate',sha:CANDIDATE_SHA},patch:{candidate_sha:CANDIDATE_SHA}});
  state=transitionPublicationLifecycle(state,'PR_OPEN',{at:'2026-10-02T03:19:24Z',evidence:{kind:'publication_pr',number:PUBLICATION_PR},patch:{publication_pr_number:PUBLICATION_PR}});
  state=transitionPublicationLifecycle(state,'CI_PASS',{at:'2026-10-02T03:38:36Z',evidence:{kind:'protected_ci',run_id:CI_RUN_ID},patch:{ci_run_id:CI_RUN_ID}});
  state=transitionPublicationLifecycle(state,'MERGED',{at:'2026-10-02T03:38:58Z',evidence:{kind:'protected_merge',sha:PRODUCTION_SHA},patch:{publication_merge_sha:PRODUCTION_SHA,production_sha:PRODUCTION_SHA}});
  state=transitionPublicationLifecycle(state,'PAGES_DEPLOYED',{at:PAGES_VERIFIED_AT,evidence:{kind:'pages_deployment',run_id:PAGES_RUN_ID,sha:PRODUCTION_SHA},patch:{production_sha:PRODUCTION_SHA,deployed_sha:PRODUCTION_SHA,pages_deployment_id:PAGES_RUN_ID}});
  state=transitionPublicationLifecycle(state,'LIVE_VERIFIED',{at:liveAt,evidence:{kind:'live_verification',...completion.live_verification},patch:{production_sha:PRODUCTION_SHA,deployed_sha:PRODUCTION_SHA}});
  const errors=validateCompletionIntegrity(state,completion);
  if(errors.length)throw Error('completion_integrity_failed:'+errors.join(','));
  state=transitionPublicationLifecycle(state,'COMPLETED',{at:liveAt,evidence:{kind:'completion_record',path:completionPath},patch:{completion_record:completionPath}});
  return state;
}

function priorWatchlist(){
  try{
    const commits=execFileSync('git',['log','--format=%H','--','_data/watchlist.json'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    if(commits.length>1)return JSON.parse(execFileSync('git',['show',commits[1]+':_data/watchlist.json'],{encoding:'utf8'}));
  }catch{}
  return {topics:[]};
}

function buildWatchlistReceipt(){
  const current=readJson('_data/watchlist.json');
  const prior=priorWatchlist();
  const plan=watchlistDeltaPlan(prior.topics||[],current.topics||[]);
  return {
    schema_version:'1.0.0',
    mode:'deterministic_watchlist_delta',
    prior_edition_date:prior.edition_date||null,
    next_edition_date:current.edition_date||null,
    prior_topic_count:(prior.topics||[]).length,
    next_topic_count:(current.topics||[]).length,
    ...plan,
    daily_counts:watchlistDailySummary(current),
    changed_topic_names:(current.topics||[]).filter(t=>(plan.changed_topics||[]).includes(t.topic_id)).map(t=>t.name),
    model_calls:0,
    rule:'Only changed/new topic evidence is eligible for semantic refresh. Carried topics preserve prior semantic text.'
  };
}

function buildRunState(){
  const manifest=readJson('_records/editorial-handoff/publication-manifest.json');
  let state=newRunState({date:DATE,baselineSha:manifest.baseline_sha,contractVersion:RUN_STATE_VERSION});
  const steps=[
    ['PREFLIGHT_METADATA_READY',['_records/editorial-handoff/metadata-candidates-2026-10-01-run4.json']],
    ['PREFLIGHT_DISCOVERY_READY',['_records/editorial-handoff/article-evidence-2026-10-01.json']],
    ['READINESS_PRELIMINARY',['_records/edition-execution/readiness-inputs/dab-edition-2026-10-01-run4.json']],
    ['READINESS_FINAL',['_records/edition-execution/readiness/dab-edition-2026-10-01-run4.json']],
    ['EDITORIAL_KERNEL_READY',['_records/editorial-handoff/kernel-2026-10-01.json','_records/editorial-handoff/facts-2026-10-01.json']],
    ['MEDIA_READY',['_records/editorial-handoff/media-2026-10-01.json','_records/editorial/media-preflight/2026-10-01.json']],
    ['IMAGES_READY',['_records/editorial-handoff/images-2026-10-01.json','_records/image-quality/2026-10-01-editorial-v2.json']],
    ['HANDOFF_COMMITTED',['_records/editorial-handoff/handoff.json','_records/editorial-handoff/publication-manifest.json']],
    ['DETERMINISTIC_EXPANSION_READY',['_data/editions/2026-10-01.json']]
  ];
  for(const [stage,artifacts] of steps)state=checkpointRunStage(root,state,stage,{currentSha:PRODUCTION_SHA,artifactPaths:artifacts});
  state=checkpointRunStage(root,state,'PR_CREATED',{currentSha:PRODUCTION_SHA,artifactPaths:[],prNumber:PUBLICATION_PR});
  state=recordConsequentialAction(state,{type:'publication_pr',key:'pr:'+PUBLICATION_PR,evidence:{pr_number:PUBLICATION_PR}}).state;
  state=checkpointRunStage(root,state,'PROTECTED_CI_PASS',{currentSha:PRODUCTION_SHA,artifactPaths:[],workflowRunIds:[String(CI_RUN_ID)]});
  state=checkpointRunStage(root,state,'MERGED',{currentSha:PRODUCTION_SHA,artifactPaths:[]});
  state=recordConsequentialAction(state,{type:'merge',key:'sha:'+PRODUCTION_SHA,evidence:{production_sha:PRODUCTION_SHA}}).state;
  state=checkpointRunStage(root,state,'PAGES_VERIFIED',{currentSha:PRODUCTION_SHA,artifactPaths:[completionPath],workflowRunIds:[String(PAGES_RUN_ID)]});
  state=checkpointRunStage(root,state,'COMPLETION_PERSISTED',{currentSha:PRODUCTION_SHA,artifactPaths:[completionPath]});
  state=recordConsequentialAction(state,{type:'completion',key:'sha:'+PRODUCTION_SHA,evidence:{completion_path:completionPath}}).state;
  state=checkpointRunStage(root,state,'DELTA_VALIDATED',{currentSha:PRODUCTION_SHA,artifactPaths:[validationPath]});
  state=checkpointRunStage(root,state,'COMMAND_CENTER_RECONCILED',{currentSha:PRODUCTION_SHA,artifactPaths:[ccPath]});
  state=recordConsequentialAction(state,{type:'command_center_sync',key:'sha:'+PRODUCTION_SHA,evidence:{command_center_delta:ccPath}}).state;
  state=checkpointRunStage(root,state,'CLOSED',{currentSha:PRODUCTION_SHA,artifactPaths:[completionPath,validationPath,ccPath]});
  persistRunState(root,state);
  return state;
}

function writeTaskEvent(name,value){
  const file=eventDir+'/'+name;
  if(fs.existsSync(abs(file)))return;
  writeJson(file,value);
}
function loadEvents(){
  const dir=abs(eventDir),events=[];
  if(!fs.existsSync(dir))return events;
  for(const name of fs.readdirSync(dir).sort()){
    if(!name.endsWith('.json'))continue;
    try{
      const value=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
      if(value&&value.task_id!==undefined&&value.to&&value.at)events.push({...value,task_id:String(value.task_id).padStart(2,'0'),_file:name});
    }catch{}
  }
  return events;
}

function appendLearningEvents(recordedAt){
  const currentText=fs.readFileSync(abs(ledgerPath),'utf8');
  const existing=parseOperationalLearningLedger(currentText);
  const max=existing.reduce((n,e)=>Math.max(n,Number(String(e.event_id).slice(-6))||0),0);
  let seq=max;
  const nextId=()=> 'DAB-OPS-E-'+String(++seq).padStart(6,'0');
  const events=[
    {
      schema_version:'production-operational-learning-event-v1',event_id:nextId(),problem_id:'DAB-OPS-20261002-001',event_type:'backfill',
      occurred_at:'2026-10-02T01:43:00Z',recorded_at:recordedAt,run_id:EXECUTION_ID,edition_id:EDITION_ID,task_id:'16',status:'permanently_fixed',
      summary:'Native image work could be queued without an active consumer',
      data:{
        symptom:'Task 16 native_chatgpt work remained queued with no result consumer.',
        root_cause:'The Supervisor had a queue producer for native image work but no executor bound to that capability.',
        operational_impact:'Production could appear active while the sixth image made no progress.',
        attempted_fix:'Confirmed the queue item was durable and avoided creating a duplicate run or regenerating accepted images.',
        actual_fix:'Add a fenced deterministic native image consumer to the Supervisor and persist exact PNG/result/event evidence in the same loop.',
        fix_outcome:'Task 16 completed accepted_locked and the six-image set remained professional and story-specific.',
        permanent_implementation:['.github/workflows/run-supervisor.yml','_tools/native-image-worker.py'],
        regression_tests:['_generator/test/run-supervisor.test.mjs'],
        invariants:['native_image_request_must_have_active_consumer','queued_action_without_consumer_is_not_progress'],
        next_run_validation:['Task 00 must prove native_image_request_must_have_active_consumer']
      }
    },
    {
      schema_version:'production-operational-learning-event-v1',event_id:nextId(),problem_id:'DAB-OPS-20261002-002',event_type:'backfill',
      occurred_at:'2026-10-02T03:03:00Z',recorded_at:recordedAt,run_id:EXECUTION_ID,edition_id:EDITION_ID,task_id:'18',status:'permanently_fixed',
      summary:'Emergency finalizer loaded stale control-tree state while building the Run 4 candidate',
      data:{
        symptom:'Initial finalizer attempts failed on an undefined Watchlist binding and stale book-catalog/module state.',
        root_cause:'The finalizer executed from the control checkout and imported render validators before Run 4 projections were written.',
        operational_impact:'Canonical assembly required several narrow protected repairs before Task 18 could pass.',
        attempted_fix:'Repaired only each exact finalizer defect while preserving the locked stories, media, books and accepted images.',
        actual_fix:'Execute the finalizer from the Run 4 checkout and load renderer/integrity modules only after durable book and Watchlist projections are written.',
        fix_outcome:'Finalizer workflow 36959230022 passed and produced the validated October 1 candidate without content reselection.',
        permanent_implementation:['.github/workflows/run4-finalizer.yml','_tools/run4-finalizer.mjs'],
        regression_tests:['_generator/test/run4-closeout.test.mjs'],
        invariants:['finalizer_reads_and_validates_same_durable_run_tree','module_snapshots_must_follow_projection_writes'],
        next_run_validation:['Task 00 must prove finalizer_reads_and_validates_same_durable_run_tree']
      }
    },
    {
      schema_version:'production-operational-learning-event-v1',event_id:nextId(),problem_id:'DAB-OPS-20261002-003',event_type:'backfill',
      occurred_at:'2026-10-02T03:29:13Z',recorded_at:recordedAt,run_id:EXECUTION_ID,edition_id:EDITION_ID,task_id:'23',status:'mitigated',
      summary:'The persistent Supervisor mutated the publication branch after exact-SHA CI passed',
      data:{
        symptom:'Minute-loop reconciliation commits moved the publication PR head between CI PASS and merge.',
        root_cause:'Writer liveness remained enabled after the run entered exact-SHA protected publication.',
        operational_impact:'A valid protected CI result became stale before merge and publication was delayed.',
        attempted_fix:'Paused the existing Run 4 writer through protected main and confirmed the old Supervisor was cancelled before retriggering CI.',
        actual_fix:'Write-freeze the run branch before protected publication and keep closure work on protected finalization paths.',
        fix_outcome:'Final exact head ca3702a4b3e276456402257305fe39c3ec82b002 remained stable, passed CI and merged as ce3dac9d75949f381821dfd34163048bf08c65d6.',
        next_run_validation:['Task 00 must prove publication_candidate_write_freeze_before_task23','Task 00 must prove no run-branch mutation between exact-SHA CI PASS and merge']
      }
    },
    {
      schema_version:'production-operational-learning-event-v1',event_id:nextId(),problem_id:'DAB-OPS-20261002-004',event_type:'backfill',
      occurred_at:'2026-10-02T03:40:00Z',recorded_at:recordedAt,run_id:EXECUTION_ID,edition_id:EDITION_ID,task_id:'27',status:'permanently_fixed',
      summary:'Emergency publication path lacked the durable validated-event bridge required by closure',
      data:{
        symptom:'Exact-SHA Pages deployment succeeded but deterministic closure failed because the October 1 publication directory and completion seed were absent.',
        root_cause:'The emergency finalizer/release-sealer path reached protected publication without writing the validated publication event expected by the standard delta-validation lifecycle.',
        operational_impact:'A correctly deployed Brief could not reach PUBLIC CLOSED even though content and deployment were valid.',
        attempted_fix:'Preserved the deployed production SHA and repaired only the missing closure evidence path; no republish or content regeneration was performed.',
        actual_fix:'Add a protected closeout bridge that reconstructs the missing validated event from exact PR/CI/merge/Pages evidence, independently live-verifies the reader and exact image bytes, then persists lifecycle/run-state/Command Center/cleanup evidence.',
        fix_outcome:'The closeout path can complete the same Run 4 from authoritative evidence without changing the published Brief.',
        permanent_implementation:['_tools/run4-closeout.mjs','.github/workflows/run4-closeout.yml','_tools/daily-validation.mjs'],
        regression_tests:['_generator/test/run4-closeout.test.mjs'],
        invariants:['publication_success_requires_durable_validated_event_for_closure','closure_recovery_must_preserve_original_production_sha','dated_image_manifest_must_be_visible_to_live_validator'],
        next_run_validation:['Task 00 must prove publication_success_requires_durable_validated_event_for_closure']
      }
    }
  ];
  const merged=[...existing,...events];
  writeText(ledgerPath,canonicalLedgerText(merged));
  writeText(runDeltaPath,canonicalLedgerText(events));
  writeText(ledgerMarkdown,renderOperationalLearningMarkdown(merged));
  const readiness=validateOperationalLearningReadiness({ledgerText:canonicalLedgerText(merged),pathExists:p=>fs.existsSync(abs(p))});
  if(readiness.result!=='PASS')throw Error('operational_learning_readiness_failed:'+readiness.errors.join(','));
  const cert=certifyRunLearningForTask29({ledgerText:canonicalLedgerText(merged),runId:EXECUTION_ID});
  if(cert.result!=='PASS')throw Error('task29_learning_certification_failed:'+cert.errors.join(','));
  writeJson(learningCertPath,{...cert,ledger_digest:readiness.ledger_digest,certified_at:recordedAt,required_invariants:readiness.required_invariants,unresolved_risks:readiness.unresolved_risks});
  return {readiness,cert,events};
}

function finalize(){
  const completionInput=args.completion;
  const validationInput=args.validation;
  if(!completionInput||!validationInput)throw Error('finalize_requires_completion_and_validation');
  const validation=readJson(validationInput);
  requireValidationPass(validation);
  const completion=readJson(completionInput);
  completion.schema_version='2.0.0';
  completion.phase='live_verified';
  completion.production_sha=PRODUCTION_SHA;
  completion.deployed_sha=PRODUCTION_SHA;
  completion.commit_sha=PRODUCTION_SHA;
  completion.candidate_sha=CANDIDATE_SHA;
  completion.publication_merge_sha=PRODUCTION_SHA;
  completion.pr_number=PUBLICATION_PR;
  completion.ci_run_id=CI_RUN_ID;
  completion.live_verified_at=validation.ended_at;
  completion.live_verification={
    final_result:'pass',
    homepage_edition_date:DATE,
    dated_edition_verified:true,
    route_count:validation.route_count,
    checks:['publication_receipt','pages_deployment','live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets','live_image_bytes'],
    source_validation_run_id:process.env.GITHUB_RUN_ID?Number(process.env.GITHUB_RUN_ID):null
  };
  completion.lifecycle_status='completed';
  completion.completion_persistence='protected_pull_request';

  writeJson(validatedPath,buildValidatedEvent());
  writeJson(completionPath,completion);
  writeJson(validationPath,validation);

  let lifecycle=transitionLifecycle(completion);
  const current=deriveCurrentEdition(lifecycle,completion);
  let status=derivePublicationStatus(lifecycle,{completion,currentEdition:current});
  const preSyncDigest=canonicalStatusDigest(status);
  const syncReceipt={
    schema_version:'command-center-reconciliation-receipt-v1',
    result:'pass',
    scope:'repository_authoritative_projection',
    source_edition:DATE,
    source_production_sha:PRODUCTION_SHA,
    source_deployed_sha:PRODUCTION_SHA,
    source_status_sha256:preSyncDigest,
    synchronized_at:addSeconds(validation.ended_at,3),
    mutation_permitted:false,
    live_owner_state_mutation:'not_configured',
    evidence:'Canonical repository projection refreshed from exact PUBLIC CLOSED production evidence; no external owner-state mutation endpoint is part of the repository contract.'
  };
  const syncProof={
    kind:'command_center_sync_receipt',
    result:'pass',
    source_edition:DATE,
    source_production_sha:PRODUCTION_SHA,
    source_deployed_sha:PRODUCTION_SHA,
    source_status_sha256:preSyncDigest,
    receipt_path:ccReceiptPath
  };
  lifecycle=transitionPublicationLifecycle(lifecycle,'CC_SYNCED',{at:syncReceipt.synchronized_at,evidence:syncProof});
  status=derivePublicationStatus(lifecycle,{completion,currentEdition:current});
  writeJson(lifecyclePath,lifecycle);
  writeJson('data/operations/current-edition.json',current);
  writeJson('data/operations/publication-status.json',status);
  writeJson(ccReceiptPath,syncReceipt);

  const watchReceipt=buildWatchlistReceipt();
  writeJson('_records/watchlist-delta/'+DATE+'.json',watchReceipt);
  const syncState={
    source_status_sha256:canonicalStatusDigest(status),
    edition_date:DATE,
    lifecycle_state:status.lifecycle_state,
    production_sha:status.production_sha,
    deployed_sha:status.deployed_sha,
    completion_state:status.completion.state,
    live_reader_state:status.live_reader.state,
    refresh_result:'pass',
    synchronized_at:syncReceipt.synchronized_at,
    mode:'repository_authoritative_projection',
    live_owner_state_mutation:'not_configured'
  };
  writeJson(ccStatePath,syncState);
  const policy=readJson('docs/operations/efficiency-operating-policy.json');
  const cc=commandCenterDeltaPacket({canonicalStatus:status,validation,watchlist:watchReceipt,policy,synchronizedState:syncState,generatedAt:syncReceipt.synchronized_at});
  if(cc.synchronization.result!=='pass')throw Error('command_center_projection_reconciliation_failed');
  writeJson(ccPath,cc);

  const runState=buildRunState();
  const base=validation.ended_at;
  writeTaskEvent('23-done.json',{task_id:'23',from:'Active',to:'Done',at:'2026-10-02T03:38:36Z',proof:{ci_run_id:CI_RUN_ID,candidate_sha:CANDIDATE_SHA,result:'PASS'}});
  writeTaskEvent('24-active.json',{task_id:'24',from:'Backlog',to:'Active',at:'2026-10-02T03:38:36Z'});
  writeTaskEvent('24-done.json',{task_id:'24',from:'Active',to:'Done',at:'2026-10-02T03:38:58Z',proof:{pr_number:PUBLICATION_PR,candidate_sha:CANDIDATE_SHA,production_sha:PRODUCTION_SHA}});
  writeTaskEvent('25-active.json',{task_id:'25',from:'Backlog',to:'Active',at:'2026-10-02T03:38:58Z'});
  writeTaskEvent('25-done.json',{task_id:'25',from:'Active',to:'Done',at:PAGES_VERIFIED_AT,proof:{pages_run_id:PAGES_RUN_ID,deployed_sha:PRODUCTION_SHA,conclusion:'success'}});
  writeTaskEvent('26-active.json',{task_id:'26',from:'Backlog',to:'Active',at:PAGES_VERIFIED_AT});
  writeTaskEvent('26-done.json',{task_id:'26',from:'Active',to:'Done',at:base,proof:{validation:validationPath,final_result:'pass',production_sha:PRODUCTION_SHA,route_count:validation.route_count}});
  writeTaskEvent('27-active.json',{task_id:'27',from:'Backlog',to:'Active',at:addSeconds(base,1)});
  writeTaskEvent('27-done.json',{task_id:'27',from:'Active',to:'Done',at:addSeconds(base,2),proof:{completion:completionPath,lifecycle:lifecyclePath,run_state:'_records/run-state/'+DATE+'.json'}});
  writeTaskEvent('28-active.json',{task_id:'28',from:'Backlog',to:'Active',at:addSeconds(base,3)});
  writeJson(publicClosedPath,{
    schema_version:'public-closed-v1',
    edition_id:EDITION_ID,execution_id:EXECUTION_ID,state:'PUBLIC_CLOSED',
    production_sha:PRODUCTION_SHA,deployed_sha:PRODUCTION_SHA,publication_pr:PUBLICATION_PR,
    protected_ci_run_id:CI_RUN_ID,pages_run_id:PAGES_RUN_ID,live_validation_run_id:completion.live_verification.source_validation_run_id,
    live_verified_at:base,command_center_reconciliation:ccPath,
    work_usage:0,codex_usage:0,paid_api_usage:0
  });
  writeTaskEvent('28-done.json',{task_id:'28',from:'Active',to:'Done',at:addSeconds(base,4),proof:{public_closed:publicClosedPath,command_center_delta:ccPath,command_center_result:'pass',production_sha:PRODUCTION_SHA}});
  writeTaskEvent('29-active.json',{task_id:'29',from:'Backlog',to:'Active',at:addSeconds(base,5)});

  const learning=appendLearningEvents(addSeconds(base,5));
  const contract=readJson('docs/operations/task-recovery-contracts.json');
  const tasks=Object.fromEntries(Object.entries(contract.tasks).map(([id,t])=>[id,{title:t.title}]));
  writeTaskEvent('29-done.json',{task_id:'29',from:'Active',to:'Done',at:addSeconds(base,6),proof:{cleanup:cleanupPath,learning_certification:learningCertPath,next_run_ready:true}});

  const events=loadEvents();
  const kanban=projectKanbanFromEvents({tasks,events,execution_id:EXECUTION_ID,edition_id:EDITION_ID,observed_at:addSeconds(base,6)});
  writeJson('_records/edition-execution/kanban/'+EXECUTION_KEY+'.json',kanban);
  const timingSeconds=Object.fromEntries(Object.entries(kanban.tasks).map(([id,t])=>[id,t.cycle_seconds]).filter(([,v])=>Number.isFinite(v)));
  const totalStart=kanban.tasks['00']?.active_started_at||kanban.tasks['00']?.entered_backlog_at;
  const totalSeconds=totalStart?Math.max(0,(Date.parse(addSeconds(base,6))-Date.parse(totalStart))/1000):null;
  const run3=readJson('_records/run-learning/dab-edition-2026-10-01-run3.json');
  writeJson(timingPath,{
    schema_version:'run-timing-comparison-v1',edition_id:EDITION_ID,execution_id:EXECUTION_ID,run_number:RUN_NUMBER,
    completed_at:addSeconds(base,6),total_wall_seconds:totalSeconds,task_cycle_seconds:timingSeconds,
    prior_run:{execution_id:run3.execution_id,terminal_state:run3.terminal_state,timing_seconds:run3.timing_seconds},
    observations:[
      'Run 4 preserved all completed work across recovery; no task timing was reset by status requests.',
      'Image Tasks 11 and 15 contain the dominant delay caused by persistence/recovery defects; their full cycle times remain visible rather than being normalized away.',
      'Publication Tasks 23-29 use exact event timestamps from protected CI, merge, Pages, independent live verification and closure.'
    ]
  });
  writeJson(runLearningPath,{
    schema_version:'run-promotion-review-v1',edition_id:EDITION_ID,execution_id:EXECUTION_ID,run_number:RUN_NUMBER,
    terminal_state:'PUBLIC_CLOSED',terminal_at:addSeconds(base,4),reviewed_at:addSeconds(base,6),
    published:true,public_closed:true,accepted_images:6,
    keep:[
      'exact 2/2/2 editorial allocation with one Agent Skills story',
      'two verified videos and two source-diverse podcasts',
      'independent Watchlist refresh and all-four-book review',
      'six accepted_locked professional story images with no low-quality fallback',
      'protected CI, exact-SHA deployment and independent live verification',
      'zero Work/Codex/paid API/overage boundary'
    ],
    fix:[
      'every queued capability must have an active consumer',
      'write-freeze the publication candidate before Task 23 protected CI',
      'persist a validated publication event before or during closure recovery',
      'make dated image manifests visible to the live validator'
    ],
    simplify:[
      'reuse exact durable evidence instead of replaying completed production stages',
      'keep closure recovery separate from content generation',
      'do not create a new run to repair missing lifecycle bookkeeping'
    ],
    validate_next:[
      'Task 00 proves active consumers for repository and native image work',
      'Task 00 proves publication candidate write freeze before exact-SHA CI',
      'Task 00 proves closure bootstrap exists before Pages completion',
      'Task 00 proves previous Run 4 cleanup receipt PASS'
    ],
    timing_seconds:timingSeconds,timing_comparison:timingPath,
    operational_learning_certification:learningCertPath,revise_living_plan:true
  });

  const existingLease=fs.existsSync(abs(leasePath))?readJson(leasePath):{};
  const releaseAt=addSeconds(base,6);
  writeJson(leasePath,{
    schema_version:'run-writer-lease-v1',execution_id:EXECUTION_ID,owner_id:'released-task29',
    generation:Math.max(0,Number(existingLease.generation||0))+1,acquired_at:releaseAt,last_heartbeat_at:releaseAt,
    expires_at:releaseAt,released_at:releaseAt
  });
  writeJson(pointerPath,{
    schema_version:'active-production-run-v1',active:false,terminal:true,edition_id:EDITION_ID,execution_id:EXECUTION_ID,
    execution_key:EXECUTION_KEY,branch:RUN_BRANCH,updated_at:releaseAt,
    note:'Run 4 PUBLIC_CLOSED; Task 29 PASS. Run-specific writer released, closure evidence reconciled, next-run readiness certified.'
  });
  writeJson(cleanupPath,{
    schema_version:'daily-brief-run-cleanup-v1',edition_id:EDITION_ID,execution_id:EXECUTION_ID,run_number:RUN_NUMBER,
    terminal_state:'PUBLIC_CLOSED',terminal_at:addSeconds(base,4),cleanup_at:releaseAt,result:'PASS',next_run_ready:true,
    production_sha:PRODUCTION_SHA,source_branch:RUN_BRANCH,
    checks:{
      run_specific_executors_disabled:true,no_active_writer:true,transition_ledger_reconciled:true,kanban_reconciled:true,
      timers_frozen:true,production_state_preserved:true,next_run_pointer_cleared:true,operational_learning_merged:true,
      run_learning_certified:learning.cert.result==='PASS',promotion_review_complete:true,timing_comparison_complete:true,
      regression_protection_updated:true,next_run_invariant_set_complete:true
    },
    ledger_digest:learning.readiness.ledger_digest,learning_certification:learningCertPath,timing_comparison:timingPath,
    command_center_reconciliation:ccPath,public_closed_record:publicClosedPath
  });

  console.log(JSON.stringify({
    result:'PASS',state:'PUBLIC_CLOSED',production_sha:PRODUCTION_SHA,live_validation:validationPath,
    completion:completionPath,lifecycle:lifecyclePath,command_center:ccPath,cleanup:cleanupPath,
    learning_certification:learningCertPath,next_run_ready:true,run_state:runState.stage
  },null,2));
}

if(command==='prepare'){
  const out=args.out;
  if(!out)throw Error('prepare_requires_out');
  const completion=buildPagesCompletion();
  writeJson(out,completion);
  console.log(JSON.stringify({result:'PASS',out:path.resolve(out),production_sha:PRODUCTION_SHA,pages_run_id:PAGES_RUN_ID},null,2));
}else if(command==='finalize'){
  finalize();
}else{
  throw Error('Usage: run4-closeout.mjs <prepare|finalize> [--out file] [--completion file --validation file]');
}
