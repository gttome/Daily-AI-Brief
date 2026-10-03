import {createHash} from 'node:crypto';
import {validateImageExecutionReceipt} from './image-execution.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const safe=p=>typeof p==='string' && /^(?:_records|briefs\/images)\//.test(p) && !p.split('/').some(x=>!x||x==='..'||x==='.') && !p.includes('\\');
const dimensionsText=x=>typeof x==='string'&&/^\d+x\d+$/.test(x);

export function pngDimensions(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.subarray(12,16).toString('ascii')!=='IHDR')throw Error('valid_png_ihdr_required');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(!width||!height)throw Error('valid_png_dimensions_required');
  return width+'x'+height;
}
function scheduleStart(schedule){
  const m=typeof schedule==='string'&&schedule.match(/(?:^|\n)DTSTART:(\d{8}T\d{6}Z)(?:\n|$)/);
  if(!m)return NaN;
  const x=m[1];return Date.parse(x.slice(0,4)+'-'+x.slice(4,6)+'-'+x.slice(6,8)+'T'+x.slice(9,11)+':'+x.slice(11,13)+':'+x.slice(13,15)+'Z');
}
export function verifyQualificationScheduler(report,{hostId,readCommitted}={}){
  if(report.scheduler?.kind!=='chatgpt_automation')
    return Number.isInteger(report.workflow_run_id)&&report.workflow_run_id>0 ? [] : ['scheduled_workflow_evidence_required'];
  try {
    const s=report.scheduler;
    if(!/^[a-f0-9]{32}$/.test(s.automation_id||'')||hostId!=='chatgpt-automation:'+s.automation_id||!safe(s.observation_path)||!/^[a-f0-9]{64}$/.test(s.observation_sha256||''))throw Error('scheduled_task_binding_required');
    const bytes=readCommitted(s.observation_path,report.commit_sha);
    if(sha(bytes)!==s.observation_sha256)throw Error('scheduler_observation_digest_mismatch');
    const observed=JSON.parse(bytes),task=observed.automations?.find(x=>x.id===s.automation_id);
    const started=Date.parse(s.started_at),seen=Date.parse(observed.observed_at);
    if(observed.source!=='automations.peek'||!task||!task.conversation_id||!Number.isFinite(started)||!Number.isFinite(seen)||seen<started)throw Error('actual_scheduled_invocation_observation_required');
    if(task.is_enabled===true&&Date.parse(task.last_run_time)===started){
      if(s.schedule!=null||s.conversation_id!=null){
        if(s.conversation_id!==task.conversation_id||s.schedule!==task.schedule)throw Error('scheduled_task_identity_mismatch');
        if(!/RRULE:/.test(task.schedule||'')){
          const dtstart=scheduleStart(task.schedule),max=Number.isInteger(s.max_start_delay_seconds)?s.max_start_delay_seconds:1800;
          if(!Number.isFinite(dtstart)||started<dtstart||started-dtstart>max*1000)throw Error('active_one_time_scheduler_timing_required');
        }
      }
      return [];
    }
    if(s.completed_one_time!==true||task.is_enabled!==false||/RRULE:/.test(task.schedule||'')||s.conversation_id!==task.conversation_id||s.schedule!==task.schedule)throw Error('completed_one_time_scheduler_identity_required');
    const dtstart=scheduleStart(task.schedule),last=Date.parse(task.last_run_time),max=Number.isInteger(s.max_start_delay_seconds)?s.max_start_delay_seconds:1800;
    if(!Number.isFinite(dtstart)||!Number.isFinite(last)||last!==started||seen<last||last<dtstart||last-dtstart>max*1000)throw Error('completed_one_time_scheduler_timing_required');
    return [];
  }catch(error){return [error.message];}
}

