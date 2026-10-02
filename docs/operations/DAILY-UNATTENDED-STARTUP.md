# Daily unattended startup

**Current protected state, October 2:** Run 5 (`reliable-edition-20261002-run5`) is independently `PUBLIC_CLOSED` with Task 29 Done. Do not reopen Tasks 00-29, regenerate any accepted image, or reuse Run 5 as the next production execution. The historical one-time scheduled qualification remains immutable proof of the image path, but it is no longer the production consumer. The reusable production consumer is the enabled hourly **Daily Brief Recovery** automation `6abeb9a2b8a88191949dc420d5e10feb`, bound in `docs/operations/unattended-image-host.json` with a committed `automations.peek` observation. Protected host registration is the only mutable source of truth for current image-host readiness; policy documents must not duplicate a separate READY/BLOCKED status.

**Pre-next-run hold:** do not allocate the next production Brief until `_records/hardening/pre-next-run-five-change-2026-10-02/rehearsal-receipt.json` exists on protected `main` with `result=PASS` and `next_production_run_authorized=true`. The bounded rehearsal is NON-PRODUCTION and must not generate or edit images. Historical pre-qualification blockers, pauses and qualification receipts remain preserved as evidence, but their superseded wording is not current operating state.

Owner authorization: start the next Brief now and every day at **01:00 America/Chicago**, without owner interaction, uploads, approvals, an open chat or status requests. Reuse the existing ordinary scheduled ChatGPT path and GitHub Actions. Do not activate Work, Codex, paid APIs, overage, alternate accounts or new credentials. Actual account billing remains unobserved unless measured; a prompt is not a cost receipt.

## Required bootstrap

Resolve live main. Read these current files and record their paths, content digests and main SHA in the run bootstrap receipt. Read the ENTIRE cumulative ledger. Follow each referenced current stage standard.

- `docs/operations/START-HERE.md`
- `docs/operations/DAILY-UNATTENDED-STARTUP.md`
- `data/operations/production-continuous-improvement-ledger.jsonl`
- `docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md`
- `docs/operations/LIVING-SYSTEM-OPERATIONS.md`
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

Also read the active binding, readiness, events, writer lease, immutable results, requests and completion evidence. Daily authorization supersedes the completed two-Brief mission. Run 4, accepted images and history remain immutable. Run 4 production SHA remains `ce3dac9d75949f381821dfd34163048bf08c65d6`.

## Image-host admission and reusable consumption

The completed Run 5 qualification evidence remains immutable. Do not regenerate its six images or rewrite its historical receipts. Current readiness is derived only from `docs/operations/unattended-image-host.json`: Task 00 verifies the registered qualification receipt, then verifies the bound reusable-consumer observation and exact enabled automation identity. A policy narrative cannot override the registration.

Qualification and consumption are separate contracts. The completed one-time qualification automation proves the historical scheduled/native path; the enabled hourly Daily Brief Recovery automation is the reusable production consumer. A READY qualification with no enabled bound reusable consumer is **not** production-ready. The GitHub dispatcher must return `QUEUED_FOR_SCHEDULED_CONSUMER` with the exact consumer ID; the old consumerless `AWAITING_SCHEDULED_EXECUTOR` terminal wait is prohibited.

Every scheduled native-image invocation refreshes durable branch and writer-lease state at invocation. Any `writer_generation` embedded in a queued request is scheduling provenance only. The consumer acquires current task-specific fenced authority for the same execution, rejects stale/foreign authority for mutation, preserves completed tasks, and never creates a duplicate run. At a durable Task 11-16 Done or Blocked boundary it writes `released=true`, `released_at`, an immediate expiry, and a task-specific `release_reason` ending in `HANDOFF_TO_SUPERVISOR`. The event-driven Supervisor handoff resumes the **same** execution automatically.

For production images, preserve all existing quality and cost controls: sealed single-story specification, professional native generation, pretransport visible-text enforcement, exact-byte persistence/read-back, saved-Git visual review, bounded targeted retry, no Work/Codex/paid services/new credentials/owner upload, and no SVG/basic/low-quality fallback. For the pre-next-run synthetic rehearsal only, `rehearsal_no_generation=true` proves scheduler consumption, fence refresh, stale-generation rejection and handoff without image generation or production mutation.

