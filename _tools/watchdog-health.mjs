#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  classifyRunHealth,normalizeTaskEvent,projectKanbanFromEvents,recoverableBlockerEvidence
} from '../_generator/lib/run-supervisor.mjs';
import {
  selectAuthoritativeRequest,watchdogLeaseActive
} from '../_generator/lib/chatgpt-watchdog-ring.mjs';
import {buildWatchdogHealthRecord} from '../_generator/lib/watchdog-health.mjs';

const argv=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--'))continue;
  const key=argv[i].slice(2),next=argv[i+1];
  if(next!==undefined&&!next.startsWith('--')){args[key]=next;i++;}else args[key]=true;
}
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const write=(file,value)=>{
  const target=path.resolve(file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');
};
const jsonFiles=dir=>{
  if(!dir||!fs.existsSync(dir))return [];
  const rows=[];
  for(const name of fs.readdirSync(dir).sort()){
    if(!name.endsWith('.json'))continue;
    try{rows.push({_file:name,value:read(path.join(dir,name))});}catch{}
  }
  return rows;
};
const latestBy=(rows,getTime)=>[...rows].sort((a,b)=>getTime(a)-getTime(b)).at(-1)||null;
const eventTime=row=>Date.parse(row?.value?.at||row?.value?.occurred_at||0)||0;
const state=value=>String(value||'').toLowerCase();
const activeExecutor=value=>['running','recovering','claimed','active','in_progress'].includes(state(value));
const progressingExecutor=(value,classification)=>activeExecutor(value)&&classification?.state==='HEALTHY_ACTIVE';

if(!args.pointer||!args.contracts)throw Error('pointer_and_contracts_required');
const now=args.now||new Date().toISOString();
const pointer=read(args.pointer);
const contracts=read(args.contracts);
const runRoot=args['run-root']?path.resolve(args['run-root']):null;
let record;

if(pointer.terminal===true||pointer.active!==true){
  record=buildWatchdogHealthRecord({
    observed_at:now,active:false,terminal:pointer.terminal===true,
    edition_id:pointer.edition_id||null,execution_id:pointer.execution_id||null,
    execution_key:pointer.execution_key||null,branch:pointer.branch||null,
    first_incomplete_task:null,task_state:pointer.current_task_state||null,
    live_executor_state:'Stopped',
    classification:{state:pointer.terminal===true?'TERMINAL':'NO_ACTIVE_EXECUTION'},
    normalized_fault_code:null,actionable:false,next_legal_action:null,
    evidence_refs:['data/operations/active-production-run.json']
  });
}else if(!runRoot){
  record=buildWatchdogHealthRecord({
    observed_at:now,active:true,terminal:false,
    edition_id:pointer.edition_id,execution_id:pointer.execution_id,
    execution_key:pointer.execution_key,branch:pointer.branch,
    first_incomplete_task:pointer.current_task||null,task_state:pointer.current_task_state||null,
    live_executor_state:'Unknown',classification:{state:'AMBIGUOUS'},
    normalized_fault_code:'ACTIVE_RUN_BRANCH_UNAVAILABLE',actionable:true,
    next_legal_action:'FETCH_ACTIVE_RUN_BRANCH',
    evidence_refs:['data/operations/active-production-run.json']
  });
}else{
  const eventDir=path.join(runRoot,'_records/edition-execution/events',pointer.execution_key);
  const eventRows=jsonFiles(eventDir);
  const events=eventRows.map(row=>normalizeTaskEvent(row.value))
    .filter(event=>event?.task_id!==undefined&&event?.to&&event?.at);
  const tasks=Object.fromEntries(Object.entries(contracts.tasks||{}).map(([id,t])=>[id,{title:t.title}]));
  const projection=projectKanbanFromEvents({
    tasks,events,execution_id:pointer.execution_id,edition_id:pointer.edition_id,observed_at:now
  });
  let current=null;
  for(let n=0;n<=29;n++){
    const id=String(n).padStart(2,'0'),task=projection.tasks[id];
    if(!task||task.state!=='Done'){current=task||{id,state:'Backlog'};break;}
  }
  const terminal=!current;
  const latestEvent=current
    ? latestBy(eventRows.filter(row=>String(row.value?.task_id||'').padStart(2,'0')===current.id),eventTime)
    : latestBy(eventRows,eventTime);
  const latestEventValue=latestEvent?normalizeTaskEvent(latestEvent.value):null;
  const workerPath=path.join(runRoot,'_records/edition-execution/workers',pointer.execution_id+'.json');
  let worker={state:'Unknown'};
  if(fs.existsSync(workerPath)){try{worker=read(workerPath);}catch{}}
  const executorState=worker.state||worker.executor_state||'Unknown';
  const blocker=latestEventValue?recoverableBlockerEvidence(latestEventValue):{actionable:false};
  const taskContract=current?contracts.tasks?.[current.id]:null;
  const classification=classifyRunHealth({
    terminal,task_state:current?.state,executor_state:executorState,
    last_progress_at:latestEventValue?.at||null,
    blocked_recoverable:blocker.actionable,
    blocked_external:latestEventValue?.external_blocker===true,
    next_task_ready:['Backlog','Ready'].includes(current?.state),
    now,stale_threshold_ms:Number(taskContract?.stale_after_seconds||900)*1000
  });

  const requestDir=path.join(runRoot,'_records/edition-execution/worker-requests',pointer.execution_id);
  const requests=jsonFiles(requestDir).map(row=>row.value);
  let authoritative=null;
  if(current){
    try{authoritative=selectAuthoritativeRequest(requests,{execution_id:pointer.execution_id,task_id:current.id});}catch{}
  }
  const watchdogLeasePath=path.join(runRoot,'_records/edition-execution/watchdog-leases',pointer.execution_id+'.json');
  let watchdogLease=null;
  if(fs.existsSync(watchdogLeasePath)){try{watchdogLease=read(watchdogLeasePath);}catch{}}
  const writerLeasePath=path.join(runRoot,'_records/edition-execution/writer-leases',pointer.execution_id+'.json');
  let writerLease=null;
  if(fs.existsSync(writerLeasePath)){try{writerLease=read(writerLeasePath);}catch{}}
  const latestProgressAt=latestBy(eventRows,eventTime)?.value?.at||null;
  const recoveryOwnerActive=watchdogLeaseActive(watchdogLease,{execution_id:pointer.execution_id,now});
  const recoveryOwnerProgressing=Boolean(
    recoveryOwnerActive&&latestProgressAt&&watchdogLease?.acquired_at&&Date.parse(latestProgressAt)>=Date.parse(watchdogLease.acquired_at)
  );
  const repairDir=path.join(runRoot,'_records/edition-execution/protected-repairs',pointer.execution_id);
  const repairRows=jsonFiles(repairDir);
  const latestRepair=latestBy(repairRows,row=>Date.parse(row.value?.updated_at||row.value?.created_at||0)||0);
  const resultDir=path.join(runRoot,'_records/edition-execution/worker-results',pointer.execution_id);
  const acceptedLockedImages=jsonFiles(resultDir).filter(row=>{
    const task=String(row.value?.task_id||'').padStart(2,'0');
    return /^1[1-6]$/.test(task)&&row.value?.accepted_locked===true&&String(row.value?.status||'').toLowerCase()==='passed';
  }).reduce((set,row)=>set.add(String(row.value.task_id).padStart(2,'0')),new Set()).size;

  const evidenceRefs=['data/operations/active-production-run.json'];
  if(latestEvent)evidenceRefs.push(path.relative(runRoot,path.join(eventDir,latestEvent._file)).replaceAll('\\','/'));
  if(authoritative)evidenceRefs.push('_records/edition-execution/worker-requests/'+pointer.execution_id+'/'+String(authoritative.task_id).padStart(2,'0')+'-'+authoritative.request_key+'.json');
  if(watchdogLease)evidenceRefs.push(path.relative(runRoot,watchdogLeasePath).replaceAll('\\','/'));
  if(writerLease)evidenceRefs.push(path.relative(runRoot,writerLeasePath).replaceAll('\\','/'));
  if(latestRepair)evidenceRefs.push(path.relative(runRoot,path.join(repairDir,latestRepair._file)).replaceAll('\\','/'));

  const hasQueuedRequest=Boolean(authoritative&&['queued','pending','queued_for_scheduled_consumer'].includes(state(authoritative.status||authoritative.state)));
  const actionable=['STALE_ACTIVE','BLOCKED_ACTIONABLE'].includes(classification.state)||(classification.state==='READY_IDLE'&&hasQueuedRequest);
  const nextLegalAction=actionable
    ? hasQueuedRequest?'CONSUME_EXACT_QUEUED_REQUEST':'NARROW_RECOVERY_REQUIRED'
    : null;

  record=buildWatchdogHealthRecord({
    observed_at:now,active:!terminal,terminal,
    edition_id:pointer.edition_id,execution_id:pointer.execution_id,
    execution_key:pointer.execution_key,branch:pointer.branch,
    first_incomplete_task:current?.id||null,task_state:current?.state||null,
    capability:taskContract?.capability||null,
    last_substantive_progress_at:latestProgressAt,
    last_substantive_progress_type:latestEventValue?.to||latestEventValue?.event_type||null,
    live_executor_state:executorState,
    executor_active:activeExecutor(executorState),
    executor_progressing:progressingExecutor(executorState,classification),
    request_key:authoritative?.request_key||null,
    request_status:authoritative?.status||authoritative?.state||null,
    writer_owner:writerLease?.owner_id||null,
    writer_generation:Number.isInteger(writerLease?.generation)?writerLease.generation:null,
    writer_expires_at:writerLease?.expires_at||null,
    watchdog_owner:recoveryOwnerActive?(watchdogLease?.owner_slot||null):null,
    watchdog_expires_at:recoveryOwnerActive?(watchdogLease?.expires_at||null):null,
    watchdog_recovery_owner_progressing:recoveryOwnerProgressing,
    protected_repair_stage:latestRepair?.value?.state||null,
    classification,actionable,next_legal_action:nextLegalAction,
    accepted_locked_images:acceptedLockedImages,evidence_refs:evidenceRefs
  });
}
if(args.output)write(args.output,record);
process.stdout.write(JSON.stringify(record,null,2)+'\n');