export function verifyImageMetadataCorrection(correction,{recovery,receiptBytes,rawBytes}={}){
  const errors=[],add=(ok,code)=>{if(!ok)errors.push(code);};let receipt,actual;
  try{receipt=JSON.parse(receiptBytes);actual=pngDimensions(rawBytes);}catch(error){return [error.message];}
  const source=recovery?.source_attempt_receipt||{},original=recovery?.original||{},bound=correction?.immutable_receipt||{},asset=correction?.original||{};
  add(correction?.schema_version==='image-attempt-metadata-correction-v1','metadata_correction_schema_required');
  add(correction?.append_only===true&&correction.receipt_unchanged===true&&correction.png_unchanged===true,'metadata_correction_must_be_append_only');
  add(correction?.reason==='IMMUTABLE_RECEIPT_RAW_DIMENSIONS_METADATA_ERROR','metadata_correction_reason_invalid');
  add(correction?.candidate_id===recovery?.candidate_id&&correction?.attempt===recovery?.attempt,'metadata_correction_candidate_binding_mismatch');
  add(bound.source_path===source.path&&safe(bound.source_path)&&safe(bound.qualification_copy_path),'metadata_correction_receipt_path_mismatch');
  add(/^[a-f0-9]{40}$/.test(bound.git_blob_sha||'')&&blob(receiptBytes)===bound.git_blob_sha,'metadata_correction_receipt_blob_mismatch');
  add(receipt.candidate_id===correction?.candidate_id&&receipt.attempt===correction?.attempt&&receipt.accepted_locked===true,'metadata_correction_receipt_identity_mismatch');
  add(asset.path===original.qualification_path&&asset.bytes===rawBytes.length&&asset.sha256===sha(rawBytes)&&asset.git_blob_sha===blob(rawBytes),'metadata_correction_original_identity_mismatch');
  add(asset.bytes===original.bytes&&asset.sha256===original.sha256&&asset.git_blob_sha===original.git_blob_sha,'metadata_correction_recovery_identity_mismatch');
  add(dimensionsText(correction?.recorded_dimensions)&&correction.recorded_dimensions===receipt.generation?.exact_returned_png?.dimensions&&correction.recorded_dimensions===original.receipt_dimensions,'metadata_correction_recorded_dimensions_mismatch');
  add(dimensionsText(correction?.actual_dimensions)&&correction.actual_dimensions===actual&&correction.actual_dimensions===original.actual_dimensions,'metadata_correction_actual_dimensions_mismatch');
  add(correction?.recorded_dimensions!==correction?.actual_dimensions,'metadata_correction_must_correct_a_difference');
  add(correction?.inspection?.method==='png_ihdr_uint32_be'&&correction.inspection.png_signature_hex==='89504e470d0a1a0a'&&correction.inspection.ihdr_chunk_type==='IHDR','metadata_correction_inspection_method_invalid');
  return [...new Set(errors)];
}

function verifyRecoveredProductionQualification(report,{hostId,readCommitted}={}){
  const errors=[],add=(ok,code)=>{if(!ok)errors.push(code);};
  add(Boolean(hostId)&&report?.host_id===hostId,'registered_unattended_host_required');
  add(report?.schema_version==='unattended-image-qualification-v1','qualification_schema_required');
  add(report?.evidence_type==='live'&&report.trigger==='scheduled'&&report.execution_mode==='recovery_only','live_recovery_qualification_required');
  add(/^[a-f0-9]{40}$/.test(report?.commit_sha||''),'qualification_commit_required');
  add(Array.isArray(report?.owner_interventions)&&report.owner_interventions.length===0,'qualification_must_be_unattended');
  add(Array.isArray(report?.images)&&report.images.length===6,'six_image_evidence_required');
  add(report?.policy?.work_used===false&&report.policy.codex_used===false&&report.policy.paid_api_used===false&&report.policy.alternate_or_new_credentials_used===false&&report.policy.billing_observed===false,'qualification_cost_policy_evidence_required');
  if(errors.length)return {result:'BLOCKED',errors};
  errors.push(...verifyQualificationScheduler(report,{hostId,readCommitted}));
  const candidates=new Set(),finalHashes=new Set();
  for(const item of report.images){
    try{
      if(!safe(item.recovery_path))throw Error('unsafe_recovery_record_path');
      const recovery=JSON.parse(readCommitted(item.recovery_path,report.commit_sha)),original=recovery.original||{},final=recovery.final||{};
      if(!safe(original.qualification_path)||!safe(final.qualification_path))throw Error('unsafe_recovered_asset_path');
      const raw=readCommitted(original.qualification_path,report.commit_sha),saved=readCommitted(final.qualification_path,report.commit_sha);
      if(!Buffer.isBuffer(raw)||!Buffer.isBuffer(saved))throw Error('actual_recovered_bytes_required');
      add(raw.length===original.bytes&&sha(raw)===original.sha256&&blob(raw)===original.git_blob_sha,'raw_recovery_identity_mismatch');
      add(saved.length===final.bytes&&sha(saved)===final.sha256&&blob(saved)===final.git_blob_sha,'final_recovery_identity_mismatch');
      const rawDimensions=pngDimensions(raw),finalDimensions=pngDimensions(saved);
      add(rawDimensions===original.actual_dimensions,'raw_png_header_dimensions_mismatch');
      add(finalDimensions==='1200x630'&&final.dimensions==='1200x630','final_png_dimensions_mismatch');
      add(recovery.native_result_association?.status==='genuine_prior_native_result_accessible','genuine_native_result_association_required');
      add(recovery.saved_git_review?.existing_review_remains_bound===true&&recovery.saved_git_review?.evidence?.saved_git_asset_reviewed===true,'saved_git_review_binding_required');
      add(recovery.owner_quality_confirmation?.remains_bound===true,'owner_quality_confirmation_binding_required');
      if(original.receipt_dimensions!==rawDimensions){
        if(!safe(item.metadata_correction_path))errors.push('metadata_correction_required');
        else{
          const correction=JSON.parse(readCommitted(item.metadata_correction_path,report.commit_sha));
          if(!safe(correction.immutable_receipt?.qualification_copy_path))errors.push('metadata_correction_receipt_copy_required');
          else errors.push(...verifyImageMetadataCorrection(correction,{recovery,receiptBytes:readCommitted(correction.immutable_receipt.qualification_copy_path,report.commit_sha),rawBytes:raw}));
        }
      }else add(item.metadata_correction_path==null,'unexpected_metadata_correction');
      candidates.add(recovery.candidate_id);finalHashes.add(sha(saved));
    }catch(error){errors.push(error.message);}
  }
  add(candidates.size===6&&finalHashes.size===6,'six_distinct_story_images_required');
  add(report.recovery?.generation_calls===0&&report.recovery?.edit_calls===0&&report.recovery?.normalization_calls===0&&report.recovery?.raw_files===6&&report.recovery?.final_files===6,'no_regeneration_recovery_evidence_required');
  add(report.owner_quality_confirmation?.remains_bound===true,'qualification_owner_confirmation_required');
  return {result:errors.length?'BLOCKED':'PASS',errors:[...new Set(errors)],recovered_file_count:errors.length?null:12,scope:'Exact committed recovery artifacts, exact-bound metadata corrections, saved-Git reviews, and scheduled-host evidence; no billing inference or pixel judgment is manufactured.'};
}

