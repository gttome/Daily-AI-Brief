import {EXPECTED_FOCUS_ORDER} from './constants.mjs';

export const SCORE_DIMENSIONS = ['significance', 'freshness', 'authority', 'evidence_quality', 'novelty', 'practical_value', 'category_fit'];

export function scoreTotal(score) {
  return SCORE_DIMENSIONS.reduce((sum, key) => sum + score[key], 0);
}

export function validateCandidatePool(pool) {
  const errors = [];
  if (!Array.isArray(pool.candidates) || pool.candidates.length < 20 || pool.candidates.length > 30) errors.push('candidate pool must contain 20-30 candidates');
  const ids = new Set();
  const selected = [];
  for (const [index, candidate] of (pool.candidates || []).entries()) {
    const label = `candidates[${index}]`;
    if (!candidate.candidate_id || ids.has(candidate.candidate_id)) errors.push(`${label}.candidate_id must be present and unique`);
    ids.add(candidate.candidate_id);
    for (const key of SCORE_DIMENSIONS) if (!Number.isInteger(candidate.score?.[key]) || candidate.score[key] < 0 || candidate.score[key] > 5) errors.push(`${label}.score.${key} must be an integer 0-5`);
    if (candidate.score && scoreTotal(candidate.score) !== candidate.score.total) errors.push(`${label}.score.total is incorrect`);
    if (!candidate.score?.rationale?.trim()) errors.push(`${label}.score.rationale is required`);
    if (!candidate.source?.normalized_url) errors.push(`${label}.source.normalized_url is required`);
    if (!candidate.source?.evidence_type || !candidate.source?.availability_status) errors.push(`${label}.source evidence and availability classifications are required`);
    if (candidate.selected) {
      selected.push(candidate);
      if (!candidate.selection_rationale?.trim()) errors.push(`${label}.selection_rationale is required for selected candidates`);
      const matches = candidate.novelty_check?.matches || [];
      if (matches.length && candidate.novelty_check.disposition === 'new') errors.push(`${label} has a novelty match but disposition is new`);
      if (matches.length && (!candidate.novelty_check?.prior_story_ids?.length || !candidate.novelty_check?.what_changed?.trim())) errors.push(`${label} repeated coverage requires prior_story_ids and what_changed`);
    } else if (!candidate.rejection_reason?.trim()) errors.push(`${label}.rejection_reason is required when not selected`);
  }
  if (selected.length !== 6) errors.push('candidate pool must select exactly six stories');
  const order = selected.sort((a, b) => a.selected_ordinal - b.selected_ordinal).map(item => item.focus);
  if (JSON.stringify(order) !== JSON.stringify(EXPECTED_FOCUS_ORDER)) errors.push('selected candidates must satisfy ordered 2/2/2 allocation');
  return errors;
}

export function rankCandidates(candidates) {
  return [...candidates].sort((a, b) => b.score.total - a.score.total || a.candidate_id.localeCompare(b.candidate_id)).map((candidate, index) => ({...candidate, overall_rank: index + 1}));
}
