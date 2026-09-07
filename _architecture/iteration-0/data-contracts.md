# Data Contracts

Contract version: 1.0.0

## Canonical edition

`_data/editions/YYYY-MM-DD.json` is the sole editorial source of truth for an edition. It contains edition metadata, exactly six ordered story records, optional Worth Watching entries, the editorial takeaway, and provenance. The record validates against `edition.schema.json`.

Each story owns its title, focus, event date, topics, image metadata, summary, why-it-matters analysis, implication for George's work, source evidence, novelty lineage, candidate scoring, permanent slug, social metadata, and `what_to_do_now` action. Derived pages may transform presentation but may not introduce new editorial facts.

### Focus allocation

Positions 1-2 must be `technical_ai_engineering`; positions 3-4 must be `applied_genai_knowledge_workers`; positions 5-6 must be `agents_non_technical_people`. The generator validates both count and position.

### Source normalization

The canonical source URL is stored verbatim and with a normalized comparison value. Normalization lowercases the scheme and host, removes fragments, removes default ports, removes recognized tracking parameters, sorts remaining query parameters, and normalizes an empty path to `/`. It does not follow redirects or collapse distinct publisher paths.

### Novelty lineage

`novelty.disposition` is one of `new`, `material_update`, or `approved_repeat`. A material update or approved repeat must cite prior story IDs and explain what changed. The 30-day gate uses concepts plus normalized URLs; URL equality alone is not the complete novelty test.

### Candidate scoring

The seven dimensions are significance, freshness, authority, evidence quality, novelty, practical value, and category fit. Each is an integer from 0 to 5. `total` is their sum and selection rationale is required. Hard evidence, recency, novelty, and 2/2/2 constraints remain selection gates; total score is not an automatic selection mandate.

## Publication run events

Every attempt receives a stable run ID and one or more immutable phase records. The `validated` record names the input edition, baseline main SHA, staged tree digest, generator/schema versions, checks, intended file set, and rollback target. It is included in the atomic edition commit. Later `commit_created`, `pages_verified`, `failed`, or `rolled_back` records append evidence that did not exist at validation time. The current run state is a derived projection over those records.

The atomic edition transaction is complete only when one commit contains the canonical edition, all assets, every derived view, the validated publication event, and any required alert/ledger additions known before commit. A concurrent head change is `failed`, never retried by overwriting the new head. Pages verification may add an operational-only record afterward but may not alter edition content.

## QA run

Every QA execution receives an immutable machine-readable record and a human-readable generated projection. Checks are typed `deterministic` or `editorial`. A repaired run links to the publication/repair commit and preserves the initial result. The latest daily status is a derived value; prior runs remain append-only.

## Ledger entry

Correction and incident entries share an envelope with stable ID, timestamps, status, evidence, affected URLs, and relationship IDs. Correction entries include the prior fact, corrected fact, reason, materiality, and affected story/edition. Incident entries include severity, user impact, probable cause, confidence, corrective action, approval state, resolution, and rollback evidence.

An entry is never edited to conceal history. Later information is a new related entry. Git history alone is not the ledger.

## Alert

Alerts have a deterministic fingerprint over type, affected component, failure class, and edition/run identity. One unresolved fingerprint creates one active alert. Repeated observations increment occurrence metadata without producing duplicate user notifications unless severity, impact, evidence, or state materially changes.

## Analytics aggregate

Only aggregate events are stored: story views, source clicks, share initiations, Worth Watching clicks, and retention buckets. No reader identifier, IP address, email address, cookie value, raw user agent, or raw request header is permitted. Small-count suppression is configurable and recorded. Analytics are evidence, not editorial authority.

## Trend Radar

A trend snapshot declares a 7-30 day evidence window, classification (`accelerating`, `emerging`, `stable`, `cooling`), method version, confidence, and supporting story IDs. Every classification must trace to dated stories inside the declared window.

## Editorial feedback

Monthly feedback records engagement, coverage balance, source quality, and learning hypotheses. It may recommend bounded candidate-weight adjustments but cannot override primary evidence, novelty, category allocation, safety, or editorial judgment gates.

## Versioning

Schemas use semantic versions. Additive optional fields are a minor version. New required fields, changed semantics, removed fields, identifier changes, or enum removals are a major version. Documentation-only corrections are a patch. Records remain valid against the schema version they name, and migrations create new records or explicit derived projections rather than silently rewriting append-only history.
