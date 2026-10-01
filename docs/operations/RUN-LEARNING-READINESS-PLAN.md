# Daily AI Brief — Living Run Learning, Cleanup and Readiness Plan

**Policy:** This document is revised after every production run and is used before every subsequent production run. It is a living production baseline, not a historical narrative. When a run reaches either independently verified `PUBLIC CLOSED` or terminal `FAILED`, the final cleanup and promotion-review tasks update the durable evidence and, when required, this plan.

## Core rule

A successful run changes the baseline. The next run must inherit what worked, preserve proven paths, correct demonstrated failures, and pass Production Readiness Validation before content production starts.

## Mandatory run shape

Every production run has:

1. **Task 00 — Production Readiness Validation**
2. Bind edition, execution identity, original cutoff and baseline.
3. Start the production controller and a **run-scoped keeper**.
4. Produce and validate the Brief using the locked production contracts.
5. Reach one terminal production state:
   - `PUBLIC CLOSED` after independent live verification, or
   - `FAILED` with preserved evidence and no publication claim.
6. **Task 29 — Run Cleanup + Next-Run Readiness**
7. **Run Promotion Review** to revise this plan when new evidence warrants it.

A one-shot schedule may trigger a run start, but it must never be the sole liveness mechanism.

## Task 00 — Production Readiness Validation

Task 00 must PASS before editorial/content work begins. It validates:

### Control plane
- exactly one writer;
- production controller available;
- run-scoped keeper created, enabled and bound to this edition;
- keeper remains responsible through terminal cleanup;
- stale-Active threshold is no more than 15 minutes;
- no competing writer or stale prior-run executor.

### Previous-run cleanup
- preceding run has a terminal receipt;
- preceding run cleanup receipt is PASS;
- run-specific temporary continuations are disabled;
- no stale leases/writers remain;
- event ledger/Kanban timing is reconciled;
- prior public production is preserved.

### Successful-run inheritance
Compare the new run to the most recent independently verified `PUBLIC CLOSED` run. The new run must inherit the proven:
- controller pattern;
- keeper/liveness pattern;
- image-production path;
- publication path;
- exact timing/event-ledger contract;
- no-incremental-cost boundary.

Any unexplained regression blocks start.

### Image pipeline
The production image path is locked to:

`production-image-execution-v2: generate → transfer exact file → verify content identity → review saved asset → accept/reject → accepted_locked`

Requirements:
- **mandatory small-PNG persistence path on every run:** immediately after each native image is generated, preserve the exact PNG bytes and persist those same bytes to GitHub before moving to review;
- preferred transport for small PNGs is direct Git Data API `create_blob` with the complete Base64 payload, followed by tree/commit/non-force branch update and content-identity verification;
- if a single Base64 payload is impractical in the active execution context, use the already-proven bounded Base64-chunk bridge: split the exact PNG bytes into temporary text chunks, reconstruct/decode them automatically, verify SHA-256, commit the PNG, then remove temporary transport artifacts;
- do not search across conversations, request owner uploads, regenerate a still-recoverable accepted-quality image, or invent a new transport architecture when one of the two standard small-PNG routes is available;
- Task 00 must verify that at least one supported small-PNG persistence route is available **before** content production begins;
- six story-specific professional images;
- high-detail professional textbook/editorial standard;
- no people unless policy changes explicitly;
- exact allowed visible text and verified factual support;
- immediate exact-byte capture;
- inspect the saved asset, not an unsaved proxy;
- reject/retry only the affected image;
- **no SVG/basic-diagram substitution**;
- **no low-quality fallback**.

### Timing and Kanban
- append-only transition events are authoritative;
- every state move has an exact timestamp;
- missing times are never inferred;
- Kanban is derived from transition events;
- executor liveness is displayed independently from task state;
- an Active task with no durable progress for 15 minutes must be resumed or explicitly moved to Blocked with blocker/recovery evidence.

