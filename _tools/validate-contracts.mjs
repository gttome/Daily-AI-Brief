#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolDir, '..');
const contractDir = path.join(rootDir, '_contracts', 'v1');
const manifest = readJson(path.join(contractDir, 'manifest.json'));
const results = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveRef(rootSchema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported external $ref: ${ref}`);
  return ref.slice(2).split('/').reduce((value, key) => value[key.replaceAll('~1', '/').replaceAll('~0', '~')], rootSchema);
}

function isType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function validate(value, schema, rootSchema, pointer = '$') {
  if (schema.$ref) return validate(value, resolveRef(rootSchema, schema.$ref), rootSchema, pointer);
  const errors = [];
  if (schema.oneOf) {
    const branchErrors = schema.oneOf.map(branch => validate(value, branch, rootSchema, pointer));
    const matches = branchErrors.filter(branch => branch.length === 0).length;
    if (matches !== 1) errors.push(`${pointer}: expected exactly one oneOf branch, matched ${matches}`);
    return errors;
  }
  const types = schema.type === undefined ? [] : (Array.isArray(schema.type) ? schema.type : [schema.type]);
  if (types.length && !types.some(type => isType(value, type))) {
    errors.push(`${pointer}: expected type ${types.join('|')}`);
    return errors;
  }
  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) errors.push(`${pointer}: const mismatch`);
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value))) errors.push(`${pointer}: value is not in enum`);

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${pointer}: shorter than minLength`);
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) errors.push(`${pointer}: pattern mismatch`);
    if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push(`${pointer}: invalid date format`);
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) errors.push(`${pointer}: invalid date-time format`);
    if (schema.format === 'uri') {
      try { new URL(value); } catch { errors.push(`${pointer}: invalid URI`); }
    }
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${pointer}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${pointer}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${pointer}: fewer than minItems`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${pointer}: more than maxItems`);
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) errors.push(`${pointer}: duplicate array item`);
    if (schema.items) value.forEach((item, index) => errors.push(...validate(item, schema.items, rootSchema, `${pointer}/${index}`)));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${pointer}: missing required property ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) errors.push(...validate(child, properties[key], rootSchema, `${pointer}/${key}`));
      else if (schema.additionalProperties === false) errors.push(`${pointer}: unexpected property ${key}`);
    }
  }
  return errors;
}

