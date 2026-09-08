import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {feedbackAdjustedScore} from '../lib/scoring.mjs';
import {
  activationState,
  buildPersonalLearning,
  evaluateSufficiency,
  validateEditorialLearning,
  validatePersonalFeedback
} from '../lib/personal-learning.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const feedbackExample = JSON.parse(fs.readFileSync(path.join(root, '_contracts/v1/examples/personal-feedback.valid.json'), 'utf8'));
const poolExample = JSON.parse(fs.readFileSync(path.join(root, '_contracts/v1/examples/candidate-pool.valid.json'), 'utf8'));

function feedbackFor(date, index) {
  const record = structuredClone(feedbackExample);
  record.brief_date = date;
  record.feedback_id = 'dab-personal-feedback-' + date + '-' + String(index).padStart(8, '0');
  record.ratings.forEach((rating, ratingIndex) => {
    rating.story_id = 'dab-story-' + date + '-' + String(ratingIndex + 1).padStart(8, '0');
  });
  return record;
}

const dates = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'];
const completeFeedback = dates.map((date, index) => feedbackFor(date, index + 1));
const completePools = dates.map(date => ({...structuredClone(poolExample), brief_date: date}));

test('primary-reader feedback requires exactly six unique 2/2/2 ratings and no personal data', () => {
  assert.deepEqual(validatePersonalFeedback(feedbackExample), []);
  const invalid = structuredClone(feedbackExample);
  invalid.ratings[5].story_id = invalid.ratings[4].story_id;
  invalid.ratings[5].focus = 'technical_ai_engineering';
  invalid.privacy.contains_personal_identifiers = true;
  assert.ok(validatePersonalFeedback(invalid).some(error => error.includes('unique')));
  assert.ok(validatePersonalFeedback(invalid).some(error => error.includes('privacy')));
  assert.ok(validatePersonalFeedback(invalid).some(error => error.includes('exactly two')));
});

test('learning remains inactive before five complete rated editions', () => {
  const sufficiency = evaluateSufficiency(completeFeedback.slice(0, 4));
  assert.equal(sufficiency.result, 'INSUFFICIENT');
  assert.equal(sufficiency.inputs.rated_stories, 24);
  const learning = buildPersonalLearning(completeFeedback.slice(0, 4), completePools.slice(0, 4), '2026-10-05T20:00:00Z');
  assert.equal(learning.status, 'insufficient_evidence');
  assert.deepEqual(learning.weight_recommendations, []);
});

test('five rated editions produce only bounded practical-value and category-fit recommendations', () => {
  const learning = buildPersonalLearning(completeFeedback, completePools, '2026-10-09T20:00:00Z');
  assert.equal(learning.sufficiency.result, 'PASS');
  assert.equal(learning.inputs.rated_stories, 30);
  assert.equal(learning.shadow.result, 'PASS');
  assert.equal(learning.status, 'pending_approval');
  assert.deepEqual(learning.weight_recommendations.map(item => item.dimension), ['practical_value', 'category_fit']);
  assert.equal(learning.weight_recommendations[0].delta, 0.1);
  assert.equal(learning.weight_recommendations[1].delta, 0.05);
  assert.deepEqual(validateEditorialLearning(learning), []);
});

test('personal weighting is inert until explicit approval and active state', () => {
  const learning = buildPersonalLearning(completeFeedback, completePools, '2026-10-09T20:00:00Z');
  const candidate = poolExample.candidates[0];
  assert.equal(feedbackAdjustedScore(candidate, learning), candidate.score.total);
  learning.activation.approval_state = 'approved';
  learning.activation.approved_at = '2026-10-10T12:00:00Z';
  learning.activation.state = 'active';
  learning.activation.effective_from = '2026-10-11';
  assert.ok(feedbackAdjustedScore(candidate, learning, {editionCount: 0}) > candidate.score.total);
});

test('active learning fails closed on QA regression and expires after ten editions', () => {
  const learning = buildPersonalLearning(completeFeedback, completePools, '2026-10-09T20:00:00Z');
  learning.activation.approval_state = 'approved';
  learning.activation.approved_at = '2026-10-10T12:00:00Z';
  learning.activation.state = 'active';
  learning.activation.effective_from = '2026-10-11';
  assert.equal(activationState(learning, {editionCount: 9}), 'active');
  assert.equal(activationState(learning, {editionCount: 10}), 'expired');
  assert.equal(activationState(learning, {editionCount: 1, qaPassed: false}), 'rolled_back');
  assert.equal(activationState(learning, {editionCount: 1, criticalHighDefects: 1}), 'rolled_back');
  assert.equal(activationState(learning, {editionCount: 1, protectedDimensionsChanged: true}), 'rolled_back');
  assert.equal(activationState(learning, {editionCount: 1, categoryBalanceChanged: true}), 'rolled_back');
});

test('invalid recommendation dimensions and excessive deltas are rejected', () => {
  const learning = buildPersonalLearning(completeFeedback, completePools, '2026-10-09T20:00:00Z');
  learning.weight_recommendations.push({dimension: 'authority', delta: 0.2, rationale: 'Invalid.', max_duration_editions: 10});
  learning.weight_recommendations.push({dimension: 'practical_value', delta: 0.2, rationale: 'Too large.', max_duration_editions: 10});
  const errors = validateEditorialLearning(learning);
  assert.ok(errors.some(error => error.includes('only practical_value and category_fit')));
  assert.ok(errors.some(error => error.includes('exceeds its dimension cap')));
});
