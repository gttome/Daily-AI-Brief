import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {importLegacyFile, semanticEditionView} from '../lib/import-legacy.mjs';
import {buildPublicationStage, stagedDigest, validateAtomicChangedPaths} from '../lib/publication.mjs';
import {generatedFiles} from '../lib/render.mjs';
import {runShadowCheck} from '../lib/shadow.mjs';
import {normalizeUrl} from '../lib/util.mjs';
import {validateEdition} from '../lib/validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const baseline = 'b70bc37b4e190750eda08842bfe3ee09995c0b8a';
const edition = importLegacyFile(path.join(root, 'briefs', '2026-09-06.md'), root, baseline);

function currentBriefDate() {
  return importLegacyFile(path.join(root, 'latest.md'), root).brief_date;
}

test('legacy edition imports into the canonical six-story contract', () => {
  assert.deepEqual(validateEdition(edition), []);
  assert.equal(edition.edition_id, 'dab-edition-2026-09-06');
  assert.deepEqual(edition.stories.map(story => story.ordinal), [1, 2, 3, 4, 5, 6]);
});

test('homepage, latest, and dated brief are semantically synchronized', () => {
  const date = currentBriefDate();
  const dated = semanticEditionView(importLegacyFile(path.join(root, 'briefs', `${date}.md`), root));
  const latest = semanticEditionView(importLegacyFile(path.join(root, 'latest.md'), root));
  const homepage = semanticEditionView(importLegacyFile(path.join(root, 'index.md'), root));
  assert.deepEqual(latest, dated);
  assert.deepEqual(homepage, dated);
});

test('generator is deterministic for identical inputs', () => {
  const first = generatedFiles(edition, root);
  const second = generatedFiles(edition, root);
  assert.equal(stagedDigest(first), stagedDigest(second));
  assert.deepEqual([...first], [...second]);
});

test('homepage and dated brief place compact feedback controls under all six stories and both videos', () => {
  const currentEdition = JSON.parse(fs.readFileSync(path.join(root, '_data', 'editions', '2026-09-09.json'), 'utf8'));
  const files = generatedFiles(currentEdition, root);
  for (const name of ['index.md', `briefs/${currentEdition.brief_date}.md`]) {
    const page = files.get(name);
    assert.equal((page.match(/class="story-feedback story-feedback-compact"/g) || []).length, 8);
    assert.equal((page.match(/data-feedback-rating=/g) || []).length, 32);
    assert.equal((page.match(/Was this video useful\?/g) || []).length, 2);
    assert.equal((page.match(/rating total|aggregate rating|votes for/gi) || []).length, 0);
  }
});

