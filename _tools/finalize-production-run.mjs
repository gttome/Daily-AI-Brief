#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {buildProductionRunCloseout} from '../_generator/lib/production-run-closeout.mjs';
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
  const result=buildProductionRunCloseout({pointer,completion:read(`_records/publication/${date}/completion.json`),
    validation:read(`_records/publication/${date}/delta-validation.json`),runState:read(`_records/run-state/${date}.json`),
    cc:read(`_records/command-center/${date}-public-safe-delta.json`),tasks:read('docs/operations/task-recovery-contracts.json').tasks,
    events:fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>read(path.join(dir,p))),
    ledgerText:fs.readFileSync('data/operations/production-continuous-improvement-ledger.jsonl','utf8'),
    deltaText:fs.existsSync(delta)?fs.readFileSync(delta,'utf8'):'',readerSemanticGate,now:new Date().toISOString()});
  for(const [file,value] of Object.entries(result.files)) {
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const bytes=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
    if(file.includes('/events/') && fs.existsSync(file) && fs.readFileSync(file,'utf8')!==bytes) throw Error('immutable_closeout_event_conflict');
    fs.writeFileSync(file,bytes);
  }
  console.log(JSON.stringify({status:result.status,files:Object.keys(result.files)}));
}
