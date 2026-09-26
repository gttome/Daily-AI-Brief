# Daily Generative AI Brief — Living System Operations Reference

> **Repository:** `gttome/Daily-AI-Brief`  
> **Production branch:** `main`  
> **Timezone:** `America/Chicago`  
> **Status:** Canonical human-readable operating reference  
> **Current effective architecture:** September 26, 2026  
> **Machine-readable authorities:** `docs/operations/under80-runtime-contract.json` and `docs/operations/efficiency-operating-policy.json`

---

## Purpose

This document is the living, human-readable description of the production Daily Generative AI Brief system.

It has three jobs:

1. show the **complete normal production process**, from nightly readiness through `PUBLIC CLOSED`;
2. maintain the **troubleshooting, correction, recovery, and hardening record** for recurring operational failure modes; and
3. document the **notifications and alerts** the system sends to the owner as work progresses or when problems occur.

This file is not a historical narrative and must not drift away from the current production system. Historical implementation records remain useful evidence, but this document describes the **current operating model**.

If this document conflicts with the current machine-readable runtime contract, the machine-readable contract governs execution and this file must be corrected in the same change set.

---

# 1. Current Daily Production Schedule

The production system is state-driven. Clock times initiate supervision; durable repository state determines what work actually runs.

| Time — America/Chicago | Control | Purpose |
|---|---|---|
| **21:30 prior evening** | GitHub-native Nightly Readiness | Verify that the system is structurally ready for the next day's run and post the owner notification. |
| **~03:00** | GitHub metadata preflight | Fresh zero-model source discovery, metadata acquisition, date resolution and bounded candidate preparation. |
| **~03:15** | GitHub discovery/article-evidence preflight | Produce the bounded evidence package used by the editorial stage. |
| **04:00** | Daily Brief Production Orchestrator | Primary daily production start. Must continue toward durable `PUBLIC CLOSED`. |
| **04:30 and hourly thereafter while needed** | Publication Recovery Supervisor | Watchdog and recovery executor. Detects missed starts, stalls and incomplete stages and immediately resumes from the last valid checkpoint. |
| **08:30** | Live Validation & Secondary Recovery | Independent live validation; takes over if the primary recovery path has stopped making durable progress. |
| **10:30** | Closure Audit | Final daily supervisory audit, completion reconciliation and Command Center synchronization. |
| **After production closure** | Command Center reconciliation | Update Daily AI Brief operational state only after the final production SHA is known. |

The schedule is deliberately redundant. A later supervisor does **not** assume an earlier task ran successfully.

---

# 2. Complete Normal Production Process

## Phase A — Night-Before Readiness

| Step | Process | Required result |
|---:|---|---|
| 1 | **Nightly readiness trigger** | GitHub Actions runs the readiness audit during the 21:00 Central hour using the 21:30 scheduled trigger. |
| 2 | **Repository health check** | Required workflows, contracts, tools and production files are present and accessible. |
| 3 | **Schedule readiness check** | The next-day production and recovery chain is enabled and structurally consistent. |
| 4 | **Publication infrastructure check** | Protected branch, required CI, GitHub Pages and production paths are available. |
| 5 | **Readiness report** | A dated Markdown readiness record is persisted. |
| 6 | **Owner notification** | GitHub posts an `@gttome` notification comment to the readiness issue so GitHub Mobile/email can surface the result when the owner's GitHub notification settings permit it. |

---

## Phase B — Zero-Model Research Prework

