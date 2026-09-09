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
export const FEEDBACK_METRICS = ANALYTICS_METRICS.filter(metric => metric.startsWith('feedback_'));

export function analyticsKey(date, storyId, metric) {
  if (!ANALYTICS_METRICS.includes(metric)) throw new Error(`Unsupported analytics metric: ${metric}`);
  return `dab-v1-${date}-${storyId}-${metric}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
}

export function aggregateAnalytics({date, stories, videos = [], counts, collectionStatus = 'complete', suppressionThreshold = 5, limitations = []}) {
  const rawStories = stories.map(story => ({
    story_id: story.story_id,
    metrics: Object.fromEntries(ANALYTICS_METRICS.map(metric => [metric, Number.isInteger(counts[story.story_id]?.[metric]) ? counts[story.story_id][metric] : null]))
  }));
  const rawVideos = videos.map(video => ({
    item_id: video.story_id,
    title: video.title,
    url: video.url,
    metrics: Object.fromEntries(ANALYTICS_METRICS.map(metric => [metric, Number.isInteger(counts[video.story_id]?.[metric]) ? counts[video.story_id][metric] : null]))
  }));
  const raw = [...rawStories, ...rawVideos];
  const siteTotals = Object.fromEntries(ANALYTICS_METRICS.map(metric => {
    const values = raw.map(item => item.metrics[metric]).filter(Number.isInteger);
    return [metric, values.length ? values.reduce((sum, value) => sum + value, 0) : null];
  }));
  const publicExactMetrics = new Set(['share_initiations', ...FEEDBACK_METRICS]);
  const suppressMetrics = item => Object.fromEntries(Object.entries(item.metrics).map(([metric, value]) => [metric, Number.isInteger(value) && value < suppressionThreshold && !publicExactMetrics.has(metric) ? null : value]));
  const suppressedStories = rawStories.map(item => ({story_id: item.story_id, metrics: suppressMetrics(item)}));
  const suppressedVideos = rawVideos.map(item => ({...item, metrics: suppressMetrics(item)}));
  return {
    schema_version: '1.0.0', date, timezone: TIMEZONE,
    aggregation_window: {start: `${date}T05:00:00Z`, end: `${new Date(new Date(`${date}T05:00:00Z`).valueOf() + 86400000).toISOString().replace('.000Z', 'Z')}`},
    privacy: {contains_personal_identifiers: false, small_count_suppression: true, suppression_threshold: suppressionThreshold, retention_days: 400},
    site_totals: siteTotals,
    stories: suppressedStories,
    videos: suppressedVideos,
    collection_status: collectionStatus,
    limitations
  };
}

export async function collectAnalytics(date, stories, getCount, videos = []) {
  const counts = {};
  const limitations = ['Client events contain no names, emails, cookies, persistent reader IDs, free text, or page content.', 'Explicit rating-button and share totals remain exact because they contain no identifiers; other passive metrics below five remain suppressed.', 'Anonymous reader feedback can inform a recommendation but cannot activate editorial weighting without George’s explicit approval.', 'The public aggregate counter transport can be affected by blockers, bots, or deliberate replay; these counts are directional, not audited audience totals.'];
  let failures = 0;
  const items = [...stories, ...videos];
  for (const story of items) counts[story.story_id] = {};
  await Promise.all(items.flatMap(story => ANALYTICS_METRICS.map(async metric => {
      try {
        const value = await getCount(analyticsKey(date, story.story_id, metric));
        counts[story.story_id][metric] = Number.isInteger(value) && value >= 0 ? value : null;
        if (!Number.isInteger(value)) failures += 1;
      } catch { counts[story.story_id][metric] = null; failures += 1; }
    })));
  const total = items.length * ANALYTICS_METRICS.length;
  const status = failures === 0 ? 'complete' : failures === total ? 'unavailable' : 'partial';
  return aggregateAnalytics({date, stories, videos, counts, collectionStatus: status, limitations});
}

export async function refreshFeedbackAnalytics(existing, date, stories, getCount, videos = []) {
  const items = [...stories, ...videos];
  const counts = Object.fromEntries(items.map(story => [story.story_id, {}]));
  let failures = 0;
  await Promise.all(items.flatMap(story => FEEDBACK_METRICS.map(async metric => {
    try {
      const value = await getCount(analyticsKey(date, story.story_id, metric));
      counts[story.story_id][metric] = Number.isInteger(value) && value >= 0 ? value : null;
      if (!Number.isInteger(value) || value < 0) failures += 1;
    } catch {
      counts[story.story_id][metric] = null;
      failures += 1;
    }
  })));
  const total = items.length * FEEDBACK_METRICS.length;
  const feedbackStatus = failures === 0 ? 'complete' : failures === total ? 'unavailable' : 'partial';
  const refreshed = aggregateAnalytics({
    date,
    stories,
    videos,
    counts,
    collectionStatus: feedbackStatus === 'complete' && existing?.collection_status === 'complete' ? 'complete' : feedbackStatus === 'unavailable' && !existing ? 'unavailable' : 'partial',
    limitations: [...new Set([...(existing?.limitations || []), 'Explicit rating-button totals are refreshed for seven days and remain exact because they contain no identifiers.'])]
  });
  if (existing) {
    refreshed.aggregation_window = existing.aggregation_window;
    refreshed.privacy = existing.privacy;
    for (const metric of ANALYTICS_METRICS.filter(metric => !FEEDBACK_METRICS.includes(metric))) refreshed.site_totals[metric] = existing.site_totals?.[metric] ?? null;
    const existingStories = new Map((existing.stories || []).map(story => [story.story_id, story]));
    for (const story of refreshed.stories) {
      const previous = existingStories.get(story.story_id)?.metrics || {};
      for (const metric of ANALYTICS_METRICS.filter(metric => !FEEDBACK_METRICS.includes(metric))) story.metrics[metric] = previous[metric] ?? null;
    }
    const existingVideos = new Map((existing.videos || []).map(video => [video.item_id, video]));
    for (const video of refreshed.videos) {
      const previous = existingVideos.get(video.item_id)?.metrics || {};
      for (const metric of ANALYTICS_METRICS.filter(metric => !FEEDBACK_METRICS.includes(metric))) video.metrics[metric] = previous[metric] ?? null;
    }
  }
  return {record: refreshed, feedback_status: feedbackStatus, failures};
}
