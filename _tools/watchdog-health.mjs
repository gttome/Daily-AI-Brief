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
const requestTime=row=>Date.parse(row?.value?.created_at||0)||0;

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
    first_incomplete_task:null,first_incomplete_task_state:pointer.current_task_state||null,
    live_executor_state:'Stopped',classification:{state:pointer.terminal===true?'TERMINAL':'AMBIGUOUS'},
    normalized_fault_code:pointer.terminal===true?null:'NO_ACTIVE_NONTERMINAL_EXECUTION',
    evidence_refs:['data/operations/active-production-run.json']
  });
}else if(!runRoot){
  record=buildWatchdogHealthRecord({
    observed_at:now,active:true,terminal:false,
    edition_id:pointer.edition_id,execution_id:pointer.execution_id,
    execution_key:pointer.execution_key,branch:pointer.branch,
    first_incomplete_task:pointer.current_task||null,
    first_incomplete_task_state:pointer.current_task_state||null,
    live_executor_state:'Unknown',classification:{state:'AMBIGUOUS'},
    normalized_fault_code:'ACTIVE_RUN_BRANCH_UNAVAILABLE',
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
    terminal,task_state:current?.state,executor_state,
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
  const leasePath=path.join(runRoot,'_records/edition-execution/watchdog-leases',pointer.execution_id+'.json');
  let lease=null;
  if(fs.existsSync(leasePath)){try{lease=read(leasePath);}catch{}}
  const latestProgressAt=latestBy(eventRows,eventTime)?.value?.at||null;
  const recoveryOwnerActive=watchdogLeaseActive(lease,{execution_id:pointer.execution_id,now});
  const recoveryOwnerProgressing=Boolean(
    recoveryOwnerActive&&latestProgressAt&&lease?.acquired_at&&Date.parse(latestProgressAt)>=Date.parse(lease.acquired_at)
  );
  const repairDir=path.join(runRoot,'_records/edition-execution/protected-repairs',pointer.execution_id);
  const repairRows=jsonFiles(repairDir);
  const latestRepair=latestBy(repairRows,row=>Date.parse(row.value?.updated_at||row.value?.created_at||0)||0);
  const evidenceRefs=['data/operations/active-production-run.json'];
  if(latestEvent)evidenceRefs.push(path.relative(runRoot,path.join(eventDir,latestEvent._file)).replaceAll('\\','/'));
  if(authoritative)evidenceRefs.push('_records/edition-execution/worker-requests/'+pointer.execution_id+'/'+String(authoritative.task_id).padStart(2,'0')+'-'+authoritative.request_key+'.json');
  if(lease)evidenceRefs.push(path.relative(runRoot,leasePath).replaceAll('\\','/'));
  if(latestRepair)evidenceRefs.push(path.relative(runRoot,path.join(repairDir,latestRepair._file)).replaceAll('\\','/'));

  record=buildWatchdogHealthRecord({
    observed_at:now,active:!terminal,terminal,
    edition_id:pointer.edition_id,execution_id:pointer.execution_id,
    execution_key:pointer.execution_key,branch:pointer.branch,
    first_incomplete_task:current?.id||null,first_incomplete_task_state:current?.state||null,
    last_substantive_progress_at:latestProgressAt,
    live_executor_state:executorState,
    queued_authoritative_request_key:authoritative?.request_key||null,
    watchdog_recovery_owner:recoveryOwnerActive?lease?.owner_slot||null:null,
    watchdog_recovery_owner_progressing:recoveryOwnerProgressing,
    protected_repair_stage:latestRepair?.value?.state||null,
    classification,evidence_refs
  });
}
if(args.output)write(args.output,record);
process.stdout.write(JSON.stringify(record,null,2)+'\n');
