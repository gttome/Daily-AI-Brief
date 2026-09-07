# Iteration 2 — Editorial Intelligence

Status: **PASS — lifecycle gate complete**  
Scope: improvements #4, #5, #6 and #9  
Production baseline: `15ee5a1aaedaaaf12a4e18c52c397551bd27d35e`

## Implemented design

### #4 — 30-day Story Memory / Novelty Gate

`_generator/lib/historical.mjs` reads every dated brief format in the active 30-day window, including the earlier five-story editions, and creates normalized source URLs, stable historical story IDs and deterministic concept tokens. `_generator/lib/novelty.mjs` combines source identity with headline-concept similarity. A match may not be published as `new`; it requires `material_update` or `approved_repeat`, prior story IDs and a non-empty explanation of what changed.

The frozen backfill ending September 6 covers all 21 available editions in the 30-day window and 119 stories. It found two published items that would have required material-update review:

- Google Meet AI-note pause controls: August 26 → September 1.
- ChatGPT Healthcare/Epic context: September 2 → September 4.

This is retrospective evidence, not a rewrite or correction of the historical archive.

### #5 — Candidate scoring before selection

The candidate-pool contract requires 20–30 candidates. Every candidate receives integer 0–5 scores for significance, freshness, authority, evidence quality, novelty, practical value and category fit, with an arithmetically verified total and written score rationale. Exactly six may be selected, with ordered 2/2/2 allocation and a selection rationale; every rejected candidate needs a rejection reason. A valid 20-candidate fixture demonstrates the gate.

Legacy editions did not retain unselected candidates, so a counterfactual re-ranking cannot be reconstructed honestly. The measurable change is from zero retained candidate-pool explanations in the legacy archive to 100% required coverage for future pools.

### #6 — Evidence classification

The `editorial_intelligence_v1` policy now requires `source.evidence_type` and `source.availability_status` for every selected story. Generated reader output displays both labels. The vocabulary distinguishes official announcements, documentation, changelogs, repositories, research, standards/government, independent evaluation, authoritative reporting and practitioner analysis, plus product/research maturity states.

### #9 — Formal correction history

Material factual corrections and incidents use append-only JSON Lines ledgers under `_records/ledgers/`. CI compares the new file with its baseline and rejects modification or deletion of existing bytes. A later entry may supersede an earlier ID without erasing it. Mechanical presentation and synchronization repairs stay in QA/incident records rather than inflating the public correction history.

## Acceptance and rollback

- Story memory, candidate pool and ledger contracts are versioned under `_contracts/v1/`.
- Generated memory and backtest evidence are deterministic for the same repository state.
- The publication transaction must include the dated candidate pool and refreshed 30-day memory when `editorial_intelligence_v1` is active.
- The pre-change production commit is the rollback target. Reverting the Iteration 2 merge restores the prior publisher policy and renderer without altering any dated public URL or historical brief.

## Gate evidence

- Iteration 2 merge: `2337dbef1a379f46be5f9024444eb385dbd26397`.
- Candidate CI: run `34146410409`, PASS.
- Publisher payload repair: merge `3bd692723144a1516e1269c002baa7276b1fd7b1`; repair CI run `34147431408`, PASS.
- Live editorial-intelligence publication: `39638bef649813f33b2dd172513164c15dadd83d` contains the September 7 canonical edition, 20-candidate record, 30-day memory, six assets, and synchronized derived views.
- Production CI run `34149860871` and Pages run `34149860638`: PASS.
- Live homepage, dated brief, and `/briefs-archive/` smoke checks: HTTP 200.

## Known limitations

- Concept matching is intentionally conservative and still requires editorial judgment for semantic edge cases.
- Only 21 editions exist inside the requested 30-day calendar window.
- Historical briefs preserve selected stories but not the rejected 20–30-candidate pools, so past selection changes cannot be reconstructed without inventing evidence.
