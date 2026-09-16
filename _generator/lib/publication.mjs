import {newEfficiency,assertEfficiency,efficiencyPath,publicEfficiency,readEfficiencyRecords} from './efficiency.mjs';
import path from 'node:path';
import fs from 'node:fs';
import {reviewedImages} from './image-gate.mjs';
import {COMPATIBILITY_OUTPUTS} from './constants.mjs';
import {generatedFiles} from './render.mjs';
import {sha256, stableSuffix, writeText} from './util.mjs';
import {assertValidEdition} from './validate.mjs';
import {applyProductionTelemetryHealth,assertMediaPreflight} from './production-guardrails.mjs';

export function stagedDigest(files) {
  const canonical = [...files.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, content]) => `${name}\0${sha256(content)}`).join('\n');
  return `sha256:${sha256(canonical)}`;
}

export function createValidatedEvent(edition, files, options) {
  const observedAt = options.observedAt;
  const compact = observedAt.replace(/[-:]/g, '').replace('.000', '');
  const suffix = stableSuffix(`${edition.edition_id}|${options.baselineSha}|${stagedDigest(files)}`);
  const runId = options.runId || `dab-publication-${compact}-${suffix}`;
  const eventId = `dab-publication-event-${compact}-${suffix}`;
  const eventPath = `_records/publication/${edition.brief_date}/${runId}.validated.json`;
  const assetPaths = edition.stories.map(story => story.image.path);
  return {
    path: eventPath,
    value: {
      schema_version: '1.0.0',
      event_id: eventId,
      run_id: runId,
      phase: 'validated',
      edition_id: edition.edition_id,
      observed_at: observedAt,
      baseline_main_sha: options.baselineSha,
      staged_tree_digest: stagedDigest(files),
      generator_version: '1.0.0',
      contract_version: '1.0.0',
      checks: options.checks,
      file_set: {
        canonical_sources: [`_data/editions/${edition.brief_date}.json`],
        assets: assetPaths,
        derived_outputs: [...files.keys()].filter(name => name.endsWith('.md') || name === 'feed.xml' || name === 'feed.json' || name.startsWith('data/')),
        operational_records: [eventPath]
      },
      commit_sha: null,
      pages: {run_id: null, conclusion: 'not_run', verified_at: null},
      rollback_target_sha: options.baselineSha,
      supersedes_event_id: null
    }
  };
}

