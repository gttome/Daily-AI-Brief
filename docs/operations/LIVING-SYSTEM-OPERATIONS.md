# Daily Generative AI Brief

> [!IMPORTANT]
> **September 30, 2026 — controller simplification and self-healing.** Scheduled controller
> time starts work; it does not pace stages. A run drains all currently safe dependent work.
> Recoverable blockers are cleared in-run using the smallest authorized action: derive stale
> controller state from immutable results, reconcile a known outcome, resume the same bytes/
> operation key after transport uncertainty, advance after documented quality rejection, or
> repair pre-generation deterministic lint without allocating an attempt. External CI/deploy
> waits, execution-host limits, and current safety/tool denials are the only normal yield
> boundaries. Safety denials are never bypassed through alternate endpoints.
>
> Immutable image attempt results are authoritative. Controller counters/cursors and status
> boards are projections. Image completion should persist result + derived cursor in one state
> commit whenever possible. Passive timing captures operation durations, attempts-to-accept,
> first-attempt acceptance and accepted-image wall time; timing cannot fail publication.
> If overhead worsens, remove non-value-add steps before adding machinery.


> [!IMPORTANT]
> **September 30, 2026 — first-attempt image hardening.** Before native generation, compile
> each sealed story packet into `strict-image-render-spec-v1`. The render prompt excludes
> headline, source URL and orchestration identifiers; visible text is an exact allowlist;
> people/faces/avatars/group icons/humanoids are prohibited; and the prompt explicitly
> forbids cross-story visual carryover. A deterministic lint rejects positive use of any
> story-specific prohibited term before generation and consumes zero attempts. This guard
> is part of the existing image lifecycle, not another workflow, probe or qualification
> system. Post-generation V2 quality review and Git content-address verification remain
> unchanged.



> [!IMPORTANT]
> **September 29, 2026 — permanent image simplification.** Production image handling is now
> one lifecycle: **generate → transfer file → verify Git content identity → review →
> accept/reject**. Compute SHA-256 and Git blob from the exact PNG, write once, require
> GitHub's returned blob/tree binding to match, and continue. Raw binary reread is optional
> strengthening, not a hard publication gate when content identity is already proven.
> Quality rejection advances the bounded attempt; transport uncertainty resumes the same
> bytes. Do not create per-image workflows, probes or owner uploads. The only permitted
> Base64 text handoff is the protected bounded chunk bridge described below; ad hoc text
> handoffs remain prohibited.
> For every future publication blocker, perform a **simplification-first assessment** before
> adding machinery: reuse an existing primitive, remove redundant proof layers, and choose
> the smallest change that preserves required quality, provenance, safety and PUBLIC CLOSED
> gates.

## September 29, 2026 — Recoverable edition execution (staged integration)

> [!IMPORTANT]
> The owner approved producer-owned image delivery, deterministic continuation and immutable build-once edition bundles. The new `reliable-edition-v1` profile uses a durable operation journal and stable operation keys. It resumes interrupted capture/review/persistence rather than regenerating after an unknown outcome. The shared image entry point routes this profile to `executeRecoverableImage`; it cannot silently fall back to the volatile executor. The existing connector route and all quality gates remain.

Normal transport remains `connector-first-v1`. Complete payload delivery failures remain `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`; all V2 raw/final provenance requirements remain unchanged. A current denial stops that operation; no alternate endpoint may evade it.

When the complete Base64 `create_blob` request is rejected before reaching GitHub, `_tools/image-chunk-bridge.mjs` is the protected executable fallback. A fenced scheduled worker may commit canonical Base64 parts and one manifest bound to execution, branch, image task, approved run-scoped target, byte count, SHA-256, Git blob identity and source writer generation. A later fenced Supervisor generation reconstructs and verifies the exact PNG, writes the approved path, verifies read-back, records an immutable result and deletes the temporary parts. Malformed, mismatched, unsafe-path or future-generation requests fail closed. Transport success is never image acceptance; the saved Git asset must still pass visual review.

A real supported native host and binary-reader adapter are still required; their operational availability is **not established by this code release**. No new full Q is authorized until the actual handoff succeeds. New-profile discovery requests check admission before network work. Legacy scheduled/frozen requests are not silently migrated or disabled. Do not repair terminal Q24/Q25 into PASS. Do not confuse local Git/fixture recovery tests with six new native images or public closure.

Use `_tools/edition-execution.mjs status` for terminal-first machine-derived status. Use the durable producer job and controller where the actual host integrations exist. Current source, media, image and publication validators remain the stage authorities. A later main change requires explicit compatibility packaging, not discarding valid research. See [Reliable edition execution](reliable-edition-execution.md) for code interfaces, retry semantics, exact implementation scope and the remaining host-integration work.

---

## September 28, 2026 — Connector-first image transport parity

> [!IMPORTANT]
> **Current routing: `connector-first-v1`.** The existing authenticated GitHub connector is the normal image-transfer route for both production and qualification: `create_blob` (complete Base64-encoded binary bytes), `create_tree`, `create_commit`, and non-force `update_ref`. **No local GitHub token or native Git credential is required for that connector route.** This amendment corrects the adapter-precedence regression; it does not claim that an outstanding image has been uploaded.

The authoritative machine policies remain `under80-runtime-contract.json` and `efficiency-operating-policy.json`. Their normal image lane remains `github_git_data_api`, including the existing restriction on Contents-based binary transport in that lane. The PR286 file-host uploader is retained as an independently tested utility for an already authenticated file-capable host, not a replacement or prerequisite for the normal connector path. Its missing-token result is adapter-specific and must never disable or disqualify the connector. Do not rerun that local CLI merely to rediscover absent local credentials. No credential export, new credentials, Work, Codex or paid-model API is authorized.

**Payload delivery is a separate capability:** the full real image must actually reach the connector's binary-content argument using a supported execution-host mechanism. Tool exposure, a computed SHA, a Library file ID or a partial encoded snapshot is not delivery. Never put a local path or opaque file reference into a literal Base64 field. Where complete payload delivery is unavailable, record `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`, not missing GitHub authentication. Do not invent an adapter or pass fixture results as a live transfer.

**Complete the real round trip:** verify the returned blob against the original file, attach it to the current isolated handoff tree, create a commit with the live handoff head as parent, and update only that branch without force. Preserve concurrent changes; do not rebuild a recovery branch from an old main tree. Reuse existing exact blobs and the existing image read-back workflow. Require actual byte equality and SHA-256 read-back before capture completion; all V2 raw/final provenance, factual, professional-quality, differentiation and accepted-byte gates remain unchanged. A current denial stops that operation; this routing rule never authorizes an alternate endpoint to evade a safety block.

**Q24:** both earlier m04 outputs are already preserved and rejected. The third correct-subject native output and its 1200x630 candidate are preserved in Library, but their Git capture and final acceptance remain governed by live Q24 receipts. Reuse the original cutoff, five passed components, frozen requests and failures; do not generate attempt 4 or advance to m03 while the third output is unresolved. Do not infer successful native ingress from PR286's repository-local sample. The supervisor must stay on the first incomplete operation and notify only on real advancement or a new material blocker.

---


## Historical PR286 utility guidance — not the normal connector route

The independently tested `github-image-file-transfer-v1` utility applies only where its explicit file-host prerequisites and separate authorization are satisfied; it is not the normal production or qualification image route. The shared `transferImageFile` function, `_tools/github-image-transfer.mjs` and `.github/actions/transfer-image` take an actual local PNG/WebP, perform one Contents API write and verify raw bytes at the returned immutable commit. Base64 stays inside executable code; no per-image text bridges, bespoke workflow or owner upload. Identical existing bytes are verified and reused without another write; different bytes, protected branches, unsafe paths, denials and uncertain writes fail closed. Keep one writer per handoff branch.

A verified transfer is not image acceptance. All V2 image quality and visual-only task-delivery requirements remain. The local file and existing repository credential must be present on the same host. This code does not add a file-upload parameter to a text-only ChatGPT connector or prove native-output delivery to GitHub Actions. Known safety-blocked operations must not be replayed through this helper or another endpoint. Q24's previously blocked attempt-2 branch operation remains separate from the independent transport proof; do not report it recovered from a proof-branch upload.

See [Image file transfer](image-file-transfer.md) for interfaces, recovery codes, host requirements and proof scope. Preserve all frozen Q24 components and failed outputs.

---


## September 28, 2026 — Visual-only native generation task delivery

> [!IMPORTANT]
> Use `visual-only-task-delivery-v1` alongside the unchanged V2 image gates. The supervisor prepares and verifies an automatic image-only task whose prompt is the exact compiled visual instruction. Do not put GitHub, run status, capture, review, retry or continuation instructions into that task prompt. No owner-created chat or manual transfer is required; hidden context isolation is not asserted.

`_generator/lib/native-image-delivery.mjs` and `_tools/native-image-delivery.mjs` bind the actual submitted task text and select the next safe unfinished operation. Recover existing generated bytes, complete exact Git capture/read-back and rejection review before allocating another attempt. A pending task is not permission to duplicate generation; four attempts remain the maximum. A preserved Library copy is not a Git receipt, and a compiler/test PASS is not successful native generation. The execution host must still demonstrate scheduling, native output recovery, review and exact persistence.

See [Native image task delivery](native-image-task-delivery.md). Preserve frozen Q24 requests, its five completed components, cutoff/policies, failed outputs and earlier receipts. No acceptance gate, historical result or public edition is changed by this repair. Protected CI and normal merge are required before adoption; actual corrected-image and unattended-production proof remain separate.

---

## September 28, 2026 — Automated production/qualification image parity

> [!IMPORTANT]
> **Current image policy: `production-image-execution-v2`.** Production and qualification now use the same request builder, execution/receipt contract and production image gate. No owner-created fresh chats, owner image uploads, mandatory manual Library transfers or manual image approvals are part of the new path. This amendment supersedes earlier fresh-worker and Library-exit procedures for new runs only; historical IH/Q evidence remains unchanged.

The automatic sequence is sealed single-story request → native image generation → exact output capture → automated post-generation review → bounded same-story regeneration when needed → exact Git persistence/read-back. Review must be a later phase, not necessarily a different conversation. The explicit payload excludes other stories and operational content; hidden runtime isolation is **not asserted**. Keep all factual, professional-quality, six-image differentiation and exact-byte gates. No Work, Codex or paid-model API use is authorized.

`_generator/lib/image-execution.mjs` is shared by both modes. The qualification builder is a direct alias of the production builder. `_tools/image-execution.mjs` prepares requests and validates actual receipts; request preparation is not generation. Missing native generation/review/transport is `CAPABILITY_BLOCKED`, never an owner-upload workaround. For September 28 editions onward, the combined production image gate requires V2 live execution evidence. Earlier editions retain historical validators.

**Release and proof are distinct:** require protected CI/merge for this change; require actual scheduled native generation, capture, review and exact persistence before declaring the image stage unattended. Adapter fixtures cannot establish production automation. See [Automated image execution](automated-image-execution.md). Preserve Q24's completed components and original cutoff; record the execution amendment without rewriting frozen receipts or allocating Q25 while Q24 is nonterminal.

---


## September 28, 2026 — Q23 media reference-time correction

> [!IMPORTANT]
> Q23 is terminal FAIL at MEDIA_READY, preserved at `cd940858dee9bb5a4c5e6d84cf2a7dbf47b4618d`. Its article preflight and one semantic selection passed and remain unchanged. This correction is not released until protected CI passes on the actual final head and normal merge completes. Never resume or refill Q23 into PASS.

