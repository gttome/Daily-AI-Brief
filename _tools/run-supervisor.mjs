#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  activeRunDecision, acquireWriterLease, assertWriterFence, classifyRunHealth, applyImmediateImageRecovery,
  normalizeTaskEvent, recoverableBlockerEvidence, refreshScheduledWorkerFence, buildTaskWriterHandoffRelease,
  validateTaskRecoveryContracts, taskRecoveryDecision, buildWorkerRequest, buildEngineeringRepairRequest,
  projectKanbanFromEvents, validateKanbanContract, kanbanProjectionFresh, publicationWriteBoundary, latestRecoverableImage,
  classifyRepositoryQueueLiveness
} from '../_generator/lib/run-supervisor.mjs';

const argv=process.argv.slice(2), command=argv.shift();
const args={};
for(let i=0;i<argv.length;i++){
  const token=argv[i];
  if(!token.startsWith('--')) continue;
  const key=token.slice(2);
  const next=argv[i+1];
  if(next!==undefined && !next.startsWith('--')) { args[key]=next; i++; }
  else args[key]=true;
}
const emit=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n');
const readJson=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const writeJson=(file,value)=>{
  const p=path.resolve(file); fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');
};
const safeExecutionKey=value=>{
  if(!/^\d{4}-\d{2}-\d{2}-run\d+$/.test(value||'')) throw Error('valid_execution_key_required');
  return value;
};
const safeTask=value=>{
  const id=String(value||'').padStart(2,'0');
  if(!/^\d{2}$/.test(id) || Number(id)>29) throw Error('valid_task_id_required');
  return id;
};
function loadEvents(runRoot, executionKey){
  const dir=path.join(runRoot,'_records/edition-execution/events',executionKey);
  if(!fs.existsSync(dir)) return [];
  const events=[];
  for(const name of fs.readdirSync(dir).sort()){
    if(!name.endsWith('.json')) continue;
    const file=path.join(dir,name);
    try{
      const value=normalizeTaskEvent(JSON.parse(fs.readFileSync(file,'utf8')));
      if(value && value.task_id!==undefined && value.to && value.at)
        events.push({...value,task_id:String(value.task_id).padStart(2,'0'),_file:name});
    }catch{}
  }
  return events;
}
function latestTaskEvent(events,taskId){
  return events.filter(e=>e.task_id===taskId).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).at(-1)||null;
}
function latestImageRecovery(runRoot,executionKey,taskId){
  const dir=path.join(runRoot,'_records/image-attempts',executionKey);
  if(!fs.existsSync(dir)) return null;
  const records=[];
  for(const name of fs.readdirSync(dir).sort()){
    if(!name.endsWith('.json')) continue;
    try{
      const value=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
      const at=value.rejected_at||value.accepted_at||value.reviewed_at||null;
      records.push({...value,_file:name,_at:at});
    }catch{}
  }
  const specFile=path.join(runRoot,'_records/editorial-handoff',`image-specs-${executionKey}.json`);
  const specs=fs.existsSync(specFile)?readJson(specFile).specs:[];
  const candidate=specs?.find(s=>Number(s.ordinal)===Number(taskId)-10)?.candidate_id;
  return latestRecoverableImage(records,{task_id:taskId,candidate_id:candidate});
}
function currentTaskFromProjection(tasks){
  for(let n=0;n<=29;n++){
    const id=String(n).padStart(2,'0'),task=tasks[id];
    if(!task || task.state!=='Done') return task || {id,state:'Backlog'};
  }
  return null;
}
function repairEpochState(runRoot,executionId,taskId){
  const safeExec=executionId.replace(/[^A-Za-z0-9._-]/g,'_');
  const file=path.join(runRoot,'_records/edition-execution/repair-epochs',safeExec,taskId+'.json');
  if(!fs.existsSync(file)) return {epochs_completed:0,repair_ready:false,post_repair_attempts:0,file,value:null};
  try{
    const value=JSON.parse(fs.readFileSync(file,'utf8'));
    const epochs=Number(value.epochs_completed||value.repair_epoch||0);
    const post=Number(value.post_repair_attempts||0);
    return {
      epochs_completed:Number.isFinite(epochs)?Math.max(0,epochs):0,
      repair_ready:value.status==='PASS' && value.required_proofs_passed===true,
      post_repair_attempts:Number.isFinite(post)?Math.max(0,post):0,
      file,value
    };
  }catch{return {epochs_completed:0,repair_ready:false,post_repair_attempts:0,file,value:null};}
}

