# Daily AI Brief — Living Run Learning, Supervision, Cleanup and Readiness Plan

> [!IMPORTANT]
> **Current instruction boundary:** this plan applies generically to every production execution. Named historical executions and dated adoption sections below are evidence only and never startup instructions. Current scheduling, terminal-run protection, cost boundaries and Task 00 requirements come from `DAILY-UNATTENDED-STARTUP.md` and `run-learning-readiness-contract.json`.

**Policy:** This document is the protected production baseline for every Daily AI Brief run. It is revised only through protected CI. Every new run must inherit the complete operational-learning ledger and prove that prior permanent fixes still work before content production begins.

## Core operating rule

Production liveness is owned by the repository control plane, not by an owner status request or a chat session.

The canonical control shape is:

`Task 00 -> persistent Run Supervisor -> one task worker -> one fenced writer -> Tasks 01-28 -> Task 29 -> NEXT-RUN READY`

A start schedule may create or resume a run, but it is never the liveness mechanism.

## Run Supervisor v2

The Run Supervisor starts no later than Task 00 PASS and remains responsible until Task 29 PASS.

Target loop:

1. read active-run identity and authoritative transition events;
2. verify the writer fence;
3. read task state and worker/executor state separately;
4. read the last durable progress time;
5. classify the run as one of:
   - `HEALTHY_ACTIVE`
   - `READY_IDLE`
   - `STALE_ACTIVE`
   - `BLOCKED_ACTIONABLE`
   - `BLOCKED_EXTERNAL`
   - `TERMINAL`
6. follow the durable recovery contract for the current task;
7. write only meaningful durable state transitions, incidents, fixes or worker requests;
8. repair derived projections such as the Kanban when their source digest is stale;
9. sleep approximately 60 seconds and repeat.

A GitHub-hosted Supervisor job may rotate before the host job time limit. A successor must resume the **same execution ID and branch**. It may never create a duplicate edition/run.

## One worker and one writer authority

Only one production task worker may hold consequential write authority at a time.

The writer authority uses a persisted fence generation. A stale worker request from an older generation is invalid. A replacement Supervisor may take over an unexpired fence only when the outer watchdog has independently established that the prior Supervisor owner is dead.

All branch updates remain non-force and must reconcile the current branch head before committing.

## Outer watchdog

The one-minute loop lives inside the GitHub execution environment.

A separate GitHub watchdog runs on the minimum practical schedule and checks whether a nonterminal active production run has a live/queued Supervisor. If not, it dispatches the Supervisor for the **same** execution identity with dead-owner takeover authorization.

The watchdog never creates a new run.

## Cumulative continuous-improvement memory

Canonical machine ledger:

`data/operations/production-continuous-improvement-ledger.jsonl`

Human-readable projection:

`docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md`

Run-scoped incident delta:

`_records/run-learning/incidents/<execution_id>.jsonl`

The JSONL stream is authoritative. Markdown is a projection.

For every material production problem, retain:

- unique problem ID;
- first observed run/date/task;
- exact symptom;
- root cause;
- operational impact;
- timing impact when known;
- attempted fixes;
- actual fix;
- fix outcome;
- temporary/permanent classification;
- permanent implementation references;
- regression tests;
- production invariants;
- recurrence history and recurrence cause;
- stronger subsequent fixes;
- current status;
- next-run validation requirements;
- timing/performance baseline.

Unknown historical timing is recorded as unknown. It is never inferred.

### Task 00 learning inheritance

Before production starts, Task 00 must:

- read the full canonical JSONL ledger;
- validate its digest and schema;
- materialize every known problem;
- verify references for every permanent implementation/regression test;
- load all unresolved/mitigated risks;
- load the complete invariant set;
- prove that no required permanent fix is missing;
- bind the ledger digest and invariant set into the readiness receipt.

### During-run learning

As soon as a new material problem occurs, append it to the run-scoped incident delta. Record each attempted fix and outcome as it occurs. Do not wait for Task 29 to reconstruct problems from memory.

Every actionable recovery should reference the corresponding problem ID when a material incident exists.

### Task 29 learning reconciliation

Task 29 must:

- reconcile every problem observed during the run;
- require a root cause before next-run readiness;
- identify the actual fix and outcome;
- promote permanent fixes into implementation + regression tests + invariants;
- keep mitigated risks explicit with mandatory next-run validation;
- merge the run delta into the canonical JSONL ledger;
- regenerate the Markdown projection;
- compare timing against recent successful runs;
- record safe simplifications;
- update the living plan/contract when invariants changed;
- certify `NEXT-RUN READY=true` only after all cleanup and learning checks pass.

## Task recovery contracts

Every Task 00 through Task 29 has a durable contract in:

`docs/operations/task-recovery-contracts.json`

Each contract defines normal operation, success evidence, worker capability, stale threshold, first recovery, alternate recovery, retry limit, terminal failure condition, downstream invalidation scope and simplification rule.

The Supervisor consumes these contracts. Production must not invent a new recovery architecture during an active run if an approved recovery exists.

## Active and Blocked rules

