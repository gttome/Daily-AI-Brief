import assert from 'node:assert/strict';
import test from 'node:test';
import {planAlert} from '../lib/alerts.mjs';

const input = {
  alertType: 'publication_failure',
  component: 'publisher',
  failureClass: 'missing_edition',
  editionId: 'dab-edition-2026-09-07',
  runId: 'dab-publication-20260907T120000Z-abcdef01',
  severity: 'high',
  summary: 'The dated edition is missing.',
  observedAt: '2026-09-07T12:20:00Z'
};

test('first alert occurrence sends one notification', () => {
  const plan = planAlert(input, []);
  assert.equal(plan.send_notification, true);
  assert.equal(plan.deduplicated, false);
  assert.equal(plan.occurrence_count, 1);
});

test('unchanged unresolved alert is deduplicated', () => {
  const first = planAlert(input, []);
  const prior = [{fingerprint: first.fingerprint, state: 'open', severity: 'high', summary: input.summary, occurrence_count: 1, first_seen_at: input.observedAt, last_seen_at: input.observedAt}];
  const second = planAlert({...input, observedAt: '2026-09-07T12:30:00Z'}, prior);
  assert.equal(second.send_notification, false);
  assert.equal(second.deduplicated, true);
  assert.equal(second.occurrence_count, 2);
});

test('severity change sends a new notification', () => {
  const first = planAlert(input, []);
  const prior = [{fingerprint: first.fingerprint, state: 'open', severity: 'medium', summary: input.summary, occurrence_count: 1, first_seen_at: input.observedAt, last_seen_at: input.observedAt}];
  assert.equal(planAlert(input, prior).send_notification, true);
});
