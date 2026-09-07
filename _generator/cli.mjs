#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importLegacyFile, semanticEditionView} from './lib/import-legacy.mjs';
import {buildPublicationStage} from './lib/publication.mjs';
import {runShadowCheck} from './lib/shadow.mjs';
import {evaluateShadowGate} from './lib/shadow-gate.mjs';
import {latestBriefDate, parseArgs, readJson, writeText} from './lib/util.mjs';
import {assertValidEdition, validateEdition} from './lib/validate.mjs';

const generatorDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(generatorDir, '..');
const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const repoRoot = path.resolve(args.root || defaultRoot);

function chicagoDate() {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
}

if (command === 'import') {
  const date = args.date || latestBriefDate(repoRoot);
  const edition = importLegacyFile(path.join(repoRoot, 'briefs', `${date}.md`), repoRoot, args.commit || null);
  assertValidEdition(edition);
  if (args.out) writeText(path.resolve(args.out), JSON.stringify(edition, null, 2));
  else console.log(JSON.stringify(edition, null, 2));
} else if (command === 'validate-repo') {
  const editionDir = path.join(repoRoot, '_data', 'editions');
  const files = fs.existsSync(editionDir) ? fs.readdirSync(editionDir).filter(name => name.endsWith('.json')).sort() : [];
  const errors = [];
  for (const file of files) errors.push(...validateEdition(readJson(path.join(editionDir, file))).map(item => `${file}: ${item}`));
  const date = latestBriefDate(repoRoot);
  if (date) {
    const shadow = runShadowCheck(repoRoot, date, args.commit || null);
    errors.push(...shadow.errors.map(item => `shadow:${date}: ${item}`));
  }
  if (errors.length) throw new Error(`Repository validation failed:\n- ${errors.join('\n- ')}`);
  console.log(JSON.stringify({result: 'PASS', canonical_editions: files.length, latest_shadow_date: date}, null, 2));
} else if (command === 'shadow') {
  const date = args.date || chicagoDate();
  const record = runShadowCheck(repoRoot, date, args.commit || process.env.GITHUB_SHA || null);
  if (args.out) writeText(path.resolve(args.out), JSON.stringify(record, null, 2));
  else console.log(JSON.stringify(record, null, 2));
  if (record.result !== 'pass') process.exitCode = 1;
} else if (command === 'generate') {
  if (!args.edition || !args.out || !args['baseline-sha']) throw new Error('generate requires --edition, --out, and --baseline-sha');
  const edition = readJson(path.resolve(args.edition));
  const observedAt = args['observed-at'] || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const result = buildPublicationStage(edition, repoRoot, path.resolve(args.out), {baselineSha: args['baseline-sha'], observedAt, runId: args['run-id']});
  console.log(JSON.stringify(result, null, 2));
} else if (command === 'semantic') {
  const date = args.date || latestBriefDate(repoRoot);
  console.log(JSON.stringify(semanticEditionView(importLegacyFile(path.join(repoRoot, 'briefs', `${date}.md`), repoRoot)), null, 2));
} else if (command === 'evaluate-shadow') {
  const records = path.resolve(args.records || path.join(repoRoot, '_records', 'shadow', 'iteration-1'));
  const result = evaluateShadowGate(records, Number(args.required || 7));
  console.log(JSON.stringify(result, null, 2));
  if (result.result !== 'PASS') process.exitCode = 1;
} else {
  console.error('Usage: cli.mjs <import|validate-repo|shadow|evaluate-shadow|generate|semantic> [options]');
  process.exitCode = 2;
}
