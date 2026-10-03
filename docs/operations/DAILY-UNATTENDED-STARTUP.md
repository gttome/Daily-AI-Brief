# Daily unattended startup

This file is the current production startup instruction. It is intentionally **generic**: do not put a specific production run name, run number, historical execution ID, or one-off recovery identity into this instruction. Historical records remain evidence only.

## Daily schedule and edition date

The Daily Brief production controller starts at **19:00 America/Chicago on the evening before the edition date**.

- At a normal 19:00 invocation, the target edition date is the **next America/Chicago calendar day**.
- Resume an existing active nonterminal production execution before allocating anything new.
- If the target edition is already independently `PUBLIC_CLOSED`, do not repeat it.
- If no active nonterminal production execution exists, allocate exactly one new execution for the target edition from current protected `main`.
- Never relabel historical content as a new edition.
- Never reopen a prior terminal execution.

This schedule creates a larger overnight recovery window while preserving the publication-quality and protected-publication contracts.

## Generic terminal-run protection

Every prior terminal production execution is immutable.

Before any allocation, resume, recovery, worker dispatch, or publication action:

1. Read `data/operations/active-production-run.json` and the terminal production records.
2. Apply the generic terminal-run guard from `_generator/lib/run-readiness.mjs`.
3. Recovery may resume only the **exact active nonterminal execution**.
4. If there is no active nonterminal execution, a new target edition may be allocated.
5. A stale pointer, Kanban projection, cached checkpoint, old worker request, timing record, historical prompt, or status document can never reactivate a terminal execution.

No instruction may depend on a named historical production run.

## Required bootstrap

Resolve live protected `main`. Read and bind the current versions/digests of:

- `docs/operations/START-HERE.md`
- `docs/operations/DAILY-UNATTENDED-STARTUP.md`
- `data/operations/production-continuous-improvement-ledger.jsonl`
- `docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md`
- `docs/operations/LIVING-SYSTEM-OPERATIONS.md`
- `docs/operations/CHATGPT-WATCHDOG-RING.md`
- `docs/operations/KANBAN-GOLD-STANDARD.md`
- `docs/operations/IMPROVEMENT-KANBAN.md`
- `data/operations/improvement-kanban.json`
- `docs/operations/task-recovery-contracts.json`
- `docs/operations/run-learning-readiness-contract.json`
- `docs/operations/reliable-edition-execution.md`
- `docs/operations/automated-image-execution.md`
- `docs/operations/native-image-task-delivery.md`
- `docs/operations/image-file-transfer.md`
- `docs/images/publisher-policy.md`
- `docs/operations/publisher-runbook.md`
- `docs/operations/under80-runtime-contract.json`
- `docs/operations/independent-watchlist-and-book-coverage.md`
- `data/operations/active-production-run.json`
- `data/operations/current-edition.json`
- `data/operations/publication-status.json`
- `docs/operations/unattended-image-host.json`

Also read the current active binding, readiness receipt, append-only task events, writer lease/fence, immutable results, worker requests/results, blockers, publication evidence and latest terminal cleanup.

## Task 00 production readiness

Task 00 must fail closed on missing authoritative evidence, but **measurement outputs are never control authority**.

Required control invariants include:

- one production execution identity;
- one fenced writer;
- persistent Supervisor and watchdog;
- generic terminal-run reopen guard enabled and regression-tested;
- all prior terminal executions immutable;
- full cumulative operational-learning ledger inherited;
- no unexplained regression from the latest successful production baseline;
- Kanban derived only from append-only events;
- Kanban, timing, durations and performance metrics are observability only;
- stale/missing/contradictory projections are telemetry defects, not production blockers;
- protected CI and exact-SHA deployment;
- independent live verification before `PUBLIC_CLOSED`;
- zero incremental-cost boundary: no ChatGPT Work, no Codex, no paid model API/service, no billable overage, no new credentials.

A Kanban or timing defect may be repaired separately while production continues from authoritative task events. It may never change task state, authorize a retry, consume retry budget, create a worker, block publication, or reopen an execution.

## Image-host admission and reusable consumption

Current image-route readiness comes only from `docs/operations/unattended-image-host.json` and its bound evidence.

Qualification and reusable consumption are separate gates. A READY qualification with no enabled bound reusable consumer is not image-production-ready.

The reusable scheduled native-image consumer must:

