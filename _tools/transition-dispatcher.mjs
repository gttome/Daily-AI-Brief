#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  substantiveTransition,buildCanonicalTransitionEvent,dispatchTransitionEvent
} from '../_generator/lib/transition-dispatcher.mjs';

const argv=process.argv.slice(2),command=argv.shift(),args={};
for(let i=0;i<argv.length;i++){const key=argv[i].replace(/^--/,'');args[key]=argv[i+1];i++;}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const safe=value=>String(value||'').replace(/[^A-Za-z0-9._-]/g,'_');

function resolveIdentity(root){
  if(args['execution-id']&&args['execution-key']&&args['edition-id'])return {
    execution_id:args['execution-id'],execution_key:args['execution-key'],edition_id:args['edition-id'],branch:args.branch
  };
  const prod=path.join(root,'data/operations/active-production-run.json');
  if(fs.existsSync(prod)){
    const p=read(prod);
    if(p.active===true&&p.terminal!==true&&(!args.branch||p.branch===args.branch))
      return {execution_id:p.execution_id,execution_key:p.execution_key,edition_id:p.edition_id,branch:p.branch};
  }
  const rehearsal=path.join(root,'_records/rehearsal/active-public-rehearsal.json');
  if(fs.existsSync(rehearsal)){
    const p=read(rehearsal);
    if(p.active===true&&p.terminal!==true&&(!args.branch||p.branch===args.branch))
      return {execution_id:p.execution_id,execution_key:p.execution_key,edition_id:p.edition_id,branch:p.branch};
  }
  throw Error('nonterminal_run_identity_not_found');
}
function events(root,key){
  const dir=path.join(root,'_records/edition-execution/events',safe(key));
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(name=>{
    const value=read(path.join(dir,name));return {...value,_file:name};
  }).filter(substantiveTransition).sort((a,b)=>Date.parse(a.at||a.timestamp)-Date.parse(b.at||b.timestamp)||a._file.localeCompare(b._file));
}
function dispatches(root,id){
  const dir=path.join(root,'_records/edition-execution/transition-dispatch',safe(id));
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>read(path.join(dir,n)));
}
function writerGeneration(root,id,raw){
  if(Number.isInteger(raw.writer_generation)&&raw.writer_generation>0)return raw.writer_generation;
  const lease=path.join(root,'_records/edition-execution/writer-leases',safe(id)+'.json');
  if(fs.existsSync(lease)){const n=Number(read(lease).generation);if(Number.isInteger(n)&&n>0)return n;}
  return 1;
}
if(command!=='drain')throw Error('expected_drain');
const root=path.resolve(args['run-root']||'.'),identity=resolveIdentity(root);
if(!identity.branch)throw Error('run_branch_required');
const contract=read(args.contracts),taskContracts=contract.tasks||{};
const prior=dispatches(root,identity.execution_id),summary={status:'NOOP',canonical_events:0,dispatches:0,noops:0,worker_requests:0,processed:[]};
for(const raw of events(root,identity.execution_key)){
  const current=String(raw.task_id||'').padStart(2,'0'),next=String(Math.min(29,Number(current)+1)).padStart(2,'0');
  const canonical=buildCanonicalTransitionEvent({
    raw,execution_id:identity.execution_id,edition_id:identity.edition_id,
    writer_generation:writerGeneration(root,identity.execution_id,raw),
    request_key:raw.request_key||null,
    content_state:{source_event_file:raw._file},
    next_task_contract:taskContracts[raw.to==='Done'?next:current]||null,
    next_task_id:raw.to==='Done'?next:current
  });
  const all=[...prior];
  const existing=all.find(x=>x.idempotency_key===canonical.idempotency_key);
  if(existing){summary.processed.push({event:canonical.idempotency_key,status:'ALREADY_CONSUMED'});continue;}
  const token=canonical.idempotency_key.slice('sha256:'.length);
  const canonicalPath=path.join(root,'_records/edition-execution/transition-events',safe(identity.execution_id),token+'.json');
  write(canonicalPath,canonical);summary.canonical_events++;
  const decision=dispatchTransitionEvent({event:canonical,task_contracts:taskContracts,branch:identity.branch,existing_dispatches:prior});
  if(decision.record){
    const recordPath=path.join(root,'_records/edition-execution/transition-dispatch',safe(identity.execution_id),token+'.json');
    write(recordPath,decision.record);prior.push(decision.record);
    if(decision.status==='DISPATCHED')summary.dispatches++;else summary.noops++;
  }
  if(decision.request){
    const requestPath=path.join(root,'_records/edition-execution/worker-requests',safe(identity.execution_id),decision.request.task_id+'-'+decision.request.request_key+'.json');
    if(fs.existsSync(requestPath)){
      const old=read(requestPath);if(old.request_key!==decision.request.request_key)throw Error('worker_request_path_conflict');
    } else {write(requestPath,decision.request);summary.worker_requests++;}
  }
  summary.processed.push({event:canonical.idempotency_key,status:decision.status,target_task_id:decision.record?.target_task_id||null});
}
if(summary.canonical_events||summary.dispatches||summary.noops||summary.worker_requests)summary.status='PROGRESSED';
process.stdout.write(JSON.stringify(summary,null,2)+'\n');
