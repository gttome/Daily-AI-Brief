import {createHash} from 'node:crypto';
import {validateImageExecutionReceipt} from './image-execution.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const safe=p=>typeof p==='string' && /^(?:_records|briefs\/images)\//.test(p) && !p.split('/').some(x=>!x||x==='..'||x==='.') && !p.includes('\\');

// A scheduled ChatGPT task is not a GitHub Actions job. Preserve its actual
// scheduler observation instead of inventing a numeric workflow run identifier.
export function verifyQualificationScheduler(report,{hostId,readCommitted}={}) {
  if(report.scheduler?.kind!=='chatgpt_automation')
    return Number.isInteger(report.workflow_run_id)&&report.workflow_run_id>0 ? [] : ['scheduled_workflow_evidence_required'];
  try {
    const s=report.scheduler;
    if(!/^[a-f0-9]{32}$/.test(s.automation_id||'') || hostId!=='chatgpt-automation:'+s.automation_id ||
      !safe(s.observation_path) || !/^[a-f0-9]{64}$/.test(s.observation_sha256||'')) throw Error('scheduled_task_binding_required');
    const bytes=readCommitted(s.observation_path,report.commit_sha);
    if(sha(bytes)!==s.observation_sha256) throw Error('scheduler_observation_digest_mismatch');
    const observed=JSON.parse(bytes), task=observed.automations?.find(x=>x.id===s.automation_id);
    const start=Date.parse(s.started_at),seen=Date.parse(observed.observed_at);
    if(observed.source!=='automations.peek' || !task || task.is_enabled!==true ||
      !task.conversation_id || !Number.isFinite(start) || !Number.isFinite(seen) || seen<start ||
      Date.parse(task.last_run_time)!==start) throw Error('actual_scheduled_invocation_observation_required');
    return [];
  } catch(error) {return [error.message];}
}

// Trusted runtime evidence still has to come from a registered real host. This
// verifier checks the committed bytes and receipts; it cannot invent that host.
export function verifyUnattendedImageQualification(report,{hostId,readCommitted}={}) {
  const errors=[],add=(ok,code)=>{if(!ok)errors.push(code);};
  add(Boolean(hostId) && report?.host_id===hostId,'registered_unattended_host_required');
  add(report?.schema_version==='unattended-image-qualification-v1','qualification_schema_required');
  add(report?.evidence_type==='live' && report.trigger==='scheduled' && report.execution_mode==='qualification_nonproduction','live_unattended_qualification_required');
  add(/^[a-f0-9]{40}$/.test(report?.commit_sha||''),'qualification_commit_required');
  add(Array.isArray(report?.owner_interventions)&&report.owner_interventions.length===0,'qualification_must_be_unattended');
  add(Array.isArray(report?.images)&&report.images.length===6,'six_image_evidence_required');
  if(errors.length) return {result:'BLOCKED',errors};
  errors.push(...verifyQualificationScheduler(report,{hostId,readCommitted}));
  if(errors.length) return {result:'BLOCKED',errors};
  const candidates=new Set(),hashes=new Set();
  for(const item of report.images) {
    try {
      if(!safe(item.execution_path)||!safe(item.receipt_path)) throw Error('unsafe_qualification_path');
      const execution=JSON.parse(readCommitted(item.execution_path,report.commit_sha));
      const receipt=JSON.parse(readCommitted(item.receipt_path,report.commit_sha));
      if(!safe(receipt.persistence?.path)||!safe(receipt.generation?.raw_capture?.path)) throw Error('unsafe_asset_path');
      const raw=readCommitted(receipt.generation.raw_capture.path,report.commit_sha);
      const final=readCommitted(receipt.persistence.path,report.commit_sha);
      if(!Buffer.isBuffer(raw)||!Buffer.isBuffer(final)) throw Error('actual_recovered_bytes_required');
      errors.push(...validateImageExecutionReceipt(receipt,execution,{assetSha256:sha(final),gitBlobSha:blob(final)}));
      add(receipt.trigger==='scheduled'&&receipt.execution_mode==='qualification_nonproduction','interactive_or_production_receipt_not_trial');
      add(receipt.review?.visual_inspection?.reviewer_kind==='assistant_visual_inspection','automated_saved_pixel_review_required');
      add(sha(raw)===receipt.generation.raw_sha256 && blob(raw)===receipt.generation.raw_capture.git_blob_sha,'raw_recovery_identity_mismatch');
      candidates.add(receipt.candidate_id);hashes.add(sha(final));
    } catch(error) {errors.push(error.message);}
  }
  add(candidates.size===6&&hashes.size===6,'six_distinct_story_images_required');
  add(report.recovery?.generation_calls===0 && report.recovery?.raw_files===6 && report.recovery?.final_files===6,'no_regeneration_recovery_evidence_required');
  return {result:errors.length?'BLOCKED':'PASS',errors:[...new Set(errors)],recovered_file_count:errors.length?null:12,
    scope:'Committed artifacts and trusted host receipts; no independent billing attestation or pixel judgment is manufactured.'};
}
