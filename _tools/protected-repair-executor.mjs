#!/usr/bin/env node
import fs from 'node:fs';
import {
  validateProtectedRepairRecord,
  exactHeadCiGate,
  mergeGate,
  buildDeadWriterProof,
  validateDeadWriterProof,
  verifyProtectedRepairProgress,
  syntheticProtectedRepairTrace
} from '../_generator/lib/protected-repair-executor.mjs';

const argv=process.argv.slice(2);
const command=argv.shift();
const args={};
for(let i=0;i<argv.length;i++){
  const token=argv[i];
  if(!token.startsWith('--')) continue;
  const key=token.slice(2);
  const next=argv[i+1];
  if(next!==undefined&&!next.startsWith('--')){args[key]=next;i++;}
  else args[key]=true;
}
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const emit=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n');

try{
  if(command==='validate-record'){
    const errors=validateProtectedRepairRecord(read(args.record),args.active?read(args.active):null);
    emit({result:errors.length?'FAIL':'PASS',errors});
    if(errors.length)process.exitCode=1;
  }else if(command==='ci-gate'){
    const checks=read(args.checks);
    const out=exactHeadCiGate({
      record:read(args.record),
      observed_head_sha:args['head-sha'],
      check_runs:Array.isArray(checks)?checks:(checks.check_runs||[])
    });
    emit(out);
    if(!out.allowed)process.exitCode=2;
  }else if(command==='merge-gate'){
    const out=mergeGate({
      record:read(args.record),
      activePointer:read(args.active),
      current_task:args['current-task'],
      observed_head_sha:args['head-sha'],
      ciGate:read(args.ci),
      repair_already_merged:args.merged===true||args.merged==='true'
    });
    emit(out);
    if(!out.allowed&&out.state!=='REPAIR_MERGED')process.exitCode=2;
  }else if(command==='dead-writer-proof'){
    const proof=buildDeadWriterProof({
      lease:read(args.lease),
      workflow_run:read(args['workflow-run']),
      child_workers_live:args['child-workers-live']==='true',
      substantive_write_after_terminal:args['post-terminal-write']==='true',
      proved_dead_at:args.now||new Date().toISOString()
    });
    if(args.output)write(args.output,proof);
    emit(proof);
  }else if(command==='validate-dead-writer-proof'){
    const errors=validateDeadWriterProof(read(args.proof),read(args.lease));
    emit({result:errors.length?'FAIL':'PASS',errors});
    if(errors.length)process.exitCode=1;
  }else if(command==='verify-progress'){
    const out=verifyProtectedRepairProgress({
      record:read(args.record),
      merge_sha:args['merge-sha']||null,
      same_task_resumed:args['same-task-resumed']==='true',
      executor_active:args['executor-active']==='true',
      durable_progress:args['durable-progress']==='true',
      task_done:args['task-done']==='true',
      accepted_locked_changed:args['accepted-locked-changed']==='true',
      post_repair_attempts:Number(args['post-repair-attempts']||0)
    });
    emit(out);
    if(!out.verified)process.exitCode=2;
  }else if(command==='synthetic-proof'){
    const out=syntheticProtectedRepairTrace();
    emit(out);
    if(out.ci.allowed!==true||out.merge.allowed!==true||out.progress.verified!==true)process.exitCode=1;
  }else{
    throw Error('unknown_command');
  }
}catch(error){
  process.stderr.write(String(error?.stack||error)+'\n');
  process.exitCode=1;
}
