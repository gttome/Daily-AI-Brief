#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  parseOperationalLearningLedger,
  canonicalLedgerText,
  validateOperationalLearningReadiness,
  certifyRunLearningForTask29,
  renderOperationalLearningMarkdown
} from '../_generator/lib/operational-learning.mjs';

const argv=process.argv.slice(2), command=argv.shift(), args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--')) continue;
  const key=argv[i].slice(2), next=argv[i+1];
  if(next!==undefined && !next.startsWith('--')) { args[key]=next; i++; }
  else args[key]=true;
}
const emit=x=>process.stdout.write(JSON.stringify(x,null,2)+'\n');
const readText=p=>fs.readFileSync(path.resolve(p),'utf8');
const writeText=(p,value)=>{const file=path.resolve(p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};

try{
  if(command==='validate'){
    if(!args.ledger) throw Error('ledger_required');
    const root=path.resolve(args['repo-root']||'.');
    const result=validateOperationalLearningReadiness({
      ledgerText:readText(args.ledger),
      pathExists:ref=>fs.existsSync(path.join(root,ref))
    });
    emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='render'){
    if(!args.ledger||!args.output) throw Error('ledger_and_output_required');
    writeText(args.output,renderOperationalLearningMarkdown(readText(args.ledger)));
    emit({result:'PASS',output:path.resolve(args.output)});
  }else if(command==='task29'){
    if(!args.ledger||!args['run-id']) throw Error('ledger_and_run_id_required');
    const result=certifyRunLearningForTask29({ledgerText:readText(args.ledger),runId:args['run-id']});
    emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='merge'){
    if(!args.canonical||!args.delta||!args.output) throw Error('canonical_delta_output_required');
    const all=[...parseOperationalLearningLedger(readText(args.canonical)),...parseOperationalLearningLedger(readText(args.delta))];
    const seen=new Set(),merged=[];
    for(const event of all){if(seen.has(event.event_id))continue;seen.add(event.event_id);merged.push(event);}
    writeText(args.output,canonicalLedgerText(merged));
    emit({result:'PASS',events:merged.length,output:path.resolve(args.output)});
  }else{
    throw Error('expected_validate_render_task29_or_merge');
  }
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
