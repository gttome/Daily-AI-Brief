import fs from 'node:fs';
import path from 'node:path';

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function evaluateShadowGate(recordsRoot, required = 7) {
  const records = [];
  if (fs.existsSync(recordsRoot)) {
    for (const dateDir of fs.readdirSync(recordsRoot).sort()) {
      const directory = path.join(recordsRoot, dateDir);
      if (!fs.statSync(directory).isDirectory()) continue;
      for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()) {
        records.push(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
      }
    }
  }
  const latestByDate = new Map();
  for (const record of records) {
    const previous = latestByDate.get(record.date);
    if (!previous || previous.executed_at < record.executed_at) latestByDate.set(record.date, record);
  }
  const passingDates = [...latestByDate].filter(([, record]) => record.result === 'pass').map(([date]) => date).sort();
  let longest = [];
  let current = [];
  for (const date of passingDates) {
    if (!current.length || addDays(current.at(-1), 1) === date) current.push(date);
    else current = [date];
    if (current.length > longest.length) longest = [...current];
  }
  const selected = longest.slice(-required);
  return {
    result: selected.length >= required ? 'PASS' : 'PENDING',
    required_consecutive_passes: required,
    consecutive_passes: longest.length,
    qualifying_dates: selected,
    total_records: records.length,
    latest_results: Object.fromEntries([...latestByDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, record]) => [date, record.result]))
  };
}
