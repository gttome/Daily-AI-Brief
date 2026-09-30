#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {isAppendOnly, parseJsonLines, validateLedgerEntries} from './lib/ledger.mjs';

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA || 'HEAD';
if (!base || /^0+$/.test(base)) process.exit(0);
const changed = execFileSync('git', ['diff', '--name-only', base, head], {encoding: 'utf8'}).trim().split('\n').filter(name => /^_records\/ledgers\/[^/]+\.jsonl$/.test(name));
const errors = [];
for (const file of changed) {
  const next = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  let previous = '';
  try { previous = execFileSync('git', ['show', `${base}:${file}`], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}); }
  catch { previous = ''; }
  if (!isAppendOnly(previous, next)) errors.push(`${file}: existing ledger bytes were changed or removed`);
  try { errors.push(...validateLedgerEntries(parseJsonLines(next)).map(error => `${file}: ${error}`)); }
  catch (error) { errors.push(`${file}: ${error.message}`); }
}
if (errors.length) {
  console.error(`Append-only ledger validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Append-only ledger validation passed for ${changed.length} changed ledger(s).`);