test('a Share click records exactly one article or video initiation', () => {
  const script = fs.readFileSync(path.join(root, 'assets', 'js', 'share.js'), 'utf8');
  assert.equal((script.match(/incrementCount\(item\.counterKey\)/g) || []).length, 1);
  const handler = script.match(/async function handleShare\(item\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.match(handler, /incrementCount\(item\.counterKey\)/);
});

test('publication stage contains canonical, compatibility, and operational records', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dab-stage-'));
  const result = buildPublicationStage(edition, root, out, {baselineSha: baseline, observedAt: '2026-09-07T12:00:00Z'});
  for (const required of ['_data/editions/2026-09-06.json', 'briefs/2026-09-06.md', 'latest.md', 'index.md', 'archive.md', 'README.md']) {
    assert.ok(result.files.includes(required), required);
    assert.ok(fs.existsSync(path.join(out, required)), required);
  }
  assert.equal(result.event.phase, 'validated');
  assert.equal(result.event.commit_sha, null);
  assert.equal(result.event.pages.conclusion, 'not_run');
});

test('atomic change validator rejects partial publication', () => {
  const date = '2026-09-07';
  const incomplete = [`_data/editions/${date}.json`, `briefs/${date}.md`, 'latest.md'];
  const missing = validateAtomicChangedPaths(incomplete, date);
  assert.ok(missing.includes('index.md'));
  assert.ok(missing.some(item => item.includes('<exactly six assets')));
});

test('atomic change validator accepts one complete edition transaction', () => {
  const date = '2026-09-07';
  const complete = [
    `_data/editions/${date}.json`,
    `briefs/${date}.md`,
    'latest.md',
    'index.md',
    'archive.md',
    'README.md',
    ...Array.from({length: 6}, (_, index) => `briefs/images/${date}/${String(index + 1).padStart(2, '0')}-story.svg`)
  ];
  assert.deepEqual(validateAtomicChangedPaths(complete, date), []);
});

test('existing-edition repair counts the candidate tree rather than deleted asset paths', () => {
  const date = '2026-09-07';
  const finalAssets = Array.from({length: 6}, (_, index) => `briefs/images/${date}/${String(index + 1).padStart(2, '0')}-story.svg`);
  const deletedSupersededAssets = Array.from({length: 3}, (_, index) => `briefs/images/${date}/${String(index + 1).padStart(2, '0')}-old.svg`);
  assert.notDeepEqual(validateAtomicChangedPaths([...finalAssets, ...deletedSupersededAssets], date), []);
  assert.deepEqual(validateAtomicChangedPaths(finalAssets, date).filter(item => item.includes('exactly six assets')), []);
});

test('editorial-intelligence transaction also requires candidate and memory evidence', () => {
  const date = '2026-09-07';
  const files = [
    `_data/editions/${date}.json`, `briefs/${date}.md`, 'latest.md', 'index.md', 'archive.md', 'README.md',
    ...Array.from({length: 6}, (_, index) => `briefs/images/${date}/${index + 1}.svg`)
  ];
  const incomplete = validateAtomicChangedPaths(files, date, {policyProfile: 'editorial_intelligence_v1'});
  assert.ok(incomplete.includes(`_records/editorial/candidates/${date}.json`));
  assert.ok(incomplete.includes(`_data/story-memory/${date}.json`));
  assert.deepEqual(validateAtomicChangedPaths([...files, `_records/editorial/candidates/${date}.json`, `_data/story-memory/${date}.json`], date, {policyProfile: 'editorial_intelligence_v1'}), []);
});

test('reader-foundation transaction requires story pages, search index, and both feeds', () => {
  const date = '2026-09-07';
  const base = [
    `_data/editions/${date}.json`, `briefs/${date}.md`, 'latest.md', 'index.md', 'archive.md', 'README.md',
    `_records/editorial/candidates/${date}.json`, `_data/story-memory/${date}.json`,
    ...Array.from({length: 6}, (_, index) => `briefs/images/${date}/${index + 1}.svg`)
  ];
  const incomplete = validateAtomicChangedPaths(base, date, {policyProfile: 'reader_foundation_v1'});
  assert.ok(incomplete.includes('feed.xml'));
  assert.ok(incomplete.includes('feedback/index.md'));
  assert.ok(incomplete.some(item => item.includes('exactly six story pages')));
  const complete = [...base, 'data/archive-index.json', 'feed.xml', 'feed.json', 'feedback/index.md', ...Array.from({length: 6}, (_, index) => `stories/${date}/story-${index + 1}.md`)];
  assert.deepEqual(validateAtomicChangedPaths(complete, date, {policyProfile: 'reader_foundation_v1'}), []);
});

test('failed staging leaves the source checkout unchanged and rollback target explicit', () => {
  const before = stagedDigest(new Map([
    ['briefs/2026-09-06.md', fs.readFileSync(path.join(root, 'briefs', '2026-09-06.md'), 'utf8')],
    ['latest.md', fs.readFileSync(path.join(root, 'latest.md'), 'utf8')],
    ['index.md', fs.readFileSync(path.join(root, 'index.md'), 'utf8')]
  ]));
  const invalid = structuredClone(edition);
  invalid.stories = invalid.stories.slice(0, 5);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dab-failed-stage-'));
  assert.throws(() => buildPublicationStage(invalid, root, out, {baselineSha: baseline, observedAt: '2026-09-07T12:00:00Z'}));
  const after = stagedDigest(new Map([
    ['briefs/2026-09-06.md', fs.readFileSync(path.join(root, 'briefs', '2026-09-06.md'), 'utf8')],
    ['latest.md', fs.readFileSync(path.join(root, 'latest.md'), 'utf8')],
    ['index.md', fs.readFileSync(path.join(root, 'index.md'), 'utf8')]
  ]));
  assert.equal(after, before);
  assert.match(baseline, /^[0-9a-f]{40}$/);
});

test('baseline shadow check passes', () => {
  const record = runShadowCheck(root, currentBriefDate(), baseline);
  assert.equal(record.result, 'pass');
  assert.deepEqual(record.errors, []);
});

test('URL normalization removes tracking and sorts retained query parameters', () => {
  assert.equal(normalizeUrl('HTTPS://Example.COM:443/path?utm_source=x&b=2&a=1#fragment'), 'https://example.com/path?a=1&b=2');
});
