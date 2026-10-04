# Daily AI Brief — October 4 Usage-Efficiency Audit and Post-Close Hardening Plan

**Date:** 2026-10-04  
**Repository:** `gttome/Daily-AI-Brief`  
**Production execution reviewed:** `reliable-edition-20261004-run8`  
**Purpose:** Preserve the October 4 usage-efficiency findings as durable learning and define post-close hardening work.  
**Implementation status:** **DEFERRED UNTIL THE OCTOBER 4 BRIEF IS `PUBLIC_CLOSED` AND TASK 29 IS DONE.**

> This document is an audit and hardening handoff. It must not be used to interrupt, restart, reopen, or redesign the active October 4 production execution. Preserve all completed tasks and accepted assets. Apply changes only after terminal closeout.

---

## Executive conclusion

The October 4 Daily AI Brief appears to have consumed an unexpectedly large portion of the user's weekly ChatGPT allocation. The evidence indicates that the principal driver is **not the normal editorial workload or the six required story images**. The dominant usage amplifier is the current autonomous recovery architecture:

- six staggered Scheduled ChatGPT Watchdog slots,
- long recovery prompts on every Watchdog invocation,
- repeated GitHub re-reading and orchestration reasoning,
- lease/fence/reconciliation cycles,
- repeated recovery handoffs,
- and a severe Task 11 image-context contamination incident that caused three rejected image generations before one successful generation.

The system succeeded at the important objective of recovering without relying on the owner to ask why a task was stuck. However, it achieved that autonomy with excessive ChatGPT model activity. The architectural goal after October 4 closes is therefore:

> **Keep autonomous detection and repair, but move frequent health checking and routine coordination out of heavyweight ChatGPT invocations. Use ChatGPT primarily as an escalation and semantic-repair layer.**

---

## Scope and evidence reviewed

The audit reviewed live durable repository evidence from the October 4 production branch, the current Scheduled ChatGPT task configuration, image-attempt receipts, and the production Kanban/event projection.

Key evidence included:

- production branch `reliable-edition/dab-edition-2026-10-04-run8`;
- October 4 production commit history;
- Watchdog A–F activity;
- Task 11 image-attempt receipts under `_records/image-attempts/2026-10-04-run8/`;
- current Watchdog schedules and prompts;
- Task durations from `_records/edition-execution/kanban/2026-10-04-run8.json`;
- current production recovery and Supervisor activity.

The ChatGPT account usage meter itself is not available through GitHub and cannot be reconstructed exactly from repository records. Therefore the audit identifies **usage drivers and relative amplification**, not an exact percentage attribution to each subsystem.

---

## Quantitative findings

### 1. The six-slot Watchdog Ring creates up to 1,008 Scheduled ChatGPT invocation opportunities per week

The intended architecture uses six hourly Scheduled ChatGPT tasks staggered approximately every ten minutes:

- Slot A — :03
- Slot B — :13
- Slot C — :23
- Slot D — :33
- Slot E — :43
- Slot F — :53

At full operation:

`6 schedules/hour × 24 hours/day × 7 days/week = 1,008 scheduled invocation opportunities/week`

The schedules are intended to provide an approximately ten-minute outer recovery cadence. The problem is that each invocation is a **full ChatGPT task**, not a tiny deterministic health probe.

At the time of the audit, five of the six recurring Watchdogs were enabled and Slot C was disabled. Even five enabled Watchdogs imply roughly five ChatGPT scheduled executions per hour while they remain active.

### 2. The Watchdog prompts are heavyweight

Each Watchdog invocation carries a large instruction set covering:

- production identity resolution;
- terminal-run immutability;
- missed-start recovery;
- Fix-to-Progress;
- repository fast-path inspection;
- native image consumption;
- Protected Repair Autonomy;
- PR merge-context refresh;
- dead-writer proof;
- recovery leases;
- writer fencing;
- verification after every fix;
- continued exhaustion/retry behavior.

This is valuable recovery doctrine, but it means even a routine Watchdog check begins with substantial model context and can trigger broad GitHub inspection.

The current architecture is therefore using ChatGPT as both:

1. a frequent polling/health-check mechanism, and  
2. a semantic recovery agent.

Those should be separated.

### 3. The October 4 production branch showed extreme orchestration churn

During the audited period, the production branch contained **321 commits** beginning at approximately 2026-10-04 01:33 UTC through the audit window.

A subject-line classification of those commits found approximately:

- **173 orchestration-like commits** involving leases, fences, authority, generations, handoffs, reconciliation, acquisition/release, dead-writer proof, or similar control-plane activity;
- **106 commits explicitly naming Watchdog A–F**;
- only a much smaller subset directly represented substantive content/artifact completion.

These commit counts are **not equivalent to ChatGPT requests** and must not be treated as billing telemetry. They are nevertheless strong evidence that a large fraction of system activity is coordination overhead rather than Brief production.