| Step | Process | Required result |
|---:|---|---|
| 7 | **Establish edition date and cutoff** | Current America/Chicago edition date and authoritative research cutoff are recorded. |
| 8 | **Fresh metadata discovery** | Primary-source and approved discovery channels are scanned without model calls. |
| 9 | **Bound discovery breadth** | Acquisition stops at the configured source/budget limits rather than expanding indefinitely. |
| 10 | **Resolve publication/update dates** | High-value unresolved candidates receive bounded deterministic date enrichment. |
| 11 | **Deterministic metadata filtering** | Invalid, stale, duplicate, unresolved or low-value candidates are removed. |
| 12 | **Retain no more than 20 candidates** | The bounded shortlist is written to the preflight branch. |
| 13 | **Coverage gate** | At least 3 viable metadata candidates exist in each of the three focus categories. |
| 14 | **Agent Skills gate** | At least one story-ready Agent Skills signal exists and is identified for first review. |
| 15 | **Metadata receipt** | `PREFLIGHT_METADATA_READY` is persisted with zero model calls. |

### Current editorial category contract

The final edition contains exactly six stories in this order:

1. Technical AI Engineering
2. Technical AI Engineering
3. Applied Generative AI for Knowledge Workers
4. Applied Generative AI for Knowledge Workers
5. Agents for Everyone
6. Agents for Everyone

Exactly **one** of the six must be a qualifying reusable **Agent Skills** story.

---

## Phase C — Deep Evidence Preflight

| Step | Process | Required result |
|---:|---|---|
| 16 | **Select nine evidence candidates** | Exactly 9 candidates are prepared: 3 Technical, 3 Applied, 3 Agents. |
| 17 | **Retrieve original evidence** | GitHub Actions retrieves the authoritative article/source material, not summaries or downstream reposts. |
| 18 | **Compact evidence** | The total model-visible evidence package remains at or below 12,000 characters. |
| 19 | **Verify Agent Skills candidate first** | The preferred Skills candidate is tested for freshness, material change and 30-day novelty. |
| 20 | **Evidence receipt** | `PREFLIGHT_DISCOVERY_READY` is persisted with article-evidence proof. |

The editorial model does **not** reopen the raw discovery queue and does **not** redo network article retrieval.

---

## Phase D — Readiness Certification

| Step | Process | Required result |
|---:|---|---|
| 21 | **Preliminary readiness** | Preflight integrity, evidence completeness, coverage, contract versions and baseline SHA are checked. |
| 22 | **Novelty checks** | The 30-day story-memory rule is applied, including exact source/story reuse detection. |
| 23 | **System gate checks** | No unresolved Critical/High issue may block publication. |
| 24 | **Final readiness** | Durable state reaches `READINESS_FINAL`. |
| 25 | **Publication authorization** | Receipt records `publication_authorized=true`. |

A warning may be allowed only when it does not violate a mandatory publication gate.

---

## Phase E — Single Editorial Semantic Pass

| Step | Process | Required result |
|---:|---|---|
| 26 | **Load only bounded evidence** | The editorial pass reads the approved compact evidence and active contracts. |
| 27 | **Select six stories** | Exactly six compliant stories are chosen in the required 2/2/2 order. |
| 28 | **Select exactly one Agent Skills story** | It must be fresh, materially distinct and reusable-skill related. |
| 29 | **Write article content** | Headline, summary, why-it-matters, practical implication, evidence labels, source and reading support are created. |
| 30 | **Evaluate Watchlist in the same pass** | Current Watchlist changes and homepage teaser implications are determined. |
| 31 | **Evaluate book relevance in the same pass** | Professional Series references are added only when genuinely useful and verified. |
| 32 | **Evaluate media in the same pass** | Video and podcast candidates are chosen for verification. |
| 33 | **Write six image briefs** | Each selected story receives an independent story-specific image specification. |
| 34 | **Freeze editorial kernel** | `EDITORIAL_KERNEL_READY` is persisted. There is no second broad semantic pass. |

---

## Phase F — Watchlist, Media and Reader Support