### Content contract
- exactly six stories;
- exact 2 / 2 / 2 allocation;
- exactly one reusable Agent Skills story;
- article freshness policy `article-24-72-168-v1`;
- two verified videos;
- two source-diverse verified podcasts;
- independent Emerging AI Watchlist refresh;
- relevance review of all four Professional Series books;
- six professional story images.

### Publication contract
- protected CI;
- exact approved SHA;
- exact-SHA deployment;
- independent live verification;
- `PUBLIC CLOSED` is the only publication success state;
- terminal cleanup still runs after `PUBLIC CLOSED`.

### Cost boundary
No ChatGPT Work, Codex, paid APIs/services, billable overage, alternate accounts or new credentials.

## Liveness contract

The run-scoped keeper is mandatory from Task 00 PASS through terminal cleanup.

If an Active task has no durable progress for 15 minutes:
1. inspect whether an executor is genuinely running;
2. resume the **same** durable operation if safe;
3. otherwise write an exact `Active → Blocked` transition with blocker and recovery action.

Never leave an apparently Active task silently stalled.

## Final Task 29 — Run Cleanup + Next-Run Readiness

Runs are not operationally finished merely because publication succeeded.

After `PUBLIC CLOSED` or `FAILED`, Task 29:
- disables run-specific executors/temporary continuations;
- verifies no writer remains active;
- clears stale leases and run pointers;
- reconciles event ledger and Kanban;
- freezes all final timing values;
- preserves immutable accepted artifacts and failure evidence;
- confirms protected production state;
- removes temporary/probe inputs from future production eligibility where appropriate;
- writes a cleanup receipt;
- sets `next_run_ready=true` only after every cleanup check passes.

Terminal sequence:

`PUBLIC CLOSED → CLEANUP → NEXT-RUN READY`

or

`FAILED → CLEANUP → NEXT-RUN READY`

## Run Promotion Review

After Task 29, record:
- **Keep:** mechanisms that materially contributed to success and must become defaults.
- **Fix:** demonstrated defects requiring permanent correction/regression coverage.
- **Simplify:** non-value-add complexity or latency that can be removed safely.
- **Validate next:** properties the next Task 00 must prove before starting.

If the review changes a production invariant, update this plan, the versioned contract, regression tests and operating guidance in the same protected change set.

A run with no new problems may produce an empty Fix section. The goal is for repeated successful runs to converge toward stable operations rather than continually adding machinery.

## October 1, 2026 Run 3 lesson incorporated

Run 3 demonstrated four regressions that are now prohibited:
- a one-shot start without persistent run liveness;
- a task shown Active after its executor had stopped;
- a repository-generated SVG shortcut substituting for the proven professional image path;
- starting a new run without verifying inheritance from the latest successful run.

These failures are the reason Task 00, Task 29, the run-scoped keeper and successful-run inheritance gate are now mandatory.

## October 1, 2026 Run 4 transport lesson incorporated

Run 4 reconfirmed that small PNG transport must be treated as a solved, repeatable production primitive rather than rediscovered during each run.

For every image on every production run, repeat this sequence:

`generate PNG → capture exact bytes immediately → persist with direct Base64 create_blob OR bounded Base64-chunk bridge → verify exact content identity → review saved Git asset → accept/retry`

The transport choice is implementation detail; preserving and verifying the exact generated bytes is the invariant. If direct Base64 transport is available, use it. If not, use the bounded chunk bridge. Do not introduce a third path unless both proven routes are demonstrably unavailable.

## Machine implementation

- Contract: `docs/operations/run-learning-readiness-contract.json`
- Library: `_generator/lib/run-readiness.mjs`
- CLI: `node _tools/run-readiness.mjs ...`
- Regression tests: `_generator/test/run-readiness.test.mjs`
- Per-run readiness receipts: `_records/edition-execution/readiness/<edition-id>.json`
- Per-run terminal cleanup receipts: `_records/edition-execution/cleanup/<edition-id>.json`
- Per-run promotion reviews: `_records/run-learning/<edition-id>.json`