### 4. Task 11 was the largest abnormal usage event

Task 11 generated **67 production-branch commits** and lasted approximately **4 hours 24 minutes**.

The image-attempt receipts show four native generations for candidate `m02`:

#### Attempt 1
Rejected before transport.

Reason: the image generator returned a **Watchdog operational/status dashboard** instead of the sealed story-specific backend-state verification diagram.

Disposition:
`REJECTED_PRETRANSPORT_CONTEXT_CONTAMINATION`

#### Attempt 2
Rejected again for the same reason.

The native generation again produced Watchdog operational content rather than the requested editorial diagram.

Disposition:
`REJECTED_PRETRANSPORT_CONTEXT_CONTAMINATION`

#### Repair epoch 1 / attempt 1
Rejected.

Recorded failures included:

- `subject_match: FAIL`
- `visible_text_guard: FAIL`
- `context_isolation: FAIL`

#### Repair epoch 2 / attempt 1
Accepted and locked.

The final generation correctly produced the professional story-specific image and passed the required checks.

### 5. October 4 used approximately nine native image attempts for six required images

The image-attempt directory shows:

- `m01`: 1 attempt
- `m02`: 4 attempts
- `m04`: 1 attempt
- `m06`: 1 attempt
- `m07`: 1 attempt
- `m09`: 1 attempt

Total native attempts: **9**  
Required accepted images: **6**

This represents approximately **50% more generation attempts than the ideal one-attempt-per-image path**.

The important lesson is not simply that retries occurred. The rejected attempts demonstrate that the image-generation context had become contaminated by the recovery/Watchdog context. The model literally generated operational Watchdog visuals instead of the article diagram.

That makes Task 11 an architectural isolation failure.

### 6. Other downstream tasks also incurred excessive recovery overhead

Examples from the October 4 Kanban/event projection:

- **Task 18:** about 3,490 seconds (~58 minutes)
- **Task 21:** about 3,426 seconds (~57 minutes)

Their histories include repeated recovery ownership changes, leases, writer generations, handoffs, Supervisor takeovers, Watchdog takeovers, reconciliation, and repair cycles.

This indicates that the overhead was not limited to image generation.

---

## Root-cause assessment

### Root cause A — ChatGPT is being used for frequent polling

The Ring was designed to compensate for the one-hour minimum interval per Scheduled task by creating six staggered hourly schedules.

That solves cadence, but it changes the economics of the system:

- a deterministic health check becomes a model invocation;
- a healthy system can still consume scheduled model capacity;
- the recovery prompt is reloaded repeatedly;
- repository state may be re-read repeatedly.

**Classification:** orchestration architecture  
**Impact:** permanent until redesigned  
**Priority:** critical

### Root cause B — detection and repair are coupled

The Watchdog currently performs both detection and potentially deep repair.

A frequent detector should be extremely cheap and deterministic. A deep repair agent should be invoked only when a durable fault is established.

Because those roles are combined, the system repeatedly pays the cost of a repair-capable ChatGPT session just to discover whether repair is necessary.

**Classification:** orchestration architecture  
**Impact:** permanent  
**Priority:** critical

### Root cause C — image generation occurs inside recovery-heavy conversational context

Task 11 proved that operational context can leak into the native image-generation request.

The current equivalent-slot design allowed Watchdog conversations to act as image consumers. That improved image liveness, but it introduced context contamination.

**Classification:** image-pipeline architecture / context isolation  
**Impact:** permanent unless isolated  
**Priority:** critical

### Root cause D — control-plane state produces excessive durable churn

The system records many leases, generations, heartbeats, handoffs and recovery transitions as separate repository mutations.

Append-only incident evidence is valuable, but routine coordination should not produce large numbers of commits if a smaller state representation can safely provide the same correctness guarantees.

**Classification:** observability / orchestration efficiency  
**Impact:** permanent  
**Priority:** high

### Root cause E — the system repeatedly proves failure and reacquires authority

The run history contains recurring sequences such as:

1. prove previous writer failed;
2. acquire recovery lease;
3. acquire writer fence;
4. perform or attempt repair;
5. release;
6. Supervisor reacquires;
7. next Watchdog proves failure again;
8. repeat.

This is safe but inefficient.

**Classification:** fencing/liveness design  
**Impact:** permanent  
**Priority:** high

---

## What is *not* the main cause

The six editorial stories themselves do not appear to be the principal problem.

Tasks 01–10 were generally much shorter than the largest recovery loops. Five of the six post-Task-11 images also completed quickly compared with Task 11.

Therefore the correct optimization target is **not reducing editorial quality or lowering image quality**.

The following requirements should remain unchanged:

- exactly six stories;
- 2/2/2 editorial allocation;
- exactly one Agent Skills story;
- current-source discovery;
- full evidence and verification;
- two videos;
- two source-diverse podcasts;
- Watchlist;
- all-four-book relevance review;
- six professional detailed story-specific images;
- no low-quality fallback;
- protected publication CI;
- exact-SHA deployment;
- independent verification;
- `PUBLIC_CLOSED`;
- Task 29 cleanup and learning reconciliation.

---

## Post-close redesign recommendation

### Principle 1 — GitHub should perform frequent health checking

Use the GitHub Supervisor/watchdog and deterministic repository logic for minute-scale or five-minute-scale health checks.

A health check should determine small facts such as:

- execution active?
- terminal?
- current task?
- last substantive progress timestamp?
- live writer?
- queued request?
- lease valid?
- fault code?
- repair escalation required?

It should write or update a compact machine-readable health record.

ChatGPT should not need to reconstruct this state from a broad repository scan every ten minutes.

### Principle 2 — Scheduled ChatGPT should become the escalation layer

A Scheduled ChatGPT Watchdog invocation should begin by reading one compact health/escalation record.

Healthy state:

`HEALTHY -> terminate`

No broad repository sweep.  
No Kanban reconstruction.  
No learning-ledger load.  
No PR inspection.  
No recovery lease acquisition.  
No status commit.

Actionable state:

`FAULT -> read only the bounded evidence needed for that fault -> repair`

This preserves autonomous recovery while greatly reducing routine model work.

### Principle 3 — reduce the number of heavyweight recurring Watchdogs

The current six-slot design should not remain as six full recovery-capable ChatGPT sessions firing indefinitely.

Potential target architecture:

- frequent deterministic GitHub checks;
- one or a small number of ChatGPT escalation schedules;
- escalation state persisted durably so a later invocation resumes the exact stage rather than rediscovering the incident.

The exact number of ChatGPT escalation schedules should be established by testing, with usage efficiency treated as a first-class acceptance criterion.

### Principle 4 — create an isolated image-consumer context

Tasks 11–16 require a dedicated image-generation path.

The image consumer should receive only the minimum required material:

- exact execution/task/request identity;
- sealed single-story image specification;
- accepted-visible-text list;
- image quality constraints;
- transport/persistence contract;
- current task-specific authority.

It should **not** carry:

- Watchdog architecture prose;
- Protected Repair Autonomy doctrine;
- Supervisor history;
- Kanban details;
- unrelated task state;
- long operational-learning context.

Recovery reasoning and native image generation must be distinct contexts.

### Principle 5 — preserve one request → one authoritative image attempt owner

Do not sacrifice the current safety protections.

Retain:

- exact authoritative request selection;
- repair epoch / post-repair attempt identity;
- task-specific writer fencing;
- one request → one owner;
- accepted_locked immutability;
- saved-Git visual review;
- no duplicate generation;
- bounded targeted retry;
- exact durable evidence.

The redesign is about **context and activation efficiency**, not weakening correctness.

### Principle 6 — reduce routine repository mutation

Separate:

#### Durable evidence that deserves an append-only event
- task transition;
- accepted artifact;
- actual incident;
- writer death proof;
- repair decision;
- protected repair;
- CI outcome;
- publication lifecycle transition;
- terminal closeout.

#### Ephemeral coordination that should not require a new commit each time
- routine healthy poll;
- unchanged heartbeat;
- unchanged lease observation;
- repeated status projection;
- repeated no-op reconciliation.

Where safe, collapse or overwrite ephemeral control state rather than creating append-only Git history for every observation.

### Principle 7 — stop recovery schedules when they are not useful

After `PUBLIC_CLOSED` and Task 29:

- no execution-specific repair should continue;
- image-consumer activity should be inactive;
- no active-run recovery invocation should repeatedly inspect a terminal run;
- the next daily controller should reactivate only what the next edition requires.

Terminal-run guards must remain mandatory.

---

## Required post-close implementation sequence

Do **not** begin this sequence until the October 4 production execution is independently verified `PUBLIC_CLOSED` and Task 29 is Done.

1. Freeze and preserve the complete October 4 usage evidence.
2. Record final total Brief duration and all task durations.
3. Count final Watchdog invocations if the platform exposes enough evidence.
4. Count image attempts and rejected generations.
5. Establish a baseline efficiency record for Run 8.
6. Design the compact GitHub health/escalation record.
7. Modify the GitHub watchdog/Supervisor to maintain that record.
8. Replace broad ChatGPT polling with health-record-first logic.
9. Reduce heavyweight recurring Scheduled ChatGPT executions.
10. Build a dedicated isolated image-consumer contract.
11. Remove Watchdog/recovery prose from the image-generation context.
12. Reduce no-op/heartbeat Git commit churn.
13. Add usage-efficiency regression tests.
14. Run a non-production synthetic healthy case.
15. Run a non-production synthetic stalled-task recovery case.
16. Run a non-production image-context-isolation case.
17. Verify no regression to autonomy.
18. Verify no regression to one-writer/accepted_locked/protected-main safety.
19. Update living system documentation, Watchdog documentation, startup/readiness contracts and improvement Kanban.
20. Only then admit the redesign for the next production edition.

