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
  return errors;
}
