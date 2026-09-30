// Versioned reference-time correction; this does not change any age or duration limit.
export const MEDIA_FRESHNESS_POLICY = 'media-research-cutoff-v1';

export function explicitMediaTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
  const day = Date.parse(value.slice(0, 10) + 'T00:00:00Z');
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value.slice(0, 10)) return NaN;
  return Date.parse(value);
}

export function mediaReferenceTime({date, cutoff = null, policy = null} = {}) {
  if (policy == null) {
    if (cutoff != null) throw new Error('media_policy_required_for_explicit_cutoff');
    return Date.parse(date);
  }
  if (policy !== MEDIA_FRESHNESS_POLICY) throw new Error('unknown_media_freshness_policy');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('media_edition_date_required');
  const reference = explicitMediaTimestamp(cutoff);
  if (!Number.isFinite(reference) || cutoff.slice(0, 10) !== date) throw new Error('media_same_edition_explicit_cutoff_required');
  return reference;
}

export function mediaPublicationTime(value, policy = null) {
  if (policy == null) return Date.parse(value);
  if (policy !== MEDIA_FRESHNESS_POLICY) throw new Error('unknown_media_freshness_policy');
  return explicitMediaTimestamp(value);
}
