import {sha256} from './util.mjs';

export function alertFingerprint({alertType, component, failureClass, editionId, runId}) {
  return `sha256:${sha256([alertType, component, failureClass, editionId || '-', runId || '-'].join('|'))}`;
}

export function planAlert(input, priorEvents = []) {
  const fingerprint = alertFingerprint(input);
  const related = priorEvents.filter(event => event.fingerprint === fingerprint).sort((a, b) => a.last_seen_at.localeCompare(b.last_seen_at));
  const previous = related.at(-1);
  const materialChange = !previous || previous.state === 'resolved' || previous.severity !== input.severity || previous.summary !== input.summary;
  return {
    fingerprint,
    occurrence_count: (previous?.occurrence_count || 0) + 1,
    first_seen_at: previous?.first_seen_at || input.observedAt,
    last_seen_at: input.observedAt,
    send_notification: materialChange,
    deduplicated: Boolean(previous && !materialChange),
    reason: materialChange ? (previous ? 'Material alert change or recurrence after resolution.' : 'First unresolved occurrence.') : 'Duplicate unresolved fingerprint with unchanged severity and summary.'
  };
}
