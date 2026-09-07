import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readerStories} from '../lib/reader.mjs';
import {feedbackAdjustedScore, rankCandidates} from '../lib/scoring.mjs';
import {buildEditorialFeedback, buildTrendRadar, tagStoriesWithTrends} from '../lib/trends.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edition = JSON.parse(fs.readFileSync(path.join(root, '_data/editions/2026-09-07.json'), 'utf8'));

test('every Trend Radar classification has dated, linked supporting evidence', () => {
  const stories = readerStories(root, edition);
  const radar = buildTrendRadar(stories, edition.brief_date);
  assert.ok(radar.trends.length >= 3);
  for (const trend of radar.trends) {
    assert.ok(['accelerating', 'emerging', 'stable', 'cooling'].includes(trend.classification));
    assert.equal(trend.supporting_story_ids.length, trend.supporting_stories.length);
    assert.equal(trend.evidence_counts.total, trend.supporting_stories.length);
    assert.ok(trend.supporting_stories.every(item => /^2026-/.test(item.brief_date) && item.url.startsWith('/stories/')));
  }
  assert.ok(tagStoriesWithTrends(stories, radar).some(story => story.trends.length));
});

test('monthly feedback remains pending and recommends no weights without production analytics', () => {
  const radar = buildTrendRadar(readerStories(root, edition), edition.brief_date);
  const feedback = buildEditorialFeedback(root, edition.brief_date, radar, edition.published_at);
  assert.equal(feedback.approval_state, 'pending');
  assert.deepEqual(feedback.weight_recommendations, []);
  assert.equal(feedback.guardrails.popularity_only_selection_prohibited, true);
});

test('analytics weighting is bounded, secondary, and inert without human approval', () => {
  const pool = JSON.parse(fs.readFileSync(path.join(root, '_contracts/v1/examples/candidate-pool.valid.json'), 'utf8'));
  const candidate = pool.candidates[0];
  const feedback = JSON.parse(fs.readFileSync(path.join(root, '_contracts/v1/examples/editorial-feedback.valid.json'), 'utf8'));
  feedback.weight_recommendations = [{dimension: 'practical_value', delta: .25, rationale: 'Controlled test.', max_duration_days: 7}];
  feedback.approval_state = 'pending';
  assert.equal(feedbackAdjustedScore(candidate, feedback), candidate.score.total);
  feedback.approval_state = 'approved';
  assert.equal(feedbackAdjustedScore(candidate, feedback), candidate.score.total + candidate.score.practical_value * .25);
  assert.equal(rankCandidates(pool.candidates, feedback).length, pool.candidates.length);
  assert.deepEqual(pool.candidates.filter(item => item.selected).sort((a,b)=>a.selected_ordinal-b.selected_ordinal).map(item => item.focus), ['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people']);
});
