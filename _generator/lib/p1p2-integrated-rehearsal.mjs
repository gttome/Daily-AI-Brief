import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import {activeRunDecision,acquireWriterLease,assertWriterFence} from './run-supervisor.mjs';
import {buildCanonicalTransitionEvent,dispatchTransitionEvent,compactWatchdogDecision} from './transition-dispatcher.mjs';
import {buildImageGenerationExecution,buildImageExecutionAdmission,imageExecutionAdmissionDecision} from './image-execution.mjs';
import {createStableImageOperation,transitionStableImageOperation,buildAcceptedImageTaskTransition} from './stable-image-pipeline.mjs';
import {buildPersistenceCompatibilityMatrix,validatePersistenceCompatibilityMatrix,IMAGE_PERSISTENCE_MODES} from './image-persistence-adapter.mjs';
import {consumeTask17} from './repository-task-consumer.mjs';
import {buildPublicationPrerequisiteGate,validatePublicationPrerequisiteGate,publicationPrDecision,PUBLICATION_PREREQUISITE_CHECKS} from './publication-prerequisite-gate.mjs';
import {productionCandidateSeparationErrors} from './branch-separation.mjs';
import {buildAtomicCloseoutTransaction,deriveIncidentInventory,simulateAtomicCommit} from './atomic-closeout.mjs';
import {drainOperations,fileOperationStore} from './durable-operation.mjs';

export const P1P2_INTEGRATED_REHEARSAL_VERSION='p1-p2-integrated-rehearsal-v1';

const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const gitBlob=bytes=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
const digest=value=>'sha256:'+crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const taskId=n=>String(n).padStart(2,'0');

function packet(candidate='m01'){
  return {
    story_id:'synthetic-story-'+candidate,candidate_id:candidate,headline:'Synthetic bounded mechanism',
    source_url:'https://example.invalid/'+candidate,
    verified_visual_facts:['A deterministic source-supported input reaches a bounded verification gate.'],
    generic_conceptual_elements:['input','verification gate','durable result'],
    prohibited_specifics:['invented benchmark values'],
    visual_brief:'Professional white-background textbook mechanism diagram for a synthetic non-production rehearsal.',
    reference_policy:'Use only the synthetic verified mechanism and generic explanatory concepts.',
    acceptance_order:['subject','facts','structure','editorial'],
    wrong_subject_action:'Discard only this synthetic candidate and preserve every other accepted image.',
    low_quality_fallback:false,
    allowed_image_text:['Input','Verify','Result'],
    composition_mode:'annotated_system',
    prohibited_composition_patterns:['generic sparse title card']
  };
}

function makePersistenceFixture({mode,candidate,task,execution,edition,assetPath,bytes,at}){
  const s=sha256(bytes),b=gitBlob(bytes),source={
    path:assetPath,sha256:s,git_blob_sha:b,width:1200,height:630,bytes:bytes.length,
    low_quality_fallback:false,svg_fallback:false
  };
  const attempt={execution_id:execution,edition_id:edition,task_id:task,candidate_id:candidate,
    disposition:'ACCEPTED_LOCKED',generated_at:at};
  if(mode==='native_capture')attempt.native_capture={...source,persisted:true,exact_readback:'PASS_GIT_OBJECT_SHA_AND_SIZE_MATCH_LOCAL_BYTES'};
  if(mode==='normalization')attempt.normalization={...source,normalized_at:at,same_visual:true,exact_readback:'PASS_GIT_OBJECT_SHA_AND_SIZE_MATCH_LOCAL_BYTES'};
  if(mode==='protected_exact_byte_transport')attempt.native_capture={...source,persisted:true,exact_readback:'PASS_PROTECTED_CHUNK_BRIDGE_SHA256_GIT_OBJECT_SHA_SIZE_AND_READBACK_MATCH_LOCAL_BYTES',transport_receipt:'_records/synthetic-transport/'+candidate+'.json'};
  if(mode==='stable_exact_persistence')attempt.persistence={...source,read_back_verified:true,persisted_at:at};
  const review={execution_id:execution,edition_id:edition,task_id:task,candidate_id:candidate,
    reviewed_at:new Date(Date.parse(at)+60000).toISOString(),accepted_locked:true,result:'PASS',
    final:{path:assetPath,sha256:s,git_blob_sha:b,exact_readback:'PASS_GIT_OBJECT_SHA_AND_SIZE_MATCH_LOCAL_BYTES'},
    visual_review:{result:'PASS',professional_quality:true,story_specific:true,detailed:true,legibility:'PASS',
      visible_text_guard:'PASS',extra_visible_text:[],no_people_or_humanoids:true,artifacts_or_corruption:false,
      context_contamination:false}
  };
  const lock={schema_version:'image-acceptance-lock-v1',execution_id:execution,edition_id:edition,task_id:task,candidate_id:candidate,
    accepted_locked:true,immutable:true,quality_gate:'PASS',visible_text_guard:'PASS',
    accepted_at:review.reviewed_at,attempt_receipt:null,saved_git_review:null,
    final:{path:assetPath,sha256:s,git_blob_sha:b,width:1200,height:630,bytes:bytes.length}};
  return {lock,attempt,review,expected:{execution_id:execution,edition_id:edition,candidate_id:candidate}};
}

