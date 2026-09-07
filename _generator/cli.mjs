#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importLegacyFile, semanticEditionView} from './lib/import-legacy.mjs';
import {buildPublicationStage} from './lib/publication.mjs';
import {generatedFiles} from './lib/render.mjs';
import {runShadowCheck} from './lib/shadow.mjs';
import {evaluateShadowGate} from './lib/shadow-gate.mjs';
import {latestBriefDate, parseArgs, readJson, writeText} from './lib/util.mjs';
import {assertValidEdition, validateEdition} from './lib/validate.mjs';
import {scanHistoricalBriefs} from './lib/historical.mjs';
import {backtestNovelty} from './lib/novelty.mjs';
import {validateCandidatePool} from './lib/scoring.mjs';
import {accessibilityReview} from './lib/accessibility.mjs';
import {collectAnalytics} from './lib/analytics.mjs';
import {readerStories} from './lib/reader.mjs';
import {renderQaDashboard} from './lib/quality.mjs';
import {validateIntegratedRepository} from './lib/integrity.mjs';

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
  const candidateDir = path.join(repoRoot, '_records', 'editorial', 'candidates');
  const candidateFiles = fs.existsSync(candidateDir) ? fs.readdirSync(candidateDir).filter(name => name.endsWith('.json')).sort() : [];
  for (const file of candidateFiles) errors.push(...validateCandidatePool(readJson(path.join(candidateDir, file))).map(item => `${file}: ${item}`));
  const memoryDir = path.join(repoRoot, '_data', 'story-memory');
  const memoryFiles = fs.existsSync(memoryDir) ? fs.readdirSync(memoryDir).filter(name => name.endsWith('.json')).sort() : [];
  for (const file of memoryFiles) {
    const memory = readJson(path.join(memoryDir, file));
    if (memory.window?.days !== 30) errors.push(`${file}: story-memory window must be 30 days`);
    const ids = memory.stories?.map(story => story.story_id) || [];
    if (new Set(ids).size !== ids.length) errors.push(`${file}: story-memory story IDs must be unique`);
  }
  const date = latestBriefDate(repoRoot);
  if (date) {
    const shadow = runShadowCheck(repoRoot, date, args.commit || null);
    errors.push(...shadow.errors.map(item => `shadow:${date}: ${item}`));
  }
  if (errors.length) throw new Error(`Repository validation failed:\n- ${errors.join('\n- ')}`);
  console.log(JSON.stringify({result: 'PASS', canonical_editions: files.length, candidate_pools: candidateFiles.length, story_memory_snapshots: memoryFiles.length, latest_shadow_date: date}, null, 2));
} else if (command === 'shadow') {
  const date = args.date || chicagoDate();
  const record = runShadowCheck(repoRoot, date, args.commit || process.env.GITHUB_SHA || null);
  if (args.out) writeText(path.resolve(args.out), JSON.stringify(record, null, 2));
  else console.log(JSON.stringify(record, null, 2));
  if (record.result !== 'pass') process.exitCode = 1;
} else if (command === 'backfill-memory') {
  const endDate = args.date || latestBriefDate(repoRoot);
  const memory = scanHistoricalBriefs(repoRoot, endDate, Number(args.days || 30));
  const output = JSON.stringify(memory, null, 2);
  if (args.out) writeText(path.resolve(args.out), output);
  else console.log(output);
} else if (command === 'backtest-novelty') {
  const endDate = args.date || latestBriefDate(repoRoot);
  const result = backtestNovelty(scanHistoricalBriefs(repoRoot, endDate, Number(args.days || 30)));
  const output = JSON.stringify(result, null, 2);
  if (args.out) writeText(path.resolve(args.out), output);
  else console.log(output);
} else if (command === 'validate-candidates') {
  if (!args.file) throw new Error('validate-candidates requires --file');
  const errors = validateCandidatePool(readJson(path.resolve(args.file)));
  console.log(JSON.stringify({result: errors.length ? 'FAIL' : 'PASS', errors}, null, 2));
  if (errors.length) process.exitCode = 1;
} else if (command === 'generate') {
  if (!args.edition || !args.out || !args['baseline-sha']) throw new Error('generate requires --edition, --out, and --baseline-sha');
  const edition = readJson(path.resolve(args.edition));
  const observedAt = args['observed-at'] || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const result = buildPublicationStage(edition, repoRoot, path.resolve(args.out), {baselineSha: args['baseline-sha'], observedAt, runId: args['run-id']});
  console.log(JSON.stringify(result, null, 2));
} else if (command === 'refresh-derived') {
  const date = args.date || latestBriefDate(repoRoot);
  const edition = readJson(path.join(repoRoot, '_data', 'editions', `${date}.json`));
  assertValidEdition(edition);
  const files = generatedFiles(edition, repoRoot);
  for (const [name, content] of files) writeText(path.join(repoRoot, name), content);
  console.log(JSON.stringify({result: 'PASS', date, files: [...files.keys()].sort()}, null, 2));
} else if (command === 'audit-accessibility') {
  const date = args.date || latestBriefDate(repoRoot);
  const edition = readJson(path.join(repoRoot, '_data', 'editions', `${date}.json`));
  const record = accessibilityReview(edition, repoRoot, args['reviewed-at'] || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
  const output = JSON.stringify(record, null, 2);
  if (args.out) writeText(path.resolve(args.out), output); else console.log(output);
  if (record.automated_result !== 'PASS') process.exitCode = 1;
} else if (command === 'render-qa-dashboard') {
  const output = renderQaDashboard(repoRoot);
  if (args.out) writeText(path.resolve(args.out), output); else console.log(output);
} else if (command === 'collect-analytics') {
  const date = args.date || latestBriefDate(repoRoot);
  const edition = readJson(path.join(repoRoot, '_data', 'editions', `${date}.json`));
  const stories = readerStories(repoRoot, edition).filter(story => story.brief_date === date);
  const endpoint = args.endpoint || 'https://countapi.mileshilliard.com/api/v1/get';
  const record = await collectAnalytics(date, stories, async key => {
    const response = await fetch(`${endpoint}/${encodeURIComponent(key)}`, {headers: {'user-agent': 'Daily-AI-Brief-analytics-aggregator/1.0'}});
    if (response.status === 404) return 0;
    if (!response.ok) throw new Error(`counter transport ${response.status}`);
    const data = await response.json();
    return Number(data.value);
  });
  const output = JSON.stringify(record, null, 2);
  if (args.out) writeText(path.resolve(args.out), output); else console.log(output);
} else if (command === 'integration-check') {
  const date = args.date || latestBriefDate(repoRoot);
  const edition = readJson(path.join(repoRoot, '_data', 'editions', `${date}.json`));
  const errors = validateIntegratedRepository(edition, repoRoot);
  console.log(JSON.stringify({result: errors.length ? 'FAIL' : 'PASS', date, errors}, null, 2));
  if (errors.length) process.exitCode = 1;
} else if (command === 'semantic') {
  const date = args.date || latestBriefDate(repoRoot);
  console.log(JSON.stringify(semanticEditionView(importLegacyFile(path.join(repoRoot, 'briefs', `${date}.md`), repoRoot)), null, 2));
} else if (command === 'evaluate-shadow') {
  const records = path.resolve(args.records || path.join(repoRoot, '_records', 'shadow', 'iteration-1'));
  const result = evaluateShadowGate(records, Number(args.required || 7));
  console.log(JSON.stringify(result, null, 2));
  if (result.result !== 'PASS') process.exitCode = 1;
} else {
  console.error('Usage: cli.mjs <import|validate-repo|shadow|evaluate-shadow|backfill-memory|backtest-novelty|validate-candidates|generate|refresh-derived|audit-accessibility|render-qa-dashboard|collect-analytics|integration-check|semantic> [options]');
  process.exitCode = 2;
}
