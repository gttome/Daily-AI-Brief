#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyUnattendedImageQualification} from '../_generator/lib/unattended-image-qualification.mjs';
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
    const value=read(input), result=validateRunReadiness(value);
    if(value.run_number>=5) {
      const hostProofErrors=[];
      try {
        const registration=read('docs/operations/unattended-image-host.json');
        if(!registration.host_id || registration.status!=='READY') throw Error('NO_SUPPORTED_UNATTENDED_NATIVE_IMAGE_HOST');
        const ref=value.image_pipeline?.host_admission;
        if(!ref || ref.receipt_path!==registration.qualification_receipt_path || !/^_records\/[\w/.-]+\.json$/.test(ref.receipt_path)||ref.receipt_path.includes('..')) throw Error('registered_qualification_receipt_required');
        const bytes=fs.readFileSync(ref.receipt_path);
        if(createHash('sha256').update(bytes).digest('hex')!==ref.receipt_sha256) throw Error('host_receipt_digest_mismatch');
        const proof=verifyUnattendedImageQualification(JSON.parse(bytes),{hostId:registration.host_id,
          readCommitted:(file,commit)=>execFileSync('git',['show',commit+':'+file],{maxBuffer:32*1024*1024})});
        hostProofErrors.push(...proof.errors);
      } catch(error) {hostProofErrors.push(error.message);}
      result.errors=[...new Set(result.errors)];
      result.deferred_blockers=[...new Set([...(result.deferred_blockers||[]),...hostProofErrors.map(x=>'image_host:'+x)])];
      result.result=result.errors.length?'FAIL':'PASS';
      result.start_authorized=!result.errors.length;
      result.image_tasks_authorized=result.start_authorized && result.image_tasks_authorized===true && hostProofErrors.length===0;
      result.publication_authorized=result.image_tasks_authorized;
      result.start_scope=result.start_authorized ? (result.image_tasks_authorized?'full_production':'non_image_production') : 'blocked';
    }
    emit(result); if(result.result!=='PASS') process.exitCode=1;
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
