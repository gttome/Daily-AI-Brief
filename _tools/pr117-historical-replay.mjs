// Diagnostic-only historical replay. Not imported by the production kernel CLI.
import assert from 'node:assert/strict';
import {expandEditorialKernel} from '../_generator/lib/editorial-kernel.mjs';

const semanticFields=['ordinal','focus','headline','summary','why_it_matters','what_to_do_now','topics'];

// The caller loads historicalEdition from a verified immutable baseline checkout.
// Candidate IDs are the diagnostic reconstruction's existing story IDs, not original
// candidate provenance. This adapter cannot approve content or prepare a new edition.
export function replayHistoricalKernel(kernel,historicalEdition,baselineSha){
 assert.equal(kernel.baseline_sha,baselineSha,'Historical baseline mismatch');
 assert.equal(kernel.brief_date,historicalEdition.brief_date,'Historical date mismatch');
 assert.equal(kernel.edition_id,historicalEdition.edition_id,'Historical edition mismatch');
 assert.equal(kernel.editorial_takeaway,historicalEdition.editorial_takeaway,'Historical takeaway mismatch');
 assert.deepEqual(kernel.changed_watchlist_topics,[],'Historical replay cannot change Watchlist semantics');
 assert.deepEqual(kernel.media_decisions,{replay:true},'Historical replay requires diagnostic media marker');
 assert.equal(kernel.stories.length,historicalEdition.stories.length,'Historical story count mismatch');
 for(const [i,story] of kernel.stories.entries()){
  const recorded=historicalEdition.stories[i];
  assert.equal(story.candidate_id,recorded.story_id,'Historical candidate binding mismatch');
  assert.equal(story.story_id,recorded.story_id,'Historical story binding mismatch');
  assert.deepEqual(story.visual,{description:recorded.image.alt},'Historical visual mismatch');
 }
 const expanded=expandEditorialKernel(kernel,{
  candidateFacts:Object.fromEntries(historicalEdition.stories.map(s=>[s.story_id,s])),
  imageAssets:Object.fromEntries(historicalEdition.stories.map(s=>[s.story_id,s.image])),
  media:{worth_watching:historicalEdition.worth_watching,podcast:historicalEdition.podcast,podcasts:historicalEdition.podcasts},
  publishedAt:historicalEdition.published_at,coveragePeriod:historicalEdition.coverage_period
 });
 const replay=structuredClone(historicalEdition);
 for(const [i,story] of expanded.stories.entries()){
  const recorded=historicalEdition.stories[i];
  // Reject semantic drift rather than silently replacing it with the baseline.
  for(const field of semanticFields){
   assert.deepEqual(story[field],recorded[field],`Historical semantic mismatch: ${field}`);
   replay.stories[i][field]=structuredClone(story[field]);
  }
  assert.deepEqual(story.source,recorded.source,'Historical source mismatch');
  assert.deepEqual(story.image,recorded.image,'Historical image mismatch');
 }
 // Keep published IDs/slugs/URLs, social copy, source observations, provenance,
 // scores, media and all other historical metadata exactly as originally recorded.
 // Existing book/reading/image checks still run in buildPublicationStage.
 assert.deepEqual(replay,historicalEdition,'Historical replay changed recorded edition');
 return replay;
}
