# ChatGPT Watchdog Ring — Implementation Report

**Completed:** 2026-10-03  
**Repository:** `gttome/Daily-AI-Brief`  
**Timezone:** `America/Chicago`  
**Core implementation PR:** #415  
**Core merge SHA:** `715c34cd07ebaf534be5307fd03eeb7f2ef8b5e0`  
**Learning/evidence closure PR:** #416  
**Learning/evidence closure merge SHA:** `a1c19e5ac1c89ab0cff88976ed3a8a3772bf9667`  
**Learning/evidence closure CI:** run 37149958179 — PASS  
**Result:** PASS.

## 1. Before state

Before this change, the GitHub-native liveness stack already had the persistent Run Supervisor and a five-minute Supervisor watchdog. The ChatGPT outer layer consisted of one enabled hourly **Daily Brief Recovery** schedule at minute :48. That schedule was overloaded: it was simultaneously a recovery service, scheduled native-image consumer, repository worker and liveness checker.

Live preflight found no active nonterminal production execution. The durable production pointer was terminal with Task 29 Done, so the architecture change could be made without touching an in-flight production execution.

Five active Scheduled tasks existed before cutover. The Controller and live validator were production-critical and were preserved.

## 2. After state

The outer layer is now a six-member ordinary ChatGPT Watchdog Ring:

| Slot | Minute | Recurrence | Status |
|---|---:|---|---|
| A | :03 | hourly | enabled |
| B | :13 | hourly | enabled |
| C | :23 | hourly | enabled |
| D | :33 | hourly | enabled |
| E | :43 | hourly | enabled |
| F | :53 | hourly | enabled |

All six use `exact_schedule`. The combined cadence is a **nominal ten-minute outer check**, not a hard real-time guarantee.

The former hourly Recovery task was repurposed in place as **Watchdog Slot F**. No enabled standalone minute-:48 Recovery task remains.

The live schedule service admitted all five additional Watchdog schedules and retained the existing critical schedules. The final active-task count is 10, proving current capacity is **at least 10 active tasks**. No exact account ceiling is inferred.

The Daily Brief Controller remains enabled at **19:00 America/Chicago** and retains next-local-day edition semantics. The Daily Brief Live Validation & Repair task remains enabled at **08:30 America/Chicago**, with coordination updated so it does not compete with a Watchdog that holds a valid recovery lease and is making real progress.

The GitHub Run Supervisor and five-minute GitHub Supervisor watchdog remain unchanged as the faster inner liveness layer.

## 3. Recovery coordination lease

The Watchdog Ring uses a separate execution-scoped recovery coordination lease:

```text
_records/edition-execution/watchdog-leases/<execution-id>.json
```

Schema: `chatgpt-watchdog-recovery-lease-v1`.

The lease is approximately 15 minutes, uses optimistic Git concurrency, carries owner slot/generation/incident/action identity, and is explicitly released at durable boundaries. An expired owner can be taken over deterministically by a later slot.

The Watchdog recovery lease is **not** production writer authority. Before any production mutation, the existing execution-specific writer/fence rules still apply.

Actual stall/recovery evidence is append-only under:

```text
_records/edition-execution/watchdog-events/<execution-id>/
```

Healthy checks create no incident event or repository noise.

## 4. Health and recovery state machine

The ring reuses the production health vocabulary:

- `HEALTHY_ACTIVE`
- `READY_IDLE`
- `STALE_ACTIVE`
- `BLOCKED_ACTIONABLE`
- `BLOCKED_EXTERNAL`
- `TERMINAL`

Healthy/legitimate idle, another valid recovery owner, a real active worker/protected executor, or a terminal execution all lead to a safe no-op.

Recoverable states use the smallest authorized action:

1. `RECONCILE_AUTHORITATIVE_STATE`
2. `REDISPATCH_SAME_EXECUTOR`
3. `RESTORE_SAME_EXECUTION_AUTHORITY`
4. `CONSUME_EXACT_QUEUED_REQUEST`
5. `MINIMAL_PROTECTED_REPAIR`

Deterministic incident IDs and action keys prevent the six schedules from amplifying one defect. A completed or active action key is not duplicated; an unsuccessful completed action escalates to the next-smallest authorized action.

A command, retry, dispatch, queue rewrite, lease change, heartbeat, Kanban refresh or status update is not recovery success. The Ring requires substantive durable progress such as worker claim/result, task transition, accepted asset, first-incomplete-task advancement, or meaningful protected-executor advancement.

## 5. Native-image consumer preservation

The durable reusable image-consumer identity was preserved by moving the existing Recovery schedule to Slot F rather than replacing it with a new unrelated service.

Tasks 11–16 still require the sealed single-story specification, current fenced authority at invocation, professional native-image path, exact-byte persistence/read-back, saved-Git visual review, immutable `accepted_locked` assets and explicit Supervisor handoff. Other Watchdog slots can take over only through the same recovery lease and writer-fence contracts.

## 6. Repository changes

Core PR #415 changed these files:

