#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyUnattendedImageQualification} from '../_generator/lib/unattended-image-qualification.mjs';
import {validateRunReadiness, deriveImageHostAdmission, staleActiveDecision, terminalCleanupReceipt, buildPromotionReview} from '../_generator/lib/run-readiness.mjs';

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
    const value=read(input);
    const hostProofErrors=[];
    let qualificationVerified=false,consumerObservationVerified=false;
    if(value.run_number>=5) {
      try {
        const registration=read('docs/operations/unattended-image-host.json');
        if(!registration.host_id || registration.status!=='READY') throw Error('NO_SUPPORTED_UNATTENDED_NATIVE_IMAGE_HOST');
        const receiptPath=registration.qualification_receipt_path;
        if(!/^_records\/[\w/.-]+\.json$/.test(receiptPath||'')||receiptPath.includes('..')) throw Error('registered_qualification_receipt_required');
        const bytes=fs.readFileSync(receiptPath);
        const proof=verifyUnattendedImageQualification(JSON.parse(bytes),{
          hostId:registration.qualification_host_id||registration.host_id,
          readCommitted:(file,commit)=>execFileSync('git',['show',commit+':'+file],{maxBuffer:32*1024*1024})
        });
        hostProofErrors.push(...proof.errors);
        qualificationVerified=proof.result==='PASS'&&proof.errors.length===0;

        const consumer=registration.reusable_consumer||{};
        if(consumer.scheduler_kind!=='chatgpt_automation'||!/^[a-f0-9]{32}$/.test(consumer.automation_id||'')||
            consumer.enabled!==true||consumer.role!=='scheduled_native_image_request_consumer'||
            consumer.current_fence_refresh_required!==true||consumer.explicit_supervisor_handoff_required!==true)
          throw Error('enabled_reusable_scheduled_consumer_required');
        if(!/^_records\/[\w/.-]+\.json$/.test(consumer.observation_path||'')||consumer.observation_path.includes('..'))
          throw Error('reusable_consumer_observation_required');
        const observationBytes=fs.readFileSync(consumer.observation_path);
        if(createHash('sha256').update(observationBytes).digest('hex')!==consumer.observation_sha256)
          throw Error('reusable_consumer_observation_digest_mismatch');
        const observation=JSON.parse(observationBytes),task=observation.automations?.find(x=>x.id===consumer.automation_id);
        if(observation.source!=='automations.peek'||!task||task.is_enabled!==true||task.id!==consumer.automation_id||
            task.title!==consumer.title||task.schedule!==consumer.schedule||!/RRULE:FREQ=HOURLY/.test(task.schedule||''))
          throw Error('reusable_consumer_live_binding_invalid');
        consumerObservationVerified=true;
        value.image_pipeline={...(value.image_pipeline||{}),host_admission:deriveImageHostAdmission({
          registration,qualification_verified:qualificationVerified,consumer_observation_verified:consumerObservationVerified
        })};
      } catch(error) {
        hostProofErrors.push(error.message);
        let registration={};
        try{registration=read('docs/operations/unattended-image-host.json');}catch{}
        value.image_pipeline={...(value.image_pipeline||{}),host_admission:deriveImageHostAdmission({
          registration,qualification_verified:qualificationVerified,consumer_observation_verified:consumerObservationVerified
        })};
      }
    }
    const result=validateRunReadiness(value);
    if(value.run_number>=5) {
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