function workerState(runRoot,executionId){
  const file=path.join(runRoot,'_records/edition-execution/workers',executionId+'.json');
  if(!fs.existsSync(file)) return {state:'Unknown',file:null};
  try{
    const value=JSON.parse(fs.readFileSync(file,'utf8'));
    return {state:value.state||value.executor_state||'Unknown',file,value};
  }catch{return {state:'Unknown',file};}
}
function existingKanban(runRoot,executionKey){
  const file=path.join(runRoot,'_records/edition-execution/kanban',executionKey+'.json');
  if(!fs.existsSync(file)) return {file,value:null};
  try{return {file,value:JSON.parse(fs.readFileSync(file,'utf8'))};}
  catch{return {file,value:null};}
}
function requestPath(runRoot,request){
  const safeExec=request.execution_id.replace(/[^A-Za-z0-9._-]/g,'_');
  return path.join(runRoot,'_records/edition-execution/worker-requests',safeExec,`${request.task_id}-${request.request_key}.json`);
}

try{
  if(command==='validate-contracts'){
    if(!args.file) throw Error('file_required');
    const errors=validateTaskRecoveryContracts(readJson(args.file));
    emit({result:errors.length?'FAIL':'PASS',errors});
    if(errors.length) process.exitCode=1;
  }else if(command==='active-run-decision'){
    if(!args.request) throw Error('request_required');
    emit(activeRunDecision({activeRun:args.active?readJson(args.active):null,request:readJson(args.request)}));
  }else if(command==='writer-lease'){
    if(!args['execution-id']||!args['owner-id']) throw Error('execution_and_owner_required');
    const current=args.current && fs.existsSync(path.resolve(args.current))?readJson(args.current):null;
    const result=acquireWriterLease(current,{
      execution_id:args['execution-id'],owner_id:args['owner-id'],
      now:args.now||new Date().toISOString(),
      ttl_ms:Number(args['ttl-ms']||21600000),
      takeover_dead_owner:args['takeover-dead-owner']===true||args['takeover-dead-owner']==='true'
    });
    if(result.acquired && args.output) writeJson(args.output,result.lease);
    emit(result);
    if(!result.acquired) process.exitCode=2;
  }else if(command==='assert-fence'){
    const lease=readJson(args.lease);
    emit({result:assertWriterFence(lease,{
      execution_id:args['execution-id'],owner_id:args['owner-id'],generation:Number(args.generation),now:args.now||new Date().toISOString()
    })?'PASS':'FAIL'});
  }else if(command==='scheduled-worker-fence'){
    if(!args.lease||!args.request||!args['owner-id']) throw Error('lease_request_and_owner_required');
    const result=refreshScheduledWorkerFence(readJson(args.lease),{
      request:readJson(args.request),owner_id:args['owner-id'],
      now:args.now||new Date().toISOString(),ttl_ms:Number(args['ttl-ms']||1800000)
    });
    if(args.output) writeJson(args.output,result.lease);
    emit(result);
  }else if(command==='release-handoff'){
    if(!args.lease||!args['execution-id']||!args['owner-id']||!args.generation||!args.task) throw Error('handoff_release_fields_required');
    const result=buildTaskWriterHandoffRelease(readJson(args.lease),{
      execution_id:args['execution-id'],owner_id:args['owner-id'],generation:Number(args.generation),
      task_id:safeTask(args.task),boundary:args.boundary||'Done',now:args.now||new Date().toISOString()
    });
    if(args.output) writeJson(args.output,result);
    emit(result);
  }else if(command==='project-kanban'){
    const runRoot=path.resolve(args['run-root']||'.'),executionKey=safeExecutionKey(args['execution-key']);
    const contract=readJson(args.contracts), events=loadEvents(runRoot,executionKey);
    const tasks=Object.fromEntries(Object.entries(contract.tasks).map(([id,t])=>[id,{title:t.title}]));
    const value=projectKanbanFromEvents({tasks,events,execution_id:args['execution-id'],edition_id:args['edition-id'],observed_at:args['observed-at']||new Date().toISOString()});
    const contractErrors=validateKanbanContract({kanban:value,events,require_all_tasks:true});
    if(contractErrors.length) throw Error('invalid_kanban_projection:'+contractErrors.join(','));
    if(args.output) writeJson(args.output,value);
    emit(value);
  }else if(command==='enqueue'){
    const runRoot=path.resolve(args['run-root']||'.'), request=readJson(args.request);
    const file=requestPath(runRoot,request);
    let queueResult='QUEUED';
    if(fs.existsSync(file)){
      const existing=readJson(file);
      if(existing.request_key!==request.request_key) throw Error('worker_request_path_conflict');
      queueResult='REUSED';
    }else{
      writeJson(file,request);
    }
    if(Number(request.post_repair_attempt||0)>0){
      const repair=repairEpochState(runRoot,request.execution_id,String(request.task_id).padStart(2,'0'));
      if(!repair.value||repair.value.status!=='PASS'||repair.value.required_proofs_passed!==true)
        throw Error('post_repair_dispatch_requires_passed_repair_epoch');
      const updated={
        ...repair.value,
        post_repair_attempts:Math.max(Number(repair.value.post_repair_attempts||0),Number(request.post_repair_attempt)),
        last_post_repair_request_key:request.request_key,
        post_repair_dispatched_at:request.created_at||new Date().toISOString()
      };
      writeJson(repair.file,updated);
    }
    emit({result:queueResult,file:path.relative(runRoot,file),request_key:request.request_key,
      post_repair_attempt:Number(request.post_repair_attempt||0)});
  }else if(command==='repository-liveness'){
    if(!args.request) throw Error('request_required');
    const result=classifyRepositoryQueueLiveness({
      request:readJson(args.request),
      now:args.now||new Date().toISOString(),
      max_idle_seconds:Number(args['max-idle-seconds']||60)
    });
    if(args.output) writeJson(args.output,result);
    emit(result);
  }else if(command==='tick'){
    const runRoot=path.resolve(args['run-root']||'.'), executionKey=safeExecutionKey(args['execution-key']);
    const contract=readJson(args.contracts), errors=validateTaskRecoveryContracts(contract);
    if(errors.length) throw Error('invalid_task_recovery_contract:'+errors.join(','));
    const events=loadEvents(runRoot,executionKey);
    const tasks=Object.fromEntries(Object.entries(contract.tasks).map(([id,t])=>[id,{title:t.title}]));
    const projection=projectKanbanFromEvents({tasks,events,execution_id:args['execution-id'],edition_id:args['edition-id'],observed_at:args.now||new Date().toISOString()});
    const current=currentTaskFromProjection(projection.tasks);
    const terminal=!current;
    const publication=publicationWriteBoundary(projection.tasks,events);
    const taskId=current?.id||'29';
    const taskContract=contract.tasks[taskId];
    const latest=latestTaskEvent(events,taskId);
    const worker=workerState(runRoot,args['execution-id']);
    const executorState=args['executor-state']||worker.state;
    const image=Number(taskId)>=11 && Number(taskId)<=16 ? latestImageRecovery(runRoot,executionKey,taskId) : null;
    const imageOverride=applyImmediateImageRecovery({
      task_id:taskId,
      task_state:current?.state,
      image_recovery:image,
      recovery_attempts:Number(args['recovery-attempts']||0)
    });
    const blockerEvidence=latest ? recoverableBlockerEvidence(latest) : {actionable:false,normalized:null};
    const blockedRecoverable=blockerEvidence.actionable || imageOverride.blocked_recoverable;
    const classification=classifyRunHealth({
      terminal,task_state:imageOverride.task_state,executor_state:executorState,
      last_progress_at:args['last-progress-at']||latest?.at||null,
      blocked_recoverable:blockedRecoverable,blocked_external:latest?.external_blocker===true,
      next_task_ready:current?.state==='Backlog'||current?.state==='Ready',
      now:args.now||new Date().toISOString(),
      stale_threshold_ms:(taskContract?.stale_after_seconds||900)*1000
    });
    const repairState=repairEpochState(runRoot,args['execution-id'],taskId);
    const decision=taskRecoveryDecision({
      classification,taskContract,
      attempts:Number(args.attempts||0),recoveryAttempts:imageOverride.recovery_attempts,
      repairEpochs:repairState.epochs_completed,repairReady:repairState.repair_ready,
      postRepairAttempts:repairState.post_repair_attempts,
      forceEngineeringRepair:imageOverride.force_engineering_repair === true
    });
    let request=null;
    if(decision.action==='engineering_repair'){
      request=buildEngineeringRepairRequest({
        execution_id:args['execution-id'],edition_id:args['edition-id'],branch:args.branch,
        task_id:taskId,instruction:decision.instruction,
        writer_generation:Number(args['writer-generation']),
        repair_epoch:decision.repair_epoch,required_proofs:decision.required_proofs,
        created_at:args.now||new Date().toISOString()
      });
    }else if(decision.action==='post_repair_attempt'){
      request=buildWorkerRequest({
        execution_id:args['execution-id'],edition_id:args['edition-id'],branch:args.branch,
        task_id:taskId,capability:decision.capability,instruction:decision.instruction,
        writer_generation:Number(args['writer-generation']),
        recovery_attempt:imageOverride.recovery_attempts,
        repair_epoch:decision.repair_epoch,
        post_repair_attempt:decision.post_repair_attempt,
        created_at:args.now||new Date().toISOString()
      });
    }else if(['dispatch_normal','first_recovery','alternate_recovery'].includes(decision.action)){
      let instruction=decision.instruction;
      let recoveryAttempt=imageOverride.recovery_attempts;
      if(image?.recovery_action){
        instruction=image.recovery_action;
        recoveryAttempt=Math.max(recoveryAttempt,Number(image.attempt||0));
      }
      request=buildWorkerRequest({
        execution_id:args['execution-id'],edition_id:args['edition-id'],branch:args.branch,
        task_id:taskId,capability:decision.capability,instruction,
        writer_generation:Number(args['writer-generation']),recovery_attempt:recoveryAttempt,
        created_at:args.now||new Date().toISOString()
      });
    }
    const kanban=existingKanban(runRoot,executionKey);
    const fresh=kanbanProjectionFresh({events,kanban:kanban.value});
    emit({
      schema_version:'run-supervisor-tick-v1',
      execution_id:args['execution-id'],execution_key:executionKey,edition_id:args['edition-id'],branch:args.branch,
      current_task:current,latest_task_event:latest,latest_blocker_evidence:blockerEvidence,executor_state:executorState,
      immediate_image_recovery:imageOverride,repair_epoch_state:repairState,classification,
      decision:publication.write_allowed?decision:{action:publication.action},
      worker_request:publication.write_allowed?request:null,publication,
      kanban:{fresh:fresh.fresh,reason:fresh.reason,expected_digest:fresh.expected_digest,observed_digest:fresh.observed_digest,file:path.relative(runRoot,kanban.file)},
      terminal
    });
  }else{
    throw Error('expected_validate-contracts_active-run-decision_writer-lease_assert-fence_scheduled-worker-fence_release-handoff_project-kanban_enqueue_repository-liveness_or_tick');
  }
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
