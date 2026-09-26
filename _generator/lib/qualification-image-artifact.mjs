import {createHash} from 'node:crypto';

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


export function buildQualificationImageSubjectLock(packet){
  if(!packet||typeof packet!=='object')throw new Error('sealed_story_packet_required');
  for(const field of ['story_id','candidate_id','headline','source_url','packet_sha256']){
    if(!packet[field])throw new Error(`missing_${field}`);
  }
  if(!/^[a-f0-9]{64}$/.test(packet.packet_sha256))throw new Error('packet_sha256_invalid');
  const canonical=JSON.stringify({
    story_id:packet.story_id,
    candidate_id:packet.candidate_id,
    headline:packet.headline,
    source_url:packet.source_url,
    packet_sha256:packet.packet_sha256
  });
  const subject_lock_sha256=createHash('sha256').update(canonical).digest('hex');
  return {
    story_id:packet.story_id,
    candidate_id:packet.candidate_id,
    packet_sha256:packet.packet_sha256,
    target_headline:packet.headline,
    target_source_url:packet.source_url,
    subject_lock_sha256,
    generation_instruction:[
      `TARGET CANDIDATE: ${packet.candidate_id}`,
      `ONLY SUBJECT: ${packet.headline}`,
      `SOURCE: ${packet.source_url}`,
      'Render only this target subject. Do not substitute a different story, product, workflow, or topic.',
      'If the target cannot be rendered faithfully, return no image.'
    ].join('\n'),
    generation_subject_binding:true,
    alternate_subjects_allowed:false,
    created_before_generation:true
  };
}

export function validateQualificationImageSubjectLock(lock,{storyId=null,candidateId=null,headline=null,sourceUrl=null,packetSha256=null}={}){
  const errors=[];
  if(!lock||typeof lock!=='object')return ['image_subject_lock_required'];
  for(const field of ['story_id','candidate_id','packet_sha256','target_headline','target_source_url','subject_lock_sha256','generation_instruction']){
    if(lock[field]===undefined||lock[field]===null||lock[field]==='')errors.push(`missing_${field}`);
  }
  if(storyId&&lock.story_id!==storyId)errors.push('subject_lock_story_id_mismatch');
  if(candidateId&&lock.candidate_id!==candidateId)errors.push('subject_lock_candidate_id_mismatch');
  if(headline&&lock.target_headline!==headline)errors.push('subject_lock_headline_mismatch');
  if(sourceUrl&&lock.target_source_url!==sourceUrl)errors.push('subject_lock_source_url_mismatch');
  if(packetSha256&&lock.packet_sha256!==packetSha256)errors.push('subject_lock_packet_sha256_mismatch');
  if(!/^[a-f0-9]{64}$/.test(lock.packet_sha256||''))errors.push('subject_lock_packet_sha256_invalid');
  if(!/^[a-f0-9]{64}$/.test(lock.subject_lock_sha256||''))errors.push('subject_lock_sha256_invalid');
  if(lock.generation_subject_binding!==true)errors.push('generation_subject_binding_required');
  if(lock.alternate_subjects_allowed!==false)errors.push('alternate_subjects_must_be_false');
  if(lock.created_before_generation!==true)errors.push('subject_lock_must_precede_generation');
  if(typeof lock.generation_instruction==='string'){
    if(!lock.generation_instruction.includes(`TARGET CANDIDATE: ${lock.candidate_id}`))errors.push('generation_instruction_candidate_binding_missing');
    if(!lock.generation_instruction.includes(`ONLY SUBJECT: ${lock.target_headline}`))errors.push('generation_instruction_headline_binding_missing');
    if(!lock.generation_instruction.includes(`SOURCE: ${lock.target_source_url}`))errors.push('generation_instruction_source_binding_missing');
  }
  return [...new Set(errors)];
}