| Step | Process | Required result |
|---:|---|---|
| 35 | **Build same-edition Watchlist state** | New / updated / carried-forward topics are derived from the current edition's canonical Watchlist data. |
| 36 | **Verify homepage teaser parity** | Homepage counts and changed-topic detail match the canonical Watchlist state. |
| 37 | **Verify video slot 1** | Qualifying video is confirmed against source, runtime and freshness rules. |
| 38 | **Verify video slot 2** | Second qualifying video is independently confirmed. |
| 39 | **Verify podcast slot 1** | Current relevant podcast episode is confirmed. |
| 40 | **Verify podcast slot 2** | Second episode must be source-diverse; no more than one may be from The AI Daily Brief. |
| 41 | **Freeze media** | Exactly 2 videos and exactly 2 podcasts are durably accepted before handoff. |
| 42 | **Verify book mappings** | Any reader-facing Professional Series references point to verified titles/chapters and are not forced. |

Missing required media is a targeted recovery condition; it is not permission to publish a degraded edition.

---

## Phase G — Image Production and Quality Gate

| Step | Process | Required result |
|---:|---|---|
| 43 | **Generate image 1–6 independently** | One separate image-generation request per selected story. |
| 44 | **Use professional textbook baseline** | White/near-white, detailed, instructional, story-specific, approximately 1200×630, readable labels and materially different compositions. |
| 45 | **Inspect each image visually** | Structural validity alone is insufficient. |
| 46 | **Reject low-quality output** | No collage, contact sheet, generic concept art, sparse fallback, placeholder or deterministic low-quality replacement is allowed. |
| 47 | **Targeted regeneration only** | Only the specific failed image is regenerated. |
| 48 | **Cross-image differentiation gate** | The six images must not be near-duplicate layouts or templates. |
| 49 | **ACCEPT + LOCK** | Each approved image receives durable accepted/locked identity and exact bytes. |
| 50 | **Image manifest** | Hash/blob identity and review evidence are persisted for all six images. |

Once accepted and locked, image bytes are reused on downstream retries unless the file is missing/corrupt or the underlying story materially changes.

---

## Phase H — Atomic Editorial Handoff

| Step | Process | Required result |
|---:|---|---|
| 51 | **Reconfirm trusted main SHA** | Handoff is based on an exact trusted production baseline. |
| 52 | **Create isolated editorial-handoff branch** | One production handoff branch is created or reused for the edition. |
| 53 | **Create text/JSON blobs** | Kernel, facts, media, image manifest and publication manifest are materialized. |
| 54 | **Create image blobs through Git Data API** | Binary images use base64 Git Data API transport; GitHub Contents API binary writes are prohibited. |
| 55 | **Create one atomic tree/commit** | All frozen handoff artifacts advance together. |
| 56 | **Validate remote handoff integrity** | Image bytes, manifests, staging ref and baseline binding must agree. |
| 57 | **Handoff ready** | All semantic/editorial assets are durable and immutable for downstream deterministic processing. |

---

## Phase I — Publication PR and Deterministic Expansion

| Step | Process | Required result |
|---:|---|---|
| 58 | **Create or reuse exactly one publication PR** | PR is open, non-draft, initially unlabelled, handoff branch → `main`. |
| 59 | **Deterministic handoff validation** | GitHub Actions verifies the full publication manifest and frozen assets. |
| 60 | **Expand canonical edition** | GitHub generates dated edition, homepage/latest, archive, permanent pages, feeds and associated derived views. |
| 61 | **Run candidate lint/contracts** | Story counts, labels, media, Watchlist, images, links and release contracts are checked. |
| 62 | **Apply publication-candidate state** | Only after deterministic validation succeeds. |

---

## Phase J — Protected CI and Promotion

| Step | Process | Required result |
|---:|---|---|
| 63 | **Run targeted affected tests first** | Fail quickly on relevant defects. |
| 64 | **Run required full deterministic CI** | Repository tests, integration checks, contract checks and build validation pass. |
| 65 | **Check exact PR head** | Promotion is tied to the tested head SHA. |
| 66 | **Check baseline movement** | Stale or conflicting production baselines are handled before promotion. |
| 67 | **Protected merge/promotion** | Publication enters `main` only through branch protection; no bypass. |
| 68 | **Record final production SHA** | This SHA becomes the candidate deployment identity. |

---

## Phase K — Pages Deployment

