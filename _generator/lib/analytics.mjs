import {TIMEZONE} from './constants.mjs';

export const ANALYTICS_METRICS = [
  'views',
  'source_clicks',
  'share_initiations',
  'worth_watching_clicks',
  'retention_30s',
  'feedback_most_useful',
  'feedback_useful',
  'feedback_neutral',
  'feedback_not_useful'
];

export function analyticsKey(date, storyId, metric) {
  if (!ANALYTICS_METRICS.includes(metric)) throw new Error(`Unsupported analytics metric: ${metric}`);
  return `dab-v1-${date}-${storyId}-${metric}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
}

export function aggregateAnalytics({date, stories, counts, collectionStatus = 'complete', suppressionThreshold = 5, limitations = []}) {
  const raw = stories.map(story => ({
    story_id: story.story_id,
    metrics: Object.fromEntries(ANALYTICS_METRICS.map(metric => [metric, Number.isInteger(counts[story.story_id]?.[metric]) ? counts[story.story_id][metric] : null]))
  }));
  const siteTotals = Object.fromEntries(ANALYTICS_METRICS.map(metric => {
    const values = raw.map(item => item.metrics[metric]).filter(Number.isInteger);
    return [metric, values.length ? values.reduce((sum, value) => sum + value, 0) : null];
  }));
  const suppressed = raw.map(item => ({story_id: item.story_id, metrics: Object.fromEntries(Object.entries(item.metrics).map(([metric, value]) => [metric, Number.isInteger(value) && value < suppressionThreshold ? null : value]))}));
  return {
    schema_version: '1.0.0', date, timezone: TIMEZONE,
    aggregation_window: {start: `${date}T05:00:00Z`, end: `${new Date(new Date(`${date}T05:00:00Z`).valueOf() + 86400000).toISOString().replace('.000Z', 'Z')}`},
    privacy: {contains_personal_identifiers: false, small_count_suppression: true, suppression_threshold: suppressionThreshold, retention_days: 400},
    site_totals: siteTotals,
    stories: suppressed,
    collection_status: collectionStatus,
    limitations
  };
}

export async function collectAnalytics(date, stories, getCount) {
  const counts = {};
  const limitations = ['Client events contain no names, emails, cookies, persistent reader IDs, or page content.', 'Public feedback is anonymous and secondary; it cannot be attributed to the primary reader or activate editorial weighting.', 'The public aggregate counter transport can be affected by blockers, bots, or deliberate replay; these counts are directional, not audited audience totals.'];
  let failures = 0;
  for (const story of stories) counts[story.story_id] = {};
  await Promise.all(stories.flatMap(story => ANALYTICS_METRICS.map(async metric => {
      try {
        const value = await getCount(analyticsKey(date, story.story_id, metric));
        counts[story.story_id][metric] = Number.isInteger(value) && value >= 0 ? value : null;
        if (!Number.isInteger(value)) failures += 1;
      } catch { counts[story.story_id][metric] = null; failures += 1; }
    })));
  const total = stories.length * ANALYTICS_METRICS.length;
  const status = failures === 0 ? 'complete' : failures === total ? 'unavailable' : 'partial';
  return aggregateAnalytics({date, stories, counts, collectionStatus: status, limitations});
}
