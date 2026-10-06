#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {buildProductionRunCloseout} from '../_generator/lib/production-run-closeout.mjs';
import {buildAtomicCloseoutTransaction,deriveIncidentInventory} from '../_generator/lib/atomic-closeout.mjs';
import {evaluateReaderSemanticCloseGate} from '../_generator/lib/reader-semantic-close-gate.mjs';
const date=process.argv[2],read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pointer=read('data/operations/active-production-run.json');
if(!pointer.active || pointer.terminal || pointer.edition_id!=='dab-edition-'+date) {
  console.log(JSON.stringify({status:'PRESERVED_OTHER_OR_TERMINAL_RUN'}));
} else {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || !/^\d{4}-\d{2}-\d{2}-run\d+$/.test(pointer.execution_key||'')) throw Error('run_identity_required');
  const dir=`_records/edition-execution/events/${pointer.execution_key}`;
  const delta=`_records/run-learning/incidents/${pointer.execution_id}.jsonl`;
  const readerSemanticGate=evaluateReaderSemanticCloseGate({root:'.',editionDate:date,executionKey:pointer.execution_key,observedAt:new Date().toISOString()});
  if(readerSemanticGate.result!=='PASS') throw Error('reader_semantic_close_gate_failed:'+readerSemanticGate.errors.join(','));
  const closeoutArgs={pointer,completion:read(`_records/publication/${date}/completion.json`),
    validation:read(`_records/publication/${date}/delta-validation.json`),runState:read(`_records/run-state/${date}.json`),
    cc:read(`_records/command-center/${date}-public-safe-delta.json`),tasks:read('docs/operations/task-recovery-contracts.json').tasks,
    events:fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>read(path.join(dir,p))),
    ledgerText:fs.readFileSync('data/operations/production-continuous-improvement-ledger.jsonl','utf8'),
    deltaText:fs.existsSync(delta)?fs.readFileSync(delta,'utf8'):'',readerSemanticGate,now:new Date().toISOString()};
  const listJson=rel=>{
    const full=path.join(rel);if(!fs.existsSync(full))return [];
    return fs.readdirSync(full).filter(p=>p.endsWith('.json')).sort().map(p=>{try{return read(path.join(full,p))}catch{return {path:path.join(rel,p)}}});
  };
  let result;
  if(date>='2026-10-07'){
    const watchdog=listJson(`_records/edition-execution/watchdog-events/${pointer.execution_id}`);
    const protectedRepairs=listJson(`_records/edition-execution/protected-repairs/${pointer.execution_id}`);
    const runEvents=closeoutArgs.events;
    const inventory=deriveIncidentInventory({
      repair_prs:protectedRepairs.filter(x=>x.pr_number).map(x=>x.pr_number),
      protected_repairs:protectedRepairs,
      blocked_transitions:runEvents.filter(x=>(x.to||x.to_state)==='Blocked'),
      liveness_faults:listJson(`_records/edition-execution/liveness-faults/${pointer.execution_id}`),
      failed_workers:listJson(`_records/edition-execution/worker-results/${pointer.execution_id}`).filter(x=>/fail|error|blocked/i.test(String(x.status||x.state||''))),
      dead_writer_proofs:listJson(`_records/edition-execution/dead-writer-recovery/${pointer.execution_id}`),
      strategy_interrupts:watchdog.filter(x=>/strategy/i.test(String(x.action||x.action_type||x.state||''))),
      task23_recoveries:protectedRepairs.filter(x=>String(x.task_id).padStart(2,'0')==='23'),
      wake_actions:watchdog.filter(x=>/wake|redispatch|reconcile|consume/i.test(String(x.action||x.action_type||'')))
    });
    result=buildAtomicCloseoutTransaction(closeoutArgs,{
      incident_inventory:inventory,
      // buildProductionRunCloseout independently certifies the canonical+run-delta
      // learning ledger before returning. The inventory is therefore bound into
      // this same atomic protected commit only after that certification passes.
      learning_incident_keys:inventory.items.map(x=>x.key),
      transaction_at:closeoutArgs.now
    });
  } else result=buildProductionRunCloseout(closeoutArgs);
  for(const [file,value] of Object.entries(result.files)) {
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const bytes=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
    if(file.includes('/events/') && fs.existsSync(file) && fs.readFileSync(file,'utf8')!==bytes) throw Error('immutable_closeout_event_conflict');
    fs.writeFileSync(file,bytes);
  }
  console.log(JSON.stringify({status:result.status,files:Object.keys(result.files)}));
}