export function verifyUnattendedImageQualification(report,{hostId,readCommitted}={}){
  if(report?.execution_mode==='recovery_only')return verifyRecoveredProductionQualification(report,{hostId,readCommitted});
  const errors=[],add=(ok,code)=>{if(!ok)errors.push(code);};
  add(Boolean(hostId)&&report?.host_id===hostId,'registered_unattended_host_required');
  add(report?.schema_version==='unattended-image-qualification-v1','qualification_schema_required');
  add(report?.evidence_type==='live'&&report.trigger==='scheduled'&&report.execution_mode==='qualification_nonproduction','live_unattended_qualification_required');
  add(/^[a-f0-9]{40}$/.test(report?.commit_sha||''),'qualification_commit_required');
  add(Array.isArray(report?.owner_interventions)&&report.owner_interventions.length===0,'qualification_must_be_unattended');
  add(Array.isArray(report?.images)&&report.images.length===6,'six_image_evidence_required');
  if(errors.length)return {result:'BLOCKED',errors};
  errors.push(...verifyQualificationScheduler(report,{hostId,readCommitted}));
  if(errors.length)return {result:'BLOCKED',errors};
  const candidates=new Set(),hashes=new Set();
  for(const item of report.images){
    try{
      if(!safe(item.execution_path)||!safe(item.receipt_path))throw Error('unsafe_qualification_path');
      const execution=JSON.parse(readCommitted(item.execution_path,report.commit_sha)),receipt=JSON.parse(readCommitted(item.receipt_path,report.commit_sha));
      if(!safe(receipt.persistence?.path)||!safe(receipt.generation?.raw_capture?.path))throw Error('unsafe_asset_path');
      const raw=readCommitted(receipt.generation.raw_capture.path,report.commit_sha),final=readCommitted(receipt.persistence.path,report.commit_sha);
      if(!Buffer.isBuffer(raw)||!Buffer.isBuffer(final))throw Error('actual_recovered_bytes_required');
      errors.push(...validateImageExecutionReceipt(receipt,execution,{assetSha256:sha(final),gitBlobSha:blob(final)}));
      add(receipt.trigger==='scheduled'&&receipt.execution_mode==='qualification_nonproduction','interactive_or_production_receipt_not_trial');
      add(receipt.review?.visual_inspection?.reviewer_kind==='assistant_visual_inspection','automated_saved_pixel_review_required');
      add(sha(raw)===receipt.generation.raw_sha256&&blob(raw)===receipt.generation.raw_capture.git_blob_sha,'raw_recovery_identity_mismatch');
      candidates.add(receipt.candidate_id);hashes.add(sha(final));
    }catch(error){errors.push(error.message);}
  }
  add(candidates.size===6&&hashes.size===6,'six_distinct_story_images_required');
  add(report.recovery?.generation_calls===0&&report.recovery?.raw_files===6&&report.recovery?.final_files===6,'no_regeneration_recovery_evidence_required');
  return {result:errors.length?'BLOCKED':'PASS',errors:[...new Set(errors)],recovered_file_count:errors.length?null:12,scope:'Committed artifacts and trusted host receipts; no independent billing attestation or pixel judgment is manufactured.'};
}