**Demonstrated defect:** workflow 36474976174 used publisher-verified Everyday AI episode 871 metadata: publication `2026-09-28T11:00:00Z`, duration 1,853 seconds, Q23 cutoff `2026-09-28T19:10:36Z`. The old selector rejected that 8.18-hour-old candidate because it used UTC midnight. Both video and podcast edition-validation paths contained the same reference-time error. No source timestamp was changed to make it pass.

**Versioned correction:** `media-research-cutoff-v1` uses the original recorded research cutoff for selection and canonical edition validation. New run requests, semantic receipts and kernels must carry `media_freshness_policy`; kernel expansion retains it. Selectors receive the original cutoff and policy explicitly. Unknown policies, missing or timezone-free cutoffs, unresolved source dates and future sources fail closed. Historical artifacts without the field retain their recorded legacy interpretation. The metadata gate remains the authoritative cutoff source; execution time does not extend it.

| Existing limit | Unchanged value |
|---|---|
| Videos | Exactly two; maximum age 72 hours; preferred duration <=10 minutes, fallback <=15, last resort <=20 |
| Podcasts | Exactly two source-diverse selections; 48-hour primary, 7-day fallback and documented 30-day exception |
| Evidence | Verified identity, original timestamp, exact runtime and reviewed source support; metadata capture is not editorial approval |
| Other gates | Six stories, 2/2/2, one reusable Agent Skills story, nine article packets, 12,000 characters, novelty, professional images and nonproduction isolation |

**Verified source-resolution lesson:** the stale Everyday AI WordPress feed is not evidence that the podcast has no recent episodes. Publisher-distributed Apple episode pages bind episode ID, show ID, GUID, exact release time and exact runtime. Saved-page artifact 10991834733 plus metadata-verification artifact 10992499980 provide three independently extracted records: Everyday AI 871 (September 28, 11:00 UTC, 30:53), Practical AI 373 (September 24, 09:00 UTC, 48:52), and AI for Humans 197 (September 24, 10:00 UTC, 48:21). Practical AI also supplies an episode page and transcript. These are metadata-qualified candidates, not selected media or reusable approval for a later Q. Preserve source hashes and review/novelty limitations. No oversized feed limit was raised.

**YouTube diagnostic correction:** offline inspection of the three saved IBM-linked responses found LOGIN_REQUIRED / bot challenges with absent videoDetails. They are access challenges, not confirmed identity mismatches. Retain the original observations and append this diagnosis; do not retry or bypass challenges, invent dates/runtimes, or claim zero qualifying videos exist. Video selections remain unresolved.

**Acceptance and continuation:** run new same-day/future/boundary/historical/kernel-round-trip tests, the full suite and protected CI; include contracts and these living-document amendments in the same PR; remove the temporary workbench. After normal merge, resolve live refs and start the next unused Q from actual merged main and an observed fresh cutoff. Require matching execution evidence. Preserve PR281/PR282, terminal Q/IH records, PR117, published content, the separate greenfield repository and Sites. No Work, Codex or paid-model API is authorized; billing is unobserved.

---

## September 28, 2026 — Q22 article-body extraction and evidence guard

> [!IMPORTANT]
> **PR #281 is already released; Q22 remains terminal FAIL.** This narrow correction becomes released behavior only after successful protected CI on its actual final head and a normal merge. The source-write retry through the same connected GitHub tool succeeded after the owner attached the checksum-verified bundle. No safeguard was bypassed. The older persistence incident below does not authorize reconstructing this recovered repair.

### Article evidence must contain a source body, not an HTTP-success page shell

Q22 cleared preflight coverage with 11 Technical / 4 Applied / 5 Agents and nine evidence packets, but two Applied packets contained only 13-word and 15-word titles. Its terminal failure `qualification_article_evidence_title_only_false_readiness` and original evidence remain unchanged on `discovery-preflight/qualification/2026-09-28-Q22` at `4466d7f499b1848238bbe4594af4589d20d062f0`. Never refill, rerun or repair that Q into PASS.

The completed two-response capture in workflow **36461068265**, artifact **10987306772**, found the Microsoft Community Hub article text in JSON-LD `BlogPosting.description`, with matching canonical `mainEntityOfPage.@id` and headline. The earlier cleaner discarded scripts and lost that body. The capture is reused, not repeated; no authenticated endpoint, browser execution, extra article review or new source is required.

`_tools/article-evidence-text.mjs` parses JSON data without executing scripts, requires a supported article type and matching canonical URL, and rejects a conflicting headline. It prefers `articleBody`, then an adequately long article `description`, then visible article/main text with common navigation regions removed. Unrelated Organization descriptions, different article identities, malformed JSON and missing canonical identities cannot provide a structured source body.

Mechanical minimums are **80 source-body words and 25 excerpt words**, with explicit title-only rejection. These thresholds reject page shells; they do not certify semantic completeness. Editorial review must still reject irrelevant, promotional, unsupported or otherwise inadequate evidence. The collector records extraction method and body count, excludes insufficient retrievals from readiness, and rechecks excerpts after model-visible truncation. The current-policy semantic validator independently rejects selected evidence that fails the same guard. Historical legacy-policy artifacts retain their prior validator semantics.

| Preserved source | Original Q22 words | Local captured-response replay words | Extraction method |
|---|---:|---:|---|
| m05, Microsoft Copilot change management | 13 | 1,734 | Identity-matched `jsonld.description` |
| m06, Microsoft Skills Hub AI at work | 15 | 431 | Identity-matched `jsonld.description` |

These are prior parser-replay results, not a repaired Q22 or a new qualification. The recovered bundle records 468 passing local tests and 24 contract checks. Its exact four source/test files are verified by SHA-256 before this document integration; current GitHub workflow results must be reported separately from saved local evidence. The final PR must pass protected `validate` before normal merge.

**Unchanged constraints:** the nine-candidate plan, per-focus balance, preferred reusable Agent Skills candidate, bounded retrievals, 12,000-character evidence ceiling, one semantic pass, novelty, article freshness, media, professional accepted_locked images, nonproduction isolation and no Work/Codex/paid-model APIs. Insufficient evidence does not permit replacements in a frozen Q or higher review limits. Account billing remains unobserved.

**Continuation:** remove the temporary Q22 workbench from the final release diff, include these operating documents with the four source/test changes, require protected CI and normal merge, then recheck live refs and start only the next unused Q from actual merged main with an observed UTC cutoff. Verify matching workflow execution before reporting a start. PR #117, the separate greenfield repository, Sites and public editions are outside this correction.

---

## September 28, 2026 — Article policy amendment (`article-24-72-168-v1`)

> [!IMPORTANT]
> This policy applies only after the coordinated change passes protected CI and is merged. A prepared branch or local test is not a release. Historical Q1–Q21 failures and D01–D05 audits remain immutable.

| Publication age at the recorded cutoff | Treatment |
|---|---|
| 0–24 hours inclusive | Primary priority, subject to evidence, relevance, novelty and focus fit |
| Over 24–72 hours inclusive | Normal recency fallback only when qualifying primary items cannot fill that focus |
| Over 72–168 hours inclusive | Extended recency fallback only when newer qualifying items cannot fill that focus |
| Over 168 hours, future or unresolved | Not eligible for a daily article slot |

Shortlist reservation and the nine-candidate evidence plan use freshness-band priority before score. Required focus/Agent Skills reservations remain; there is no rigid recent-story quota. The 24-hour discovery early-stop measure excludes fallback articles. Original publication timestamps are preserved; `dateModified` never creates a new publication date. Every new-policy fallback requires a substantive editorial `fallback_reason`; its `fallback_band` must match its age. Reader labels are **Recency fallback** or **Extended recency fallback**, with the original source timestamp. The coverage statement discloses fallback use.

The explicit `article_freshness_policy` field identifies new-policy artifacts. Missing identity on historical artifacts retains ordinary-72/Skills-168 semantics. Legacy constants, historical Q14/Q15/Q16 reports and older editions are not reinterpreted. The legacy metadata CLI option remains available for regression evidence only, not new runs.

**Verified source paths:** n8n RSS and Notion releases RSS are activated with bounded transport/date-parser evidence. The captured n8n samples and latest captured Notion entry are older than seven days, so activation is not proof of fresh yield. Box and Airtable remain limited by article/date qualification; Make HTTP 403 and Adobe saved-feed HTTP 404 are not operational paths. Google Workspace feed recovery from PR #280 is reused without a duplicate registration. Expired source pins are omitted from live seeding, not deleted from history.

**Unchanged:** six stories in 2/2/2 order, one reusable Agent Skills story, <=20 metadata candidates, nine balanced evidence candidates, <=12,000 model-visible evidence characters, one semantic pass, two verified videos, two source-diverse podcasts, all media freshness/duration rules, professional accepted_locked images, novelty, evidence and nonproduction isolation. No Work, Codex or paid model API invocation is authorized; account billing is unobserved.

**Recovery and acceptance:** commit code, registry, source plan, tests and all living documents in this same change set; run targeted/full tests and protected CI; merge before allocating the next unused Q from live refs and current UTC time. Require an actual matching execution before reporting a Q started. A failed Q is terminal and is followed by a minimal tested correction and a fresh identity. Preserve valid completed stages and do not repeat D05 or PR #280.

**September 28 persistence incident:** the earlier assistant reported local test counts, but the next runtime contained only the baseline workspace and publisher fixtures, not the substantive patch or its test logs. Those old counts cannot certify the recovered implementation. Reconstruct only the missing patch from preserved inputs, persist it before ending the invocation, and attach fresh actual CI evidence. Do not report local-only work as a GitHub release.

---

### Earlier operating record (superseded only for current ARTICLE freshness by the amendment above)

## Living System Operations Reference

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/STATUS-LIVING%20REFERENCE-0A7F5A?style=for-the-badge">
  <img alt="Production branch" src="https://img.shields.io/badge/BRANCH-main-1F6FEB?style=for-the-badge">
  <img alt="Timezone" src="https://img.shields.io/badge/TIMEZONE-America%2FChicago-6F42C1?style=for-the-badge">
  <img alt="Completion state" src="https://img.shields.io/badge/SUCCESS%20STATE-PUBLIC%20CLOSED-2DA44E?style=for-the-badge">
</p>

<p align="center">
  <strong>Canonical human-readable operating model for the production Daily Generative AI Brief system</strong>
</p>

---

> [!IMPORTANT]
> **This is a living production document.**  
> It must describe what the system does **now**, not what it used to do. Any material change to schedules, stage ownership, quality gates, recovery logic, notifications, completion semantics, or recurring hardening controls must update this file.

> [!NOTE]
> **Execution authority order**
> 1. `docs/operations/under80-runtime-contract.json`
> 2. `docs/operations/efficiency-operating-policy.json`
> 3. **This document**
> 4. Historical runbooks, incident reports and implementation records

---

## Executive Control Panel

