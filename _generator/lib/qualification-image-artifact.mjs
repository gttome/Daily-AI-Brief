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
