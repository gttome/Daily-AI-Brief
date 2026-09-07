export function jaccard(left, right) {
  const a = new Set(left || []);
  const b = new Set(right || []);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / union.size;
}

export function noveltyMatches(candidate, priorStories, {conceptThreshold = 0.55, sourceContextThreshold = 0.2} = {}) {
  const urls = new Set(candidate.normalized_urls || [candidate.source?.normalized_url].filter(Boolean));
  return priorStories.map(prior => {
    const conceptSimilarity = jaccard(candidate.concept_tokens, prior.concept_tokens);
    const sharedUrl = (prior.normalized_urls || []).find(url => urls.has(url)) || null;
    const reason = conceptSimilarity >= conceptThreshold ? 'concept_similarity' : sharedUrl && conceptSimilarity >= sourceContextThreshold ? 'source_and_concept' : null;
    return reason ? {prior_story_id: prior.story_id, prior_brief_date: prior.brief_date, reason, shared_url: sharedUrl, concept_similarity: Number(conceptSimilarity.toFixed(3))} : null;
  }).filter(Boolean).sort((a, b) => b.concept_similarity - a.concept_similarity || a.prior_story_id.localeCompare(b.prior_story_id));
}

export function backtestNovelty(memory) {
  const reviewed = [];
  const prior = [];
  for (const story of memory.stories) {
    const matches = noveltyMatches(story, prior);
    if (matches.length) reviewed.push({story_id: story.story_id, brief_date: story.brief_date, headline: story.headline, disposition: 'would_require_material-update_review', matches});
    prior.push(story);
  }
  return {
    schema_version: '1.0.0',
    window: memory.window,
    editions_scanned: memory.editions_scanned.length,
    stories_scanned: memory.stories.length,
    candidates_requiring_review: reviewed.length,
    result: 'PASS',
    rule: 'A match blocks disposition=new; publication requires material_update or approved_repeat, prior story IDs, and a non-empty what_changed explanation.',
    review_candidates: reviewed
  };
}