- `_generator/lib/chatgpt-watchdog-ring.mjs`
- `_generator/test/chatgpt-watchdog-ring.test.mjs`
- `_generator/test/pre-next-edition-task00-admission.test.mjs`
- `_records/hardening/chatgpt-watchdog-ring-2026-10-03/schedule-observation.json`
- `data/operations/improvement-kanban.json`
- `docs/operations/CHATGPT-WATCHDOG-RING.md`
- `docs/operations/DAILY-UNATTENDED-STARTUP.md`
- `docs/operations/LIVING-SYSTEM-OPERATIONS.md`
- `docs/operations/START-HERE.md`
- `docs/operations/run-learning-readiness-contract.json`
- `docs/operations/task-recovery-contracts.json`
- `docs/operations/unattended-image-host.json`

The current closure change adds/updates:

- `data/operations/production-continuous-improvement-ledger.jsonl`
- `docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md`
- `data/operations/improvement-kanban.json`
- `docs/operations/CHATGPT-WATCHDOG-RING-IMPLEMENTATION-REPORT-2026-10-03.md`
- `_records/hardening/chatgpt-watchdog-ring-2026-10-03/scheduled-permission-probe.json`
- `_records/hardening/chatgpt-watchdog-ring-2026-10-03/final-verification.json`

Historical run evidence was not rewritten to pretend the old architecture was current. Current living instructions and current architecture diagrams were updated.

## 7. Test results

Core final protected CI: run **37149575554**, conclusion **success**, head `0faddf1f80c5175e9caed34c38e47eb3668dbbf6`.

- affected targeted tests: **117 passed / 0 failed**
- full contract and generator tests: **885 passed / 0 failed**
- persistent supervision and cumulative operational-learning validation: PASS
- repository-state validation: PASS
- discovery/four-book validation: PASS
- publication lifecycle validation: PASS
- integrated-system validation: PASS
- atomic publication-change-set validation: PASS
- append-only ledger validation: PASS
- Jekyll build: PASS

Watchdog regression coverage includes healthy no-op, no active production, terminal stale pointer, active recovery owner, expired-owner takeover, optimistic concurrency preconditions, post-acquisition race re-read, missing Supervisor, unclaimed repository request, newest authoritative native request, actionable/external blockers, stale/fresh Kanban authority, historical-request contamination, completed-task protection, accepted-asset protection, terminalization mid-repair, dispatch-only false success and escalation.

Synthetic integration cases passed:

1. ACTIVE + HEALTHY
2. ACTIVE + STALLED
3. ACTIVE + RECOVERY ALREADY RUNNING
4. DEAD RECOVERY OWNER
5. TERMINAL

No live production execution was used as a synthetic failure-injection fixture.

## 8. Live Scheduled-task validation

The final schedule definitions were re-read from the live Scheduled-task service after core merge.

Verified:

- all six Watchdog slots enabled;
- exact minute offsets 03/13/23/33/43/53;
- exact hourly recurrence;
- same generic Watchdog contract with slot identity as the intentional difference;
- no historical production identity hard-coded in Watchdog prompts;
- no enabled standalone minute-:48 recovery;
- Controller still enabled at 19:00 America/Chicago;
- validator still enabled at 08:30 America/Chicago;
- GitHub five-minute Supervisor watchdog preserved.

A bounded one-time non-production Scheduled-task probe used the same connected GitHub capability to read protected `main` and write one evidence file only on an isolated test branch. It passed both read and write operations without interactive approval and did not mutate production state. The durable evidence is `_records/hardening/chatgpt-watchdog-ring-2026-10-03/scheduled-permission-probe.json`.

## 9. Learning and Kanban

Permanent learning problem: **DAB-OPS-20261003-007**.

Append-only learning events:

- `DAB-OPS-E-000083` — problem seen
- `DAB-OPS-E-000084` — root cause
- `DAB-OPS-E-000085` — permanent fix
- `DAB-OPS-E-000086` — fix outcome

The learning system now records why one hourly outer recovery task was insufficient, how six hourly schedules create a nominal ten-minute ring, why recovery ownership requires a separate lease, why healthy checks must be silent, and why repair is successful only after verified forward progress.

**DAB-KB-012** is moved to **Done** only after schedule cutover, protected CI, synthetic tests and live read/write permission verification passed.

## 10. Production safety confirmation

Confirmed:

- no terminal production execution was reopened;
- no second production execution was allocated;
- no completed production task was redone;
- no accepted/locked image was regenerated;
- the protected publication gate was not bypassed;
- the one-writer rule remains required;
- the recovery lease does not replace the writer fence;
- no Work/Codex/API/event-triggered Work/browser-automation/alternate-account/new-credential route was added.

## 11. Rollback

If duplicate recovery behavior is ever observed:

1. remove Slots A–E from the active ring;
2. retain the GitHub Run Supervisor and five-minute GitHub watchdog unchanged;
3. retain the 19:00 Controller unchanged;
4. retain independent live validation unchanged;
5. preserve all Watchdog incident evidence;
6. restore Slot F to the last known-safe prior hourly recovery behavior only if that exact prior behavior is still independently verified safe;
7. repair the lease/decision defect through protected CI;
8. re-enable the six-slot ring only after race/duplication regression coverage passes.

