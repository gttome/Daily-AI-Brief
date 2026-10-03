---
layout: default
title: Daily AI Brief QA Dashboard
permalink: /qa/
description: A privacy-safe 30-day view of Daily AI Brief publication quality.
---

# 30-Day QA Dashboard

This public dashboard summarizes versioned QA records. It excludes credentials, identities, raw headers, and private operational details.

<div class="qa-metrics" aria-label="Quality metrics">
  <div><strong>12</strong><span>QA runs</span></div>
  <div><strong>25%</strong><span>First-pass QA</span></div>
  <div><strong>100%</strong><span>Final pass</span></div>
  <div><strong>22</strong><span>Recorded repairs</span></div>
  <div><strong>49s</strong><span>Average deploy latency</span></div>
</div>

| Edition | Initial | Final | Repairs | Deploy | Deterministic / Editorial |
|---|---:|---:|---:|---:|---|
| [September 18, 2026]({{ '/briefs/2026-09-18/' | relative_url }}) | FAIL | PASS | 1 | —s | 6 / 2 |
| [September 17, 2026]({{ '/briefs/2026-09-17/' | relative_url }}) | FAIL | PASS | 2 | 56s | 9 / 7 |
| [September 16, 2026]({{ '/briefs/2026-09-16/' | relative_url }}) | FAIL | PASS | 2 | —s | 9 / 7 |
| [September 15, 2026]({{ '/briefs/2026-09-15/' | relative_url }}) | FAIL | PASS | 2 | —s | 9 / 5 |
| [September 14, 2026]({{ '/briefs/2026-09-14/' | relative_url }}) | FAIL | PASS | 2 | 47s | 8 / 5 |
| [September 13, 2026]({{ '/briefs/2026-09-13/' | relative_url }}) | FAIL | PASS | 4 | —s | 9 / 5 |
| [September 12, 2026]({{ '/briefs/2026-09-12/' | relative_url }}) | FAIL | PASS | 2 | —s | 10 / 6 |
| [September 11, 2026]({{ '/briefs/2026-09-11/' | relative_url }}) | FAIL | PASS | 2 | —s | 7 / 4 |
| [September 10, 2026]({{ '/briefs/2026-09-10/' | relative_url }}) | FAIL | PASS | 3 | —s | 4 / 4 |
| [September 9, 2026]({{ '/briefs/2026-09-09/' | relative_url }}) | PASS | PASS | 1 | 47s | 5 / 3 |
| [September 8, 2026]({{ '/briefs/2026-09-08/' | relative_url }}) | PASS | PASS | 1 | —s | 3 / 2 |
| [September 7, 2026]({{ '/briefs/2026-09-07/' | relative_url }}) | PASS | PASS | 0 | 47s | 3 / 1 |

## How to read this

- **Deterministic checks** are reproducible code, schema, build, synchronization, feed, link, and accessibility checks.
- **Editorial checks** require evidence judgment, novelty assessment, source-quality review, or image-meaning review.
- A failed Critical or High check blocks publication. Medium issues produce a visible degraded state until repaired.

[← Back to Home]({{ '/' | relative_url }})
