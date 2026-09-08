import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './util.mjs';

export const PERSONAL_LEARNING_POLICY = Object.freeze({
  minimumEditions: 5,
  minimumRatings: 30,
  minimumPerFocus: 10,
  minimumCandidateSets: 5,
  maxEditions: 10,
  caps: {practical_value: 0.1, category_fit: 0.05},
  protectedDimensions: ['significance', 'freshness', 'authority', 'evidence_quality', 'novelty']
});

export const FEEDBACK_RATINGS = Object.freeze({most_useful: 1, useful: 0.5, neutral: 0, not_useful: -1});
export const FEEDBACK_REASONS = new Set(['book_or_course', 'consulting', 'tool_worth_testing', 'important_emerging_concept', 'too_technical', 'too_promotional', 'not_relevant']);
const FOCUSES = ['technical_ai_engineering', 'applied_genai_knowledge_workers', 'agents_non_technical_people'];
const INLINE_METRICS = {
  most_useful: 'feedback_most_useful',
  useful: 'feedback_useful',
  neutral: 'feedback_neutral',
  not_useful: 'feedback_not_useful'
};

export function validatePersonalFeedback(record) {
  const errors = [];
  if (record.source !== 'primary_reader_weekly_checkin') errors.push('feedback source must be primary_reader_weekly_checkin');
  if (record.approved_for_learning !== true) errors.push('feedback must be explicitly approved for learning');
  if (record.privacy?.contains_personal_identifiers !== false || record.privacy?.contains_browsing_history !== false || record.privacy?.publishable !== true) errors.push('feedback privacy declaration is invalid');
  if (!Array.isArray(record.ratings) || record.ratings.length !== 6) errors.push('feedback must rate exactly six stories from one edition');
  const ids = new Set();
  const coverage = Object.fromEntries(FOCUSES.map(focus => [focus, 0]));
  for (const [index, rating] of (record.ratings || []).entries()) {
    if (!rating.story_id?.startsWith('dab-story-' + record.brief_date + '-')) errors.push('ratings[' + index + '].story_id must match brief_date');
    if (ids.has(rating.story_id)) errors.push('ratings[' + index + '].story_id must be unique');
    ids.add(rating.story_id);
    if (!(rating.rating in FEEDBACK_RATINGS)) errors.push('ratings[' + index + '].rating is unsupported');
    if (!(rating.focus in coverage)) errors.push('ratings[' + index + '].focus is unsupported');
    else coverage[rating.focus] += 1;
    if (!Array.isArray(rating.reasons) || rating.reasons.some(reason => !FEEDBACK_REASONS.has(reason))) errors.push('ratings[' + index + '].reasons contains an unsupported value');
  }
  for (const focus of FOCUSES) if (coverage[focus] !== 2) errors.push('feedback must include exactly two ' + focus + ' stories');
  return errors;
}