`Active` means live execution or recent durable progress. An Active task with a stopped/idle worker or progress older than its contract threshold is `STALE_ACTIVE`; recovery resumes or reconciles the **same task**.

`Blocked` does not mean “wait for the owner.” If the blocker is actionable under the task contract, the Supervisor emits/executes the approved recovery automatically. Only genuinely external/nonrecoverable blockers may remain blocked without immediate repair, and the Supervisor still rechecks them.

## Kanban rule

Append-only transition events are authoritative.

The Kanban is a derived projection containing the source event-ledger digest. A mismatch is automatically repaired. Task state and executor state are displayed independently.

## Professional image path

The production image path remains:

`generate professional PNG -> capture exact PNG bytes immediately -> persist exact bytes -> verify content identity -> review saved Git asset -> accept_locked/retry`

Requirements:

- six story-specific professional textbook/editorial images;
- no SVG/basic-diagram substitution;
- no low-quality fallback;
- preserve a good image if exact bytes remain recoverable;
- review the saved Git asset, not an unsaved proxy.

### Mandatory small-PNG persistence

Task 00 must prove at least one route before production:

1. direct Git Data API `create_blob` with complete Base64 payload, then tree/commit/non-force ref update and exact read-back verification;
2. bounded Base64 chunk bridge, reconstruct/decode exact bytes, verify SHA-256, commit PNG, remove temporary transport artifacts.

No owner upload and no third transport architecture while an approved route remains available.

## Publication invariants

- exact 2 / 2 / 2 story allocation;
- exactly one reusable Agent Skills story;
- article freshness policy;
- two verified videos;
- two source-diverse verified podcasts;
- independent Emerging AI Watchlist refresh;
- all four Professional Series books considered;
- six accepted professional images;
- immutable bundle/digests;
- protected CI;
- exact approved SHA;
- exact-SHA deployment;
- independent live verification;
- `PUBLIC CLOSED` as the only success state.

## Cost boundary

Production and supervision must not add ChatGPT Work, Codex, paid model APIs, paid external services, billable overage, alternate accounts or new credentials. GitHub automation uses the existing repository authentication and standard no-added-cost runner path permitted by the repository.

## Status requests

Owner status requests are read-only observations. A status request must never start recovery, unstick a task, renew liveness, create a worker, change a retry budget or create a new run.

If a status request changes production behavior, the architecture is regressed.

## Task 29 terminal sequence

`PUBLIC CLOSED or FAILED`
-> stop run-specific workers
-> reconcile events/Kanban/timing
-> reconcile operational learning
-> update regression protection/invariants
-> promotion review
-> clear writer and active-run pointer
-> `NEXT-RUN READY`
-> Supervisor stops

## Current machine implementation

- Readiness: `_generator/lib/run-readiness.mjs`
- Operational learning: `_generator/lib/operational-learning.mjs`
- Supervisor/fencing/projection: `_generator/lib/run-supervisor.mjs`
- Supervisor CLI: `_tools/run-supervisor.mjs`
- Learning CLI: `_tools/operational-learning.mjs`
- Task recovery contracts: `docs/operations/task-recovery-contracts.json`
- Machine readiness contract: `docs/operations/run-learning-readiness-contract.json`
- Canonical ledger: `data/operations/production-continuous-improvement-ledger.jsonl`
- Human ledger projection: `docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md`
- Regression tests: `_generator/test/run-supervisor.test.mjs`, `_generator/test/operational-learning.test.mjs`, `_generator/test/run-readiness.test.mjs`
- Supervisor workflow: `.github/workflows/run-supervisor.yml`
- Watchdog workflow: `.github/workflows/run-supervisor-watchdog.yml`

## October 1, 2026 Run 4 adoption rule

Run 4 is not rebased or restarted.

The new Supervisor must attach to:

- edition: `dab-edition-2026-10-01`
- execution: `reliable-edition-20261001-run4`
- branch: `reliable-edition/dab-edition-2026-10-01-run4`

It reconstructs completed work from existing durable events and accepted image evidence. Tasks 00-14 remain complete unless their own immutable evidence is proven invalid. Existing accepted images remain immutable. At adoption, recovery begins from current Task 15 and its latest durable m08 attempt evidence.

Run 4 becomes the first production run closed under Supervisor v2 and cumulative Task 29 learning reconciliation.

<!-- oct4-task29-completeness-gap -->
## October 4 Task 29 completeness gap

Run 8's immutable Task 29 certification reconciled one problem, but post-close review found material incidents in Watchdog events, liveness faults, protected-repair records, blocked task transitions, qualification repair and reader corrections.

Do not rewrite the historical certification. The append-only supplement is:

`_records/run-learning/supplements/reliable-edition-20261004-run8-post-close.json`

Future Task 29 certification must first build an **incident inventory** from all run-scoped durable sources and prove that every material incident maps to either:

- an existing operational-learning problem with a recurrence/disposition, or
- a new operational-learning problem with root cause/status/follow-up.

Task 29 must fail closed if a material incident has no ledger mapping. Post-close discoveries remain supplements, never edits to the historical certification.
