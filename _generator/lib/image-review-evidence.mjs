/** Editorial judgments must come from an actual saved-image inspection, never the renderer. */
export const VISUAL_CRITERIA = Object.freeze(['subject_match','mechanism_detail','legible_labels','contrast','composition','no_people','no_overlap']);
export function visualReviewErrors(review, hash) {
  const errors=[];
  if (!review || review.method!=='saved_image_visual_inspection' || !['assistant_visual_inspection','human_visual_inspection'].includes(review.reviewer_kind)) errors.push('actual_visual_inspection_required');
  if (review?.asset_sha256!==hash) errors.push('visual_review_hash_mismatch');
  if (!review?.inspection_reference || !review?.reviewer_id || !Number.isFinite(Date.parse(review?.reviewed_at))) errors.push('visual_review_identity_and_time_required');
  for (const key of VISUAL_CRITERIA) {
    const item=review?.criteria?.[key];
    if (!['pass','fail'].includes(item?.verdict) || typeof item?.observation!=='string' || item.observation.trim().length<12) errors.push('visual_observation_required:'+key);
  }
  return errors;
}
export function visualReviewAccepted(review, hash) {
  return !visualReviewErrors(review,hash).length && VISUAL_CRITERIA.every(k=>review.criteria[k].verdict==='pass');
}
