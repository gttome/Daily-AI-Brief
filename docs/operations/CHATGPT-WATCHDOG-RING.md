# ChatGPT Watchdog Ring

**Status:** current production liveness contract  
**Scope:** outer autonomous recovery for `gttome/Daily-AI-Brief`  
**Timezone:** `America/Chicago`

This document is intentionally generic. It must never depend on a historical run name, execution ID, branch, edition ID, or run number.

## Architecture

The Daily AI Brief uses four liveness roles:

1. **Run Supervisor** — normal orchestration, approximately one-minute loop.
2. **GitHub Supervisor watchdog** — every five minutes, restarts the same active Supervisor execution when missing.
3. **ChatGPT Watchdog Ring** — six ordinary hourly Scheduled tasks staggered at minutes **03, 13, 23, 33, 43 and 53**, producing a nominal ten-minute outer recovery check.
4. **Daily live validation/repair** — independent reader/publication validation.

The ring supplements rather than replaces the GitHub control plane.

## Schedule contract

| Slot | Minute each hour | Timing |
|---|---:|---|
| A | 03 | exact_schedule |
| B | 13 | exact_schedule |
| C | 23 | exact_schedule |
| D | 33 | exact_schedule |
| E | 43 | exact_schedule |
| F | 53 | exact_schedule |

Each member recurs once per hour. Platform delivery can be late; safe overlap comes from the recovery lease and idempotency.

Slot F is the repurposed former hourly Recovery schedule and remains the durable bound reusable native-image consumer. The other five slots use the same generic state machine.

## Healthy fast path

Resolve only current protected durable production state. Exit without mutation when there is no active nonterminal execution, the execution is terminal, another Watchdog owns an unexpired recovery lease, a real worker/protected executor is progressing, health is `HEALTHY_ACTIVE`, or `READY_IDLE` is legitimate.

Healthy checks create no commits, incidents, Kanban refreshes, queue rewrites, worker dispatches, or writer-lease changes.

## Authority and health

Append-only task events and exact worker requests/results are production authority. Kanban, timing, metrics, heartbeats and status-only commits are observability.

The ring reuses: `HEALTHY_ACTIVE`, `READY_IDLE`, `STALE_ACTIVE`, `BLOCKED_ACTIONABLE`, `BLOCKED_EXTERNAL`, and `TERMINAL`.

## Recovery coordination lease

Path:

```text
_records/edition-execution/watchdog-leases/<execution-id>.json
```

Schema: `chatgpt-watchdog-recovery-lease-v1`.

The execution-scoped lease lasts approximately 12–15 minutes and uses optimistic Git blob concurrency. An update must present the exact current file SHA; a lost race re-reads and exits if another owner won.

The recovery lease is **not** the production writer lease. Every production mutation still requires the existing execution-specific writer fence.

## Idempotency

A deterministic incident ID binds execution, task, authoritative state, blocker/reason, and exact request. A deterministic action key binds incident, action type, target, and attempt generation. Successful or active action keys are not duplicated. Failed actions escalate instead of blind retry.

## Minimum corrective action

Use the smallest authorized action:

1. `RECONCILE_AUTHORITATIVE_STATE`
2. `REDISPATCH_SAME_EXECUTOR`
3. `RESTORE_SAME_EXECUTION_AUTHORITY` only after a proven dead/released owner
4. `CONSUME_EXACT_QUEUED_REQUEST`
5. `MINIMAL_PROTECTED_REPAIR`
6. otherwise persist the exact external block and stop safely

Never allocate another execution, reopen a terminal execution, redo a Done task, regenerate an `accepted_locked` image, steal a live writer, or bypass protected CI/deploy/verification.

## Native image consumption

Tasks 11–16 preserve the registered native-image contract: exact newest request, current fenced authority refreshed at invocation, sealed single-story specification, professional native generation only, accepted images immutable, verified byte persistence, saved-Git visual review, and explicit Supervisor handoff. Slot F remains the durable registered consumer; other slots can take over only under the same recovery and writer-fence rules.

## Recovery verification

Recovery succeeds only on substantive durable movement such as task transition, worker claim/result, accepted asset, first-incomplete-task advance, bounded repair completion, meaningful protected CI/deploy/verification state advancement, or publication/verification evidence.

Lease/heartbeat changes, Kanban refresh, metrics, queue rewrites, status-only commits, rereads, and dispatch without executor activation are not success.

## Incident evidence

Actual stalls/recoveries only:

```text
_records/edition-execution/watchdog-events/<execution-id>/
```

Events are append-only `chatgpt-watchdog-event-v1`. Healthy checks write nothing.

Allowed release reasons: `RECOVERY_VERIFIED_PROGRESSING`, `RECOVERY_NO_LONGER_NEEDED`, `WAITING_ON_PROTECTED_EXTERNAL_EXECUTOR`, `BLOCKED_EXTERNAL`, `TERMINAL_EXECUTION`, `SAFE_BOUNDARY_REACHED`.