| Step | Process | Required result |
|---:|---|---|
| 69 | **GitHub Pages build** | Pages builds from the final production state. |
| 70 | **Exact-SHA deployment proof** | Deployment evidence identifies the production SHA being served. |
| 71 | **No premature success claim** | Merge or deployment alone does not equal completion. |

---

## Phase L — Independent Live Validation

| Step | Process | Required result |
|---:|---|---|
| 72 | **Verify edition date** | Public site displays the current intended date. |
| 73 | **Verify six stories and order** | Exact 2/2/2 ordering and one Agent Skills story. |
| 74 | **Verify all six images render** | Correct professional image bytes, no placeholders/fallbacks. |
| 75 | **Verify 2 videos / 2 podcasts** | Correct count, links and source-diverse podcast rule. |
| 76 | **Verify Watchlist parity** | Homepage teaser and Watchlist page derive from the same state. |
| 77 | **Verify homepage/latest/dated/archive parity** | All reader surfaces reference the same edition. |
| 78 | **Verify permanent story/media pages** | Routes open and stable IDs are correct. |
| 79 | **Verify feeds and navigation** | RSS, archive and navigation are current and functioning. |
| 80 | **Verify ratings/sharing/privacy contracts** | Reader controls work without exposing private data. |
| 81 | **Verify Professional Series links** | Relevant mappings are valid and non-deceptive. |
| 82 | **Run deterministic delta validation** | Final zero-model release-state validation passes. |

---

## Phase M — Completion and Closure

| Step | Process | Required result |
|---:|---|---|
| 83 | **Write completion evidence** | Final publication record identifies edition, final production SHA, deployed SHA, validation state and required evidence. |
| 84 | **Reconcile lifecycle state** | Durable run-state advances to `CLOSED`. |
| 85 | **Confirm no open Critical/High defects** | Mandatory blockers are resolved or publication remains fail-closed. |
| 86 | **Declare `PUBLIC CLOSED`** | Only now is the edition considered successfully complete. |
| 87 | **Synchronize Daily AI Brief Command Center** | Sync only after final production SHA is known; Command Center failure must not reopen a valid public edition. |
| 88 | **Run after-action / closure summary** | Problems, repairs, retries, checkpoints reused and recurrence-prevention controls are recorded. |

### Definition of complete

The edition is complete only when:

**protected `main` SHA = deployed Pages SHA = current canonical edition = validated live reader state = completion evidence = lifecycle `CLOSED`.**

---

# 3. Failure, Troubleshooting and Correction Model

## Universal recovery rule

Every recovery begins with:

> **Inspect durable state → identify first incomplete/invalid stage → preserve all valid earlier work → repair only the smallest failed stage → continue forward until `PUBLIC CLOSED`.**

A downstream failure must never automatically invalidate upstream editorial work or accepted assets.

---

## Current Troubleshooting and Hardening Ledger

