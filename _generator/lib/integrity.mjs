import fs from 'node:fs';
import path from 'node:path';
import {auditEditionAccessibility} from './accessibility.mjs';
import {validateFeeds} from './reader.mjs';
import {generatedFiles} from './render.mjs';
import {validateEdition} from './validate.mjs';
import {validateEditorialLearning, validatePersonalFeedback} from './personal-learning.mjs';

function files(dir, pattern = /\.json$/) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => pattern.test(name)).sort().map(name => path.join(dir, name)) : [];
}

export function validateQaRecord(record) {
  const errors = [];
  if (!record.run_id?.startsWith('dab-qa-')) errors.push('QA run ID is invalid');
  if (!['pass', 'fail'].includes(record.initial_result) || !['pass', 'fail'].includes(record.final_result)) errors.push('QA results are invalid');
  if (record.final_result === 'pass' && record.checks?.some(check => check.result === 'fail' && ['critical', 'high'].includes(check.severity))) errors.push('Passing QA record contains a blocking failed check');
  if (record.defects?.some(defect => defect.status === 'open' && ['critical', 'high'].includes(defect.severity))) errors.push('QA record contains an unresolved Critical/High defect');
  return errors;
}

export function validateOperationalRecords(repoRoot) {
  const errors = [];
  for (const file of files(path.join(repoRoot, '_records', 'qa'))) {
    try { errors.push(...validateQaRecord(JSON.parse(fs.readFileSync(file, 'utf8'))).map(item => `${path.relative(repoRoot, file)}: ${item}`)); }
    catch (error) { errors.push(`${path.relative(repoRoot, file)}: invalid JSON: ${error.message}`); }
  }
  for (const file of files(path.join(repoRoot, '_records', 'accessibility'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.automated_result !== 'PASS' || record.disposition === 'block') errors.push(`${path.relative(repoRoot, file)}: accessibility is blocking`);
    if (record.editorial_alt_review?.length !== 6 || record.editorial_alt_review.some(item => item.result !== 'pass')) errors.push(`${path.relative(repoRoot, file)}: editorial alt review is incomplete`);
  }
  for (const file of files(path.join(repoRoot, '_records', 'analytics'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.privacy?.contains_personal_identifiers !== false) errors.push(`${path.relative(repoRoot, file)}: analytics privacy contract failed`);
    if (!['complete', 'partial', 'unavailable'].includes(record.collection_status)) errors.push(`${path.relative(repoRoot, file)}: analytics status is unsupported`);
  }
  for (const file of files(path.join(repoRoot, '_records', 'trends'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const trend of record.trends || []) {
      if (trend.supporting_story_ids.length !== trend.supporting_stories.length) errors.push(`${path.relative(repoRoot, file)}: trend evidence count mismatch`);
      if (trend.supporting_stories.some(story => story.brief_date < record.evidence_window.start_date || story.brief_date > record.evidence_window.end_date || !story.url.startsWith('/stories/'))) errors.push(`${path.relative(repoRoot, file)}: trend has evidence outside its window or without a stable URL`);
    }
  }
  for (const file of files(path.join(repoRoot, '_records', 'editorial-feedback'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    const guardrails = record.guardrails || {};
    if (!guardrails.popularity_only_selection_prohibited || !guardrails.hard_gates_override_weights || !guardrails.category_balance_preserved || !guardrails.human_approval_required) errors.push(`${path.relative(repoRoot, file)}: editorial guardrails are incomplete`);
  }
  const feedbackDates = new Set();
  for (const file of files(path.join(repoRoot, '_records', 'personal-feedback'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    errors.push(...validatePersonalFeedback(record).map(item => path.relative(repoRoot, file) + ': ' + item));
    if (feedbackDates.has(record.brief_date)) errors.push(path.relative(repoRoot, file) + ': duplicate primary-reader feedback for ' + record.brief_date);
    feedbackDates.add(record.brief_date);
  }
  for (const file of files(path.join(repoRoot, '_records', 'editorial-learning'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    errors.push(...validateEditorialLearning(record).map(item => path.relative(repoRoot, file) + ': ' + item));
  }
  return errors;
}

export function validateUrlContract(repoRoot) {
  const contract = JSON.parse(fs.readFileSync(path.join(repoRoot, '_architecture', 'iteration-0', 'url-contract.json'), 'utf8'));
  const errors = [];
  for (const item of contract.must_preserve) {
    if (!item.producer.includes('<') && !item.producer.includes('YYYY-MM-DD') && !fs.existsSync(path.join(repoRoot, item.producer))) errors.push(`Missing URL producer ${item.producer}`);
  }
  for (const route of contract.frozen_dated_briefs) {
    const date = route.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!fs.existsSync(path.join(repoRoot, 'briefs', `${date}.md`))) errors.push(`Missing frozen brief ${route}`);
  }
  for (const route of contract.frozen_qa_reports) {
    const date = route.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!fs.existsSync(path.join(repoRoot, 'qa', `${date}.md`))) errors.push(`Missing frozen QA route ${route}`);
  }
  return errors;
}

export function validateDerivedParity(edition, repoRoot) {
  const expected = generatedFiles(edition, repoRoot);
  const errors = [];
  for (const [name, content] of expected) {
    const file = path.join(repoRoot, name);
    const normalized = content.endsWith('\n') ? content : `${content}\n`;
    if (!fs.existsSync(file)) errors.push(`${name}: missing derived output`);
    else if (fs.readFileSync(file, 'utf8') !== normalized) errors.push(`${name}: derived output does not match canonical generation`);
  }
  return errors;
}

export function validateIntegratedRepository(edition, repoRoot) {
  const errors = [...validateEdition(edition), ...validateUrlContract(repoRoot), ...validateOperationalRecords(repoRoot), ...validateDerivedParity(edition, repoRoot), ...auditEditionAccessibility(edition, repoRoot).findings.filter(item => ['critical', 'high'].includes(item.severity)).map(item => `${item.code}: ${item.message}`)];
  const atom = fs.existsSync(path.join(repoRoot, 'feed.xml')) ? fs.readFileSync(path.join(repoRoot, 'feed.xml'), 'utf8') : '';
  const json = fs.existsSync(path.join(repoRoot, 'feed.json')) ? fs.readFileSync(path.join(repoRoot, 'feed.json'), 'utf8') : '';
  errors.push(...validateFeeds(atom, json));
  return errors;
}

export function validatePublicationFreshness(edition, expectedDate) {
  return edition.brief_date === expectedDate ? [] : [`stale edition: expected ${expectedDate}, found ${edition.brief_date}`];
}

export function publicationOutcome({expectedBaseline, observedBaseline, stagedValid, pagesConclusion}) {
  if (expectedBaseline !== observedBaseline) return 'aborted_concurrent_update';
  if (!stagedValid) return 'rejected_before_commit';
  if (pagesConclusion !== 'success') return 'degraded_pages_failure';
  return 'published';
}

export function rollbackOutcome({targetExists, restoredTreeValid, pagesConclusion}) {
  if (!targetExists) return 'rollback_failed_missing_target';
  if (!restoredTreeValid) return 'rollback_failed_validation';
  if (pagesConclusion !== 'success') return 'rollback_degraded_pages_failure';
  return 'rolled_back';
}
