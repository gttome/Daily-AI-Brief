#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  REPOSITORY_REPAIR_CONSUMER_VERSION,
  queuedRepositoryRepairDecision,
  buildImageEngineeringRepairReceipt
} from '../_generator/lib/repository-repair-consumer.mjs';

const argv=process.argv.slice(2),command=argv.shift(),args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--')) continue;
  const key=argv[i].slice(2),next=argv[i+1];
  if(next!==undefined&&!next.startsWith('--')){args[key]=next;i++;}else args[key]=true;
}
const emit=x=>process.stdout.write(JSON.stringify(x,null,2)+'\n');
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const writeJson=(p,x)=>{const f=path.resolve(p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');};
const ledgerInvariants=text=>{
  const values=[];
  for(const raw of text.split(/\r?\n/)){
    if(!raw.trim())continue;
    const e=JSON.parse(raw);
    for(const x of e.data?.invariants||[]) values.push(x);
  }
  return [...new Set(values)];
};
const safeExec=value=>String(value||'').replace(/[^A-Za-z0-9._-]/g,'_');

try{
  if(command!=='consume') throw Error('expected_consume');
  const runRoot=path.resolve(args['run-root']||'.');
  const controlRoot=path.resolve(args['control-root']||'.');
  const executionKey=String(args['execution-key']||'');
  const incoming=readJson(args.request);
  const decision=queuedRepositoryRepairDecision({request:incoming,active_consumer:true});
  if(decision.action!=='execute_now'&&decision.action!=='already_consumed') throw Error('repository_repair_not_executable:'+decision.reason);

  const persistedPath=path.join(runRoot,'_records/edition-execution/worker-requests',safeExec(incoming.execution_id),`${incoming.task_id}-${incoming.request_key}.json`);
  const persisted=fs.existsSync(persistedPath)?readJson(persistedPath):incoming;
  const epochPath=path.join(runRoot,'_records/edition-execution/repair-epochs',safeExec(incoming.execution_id),`${incoming.task_id}.json`);
  if(fs.existsSync(epochPath)){
    const prior=readJson(epochPath);
    if(prior.request_key===incoming.request_key&&prior.status==='PASS'&&prior.required_proofs_passed===true){
      emit({result:'REUSED_PASS',consumer_version:REPOSITORY_REPAIR_CONSUMER_VERSION,repair_epoch:path.relative(runRoot,epochPath)});
      process.exit(0);
    }
  }

  const contracts=readJson(path.join(controlRoot,'docs/operations/task-recovery-contracts.json'));
  const taskContract=contracts.tasks?.[incoming.task_id];
  const transportPath=path.join(runRoot,'_records/image-attempts',executionKey,'m03-attempt-2.json');
  if(!fs.existsSync(transportPath)) throw Error('known_good_transport_proof_missing');
  const transportAttempt=readJson(transportPath);
  const ledgerPath=path.join(controlRoot,'data/operations/production-continuous-improvement-ledger.jsonl');
  const learningInvariants=ledgerInvariants(fs.readFileSync(ledgerPath,'utf8'));
  const protectedCi={
    run_id:Number(args['protected-ci-run-id']),
    control_sha:String(args['protected-ci-sha']||''),
    conclusion:String(args['protected-ci-conclusion']||'')
  };
  const consumedAt=args.now||new Date().toISOString();
  const receipt=buildImageEngineeringRepairReceipt({
    request:incoming,taskContract,transportAttempt,protectedCi,learningInvariants,consumedAt,
    consumerWriterGeneration:Number(args['writer-generation'])
  });
  if(receipt.result!=='PASS'){
    emit(receipt);
    process.exitCode=2;
  }else{
    writeJson(epochPath,receipt.epoch);
    const resultPath=path.join(runRoot,'_records/edition-execution/worker-results',safeExec(incoming.execution_id),`${incoming.task_id}-${incoming.request_key}.json`);
    writeJson(resultPath,{
      schema_version:'run-engineering-repair-result-v1',
      request_key:incoming.request_key,
      execution_id:incoming.execution_id,
      edition_id:incoming.edition_id,
      branch:incoming.branch,
      task_id:incoming.task_id,
      repair_epoch:incoming.repair_epoch,
      status:'passed',
      completed_at:consumedAt,
      required_proofs_passed:true,
      proofs:receipt.proofs,
      repair_epoch_ref:path.relative(runRoot,epochPath)
    });
    writeJson(persistedPath,{
      ...persisted,
      status:'completed_pass',
      consumed_at:consumedAt,
      completed_at:consumedAt,
      consumer_version:REPOSITORY_REPAIR_CONSUMER_VERSION,
      consumer_writer_generation:Number(args['writer-generation']),
      result_ref:path.relative(runRoot,resultPath),
      repair_epoch_ref:path.relative(runRoot,epochPath)
    });
    emit({result:'PASS',consumer_version:REPOSITORY_REPAIR_CONSUMER_VERSION,
      request:path.relative(runRoot,persistedPath),result_ref:path.relative(runRoot,resultPath),
      repair_epoch:path.relative(runRoot,epochPath),proofs:receipt.proofs});
  }
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