- refresh current durable state and fenced writer authority at invocation;
- treat an embedded writer generation as scheduling provenance only;
- preserve all completed tasks and accepted/locked images;
- use the sealed single-story specification;
- use professional native generation only;
- enforce visible-text/subject controls before persistence;
- persist exact bytes and verify Git read-back identity;
- review the saved Git asset before acceptance;
- use only the bounded same-story recovery contract;
- release authority at a durable Done or Blocked boundary with an explicit handoff to the Supervisor.

No SVG/basic/low-quality fallback, owner upload, alternate account, Work, Codex, paid service or new credential is authorized.

## ChatGPT Watchdog Ring

The GitHub control plane remains the inner liveness authority: Run Supervisor approximately every minute and the GitHub Supervisor watchdog every five minutes. The outer ChatGPT Watchdog Ring uses six ordinary exact-hourly Scheduled tasks at minutes **03, 13, 23, 33, 43 and 53**, giving a nominal ten-minute independent recovery check.

Every ring member uses the same generic state machine. Healthy or legitimately waiting executions cause no mutation. If another ring member owns an unexpired recovery lease, the arriving member exits. A real stall uses the execution-scoped coordination lease at `_records/edition-execution/watchdog-leases/<execution-id>.json`, then still obeys the existing production writer/fence before any production mutation.

The recovery lease lasts approximately fifteen minutes, uses optimistic Git blob concurrency, and is released at a durable boundary. Actual stall/recovery evidence is append-only under `_records/edition-execution/watchdog-events/<execution-id>/`; healthy checks write nothing.

Recovery uses the minimum authorized action: reconcile authoritative state, re-dispatch the same executor, restore same-execution authority only after a proven dead/released owner, consume the exact newest queued request, then perform a minimal protected repair only if necessary. A dispatch, retry, lease/heartbeat, Kanban refresh, queue change or status update is never success by itself. Recovery is complete only after substantive forward progress is verified.

Slot F is the repurposed former Recovery schedule and remains the durable registered reusable native-image consumer. All six members can safely evaluate an exact queued native request, but any takeover still requires the recovery lease plus current writer authority, preserves every accepted_locked image, and follows the existing Supervisor handoff.

## Daily execution and recovery

Drain all dependency-safe work in the same invocation whenever possible.

Preserve:

- six stories in exact 2/2/2 allocation;
- exactly one reusable Agent Skills story;
- two verified videos;
- two source-diverse verified podcasts with verified runtimes;
- verified source reading time for every article;
- independent Watchlist discovery;
- all-four-book relevance review with reader-facing value;
- six professional story-specific images;
- protected CI;
- exact-SHA Pages deployment;
- independent live verification;
- terminal cleanup and learning reconciliation.

Append every actual task transition immediately with exact UTC `from`, `to`, `at`, reason and proof. Unknown timing stays unknown.

A route-specific blocker never becomes a global stop. Continue every dependency-safe operation and preserve the exact blocker for the unavailable route.

## Repository-task liveness

Queued repository work must receive explicit consumer dispatch. A repository request without substantive durable worker progress for approximately 60 seconds is a route-scoped `repository_consumer_unclaimed` liveness fault.

Supervisor lease acquisition, renewal, heartbeat, Kanban reprojection and queue bookkeeping do not count as substantive worker progress.

Recovery consumes only the exact queued request for the same execution. It never allocates another execution, skips a task, repeats completed work or regenerates accepted images.

## Publication and closure

Freeze candidate writes before protected publication.

Publication requires:

1. exact candidate identity;
2. protected deterministic CI on that exact head;
3. current protected-main authorization for the exact active execution;
4. exact-SHA merge/deployment;
5. independent live verification;
6. durable validated-publication evidence;
7. `PUBLIC_CLOSED`;
8. Task 29 cleanup, learning reconciliation and next-edition readiness.

Closeout repairs preserve accepted reader content unless a separate explicit reader correction is authorized.

## Persistent automation identities

- Daily production controller: `6abeba31fe28819184544abf70874a80`
- Watchdog Ring Slot F / durable scheduled native-image consumer: `6abeb9a2b8a88191949dc420d5e10feb` (hourly at minute 53)
- Daily live validation and secondary recovery: `6aadf3587b1c8191846a078f49102633`

Watchdog Slots A–E are additional generic hourly members at minutes 03, 13, 23, 33 and 43. These identities are reusable service bindings. Their instructions must remain generic and must never name a particular production run.

Configuration is not completion evidence. Only durable task/publication evidence establishes progress or closure.