| ID | Failure / symptom | Verified cause | Correction | Permanent hardening |
|---|---|---|---|---|
| T01 | Daily run can stop before publication is fully closed | Earlier production wording allowed completion at handoff/PR instead of `PUBLIC CLOSED` | Production Orchestrator changed to own the complete lifecycle | `PUBLIC CLOSED` is now the only successful terminal state. |
| T02 | Recovery fixes one problem and then stops at the next stage | Recovery logic treated each invocation like a single-stage repair | Recovery supervisor now continues through newly incomplete downstream stages | Non-stop recovery rule prohibits stopping at readiness, editorial, PR, CI, merge, deployment or live visibility. |
| T03 | Scheduled resume is due but never starts | Scheduler can miss/delay an invocation and there was no takeover rule | Missed start classified as `scheduled_start_missed` | Hourly recovery supervisor detects absence of durable progress and becomes the executor instead of waiting. |
| T04 | Production starts late or primary 04:00 task does not create a checkpoint | Schedule execution itself may be delayed or fail | Recovery begins independently from the earliest valid durable state | 04:30-and-hourly watchdog no longer assumes the 04:00 task ran. |
| T05 | Multiple recovery tasks could race | Redundant schedules can start duplicate recovery if they do not inspect state | Secondary validation now checks recent durable progress first | One active recovery path remains primary; secondary tasks take over only when progress stalls. |
| T06 | Agent Skills candidate repeats the previous day's story | Metadata signal passed but 30-day novelty failed during editorial transition | Replace only the Agent Skills evidence slot; keep all other preflight/readiness work | Skills novelty/material-change check is treated as a slot-level repair, not a reason for full rediscovery. |
| T07 | Low-quality images can be structurally valid | Structural image validation alone cannot assess editorial quality | Separate structural and editorial visual-quality gates | Editions from Sep 26 forward require both gates plus comparison against accepted quality baseline. |
| T08 | Image transport corruption/truncation | Binary content transported through unsuitable write paths | Use authenticated Git Data API base64 blobs | GitHub Contents API is prohibited for production binary image transport. |
| T09 | Accepted images were needlessly regenerated after downstream failures | Assets were not treated as immutable checkpoints | ACCEPT + LOCK exact image bytes | Only missing/corrupt assets or materially changed stories may trigger regeneration. |
| T10 | Qualification/replay used the wrong time context | Replay validation compared old evidence against current clock | Reuse original publication timestamp in qualification replay | Production clock and non-production replay clock are explicitly separated. |
| T11 | Candidate lint rejected valid accepted SVG image evidence | Candidate lint and authoritative image validator had different format/identity rules | Reuse authoritative inspector and identity checks | Candidate validation must share the same image acceptance contract. |
| T12 | Production variable wiring caused a downstream image-review failure | Workflow referenced stale `IMAGE_REVIEW_PATH` instead of `FINAL_IMAGE_REVIEW_PATH` | Correct variable wiring and add focused regression test | Targeted sentinel test protects this path before full CI. |
| T13 | Test-only assumptions rejected valid qualification branches | Test hard-coded production staging ref | Validate actual handoff staging ref by execution mode | Production and qualification branch rules are contract-aware. |
| T14 | GitHub scheduled nightly readiness could silently skip because the cron fired late | Gate expected an exact minute instead of tolerating GitHub schedule delay | Nightly gate accepts execution during the correct 21:00 Central hour | GitHub schedule delay is tolerated while preserving DST-safe local-hour gating. |
| T15 | Publication can appear successful before lifecycle evidence exists | PR, merge, Pages or live visibility were sometimes treated as completion proxies | Require completion record plus lifecycle closure | Success claims must be tied to durable `CLOSED` evidence. |
| T16 | Repair could redo expensive completed work | Recovery did not always begin from the first incomplete stage | Durable checkpoint reuse is mandatory | Explicit no-rework rule applies across research, editorial, media, Watchlist and images. |
| T17 | One failed media/image slot could trigger broad reruns | Failure scope was not sufficiently narrow | Invalidate only the failed slot and deterministic dependents | Stage-local invalidation is the default recovery model. |
| T18 | Old runbook language can conflict with newer architecture | Historical prose accumulated obsolete schedules and policies | Machine-readable runtime contract has execution precedence | This living document is the current human-readable reference and must be updated whenever operations change. |

---

## Failure Classification and Required Response

### A. Scheduled start missed

**Detection:** a task's expected time has passed and no corresponding current-day durable progress exists.

**Action:** record `scheduled_start_missed`, immediately take over from the last valid state, do not wait for the next nominal schedule.

### B. Recovery stalled

**Detection:** recovery was expected to advance but durable state has not changed.

**Action:** secondary supervisor takes over; preserve checkpoints and resume the first incomplete stage.

### C. Preflight failure

**Action:** repair only metadata discovery/date resolution/evidence prework. Do not create editorial content from an incomplete preflight.

### D. Novelty/source failure

**Action:** replace only the invalid candidate/slot when the bounded evidence set can support that repair. Do not rerun all discovery.

