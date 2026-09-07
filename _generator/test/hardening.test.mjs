import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {auditEditionAccessibility} from '../lib/accessibility.mjs';
import {collectAnalytics} from '../lib/analytics.mjs';
import {publicationOutcome, rollbackOutcome, validatePublicationFreshness, validateQaRecord} from '../lib/integrity.mjs';
import {validateFeeds} from '../lib/reader.mjs';
import {generatedFiles} from '../lib/render.mjs';
import {validateEdition} from '../lib/validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edition = JSON.parse(fs.readFileSync(path.join(root, '_data/editions/2026-09-07.json'), 'utf8'));

test('failure injection: missing source is blocked', () => {
  const value = structuredClone(edition); delete value.stories[0].source;
  assert.ok(validateEdition(value).some(error => error.includes('source is required')));
});

test('failure injection: broken image is blocked', () => {
  const value = structuredClone(edition); value.stories[0].image.path = 'briefs/images/2026-09-07/not-present.svg';
  assert.ok(auditEditionAccessibility(value, root).findings.some(item => item.code === 'broken_image' && item.severity === 'high'));
});

test('failure injection: stale edition is blocked', () => {
  assert.ok(validatePublicationFreshness(edition, '2026-09-08').some(error => error.includes('stale edition')));
});

test('failure injection: duplicate story and invalid allocation are blocked', () => {
  const duplicate = structuredClone(edition); duplicate.stories[1].story_id = duplicate.stories[0].story_id;
  assert.ok(validateEdition(duplicate).some(error => error.includes('duplicated')));
  const allocation = structuredClone(edition); allocation.stories[0].focus = 'agents_non_technical_people';
  assert.ok(validateEdition(allocation).some(error => error.includes('2/2/2')));
});

test('failure injection: analytics outage becomes unavailable with null metrics', async () => {
  const record = await collectAnalytics(edition.brief_date, edition.stories, async () => { throw new Error('simulated outage'); });
  assert.equal(record.collection_status, 'unavailable');
  assert.equal(record.site_totals.source_clicks, null);
});

test('failure injection: malformed feed is detected', () => {
  assert.ok(validateFeeds('<feed>', '{bad json').length >= 2);
});

test('failure injection: concurrent publication and Pages failure are explicit', () => {
  assert.equal(publicationOutcome({expectedBaseline: 'a', observedBaseline: 'b', stagedValid: true, pagesConclusion: 'success'}), 'aborted_concurrent_update');
  assert.equal(publicationOutcome({expectedBaseline: 'a', observedBaseline: 'a', stagedValid: true, pagesConclusion: 'failure'}), 'degraded_pages_failure');
});

test('failure injection: corrupted QA cannot report pass', () => {
  const record = JSON.parse(fs.readFileSync(path.join(root, '_records/qa/2026-09-07.json'), 'utf8'));
  record.checks[0].result = 'fail'; record.final_result = 'pass';
  assert.ok(validateQaRecord(record).some(error => error.includes('blocking failed check')));
});

test('failure injection: rollback failures are explicit and never claimed as success', () => {
  assert.equal(rollbackOutcome({targetExists: false, restoredTreeValid: true, pagesConclusion: 'success'}), 'rollback_failed_missing_target');
  assert.equal(rollbackOutcome({targetExists: true, restoredTreeValid: false, pagesConclusion: 'success'}), 'rollback_failed_validation');
  assert.equal(rollbackOutcome({targetExists: true, restoredTreeValid: true, pagesConclusion: 'failure'}), 'rollback_degraded_pages_failure');
});

test('full derived generation stays within the integration performance budget', () => {
  const start = performance.now(); const outputs = generatedFiles(edition, root); const elapsed = performance.now() - start;
  assert.ok(outputs.size >= 130);
  assert.ok(elapsed < 3000, `generation took ${elapsed}ms`);
});
