import fs from 'node:fs';
import path from 'node:path';
import {formatDate} from './util.mjs';

export function loadQaRecords(repoRoot, days = 30) {
  const dir = path.join(repoRoot, '_records', 'qa');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse().slice(0, days).map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

export function qaMetrics(records) {
  const firstPass = records.filter(record => record.initial_result === 'pass').length;
  const finalPass = records.filter(record => record.final_result === 'pass').length;
  const repairs = records.reduce((sum, record) => sum + record.repairs.length, 0);
  const latency = records.map(record => record.deployment_latency_seconds).filter(Number.isFinite);
  return {runs: records.length, first_pass_rate: records.length ? Math.round(firstPass / records.length * 100) : null, final_pass_rate: records.length ? Math.round(finalPass / records.length * 100) : null, repairs, average_deployment_latency_seconds: latency.length ? Math.round(latency.reduce((a, b) => a + b, 0) / latency.length) : null};
}

export function qaAggregate(records) {
  return {schema_version: '1.0.0', window_days: 30, generated_from: records.map(record => record.record_path), metrics: qaMetrics(records), runs: records.map(record => ({run_id: record.run_id, edition_id: record.edition_id, executed_at: record.executed_at, initial_result: record.initial_result, final_result: record.final_result, repairs: record.repairs.length, deployment_latency_seconds: record.deployment_latency_seconds ?? null}))};
}

export function renderQaDashboard(repoRoot) {
  const records = loadQaRecords(repoRoot);
  const metrics = qaMetrics(records);
  return `---
layout: default
title: Daily AI Brief QA Dashboard
permalink: /qa/
description: A privacy-safe 30-day view of Daily AI Brief publication quality.
---

# 30-Day QA Dashboard

This public dashboard summarizes versioned QA records. It excludes credentials, identities, raw headers, and private operational details.

<div class="qa-metrics" aria-label="Quality metrics">
  <div><strong>${metrics.runs}</strong><span>QA runs</span></div>
  <div><strong>${metrics.first_pass_rate ?? '—'}%</strong><span>First-pass QA</span></div>
  <div><strong>${metrics.final_pass_rate ?? '—'}%</strong><span>Final pass</span></div>
  <div><strong>${metrics.repairs}</strong><span>Recorded repairs</span></div>
  <div><strong>${metrics.average_deployment_latency_seconds ?? '—'}s</strong><span>Average deploy latency</span></div>
</div>

| Edition | Initial | Final | Repairs | Deploy | Deterministic / Editorial |
|---|---:|---:|---:|---:|---|
${records.map(record => `| [${formatDate(record.edition_id.slice(-10))}]({{ '/briefs/${record.edition_id.slice(-10)}/' | relative_url }}) | ${record.initial_result.toUpperCase()} | ${record.final_result.toUpperCase()} | ${record.repairs.length} | ${record.deployment_latency_seconds ?? '—'}s | ${record.checks.filter(item => item.class === 'deterministic').length} / ${record.checks.filter(item => item.class === 'editorial').length} |`).join('\n')}

## How to read this

- **Deterministic checks** are reproducible code, schema, build, synchronization, feed, link, and accessibility checks.
- **Editorial checks** require evidence judgment, novelty assessment, source-quality review, or image-meaning review.
- A failed Critical or High check blocks publication. Medium issues produce a visible degraded state until repaired.

[← Back to Home]({{ '/' | relative_url }})
`;
}