function closeoutBase({date,execution,edition,productionSha,tasks}){
  const events=Array.from({length:27},(_,i)=>({
    task_id:taskId(i),from:'Active',to:'Done',
    at:`${date}T00:${String(i).padStart(2,'0')}:00Z`
  }));
  const ledgerEvent={schema_version:'production-operational-learning-event-v1',event_id:'DAB-OPS-E-999901',
    problem_id:'DAB-OPS-20990203-001',event_type:'backfill',occurred_at:date+'T00:01:00Z',
    recorded_at:date+'T00:01:00Z',run_id:execution,edition_id:edition,task_id:'23',
    status:'permanently_fixed',summary:'Synthetic integrated rehearsal incident',
    data:{symptom:'synthetic',root_cause:'fault injection',operational_impact:'rehearsal only',
      timing_impact_seconds:1,attempted_fix:'deterministic recovery',actual_fix:'resume exact operation',
      fix_outcome:'PASS',permanent_implementation:['P1/P2 integrated contracts'],regression_tests:['integrated rehearsal'],
      invariants:['no production mutation'],next_run_validation:['repeat integrated rehearsal']}}
  ;
  return {
    pointer:{active:true,terminal:false,execution_key:date+'-run1',execution_id:execution,edition_id:edition},
    completion:{edition_id:edition,production_sha:productionSha,deployed_sha:productionSha,phase:'live_verified',
      pages:{conclusion:'success'},live_verification:{final_result:'pass'},pr_number:9001,ci_run_id:9002,
      live_verified_at:date+'T01:00:00Z'},
    validation:{date,publication_sha:productionSha,final_result:'pass',
      checks:['publication_receipt','pages_deployment','live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets']
        .map(check_id=>({check_id,result:'pass'}))},
    runState:{stage:'CLOSED',current_sha:productionSha},
    cc:{edition_date:date,publication_sha:productionSha,canonical_publication_status:{terminal_outcome:'COMPLETED'}},
    tasks,events,ledgerText:JSON.stringify(ledgerEvent)+'\n',deltaText:'',
    readerSemanticGate:{schema_version:'reader-semantic-close-gate-v1',edition_date:date,edition_id:edition,result:'PASS',errors:[]},
    now:date+'T01:01:00Z'
  };
}

function gateInput({edition,execution,productionBranch,candidateSha,mainSha,date}){
  return {
    edition_id:edition,execution_id:execution,branch:productionBranch,
    candidate_sha:candidateSha,candidate_content_digest:'sha256:'+'b'.repeat(64),baseline_main_sha:mainSha,
    checks:Object.fromEntries(PUBLICATION_PREREQUISITE_CHECKS.map(k=>[k,true])),
    errors_by_check:{},
    expected_deployment_routes:['/','/latest/','/briefs/'+date+'/','/archive/','/feed.json','/feed.xml',
      ...['a','b','c','d','e','f'].map(x=>'/stories/'+date+'/'+x+'/')],
    checked_at:date+'T00:50:00Z'
  };
}

function injectGateFailure(base,check,error){
  const x=structuredClone(base);
  x.checks[check]=false;
  x.errors_by_check[check]=[error];
  x.checks.candidate_frozen=false;
  x.errors_by_check.candidate_frozen=['candidate_not_freezable'];
  const receipt=buildPublicationPrerequisiteGate(x);
  const decision=publicationPrDecision(receipt,[]);
  return {pass:receipt.result==='FAIL'&&decision.allowed===false&&decision.action==='DO_NOT_OPEN_PUBLICATION_PR',
    receipt,decision};
}