## Daily execution and recovery

Resolve today's America/Chicago date. Resume an active nonterminal run first. If today's edition is already independently PUBLIC CLOSED, do not repeat it. Otherwise allocate one dated execution from current main and the next unused run number. The initial target is October 2 / Run 5 unless live state already contains it. Never relabel old content.

Validate Task 00 with the full ledger and actual evidence. Task 00 may PASS with `start_scope=non_image_production` when and only when the sole deferred blocker is the unattended image host; in that state `image_tasks_authorized=false` and `publication_authorized=false`. Persist all 30 task definitions and readiness before production. Continue Tasks 01-10 and any other dependency-safe non-image work. Keep one fenced writer and the existing Supervisor/watchdog. Polling and Kanban refreshes are not substantive content/image progress; a queue without a consumer is not progress. Before working or committing, verify execution, task, operation key and current writer generation. Never race an active worker or bypass a stale fence.

Drain safe dependent work in the same invocation. Preserve the cutoff, selections, media, accepted images and receipts across continuation. Enforce six stories in 2/2/2 order, one reusable Agent Skills story, two verified videos, two source-diverse podcasts, Watchlist discovery, all-four-book relevance review, full-source reading evidence and six professional high-detail images. Retain article-24-72-168-v1 and unchanged media policy. No sparse/basic, self-approved or low-quality image fallback.

Append each actual transition immediately with UTC timestamp, from/to, reason, operation and proof. Record Blocked explicitly. Record generation/capture/review/transfer/recovery/waiting separately. Derive Kanban and timing from events; unknown times remain unknown. Preserve records for PNGs, reports and replay.

Freeze the candidate before Task 23. Require protected CI, exact-SHA merge and Pages, independent live verification, PUBLIC CLOSED and generic Task 29. Append new problems, attempts, fixes and actual outcomes to the learning ledger; reconcile at closure. Keep daily and hourly schedules enabled after each edition **and while any route is Blocked**. Only run-specific writers stop. A route-specific blocker must never disable the controller, keeper, validator, or unrelated work.

The daily controller starts work; the hourly keeper resumes missed starts or stalls independently of the owner and yields to observed substantive progress. An unchanged real capability block must not cause repeated prohibited generation or invented progress, but every recovery cycle must re-read durable state, perform newly available safe work, and preserve liveness. Status requests only refresh evidence and render a fresh event-derived Kanban PNG with changes since the prior status; they never activate production.

## Reused automation identities

- Daily controller: `6abeba31fe28819184544abf70874a80`, formerly Run 4 Primary Controller.
- Hourly keeper: `6abeb9a2b8a88191949dc420d5e10feb`, formerly Run 4 Production Keeper.
- Existing live validation: `6aadf3587b1c8191846a078f49102633`.

Archive old prompts before changing their Run 4 scope. Configuration and a run request are not proof that execution or publication completed.

## GitHub image request routing

Once protected host registration is READY with verified qualification evidence **and** an enabled reusable consumer binding, the existing GitHub image entry point marks the exact request `queued_for_scheduled_consumer` and records the admitted consumer ID. The routing script performs no generation, visual review, acceptance or Done transition. A READY qualification with a missing/disabled consumer becomes `CAPABILITY_BLOCKED` with `NO_ENABLED_REUSABLE_SCHEDULED_IMAGE_CONSUMER`; it must never stop indefinitely at `AWAITING_SCHEDULED_EXECUTOR`. Queueing alone is not proof of execution: the scheduled consumer must refresh current fenced authority at invocation and write durable result/handoff evidence.

Primary PNG persistence is direct Git Data `create_blob` with complete Base64. If that complete call is rejected before reaching GitHub, the sole approved fallback is the executable bounded chunk bridge in `_tools/image-chunk-bridge.mjs`. The fenced scheduled worker writes canonical Base64 chunks plus one manifest bound to execution, branch, task, run-scoped target, source writer generation, byte count, SHA-256 and Git blob identity. After fenced takeover, the Run Supervisor reconstructs the exact PNG, validates its header and dimensions, writes only the approved path, verifies read-back, records the result and removes temporary chunks. This transport never accepts or visually certifies an image; saved-Git-asset review remains mandatory.
