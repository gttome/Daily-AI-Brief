---
layout: default
title: Daily AI Brief QA Dashboard
permalink: /qa/
description: A privacy-safe 30-day view of Daily AI Brief publication quality.
---

# 30-Day QA Dashboard

This public dashboard summarizes versioned QA records. It excludes credentials, identities, raw headers, and private operational details.

<div class="qa-metrics" aria-label="Quality metrics">
  <div><strong>1</strong><span>QA runs</span></div>
  <div><strong>100%</strong><span>First-pass QA</span></div>
  <div><strong>100%</strong><span>Final pass</span></div>
  <div><strong>0</strong><span>Recorded repairs</span></div>
  <div><strong>47s</strong><span>Average deploy latency</span></div>
</div>

| Edition | Initial | Final | Repairs | Deploy | Deterministic / Editorial |
|---|---:|---:|---:|---:|---|
| [September 7, 2026]({{ '/briefs/2026-09-07/' | relative_url }}) | PASS | PASS | 0 | 47s | 3 / 1 |

## How to read this

- **Deterministic checks** are reproducible code, schema, build, synchronization, feed, link, and accessibility checks.
- **Editorial checks** require evidence judgment, novelty assessment, source-quality review, or image-meaning review.
- A failed Critical or High check blocks publication. Medium issues produce a visible degraded state until repaired.

[← Back to Home]({{ '/' | relative_url }})
