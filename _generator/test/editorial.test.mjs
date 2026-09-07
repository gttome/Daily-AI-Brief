import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {scanHistoricalBriefs} from '../lib/historical.mjs';
import {isAppendOnly, parseJsonLines, validateLedgerEntries} from '../lib/ledger.mjs';
import {backtestNovelty, noveltyMatches} from '../lib/novelty.mjs';
import {renderBody} from '../lib/render.mjs';
import {validateCandidatePool} from '../lib/scoring.mjs';
import {validateEdition} from '../lib/validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

test('30-day memory backfill covers every available historical edition and story', () => {
  const memory = scanHistoricalBriefs(root, '2026-09-06', 30);
  assert.equal(memory.window.start_date, '2026-08-08');
  assert.equal(memory.editions_scanned.length, 21);
  assert.equal(memory.stories.length, 119);
  assert.equal(memory.stories.filter(story => !story.normalized_urls.length).length, 0);
  assert.equal(new Set(memory.stories.map(story => story.story_id)).size, 119);
});

test('novelty backtest finds the known Meet notes and Healthcare repeats', () => {
  const result = backtestNovelty(scanHistoricalBriefs(root, '2026-09-06', 30));
  assert.equal(result.result, 'PASS');
  assert.equal(result.candidates_requiring_review, 2);
  assert.ok(result.review_candidates.some(item => item.headline.includes('visible pause switch')));
  assert.ok(result.review_candidates.some(item => item.headline.includes('authorized Epic context')));
});

test('novelty matching combines normalized source identity with concept overlap', () => {
  const prior = {story_id: 'dab-story-prior', brief_date: '2026-09-01', normalized_urls: ['https://example.com/release'], concept_tokens: ['agent', 'approval', 'workflow']};
  const candidate = {normalized_urls: ['https://example.com/release'], concept_tokens: ['agent', 'approval', 'update']};
  const matches = noveltyMatches(candidate, [prior]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].reason, 'source_and_concept');
});

test('candidate pool requires 20-30 scored candidates and exact selected 2/2/2', () => {
  const pool = read('_contracts/v1/examples/candidate-pool.valid.json');
  assert.deepEqual(validateCandidatePool(pool), []);
  const invalid = structuredClone(pool);
  invalid.candidates[0].score.total -= 1;
  invalid.candidates[0].novelty_check.matches = [{prior_story_id: 'dab-story-prior'}];
  assert.ok(validateCandidatePool(invalid).some(error => error.includes('total is incorrect')));
  assert.ok(validateCandidatePool(invalid).some(error => error.includes('disposition is new')));
});

test('editorial profile requires evidence, availability, novelty, and score rationale', () => {
  const edition = read('_data/editions/2026-09-06.json');
  edition.policy_profile = 'editorial_intelligence_v1';
  assert.ok(validateEdition(edition).some(error => error.includes('novelty is required')));
  for (const story of edition.stories) {
    story.source.evidence_type = 'official_announcement';
    story.source.availability_status = 'general_availability';
    story.novelty = {disposition: 'new', prior_story_ids: [], what_changed: null};
    story.candidate_score = {significance: 5, freshness: 5, authority: 5, evidence_quality: 5, novelty: 5, practical_value: 5, category_fit: 5, total: 35, selection_rationale: 'Top-ranked verified candidate in its required category.'};
  }
  assert.deepEqual(validateEdition(edition), []);
});

test('reader output exposes evidence labels and material-update explanation', () => {
  const edition = read('_data/editions/2026-09-06.json');
  edition.stories[0].source.evidence_type = 'official_changelog';
  edition.stories[0].source.availability_status = 'general_availability';
  edition.stories[0].novelty = {disposition: 'material_update', prior_story_ids: ['dab-story-2026-09-01-deadbeef'], what_changed: 'The capability moved from preview to general availability.'};
  const body = renderBody(edition);
  assert.match(body, /\*\*Evidence:\*\* Official Changelog/);
  assert.match(body, /\*\*Availability:\*\* General Availability/);
  assert.match(body, /What changed since last coverage/);
});

test('correction and incident ledgers are append-only JSON Lines', () => {
  const entry = JSON.stringify({schema_version: '1.0.0', entry_id: 'dab-correction-20260907T120000Z-deadbeef', entry_type: 'correction', summary: 'Correct a material fact.', evidence: ['https://example.com/evidence'], details: {kind: 'correction'}});
  const previous = `${entry}\n`;
  const next = `${previous}${JSON.stringify({...JSON.parse(entry), entry_id: 'dab-correction-20260907T130000Z-feedbeef'})}\n`;
  assert.equal(isAppendOnly(previous, next), true);
  assert.equal(isAppendOnly(previous, next.replace('material fact', 'rewritten fact')), false);
  assert.deepEqual(validateLedgerEntries(parseJsonLines(next)), []);
});
