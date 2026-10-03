#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {isAppendOnly, parseJsonLines, validateLedgerEntries} from './lib/ledger.mjs';
import {parseOperationalLearningLedger} from './lib/operational-learning.mjs';

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA || 'HEAD';
if (!base || /^0+$/.test(base)) process.exit(0);
const names = execFileSync('git', ['diff', '--name-only', base, head], {encoding: 'utf8'}).trim().split('\n').filter(Boolean);
const legacy = names.filter(name => /^_records\/ledgers\/[^/]+\.jsonl$/.test(name));
const operational = names.filter(name =>
  name === 'data/operations/production-continuous-improvement-ledger.jsonl' ||
  /^_records\/run-learning\/incidents\/[^/]+\.jsonl$/.test(name)
);
const errors = [];

for (const file of [...legacy, ...operational]) {
  const next = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  let previous = '';
  try { previous = execFileSync('git', ['show', `${base}:${file}`], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}); }
  catch { previous = ''; }
  if (!isAppendOnly(previous, next)) errors.push(`${file}: existing ledger bytes were changed or removed`);

  if (legacy.includes(file)) {
    try { errors.push(...validateLedgerEntries(parseJsonLines(next)).map(error => `${file}: ${error}`)); }
    catch (error) { errors.push(`${file}: ${error.message}`); }
  } else {
    try { parseOperationalLearningLedger(next); }
    catch (error) { errors.push(`${file}: ${error.message}`); }
  }
}
if (errors.length) {
  console.error(`Append-only ledger validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Append-only ledger validation passed for ${legacy.length + operational.length} changed ledger(s).`);