### E. Editorial kernel failure

**Action:** if no valid editorial kernel was ever persisted, perform the one permitted bounded pass. If one exists, reuse it.

### F. Media failure

**Action:** repair only the failed video/podcast slot; never publish with missing required media.

### G. Image failure

**Action:** regenerate only the failed individual image. No fallback-quality publication.

### H. Handoff failure

**Action:** preserve frozen editorial/media/image assets and repair only the atomic branch/blob/tree/commit transition.

### I. PR/CI failure

**Action:** fix the smallest deterministic defect and rerun only affected/failed jobs where supported.

### J. Pages/live validation failure

**Action:** keep the previous valid public state or repair the deterministic publication output. Do not redo editorial research unless the editorial source itself is proven invalid.

### K. Command Center sync failure

**Action:** report Command Center synchronization as degraded independently. A valid `PUBLIC CLOSED` edition remains closed.

---

# 4. Notifications and Owner Alerts

## Active notification channels

| Notification | Trigger | Channel | Content |
|---|---|---|---|
| **Nightly readiness notification** | Nightly readiness audit runs in the 21:00 Central hour | GitHub issue `@gttome` mention; surfaced by GitHub Mobile/email according to owner GitHub settings | Readiness status plus link to the dated readiness report. |
| **GitHub Actions / PR notifications** | GitHub events for repositories/issues/PRs the owner watches | GitHub Mobile / GitHub email according to owner GitHub settings | Standard GitHub workflow, PR, issue and mention notifications. |
| **Scheduled task result notifications** | Only for ChatGPT tasks whose notification flag is enabled | ChatGPT notification surface | Task result or alert. **Current Daily Brief production/recovery/validation schedules are not presently configured to rely on this channel.** |

No SMS, paid messaging service or separate email-delivery infrastructure is part of normal Daily Brief operations.

---

## Operational status events that must be recorded

These events are durable operational evidence even when they do not create a separate phone notification:

1. **NIGHTLY_READY** — system ready for next-day start.
2. **NIGHTLY_ATTENTION** — readiness audit detected a material blocker.
3. **PREFLIGHT_METADATA_READY** — bounded metadata candidate set accepted.
4. **PREFLIGHT_DISCOVERY_READY** — nine-candidate evidence package accepted.
5. **READINESS_PRELIMINARY** — preliminary gate passed.
6. **READINESS_FINAL** — publication authorized.
7. **SCHEDULED_START_MISSED** — expected scheduled task did not begin.
8. **RECOVERY_TAKEOVER** — watchdog or secondary supervisor became the executor.
9. **EDITORIAL_KERNEL_READY** — six-story editorial decision frozen.
10. **MEDIA_READY** — exactly 2 videos and 2 podcasts verified.
11. **IMAGES_ACCEPTED_LOCKED** — all six images passed and exact bytes were locked.
12. **HANDOFF_READY** — atomic editorial handoff successfully persisted.
13. **PUBLICATION_PR_OPEN** — current-edition publication PR exists.
14. **CI_FAILED** — protected candidate validation/CI failed.
15. **CI_RECOVERED** — smallest deterministic repair passed.
16. **MERGED_TO_MAIN** — tested publication head promoted through protected main.
17. **PAGES_DEPLOYED** — exact production SHA deployment completed.
18. **LIVE_VALIDATION_FAILED** — live production defect discovered.
19. **LIVE_VALIDATION_PASSED** — public reader checks passed.
20. **PUBLIC_CLOSED** — completion evidence and lifecycle closure are durable.
21. **COMMAND_CENTER_SYNC_DEGRADED** — public edition remains closed but Command Center synchronization failed.
22. **NEXT_RUN_READINESS_ATTENTION** — after-action found a hardening item that must be resolved before the next edition.

---

## Notification severity model

### Informational
Used for successful checkpoints that are useful for auditability but do not require immediate owner action.

Examples: preflight complete, CI passed, Pages deployed.

### Attention
Used when the system automatically repairs a recoverable problem.

