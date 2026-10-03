export function isAppendOnly(previous, next) {
  if (!previous) return true;
  return next.startsWith(previous) && (previous.endsWith('\n') || next.length === previous.length);
}

export function parseJsonLines(value) {
  return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`line ${index + 1}: ${error.message}`); }
  });
}

export function correctionFingerprint(entry) {
  if (entry?.entry_type !== 'correction' || entry?.details?.kind !== 'correction' || !entry.details.story_id) return null;
  return JSON.stringify({
    edition_id: entry.details.edition_id,
    story_id: entry.details.story_id,
    prior_fact: entry.details.prior_fact,
    corrected_fact: entry.details.corrected_fact,
    reason: entry.details.reason,
    evidence: [...(entry.evidence || [])].sort(),
    affected_urls: [...(entry.affected_urls || [])].sort(),
  });
}

export function appendLedgerEntry(existing, entry) {
  const fingerprint = correctionFingerprint(entry);
  if (fingerprint) {
    const duplicate = parseJsonLines(existing).find(candidate => correctionFingerprint(candidate) === fingerprint);
    if (duplicate) return {value: existing, appended: false, duplicateOf: duplicate.entry_id};
  }
  const separator = existing && !existing.endsWith('\n') ? '\n' : '';
  return {value: `${existing}${separator}${JSON.stringify(entry)}\n`, appended: true, duplicateOf: null};
}

export function validateLedgerEntries(entries) {
  const errors = [];
  const ids = new Set();
  for (const [index, entry] of entries.entries()) {
    const label = `entries[${index}]`;
    if (!/^dab-(correction|incident)-\d{8}T\d{6}Z-[0-9a-f]{8}$/.test(entry.entry_id || '')) errors.push(`${label}.entry_id is invalid`);
    if (ids.has(entry.entry_id)) errors.push(`${label}.entry_id is duplicated`);
    ids.add(entry.entry_id);
    if (!['correction', 'incident'].includes(entry.entry_type)) errors.push(`${label}.entry_type is invalid`);
    if (entry.details?.kind !== entry.entry_type) errors.push(`${label}.details.kind must match entry_type`);
    if (!entry.summary?.trim()) errors.push(`${label}.summary is required`);
    if (!Array.isArray(entry.evidence) || !entry.evidence.length) errors.push(`${label}.evidence is required`);
  }
  const correctionGroups = new Map();
  for (const entry of entries) {
    const fingerprint = correctionFingerprint(entry);
    if (!fingerprint) continue;
    const group = correctionGroups.get(fingerprint) || [];
    group.push(entry);
    correctionGroups.set(fingerprint, group);
  }
  for (const group of correctionGroups.values()) {
    if (group.length < 2) continue;
    const duplicateIds = group.map(entry => entry.entry_id);
    const reconciled = entries.some(entry =>
      entry.entry_type === 'correction' &&
      entry.status === 'resolved' &&
      entry.details?.kind === 'correction' &&
      entry.details?.story_id === null &&
      duplicateIds.every(id => entry.related_entry_ids?.includes(id))
    );
    if (!reconciled) errors.push(`semantic correction fingerprint is duplicated by ${duplicateIds.join(', ')}`);
  }
  return errors;
}
