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
for (const date of dates) {
  const editionPath = `_data/editions/${date}.json`;
  let policyProfile = mode.active_policy_profile || 'publication_reliability_v1';
  if (fs.existsSync(editionPath)) policyProfile = JSON.parse(fs.readFileSync(editionPath, 'utf8')).policy_profile || policyProfile;
  let validationPaths = changed;
  try {
    execFileSync('git', ['cat-file', '-e', `${base}:_data/editions/${date}.json`], {stdio: 'ignore'});
    const retained = [
      `_data/editions/${date}.json`,
      `_records/editorial/candidates/${date}.json`,
      `_data/story-memory/${date}.json`,
      `_records/accessibility/${date}.json`,
      `_records/trends/${date}.json`,
      `_records/editorial-feedback/${date.slice(0, 7)}.json`,
      `briefs/${date}.md`,
      'latest.md',
      'index.md',
      'archive.md',
      'README.md',
      'data/archive-index.json',
      'feed.xml',
      'feed.json',
      'feedback/index.md',
      'qa/index.md',
      'data/qa/30-day.json',
      ...execFileSync('git', ['ls-tree', '-r', '--name-only', head, `stories/${date}`], {encoding: 'utf8'}).trim().split('\n').filter(Boolean),
      ...execFileSync('git', ['ls-tree', '-r', '--name-only', head, `briefs/images/${date}`], {encoding: 'utf8'}).trim().split('\n').filter(Boolean)
    ];
    validationPaths = [...new Set([...changed, ...retained])];
  } catch {
    // A new edition must carry every atomic input and output in the change set.
  }
  failures.push(...validateAtomicChangedPaths(validationPaths, date, {policyProfile}).map(item => `${date}: missing ${item}`));
}
if (failures.length) {
  console.error(`Atomic publication validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Atomic publication validation passed for ${dates.size} edition change(s).`);
