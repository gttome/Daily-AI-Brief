# Continuous Daily Brief Qualification & Stabilization Plan

> **Status:** ACTIVE LIVING PLAN  
> **Effective:** 2026-09-26  
> **Repository:** `gttome/Daily-AI-Brief`  
> **Production branch:** `main`  
> **Primary objective:** drive the production system as close to autonomous operation as practical while requiring **zero Work, zero Codex and zero paid API usage**.

## 1. Decision

Waiting one calendar day between meaningful end-to-end tests is too slow for reliability stabilization. The system therefore uses two lanes:

| Lane | Purpose | Frequency | Production mutation |
|---|---|---:|---:|
| Production | Publish the real Daily Generative AI Brief | 1 real edition/day | Yes, protected |
| Continuous qualification | Exercise a fresh publication-equivalent candidate and deterministic release chain | Up to 4 full semantic runs/day during stabilization | **No** |
| Targeted regression | Verify one deterministic repair | As needed in GitHub Actions | **No** |

A qualification run **never counts as a published edition**.

## 2. Hard cost boundary

Every qualification run must satisfy:

- Work usage = **0**
- Codex usage = **0**
- paid API usage = **0**
- new paid services = **0**
- overage = **0**
- new credentials = **0**
- GitHub Actions deterministic model calls = **0**

The repository cannot inspect the user's ChatGPT Work-credit meter. It therefore must never infer the balance. Account-meter screenshots or owner-observed before/after values may be attached as external evidence, but qualification correctness cannot depend on an inferred balance.

## 3. Run identity

Full runs use:

- `YYYY-MM-DD-Q1`
- `YYYY-MM-DD-Q2`
- `YYYY-MM-DD-Q3`
- `YYYY-MM-DD-Q4`

Example:

`2026-09-26-Q1`

Branches:

- preflight: `discovery-preflight/qualification/2026-09-26-Q1`
- semantic handoff: `editorial-handoff/qualification/2026-09-26-Q1`

Evidence:

- `_records/qualification/2026-09-26-Q1/semantic-receipt.json`
- `_records/qualification/2026-09-26-Q1/result.json`

## 4. Full qualification lifecycle

```mermaid
flowchart LR
    A["Fresh cutoff"] --> B["GitHub zero-model discovery"]
    B --> C["9-item bounded evidence"]
    C --> D["Ordinary ChatGPT: one semantic pass"]
    D --> E["6 stories + Watchlist + books + media"]
    E --> F["6 professional images"]
    F --> G["Atomic qualification handoff"]
    G --> H["Deterministic expansion"]
    H --> I["Full qualification CI + Jekyll"]
    I --> J["Simulated live validation"]
    J --> K["SIMULATED CLOSED"]

    classDef gh fill:#ddf4ff,color:#0550ae,stroke:#54aeff,stroke-width:2px;
    classDef semantic fill:#fbefff,color:#8250df,stroke:#a475f9,stroke-width:2px;
    classDef pass fill:#dafbe1,color:#116329,stroke:#2da44e,stroke-width:2px;
    class B,C,G,H,I gh;
    class D,E,F semantic;
    class J,K pass;
```

### GitHub Actions owns

- fresh metadata discovery;
- date enrichment;
- bounded metadata filtering;
- nine-candidate source retrieval/evidence compaction;
- deterministic expansion;
- generator/contract tests;
- repository validation;
- integration validation;
- Jekyll build;
- deterministic qualification result persistence.

### Ordinary ChatGPT owns

Only the semantic work that cannot currently be executed deterministically without a paid model/API:

- one bounded editorial decision/writing pass;
- same-pass Watchlist interpretation;
- same-pass media choices;
- same-pass Professional Series relevance;
- six full-quality image generations and acceptance;
- atomic GitHub handoff through the existing connector.

**Work and Codex are prohibited.**

## 5. Production isolation

Qualification must never:

- merge to `main`;
- create a production publication PR;
- apply `publication-candidate`;
- deploy production Pages;
- update `data/operations/current-edition.json` on main;
- update production completion/lifecycle records;
- synchronize the production Command Center;
- pollute production story memory/30-day novelty history;
- write production ratings/sharing analytics.