Do not hold a recovery lease while waiting on a long protected external workflow.

## Cost boundary

Ordinary Scheduled ChatGPT plus connected GitHub only. No ChatGPT Work, Codex, paid model API/service, billable overage, event-triggered Work task, alternate account, browser-login automation, or new credentials.

## Regression suite

`_generator/test/chatgpt-watchdog-ring.test.mjs` covers healthy/no-active/terminal cases, recovery ownership and expiry, optimistic concurrency preconditions, post-acquisition races, exact request selection, minimum action and escalation, external blocks, projection authority, completed-task/accepted-asset protection, verification, and five bounded synthetic integration cases.

## Operator schedule reference

The permanent ChatGPT Watchdog Ring consists of **exactly six enabled recurring Scheduled tasks**. All six use the same generic recovery state machine; only the slot identifier and minute offset differ.

| Scheduled task | Slot | Minute each hour | Expected status | Permanent role |
|---|---:|---:|---|---|
| Daily Brief Watchdog A | A | :03 | Enabled | Outer recovery member |
| Daily Brief Watchdog B | B | :13 | Enabled | Outer recovery member |
| Daily Brief Watchdog C | C | :23 | Enabled | Outer recovery member |
| Daily Brief Watchdog D | D | :33 | Enabled | Outer recovery member |
| Daily Brief Watchdog E | E | :43 | Enabled | Outer recovery member |
| Daily Brief Watchdog F | F | :53 | Enabled | Outer recovery member **and** durable registered native-image consumer |

The effective nominal sequence is therefore:

```text
:03 A → :13 B → :23 C → :33 D → :43 E → :53 F → next hour :03 A
```

The cadence is nominal rather than real-time guaranteed; Scheduled task delivery can start late. Recovery-lease coordination and idempotent action keys make late or overlapping invocations safe.

### Why Slot F is different

Slot F is not an extra seventh service. It is the former hourly **Daily Brief Recovery** Scheduled task repurposed in place as **Daily Brief Watchdog F** and moved from the old :48 cadence to :53.

Slot F retains the durable scheduled native-image-consumer responsibility for Tasks 11–16. That means its Watchdog behavior and its image-consumer behavior share the same generic one-writer, exact-request, current-fence, accepted-asset-protection and Supervisor-handoff rules.

The old standalone :48 recovery behavior must not remain enabled after cutover.

### If Slot F is not visible in the ChatGPT Scheduled Tasks UI

The intended live configuration is six enabled Watchdog tasks A–F. If the Scheduled Tasks screen visibly shows A–E but not F:

1. refresh or reopen the Scheduled Tasks view;
2. look specifically for **Daily Brief Watchdog F** rather than the former **Daily Brief Recovery** title;
3. confirm its recurrence is hourly at minute **:53**;
4. if it remains absent after refresh, treat that as a schedule-configuration defect and compare the live Scheduled-task definitions against this contract before the next production run.

Do not create a replacement F blindly. First verify whether the repurposed task already exists so the system does not accidentally create two image consumers or two recovery owners.

## Watchdog Permission Probe

The **Watchdog Permission Probe** is **not a member of the Watchdog Ring**.

It was a bounded, one-time, non-production implementation test whose only purpose was to prove that an ordinary ChatGPT Scheduled task could use the connected GitHub capability unattended. The probe was constrained to an isolated test branch and was not allowed to modify protected `main`, any production execution branch, production pointers, writer leases, accepted assets or publication state.

The probe verified the ability to:

1. run unattended as a normal Scheduled task;
2. read protected repository state through the connected GitHub capability;
3. write one harmless verification record to an isolated non-production branch without interactive approval;
4. preserve production state completely.

After the test completed, the probe was disabled. It must remain disabled and must **not** be counted when verifying the six permanent ring members.

A UI may continue to show the disabled/completed probe as historical Scheduled-task evidence. Its presence does not mean there are seven Watchdog slots.

## Schedule verification checklist

When checking the Watchdog Ring before a production run, verify all of the following:

- exactly six recurring Watchdog members are enabled;
- the recurring minutes are exactly **03, 13, 23, 33, 43 and 53**;
- Slot F is present and enabled at :53;
- no standalone :48 Daily Brief Recovery schedule remains enabled;
- every Watchdog prompt is generic and contains no historical production identity;
- the daily production Controller remains separate from the ring;
- the daily live validator remains separate from the ring;
- the GitHub five-minute Supervisor watchdog remains enabled and unchanged;
- the one-time Watchdog Permission Probe is disabled and is not counted as a ring member;
- no event-triggered Work task, Work/Codex route, paid API/service, alternate account, new credential or browser automation has been introduced.

## Source-of-truth rule

The **live ChatGPT Scheduled-task definitions** determine whether a schedule is actually enabled and when it will run. This living document records the required architecture and expected configuration; it is not itself the scheduler.

Whenever a permanent Watchdog schedule, role, minute offset, recovery-lease rule or image-consumer binding changes, update this document in the same protected change set so the living operations documentation and the live system do not drift.