---

## Acceptance criteria

The hardening should not be considered complete unless all of the following are demonstrated.

### Autonomy
- A stalled task is detected without owner prompting.
- The system autonomously begins repair.
- Repair continues until substantive progress or a genuinely external blocker.
- No owner question is required merely to wake the system.

### Usage efficiency
- Healthy Watchdog checks do not require broad ChatGPT repository analysis.
- Healthy checks produce no repository commit.
- Repeated unchanged health state does not create new durable events.
- ChatGPT escalation occurs only for an actionable condition or required native image work.
- Image generation is not embedded in a mixed recovery conversation.
- Model-intensive recovery invocation count is measurably lower than the October 4 baseline.

### Image isolation
- A synthetic Watchdog/recovery context cannot contaminate an image-generation prompt.
- The native image consumer sees only the sealed story-specific context plus minimal authority/transport metadata.
- One accepted professional image can complete without unrelated operational text appearing in the generated asset.

### Reliability
- one execution;
- one writer;
- no duplicate task execution;
- no completed-task rework;
- no accepted_locked replacement;
- protected main remains protected;
- protected CI remains mandatory;
- terminal executions remain immutable.

### Quality
No reduction to story, evidence, media, Watchlist, book-connection, image, publication or live-verification quality gates.

---

## Metrics to add

The system should begin recording efficiency metrics so future runs can be compared objectively.

Recommended per-edition metrics:

- `scheduled_chatgpt_invocations`
- `healthy_noop_chatgpt_invocations`
- `actionable_recovery_chatgpt_invocations`
- `native_image_generation_attempts`
- `accepted_images`
- `rejected_image_attempts`
- `image_context_contamination_failures`
- `watchdog_git_mutations`
- `supervisor_git_mutations`
- `ephemeral_control_plane_commits`
- `substantive_progress_commits`
- `writer_takeovers`
- `dead_writer_proofs`
- `recovery_lease_acquisitions`
- `time_waiting_for_executor`
- `time_in_recovery`
- `time_in_substantive_work`
- `total_brief_elapsed`
- `usage_efficiency_baseline_version`

These metrics are operational telemetry only. They must never block publication or authorize retries.

---

## October 4 baseline findings to preserve

For the audited portion of Run 8:

- production branch commits observed: **321**
- orchestration-like commit subjects: approximately **173**
- Watchdog-named commit subjects: approximately **106**
- Task 11 commits: **67**
- Task 11 elapsed: approximately **4 hours 24 minutes**
- required story images: **6**
- native image attempts recorded: **9**
- Task 11 / `m02` native image attempts: **4**
- Task 11 rejected attempts before acceptance: **3**
- Task 18 elapsed: approximately **58 minutes**
- Task 21 elapsed: approximately **57 minutes**
- six-slot Watchdog theoretical cadence: up to **1,008 scheduled invocation opportunities/week**

The final post-close baseline should refresh these figures from terminal evidence before implementation begins.

---

## Risk if no change is made

If the current architecture remains unchanged, future Daily AI Briefs can remain autonomous but may continue to consume a disproportionate share of the user's weekly ChatGPT allocation.

The risk is particularly high when:

- a task stalls for several Watchdog cycles;
- a writer repeatedly dies or loses authority;
- protected repair requires several stages;
- image generation is attempted from an operationally contaminated conversation;
- a downstream repository task triggers repeated recovery ownership changes.

This creates a direct conflict between two system goals:

1. high autonomy, and  
2. low usage consumption.

The redesign must satisfy both.

---

## Decision

**Do not weaken autonomy. Do not weaken quality. Do not use Work, Codex, paid APIs, overage, alternate accounts or owner intervention as the solution.**

Instead:

> Move frequent deterministic health checking to GitHub, make ChatGPT a bounded escalation layer, isolate image generation from recovery context, and substantially reduce no-op orchestration work.

This is the required post-October-4-close hardening direction.

---

## Closeout guard

This document may be added to learning documentation while Run 8 is active, but the implementation itself is intentionally deferred.

Before any code, schedule, Watchdog, Supervisor, image-consumer, recovery, or publication behavior is changed, prove:

- October 4 execution is terminal;
- lifecycle is `PUBLIC_CLOSED`;
- Task 29 is Done;
- writer/fence is released;
- all six images are accepted_locked;
- final deployed SHA is verified;
- no production repair remains active.

Only then begin the usage-efficiency hardening described here.
