#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {validateAtomicChangedPaths} from './lib/publication.mjs';

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA || 'HEAD';
if (!base || /^0+$/.test(base)) process.exit(0);
const changed = execFileSync('git', ['diff', '--name-only', base, head], {encoding: 'utf8'}).trim().split('\n').filter(Boolean);
const mode = JSON.parse(fs.readFileSync('_generator/mode.json', 'utf8'));
const dates = new Set();
for (const name of changed) {
  const match = name.match(/^briefs\/(\d{4}-\d{2}-\d{2})\.md$/);
  if (match) dates.add(match[1]);
}
if (mode.publication_mode === 'active') {
  for (const name of changed) {
    const match = name.match(/^_data\/editions\/(\d{4}-\d{2}-\d{2})\.json$/);
    if (match) dates.add(match[1]);
  }
}
const failures = [];
for (const date of dates) failures.push(...validateAtomicChangedPaths(changed, date).map(item => `${date}: missing ${item}`));
if (failures.length) {
  console.error(`Atomic publication validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Atomic publication validation passed for ${dates.size} edition change(s).`);
