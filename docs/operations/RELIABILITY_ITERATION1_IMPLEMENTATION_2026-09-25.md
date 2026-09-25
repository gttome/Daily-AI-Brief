# Daily Generative AI Brief — Reliability Hardening Iteration 1

**Date:** September 25, 2026  
**Production baseline:** `2dd85e96cd37cfe5926b0e4eb25a567581618c7a`  
**Implementation branch:** `hardening/reliability-iteration1-2026-09-25`

## Mission

Close Wave 1 of the production reliability plan without entering Wave 2.

Iteration 1 addresses:

- **P05 — repeated retrigger/repair recovery**;
- **P11 — incomplete idempotent resume**;
- the recovery-decision portion of **P12 — unified operational status**.

## Implemented architecture

### Content-addressed checkpoints

Every new run-state checkpoint records:

- input paths and input digest;
- dependency paths and dependency digest;
- output paths and output digest;
- baseline SHA;
- current SHA;
- contract version;
- workflow/run evidence.

Historical checkpoints remain readable. They are not rewritten solely to adopt the new digest schema.

### Earliest-invalid-stage recovery

Recovery now compares durable checkpoint hashes against repository bytes and returns:

- failure stage;
- root error;
- earliest invalid stage;
- preserved stages;
- invalidated stages;
- resume stage;
- safe next action.

Applying recovery removes only the invalid stage and its dependent downstream proofs.

### Consequential-action idempotency

A durable action ledger prevents conflicting duplicate operations for:

- publication PRs;
- merges;
- completion persistence;
- Command Center synchronization;
- image-generation actions scoped to a story.

Replaying the identical completed action is treated as reuse rather than a second action.

### Publisher checkpoint reuse

The post-editorial workflow resolves recovery state before image rendering or deterministic expansion.

If `IMAGES_READY` is still valid, the accepted image review is reused.

If `DETERMINISTIC_EXPANSION_READY` is still valid, deterministic expansion, stage generation, Watchlist regeneration, candidate lint, and publication-stage recommit are skipped.

This prevents a workflow retry from redoing already-valid work.

### Duplicate PR guard

The publication workflow now examines all PRs for the staging branch/candidate SHA.

- an existing open PR is reused;
- an already-merged exact candidate suppresses duplicate PR creation;
- a closed unmerged exact candidate fails closed and requires explicit recovery.

### Failure recovery evidence

Failed post-editorial runs emit `/tmp/recovery-decision.json` in the existing handoff evidence bundle.

## Smart testing

CI now executes dependency-selected targeted tests **before** the repository-wide suite.

Iteration 1 targeted coverage includes:

- checkpoint digest integrity;
- earliest-invalid-stage resolution;
- upstream preservation;
- downstream invalidation;
- duplicate consequential-action suppression;
- accepted-image reuse;
- publisher checkpoint reuse;
- duplicate PR suppression;
- recovery-decision evidence.

A bounded synthetic failure matrix injects failures at major lifecycle stages without rebuilding historical Briefs.

## Scope intentionally deferred

Iteration 1 does **not** implement Wave 2:

- no versioned publication manifest consolidation;
- no media/Watchlist contract freeze redesign;
- no broad legacy adapter cleanup;
- no Command Center canonical-state binding;
- no image editorial-quality redesign.

## Closure gate

Iteration 1 is complete only after:

1. affected targeted tests pass first on the exact PR head;
2. full deterministic CI passes on that same head;
3. the PR merges through the protected path;
4. post-merge deterministic CI and Pages deployment pass;
5. no completed editorial, media, Watchlist, or accepted-image work is regenerated during implementation.