function semanticErrors(name, value) {
  const errors = [];
  if (name === 'edition') {
    const date = value.brief_date;
    const expectedFocus = ['technical_ai_engineering', 'technical_ai_engineering', 'applied_genai_knowledge_workers', 'applied_genai_knowledge_workers', 'agents_non_technical_people', 'agents_non_technical_people'];
    if (value.edition_id !== `dab-edition-${date}`) errors.push('edition_id must match brief_date');
    value.stories?.forEach((story, index) => {
      if (story.ordinal !== index + 1) errors.push(`story ${index + 1}: ordinal must match array position`);
      if (story.focus !== expectedFocus[index]) errors.push(`story ${index + 1}: story focus allocation must be exact 2/2/2 in ordinal order`);
      if (!story.story_id.startsWith(`dab-story-${date}-`)) errors.push(`story ${index + 1}: story_id must match brief_date`);
      if (story.permanent_url !== `/stories/${date}/${story.slug}/`) errors.push(`story ${index + 1}: permanent_url must match date and slug`);
      if (!story.image.path.startsWith(`briefs/images/${date}/`)) errors.push(`story ${index + 1}: image path must match brief_date`);
      if (story.candidate_score) {
        const keys = ['significance', 'freshness', 'authority', 'evidence_quality', 'novelty', 'practical_value', 'category_fit'];
        const total = keys.reduce((sum, key) => sum + story.candidate_score[key], 0);
        if (total !== story.candidate_score.total) errors.push(`story ${index + 1}: candidate score total mismatch`);
      }
      if (story.novelty?.disposition === 'new' && (story.novelty.prior_story_ids.length || story.novelty.what_changed !== null)) errors.push(`story ${index + 1}: new novelty record cannot cite prior coverage`);
      if (story.novelty && story.novelty.disposition !== 'new' && (!story.novelty.prior_story_ids.length || !story.novelty.what_changed)) errors.push(`story ${index + 1}: repeated coverage requires lineage and what_changed`);
      if (value.policy_profile === 'full_v1') {
        for (const field of ['novelty', 'candidate_score', 'what_to_do_now']) if (!story[field]) errors.push(`story ${index + 1}: full_v1 requires ${field}`);
        for (const field of ['evidence_type', 'availability_status']) if (!story.source[field]) errors.push(`story ${index + 1}: full_v1 requires source.${field}`);
      }
    });
    for (const field of ['story_id', 'slug']) {
      const items = value.stories?.map(story => story[field]) || [];
      if (new Set(items).size !== items.length) errors.push(`edition: ${field} values must be unique`);
    }
    const urls = value.stories?.map(story => story.source.normalized_url) || [];
    if (new Set(urls).size !== urls.length) errors.push('edition: normalized source URLs must be unique');
  }
  if (name === 'publication_event') {
    const outputs = new Set(value.file_set?.derived_outputs || []);
    for (const required of [`briefs/${value.edition_id?.replace('dab-edition-', '')}.md`, 'latest.md', 'index.md', 'archive.md', 'README.md']) {
      if (!outputs.has(required)) errors.push(`validated publication event must include all five compatibility outputs: missing ${required}`);
    }
    if (value.phase === 'validated' && (value.commit_sha !== null || value.pages?.conclusion !== 'not_run')) errors.push('validated event cannot claim commit or Pages evidence');
    if (value.phase === 'pages_verified' && (!value.commit_sha || value.pages?.conclusion !== 'success' || !value.pages?.verified_at)) errors.push('pages_verified event requires commit and successful Pages evidence');
  }
  if (name === 'qa_run' && value.final_result === 'pass') {
    const blocking = value.checks?.filter(check => check.result === 'fail' && ['critical', 'high'].includes(check.severity)) || [];
    if (blocking.length) errors.push('PASS QA run cannot contain a failed Critical/High check');
  }
  if (name === 'ledger_entry' && value.entry_type !== value.details?.kind) errors.push('ledger entry_type must match details.kind');
  if (name === 'trend_radar' && value.evidence_window?.start_date > value.evidence_window?.end_date) errors.push('trend evidence window is reversed');
  return errors;
}

function setPointer(target, pointer, value) {
  const parts = pointer.split('/').slice(1).map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'));
  const leaf = parts.pop();
  const parent = parts.reduce((item, part) => item[part], target);
  parent[leaf] = value;
}

for (const contract of manifest.contracts) {
  const schema = readJson(path.join(contractDir, contract.schema));
  const example = readJson(path.join(contractDir, contract.valid_example));
  const schemaHeaderErrors = [];
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') schemaHeaderErrors.push('schema draft must be 2020-12');
  if (!schema.$id || schema.type !== 'object') schemaHeaderErrors.push('schema requires $id and object root');
  const errors = [...schemaHeaderErrors, ...validate(example, schema, schema), ...semanticErrors(contract.name, example)];
  results.push({test: `valid:${contract.name}`, result: errors.length ? 'FAIL' : 'PASS', errors});
}

for (const relative of manifest.negative_examples) {
  const negative = readJson(path.join(contractDir, relative));
  const contract = manifest.contracts.find(item => item.valid_example.endsWith(negative.fixture));
  const schema = readJson(path.join(contractDir, contract.schema));
  const mutated = structuredClone(readJson(path.join(contractDir, contract.valid_example)));
  setPointer(mutated, negative.mutation.path, negative.mutation.value);
  const errors = [...validate(mutated, schema, schema), ...semanticErrors(contract.name, mutated)];
  const matched = errors.some(error => error.includes(negative.expected_failure));
  results.push({test: `invalid:${path.basename(relative)}`, result: errors.length && matched ? 'PASS' : 'FAIL', errors: errors.length && matched ? [] : errors});
}

const failures = results.filter(item => item.result === 'FAIL');
console.log(JSON.stringify({contract_version: manifest.contract_version, result: failures.length ? 'FAIL' : 'PASS', tests: results, passed: results.length - failures.length, failed: failures.length}, null, 2));
process.exitCode = failures.length ? 1 : 0;
