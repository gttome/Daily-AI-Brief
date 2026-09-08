import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {accessibilityReview, auditEditionAccessibility, contrastRatio} from '../lib/accessibility.mjs';
import {ANALYTICS_METRICS, aggregateAnalytics, analyticsKey, collectAnalytics} from '../lib/analytics.mjs';
import {qaMetrics, renderQaDashboard} from '../lib/quality.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edition = JSON.parse(fs.readFileSync(path.join(root, '_data/editions/2026-09-07.json'), 'utf8'));

test('controlled analytics counts aggregate exactly and suppress small story counts', async () => {
  const stories = edition.stories.slice(0, 2);
  const values = new Map();
  for (const [index, story] of stories.entries()) for (const metric of ANALYTICS_METRICS) values.set(analyticsKey('2026-09-07', story.story_id, metric), index ? 7 : 3);
  const record = await collectAnalytics('2026-09-07', stories, async key => values.get(key));
  assert.equal(record.collection_status, 'complete');
  assert.equal(record.site_totals.views, 10);
  assert.equal(record.stories[0].metrics.views, null);
  assert.equal(record.stories[1].metrics.views, 7);
  assert.equal(record.site_totals.feedback_most_useful, 10);
  assert.equal(record.privacy.contains_personal_identifiers, false);
});

test('analytics outage is explicit and never becomes a zero-count success', async () => {
  const record = await collectAnalytics('2026-09-07', edition.stories.slice(0, 1), async () => { throw new Error('outage'); });
  assert.equal(record.collection_status, 'unavailable');
  assert.equal(record.site_totals.views, null);
});

test('analytics counters are collected concurrently so added feedback metrics do not delay publishing', async () => {
  let active = 0;
  let maximumActive = 0;
  const record = await collectAnalytics('2026-09-07', edition.stories.slice(0, 2), async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise(resolve => setTimeout(resolve, 2));
    active -= 1;
    return 8;
  });
  assert.equal(record.collection_status, 'complete');
  assert.ok(maximumActive > 1);
});

test('aggregate analytics rejects unsupported identity-shaped fields by construction', () => {
  const record = aggregateAnalytics({date: '2026-09-07', stories: edition.stories.slice(0, 1), counts: {}, collectionStatus: 'unavailable'});
  assert.deepEqual(Object.keys(record.privacy).sort(), ['contains_personal_identifiers', 'retention_days', 'small_count_suppression', 'suppression_threshold']);
  assert.equal(JSON.stringify(record).includes('email'), false);
  assert.equal(JSON.stringify(record).includes('ip_address'), false);
});

test('accessibility severity model blocks broken images and passes the live edition', () => {
  assert.equal(auditEditionAccessibility(edition, root).result, 'PASS');
  const broken = structuredClone(edition); broken.stories[0].image.path = 'briefs/images/2026-09-07/missing.svg';
  const result = auditEditionAccessibility(broken, root);
  assert.equal(result.result, 'FAIL');
  assert.equal(result.disposition, 'block');
  assert.ok(result.findings.some(item => item.code === 'broken_image' && item.severity === 'high'));
});

test('editorial alt review covers all six stories and color contrast passes AA', () => {
  const review = accessibilityReview(edition, root, '2026-09-07T18:30:00Z');
  assert.equal(review.editorial_alt_review.length, 6);
  assert.equal(review.editorial_alt_review.every(item => item.result === 'pass'), true);
  assert.ok(contrastRatio('#126a6a', '#ffffff') >= 4.5);
});

test('public QA dashboard metrics match the machine-readable record', () => {
  const record = JSON.parse(fs.readFileSync(path.join(root, '_records/qa/2026-09-07.json'), 'utf8'));
  assert.deepEqual(qaMetrics([record]), {runs: 1, first_pass_rate: 100, final_pass_rate: 100, repairs: 0, average_deployment_latency_seconds: 47});
  const page = renderQaDashboard(root);
  assert.match(page, /100%<\/strong><span>First-pass QA/);
  assert.match(page, /47s<\/strong><span>Average deploy latency/);
});
