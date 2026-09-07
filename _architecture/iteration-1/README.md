# Iteration 1 - Publication Reliability

Status: shadow evidence in progress

## Scope

- Improvement 1: canonical edition source and generated compatibility views
- Improvement 2: deterministic repository CI
- Improvement 3: atomic one-commit publication
- Improvement 7: deduplicated operational alerting

## Implemented design

The repository now contains a dependency-free Node.js publication engine. The latest verified edition is backfilled into `_data/editions/2026-09-06.json`. The engine imports the legacy Markdown format, validates the six-story and ordered 2/2/2 contract, creates stable story IDs, generates all compatibility views, builds an immutable validated publication event, checks atomic changed paths, normalizes URLs, verifies assets, and produces deterministic semantic digests.

`Deterministic publication CI` runs contract tests, generator tests, repository synchronization checks, atomic change-set validation, and an official GitHub Pages Jekyll build.

`Iteration 1 publication shadow` runs daily after the existing publisher and QA schedule. It compares the dated brief, `latest.md`, and homepage through independent canonical imports; verifies all six images and archive entries; stores immutable evidence as an artifact and on the non-production `iteration-1-shadow` branch; and opens only one unresolved GitHub issue for a repeated failure fingerprint.

`Publish validated candidate` is the production cutover path. It accepts one staging branch containing one canonical edition and exactly six assets, constructs the full candidate from the current `main` head, validates and builds it, creates one complete commit, and updates `main` with a normal fast-forward push. It is manual/dry-run only until the shadow gate passes.

## Safety controls

- Publication mode remains `shadow`.
- Automatic candidate triggering is disabled.
- The active publisher and QA automations remain unchanged during shadow evidence collection.
- A main-branch race makes the fast-forward push fail safely.
- Existing URLs, briefs, images, archive history, and public behavior remain unchanged.
- Rollback target is the last verified production commit named in the publication event.

## Exit gate

Iteration 1 cannot pass until seven consecutive daily shadow records pass, a dry-run candidate completes, an atomic publication is demonstrated without partial visibility, deterministic checks reproduce, alert deduplication is demonstrated, and no Critical/High defect remains.