export function loadPersonalFeedback(repoRoot) {
  const dir = path.join(repoRoot, '_records', 'personal-feedback');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

export function inlineFeedbackFromAnalytics(analytics, edition) {
  if (!analytics || !edition || analytics.date !== edition.brief_date || !Array.isArray(analytics.stories) || edition.stories?.length !== 6) return null;
  const byStory = new Map(analytics.stories.map(story => [story.story_id, story]));
  const ratings = [];
  for (const story of edition.stories) {
    const metrics = byStory.get(story.story_id)?.metrics;
    if (!metrics) return null;
    let storyRatings = 0;
    for (const [rating, metric] of Object.entries(INLINE_METRICS)) {
      const weight = metrics[metric];
      if (!Number.isInteger(weight) || weight < 0) return null;
      storyRatings += weight;
      if (weight) ratings.push({story_id: story.story_id, focus: story.focus, rating, reasons: [], weight});
    }
    if (!storyRatings) return null;
  }
  return {
    feedback_id: 'dab-reader-feedback-' + edition.brief_date,
    brief_date: edition.brief_date,
    source: 'anonymous_inline_buttons',
    complete_edition: true,
    ratings
  };
}

export function loadInlineFeedback(repoRoot) {
  const analyticsDir = path.join(repoRoot, '_records', 'analytics');
  const editionDir = path.join(repoRoot, '_data', 'editions');
  if (!fs.existsSync(analyticsDir) || !fs.existsSync(editionDir)) return [];
  return fs.readdirSync(analyticsDir)
    .filter(name => name.endsWith('.json') && fs.existsSync(path.join(editionDir, name)))
    .sort()
    .map(name => inlineFeedbackFromAnalytics(
      JSON.parse(fs.readFileSync(path.join(analyticsDir, name), 'utf8')),
      JSON.parse(fs.readFileSync(path.join(editionDir, name), 'utf8'))
    ))
    .filter(Boolean);
}

export function mergeLearningFeedback(personalRecords, inlineRecords) {
  const inlineDates = new Set(inlineRecords.map(record => record.brief_date));
  return [...personalRecords.filter(record => !inlineDates.has(record.brief_date)), ...inlineRecords]
    .sort((a, b) => a.brief_date.localeCompare(b.brief_date));
}

function isValidLearningRecord(record) {
  if (record.source === 'primary_reader_weekly_checkin') return validatePersonalFeedback(record).length === 0;
  if (record.source !== 'anonymous_inline_buttons' || record.complete_edition !== true || !record.feedback_id?.startsWith('dab-reader-feedback-')) return false;
  const storyIds = new Set(record.ratings?.map(rating => rating.story_id));
  return storyIds.size === 6 && record.ratings.every(rating => rating.rating in FEEDBACK_RATINGS && FOCUSES.includes(rating.focus) && Number.isInteger(rating.weight) && rating.weight > 0);
}

export function evaluateSufficiency(records) {
  const valid = records.filter(isValidLearningRecord);
  const dates = [...new Set(valid.map(record => record.brief_date))].sort();
  const ratings = valid.flatMap(record => record.ratings);
  const ratingCount = ratings.reduce((sum, rating) => sum + (rating.weight || 1), 0);
  const focusCoverage = Object.fromEntries(FOCUSES.map(focus => [focus, ratings.filter(rating => rating.focus === focus).reduce((sum, rating) => sum + (rating.weight || 1), 0)]));
  const reasons = [];
  if (dates.length < PERSONAL_LEARNING_POLICY.minimumEditions) reasons.push('Need ' + (PERSONAL_LEARNING_POLICY.minimumEditions - dates.length) + ' more rated editions.');
  if (ratingCount < PERSONAL_LEARNING_POLICY.minimumRatings) reasons.push('Need ' + (PERSONAL_LEARNING_POLICY.minimumRatings - ratingCount) + ' more story ratings.');
  for (const focus of FOCUSES) if (focusCoverage[focus] < PERSONAL_LEARNING_POLICY.minimumPerFocus) reasons.push('Need ' + (PERSONAL_LEARNING_POLICY.minimumPerFocus - focusCoverage[focus]) + ' more ' + focus + ' ratings.');
  return {
    validRecords: valid,
    inputs: {
      feedback_ids: valid.map(record => record.feedback_id),
      brief_dates: dates,
      rated_stories: ratingCount,
      focus_coverage: focusCoverage
    },
    result: reasons.length ? 'INSUFFICIENT' : 'PASS',
    reasons
  };
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function weightedMean(values) {
  const weight = values.reduce((sum, item) => sum + item.weight, 0);
  return weight ? values.reduce((sum, item) => sum + item.value * item.weight, 0) / weight : null;
}

export function preferenceSignals(records) {
  const ratings = records.flatMap(record => record.ratings);
  if (!ratings.length) return {practical_value: null, category_fit: null};
  const practical = ratings.map(item => {
    const value = FEEDBACK_RATINGS[item.rating];
    const practicalReason = item.reasons.some(reason => ['book_or_course', 'consulting', 'tool_worth_testing'].includes(reason));
    return {value: Math.max(-1, Math.min(1, value + (practicalReason && value > 0 ? 0.25 : 0))), weight: item.weight || 1};
  });
  const personalRecords = records.filter(record => record.source === 'primary_reader_weekly_checkin');
  const personalRatings = personalRecords.flatMap(record => record.ratings);
  const category = personalRatings.map(item => {
    const value = FEEDBACK_RATINGS[item.rating];
    const mismatch = item.reasons.some(reason => ['too_technical', 'too_promotional', 'not_relevant'].includes(reason));
    const positiveFit = item.reasons.includes('important_emerging_concept');
    return {value: Math.max(-1, Math.min(1, value + (positiveFit && value > 0 ? 0.25 : 0) - (mismatch ? 0.25 : 0))), weight: item.weight || 1};
  });
  const practicalMean = weightedMean(practical);
  const categoryEvidenceReady = new Set(personalRecords.map(record => record.brief_date)).size >= PERSONAL_LEARNING_POLICY.minimumEditions && personalRatings.reduce((sum, item) => sum + (item.weight || 1), 0) >= PERSONAL_LEARNING_POLICY.minimumRatings;
  const categoryMean = categoryEvidenceReady ? weightedMean(category) : null;
  return {
    practical_value: practicalMean === null ? null : Number(practicalMean.toFixed(3)),
    category_fit: categoryMean === null ? null : Number(categoryMean.toFixed(3))
  };
}

export function recommendationsFromSignals(signals) {
  const recommendations = [];
  if (signals.practical_value >= 0.2) recommendations.push({dimension: 'practical_value', delta: 0.1, rationale: 'Explicit daily ratings consistently favor immediately reusable material.', max_duration_editions: 10});
  else if (signals.practical_value <= -0.2) recommendations.push({dimension: 'practical_value', delta: -0.1, rationale: 'Explicit daily ratings indicate that practical usefulness is being overestimated.', max_duration_editions: 10});
  if (signals.category_fit >= 0.2) recommendations.push({dimension: 'category_fit', delta: 0.05, rationale: 'Primary-reader ratings favor stories closely aligned with the intended audiences.', max_duration_editions: 10});
  else if (signals.category_fit <= -0.2) recommendations.push({dimension: 'category_fit', delta: -0.05, rationale: 'Primary-reader ratings indicate that audience fit is being overestimated.', max_duration_editions: 10});
  return recommendations;
}

export function boundedRecommendations(learning) {
  const guardrails = learning?.guardrails || {};
  if (!guardrails.explicit_feedback_primary || !guardrails.public_analytics_secondary || !guardrails.popularity_only_selection_prohibited || !guardrails.category_balance_preserved || !guardrails.human_approval_required) return [];
  if (JSON.stringify(guardrails.protected_dimensions) !== JSON.stringify(PERSONAL_LEARNING_POLICY.protectedDimensions)) return [];
  return (learning.weight_recommendations || [])
    .filter(item => item.dimension in PERSONAL_LEARNING_POLICY.caps)
    .map(item => ({...item, delta: Math.max(-PERSONAL_LEARNING_POLICY.caps[item.dimension], Math.min(PERSONAL_LEARNING_POLICY.caps[item.dimension], item.delta))}));
}

function adjustedTotal(candidate, recommendations) {
  const deltas = new Map(recommendations.map(item => [item.dimension, item.delta]));
  return Object.entries(candidate.score)
    .filter(([key, value]) => key !== 'total' && key !== 'rationale' && Number.isFinite(value))
    .reduce((sum, [key, value]) => sum + value * (1 + (deltas.get(key) || 0)), 0);
}

export function shadowCompare(candidatePools, recommendations) {
  const changes = [];
  for (const pool of candidatePools.slice(-PERSONAL_LEARNING_POLICY.minimumCandidateSets)) {
    for (const focus of FOCUSES) {
      const candidates = pool.candidates.filter(candidate => candidate.focus === focus);
      const base = [...candidates].sort((a, b) => b.score.total - a.score.total || a.candidate_id.localeCompare(b.candidate_id)).slice(0, 2).map(item => item.candidate_id);
      const adjusted = [...candidates].sort((a, b) => adjustedTotal(b, recommendations) - adjustedTotal(a, recommendations) || b.score.total - a.score.total || a.candidate_id.localeCompare(b.candidate_id)).slice(0, 2).map(item => item.candidate_id);
      if (JSON.stringify(base) !== JSON.stringify(adjusted)) changes.push({brief_date: pool.brief_date, focus, base_top_two: base, adjusted_top_two: adjusted});
    }
  }
  const count = Math.min(candidatePools.length, PERSONAL_LEARNING_POLICY.minimumCandidateSets);
  return {minimum_candidate_sets: PERSONAL_LEARNING_POLICY.minimumCandidateSets, candidate_sets_evaluated: count, result: count >= PERSONAL_LEARNING_POLICY.minimumCandidateSets ? 'PASS' : 'NOT_READY', rank_changes: changes};
}

export function buildPersonalLearning(records, candidatePools, evaluatedAt) {
  const sufficiency = evaluateSufficiency(records);
  const signals = preferenceSignals(sufficiency.validRecords);
  const recommendations = sufficiency.result === 'PASS' ? recommendationsFromSignals(signals) : [];
  const shadow = shadowCompare(candidatePools, recommendations);
  let status = 'insufficient_evidence';
  if (sufficiency.result === 'PASS' && !recommendations.length) status = 'no_change_recommended';
  else if (sufficiency.result === 'PASS' && shadow.result === 'PASS') status = 'pending_approval';
  else if (sufficiency.result === 'PASS') status = 'shadow_ready';
  const suffix = sha256(evaluatedAt + '|' + sufficiency.inputs.feedback_ids.join('|')).slice(0, 8);
  return {
    schema_version: '1.0.0',
    learning_id: 'dab-editorial-learning-' + evaluatedAt.slice(0, 10) + '-' + suffix,
    evaluated_at: evaluatedAt,
    status,
    inputs: sufficiency.inputs,
    sufficiency: {
      minimum_editions: PERSONAL_LEARNING_POLICY.minimumEditions,
      minimum_ratings: PERSONAL_LEARNING_POLICY.minimumRatings,
      minimum_per_focus: PERSONAL_LEARNING_POLICY.minimumPerFocus,
      result: sufficiency.result,
      reasons: sufficiency.reasons
    },
    signals,
    weight_recommendations: recommendations,
    shadow,
    activation: {approval_state: 'pending', approved_at: null, state: recommendations.length ? 'shadow' : 'inactive', effective_from: null, max_editions: PERSONAL_LEARNING_POLICY.maxEditions},
    guardrails: {
      explicit_feedback_primary: true,
      public_analytics_secondary: true,
      popularity_only_selection_prohibited: true,
      protected_dimensions: [...PERSONAL_LEARNING_POLICY.protectedDimensions],
      category_balance_preserved: true,
      human_approval_required: true
    },
    rollback: {status: 'READY', triggers: ['qa_failure', 'critical_or_high_defect', 'protected_dimension_change', 'category_balance_change', 'edition_limit_reached']}
  };
}

export function activationState(learning, {editionCount = 0, qaPassed = true, criticalHighDefects = 0, protectedDimensionsChanged = false, categoryBalanceChanged = false} = {}) {
  if (!learning) return 'inactive';
  if (!qaPassed || criticalHighDefects > 0 || protectedDimensionsChanged || categoryBalanceChanged) return 'rolled_back';
  if (learning.activation?.approval_state !== 'approved' || learning.activation?.state !== 'active') return 'inactive';
  if (editionCount >= (learning.activation.max_editions || PERSONAL_LEARNING_POLICY.maxEditions)) return 'expired';
  return 'active';
}

export function validateEditorialLearning(learning) {
  const errors = [];
  const recommendations = learning.weight_recommendations || [];
  if (recommendations.some(item => !(item.dimension in PERSONAL_LEARNING_POLICY.caps))) errors.push('personal learning may adjust only practical_value and category_fit');
  if (recommendations.some(item => item.dimension in PERSONAL_LEARNING_POLICY.caps && Math.abs(item.delta) > PERSONAL_LEARNING_POLICY.caps[item.dimension])) errors.push('personal learning recommendation exceeds its dimension cap');
  if (learning.sufficiency?.result !== 'PASS' && recommendations.length) errors.push('insufficient evidence cannot produce a weighting recommendation');
  if (learning.sufficiency?.result === 'PASS') {
    if ((learning.inputs?.brief_dates?.length || 0) < PERSONAL_LEARNING_POLICY.minimumEditions) errors.push('sufficient learning requires five rated editions');
    if ((learning.inputs?.rated_stories || 0) < PERSONAL_LEARNING_POLICY.minimumRatings) errors.push('sufficient learning requires 30 story ratings');
    for (const focus of FOCUSES) if ((learning.inputs?.focus_coverage?.[focus] || 0) < PERSONAL_LEARNING_POLICY.minimumPerFocus) errors.push('sufficient learning requires ten ratings for ' + focus);
  }
  if (learning.status === 'pending_approval' && learning.shadow?.result !== 'PASS') errors.push('pending approval requires a passing shadow comparison');
  if (learning.activation?.approval_state !== 'approved' && learning.activation?.state === 'active') errors.push('unapproved personal learning cannot be active');
  if (boundedRecommendations(learning).length !== recommendations.length) errors.push('personal learning guardrails are incomplete or a recommendation is invalid');
  return errors;
}
