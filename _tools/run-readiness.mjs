#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {validateRunReadiness, staleActiveDecision, terminalCleanupReceipt, buildPromotionReview} from '../_generator/lib/run-readiness.mjs';

const [,,command,...args]=process.argv;
const flag=name=>{
  const i=args.indexOf('--'+name);
  return i>=0?args[i+1]:null;
};
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const emit=x=>process.stdout.write(JSON.stringify(x,null,2)+'\n');

try{
  if(command==='validate'){
    const input=flag('input'); if(!input) throw Error('input_required');
    const result=validateRunReadiness(read(input)); emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='stale-active'){
    const input=flag('input'); if(!input) throw Error('input_required');
    emit(staleActiveDecision(read(input)));
  }else if(command==='cleanup'){
    const input=flag('input'); if(!input) throw Error('input_required');
    const result=terminalCleanupReceipt(read(input)); emit(result); if(result.result!=='PASS') process.exitCode=1;
  }else if(command==='promotion-review'){
    const input=flag('input'); if(!input) throw Error('input_required');
    emit(buildPromotionReview(read(input)));
  }else{
    throw Error('expected_validate_stale-active_cleanup_or_promotion-review');
  }
}catch(error){
  console.error(JSON.stringify({result:'FAIL',error:error.message}));
  process.exitCode=1;
}
