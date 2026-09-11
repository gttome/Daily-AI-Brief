import fs from 'node:fs';
import path from 'node:path';
import {PUBLIC_BASE} from './constants.mjs';
import {formatDate} from './util.mjs';

const RULES = [
  {id: 'agent-reliability-governance', name: 'Agent reliability and governance', keywords: ['reliability', 'evaluation', 'guardrail', 'approval', 'safety', 'governance', 'verification', 'security', 'policy']},
  {id: 'agent-memory-context', name: 'Agent memory and context', keywords: ['memory', 'context', 'grounding', 'rag', 'retrieval']},
  {id: 'ai-assisted-development', name: 'AI-assisted development', keywords: ['coding', 'code', 'developer', 'copilot', 'github', 'software']},
  {id: 'accessible-work-agents', name: 'Accessible agents for knowledge work', keywords: ['no-code', 'low-code', 'workflow', 'knowledge worker', 'sharepoint', 'workspace', 'business', 'agent']}
];

function dayDifference(left, right) { return Math.round((new Date(`${left}T00:00:00Z`) - new Date(`${right}T00:00:00Z`)) / 86400000); }

export function buildTrendRadar(stories, snapshotDate, days = 30) {
  const start = new Date(`${snapshotDate}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - days + 1);
  const startDate = start.toISOString().slice(0, 10);
  const trends = [];
  for (const rule of RULES) {
    const supporting = stories.filter(story => {
      const text = [story.headline, story.summary, ...(story.topics || [])].join(' ').toLowerCase();
      return rule.keywords.some(keyword => text.includes(keyword));
    }).sort((a, b) => b.brief_date.localeCompare(a.brief_date));
    if (supporting.length < 2) continue;
    const recent = supporting.filter(story => dayDifference(snapshotDate, story.brief_date) <= 6).length;
    const earlier = supporting.length - recent;
    const recentRate = recent / 7;
    const earlierRate = earlier / Math.max(1, days - 7);
    let classification = 'stable';
    if (recent >= 2 && earlier === 0) classification = 'emerging';
    else if (recent >= 2 && recentRate > earlierRate * 1.5) classification = 'accelerating';
    else if (earlier >= 2 && recentRate * 1.5 < earlierRate) classification = 'cooling';
    const confidence = supporting.length >= 8 ? 'high' : supporting.length >= 4 ? 'medium' : 'low';
    trends.push({
      trend_id: `dab-trend-${rule.id}`, name: rule.name, classification, confidence,
      rationale: `${recent} supporting stories appeared in the latest 7 days and ${earlier} in the preceding ${days - 7} days. Classification follows normalized story frequency and remains an editorial signal, not a forecast.`,
      evidence_counts: {recent_7_days: recent, preceding_days: earlier, total: supporting.length},
      supporting_story_ids: supporting.map(story => story.story_id),
      supporting_stories: supporting.map(story => ({story_id: story.story_id, brief_date: story.brief_date, url: story.permanent_url}))
    });
  }
  return {schema_version: '1.0.0', snapshot_date: snapshotDate, method_version: '1.0.0', evidence_window: {start_date: startDate, end_date: snapshotDate, days}, trends};
}

export function tagStoriesWithTrends(stories, radar) {
  const tags = new Map();
  for (const trend of radar.trends) for (const storyId of trend.supporting_story_ids) {
    if (!tags.has(storyId)) tags.set(storyId, []);
    tags.get(storyId).push(trend.name);
  }
  return stories.map(story => ({...story, trends: tags.get(story.story_id) || []}));
}

export function renderTrendRadar(radar) {
  return `---
layout: default
title: Daily AI Brief Trend Radar
permalink: /trend-radar/
description: Evidence-linked Generative AI trend signals from the Daily AI Brief.
---

# Trend Radar — ${formatDate(radar.snapshot_date)}

Classifications use the stated ${radar.evidence_window.days}-day evidence window. They describe coverage signals, not market forecasts.

${radar.trends.map(trend => `## ${trend.name}

**${trend.classification.toUpperCase()} · ${trend.confidence} confidence**

${trend.rationale}

Supporting stories:

${trend.supporting_stories.map(story => `- [${formatDate(story.brief_date)}]({{ '${story.url}' | relative_url }})`).join('\n')}`).join('\n\n')}

[← Home]({{ '/' | relative_url }})
`;
}

export function loadAnalyticsRecords(repoRoot, period) {
  const dir = path.join(repoRoot, '_records', 'analytics');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.startsWith(period) && name.endsWith('.json')).sort().map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

export function buildEditorialFeedback(repoRoot, snapshotDate, radar, createdAt) {
  const period = snapshotDate.slice(0, 7);
  const analytics = loadAnalyticsRecords(repoRoot, period).filter(record => record.collection_status !== 'unavailable');
  const analyticsDates = analytics.map(record => record.date);
  const findings = analytics.length ? [{finding_id: 'early_engagement_signal', statement: 'Available aggregate engagement is retained as a secondary editorial signal; the sample is not yet sufficient to change weights automatically.', evidence: analyticsDates.map(date => `analytics:${date}`), confidence: 'low'}] : [{finding_id: 'insufficient_analytics', statement: 'No complete or partial production analytics record is available; no engagement-based weighting change is justified.', evidence: [`trend:${radar.snapshot_date}`], confidence: 'high'}];
  return {
    schema_version: '1.0.0', period, created_at: createdAt,
    inputs: {analytics_dates: analyticsDates, trend_snapshot_dates: [radar.snapshot_date], qa_run_ids: []},
    findings, weight_recommendations: [],
    guardrails: {popularity_only_selection_prohibited: true, hard_gates_override_weights: true, category_balance_preserved: true, human_approval_required: true},
    approval_state: 'pending'
  };
}

export function trendFiles(stories, edition, repoRoot) {
  const radar = buildTrendRadar(stories, edition.brief_date);
  const tagged = tagStoriesWithTrends(stories, radar);
  const feedbackPath = path.join(repoRoot, '_records', 'editorial-feedback', `${edition.brief_date.slice(0, 7)}.json`);
  const feedback = fs.existsSync(feedbackPath) ? JSON.parse(fs.readFileSync(feedbackPath, 'utf8')) : buildEditorialFeedback(repoRoot, edition.brief_date, radar, edition.published_at);
  return {radar, tagged, files: new Map([
    [`_records/trends/${edition.brief_date}.json`, JSON.stringify(radar, null, 2)],
    ['trend-radar.md', renderTrendRadar(radar)],
    [`_records/editorial-feedback/${edition.brief_date.slice(0, 7)}.json`, JSON.stringify(feedback, null, 2)]
  ])};
}