| Control | Current production rule | Visual status |
|---|---|---|
| **Repository** | `gttome/Daily-AI-Brief` | 🟦 Source of truth |
| **Production branch** | `main` | 🟩 Protected |
| **Daily success condition** | `PUBLIC CLOSED` | 🟢 Required |
| **Story count** | Exactly **6** | 🟢 Fixed |
| **Story allocation** | **2 Technical / 2 Applied / 2 Agents** | 🟢 Fixed |
| **Agent Skills** | Exactly **1** qualifying story | 🟢 Required |
| **Videos** | Exactly **2** | 🟢 Required |
| **Podcasts** | Exactly **2**, source-diverse | 🟢 Required |
| **Story images** | Exactly **6**, professional, accepted + locked | 🟢 Required |
| **Low-quality image fallback** | Prohibited | 🔴 Never |
| **Broad restart after downstream failure** | Prohibited | 🔴 Never |
| **Recovery model** | Resume from first incomplete stage | 🟢 Mandatory |
| **Protected CI bypass** | Prohibited | 🔴 Never |
| **Completion proxy** | PR / merge / deploy / live page alone | 🔴 Insufficient |
| **True completion** | Main SHA = Pages SHA = validated edition = completion evidence = `CLOSED` | 🟢 Required |

---

## Visual Legend

| Symbol | Meaning |
|:---:|---|
| 🟢 | Required / healthy / accepted |
| 🟡 | Warning / recoverable attention |
| 🔴 | Prohibited / blocking failure |
| 🔵 | Durable checkpoint / system state |
| 🟣 | Editorial / semantic work |
| 🟠 | Recovery / watchdog / repair |
| ⚙️ | Deterministic GitHub automation |
| 🔒 | Immutable or protected |
| 📣 | Owner notification |
| 📌 | Durable evidence |
| ♻️ | Reuse existing valid work |
| 🧪 | Validation / test |
| 🚀 | Promotion / deployment |

---

## System at a Glance

```mermaid
flowchart LR
    A["🌙 Nightly Readiness"] --> B["⚙️ Metadata Preflight"]
    B --> C["⚙️ Evidence Preflight"]
    C --> D["🔵 READINESS_FINAL"]
    D --> E["🟣 Editorial Kernel"]
    E --> F["🎧 Media + Watchlist"]
    F --> G["🖼️ 6 Images<br/>ACCEPT + LOCK"]
    G --> H["🔒 Atomic Handoff"]
    H --> I["🔵 Publication PR"]
    I --> J["🧪 Protected CI"]
    J --> K["🚀 Merge to main"]
    K --> L["🌐 GitHub Pages"]
    L --> M["🧪 Live Validation"]
    M --> N["📌 Completion Evidence"]
    N --> O["🟢 PUBLIC CLOSED"]

    classDef night fill:#24292f,color:#fff,stroke:#57606a,stroke-width:2px;
    classDef system fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;
    classDef editorial fill:#fbefff,color:#8250df,stroke:#a475f9,stroke-width:2px;
    classDef media fill:#fff8c5,color:#633c01,stroke:#d4a72c,stroke-width:2px;
    classDef asset fill:#fff1e5,color:#953800,stroke:#fb8f44,stroke-width:2px;
    classDef release fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;
    classDef closed fill:#2da44e,color:#fff,stroke:#1a7f37,stroke-width:3px;

    class A night;
    class B,C,D system;
    class E editorial;
    class F media;
    class G,H asset;
    class I,J,K,L,M,N release;
    class O closed;
```

> [!TIP]
> The system is intentionally **checkpoint-driven rather than clock-driven**. Schedules initiate supervision; durable repository state determines the next action.

---

# Table of Contents