The existing `qualification_nonproduction` execution mode remains fail-closed.

## 6. What makes a full run count

A run counts toward the stabilization streak only when all are true:

1. Fresh cutoff and fresh zero-model preflight.
2. <=20 metadata candidates.
3. <=9 evidence candidates.
4. Exactly one semantic editorial pass.
5. Exactly six stories in 2/2/2 allocation.
6. Exactly one qualifying Agent Skills story.
7. Exactly 2 verified videos.
8. Exactly 2 source-diverse podcasts.
9. Six accepted/locked professional story-specific images.
10. Watchlist evidence is current and internally consistent.
11. Professional Series mapping is evaluated.
12. Atomic qualification handoff succeeds.
13. Full deterministic qualification gate passes.
14. Jekyll build passes.
15. Simulated lifecycle reaches `CLOSED`.
16. Owner performs zero GitHub UI intervention.
17. No completed stage is redone.
18. Work = 0; Codex = 0; paid API = 0.
19. No Critical/High defect remains open for that run.

## 7. Graduation gate

The stabilization phase graduates only after:

- **5 consecutive full qualification passes**;
- at least **3 different fresh evidence cutoffs** in those five;
- zero owner GitHub UI intervention across the streak;
- zero Work/Codex/paid API usage across the streak;
- no broad same-run restart;
- no accepted-image regeneration caused by unrelated downstream failure;
- no duplicate publication PR behavior;
- all four books represented in the verified Professional Series reference catalog;
- one subsequent real production edition reaches durable `PUBLIC CLOSED` automatically under the same cost boundary.

A failed qualification resets the consecutive-pass counter but **does not invalidate completed production work**.

## 8. Book-series defect BQ-01

### Verified problem

The current `_data/book-reading.json` catalog contains only three reusable references spanning two books. Recent editions consequently overuse **Reliable Generative AI Context Engineering — Chapter 3, Designing High-Quality Contexts**.

### Repair rule

- Expand the verified reference catalog to all four books.
- Add multiple useful chapter/section/practice candidates per book.
- Select by semantic relevance first.
- **Do not force artificial daily rotation.**
- Track rolling usage over 10 full qualification/production runs.
- Warn when one exact reference exceeds 50% of recent mappings while relevant alternatives exist.
- All four books must be represented in the verified catalog before stabilization graduates.

This is a **graduation blocker**, not a reason to delay starting qualification runs; the qualification program is intended to expose and validate this repair.

## 9. Failure handling during qualification

A qualification failure should produce:

1. exact failed stage;
2. verified root cause;
3. smallest safe repair;
4. targeted regression;
5. recurrence-prevention control;
6. update to this plan and/or `LIVING-SYSTEM-OPERATIONS.md`;
7. new full qualification run from a fresh run identity.

Do not patch a failing Q-run into an apparent pass by weakening the acceptance criteria.

## 10. No-rework rule

Within one qualification run:

- preserve accepted images;
- preserve valid media;
- preserve the editorial kernel;
- preserve valid Watchlist state;
- repair only the failed deterministic dependent stage.

Between separate full qualification runs, start fresh semantic evidence intentionally because the purpose is to prove repeatability.

## 11. Testing tempo

During active stabilization, recommended windows are approximately:

- Q1 — morning
- Q2 — late morning / midday
- Q3 — afternoon
- Q4 — evening if a prior full run failed or a significant repair needs qualification

The exact clock time is less important than using **meaningfully distinct fresh evidence cutoffs**.

## 12. Readiness to start

The system is ready to begin continuous qualification when:

- this plan and the machine-readable contract are on protected `main`;
- continuous qualification validation workflow is on `main`;
- required regression test passes;
- production September 26 remains closed and unchanged;
- no active qualification run exists with the requested Q identity.

## 13. Living-plan maintenance

Update this file whenever any of the following changes:

- qualification cadence;
- zero-cost boundary;
- run identity;
- branch/evidence paths;
- semantic/deterministic ownership;
- pass/graduation criteria;
- book-series diversity policy;
- production isolation;
- recurring qualification failure or permanent control.

The stabilization program is complete only when evidence—not elapsed calendar time—shows repeated unattended success.