export function buildPublicationStage(edition, repoRoot, outDir, options) {
  assertValidEdition(edition);
  if (edition.brief_date >= '2026-09-17') assertMediaPreflight(edition, options.mediaPreflight, {observedAt: options.observedAt});
  const files = generatedFiles(edition, repoRoot);
  const expected = new Set([`briefs/${edition.brief_date}.md`, ...COMPATIBILITY_OUTPUTS]);
  for (const name of expected) if (!files.has(name)) throw new Error(`Atomic publication plan is missing ${name}`);
  const checks = [
    {check_id: 'edition_validation', class: 'deterministic', result: 'pass', severity: 'critical', evidence: 'Canonical edition passed structural and semantic validation.'},
    {check_id: 'atomic_file_set', class: 'deterministic', result: 'pass', severity: 'critical', evidence: 'All five compatibility outputs are present in the staged transaction.'}
  ];
  if (edition.brief_date >= '2026-09-17') checks.push({check_id:'selected_media_preflight',class:'live_prepublication',result:'pass',severity:'critical',evidence:'Every included video and podcast URL, date, and runtime matched a fresh independent prepublication observation.'});
  files.set(`_data/editions/${edition.brief_date}.json`, `${JSON.stringify(edition, null, 2)}\n`);
  const review=reviewedImages(edition,repoRoot);
  if(review.errors.length)throw new Error(review.errors.join('; '));
  for(const asset of review.assets)files.set(asset.path,fs.readFileSync(path.join(repoRoot,asset.path)));
  if(review.review_path)files.set(review.review_path,fs.readFileSync(path.join(repoRoot,review.review_path),'utf8'));
  const manifest={schema_version:'1.0.0',edition_id:edition.edition_id,baseline_sha:options.baselineSha,rollback_target_sha:options.baselineSha,policy_profile:edition.policy_profile,image_review:review.review_path||null,image_review_sha256:review.review_sha256||null,assets:review.assets,canonical_sha256:sha256(files.get(`_data/editions/${edition.brief_date}.json`)),candidate_digest:stagedDigest(files)};
  files.set(`_records/releases/${edition.brief_date}.json`,JSON.stringify(manifest,null,2)+'\n');
  const originalBaseline=path.join(repoRoot,'_architecture/efficiency-refactor/baseline.json');
  const rawEfficiency=options.efficiency||newEfficiency({editionId:edition.edition_id,attemptId:options.runId||'generation-'+options.observedAt.replace(/[^a-zA-Z0-9]/g,''),baselineSha:fs.existsSync(originalBaseline)?JSON.parse(fs.readFileSync(originalBaseline,'utf8')).baseline_sha:options.baselineSha});
  if(rawEfficiency.edition_id!==edition.edition_id)throw Error('Efficiency edition mismatch');
  const efficiency=edition.brief_date>='2026-09-17'?applyProductionTelemetryHealth(rawEfficiency):rawEfficiency;
  assertEfficiency(efficiency);
  publicEfficiency(efficiency);
  files.set(efficiencyPath(efficiency),JSON.stringify(efficiency,null,2)+'\n');
  const existingIndexFile=path.join(repoRoot,'data/efficiency/index.json');
  const existingIndex=fs.existsSync(existingIndexFile)?JSON.parse(fs.readFileSync(existingIndexFile,'utf8')):{schema_version:'1.0.0',historical:[]};
  const efficiencyRecords=readEfficiencyRecords(repoRoot).filter(r=>efficiencyPath(r)!==efficiencyPath(efficiency));
  files.set('data/efficiency/index.json',JSON.stringify({...existingIndex,records:[...efficiencyRecords,efficiency]},null,2)+'\n');
  const event = createValidatedEvent(edition, files, {...options, checks});
  event.value.file_set.operational_records.push(efficiencyPath(efficiency));
  files.set(event.path, `${JSON.stringify(event.value, null, 2)}\n`);
  for (const [name, content] of files) { if(Buffer.isBuffer(content)){fs.mkdirSync(path.dirname(path.join(outDir,name)),{recursive:true});fs.writeFileSync(path.join(outDir,name),content);}else writeText(path.join(outDir, name), content); }
  return {files: [...files.keys()].sort(), digest: stagedDigest(files), event: event.value, telemetry_health:efficiency.telemetry_health||null};
}

export function validateAtomicChangedPaths(paths, date, {policyProfile = 'publication_reliability_v1'} = {}) {
  const required = new Set([`_data/editions/${date}.json`, `briefs/${date}.md`, ...COMPATIBILITY_OUTPUTS]);
  if (['editorial_intelligence_v1', 'reader_foundation_v1', 'measurement_accessibility_v1', 'full_v1'].includes(policyProfile)) {
    required.add(`_records/editorial/candidates/${date}.json`);
    required.add(`_data/story-memory/${date}.json`);
  }
  if (['reader_foundation_v1', 'measurement_accessibility_v1', 'full_v1'].includes(policyProfile)) {
    for (const output of ['data/archive-index.json', 'feed.xml', 'feed.json', 'feedback/index.md']) required.add(output);
    const storyPagePrefix = `stories/${date}/`;
    const storyPageCount = new Set(paths.filter(name => name.startsWith(storyPagePrefix) && name.endsWith('.md'))).size;
    if (storyPageCount !== 6) required.add(`${storyPagePrefix}<exactly six story pages; found ${storyPageCount}>`);
  }
  if (['measurement_accessibility_v1', 'full_v1'].includes(policyProfile)) {
    required.add(`_records/accessibility/${date}.json`);
    required.add('qa/index.md');
    required.add('data/qa/30-day.json');
  }
  if (policyProfile === 'full_v1') {
    required.add(`_records/trends/${date}.json`);
    required.add(`_records/editorial-feedback/${date.slice(0, 7)}.json`);
  }
  if (date >= '2026-09-10' && policyProfile === 'full_v1') required.add(`_records/editorial/podcasts/${date}.json`);
  const missing = [...required].filter(name => !paths.includes(name));
  const imagePrefix = `briefs/images/${date}/`;
  const imageCount = new Set(paths.filter(name => name.startsWith(imagePrefix))).size;
  return missing;
}
