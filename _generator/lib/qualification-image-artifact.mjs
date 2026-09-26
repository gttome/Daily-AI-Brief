export const REQUIRED_ARTIFACT_FIELDS=[
  'story_id','candidate_id','library_file_id','file_id','current_version_number',
  'library_path','mime_type','size_bytes'
];

export function validateQualificationImageArtifactHandoff(receipt,{storyId=null,candidateId=null}={}){
  const errors=[];
  if(!receipt||typeof receipt!=='object')return ['artifact_handoff_receipt_required'];
  for(const field of REQUIRED_ARTIFACT_FIELDS){
    if(receipt[field]===undefined||receipt[field]===null||receipt[field]==='')errors.push(`missing_${field}`);
  }
  if(storyId&&receipt.story_id!==storyId)errors.push('story_id_mismatch');
  if(candidateId&&receipt.candidate_id!==candidateId)errors.push('candidate_id_mismatch');
  if(typeof receipt.library_file_id!=='string'||!/^libfile_/.test(receipt.library_file_id||''))errors.push('durable_library_file_id_required');
  if(typeof receipt.file_id!=='string'||!/^file_/.test(receipt.file_id||''))errors.push('file_id_required');
  if(!Number.isInteger(receipt.current_version_number)||receipt.current_version_number<0)errors.push('current_version_number_invalid');
  if(typeof receipt.library_path!=='string'||!receipt.library_path.startsWith('/Daily AI Brief Qualification Images/'))errors.push('library_path_invalid');
  if(!['image/png','image/webp'].includes(receipt.mime_type))errors.push('mime_type_invalid');
  if(!Number.isInteger(receipt.size_bytes)||receipt.size_bytes<1)errors.push('size_bytes_invalid');
  if(receipt.ephemeral_only===true)errors.push('ephemeral_only_prohibited');
  return [...new Set(errors)];
}

export function validateQualificationImageReviewReceipt(receipt){
  const errors=[];
  if(!receipt||typeof receipt!=='object')return ['image_review_receipt_required'];
  for(const field of ['story_id','candidate_id','library_file_id','sha256','width','height','git_blob_sha']){
    if(receipt[field]===undefined||receipt[field]===null||receipt[field]==='')errors.push(`missing_${field}`);
  }
  if(!/^[a-f0-9]{64}$/.test(receipt.sha256||''))errors.push('sha256_invalid');
  if(!Number.isInteger(receipt.width)||receipt.width<1||!Number.isInteger(receipt.height)||receipt.height<1)errors.push('dimensions_invalid');
  if(receipt.fallback!==false)errors.push('fallback_must_be_false');
  for(const gate of ['subject_identity','factual_support','structural_quality','editorial_quality']){
    if(receipt[gate]!=='pass')errors.push(`${gate}_must_pass`);
  }
  if(receipt.exact_bytes_persisted!==true)errors.push('exact_bytes_not_persisted');
  if(receipt.accepted_locked!==true)errors.push('accepted_locked_required');
  return [...new Set(errors)];
}


export function validateSerializedQualificationImageEvents(events,storyOrder){
  const errors=[];
  if(!Array.isArray(events))return ['image_event_log_required'];
  if(!Array.isArray(storyOrder)||storyOrder.length!==6)return ['six_story_order_required'];
  const state=new Map(storyOrder.map(id=>[id,'not_started']));
  let active=null;
  let nextIndex=0;
  const terminal=new Set(['accepted_locked','rejected_with_attempt_budget_remaining','rejected_terminal_run_fail']);
  for(const [index,event] of events.entries()){
    const story=event?.candidate_id;
    const type=event?.type;
    if(!state.has(story)){errors.push(`event_${index}_unknown_candidate`);continue;}
    if(type==='worker_started'){
      if(active!==null)errors.push(`event_${index}_overlapping_worker`);
      if(storyOrder[nextIndex]!==story)errors.push(`event_${index}_out_of_order_start`);
      active=story;state.set(story,'active');
    }else if(type==='library_captured'){
      if(active!==story)errors.push(`event_${index}_capture_without_active_worker`);
      state.set(story,'captured');
    }else if(type==='worker_exited'){
      if(active!==story)errors.push(`event_${index}_exit_without_active_worker`);
      if(state.get(story)!=='captured')errors.push(`event_${index}_worker_exit_before_durable_capture`);
      active=null;state.set(story,'awaiting_review');
    }else if(type==='review_completed'){
      if(active!==null)errors.push(`event_${index}_review_while_worker_active`);
      if(state.get(story)!=='awaiting_review')errors.push(`event_${index}_review_without_capture`);
      state.set(story,'reviewed');
    }else if(type==='git_persisted'){
      if(state.get(story)!=='reviewed')errors.push(`event_${index}_git_persist_before_review`);
      state.set(story,'git_persisted');
    }else if(type==='story_terminal'){
      if(!terminal.has(event.status))errors.push(`event_${index}_invalid_terminal_status`);
      if(event.status==='accepted_locked'&&state.get(story)!=='git_persisted')errors.push(`event_${index}_accepted_before_exact_git_persist`);
      state.set(story,event.status);
      if(storyOrder[nextIndex]===story)nextIndex+=1;
    }else{
      errors.push(`event_${index}_unknown_type`);
    }
  }
  if(active!==null)errors.push('worker_left_active');
  return [...new Set(errors)];
}


export function validateQualificationImageWorkerContextReceipt(receipt,{storyId=null,candidateId=null,packetSha256=null}={}){
  const errors=[];
  if(!receipt||typeof receipt!=='object')return ['worker_context_receipt_required'];
  for(const field of ['story_id','candidate_id','packet_sha256','fresh_execution_context','generation_instruction_source','visible_context_classes','other_story_context_present','operational_context_present']){
    if(receipt[field]===undefined||receipt[field]===null)errors.push(`missing_${field}`);
  }
  if(storyId&&receipt.story_id!==storyId)errors.push('worker_context_story_id_mismatch');
  if(candidateId&&receipt.candidate_id!==candidateId)errors.push('worker_context_candidate_id_mismatch');
  if(packetSha256&&receipt.packet_sha256!==packetSha256)errors.push('worker_context_packet_sha256_mismatch');
  if(!/^[a-f0-9]{64}$/.test(receipt.packet_sha256||''))errors.push('worker_context_packet_sha256_invalid');
  if(receipt.fresh_execution_context!==true)errors.push('fresh_execution_context_required');
  if(receipt.generation_instruction_source!=='sealed_story_packet_only')errors.push('sealed_story_packet_only_required');
  if(!Array.isArray(receipt.visible_context_classes))errors.push('visible_context_classes_array_required');
  const allowed=new Set(['sealed_story_packet']);
  for(const item of Array.isArray(receipt.visible_context_classes)?receipt.visible_context_classes:[]){
    if(!allowed.has(item))errors.push(`prohibited_visible_context_${item}`);
  }
  if(receipt.other_story_context_present!==false)errors.push('other_story_context_prohibited');
  if(receipt.operational_context_present!==false)errors.push('operational_context_prohibited');
  if(receipt.prior_image_worker_history_present===true)errors.push('prior_image_worker_history_prohibited');
  if(receipt.parent_conversation_history_present===true)errors.push('parent_conversation_history_prohibited');
  if(receipt.reused_execution_context===true)errors.push('reused_execution_context_prohibited');
  if(receipt.context_attested_before_generation!==true)errors.push('context_attestation_must_precede_generation');
  return [...new Set(errors)];
}