- [1. Daily Production Schedule](#1-daily-production-schedule)
- [2. End-to-End Production Architecture](#2-end-to-end-production-architecture)
- [3. Complete Normal Production Process — 88 Steps](#3-complete-normal-production-process--88-steps)
- [4. Recovery and Self-Healing Model](#4-recovery-and-self-healing-model)
- [5. Troubleshooting & Hardening Ledger](#5-troubleshooting--hardening-ledger)
- [6. Failure Classification Playbook](#6-failure-classification-playbook)
- [7. Owner Notifications & Alerts](#7-owner-notifications--alerts)
- [8. Notification Event Catalog](#8-notification-event-catalog)
- [9. Continuous Hardening Rules](#9-continuous-hardening-rules)
- [10. Living-Document Maintenance Contract](#10-living-document-maintenance-contract)
- [11. Daily Completion Checklist](#11-daily-completion-checklist)
- [12. Related Production References](#12-related-production-references)

---

# 1. Daily Production Schedule

## Daily supervisory cadence

```mermaid
gantt
    title Daily Generative AI Brief — America/Chicago
    dateFormat HH:mm
    axisFormat %H:%M

    section Prior Evening
    Nightly readiness + owner notification :done, ready, 21:30, 30m

    section Zero-Model Prework
    Metadata preflight                   :active, meta, 03:00, 15m
    Evidence preflight                   :evidence, 03:15, 30m

    section Production
    Primary Production Orchestrator      :prod, 04:00, 4h
    Hourly Recovery Watchdog             :crit, recover, 04:30, 6h

    section Independent Supervisors
    Live Validation + Secondary Recovery :validate, 08:30, 90m
    Closure Audit                        :close, 10:30, 60m
```

### Schedule table

| Time — America/Chicago | Control | Responsibility | If prior work did not run |
|---|---|---|---|
| **21:30 prior evening** | 📣 GitHub-native Nightly Readiness | Verify next-run structural readiness and notify owner | Record attention state |
| **~03:00** | ⚙️ Metadata Preflight | Fresh zero-model source discovery and bounded metadata shortlist | Later supervisor may trigger missing prework |
| **~03:15** | ⚙️ Evidence Preflight | Build bounded nine-candidate evidence package | Later supervisor repairs only missing evidence stage |
| **04:00** | 🟣 Production Orchestrator | Primary run from current durable state through `PUBLIC CLOSED` | 04:30 watchdog takes over |
| **04:30 + hourly** | 🟠 Publication Recovery Supervisor | Detect missed starts/stalls and continue from last valid checkpoint | **Immediately becomes executor** |
| **08:30** | 🧪 Live Validation & Secondary Recovery | Independently verify progress/live state; take over if primary path stalled | Becomes recovery executor |
| **10:30** | 📌 Closure Audit | Final lifecycle, Command Center and documentation reconciliation | Repairs remaining safe gaps |
| **After closure** | 🔵 Command Center reconciliation | Reflect final production SHA and final edition state | May be degraded independently without reopening public edition |

> [!WARNING]
> A schedule being **enabled** is not evidence that it **ran**.  
> A scheduled start that produces no current-day durable progress is classified as `scheduled_start_missed` and triggers takeover.

---

# 2. End-to-End Production Architecture

## Ownership map

```mermaid
flowchart TB
    subgraph GA["⚙️ GitHub Actions — deterministic / zero-model"]
      G1["Source discovery"]
      G2["Date enrichment"]
      G3["Metadata gate"]
      G4["Article evidence retrieval"]
      G5["Handoff validation"]
      G6["Edition expansion"]
      G7["Tests + protected CI"]
      G8["Pages deployment"]
      G9["Final deterministic validation"]
    end

    subgraph SEM["🟣 Semantic Editorial Layer"]
      S1["One bounded editorial pass"]
      S2["6 stories / 2-2-2"]
      S3["Exactly 1 Agent Skills story"]
      S4["Watchlist + books + media decisions"]
      S5["6 image briefs"]
    end

    subgraph IMG["🖼️ Image Production"]
      I1["6 independent generations"]
      I2["Editorial visual inspection"]
      I3["Structural validation"]
      I4["ACCEPT + LOCK exact bytes"]
    end

    subgraph SUP["🟠 Supervisory / Recovery Layer"]
      R1["04:00 primary orchestrator"]
      R2["04:30 + hourly watchdog"]
      R3["08:30 secondary recovery"]
      R4["10:30 closure audit"]
    end

    G1 --> G2 --> G3 --> G4 --> S1
    S1 --> S2 --> S3 --> S4 --> S5 --> I1
    I1 --> I2 --> I3 --> I4 --> G5
    G5 --> G6 --> G7 --> G8 --> G9

    R1 -. supervises .-> G1
    R2 -. resumes .-> G1
    R2 -. resumes .-> S1
    R2 -. resumes .-> G5
    R2 -. resumes .-> G7
    R3 -. validates / takes over .-> G8
    R4 -. closes / reconciles .-> G9

    classDef gh fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;
    classDef sem fill:#fbefff,color:#8250df,stroke:#a475f9,stroke-width:2px;
    classDef img fill:#fff1e5,color:#953800,stroke:#fb8f44,stroke-width:2px;
    classDef sup fill:#fff8c5,color:#633c01,stroke:#d4a72c,stroke-width:2px;

    class G1,G2,G3,G4,G5,G6,G7,G8,G9 gh;
    class S1,S2,S3,S4,S5 sem;
    class I1,I2,I3,I4 img;
    class R1,R2,R3,R4 sup;
```

## Lifecycle state machine

```mermaid
stateDiagram-v2
    [*] --> PREPARING
    PREPARING --> PREFLIGHT_METADATA_READY
    PREFLIGHT_METADATA_READY --> PREFLIGHT_DISCOVERY_READY
    PREFLIGHT_DISCOVERY_READY --> READINESS_PRELIMINARY
    READINESS_PRELIMINARY --> READINESS_FINAL
    READINESS_FINAL --> EDITORIAL_KERNEL_READY
    EDITORIAL_KERNEL_READY --> MEDIA_READY
    MEDIA_READY --> IMAGES_ACCEPTED_LOCKED
    IMAGES_ACCEPTED_LOCKED --> HANDOFF_READY
    HANDOFF_READY --> PUBLICATION_PR_OPEN
    PUBLICATION_PR_OPEN --> CI_VALIDATED
    CI_VALIDATED --> MERGED_TO_MAIN
    MERGED_TO_MAIN --> PAGES_DEPLOYED
    PAGES_DEPLOYED --> LIVE_VALIDATED
    LIVE_VALIDATED --> COMPLETION_RECORDED
    COMPLETION_RECORDED --> CLOSED
    CLOSED --> [*]

    PREPARING --> RECOVERY: missed / failed stage
    READINESS_FINAL --> RECOVERY: novelty / editorial blocker
    EDITORIAL_KERNEL_READY --> RECOVERY: media / image blocker
    HANDOFF_READY --> RECOVERY: transport / PR blocker
    PUBLICATION_PR_OPEN --> RECOVERY: CI blocker
    PAGES_DEPLOYED --> RECOVERY: live validation blocker

    RECOVERY --> PREPARING: resume earliest incomplete
    RECOVERY --> READINESS_FINAL: preserve preflight
    RECOVERY --> EDITORIAL_KERNEL_READY: preserve editorial
    RECOVERY --> HANDOFF_READY: preserve accepted assets
    RECOVERY --> PUBLICATION_PR_OPEN: preserve PR
```

> [!IMPORTANT]
> **Recovery always moves from the last valid checkpoint forward.**  
> It does not automatically jump backward to discovery or regenerate accepted assets.

---

# 3. Complete Normal Production Process — 88 Steps

## Phase Map

| Phase | Steps | Purpose | Primary owner |
|---|---:|---|---|
| 🌙 **A — Night-Before Readiness** | 1–6 | Confirm the system is structurally ready | GitHub Actions |
| ⚙️ **B — Zero-Model Research Prework** | 7–15 | Build bounded metadata shortlist | GitHub Actions |
| ⚙️ **C — Deep Evidence Preflight** | 16–20 | Build nine-candidate evidence packet | GitHub Actions |
| 🔵 **D — Readiness Certification** | 21–25 | Authorize or block publication | Orchestrator + durable receipts |
| 🟣 **E — Editorial Semantic Pass** | 26–34 | Select/write the six-story edition | Semantic editorial layer |
| 🎧 **F — Watchlist, Media & Reader Support** | 35–42 | Freeze Watchlist/media/book support | Editorial + verification |
| 🖼️ **G — Image Production** | 43–50 | Produce and lock six premium images | Image generation + quality gate |
| 🔒 **H — Atomic Handoff** | 51–57 | Freeze all semantic assets atomically | Git Data API |
| 🔵 **I — Publication PR / Expansion** | 58–62 | Create one candidate and expand release | GitHub |
| 🧪 **J — Protected CI / Promotion** | 63–68 | Test exact candidate and merge safely | Protected CI |
| 🚀 **K — Pages Deployment** | 69–71 | Deploy exact production SHA | GitHub Pages |
| 🧪 **L — Independent Live Validation** | 72–82 | Prove reader-facing release works | Validation supervisor |
| 🟢 **M — Completion & Closure** | 83–88 | Persist proof and declare `PUBLIC CLOSED` | Closure audit |

---

<details open>
<summary><strong>🌙 Phase A — Night-Before Readiness · Steps 1–6</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **1** | **Nightly readiness trigger** | GitHub Actions runs the readiness audit during the 21:00 Central hour using the 21:30 trigger. |
| **2** | **Repository health check** | Required workflows, contracts, tools and production files are accessible. |
| **3** | **Schedule readiness check** | Next-day production/recovery chain is enabled and structurally consistent. |
| **4** | **Publication infrastructure check** | Protected branch, required CI, Pages and publication paths are available. |
| **5** | **Readiness report** | A dated Markdown readiness record is persisted. |
| **6** | **Owner notification** | GitHub posts an `@gttome` issue comment so GitHub Mobile/email can surface the result according to owner settings. |

> [!TIP]
> This is the primary **phone-notification-capable** readiness mechanism because the notification is generated inside GitHub.

</details>

---

<details open>
<summary><strong>⚙️ Phase B — Zero-Model Research Prework · Steps 7–15</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **7** | **Establish edition date + cutoff** | Current America/Chicago edition date and research cutoff are recorded. |
| **8** | **Fresh metadata discovery** | Approved primary-source channels are scanned with zero model calls. |
| **9** | **Bound discovery breadth** | Acquisition stops at configured source and character budgets. |
| **10** | **Resolve publication/update dates** | Bounded deterministic date enrichment is performed. |
| **11** | **Deterministic metadata filtering** | Stale, invalid, duplicate, unresolved and low-value items are removed. |
| **12** | **Retain ≤20 metadata candidates** | Bounded shortlist is written to the preflight branch. |
| **13** | **Coverage gate** | ≥3 viable metadata candidates exist in each focus category. |
| **14** | **Agent Skills gate** | ≥1 story-ready Agent Skills signal exists and is prioritized. |
| **15** | **Metadata receipt** | `PREFLIGHT_METADATA_READY` is persisted with zero model calls. |

### Editorial allocation contract

| Position | Reader-facing focus | Count |
|:---:|---|:---:|
| 1–2 | 🧩 Technical AI Engineering | **2** |
| 3–4 | 💼 Applied Generative AI for Knowledge Workers | **2** |
| 5–6 | 🤖 Agents for Everyone | **2** |
| Across all six | 🧠 Qualifying reusable Agent Skills story | **Exactly 1** |

</details>

---

<details open>
<summary><strong>⚙️ Phase C — Deep Evidence Preflight · Steps 16–20</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **16** | **Select nine evidence candidates** | Exactly 9: **3 Technical + 3 Applied + 3 Agents**. |
| **17** | **Retrieve original evidence** | Authoritative source material is retrieved; downstream summaries do not substitute. |
| **18** | **Compact evidence** | Model-visible packet is **≤12,000 characters**. |
| **19** | **Verify Agent Skills candidate first** | Freshness, material change and 30-day novelty are checked. |
| **20** | **Evidence receipt** | `PREFLIGHT_DISCOVERY_READY` is persisted. |

> [!NOTE]
> The editorial model does **not** reopen the raw discovery queue and does **not** redo article network retrieval.

</details>

---

<details open>
<summary><strong>🔵 Phase D — Readiness Certification · Steps 21–25</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **21** | **Preliminary readiness** | Preflight integrity, evidence completeness, contracts and baseline SHA are checked. |
| **22** | **Novelty checks** | 30-day story-memory rule is applied. |
| **23** | **System gate checks** | No unresolved Critical/High blocker remains. |
| **24** | **Final readiness** | Durable state reaches `READINESS_FINAL`. |
| **25** | **Publication authorization** | Receipt records `publication_authorized=true`. |

> [!WARNING]
> `READY_WITH_WARNINGS` is acceptable only when every mandatory publication gate still passes.

</details>

---

<details open>
<summary><strong>🟣 Phase E — Single Editorial Semantic Pass · Steps 26–34</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **26** | **Load bounded evidence only** | Editorial pass uses approved compact evidence + current contracts. |
| **27** | **Select six stories** | Exactly six stories in required 2/2/2 order. |
| **28** | **Select exactly one Agent Skills story** | Fresh, materially distinct and genuinely reusable-skill related. |
| **29** | **Write article content** | Headline, summary, why it matters, action, evidence labels, source and reading support. |
| **30** | **Evaluate Watchlist** | Current Watchlist deltas and teaser implications are determined. |
| **31** | **Evaluate book relevance** | Professional Series mappings are added only when useful and verified. |
| **32** | **Evaluate media** | Video/podcast finalists are chosen. |
| **33** | **Write six image briefs** | One independent story-specific brief per selected story. |
| **34** | **Freeze editorial kernel** | `EDITORIAL_KERNEL_READY` is durable; no second broad semantic pass. |

</details>

---

<details open>
<summary><strong>🎧 Phase F — Watchlist, Media & Reader Support · Steps 35–42</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **35** | **Build same-edition Watchlist** | New / updated / carried-forward topics derive from canonical current-edition state. |
| **36** | **Verify homepage teaser parity** | Homepage counts/details match canonical Watchlist data. |
| **37** | **Verify video #1** | Source, runtime and freshness pass. |
| **38** | **Verify video #2** | Independent second qualifying video passes. |
| **39** | **Verify podcast #1** | Current relevant episode passes. |
| **40** | **Verify podcast #2** | Must be source-diverse; no more than one from *The AI Daily Brief*. |
| **41** | **Freeze media** | Exactly 2 videos + 2 podcasts are durably accepted. |
| **42** | **Verify book mappings** | Reader-facing book/chapter references are genuine and non-forced. |

> [!CAUTION]
> Missing required media is a **targeted recovery condition**, not permission to publish a degraded edition.

</details>

---

<details open>
<summary><strong>🖼️ Phase G — Image Production & Quality Gate · Steps 43–50</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **43** | **Generate images 1–6 independently** | One generation request per selected story. |
| **44** | **Use premium textbook baseline** | White/near-white, detailed, instructional, story-specific, ~1200×630. |
| **45** | **Visually inspect each image** | Human/editorial quality judgment is required. |
| **46** | **Reject low-quality output** | No collage, generic concept art, sparse fallback, placeholder or deterministic low-quality replacement. |
| **47** | **Targeted regeneration only** | Regenerate only the individual failed image. |
| **48** | **Cross-image differentiation gate** | Six images must be materially distinct in layout/composition. |
| **49** | **ACCEPT + LOCK** | Approved image receives durable identity and exact immutable bytes. |
| **50** | **Persist image manifest** | Review evidence + hash/blob identity recorded for all six. |

### Image gate

```mermaid
flowchart LR
    A["Image generated"] --> B{"Structural gate"}
    B -- fail --> R["Regenerate only this image"]
    B -- pass --> C{"Editorial quality gate"}
    C -- fail --> R
    C -- pass --> D{"Distinct from other 5?"}
    D -- no --> R
    D -- yes --> E["🔒 ACCEPT + LOCK exact bytes"]
    E --> F["♻️ Reuse on all downstream retries"]

    classDef fail fill:#ffebe9,color:#cf222e,stroke:#ff8182,stroke-width:2px;
    classDef pass fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;
    classDef gate fill:#fff8c5,color:#633c01,stroke:#d4a72c,stroke-width:2px;

    class R fail;
    class E,F pass;
    class B,C,D gate;
```

</details>

---

<details open>
<summary><strong>🔒 Phase H — Atomic Editorial Handoff · Steps 51–57</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **51** | **Reconfirm trusted main SHA** | Handoff binds to exact production baseline. |
| **52** | **Create/reuse isolated handoff branch** | One current-edition production handoff branch. |
| **53** | **Create text/JSON blobs** | Kernel, facts, media, image and publication manifests materialized. |
| **54** | **Create image blobs via Git Data API** | Binary images use base64 Git Data API; Contents API binary writes prohibited. |
| **55** | **Create one atomic tree + commit** | All frozen assets advance together. |
| **56** | **Validate remote handoff integrity** | Bytes, digests, staging ref and baseline agree. |
| **57** | **Declare handoff ready** | Semantic/editorial assets are durable and immutable downstream. |

</details>

---

<details open>
<summary><strong>🔵 Phase I — Publication PR & Deterministic Expansion · Steps 58–62</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **58** | **Create/reuse exactly one publication PR** | Open, non-draft, initially unlabelled, handoff branch → `main`. |
| **59** | **Validate handoff deterministically** | Publication manifest and frozen assets pass. |
| **60** | **Expand canonical edition** | Dated edition, homepage/latest, archive, permanent pages and feeds generated. |
| **61** | **Run candidate lint/contracts** | Story/media/Watchlist/image/link/release contracts pass. |
| **62** | **Apply publication-candidate state** | Only after deterministic validation succeeds. |

</details>

---

<details open>
<summary><strong>🧪 Phase J — Protected CI & Promotion · Steps 63–68</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **63** | **Run targeted affected tests first** | Relevant failures surface quickly. |
| **64** | **Run required full deterministic CI** | Repository, integration, contract and build tests pass. |
| **65** | **Validate exact PR head** | Promotion is bound to tested head SHA. |
| **66** | **Check baseline movement** | Stale/conflicting production baseline is resolved. |
| **67** | **Protected merge/promotion** | Publication enters `main` only through branch protection. |
| **68** | **Record final production SHA** | Final production identity is durable. |

</details>

---

<details open>
<summary><strong>🚀 Phase K — Pages Deployment · Steps 69–71</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **69** | **GitHub Pages build** | Pages builds the final production state. |
| **70** | **Exact-SHA deployment proof** | Deployment evidence identifies the final production SHA. |
| **71** | **Prevent premature success** | Merge/deployment alone is never treated as completion. |

</details>

---

<details open>
<summary><strong>🧪 Phase L — Independent Live Validation · Steps 72–82</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **72** | **Verify edition date** | Public site displays current intended date. |
| **73** | **Verify six stories + order** | Exact 2/2/2 order + exactly one Agent Skills story. |
| **74** | **Verify all six images render** | Correct premium image bytes, no fallback/placeholders. |
| **75** | **Verify 2 videos + 2 podcasts** | Correct count, valid links, podcast source diversity. |
| **76** | **Verify Watchlist parity** | Homepage teaser and Watchlist derive from same state. |
| **77** | **Verify homepage/latest/dated/archive parity** | All reader surfaces agree. |
| **78** | **Verify permanent story/media pages** | Stable routes work. |
| **79** | **Verify feeds + navigation** | RSS/archive/navigation current. |
| **80** | **Verify ratings/sharing/privacy** | Reader interactions work without private-data leakage. |
| **81** | **Verify Professional Series links** | Relevant mappings are valid and accurate. |
| **82** | **Run deterministic delta validation** | Final zero-model release-state validation passes. |

</details>

---

<details open>
<summary><strong>🟢 Phase M — Completion & Closure · Steps 83–88</strong></summary>

| # | Process | Required result |
|---:|---|---|
| **83** | **Write completion evidence** | Edition, final production SHA, deployed SHA and validation state recorded. |
| **84** | **Reconcile lifecycle state** | Durable run-state advances to `CLOSED`. |
| **85** | **Confirm no open Critical/High defects** | Mandatory blockers are resolved. |
| **86** | **Declare `PUBLIC CLOSED`** | Edition is officially complete. |
| **87** | **Synchronize Daily AI Brief Command Center** | Sync final production SHA; sync failure does not reopen public edition. |
| **88** | **Run after-action / closure summary** | Problems, fixes, retries, reused checkpoints and prevention controls recorded. |

### True completion equation

> [!IMPORTANT]
> **Protected `main` SHA**  
> = **deployed Pages SHA**  
> = **current canonical edition**  
> = **validated live reader state**  
> = **completion evidence**  
> = **lifecycle `CLOSED`**

</details>

---

# 4. Recovery and Self-Healing Model

## Universal recovery rule

> [!IMPORTANT]
> **Inspect durable state → find the first incomplete/invalid stage → preserve everything valid before it → repair only the smallest failed stage → continue forward until `PUBLIC CLOSED`.**

## Recovery decision tree

```mermaid
flowchart TD
    A["Current-day edition not PUBLIC CLOSED"] --> B{"Recent durable progress?"}
    B -- Yes --> C["Continue from first incomplete stage"]
    B -- No --> D{"Expected task was due?"}
    D -- Yes --> E["Record scheduled_start_missed or recovery_stalled"]
    D -- No --> C
    E --> F["Watchdog becomes active executor"]
    F --> C
    C --> G{"Failure encountered?"}
    G -- No --> H["Advance next stage"]
    G -- Yes --> I{"Can repair safely<br/>without weakening gates?"}
    I -- Yes --> J["Repair only failed stage"]
    J --> K["Reuse all valid checkpoints/assets"]
    K --> H
    I -- No --> L["Fail closed<br/>preserve last valid live edition"]
    H --> M{"PUBLIC CLOSED?"}
    M -- No --> C
    M -- Yes --> N["🟢 Stop production changes"]

    classDef good fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;
    classDef warn fill:#fff8c5,color:#633c01,stroke:#d4a72c,stroke-width:2px;
    classDef bad fill:#ffebe9,color:#cf222e,stroke:#ff8182,stroke-width:2px;
    classDef action fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;

    class N good;
    class E,F,J,K warn;
    class L bad;
    class C,H action;
```

## No-rework matrix

| Failed stage | Preserve | Re-run / repair |
|---|---|---|
| Metadata preflight | Nothing downstream assumed valid | Metadata stage only |
| Evidence preflight | Valid metadata shortlist | Evidence stage only |
| Agent Skills novelty slot | All other candidates, evidence, readiness | Agent Skills slot only |
| Editorial story issue | Valid preflight + readiness | Editorial kernel if no valid kernel exists |
| One media slot | Editorial kernel + other valid media | Failed media slot only |
| One image | Editorial + media + other 5 accepted images | Failed image only |
| Handoff transport | Editorial + media + all accepted images | Git Data handoff transition only |
| Candidate lint / CI | Frozen handoff assets | Deterministic defect + failed jobs |
| Pages deployment | Main SHA + CI success | Deployment stage |
| Live route defect | Production content unless proven wrong | Affected deterministic reader surface |
| Command Center sync | Entire public edition | Command Center sync only |

---

# 5. Troubleshooting & Hardening Ledger

## Hardening status dashboard

<p>
  <img alt="Hardening policy" src="https://img.shields.io/badge/HARDENING-Fix%20%2B%20Prevent-8250DF?style=flat-square">
  <img alt="No rework" src="https://img.shields.io/badge/NO--REWORK-ENFORCED-2DA44E?style=flat-square">
  <img alt="Fail closed" src="https://img.shields.io/badge/FAIL--CLOSED-ENFORCED-CF222E?style=flat-square">
  <img alt="Docs sync" src="https://img.shields.io/badge/LIVING%20DOC-SAME%20CHANGE%20SET-1F6FEB?style=flat-square">
</p>

| ID | Failure / symptom | Root cause | Immediate correction | Permanent hardening |
|---|---|---|---|---|
| **T01** | Run stops before full closure | Production wording allowed handoff/PR as an endpoint | Orchestrator changed to own full lifecycle | **Only `PUBLIC CLOSED` is success** |
| **T02** | Recovery fixes one issue then stops | Recovery treated invocation as one-stage repair | Continue through newly incomplete stages | Cannot stop at readiness/editorial/PR/CI/merge/deploy/live |
| **T03** | Scheduled resume due but never starts | Scheduler delay/miss had no takeover rule | Record `scheduled_start_missed` | Hourly watchdog becomes executor |
| **T04** | 04:00 task creates no checkpoint | Primary schedule can delay/fail | Begin independently from durable state | 04:30 + hourly watchdog assumes nothing |
| **T05** | Multiple recovery tasks can race | Redundant schedules lacked coordination | Check recent durable progress first | Secondary supervisor takes over only when stalled |
| **T06** | Agent Skills repeats previous story | Metadata signal passed but novelty failed | Replace only Skills evidence slot | Slot-level repair; no full rediscovery |
| **T07** | Structurally valid but poor image | Structural checks cannot judge editorial quality | Separate structural/editorial visual gates | Both gates required from Sep 26 forward |
| **T08** | Binary image corruption/truncation | Unsuitable write path | Use Git Data API base64 blobs | Contents API prohibited for production images |
| **T09** | Accepted images regenerated after later failures | Assets were not immutable checkpoints | ACCEPT + LOCK exact bytes | Regenerate only missing/corrupt/materially changed story |
| **T10** | Qualification uses wrong time context | Replay compared old evidence to current clock | Reuse original publication timestamp | Production and replay clocks separated |
| **T11** | Candidate lint rejects accepted image evidence | Validators disagreed on format/identity rules | Reuse authoritative image inspector | One shared image acceptance contract |
| **T12** | Downstream image-review variable failure | Stale variable name | Correct wiring + regression test | Targeted sentinel test before full CI |
| **T13** | Qualification branch rejected by test | Test hard-coded production staging ref | Validate actual handoff ref by mode | Contract-aware production/qualification rules |
| **T14** | Nightly readiness silently skipped | Gate expected exact cron minute | Accept correct local hour | DST-safe delayed-start tolerance |
| **T15** | Publication appears complete too early | PR/merge/Pages used as completion proxy | Require completion record + lifecycle state | Success tied to durable `CLOSED` |
| **T16** | Recovery redoes expensive work | Recovery did not always use first-incomplete stage | Mandatory checkpoint reuse | Explicit no-rework rule across all stages |
| **T17** | One slot failure triggers broad rerun | Failure scope too broad | Invalidate only failed slot/dependents | Stage-local invalidation default |
| **T18** | Old runbook conflicts with new architecture | Historical prose accumulated stale instructions | Machine-readable contract has precedence | This living document must stay synchronized |
| **T19** | Image request returns edition/status artwork | Broad conversational context was not isolated to one story | Use self-contained one-story requests; reject unrelated output | Digest-bound single-story request receipts plus rendered subject-match gate; only same-story references for edits |
| **T20** | Accepted image cannot be recovered | Accepted count recorded without persisted bytes or asset identity | Search checkpoints and saved assets; replace only the missing file under existing exception | ACCEPT + LOCK requires bytes, SHA-256 and Git blob identity in the same durable handoff |
| **T21** | First frozen-contract edition throws before validation | Future image-quality artifact constant was referenced but undefined | Define the versioned v2 artifact contract | Current-edition manifest regression reaches frozen-date code; reject unsupported evidence schema without throwing |
| **T23** | Token-created publication PR has no required CI run and token merge has no Pages build | Token event suppression was assumed to trigger the next workflow | Explicitly dispatch required CI once, merge only its exact passing head through protection, request Pages and dispatch SHA-bound delta validation | Bounded waits belong to Actions; refreshed main policy and baseline, PR identity and deployed SHA must match; no Work polling |
| **T22** | New edition fails tests against the preceding date | Manifest tests read the current bundle but expected September 25 literals | Bind assertions to actual edition and branch mode | Keep current-bundle integrity, wrong-date and digest-drift negative tests; do not weaken publication gates |
| **T24** | Canonical shadow or derived-parity comparison omits same-edition Watchlist counts/topics | Atomic generation received the manifest-bound Watchlist, but the shadow and integrated-parity validators re-rendered without Watchlist options; their default rendering omitted the generated current projection in `data/watchlist.json` | Resolve only a Watchlist snapshot whose `edition_date` matches the edition from canonical `_data` or generated `data`, then pass that exact snapshot into every dated/latest/homepage comparison | One regression fixture requires 0 new / 4 updated / 12 carried plus changed-topic names to pass both shadow and derived-parity validation, and proves a real reader-byte discrepancy still fails both gates |
| **T25** | Pre-PR candidate lint requires a post-live current-edition pointer and rejects multi-commit recovery history | Candidate lint conflated a post-deployment projection with pre-merge evidence, while the atomic handoff contract requires one branch commit directly on the trusted main baseline | During candidate lint, require the existing pointer to be present and no newer than the candidate; advance it only during exact-SHA live closure. Consolidate a bounded recovery tree into one audited commit whose parent is trusted main before promotion | Tests accept the prior completed pointer for a fresh candidate, reject a pointer newer than the candidate, and the protected handoff gate proves the candidate parent equals the frozen baseline |
| **T26** | Candidate CI fixtures bind to the prior Watchlist snapshot or create derived files before their directory exists | Tests read the baseline `_data/watchlist.json` even when a manifest-bound current projection was generated, and one temporary fixture called archive rendering before creating `briefs/` | Resolve current Watchlist evidence from the public projection plus the manifest-bound canonical artifact; create fixture directories before rendering | Full contract/generator suite proves current projection parity, canonical-to-public equality and both Watchlist parity validators on the candidate head |
| **T27** | Workflow-run promotion merges the candidate but does not start deterministic closure | Token-created merges suppress the expected main push workflow; the secondary promotion path announced Pages/delta ownership without explicitly requesting either operation | After the exact protected merge, verify main equals the merge SHA, request Pages, read the merged publication manifest, and dispatch delta validation with the exact edition date and merge SHA | Regression test requires both promotion paths to contain one Pages request and one exact-SHA delta-validation dispatch |
| **T28** | Delta validation passes but protected closure persistence fails with `checkpoint_output_missing_or_not_file` | The finalizer received `/tmp/daily-validation.json`; checkpoint proofs resolve artifacts inside the repository, so the temporary receipt could not become durable closure evidence | Copy the exact successful receipt to `_records/publication/YYYY-MM-DD/delta-validation.json` before finalization and use that repository path for Command Center projection, run-state proof and protected commit | Finalization regression requires the durable validation path, rejects `/tmp` as a checkpoint argument and includes the receipt in the protected finalization commit |

---

## Risk-to-control map

| Failure class | Detection | Automatic response | Owner action required? |
|---|---|---|:---:|
| 🟡 **Missed schedule start** | No durable current-day progress after due time | Watchdog takeover | No |
| 🟡 **Recovery stall** | State stops advancing | Secondary supervisor takeover | No |
| 🟡 **Candidate novelty failure** | 30-day memory mismatch | Replace only invalid slot | No |
| 🟡 **Single media failure** | One slot invalid | Repair slot only | No |
| 🟡 **Single image failure** | Visual/structural gate fail | Regenerate image only | No |
| 🟡 **CI deterministic failure** | Required check fails | Smallest mechanical repair + failed-job rerun | No, when safe |
| 🔴 **Quality would need weakening** | Mandatory gate cannot be met | Fail closed | Yes |
| 🔴 **New credentials/service required** | Missing capability | Fail closed | Yes |
| 🔴 **Security/privacy/access change required** | Hard boundary reached | Fail closed | Yes |
| 🔴 **Protected CI bypass required** | Promotion blocked | Fail closed | Yes |
| 🔴 **Irreversible/destructive action required** | Recovery exceeds authority | Fail closed | Yes |

---

# 6. Failure Classification Playbook

<details>
<summary><strong>🟠 A — Scheduled start missed</strong></summary>

**Detection:** expected task time passed and no current-day durable progress exists.

**Required action**
- record `scheduled_start_missed`;
- do **not** wait for the next nominal schedule;
- watchdog immediately becomes executor;
- resume from last valid checkpoint.

</details>

<details>
<summary><strong>🟠 B — Recovery stalled</strong></summary>

**Detection:** recovery was expected to advance, but durable state has not changed.

**Required action**
- classify `recovery_stalled`;
- secondary supervisor takes over;
- preserve all valid checkpoints;
- resume first incomplete stage.

</details>

<details>
<summary><strong>⚙️ C — Preflight failure</strong></summary>

Repair metadata discovery, date resolution or evidence prework only. Do not generate editorial content from incomplete preflight state.

</details>

<details>
<summary><strong>🧠 D — Novelty / source failure</strong></summary>

Replace only the invalid candidate or story slot when bounded evidence supports a safe substitute. Do not rerun all discovery.

</details>

<details>
<summary><strong>🟣 E — Editorial kernel failure</strong></summary>

If no valid kernel exists, perform the one permitted bounded semantic pass. If a valid kernel exists, reuse it.

</details>

<details>
<summary><strong>🎧 F — Media failure</strong></summary>

Repair only the failed video/podcast slot. Never publish with missing required media.

</details>

<details>
<summary><strong>🖼️ G — Image failure</strong></summary>

Regenerate only the failed individual image. No low-quality fallback publication.

</details>

<details>
<summary><strong>🔒 H — Handoff failure</strong></summary>

Preserve editorial/media/image assets. Repair only branch/blob/tree/commit/ref transition.

</details>

<details>
<summary><strong>🧪 I — PR / CI failure</strong></summary>

Fix the smallest deterministic defect. Rerun only affected/failed jobs where supported.

</details>

<details>
<summary><strong>🌐 J — Pages / live validation failure</strong></summary>

Keep the previous valid public state or repair the affected deterministic reader surface. Do not redo editorial work unless the editorial source itself is proven invalid.

</details>

<details>
<summary><strong>🔵 K — Command Center synchronization failure</strong></summary>

Report synchronization degradation independently. A valid `PUBLIC CLOSED` edition remains closed.

</details>

---

# 7. Owner Notifications & Alerts

## Active notification channels

| Notification | Trigger | Delivery path | What the owner receives | Active? |
|---|---|---|---|:---:|
| 📣 **Nightly readiness** | Nightly readiness audit | GitHub issue `@gttome` mention → GitHub Mobile/email per owner settings | Status + link to dated readiness report | 🟢 |
| 🔔 **GitHub issue / PR / Actions notifications** | Watched repository activity | GitHub Mobile/email per owner settings | Standard GitHub event notification | 🟢 |
| 💬 **ChatGPT scheduled-task notifications** | Only tasks with notifications explicitly enabled | ChatGPT notification surface | Task result/alert | 🟡 Not relied upon for production chain |
| 📱 **SMS / WhatsApp** | None | None | None | 🔴 Not implemented |
| ✉️ **Separate Brief email alerts** | None | None | None | 🔴 Disabled / not part of operations |

> [!NOTE]
> A durable operational event is **not automatically a phone notification**. The document distinguishes between **recorded state** and **actively delivered alerts**.

---

## Notification architecture

```mermaid
flowchart LR
    A["Nightly readiness audit"] --> B["GitHub issue comment<br/>@gttome"]
    B --> C["GitHub Mobile"]
    B --> D["GitHub email"]

    E["PR / issue / Actions activity"] --> F["GitHub notification system"]
    F --> C
    F --> D

    G["Durable lifecycle event"] --> H["Repository evidence"]
    H -. not automatically pushed .-> C

    classDef active fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;
    classDef evidence fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;
    class A,B,C,D,E,F active;
    class G,H evidence;
```

---

# 8. Notification Event Catalog

## Durable operational events

| # | Event | Meaning | Severity | Typical owner relevance |
|---:|---|---|:---:|---|
| 1 | **NIGHTLY_READY** | System ready for next run | ℹ️ | Awareness |
| 2 | **NIGHTLY_ATTENTION** | Material readiness blocker detected | ⚠️ | High |
| 3 | **PREFLIGHT_METADATA_READY** | Metadata shortlist accepted | ℹ️ | Low |
| 4 | **PREFLIGHT_DISCOVERY_READY** | Nine-item evidence package accepted | ℹ️ | Low |
| 5 | **READINESS_PRELIMINARY** | Preliminary gate passed | ℹ️ | Low |
| 6 | **READINESS_FINAL** | Publication authorized | ℹ️ | Medium |
| 7 | **SCHEDULED_START_MISSED** | Expected task did not begin | ⚠️ | High |
| 8 | **RECOVERY_TAKEOVER** | Watchdog became executor | ⚠️ | Medium |
| 9 | **EDITORIAL_KERNEL_READY** | Six-story decision frozen | ℹ️ | Medium |
| 10 | **MEDIA_READY** | 2 videos + 2 podcasts verified | ℹ️ | Low |
| 11 | **IMAGES_ACCEPTED_LOCKED** | All six images approved + immutable | ℹ️ | Medium |
| 12 | **HANDOFF_READY** | Atomic handoff persisted | ℹ️ | Medium |
| 13 | **PUBLICATION_PR_OPEN** | Current-edition PR exists | ℹ️ | Medium |
| 14 | **CI_FAILED** | Protected candidate checks failed | ❌ | High |
| 15 | **CI_RECOVERED** | Smallest deterministic repair passed | ✅ | Medium |
| 16 | **MERGED_TO_MAIN** | Tested candidate promoted | ✅ | Medium |
| 17 | **PAGES_DEPLOYED** | Exact production SHA deployed | ✅ | Medium |
| 18 | **LIVE_VALIDATION_FAILED** | Reader-facing defect found | ❌ | High |
| 19 | **LIVE_VALIDATION_PASSED** | Live reader validation passed | ✅ | High |
| 20 | **PUBLIC_CLOSED** | Full completion evidence + lifecycle closure | ✅ | **Highest** |
| 21 | **COMMAND_CENTER_SYNC_DEGRADED** | Public edition closed; CC sync failed | ⚠️ | Medium |
| 22 | **NEXT_RUN_READINESS_ATTENTION** | Hardening item threatens next run | ⚠️ | High |

---

## Severity ladder

| Level | Color | Meaning | Default behavior |
|---|---|---|---|
| **Informational** | 🔵 Blue | Healthy checkpoint | Record durably |
| **Attention** | 🟡 Yellow | Recoverable issue | Auto-repair; owner usually does not need to act |
| **High** | 🟠 Orange | Material problem threatening publication | Auto-repair if safe; surface clearly |
| **Critical** | 🔴 Red | Cannot continue without crossing a hard boundary | Fail closed; owner action required |
| **Resolved** | 🟢 Green | Repair/closure verified | Persist proof |

---

# 9. Continuous Hardening Rules

## The hardening loop

```mermaid
flowchart LR
    A["Problem discovered"] --> B["Diagnose root cause"]
    B --> C["Smallest safe correction"]
    C --> D["Revalidate affected stage"]
    D --> E["Add recurrence-prevention control"]
    E --> F["Add/adjust deterministic test or watchdog"]
    F --> G["Update living operations document"]
    G --> H["Verify through protected CI"]
    H --> I["Close issue"]

    classDef detect fill:#ffebe9,color:#cf222e,stroke:#ff8182,stroke-width:2px;
    classDef fix fill:#fff8c5,color:#633c01,stroke:#d4a72c,stroke-width:2px;
    classDef harden fill:#fbefff,color:#8250df,stroke:#a475f9,stroke-width:2px;
    classDef done fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;

    class A,B detect;
    class C,D fix;
    class E,F,G harden;
    class H,I done;
```

> [!IMPORTANT]
> **A repair is not complete merely because today's edition works.**  
> A recurring/systemic defect is considered permanently closed only when a prevention control is implemented and documented.

### Every production problem must produce two outcomes

1. **Immediate edition correction**
2. **Future recurrence prevention**

### Prevention control can live in one or more of

- machine-readable runtime contract;
- deterministic tests;
- workflow logic;
- recovery/watchdog scheduling;
- validation rules;
- protected CI;
- this living document.

---

# 10. Living-Document Maintenance Contract

## Must-update triggers

This file must be updated whenever production behavior materially changes in any of these areas:

| Area | Must update this document? |
|---|:---:|
| Schedule times | ✅ |
| Schedule responsibilities | ✅ |
| Stage ownership | ✅ |
| Publication gates | ✅ |
| Research limits | ✅ |
| Story allocation | ✅ |
| Agent Skills rules | ✅ |
| Media rules | ✅ |
| Image quality rules | ✅ |
| Image transport rules | ✅ |
| Handoff / PR behavior | ✅ |
| CI / promotion behavior | ✅ |
| Pages / live validation | ✅ |
| Recovery logic | ✅ |
| Notification behavior | ✅ |
| Failure classification | ✅ |
| Completion definition | ✅ |
| Recurrence-prevention controls | ✅ |

> [!TIP]
> **Preferred rule:** code/config + test + living documentation move together in the same PR.

### Emergency exception

If an emergency publication repair cannot safely include documentation:

1. record the documentation debt;
2. keep the public repair focused;
3. require the first subsequent hardening/closure change to reconcile this file;
4. do not consider the systemic issue permanently closed until that reconciliation occurs.

---

# 11. Daily Completion Checklist

## Executive release gate

- [ ] **Metadata preflight passed**
- [ ] **9-item evidence package passed**
- [ ] **Final readiness authorized publication**
- [ ] **Six stories frozen in 2/2/2 order**
- [ ] **Exactly one Agent Skills story**
- [ ] **30-day novelty checks passed**
- [ ] **Watchlist + homepage teaser match**
- [ ] **Exactly 2 videos verified**
- [ ] **Exactly 2 source-diverse podcasts verified**
- [ ] **Six premium images accepted + locked**
- [ ] **Atomic handoff complete**
- [ ] **Exactly one publication PR**
- [ ] **Deterministic candidate validation passed**
- [ ] **Protected CI passed**
- [ ] **Exact tested head promoted to `main`**
- [ ] **Pages deployed exact final production SHA**
- [ ] **Homepage / latest / dated / archive agree**
- [ ] **Permanent story/media routes pass**
- [ ] **Feeds + navigation pass**
- [ ] **Ratings / sharing / privacy checks pass**
- [ ] **Completion record exists**
- [ ] **No unresolved Critical/High defects**
- [ ] **Lifecycle = `CLOSED`**
- [ ] **Status = `PUBLIC CLOSED`**

### Release gate visualization

```mermaid
flowchart LR
    A["Editorial complete"] --> B["Assets frozen"]
    B --> C["PR + CI pass"]
    C --> D["Merged to main"]
    D --> E["Pages exact SHA"]
    E --> F["Live validation"]
    F --> G["Completion evidence"]
    G --> H["🟢 PUBLIC CLOSED"]

    classDef gate fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;
    classDef closed fill:#2da44e,color:#fff,stroke:#1a7f37,stroke-width:3px;
    class A,B,C,D,E,F,G gate;
    class H closed;
```

---

# 12. Related Production References

| Reference | Role |
|---|---|
| `docs/operations/under80-runtime-contract.json` | Primary machine-readable execution contract |
| `docs/operations/efficiency-operating-policy.json` | Efficiency + operational policy |
| `docs/operations/editorial-handoff-template.json` | Atomic handoff structure |
| `docs/operations/readiness-certification.md` | Readiness criteria |
| `docs/operations/watchlist-runbook.md` | Watchlist operating procedure |
| `docs/images/publisher-policy.md` | Image quality + production policy |
| `docs/podcasts/publisher-policy.md` | Podcast selection policy |
| `.github/workflows/nightly-readiness.yml` | GitHub-native readiness notification workflow |

---

## Final operating principle

> [!IMPORTANT]
> ### **Do not stop because a stage failed.**
> If the problem is recoverable, repair the smallest failed stage, preserve all valid work, and continue.  
> If an expected task never starts, treat that absence as a failure condition and take over.  
> If the problem is not safely recoverable, fail closed and preserve the last valid live edition.  
> **The system is finished only at `PUBLIC CLOSED`.**

---

<p align="center">
  <img alt="Publication invariant" src="https://img.shields.io/badge/INVARIANT-NO%20REWORK%20%7C%20NO%20QUALITY%20DOWNGRADE%20%7C%20NO%20PREMATURE%20SUCCESS-24292F?style=for-the-badge">
</p>

<p align="center"><strong>Living document — update whenever the implemented system changes.</strong></p>


## September 26 bounded recovery control receipt

Image execution-context documentation debt from checkpoint `44f9801f749ab2531e9fffa873a7eb8e4351ee7d` is reconciled by T19/T20, the image policy, runtime contract, request receipts and shared image gate in this change. The observable failure was unrelated status artwork; the precise internal image-routing mechanism remains unverified. One-story input and output checks prevent acceptance regardless of that internal cause. Eight image calls produced six accepted final files after two targeted factual-precision corrections. Earlier attempts are not estimated.

No completed discovery or story prose was redone. The newer `editorial-recovery/2026-09-26` media and Watchlist snapshots are preserved; metadata field names and code-owned IDs are reconciled for the frozen manifest. GitHub Actions owns expansion, required CI, protected promotion, Pages, live checks and closure. This receipt is not publication evidence. Usage balances are tracked separately and are not published in this repository.

The production handoff workflow explicitly starts `ci.yml` for its exact candidate and observes it for at most eight minutes inside Actions. Dispatched CI compares the full branch against its merge base with current main, so both the atomic handoff and generated commit receive the same required gates. Protected promotion refreshes main policy, baseline and PR identity. The existing workflow token receives only the Actions-dispatch and Pages-build scopes required for this continuation; repository protection, sharing, Pages configuration and user credentials are unchanged. A successful protected merge requests a Pages build and dispatches delta validation pinned to that merge SHA. Completion evidence accepts successful PR-triggered or explicitly dispatched runs of the same CI workflow on the exact candidate. Failures retain the branch and accepted bytes for narrow deterministic recovery. No Work retry or monitoring is created.


## September 26 Watchlist shadow-parity repair

The September 26 publication stage correctly rendered the manifest-bound Watchlist preview, including daily counts and the changed-topic list. Repository validation then failed because the shadow comparator reconstructed the same canonical edition without passing Watchlist state. After that repair, integrated derived-output parity exposed the identical omission in its independent rendering path. The atomic publication stage writes the current public Watchlist projection to `data/watchlist.json`; both validators must therefore resolve only a Watchlist whose `edition_date` matches the edition, preferring canonical `_data` and then the generated public projection, and pass that snapshot explicitly to dated, latest and homepage renderers. One regression fixture now exercises both validators. Both comparisons remain byte-sensitive and fail-closed; no Watchlist content, publication gate, or accepted editorial/image artifact is weakened or removed.


## September 26 candidate-lint and handoff-parent recovery

After Watchlist parity passed, pre-PR candidate lint still blocked the unchanged frozen stage for two independent reasons. First, it required `data/operations/current-edition.json` to name the unpublished candidate even though that file is explicitly a post-live-verification projection. The corrected rule preserves the latest completed pointer during pre-merge validation, accepts a pointer no newer than the candidate, and leaves advancement to exact-SHA Pages closure. Second, the protected handoff contract requires the production candidate branch to be represented by one audited commit whose parent is the trusted main baseline. Narrow repair commits are therefore consolidated into a single commit that preserves the exact staging tree and frozen editorial, media and image inputs before the workflow is retriggered. No public gate, access rule or asset-quality control is bypassed.


## September 26 current-Watchlist test-fixture recovery

Protected CI correctly rejected three stale fixtures after the production candidate advanced to September 26. The fixtures had bound current-reader assertions to the prior `_data/watchlist.json` baseline rather than the manifest-bound Watchlist and generated `data/watchlist.json` projection. A separate parity fixture attempted archive rendering before its temporary `briefs/` directory existed. The repaired tests resolve the current canonical Watchlist through the publication manifest, validate its public projection, derive reader-surface assertions from the current projection, and create required temporary directories before rendering. Product output and frozen editorial assets are unchanged.


## September 26 promotion-to-closure dispatch repair

PR #240 passed protected CI and was promoted through the workflow-run path. GitHub Actions then merged the candidate and Pages deployed it, but the token-created merge did not emit the main push event that delta validation expected. The workflow-run promotion path had also omitted the explicit Pages request and exact-SHA delta-validation dispatch present in the primary path. The permanent repair makes both paths verify the protected merge SHA against current main, request Pages, load the merged publication manifest, and dispatch deterministic delta validation with the manifest edition date and exact merge SHA. A regression test counts both dispatch paths. Public closure still requires successful Pages, delta validation, protected completion persistence and durable `CLOSED` run-state; the merge alone is not completion.


## September 26 durable delta-validation persistence repair

The exact-SHA delta-validation run for final production SHA `631ff1016b35288ab782ba95d3381565be5cbd9d` passed its reader, Pages and completion checks, then failed while preparing protected closure persistence. The finalizer had been passed `/tmp/daily-validation.json`; run-state checkpoints intentionally accept repository artifacts so their evidence remains durable and digest-verifiable. The workflow now copies the unchanged successful receipt to `_records/publication/YYYY-MM-DD/delta-validation.json`, uses that file for Command Center projection and `DELTA_VALIDATED` / `CLOSED` checkpoint proofs, verifies it when reusing a finalization branch, and includes it in the protected completion commit. This repair resumes at completion persistence only. It does not rerun research, editorial selection, media verification, image generation, publication expansion or the already successful exact-SHA live validation.


## Continuous qualification stabilization — September 26

A production-only once-per-day validation cadence is too slow for active reliability remediation. Continuous qualification is now a separate nonproduction lane governed by `docs/operations/continuous-qualification-contract.json` and `docs/operations/CONTINUOUS-QUALIFICATION-PLAN.md`. Up to four fresh full semantic qualification runs may be performed per America/Chicago day during stabilization. Each uses `qualification_nonproduction`, unique Q1–Q4 branches, GitHub Actions for zero-model preflight/deterministic validation, and ordinary ChatGPT only for the single semantic pass plus professional image generation. Work, Codex and paid API usage are prohibited. Qualification cannot mutate production main, create a publication candidate, deploy production Pages, update production novelty/current-edition state, or synchronize production Command Center state. Stabilization graduates after five consecutive full qualification passes spanning at least three fresh evidence cutoffs plus one subsequent unattended real production PUBLIC CLOSED edition.

**BQ-01 — Professional Series reference diversity:** the current reusable book-reference catalog is underpopulated (three references across two books), which causes recent over-concentration on Reliable Generative AI Context Engineering Chapter 3. Qualification tracks this as a graduation blocker: expand the verified catalog to all four books and multiple relevant chapter/section candidates, preserve relevance-first selection, and do not force artificial daily rotation.


### Qualification schedule separation

The active testing schedules are separate from production orchestration. Production remains at 04:00 (Production Orchestrator) and 08:30 (Live Validation & Repair). Continuous qualification runs use separate ChatGPT schedules at 12:00 (Q1), 15:00 (Q2), 18:00 (Q3), and 20:30 (Q4), America/Chicago. Q1-Q4 use only `qualification_nonproduction` branches and evidence; they cannot count as production progress, mutate production state, deploy Pages, or trigger production publication/Command Center actions. Each testing schedule can be paused independently from production.


### Q1 finding — qualification novelty baseline isolation

The first continuous Q1 preflight succeeded with 17 bounded metadata candidates and nine retrieved evidence items, but inspection showed that several strong candidates were already used by the real September 26 production edition. Applying production novelty against the already-published same-day edition would make repeated intraday qualification structurally impossible and would test candidate scarcity rather than automation repeatability. Permanent control: every Q-run is an independent hypothetical production attempt and evaluates novelty against production history strictly before its edition date. Same-day production and all Q-runs are excluded from the qualification novelty baseline. This does not weaken the real production 30-day novelty rule and does not authorize repeated production publication.


## September 27 image-policy risk rebalance

The qualification image policy was reviewed after IH8 showed that a factually safe, correctly labeled image could still fail solely because its clear six-stage linear composition matched a categorical format ban. The active policy now preserves the quality objective while reducing false-negative risk:

- professional, detailed, story-specific textbook/editorial quality remains mandatory;
- low-quality fallback remains prohibited;
- story isolation, subject identity, factual safety, cross-story contamination controls, exact-byte Library/Git persistence, and accepted/locked artifact identity remain strict;
- composition is story-fit rather than universally mechanism-centric: linear flows, layered architectures, comparisons, taxonomies, annotated systems, panel/card structures, and appropriate system-view metaphors may pass when professionally executed and explanatory;
- central mechanisms, nonlinear feedback, multiple layers, and visual density are required only when they truthfully improve the explanation;
- essential story-specific labels remain required, while bounded generic non-factual labels and symbolic glyphs may appear without failing solely for not being in the essential-label list;
- unsupported factual prose, invented technical specifics, fabricated metrics/code/identifiers/vulnerabilities/product UI remain failures;
- qualification permits up to four bounded image attempts per story, with early termination for a deterministic contract defect;
- later non-mutating diagnostic review may continue after the first failed gate, but the first failed gate remains the official terminal cause for that attempt;
- final publication still requires six accepted/locked professional images, while qualification may continue with one isolated remediation lane if five are already locked.

This amendment does not weaken the production success condition, protected CI, no-rework model, zero-cost policy, or publication requirement for six final professional images.


### Seven-day article schema compatibility and transfer recovery — September 28, 2026

The canonical v1 schema now permits the optional article policy identity and story freshness metadata without adding requirements to historical fixtures. Seven focused schema checks cover current primary/extended metadata, explicit legacy identity, absent historical identity, and rejection of unknown policies, invalid bands and undated freshness. Runtime `validateEdition` remains responsible for age boundaries, actual cutoff, fallback reasons and publication checks; schema acceptance alone is not qualification or publication proof.

When a GitHub Actions runner cannot push workflow-file changes, preserve its tested commit and failed execution evidence. An authorized connected GitHub app may fast-forward the existing nonproduction implementation branch to that exact verified commit after confirming its parent and tree. Do not infer a repository-wide access failure, ask for new credentials, rerun completed audits, force-update a ref, or bypass protected PR CI. Run 36459299324 created commit 8e7168c9bbd2317d86eba8e082a2deae6382885c; its failed runner push was recovered through this connected fast-forward path.

## 2026-09-29 — Bounded recovery for invoked image tasks with unobservable outcomes

A native image task that has a positively observed scheduler invocation must not remain an indefinite pipeline blocker after every supported output-recovery path has been exhausted. The recovery planner now recognizes a fail-closed terminal attempt disposition, `unrecoverable`, only when the durable recovery evidence records `TASK_RESULT_UNRECOVERABLE`, positive invocation evidence, exhaustive supported search, an unobservable outcome, and a real check timestamp.

This disposition **does not assert that native generation succeeded or failed**. It consumes one of the existing maximum four attempts and permits the next bounded attempt only after the evidence is durable. Missing or incomplete recovery evidence still fails closed; a merely pending task still cannot be duplicated. Existing raw-byte, Git read-back, factual/professional review, final-byte, differentiation, acceptance and one-writer gates are unchanged.

The live motivating incident is Q24 m03 attempt 1: task `6abb3052c5348191a3e69437b9d95fb0` has an observed scheduler invocation but no recoverable image, native result identifier, response payload or explicit failure after supported recovery checks. The new rule is not applied to that attempt until its implementation passes protected CI and merges to `main`; Q24's completed m04 and all frozen upstream evidence remain untouched.



## 2026-09-29 — Image-task administration failure and result-handoff preflight

Q24 demonstrated a control-plane failure rather than an editorial or image-quality failure. Four correctly bound visual-only image tasks for candidate `m03` were positively observed by the scheduler, but their generated attachment/result was not exposed through any supported recovery surface available to the qualification supervisor. The supervisor could therefore observe task invocation while remaining unable to capture, review, hash, persist or accept the native bytes. Q24 exhausted the bounded four-attempt budget and must remain terminal FAIL; it must never be repaired into PASS or given a fifth attempt.

Permanent operating rule: **do not allocate a native image task until the execution environment has proved its result-handoff capability.** The planner now requires a versioned capability receipt showing that task invocation is observable, a native result is recoverable, exact output bytes are recoverable by the supervising context, a real verification timestamp exists, and durable evidence identifies the verified bridge. Without that proof the planner returns `CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF` before attempt 1, rather than consuming attempts that can never become acceptance evidence. The same preflight is required again before any later attempt allocation.

This is not a quality relaxation and does not make an opaque task result acceptable. Existing raw/final byte equality, Git read-back, subject/factual/professional review, six-image differentiation, attempt limits and accepted-lock gates remain unchanged. A foreground/manual image may be used only in an explicitly manual-assisted publication recovery and must not be represented as unattended qualification proof.

The administration layer also showed a separate liveness defect: the long-running publication supervisor repeatedly became disabled before the mission was complete. The active controller is now scheduled as an exact hourly task and a separate administration-only keeper re-enables that same controller if it is found disabled. The keeper never performs publication work or starts a competing executor.

Operational consequence: future fresh qualification identities must fail fast on an unverified image-result bridge, harden the bridge first, and only then spend image attempts. This prevents another Q from losing hours to invisible worker outputs while preserving all valid upstream checkpoints.

## 2026-09-30 — Remove cross-invocation recovery as a research-admission prerequisite

The production controller may explicitly select `same-invocation-direct-capture-v1` when the native image surface supports generation in the active invocation but exposes no supported same-result recovery callback. This does not certify native recovery or image completion. It moves that proof to the actual image stage: one sealed story → one native generation → immediate exact-byte Git persistence → saved-byte review → accept/retry, with no yield between generation and attempted capture.

Default reliable-edition behavior remains `native-recovery-proof-v2`. Direct-capture admission cannot satisfy an image receipt, image-quality record, bundle, qualification, publication or PUBLIC CLOSED gate. If an invoked native result becomes unobservable before persistence, only complete `TASK_RESULT_UNRECOVERABLE` evidence may consume that bounded attempt and permit the next one. No fifth attempt, manual owner handoff, low-quality renderer fallback or fabricated PASS is allowed.


## 2026-10-01 — Run learning, readiness and terminal cleanup amendment

Every production run now begins with **Task 00 — Production Readiness Validation** and ends with **Task 29 — Run Cleanup + Next-Run Readiness**, regardless of whether the terminal state is independently verified `PUBLIC CLOSED` or `FAILED`.

Task 00 validates successful-run inheritance from the most recent PUBLIC CLOSED run, persistent run-scoped supervision, one-writer enforcement, stale-Active recovery, the proven professional image path, append-only timing/Kanban integrity, protected publication gates and the no-incremental-cost boundary. A one-shot start trigger may not be the sole executor.

An Active task with no durable progress for 15 minutes must be resumed by the same-run keeper or explicitly transitioned to Blocked with a timestamped blocker and recovery action. Task state and executor liveness are separate observables.

The production image path is locked to `production-image-execution-v2: generate → transfer exact file → verify content identity → review saved asset → accept/reject`. Repository-generated SVG/basic-diagram substitution and low-quality fallback are prohibited unless the owner explicitly changes policy and the same quality contract passes.

Task 29 disables run-specific executors, verifies no active writer remains, reconciles transition/Kanban timing, freezes terminal metrics, preserves immutable evidence and public production, and writes a PASS cleanup receipt before the next run may start.

After Task 29, a Run Promotion Review records Keep / Fix / Simplify / Validate-next findings and revises `RUN-LEARNING-READINESS-PLAN.md` and its machine contract when new evidence changes the production baseline. Repeated successful runs may produce an empty Fix section; the goal is convergence to stable operations, not continual process growth.


## October 2 — Restore scheduled execution compatibility

[Daily unattended startup](DAILY-UNATTENDED-STARTUP.md) defines the current owner-authorized daily target, mandatory GitHub bootstrap, preserved cost and quality constraints, persistent recovery and event-derived reporting. Reuse the existing controller and keeper identities. A scheduled ChatGPT task proves its own invocation with a committed scheduler observation; it must not manufacture a GitHub workflow ID. This compatibility correction alone does not qualify a host or establish a completed run. Keep the accepted interactive trial and Run 4 closure unchanged.


## October 2, 2026 — Route-scoped blockers must never stop production liveness

A blocked execution route is not a terminal run state. The October 2 Run 5 startup correctly refused a Work/Codex image surface, but then incorrectly disabled the daily controller, hourly recovery keeper and one-time starts. That converted an image-capability constraint into a system-wide outage.

Permanent rule: **reject the prohibited route, not the run.** Task 00 may authorize `non_image_production` when the unattended image host is the only deferred blocker. In that state, Run allocation, Tasks 01-10, discovery, evidence review, editorial selection, media work, Watchlist work, book mapping, image-spec sealing, event logging, supervision and recovery remain live. Image Tasks 11-16, image-dependent downstream gates and publication remain blocked until a registered READY unattended host passes the existing scheduled qualification.

The daily controller and hourly recovery keeper remain enabled during route-specific `Blocked` states. Recovery re-reads durable state each cycle, performs newly available safe work, and rechecks the blocked route without repeating a known prohibited Work/Codex execution. Only a run-specific writer stops at terminal cleanup. No Work, Codex, paid API, overage, alternate account, quality fallback, image-proof bypass or publication-gate relaxation is introduced by this liveness correction.


## October 2, 2026 — Run 5 recovery evidence, writer handoff and visible-text learning

Run 5 exposed three additional control lessons during Task 11. These are production invariants, not status commentary.

1. **Recoverable means machine-readable.** A human-readable note saying that a blocker is recoverable is insufficient. The durable transition must use the canonical task event shape, including `to: "Blocked"`, `recoverable: true`, `external_blocker: false`, an exact timestamp and an executable recovery action. Image receipts must expose the canonical recovery action consumed by the Supervisor. Semantically similar fields such as `state` or `targeted_next_action` may be retained as descriptive metadata but cannot be the only recovery signal.

2. **External scheduled workers acquire authority at execution time.** Never freeze a mutable writer generation into a future task prompt. A native-image worker refreshes current durable state, acquires the next/current fenced authority for the same execution immediately before mutation, verifies that fence for each write, and expires/releases the task-specific lease at a durable Done or Blocked boundary. A stale generation must fail closed. Supervisor bookkeeping alone does not count as substantive task progress that should prevent a deliberate handoff.

3. **Exact visible-text gates treat pseudo-text as text.** Run 5 m01 attempt 1 was rejected for multilingual example words. Attempt 2 was otherwise professionally valid but was rejected because document/ribbon primitives contained tiny text-like interface copy outside the allowlist. Therefore exact-text stories require a pretransport pixel review that rejects not only readable extra words but also faux document lines, microcopy, pseudo-letters, code-like marks and other glyph clusters that appear linguistic. Document/card/ribbon/interface-shaped primitives stay visually blank unless a label is explicitly allowlisted. Do not persist an invalid candidate merely to exercise transport.

4. **Transport and visual quality remain independent.** PR #354 permanently repaired the previously non-executable bounded PNG chunk fallback. That transport may be exercised only for a visually valid candidate. Successful byte reconstruction/read-back cannot certify image quality, and a visual rejection must not be counted as a transport failure.

5. **Learning is part of the run.** Every material incident must preserve symptom, root cause, operational/timing impact (or explicit unknown), attempted fix, actual fix or pending state, outcome, permanent implementation, regression protection or pending state, production invariant, run evidence and next-run validation. Advancing the run without these records is incomplete recovery.


## October 2, 2026 — Kanban display and timing contract

Production Kanban reporting uses exactly three workflow columns in this left-to-right order: **Backlog → WIP → Done**. Do not add a separate **Current** column; the currently executing task is represented in **WIP**.

Every Task 00–29 card must display its duration. A task with no safely derivable duration must display **unavailable** rather than a state word such as “Done,” “accepted,” or “queued” in the duration field.

Every Kanban must also display the **total Brief elapsed time**. While a run is nonterminal, this is live elapsed time from the run start through the board observation timestamp. After terminal completion, freeze the total from run start through terminal completion. Timing must be derived from the same append-only transition evidence used for task state.
