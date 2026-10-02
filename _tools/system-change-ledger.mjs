#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  parseSystemChangeLedger,canonicalSystemChangeLedgerText,validateSystemChangeLedgerReadiness,
  changesSinceKnownGood,certifyRunSystemChangesForTask29,renderSystemChangeMarkdown
} from '../_generator/lib/system-change-ledger.mjs';

const argv=process.argv.slice(2), command=argv.shift(), args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--')) continue;
  const key=argv[i].slice(2), next=argv[i+1];
  if(next!==undefined && !next.startsWith('--')) {args[key]=next;i++;} else args[key]=true;
}
const readText=p=>fs.readFileSync(path.resolve(p),'utf8');
const writeText=(p,v)=>{const f=path.resolve(p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v);};
const emit=x=>process.stdout.write(JSON.stringify(x,null,2)+'\n');

try{
  if(command==='validate'){
    if(!args.ledger) throw Error('ledger_required');
    const result=validateSystemChangeLedgerReadiness({ledgerText:readText(args.ledger)});
    emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='render'){
    if(!args.ledger||!args.output) throw Error('ledger_and_output_required');
    writeText(args.output,renderSystemChangeMarkdown(readText(args.ledger)));
    emit({result:'PASS',output:path.resolve(args.output)});
  }else if(command==='since'){
    if(!args.ledger||!args['baseline-sha']) throw Error('ledger_and_baseline_sha_required');
    const root=path.resolve(args['repo-root']||'.'), head=args['head-sha']||'HEAD';
    const log=execFileSync('git',['-C',root,'log','--format=%H%x09%s',args['baseline-sha']+'..'+head],{encoding:'utf8'});
    const shas=[], prs=[];
    for(const line of log.trim().split('\n').filter(Boolean)){
      const [sha,...rest]=line.split('\t'); shas.push(sha);
      const m=rest.join('\t').match(/\(#(\d+)\)/); if(m) prs.push(Number(m[1]));
    }
    emit(changesSinceKnownGood(readText(args.ledger),{commit_shas:shas,pr_numbers:prs}));
  }else if(command==='task29'){
    if(!args.ledger||!args['run-id']) throw Error('ledger_and_run_id_required');
    const result=certifyRunSystemChangesForTask29({ledgerText:readText(args.ledger),runId:args['run-id']});
    emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='merge'){
    if(!args.canonical||!args.delta||!args.output) throw Error('canonical_delta_output_required');
    const all=[...parseSystemChangeLedger(readText(args.canonical)),...parseSystemChangeLedger(readText(args.delta))];
    const seen=new Set(), merged=[];
    for(const event of all){if(seen.has(event.event_id))continue;seen.add(event.event_id);merged.push(event);}
    writeText(args.output,canonicalSystemChangeLedgerText(merged));
    emit({result:'PASS',events:merged.length,output:path.resolve(args.output)});
  }else throw Error('expected_validate_render_since_task29_or_merge');
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
