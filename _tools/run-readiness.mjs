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
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBlobSha=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const safeRecordPath=p=>typeof p==='string' && /^_records\/[\w/.-]+\.json$/.test(p) && !p.includes('..');

function verifyProtectedQualificationRegistration(registration,bytes){
  const errors=[];
  const add=(ok,code)=>{if(!ok)errors.push(code);};
  let receipt=null;
  try{receipt=JSON.parse(bytes);}catch{return {result:'BLOCKED',errors:['registered_qualification_receipt_json_required']};}
  add(/^[a-f0-9]{40}$/.test(registration.qualification_receipt_blob_sha||'') &&
    gitBlobSha(bytes)===registration.qualification_receipt_blob_sha,'registered_qualification_receipt_blob_mismatch');
  add(receipt.schema_version==='unattended-image-qualification-v1','registered_qualification_schema_required');
  add(receipt.result==='PASS','registered_qualification_pass_required');
  add(receipt.host_id===(registration.qualification_host_id||registration.host_id),'registered_qualification_host_mismatch');
  add(receipt.evidence_type==='live'&&receipt.trigger==='scheduled'&&receipt.execution_mode==='recovery_only','registered_live_recovery_qualification_required');
  add(receipt.qualification_source_commit===registration.qualification_source_commit &&
    /^[a-f0-9]{40}$/.test(receipt.qualification_source_commit||''),'registered_qualification_source_mismatch');
  add(receipt.immutable_twelve_file_checkpoint===registration.immutable_twelve_file_checkpoint &&
    /^[a-f0-9]{40}$/.test(receipt.immutable_twelve_file_checkpoint||''),'registered_qualification_checkpoint_mismatch');
  add(receipt.recovery?.generation_calls===0&&receipt.recovery?.edit_calls===0&&receipt.recovery?.normalization_calls===0&&
    receipt.recovery?.raw_files===6&&receipt.recovery?.final_files===6&&receipt.recovery?.recovered_file_count===12&&
    receipt.recovery?.files_reread_from_immutable_checkpoint===true&&receipt.recovery?.exact_identity_verified===true,
    'registered_qualification_recovery_identity_required');
  add(receipt.quality?.saved_git_reviews_bound===6&&receipt.quality?.owner_quality_confirmation_bound===true&&
    receipt.quality?.accepted_locked_finals_unchanged===true,'registered_qualification_quality_binding_required');
  add(receipt.policy?.work_used===false&&receipt.policy?.codex_used===false&&receipt.policy?.paid_api_used===false&&
    receipt.policy?.alternate_or_new_credentials_used===false&&receipt.policy?.billing_observed===false&&
    receipt.policy?.billing_inference_used===false,'registered_qualification_cost_policy_required');
  add(receipt.verifier?.result==='PASS'&&Array.isArray(receipt.verifier?.errors)&&receipt.verifier.errors.length===0&&
    receipt.verifier?.recovered_file_count===12,'registered_qualification_verifier_pass_required');
  add(receipt.authorization_effect?.host_registration_eligible===true,'registered_qualification_host_eligibility_required');
  const scheduler=receipt.scheduler||{};
  add(scheduler.source==='automations.peek'&&/^[a-f0-9]{32}$/.test(scheduler.automation_id||'')&&
    receipt.host_id==='chatgpt-automation:'+scheduler.automation_id&&scheduler.completed_one_time===true&&
    scheduler.is_enabled===false&&scheduler.identity_match===true&&scheduler.observation_after_last_run===true&&
    scheduler.bounded_dtstart_to_last_run===true&&safeRecordPath(scheduler.observation_path)&&
    /^[a-f0-9]{64}$/.test(scheduler.observation_sha256||''),'registered_qualification_scheduler_summary_required');
  if(errors.length===0){
    try{
      const observationBytes=execFileSync('git',['show',receipt.qualification_source_commit+':'+scheduler.observation_path],{maxBuffer:32*1024*1024});
      add(sha256(observationBytes)===scheduler.observation_sha256,'registered_qualification_scheduler_observation_digest_mismatch');
      const observation=JSON.parse(observationBytes),task=observation.automations?.find(x=>x.id===scheduler.automation_id);
      add(observation.source==='automations.peek'&&task&&task.is_enabled===false&&task.id===scheduler.automation_id&&
        task.conversation_id===scheduler.conversation_id&&task.schedule===scheduler.schedule&&
        task.last_run_time===scheduler.last_run_time,'registered_qualification_scheduler_observation_mismatch');
    }catch(error){errors.push('registered_qualification_scheduler_observation_unreadable:'+error.message);}
  }
  return {result:errors.length?'BLOCKED':'PASS',errors:[...new Set(errors)]};
}

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
        const parsedReceipt=JSON.parse(bytes);
        const proof=parsedReceipt?.verifier?.result==='PASS' && parsedReceipt?.immutable_twelve_file_checkpoint
          ? verifyProtectedQualificationRegistration(registration,bytes)
          : verifyUnattendedImageQualification(parsedReceipt,{
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