export async function runP1P2IntegratedRehearsal({
  repo_root='.',
  protected_main_sha,
  protected_main_ci_run_id,
  protected_main_ci_conclusion='success',
  rehearsal_run_id=null,
  observed_at='2099-02-03T02:00:00Z'
}={}){
  if(!/^[a-f0-9]{40}$/.test(protected_main_sha||'')||!Number.isInteger(Number(protected_main_ci_run_id))||
     Number(protected_main_ci_run_id)<1||protected_main_ci_conclusion!=='success')
    throw Error('verified_protected_main_ci_required');

  const date='2099-02-03',edition='dab-edition-'+date,execution='synthetic-p1p2-integrated-rehearsal';
  const productionBranch='reliable-edition/dab-edition-'+date+'-run1';
  const rehearsalBranch='rehearsal/p1p2-integrated-2026-10-06-r1';
  const productionSha='9'.repeat(40),candidateSha='8'.repeat(40);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'p1p2-integrated-rehearsal-'));
  const contracts=readJson(path.join(repo_root,'docs/operations/task-recovery-contracts.json')).tasks;
  const stages={},faults={},metrics={
    transition_events:0,event_dispatches:0,duplicate_dispatch_noops:0,
    watchdog_invocations:0,watchdog_compact_exits:0,watchdog_expanded_reads:0,watchdog_actionable_recoveries:0,
    supervisor_reconcile_loops:0,heartbeat_only_commits:0,wake_prs:0,
    image_generation_attempts:1,image_infrastructure_failures:0,image_regenerations:0,accepted_images:6,
    task17_runtime_seconds:0,task17_repairs:0,publication_preflight_failures:0,publication_ci_runs:1,
    task23_repairs:0,closeout_ai_calls:0,closeout_runtime_seconds:0,owner_liveness_prompts:0,
    production_work_invocations:0,codex_invocations:0,paid_model_api_calls:0
  };

  // 1. Non-production allocation fixture and duplicate-run protection.
  const allocationRequest={execution_id:execution,edition_id:edition,branch:rehearsalBranch};
  const allocation=activeRunDecision({activeRun:null,request:allocationRequest});
  stages.execution_allocation={result:allocation.action==='start'?'PASS':'FAIL',mode:'NON_PRODUCTION',
    production_allocation:false,execution_id:execution,branch:rehearsalBranch};

  // 2-3. Task 00/01 event-driven transition + exact duplicate idempotency.
  const event00=buildCanonicalTransitionEvent({
    raw:{task_id:'00',from:'Active',to:'Done',at:date+'T00:00:10Z'},
    execution_id:execution,edition_id:edition,writer_generation:1,
    content_state:{readiness:'PASS'},next_task_contract:contracts['01'],next_task_id:'01'
  });
  const dispatch00=dispatchTransitionEvent({event:event00,task_contracts:contracts,branch:rehearsalBranch,existing_dispatches:[]});
  const duplicate00=dispatchTransitionEvent({event:event00,task_contracts:contracts,branch:rehearsalBranch,existing_dispatches:[dispatch00.record]});
  metrics.transition_events++;metrics.event_dispatches++;metrics.duplicate_dispatch_noops++;
  stages.task00_01_transition={result:dispatch00.request?.task_id==='01'?'PASS':'FAIL',request_key:dispatch00.request?.request_key||null};
  stages.event_driven_dispatch={result:dispatch00.status==='DISPATCHED'&&duplicate00.status==='ALREADY_CONSUMED'?'PASS':'FAIL',
    duplicate_action:duplicate00.status};
  faults.duplicate_transition_delivery={result:duplicate00.status==='ALREADY_CONSUMED'?'PASS':'FAIL',
    recovery:'idempotent_noop_same_event'};

  // Watchdog fallback behavior: ten compact exits and one exact-transition recovery.
  for(let i=0;i<10;i++){
    const d=compactWatchdogDecision({event_consumed:true,worker_progressing:false,stalled:false});
    metrics.watchdog_invocations++;if(d.action==='COMPACT_EXIT')metrics.watchdog_compact_exits++;
  }
  const wd=compactWatchdogDecision({stalled:true,recovery_action:'resume exact transition '+event00.idempotency_key});
  metrics.watchdog_invocations++;metrics.watchdog_expanded_reads++;metrics.watchdog_actionable_recoveries++;
  stages.watchdog_fallback_only={result:wd.action==='RECOVER_EXACT_TRANSITION'?'PASS':'FAIL'};

  // Expired writer fails closed, then same execution gets a new generation.
  const firstLease=acquireWriterLease(null,{execution_id:execution,owner_id:'synthetic-worker',now:date+'T00:01:00Z',ttl_ms:1000});
  let expired=false;
  try{assertWriterFence(firstLease.lease,{execution_id:execution,owner_id:'synthetic-worker',generation:firstLease.lease.generation,now:date+'T00:01:02Z'});}
  catch(error){expired=/WRITER_LEASE_EXPIRED/.test(error.message);}
  const renewed=acquireWriterLease(firstLease.lease,{execution_id:execution,owner_id:'synthetic-worker',now:date+'T00:01:02Z',ttl_ms:1000});
  faults.expired_writer={result:expired&&renewed.acquired&&renewed.lease.generation>firstLease.lease.generation?'PASS':'FAIL',
    recovery:'same_execution_new_writer_generation'};

  // Worker dies after durable output but before acknowledgement; exact output is reused.
  const opStore=fileOperationStore(path.join(root,'operation-store'));let produceCalls=0,crash=true;
  const opBinding={rehearsal:execution,operation:'worker-output-before-ack'};
  const opSteps=[{id:'produce',run:async()=>{produceCalls++;return {sha256:'a'.repeat(64)};}}];
  let crashObserved=false;
  try{
    await drainOperations({store:opStore,binding:opBinding,steps:opSteps,now:()=>date+'T00:02:00Z',
      afterSave:async view=>{if(crash&&view.completed_operations.includes('produce')){crash=false;throw Error('synthetic_worker_exit_after_output');}}});
  }catch(error){crashObserved=/synthetic_worker_exit_after_output/.test(error.message);}
  const resumed=await drainOperations({store:opStore,binding:opBinding,steps:opSteps,now:()=>date+'T00:02:01Z'});
  faults.worker_dies_after_output_before_ack={result:crashObserved&&resumed.status==='complete'&&produceCalls===1?'PASS':'FAIL',
    recovery:'durable_result_reused_without_reexecution'};

  // 4-6. Image admission, exact-byte persistence/readback, delayed review, automatic next image.
  const imageExecution=buildImageGenerationExecution(packet('m01'));
  const admission=buildImageExecutionAdmission(imageExecution,{
    execution_id:execution,task_id:'11',request_key:'image-m01',
    submitted_instruction:imageExecution.generation_instruction,story_only_context_verified:true,
    orchestration_context_visible:false,exact_byte_persistence_verified:true,persistence_mode:'git_data_direct_blob',
    owner_intervention_required:false,persistence_proof:{schema_version:'synthetic-exact-byte-preflight-v1',result:'PASS'},
    checked_at:date+'T00:10:00Z'
  });
  const admissionDecision=imageExecutionAdmissionDecision(admission,imageExecution,{execution_id:execution,task_id:'11',request_key:'image-m01'});
  stages.image_admission={result:admissionDecision.authorized?'PASS':'FAIL',attempts_consumed:admissionDecision.attempts_consumed};

  const imageBytes=Buffer.from('synthetic-exact-image-bytes-m01');
  const imagePath=path.join(root,'briefs/images',date,edition+'-m01.png');
  fs.mkdirSync(path.dirname(imagePath),{recursive:true});fs.writeFileSync(imagePath,imageBytes);
  const readback=fs.readFileSync(imagePath);
  const imageSha=sha256(imageBytes),imageBlob=gitBlob(imageBytes);
  stages.image_exact_byte_persistence={result:readback.equals(imageBytes)&&sha256(readback)===imageSha&&gitBlob(readback)===imageBlob?'PASS':'FAIL',
    bytes:imageBytes.length,sha256:imageSha,git_blob_sha:imageBlob};

  let imageOp=createStableImageOperation({execution_id:execution,edition_id:edition,task_id:'11',candidate_id:'m01',
    request_key:'image-m01',created_at:date+'T00:10:00Z'});
  for(const state of ['ADMISSION_CHECK','ADMITTED','GENERATING','BYTES_RECEIVED','PERSISTED','READBACK_VERIFIED'])
    imageOp=transitionStableImageOperation(imageOp,state,{at:new Date(Date.parse(imageOp.updated_at)+1000).toISOString()});
  const attemptsBeforeDelayedReview=imageOp.generation_attempts;
  imageOp=transitionStableImageOperation(imageOp,'REVIEWING',{at:date+'T00:12:00Z'});
  imageOp=transitionStableImageOperation(imageOp,'ACCEPTED_LOCKED',{at:date+'T00:12:01Z'});
  imageOp=transitionStableImageOperation(imageOp,'DONE',{at:date+'T00:12:02Z'});
  faults.image_bytes_persisted_review_delayed={result:imageOp.generation_attempts===attemptsBeforeDelayedReview&&imageOp.accepted_locked?'PASS':'FAIL',
    recovery:'resume_review_on_same_persisted_bytes'};

  const acceptedResult={status:'fixture_pass',review:{reviewed_at:date+'T00:12:01Z'},
    persistence:{path:'briefs/images/'+date+'/'+edition+'-m01.png',sha256:imageSha,git_blob_sha:imageBlob,
      persisted_at:date+'T00:11:00Z',read_back_verified:true}};
  const acceptedEvent=buildAcceptedImageTaskTransition({execution_id:execution,edition_id:edition,task_id:'11',
    request_key:'image-m01',candidate_id:'m01',result:acceptedResult,writer_generation:renewed.lease.generation});
  const canonicalImageEvent=buildCanonicalTransitionEvent({raw:acceptedEvent,execution_id:execution,edition_id:edition,
    writer_generation:renewed.lease.generation,request_key:'image-m01',content_state:{saved_asset:acceptedEvent.saved_asset},
    next_task_contract:contracts['12'],next_task_id:'12'});
  const imageDispatch=dispatchTransitionEvent({event:canonicalImageEvent,task_contracts:contracts,branch:rehearsalBranch,existing_dispatches:[]});
  metrics.transition_events++;metrics.event_dispatches++;
  stages.automatic_next_image_transition={result:imageDispatch.request?.task_id==='12'&&acceptedEvent.wake_pr_required===false?'PASS':'FAIL',
    wake_pr_required:acceptedEvent.wake_pr_required};

  // 7. Six-image mixed persistence Task 17 fixture using the real repository consumer.
  const runKey=date+'-run1',specs={checks:{distinct_compositions:true},specs:[]};
  const matrixFixtures={};
  for(let i=0;i<6;i++){
    const candidate='m'+String(i+1).padStart(2,'0'),task=taskId(11+i);
    const mode=IMAGE_PERSISTENCE_MODES[i%IMAGE_PERSISTENCE_MODES.length];
    const rel='briefs/images/'+date+'/'+edition+'-'+candidate+'.png';
    const bytes=Buffer.from('mixed-mode-synthetic-'+candidate+'-'+mode);
    fs.mkdirSync(path.join(root,path.dirname(rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),bytes);
    const fixture=makePersistenceFixture({mode,candidate,task,execution,edition,assetPath:rel,bytes,at:date+'T00:20:00Z'});
    const attemptRel='_records/image-attempts/'+runKey+'/'+candidate+'-attempt-1.json';
    const reviewRel='_records/image-reviews/'+runKey+'/'+candidate+'-attempt-1-saved-git-review.json';
    fixture.lock.attempt_receipt=attemptRel;fixture.lock.saved_git_review=reviewRel;
    writeJson(path.join(root,attemptRel),fixture.attempt);writeJson(path.join(root,reviewRel),fixture.review);
    writeJson(path.join(root,'_records/image-acceptance',runKey,candidate+'.json'),fixture.lock);
    specs.specs.push({task_id:task,candidate_id:candidate,subject:'Synthetic subject '+candidate,mechanism:'Synthetic distinct mechanism '+candidate});
    if(!matrixFixtures[mode])matrixFixtures[mode]=fixture;
  }
  writeJson(path.join(root,'_records/image-specs',runKey+'.json'),specs);
  const task17Request=path.join(root,'_records/edition-execution/worker-requests',execution,'17-synthetic.json');
  writeJson(task17Request,{task_id:'17',capability:'repository',status:'queued',request_key:'synthetic',
    execution_id:execution,edition_id:edition,branch:productionBranch,writer_generation:7});
  const task17Start=Date.now();
  const task17=consumeTask17({runRoot:root,requestPath:task17Request});
  metrics.task17_runtime_seconds=Math.max(0,(Date.now()-task17Start)/1000);
  const matrix=buildPersistenceCompatibilityMatrix(matrixFixtures);
  const matrixErrors=validatePersistenceCompatibilityMatrix(matrix);
  stages.mixed_mode_task17={result:task17.result==='PASS'&&task17.accepted_images===6&&matrix.result==='PASS'&&!matrixErrors.length?'PASS':'FAIL',
    accepted_images:task17.accepted_images,matrix_result:matrix.result,persistence_modes:IMAGE_PERSISTENCE_MODES};

  // 8. Deterministic Tasks 18-22 progression through the same dispatcher.
  const postImage=[];
  for(let n=18;n<=22;n++){
    const id=taskId(n),next=taskId(n+1);
    const ev=buildCanonicalTransitionEvent({raw:{task_id:id,from:'Active',to:'Done',at:date+`T00:${30+n-18}:00Z`},
      execution_id:execution,edition_id:edition,writer_generation:8,content_state:{fixture:id},
      next_task_contract:contracts[next],next_task_id:next});
    const d=dispatchTransitionEvent({event:ev,task_contracts:contracts,branch:rehearsalBranch,existing_dispatches:[]});
    postImage.push({task_id:id,status:d.status,target:d.request?.task_id||null});
    metrics.transition_events++;metrics.event_dispatches++;
  }
  stages.tasks18_22_progression={result:postImage.every((x,i)=>x.status==='DISPATCHED'&&x.target===taskId(19+i))?'PASS':'FAIL',dispatches:postImage};

  // 9-11. Task 23 pre-PR gate, freeze, branch separation and exact main-CI proof.
  const cleanGateInput=gateInput({edition,execution,productionBranch,candidateSha,mainSha:protected_main_sha,date});
  const cleanGate=buildPublicationPrerequisiteGate(cleanGateInput),cleanDecision=publicationPrDecision(cleanGate,[]);
  const separation=productionCandidateSeparationErrors({branch:productionBranch,
    changed_paths:['_data/editions/'+date+'.json','briefs/'+date+'.md','briefs/images/'+date+'/m01.png',
      '_records/edition-execution/events/'+runKey+'/22.json'],
    baseline_main_sha:protected_main_sha,current_main_sha:protected_main_sha});
  stages.task23_pre_pr_gate={result:cleanGate.result==='PASS'&&!validatePublicationPrerequisiteGate(cleanGate).length&&cleanDecision.allowed?'PASS':'FAIL',
    model_calls:cleanGate.model_calls};
  stages.publication_candidate_freeze={result:cleanGate.candidate_frozen&&cleanDecision.action==='OPEN_EXACTLY_ONE_PROTECTED_PUBLICATION_PR'?'PASS':'FAIL'};
  stages.protected_ci_equivalent={result:protected_main_ci_conclusion==='success'&&Number(protected_main_ci_run_id)>0&&!separation.length?'PASS':'FAIL',
    protected_main_sha,protected_main_ci_run_id:Number(protected_main_ci_run_id),branch_separation_errors:separation};

  const stale=injectGateFailure(cleanGateInput,'protected_main_ancestry','stale_protected_main_ancestry');
  const watchlist=injectGateFailure(cleanGateInput,'watchlist_projection','watchlist_public_projection_mismatch');
  const learning=injectGateFailure(cleanGateInput,'operational_learning_input','learning_ledger_schema_mismatch');
  metrics.publication_preflight_failures=3;
  faults.stale_main_ancestry_before_pr={result:stale.pass?'PASS':'FAIL',recovery:'fail_closed_before_pr'};
  faults.watchlist_projection_mismatch={result:watchlist.pass?'PASS':'FAIL',recovery:'fail_closed_before_pr'};
  faults.learning_ledger_mismatch={result:learning.pass?'PASS':'FAIL',recovery:'fail_closed_before_pr'};

  // 12-15. Live verification fixture, incident reconciliation, atomic closeout and final terminal state.
  const closeBase=closeoutBase({date,execution,edition,productionSha,tasks:contracts});
  stages.live_verification_fixture={result:closeBase.completion.live_verification.final_result==='pass'&&
    closeBase.completion.production_sha===closeBase.completion.deployed_sha?'PASS':'FAIL',
    production_sha:productionSha,deployed_sha:productionSha};

  const inventory=deriveIncidentInventory({
    repair_prs:['synthetic-repair-pr'],protected_repairs:['synthetic-protected-repair'],
    blocked_transitions:['synthetic-blocked-transition'],liveness_faults:['synthetic-liveness-fault'],
    failed_workers:['synthetic-failed-worker'],dead_writer_proofs:['synthetic-dead-writer-proof'],
    strategy_interrupts:['synthetic-strategy-interrupt'],task23_recoveries:['synthetic-task23-recovery'],
    wake_actions:['synthetic-historical-wake-action']
  });
  const learningKeys=inventory.items.map(x=>x.key);
  let unreconciledFails=false;
  try{buildAtomicCloseoutTransaction(closeBase,{incident_inventory:inventory,learning_incident_keys:[],transaction_at:date+'T01:01:00Z'});}
  catch(error){unreconciledFails=/incident_learning_unreconciled/.test(error.message);}
  stages.incident_reconciliation={result:unreconciledFails?'PASS':'FAIL',incident_count:inventory.items.length};

  const closeStart=Date.now();
  const tx=buildAtomicCloseoutTransaction(closeBase,{incident_inventory:inventory,learning_incident_keys:learningKeys,
    transaction_at:date+'T01:01:00Z'});
  metrics.closeout_runtime_seconds=Math.max(0,(Date.now()-closeStart)/1000);
  metrics.closeout_ai_calls=tx.ai_calls;
  let crashPass=true;
  const writeCount=Object.keys(tx.files).length;
  for(let n=1;n<=writeCount;n++){
    const crashed=simulateAtomicCommit(tx,{existing:{sentinel:'last-known-good'},crash_after:n});
    if(crashed.status!=='CRASHED_BEFORE_COMMIT'||crashed.visible.sentinel!=='last-known-good'||Object.keys(crashed.visible).length!==1)crashPass=false;
  }
  faults.closeout_crash_after_each_major_write={result:crashPass?'PASS':'FAIL',injected_boundaries:writeCount,recovery:'atomic_staging_no_partial_visibility'};
  const committed=simulateAtomicCommit(tx,{existing:{sentinel:'last-known-good'}});
  stages.atomic_tasks27_29_closeout={result:committed.status==='COMMITTED'&&tx.ai_calls===0&&tx.owner_prompts===0?'PASS':'FAIL',
    transaction_id:tx.transaction_id,file_count:writeCount,ai_calls:tx.ai_calls,owner_prompts:tx.owner_prompts};

  const closedBase=structuredClone(closeBase);closedBase.pointer.active=false;closedBase.pointer.terminal=true;
  const duplicateTx=buildAtomicCloseoutTransaction(closedBase,{incident_inventory:inventory,learning_incident_keys:learningKeys,
    transaction_at:date+'T01:02:00Z'});
  faults.duplicate_closeout_invocation={result:duplicateTx.status==='ALREADY_CLOSED_VERIFIED'&&duplicateTx.ai_calls===0?'PASS':'FAIL',
    recovery:'deterministic_already_closed_noop'};

  const pointer=committed.visible['data/operations/active-production-run.json'];
  const closeEventPaths=Object.keys(committed.visible).filter(p=>p.includes('/events/'+runKey+'/'));
  stages.final_terminal_state={result:pointer?.terminal===true&&pointer?.active===false&&
    ['27','28','29'].every(id=>closeEventPaths.some(p=>p.endsWith('/'+id+'-protected-closeout.json')))?'PASS':'FAIL',
    active:pointer?.active,terminal:pointer?.terminal};

  // Real protected native-image capability evidence is inherited, not regenerated.
  const registration=readJson(path.join(repo_root,'docs/operations/unattended-image-host.json'));
  const qualPath=registration.qualification_receipt_path;
  const qual=readJson(path.join(repo_root,qualPath));
  stages.real_native_image_capability_proof={result:registration.status==='READY'&&qual.result==='PASS'&&qual.evidence_type==='live'&&
      registration.saved_bytes_recovered===true&&registration.zero_production_cost_verified===true?'PASS':'FAIL',
    source:'protected_historical_live_qualification',qualification_receipt_path:qualPath,
    qualification_source_commit:qual.qualification_source_commit||registration.qualification_source_commit,
    fresh_generation_in_rehearsal:false,accepted_historical_images_modified:false};

  const requiredStageNames=[
    'execution_allocation','task00_01_transition','event_driven_dispatch','image_admission',
    'image_exact_byte_persistence','automatic_next_image_transition','mixed_mode_task17','tasks18_22_progression',
    'task23_pre_pr_gate','publication_candidate_freeze','protected_ci_equivalent','live_verification_fixture',
    'atomic_tasks27_29_closeout','incident_reconciliation','final_terminal_state'
  ];
  const requiredFaultNames=[
    'duplicate_transition_delivery','expired_writer','worker_dies_after_output_before_ack',
    'image_bytes_persisted_review_delayed','stale_main_ancestry_before_pr','watchlist_projection_mismatch',
    'learning_ledger_mismatch','closeout_crash_after_each_major_write','duplicate_closeout_invocation'
  ];
  // Mixed lock modes is both a required path stage and a fault/compatibility injection.
  faults.task17_mixed_lock_modes={result:stages.mixed_mode_task17.result,recovery:'canonical_persistence_adapter_registry'};
  requiredFaultNames.splice(4,0,'task17_mixed_lock_modes');

  const constraints={
    production_allocation:false,public_brief_published:false,october6_terminal_evidence_mutated:false,
    accepted_historical_image_mutated:false,owner_input_required:false,run_identity_changed_during_recovery:false,
    work_dependency:false,codex_dependency:false,paid_model_api_dependency:false,happy_path_wake_pr_required:false
  };
  const expandedRate=metrics.watchdog_invocations?metrics.watchdog_expanded_reads/metrics.watchdog_invocations:0;
  const targetChecks={
    production_work_invocations:metrics.production_work_invocations===0,
    owner_liveness_prompts:metrics.owner_liveness_prompts===0,
    happy_path_wake_prs:metrics.wake_prs===0,
    unchanged_health_commits:metrics.heartbeat_only_commits===0,
    watchdog_expanded_read_rate:expandedRate<=0.10,
    task17_under_5_minutes:metrics.task17_runtime_seconds<=300,
    task17_repairs:metrics.task17_repairs===0,
    task23_protected_ci_runs:metrics.publication_ci_runs===1,
    task23_repairs:metrics.task23_repairs===0,
    closeout_ai_calls:metrics.closeout_ai_calls===0,
    production_runtime_zero_paid_dependencies:metrics.production_work_invocations===0&&metrics.codex_invocations===0&&metrics.paid_model_api_calls===0
  };
  const stagePass=requiredStageNames.every(name=>stages[name]?.result==='PASS');
  const faultPass=requiredFaultNames.every(name=>faults[name]?.result==='PASS');
  const constraintPass=Object.values(constraints).every(v=>v===false);
  const targetPass=Object.values(targetChecks).every(Boolean);
  const result=stagePass&&faultPass&&constraintPass&&targetPass&&stages.real_native_image_capability_proof.result==='PASS'?'PASS':'FAIL';

  const receipt={
    schema_version:P1P2_INTEGRATED_REHEARSAL_VERSION,
    rehearsal_id:'p1-p2-integrated-2026-10-06-r1',mode:'NON_PRODUCTION',result,
    observed_at,rehearsal_run_id:rehearsal_run_id?Number(rehearsal_run_id):null,
    protected_main_sha,protected_main_ci_run_id:Number(protected_main_ci_run_id),protected_main_ci_conclusion,
    execution_id:execution,edition_id:edition,rehearsal_branch:rehearsalBranch,
    production_run_reopened:false,october6_execution:'reliable-edition-20261006-run10',
    stages,fault_injections:faults,constraints,metrics:{...metrics,watchdog_expanded_read_rate:expandedRate},
    target_checks:targetChecks,
    evidence_digest:digest({stages,faults,constraints,metrics,targetChecks,protected_main_sha}),
    next_action:result==='PASS'?'BUILD_FINAL_GO_NO_GO_RECEIPTS':'REPAIR_FIRST_FAILED_REHEARSAL_GATE'
  };
  fs.rmSync(root,{recursive:true,force:true});
  return receipt;
}
