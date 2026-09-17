import {METRICS} from './efficiency-core.mjs';
import {editionPodcasts} from './podcasts.mjs';
import {normalizeUrl} from './util.mjs';

const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const dateOnly = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const stamp = Date.parse(value);
  if (!Number.isFinite(stamp)) return null;
  return new Date(stamp).toISOString().slice(0, 10);
};
const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

export const REQUIRED_PRODUCTION_TELEMETRY = [
  ...METRICS.stages.map(field => `stages.${field}`),
  'research.cache_hits',
  'research.cache_misses',
  'research.early_stop_triggered',
  'context.model_calls_observable',
  'context.input_tokens_observable',
  'context.output_tokens_observable'
];

export function productionTelemetryHealth(record) {
  const missing = [];
  const invalid = [];
  for (const field of REQUIRED_PRODUCTION_TELEMETRY) {
    const value = get(record, field);
    if (value === null || value === undefined) { missing.push(field); continue; }
    if (field === 'research.early_stop_triggered') {
      if (typeof value !== 'boolean') invalid.push(field);
    } else if (!numeric(value)) invalid.push(field);
  }
  return {
    status: missing.length || invalid.length ? 'DEGRADED' : 'PASS',
    missing_required: missing,
    invalid_required: invalid,
    note: missing.length || invalid.length
      ? 'Production efficiency telemetry is incomplete. Do not infer model, token, cache, early-stop, or stage measurements.'
      : 'Required production efficiency telemetry is complete.'
  };
}

export function applyProductionTelemetryHealth(record) {
  const telemetry_health = productionTelemetryHealth(record);
  return {
    ...record,
    telemetry_health,
    quality: {
      ...record.quality,
      overall_run_status: telemetry_health.status === 'DEGRADED'
        ? 'DEGRADED'
        : (record.quality?.overall_run_status ?? 'PASS')
    }
  };
}

function selectedMedia(edition) {
  const date = edition.brief_date;
  const items = [];
  const slots = [
    ['general', `dab-video-${date}-general`],
    ['agents_non_technical_people', `dab-video-${date}-agent-skills`]
  ];
  for (const [slot, item_id] of slots) {
    const item = edition.worth_watching?.[slot];
    if (item?.status === 'included') items.push({
      item_id, kind: 'video', url: item.url,
      published_date: dateOnly(item.upload_date), runtime_seconds: item.runtime_seconds
    });
  }
  for (const podcast of editionPodcasts(edition)) items.push({
    item_id: podcast.item_id, kind: 'podcast', url: podcast.url,
    published_date: dateOnly(podcast.publication_date), runtime_seconds: podcast.runtime_seconds
  });
  return items;
}

export function validateMediaPreflight(edition, record, {observedAt=null,maxAgeMinutes=240}={}) {
  const errors = [];
  if (!record || record.schema_version !== '1.0.0') return ['Media preflight record is required'];
  if (record.edition_id !== edition.edition_id) errors.push('Media preflight edition mismatch');
  const checkedAt = Date.parse(record.checked_at);
  if (!Number.isFinite(checkedAt)) errors.push('Media preflight checked_at is invalid');
  if (observedAt) {
    const observed = Date.parse(observedAt);
    if (!Number.isFinite(observed) || !Number.isFinite(checkedAt) || checkedAt > observed || observed - checkedAt > maxAgeMinutes * 60000) errors.push('Media preflight must be current and precede publication staging');
  }
  const expected = selectedMedia(edition);
  const actual = new Map((record.items || []).map(item => [item.item_id, item]));
  if (actual.size !== expected.length) errors.push(`Media preflight must contain exactly ${expected.length} selected media items`);
  for (const item of expected) {
    const observation = actual.get(item.item_id);
    if (!observation) { errors.push(`Missing media preflight for ${item.item_id}`); continue; }
    if (observation.kind !== item.kind) errors.push(`${item.item_id} media kind mismatch`);
    let expectedUrl, observedUrl;
    try { expectedUrl = normalizeUrl(item.url); } catch { errors.push(`${item.item_id} edition URL is invalid`); }
    try { observedUrl = normalizeUrl(observation.url); } catch { errors.push(`${item.item_id} preflight URL is invalid`); }
    if (expectedUrl && observedUrl && expectedUrl !== observedUrl) errors.push(`${item.item_id} preflight URL mismatch`);
    if (observation.reachable !== true || !Number.isInteger(observation.http_status) || observation.http_status < 200 || observation.http_status >= 400) errors.push(`${item.item_id} URL was not successfully reached before publication`);
    const observedDate = dateOnly(observation.observed_date);
    if (!item.published_date || !observedDate || observedDate !== item.published_date) errors.push(`${item.item_id} publication/upload date was not independently matched`);
    if (item.kind === 'video') {
      if (!Number.isInteger(item.runtime_seconds) || item.runtime_seconds < 1) errors.push(`${item.item_id} requires a verified runtime before publication`);
      if (!Number.isInteger(observation.observed_runtime_seconds) || observation.observed_runtime_seconds !== item.runtime_seconds) errors.push(`${item.item_id} runtime was not independently matched`);
    } else if (item.runtime_seconds !== null && item.runtime_seconds !== undefined) {
      if (!Number.isInteger(item.runtime_seconds) || item.runtime_seconds < 1) errors.push(`${item.item_id} podcast runtime must be positive or unknown`);
      if (!Number.isInteger(observation.observed_runtime_seconds) || observation.observed_runtime_seconds !== item.runtime_seconds) errors.push(`${item.item_id} podcast runtime was not independently matched`);
    }
  }
  return errors;
}

export function assertMediaPreflight(edition, record, options={}) {
  const errors = validateMediaPreflight(edition, record, options);
  if (errors.length) throw new Error(`Media preflight failed:\n- ${errors.join('\n- ')}`);
  return record;
}
