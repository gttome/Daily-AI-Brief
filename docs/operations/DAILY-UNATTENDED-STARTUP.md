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

Recovery uses the Fix-to-Progress ladder: reconcile authoritative state, re-dispatch the same executor, restore same-execution authority only after a proven dead/released owner, consume the exact newest queued request, then perform a minimal protected repair when necessary. **One failed corrective action can never end an actionable recovery.** After every action, re-read durable state and continue through the next-smallest applicable safe authorized option until a real executor is active and substantive durable forward progress is proven. A dispatch, retry, lease/heartbeat, Kanban refresh, queue change or status update is never success by itself. `BLOCKED_EXTERNAL` requires verified external evidence; failed internal repair attempts alone do not qualify. If an invocation must yield at a safe boundary while the incident remains actionable, persist unresolved continuation evidence and hand it to the next Watchdog slot. That handoff is not recovery success.

The Watchdog Ring itself is the durable registered reusable native-image consumer pool. Slots A–F are operationally equivalent. For an exact queued, unclaimed Tasks 11–16 `native_chatgpt` request, the next eligible slot may consume it immediately without waiting for stale/block classification. Exact request identity plus current task-specific writer fencing ensures only one slot generates the image. All slots preserve every accepted_locked image and follow the existing Supervisor handoff.

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
- Watchdog Ring native-image consumer pool: Slots A–F at minutes 03/13/23/33/43/53; all six are equivalent eligible consumers. The historical F automation identity remains part of the pool but has no unique production capability.
- Daily live validation and secondary recovery: `6aadf3587b1c8191846a078f49102633`

Watchdog Slots A–F are six equivalent generic hourly members at minutes 03, 13, 23, 33, 43 and 53. These identities form one reusable service pool. Their instructions must remain generic and must never name a particular production run.

Configuration is not completion evidence. Only durable task/publication evidence establishes progress or closure.

---

## Protected Repair Executor — unattended recovery boundary

The unattended system includes the repository-native \`Daily AI Brief Protected Repair Executor\` workflow. Its purpose is to cross protected PR/CI/merge boundaries for an already-diagnosed bounded repair without owner intervention.

The executor runs on the protected control plane, consumes durable \`protected-repair-required-v1\` records from the active nonterminal execution, revalidates the exact active execution and first incomplete task, opens or reuses exactly one repair PR, requires deterministic CI on the recorded repair head, merges only that head, and dispatches the **same** production execution for **same-task** resume.

The Supervisor must release its production writer at the protected-repair safe boundary rather than holding a broad six-hour lease while another control-plane executor works. Supervisor writer leases use short renewable authority; an unexpired different owner can be superseded only from exact terminal GitHub Actions evidence (\`completed/failure\` or \`completed/cancelled\`). A boolean takeover request by itself is never sufficient.

**Startup/recovery invariant:** an actionable incident cannot terminate because “PR required,” “CI required,” “owner retry required,” “dead writer still leased,” or “resume task required.” Those are internal recovery stages. The system must continue until the same task has a real executor and substantive durable progress, or an exact external blocker is proved.

<!-- oct4-missed-start-validation -->
## October 4 missed-start evidence and next-run requirement

The October 4 edition did **not** enter through the normal 19:00 America/Chicago allocation path; it was allocated later by `MISSED_START_RECOVERY`. The fallback correctly proved the prior execution terminal and allocated exactly one target-edition execution, but fallback success does not certify the normal schedule.

For the next edition:

1. record durable evidence that the 19:00 controller ran and either resumed the exact active execution or allocated exactly one next-day execution;
2. if no allocation/resume occurs inside the startup envelope, emit a missed-start alert/receipt rather than waiting for an owner status question;
3. fallback may allocate only after proving no active nonterminal target execution exists;
4. never reopen a terminal prior edition.

Tracked by DAB-OPS-20261004-004 / DAB-KB-040.

## Low-cost Watchdog admission path

The six-slot Watchdog Ring must use the compact GitHub health record before broad reconstruction. Read protected `data/operations/active-production-run.json`, then the matching `data/operations/watchdog-health.json` from `runtime/watchdog-health`.

A fresh matching `HEALTHY_ACTIVE` record, a matching terminal record, or a valid progressing recovery owner is a silent no-op. Missing, stale, contradictory, mismatched or actionable compact state expands into the normal recovery contract. Never infer HEALTHY from absence.

Fresh external research is an explicit capability. Tasks 03 and 08 are `research_chatgpt`; GitHub-only recovery must hand off the exact queued request immediately instead of repeatedly attempting repository-only recovery.

Before a third materially equivalent repair/retry, apply Strategy Interrupt and require a different method unless new evidence changes the failure hypothesis.

