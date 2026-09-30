# Daily AI Brief Architecture and Contracts

Status: Iteration 0 candidate for approval  
Design version: 1.0.0  
Baseline repository head: `b70bc37b4e190750eda08842bfe3ee09995c0b8a`  
Baseline date: 2026-09-07  
Production behavior: unchanged

## 1. Decision summary

The Daily AI Brief will move from prompt-managed duplicate files to a canonical-record publication system. One versioned JSON edition record will own all editorial facts. A deterministic generator will create the dated brief, homepage, latest copy, archive entries, permanent story pages, search index, feeds, and safe machine-readable outputs. Generated outputs are never edited by hand.

This document freezes the architecture before implementation. Iteration 0 does not modify `main`, production automations, public pages, historical briefs, or existing URLs.

## 2. Current system baseline

The inspected repository contains 151 paths at the baseline head, including 21 dated briefs from 2026-08-17 through 2026-09-06, 95 dated image assets, three dated QA reports, and the current Jekyll layout/share assets.

Current publication facts are duplicated across:

- `briefs/YYYY-MM-DD.md`
- `latest.md`
- `index.md`
- `archive.md`
- `README.md`

The September 6 recovery required separate commits for six graphics, the dated brief, latest, homepage, archive, README, QA report, and QA index. The final repository head has a successful Pages deployment, but repository-owned deterministic CI is absent, `main` is not protected, and the active publisher/QA automations write files directly.

The current automation schedule is:

- Daily AI Brief publisher: 7:00 AM America/Chicago
- Daily Brief QA + Repair: 7:20 AM America/Chicago

The current edition contract is six stories with exact 2/2/2 allocation: two Technical AI Engineering, two Applied Generative AI for Knowledge Workers, and two Agents for Non-Technical People.

## 3. Architectural invariants

1. One editorial fact has one authoritative storage location.
2. A publication is one compare-and-swap update of `main` containing every required source, asset, derived page, feed, and operational record.
3. No generated view is manually maintained.
4. Every deterministic check is reproducible from a repository checkout without ChatGPT judgment.
5. Editorial judgments are recorded explicitly and never represented as deterministic checks.
6. Correction and incident history is append-only.
7. Schemas are versioned; records name the schema version that validates them.
8. Existing public URLs and archive history are permanent.
9. No secret, credential, private identity, raw header, or sensitive operational value is stored in the public repository.
10. The future Command Center consumes stable machine-readable records and never infers system truth by scraping rendered pages.

## 4. Authority model

| Concern | Authoritative source | Derived consumers |
|---|---|---|
| Edition and stories | `_data/editions/YYYY-MM-DD.json` | Brief, homepage, latest, archive, story pages, feeds, search index |
| Story image binary | `briefs/images/YYYY-MM-DD/<asset>` | Brief and story pages |
| Status/evidence vocabulary | `_contracts/v1/status-vocabulary.json` | Schemas, generator, QA, reader labels |
| Publication run events | `_records/publication/YYYY-MM-DD/<run-id>.<phase>.json` | QA, alerting, Command Center |
| QA run | `_records/qa/YYYY-MM-DD/<run-id>.json` | QA page, 30-day dashboard, Command Center |
| Corrections/incidents | `_records/ledgers/*.jsonl` | Public correction page, QA, Command Center |
| Analytics daily aggregate | `_records/analytics/YYYY-MM-DD.json` | QA dashboard, Trend Radar, feedback loop |
| Trend snapshot | `_records/trends/YYYY-MM-DD.json` | Trend Radar and editorial feedback |
| Editorial feedback | `_records/editorial-feedback/YYYY-MM.json` | Candidate weighting guidance |

All `_records` content is safe for a public GitHub repository. Reader-facing files under `data/` are sanitized generated projections, not a second authority.

## 5. Stable identifiers