Examples: one image rejected and regenerated, one media slot replaced, scheduled start missed but watchdog took over.

Owner action is generally not required.

### High / Critical
Used when the system cannot safely continue without violating a hard boundary.

Examples:

- paid/new service or credential would be required;
- sharing/privacy/security would need to change;
- protected CI would have to be bypassed;
- mandatory quality would have to be reduced;
- destructive or irreversible action is required;
- required platform capability is unavailable.

In these cases the last valid public edition remains live and the blocker must be clearly identified.

---

# 5. Continuous Hardening Rules

Every newly discovered production problem must produce **two outputs**:

1. the smallest safe correction for the immediate edition; and
2. a recurrence-prevention control for future editions.

A correction is not considered fully closed until its prevention mechanism is represented in one or more of:

- the machine-readable runtime contract;
- deterministic tests;
- workflow logic;
- recovery/supervisor scheduling;
- validation rules;
- this living operations reference.

---

# 6. Living-Document Maintenance Contract

This file must be updated whenever a production change materially alters:

- schedule times or schedule responsibilities;
- stage ownership;
- publication gates;
- research limits;
- story allocation;
- Agent Skills rules;
- media rules;
- image quality or transport rules;
- handoff/PR behavior;
- CI/promotion behavior;
- Pages/live-validation behavior;
- recovery logic;
- notification behavior;
- failure classifications;
- completion definition.

### Required update rule

Any operational hardening PR that changes one of those behaviors must update this file in the **same PR** unless the change is an emergency repair that cannot safely include documentation. In that emergency case, the first subsequent hardening/closure PR must reconcile this file before the issue is considered permanently closed.

### Source-of-truth hierarchy

1. **Machine-readable execution contract** — `docs/operations/under80-runtime-contract.json`
2. **Machine-readable efficiency/operations policy** — `docs/operations/efficiency-operating-policy.json`
3. **This living human-readable reference**
4. Historical prose runbooks, incident reports and iteration records

Historical documents remain evidence but must not override current execution rules.

---

# 7. Current Completion Checklist

A daily edition is not complete until all boxes below are true:

- [ ] Current-date metadata preflight passed.
- [ ] Current-date 9-item article evidence package passed.
- [ ] Final readiness authorized publication.
- [ ] Six stories are frozen in exact 2/2/2 order.
- [ ] Exactly one Agent Skills story is present.
- [ ] 30-day novelty checks passed.
- [ ] Current Watchlist and homepage teaser match.
- [ ] Exactly 2 videos are verified.
- [ ] Exactly 2 source-diverse podcasts are verified.
- [ ] Six professional story-specific images are accepted and locked.
- [ ] Atomic editorial handoff is complete.
- [ ] Exactly one current-edition publication PR exists.
- [ ] Required deterministic validation passed.
- [ ] Required protected CI passed.
- [ ] Exact tested publication head was promoted through `main`.
- [ ] GitHub Pages deployed the exact final production SHA.
- [ ] Homepage, latest, dated edition and archive agree.
- [ ] Permanent story/media pages work.
- [ ] Feeds and navigation work.
- [ ] Ratings/sharing/privacy checks pass.
- [ ] Completion record exists.
- [ ] No unresolved Critical/High production defect remains.
- [ ] Durable lifecycle state is `CLOSED`.
- [ ] Status is **PUBLIC CLOSED**.

---

## Related Current References

- `docs/operations/under80-runtime-contract.json`
- `docs/operations/efficiency-operating-policy.json`
- `docs/operations/editorial-handoff-template.json`
- `docs/operations/readiness-certification.md`
- `docs/operations/watchlist-runbook.md`
- `docs/images/publisher-policy.md`
- `docs/podcasts/publisher-policy.md`
- `.github/workflows/nightly-readiness.yml`

---

**Maintenance note:** This file should describe what the production system does **now**, not what it used to do. Add new hardening entries when problems are found, and revise the normal-process tables whenever the implemented workflow changes.