Rollback must never weaken terminal-run immutability, writer fencing, accepted-image immutability, quality gates, protected CI/deployment/verification, or exact execution identity.

## 12. Remaining limitations

- The ten-minute cadence is nominal. Scheduled ChatGPT executions can start late.
- The account's exact maximum active-task ceiling is not asserted; the live service proved capacity for the required final set of 10 active tasks.
- No live production stall was deliberately injected. Recovery behavior is proven by deterministic unit/synthetic integration coverage plus the safe Scheduled-task GitHub read/write probe.
- Genuine external blocks such as protected CI/deployment/tool availability remain external. The Ring records them and does not bypass them.

## 13. Post-implementation recovery-persistence hardening

After initial installation, the recovery success semantics were deliberately strengthened. The Ring is now explicitly a **fix-to-progress** system rather than a one-attempt recovery mechanism.

Permanent rule:

1. diagnose the actual cause;
2. apply the smallest safe authorized repair that can actually fix it;
3. if progress is not restored, continue to the next-smallest applicable authorized action rather than stopping;
4. require the affected task/process to have a **real active executor**;
5. require **substantive durable progress after the repair**;
6. if an invocation reaches a safe boundary while still actionable, persist a continuation handoff for the next slot — never call that recovery success;
7. classify `BLOCKED_EXTERNAL` only from verified external/non-actionable evidence, never merely because internal repair attempts failed.

In short: **one repair attempt is not recovery; actionable recovery continues until active progress is restored or the still-unresolved incident is safely handed forward after exhausting the applicable options for the current invocation.**

Protected hardening evidence: PR #420 merged as `480a4c559ac2b900dd29b746eec4e279a365e73f`; protected CI run 37152873713 passed 890/890 generator tests and 24/24 contract tests plus repository/lifecycle/append-only/Jekyll validation. Final hardening receipt: `_records/hardening/chatgpt-watchdog-ring-2026-10-03/fix-to-progress-final-verification.json`.
## 15. Final evidence

- Core protected PR: #415
- Core merge SHA: `715c34cd07ebaf534be5307fd03eeb7f2ef8b5e0`
- Core final protected CI run: 37149575554
- Learning/evidence closure PR: #416
- Learning/evidence closure merge SHA: `a1c19e5ac1c89ab0cff88976ed3a8a3772bf9667`
- Learning/evidence closure protected CI run: 37149958179 — PASS
- Final verification receipt: `_records/hardening/chatgpt-watchdog-ring-2026-10-03/final-verification.json`
- Scheduled GitHub permission receipt: `_records/hardening/chatgpt-watchdog-ring-2026-10-03/scheduled-permission-probe.json`
- Learning problem: DAB-OPS-20261003-007
- Learning events: DAB-OPS-E-000083 through DAB-OPS-E-000086
- Kanban: DAB-KB-012 = Done

## 14. Equivalent image-consumer pool hardening

The initial Watchdog Ring migration preserved the former Recovery automation as a special Slot F image-consumer binding. That was a safe migration bridge but not the preferred steady-state architecture.

The permanent model now makes **A–F operationally equivalent**. The Watchdog Ring itself is the registered reusable scheduled native-image consumer pool. Any slot may immediately consume the exact next queued, unclaimed Tasks 11–16 `native_chatgpt` request; normal image pickup does not wait for the task to become stale or blocked.

Coverage therefore improves from one designated recurring image-consumer opportunity per hour to six staggered opportunities per hour. Nominal maximum wait to the next scheduled image consumer improves from about 60 minutes to about 10 minutes. This is a schedule-spacing improvement, not a real-time execution guarantee.

Duplicate generation remains prohibited. Every slot must resolve the exact current request and acquire current task-specific writer authority before generation. If another slot owns the work, it yields. Accepted images remain immutable, sealed single-story prompts remain mandatory, exact-byte Git persistence/read-back and saved-Git review remain mandatory, and the Supervisor handoff remains unchanged.

Protected equivalent-consumer outcome: PR #423 merged as `6938496b84d23243692a752946846494d3440c43` from exact head `c5b51d30f7386e781dfdf4b6896456b09bba8f1e`. Deterministic publication CI run 37160416973 passed 896/896 generator tests, 24/24 contract tests, affected targeted tests, repository/lifecycle/append-only validation and Jekyll build. Pages deployment run 37160487714 also completed successfully.

The permanent learning sequence is `DAB-OPS-E-000091` (permanent fix) followed by `DAB-OPS-E-000092` (verified outcome); Improvement Kanban card DAB-KB-031 is Done. The live six-slot consumer evidence remains `_records/hardening/chatgpt-watchdog-ring-2026-10-03/equivalent-image-consumer-pool-observation.json`. The current Watchdog architecture infographic source is `docs/images/living-architecture/Daily-AI-Brief-Watchdog-Ring-Architecture-v1.0.svg`.