- Edition ID: `dab-edition-YYYY-MM-DD`
- Story ID: `dab-story-YYYY-MM-DD-XXXXXXXX`, where `XXXXXXXX` is an eight-character lowercase hexadecimal value minted once from the initial edition/date/source identity and never recomputed after a correction
- Run ID: `dab-<publication|qa>-YYYYMMDDTHHMMSSZ-XXXXXXXX`
- Ledger ID: `dab-<correction|incident>-YYYYMMDDTHHMMSSZ-XXXXXXXX`
- Alert ID: `dab-alert-YYYYMMDDTHHMMSSZ-XXXXXXXX`

Display order, title, slug, source URL, and status may change through a traceable correction. The IDs do not.

## 6. Target repository layout

```text
_contracts/v1/                 Versioned schemas, vocabulary, fixtures
_data/editions/                Canonical edition records
_records/publication/          Append-only publication runs
_records/qa/                   Append-only QA runs
_records/ledgers/              Append-only correction and incident ledgers
_records/analytics/            Privacy-conscious daily aggregates
_records/trends/               Traceable trend snapshots
_records/editorial-feedback/   Monthly learning records
_generator/                    Deterministic renderer and validators
briefs/                        Generated dated brief pages; existing paths preserved
briefs/images/                 Stable source assets; existing paths preserved
stories/                       Generated permanent story pages
data/                          Generated safe feeds, indexes, and public aggregates
qa/                            Generated public QA pages; existing paths preserved
index.md                       Generated homepage
latest.md                      Generated latest copy for compatibility
archive.md                     Generated archive at /briefs-archive/
README.md                      Generated repository archive section
feed.xml                       Generated Atom/RSS-compatible feed
feed.json                      Generated JSON Feed
```

## 7. Publication state machine

`draft -> staged -> validated -> published`

Failure paths are explicit:

- `draft|staged|validated -> failed`
- `published -> degraded` when production evidence is incomplete or a non-blocking defect is confirmed
- `published|degraded -> rolled_back` after a traceable rollback commit
- a corrected successor publication references the prior run; it does not rewrite the run record

Only a validated staged tree can update `main`. The publisher reads the current `main` SHA immediately before the update and uses compare-and-swap semantics. If `main` moved, publication fails safely and must be rebuilt against the new head. Publication history is event-based: the atomic edition commit contains the immutable `validated` event; later Pages verification appends a separate `pages_verified` or `failed` event. No record is edited to manufacture post-commit evidence that did not yet exist.

## 8. Quality model

Deterministic checks include schema validity, exactly six stories, exact 2/2/2 allocation, required fields, unique IDs, normalized/unique primary URLs within an edition, image existence, image dimensions/safe references, generated-output parity, link syntax, feed validation, Jekyll build, URL-manifest preservation, accessibility automation, and one-commit change-set completeness.

Editorial checks include significance, factual synthesis, novelty justification, evidence quality, image meaning/quality, implications for George's work, and the value of `What to do now`. These judgments are recorded with evidence and reviewer status; they are not falsely labeled deterministic.

## 9. Improvement-to-contract map

| Improvement | Contract established in Iteration 0 |
|---|---|
| 1 | Canonical edition schema and authority map |
| 2 | Deterministic validation classes and run record |
| 3 | Atomic compare-and-swap publication transaction |
| 4 | Stable story ID, normalized source URL, repeat lineage |
| 5 | Candidate score fields and selection rationale |
| 6 | Evidence and availability vocabularies |
| 7 | Alert record, fingerprint, and deduplication state |
| 8 | QA-run schema and public aggregate boundary |
| 9 | Append-only correction entry |
| 10 | Stable story ID, slug, URL, and social metadata |
| 11 | Privacy-conscious aggregate analytics schema |
| 12 | Search/filter fields in story records |
| 13 | Feed-generation fields and stable canonical URLs |
| 14 | Accessibility result class and severity handling |
| 15 | Trend snapshot with evidence window and story links |
| 16 | Required `what_to_do_now` action contract |
| 17 | Monthly feedback schema with anti-popularity safeguards |

## 10. Iteration boundaries

Iteration 1 may implement improvements 1, 2, 3, and 7 only after this design is approved. The migration begins in shadow mode and cannot replace the active publisher until semantic parity, deterministic replay, atomicity, and rollback tests pass.

The Command Center remains out of scope until all 17 improvements pass the required seven-day production burn-in.
