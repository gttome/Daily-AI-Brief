#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  activeRunDecision, acquireWriterLease, assertWriterFence, classifyRunHealth,
  validateTaskRecoveryContracts, taskRecoveryDecision, buildWorkerRequest,
  projectKanbanFromEvents, kanbanProjectionFresh
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
      const value=JSON.parse(fs.readFileSync(file,'utf8'));
      if(value && value.task_id!==undefined && value.to && value.at)
        events.push({...value,task_id:String(value.task_id).padStart(2,'0'),_file:name});
    }catch{}
  }
  return events;
}
function latestTaskEvent(events,taskId){
  return events.filter(e=>e.task_id===taskId).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).at(-1)||null;
}
function latestImageRecovery(runRoot,executionKey){
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
  return records.filter(r=>r.status==='rejected' && r.recovery_action)
    .sort((a,b)=>Date.parse(a._at||0)-Date.parse(b._at||0)).at(-1)||null;
}
function currentTaskFromProjection(tasks){
  for(let n=0;n<=29;n++){
    const id=String(n).padStart(2,'0'),task=tasks[id];
    if(!task || task.state!=='Done') return task || {id,state:'Backlog'};
  }
  return null;
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
  }else if(command==='project-kanban'){
    const runRoot=path.resolve(args['run-root']||'.'),executionKey=safeExecutionKey(args['execution-key']);
    const contract=readJson(args.contracts), events=loadEvents(runRoot,executionKey);
    const tasks=Object.fromEntries(Object.entries(contract.tasks).map(([id,t])=>[id,{title:t.title}]));
    const value=projectKanbanFromEvents({tasks,events,execution_id:args['execution-id'],edition_id:args['edition-id'],observed_at:args['observed-at']||new Date().toISOString()});
    if(args.output) writeJson(args.output,value);
    emit(value);
  }else if(command==='enqueue'){
    const runRoot=path.resolve(args['run-root']||'.'), request=readJson(args.request);
    const file=requestPath(runRoot,request);
    if(fs.existsSync(file)){
      const existing=readJson(file);
      if(existing.request_key!==request.request_key) throw Error('worker_request_path_conflict');
      emit({result:'REUSED',file:path.relative(runRoot,file),request_key:request.request_key});
    }else{
      writeJson(file,request);
      emit({result:'QUEUED',file:path.relative(runRoot,file),request_key:request.request_key});
    }
  }else if(command==='tick'){
    const runRoot=path.resolve(args['run-root']||'.'), executionKey=safeExecutionKey(args['execution-key']);
    const contract=readJson(args.contracts), errors=validateTaskRecoveryContracts(contract);
    if(errors.length) throw Error('invalid_task_recovery_contract:'+errors.join(','));
    const events=loadEvents(runRoot,executionKey);
    const tasks=Object.fromEntries(Object.entries(contract.tasks).map(([id,t])=>[id,{title:t.title}]));
    const projection=projectKanbanFromEvents({tasks,events,execution_id:args['execution-id'],edition_id:args['edition-id'],observed_at:args.now||new Date().toISOString()});
    const current=currentTaskFromProjection(projection.tasks);
    const terminal=!current;
    const taskId=current?.id||'29';
    const taskContract=contract.tasks[taskId];
    const latest=latestTaskEvent(events,taskId);
    const worker=workerState(runRoot,args['execution-id']);
    const executorState=args['executor-state']||worker.state;
    const blockedRecoverable=current?.state==='Blocked' && latest?.recoverable!==false && latest?.external_blocker!==true;
    const classification=classifyRunHealth({
      terminal,task_state:current?.state,executor_state:executorState,
      last_progress_at:args['last-progress-at']||latest?.at||null,
      blocked_recoverable:blockedRecoverable,blocked_external:latest?.external_blocker===true,
      next_task_ready:current?.state==='Backlog'||current?.state==='Ready',
      now:args.now||new Date().toISOString(),
      stale_threshold_ms:(taskContract?.stale_after_seconds||900)*1000
    });
    const decision=taskRecoveryDecision({
      classification,taskContract,
      attempts:Number(args.attempts||0),recoveryAttempts:Number(args['recovery-attempts']||0)
    });
    let request=null;
    if(['dispatch_normal','first_recovery','alternate_recovery'].includes(decision.action)){
      let instruction=decision.instruction;
      let recoveryAttempt=Number(args['recovery-attempts']||0);
      if(Number(taskId)>=11 && Number(taskId)<=16){
        const image=latestImageRecovery(runRoot,executionKey);
        if(image?.recovery_action){ instruction=image.recovery_action; recoveryAttempt=Math.max(recoveryAttempt,Number(image.attempt||0)); }
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
      current_task:current,latest_task_event:latest,executor_state:executorState,
      classification,decision,worker_request:request,
      kanban:{fresh:fresh.fresh,reason:fresh.reason,expected_digest:fresh.expected_digest,observed_digest:fresh.observed_digest,file:path.relative(runRoot,kanban.file)},
      terminal
    });
  }else{
    throw Error('expected_validate-contracts_active-run-decision_writer-lease_assert-fence_project-kanban_enqueue_or_tick');
  }
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
