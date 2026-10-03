# Daily Generative AI Brief — Reliability Hardening Iteration 5 Instrumentation

**Date:** September 25, 2026  
**Wave:** Wave 5 — Reliability Proof and Simplification  
**Status:** STARTED — NOT ELIGIBLE FOR FINAL CLOSURE YET  
**Starting production main:** `9cdebcff8942e46a77f2778804f3ab9a3f43f503`  
**Implementation branch:** `hardening/reliability-iteration5-2026-09-25`

## Purpose

Instrument the existing production Daily Generative AI Brief so Wave 5 can prove reliability from real post-Iteration-4 daily editions without creating a second publication state machine, weakening any Iteration 0–4 control, or recreating September 25 editorial work.

Wave 5 requires at least **5 consecutive qualifying real daily editions** after the Iteration 4 production baseline. Seven is the stronger target. September 25 is a baseline/fixture only and cannot count because its production run began before Iteration 4 was deployed.

## Baseline verified

- Current production `main` at Iteration 5 start: `9cdebcff8942e46a77f2778804f3ab9a3f43f503`.
- Iteration 4 PR: #224.
- Exact Iteration 4 tested head: `17fc1743ce6e489a8e1d0cea6f695166761c58af`.
- Protected Iteration 4 CI: `36183273838` — SUCCESS.
- Post-merge CI: `36183392159` — SUCCESS.
- Pages: `36183387254` — SUCCESS.
- Closed-edition validation / Command Center refresh: `36183470294` — SUCCESS.
- Canonical status digest emitted by the refresh packet: `sha256:7e46cc76f1886699e9ef438504f3861f0b61182aca3186da455dcaa1c957d684`.

## Residual Iteration 4 acceptance item

Repository state for September 25 remains intentionally:

```text
edition: 2026-09-25
lifecycle: COMPLETED
command_center_sync: pending
```

The repository has no exact live Command Center synchronization receipt. Iteration 5 therefore does not advance the lifecycle to `CC_SYNCED` and does not count September 25 as a qualifying Wave 5 edition. The narrow Site-side task is documented separately in `RELIABILITY_ITERATION5_COMMAND_CENTER_PARITY_HANDOFF_2026-09-25.md`.

## Wave 5 proof architecture

Added a thin evidence layer:

- `_generator/lib/reliability-proof.mjs` — deterministic derivation of per-edition KPI proof, consecutive-streak summary, and bounded recovery qualification.
- `_tools/reliability-proof.mjs` — CLI that writes per-edition evidence and summaries from existing canonical lifecycle/completion/status/run-state/image-quality records.
- `_generator/test/reliability-proof.test.mjs` — bounded qualification sentinels.
- `_records/reliability-proof/wave5/summary.json` — initial proof-window summary.
- `_generator/test-selection.json` — Tier E selection only for Wave 5 qualification changes.

The proof ledger is an **evidence view only**. It does not decide publication truth and cannot advance the publication lifecycle.

## Fail-closed KPI policy

A daily edition qualifies only when every required KPI is positively proven from durable evidence. Missing information is represented as `unavailable` or `pending`; it is never converted to `false`, `0`, or success merely to preserve the streak.

The following must all be proven for a qualifying edition:

| KPI | Required result |
|---|---:|
| Scheduled edition completed | `true` |
| Manual repository repair | `false` |
| Full-pipeline restart | `false` |
| Duplicate publication PR | `false` |
| Live-reader mismatch | `false` |
| Missing completion record | `false` |
| Command Center parity mismatch | `false` |
| Unnecessary valid-stage reexecution | `false` |
| Image fallback downgrade | `false` |
| Unexplained state transition | `false` |

In addition, canonical consistency must pass and the lifecycle must have exact `CC_SYNCED` receipt evidence.

## Smart testing

Wave 5 follows the existing targeted-first strategy:

```text
Tier E bounded qualification sentinels
→ existing affected recovery/lifecycle/Command Center/image sentinels
→ one protected integrated CI run on the exact final instrumentation head
```

No broad historical replay, no editorial/model/image regeneration, and no repeated full-suite loop are introduced.

## Bounded recovery coverage

The selected Tier E qualification set exercises existing hardening primitives for:

- completion evidence unavailable;
- deployed SHA mismatch;
- Command Center refresh/synchronization failure;
- frozen-artifact mutation and earliest-invalid-stage recovery;
- accepted image reuse after unrelated downstream failure;
- duplicate publication PR/consequential-action suppression;
- preservation of valid upstream checkpoints.

Wave 5 recovery acceptance remains:

```text
Recovery success rate: 100%
Preserved valid stages: 100%
Duplicate consequential actions: 0
```

## Proof-window state at instrumentation start

```text
first qualifying edition: 2026-09-26
current consecutive qualifying editions: 0
minimum required: 5
stronger target: 7
cleanup permitted: false
```

No obsolete compatibility/emergency logic is removed in this instrumentation change. Cleanup is prohibited until the minimum real-production proof threshold is achieved.

## Scope preservation

This Iteration 5 start does **not**:

- rediscover or rewrite September 25 stories;
- rerun September 25 Watchlist research;
- reselect September 25 media;
- regenerate or replace September 25 images;
- republish September 25;
- recreate Iterations 0–4 evidence;
- change reader UX;
- add or redesign schedules;
- modify `gttome/New-Daily-AI-Brief`;
- modify the separate Sites Command Center.

## Final closure remains deferred by design

Iteration 5 cannot be declared complete on September 25. Final closure requires the real multi-day proof window, bounded recovery qualification, proof-gated obsolete-logic inventory/cleanup, protected cleanup CI, required live/Command Center checks, and a subsequent real production edition if executable cleanup changes production behavior.

Until those conditions are satisfied, P01–P12 remain under final integrated production qualification rather than being declared fully closed.
