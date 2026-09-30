# Under-80 cost-reduction iteration — September 18, 2026

## Measured full-test result

- Owner-observed starting Credits remaining: **2,965**
- Owner-observed stabilized ending Credits remaining: **2,808**
- Measured full reproduction usage: **157 credits**, assuming no overlapping Work/Codex activity.
- Strict target: **<80 credits**, so the maximum passing whole-cycle value is 79 credits.
- Minimum required reduction from the measured 157-credit run: **78 credits**.
- Image quality remains protected; no image-count, image-detail, composition, or resolution reduction is authorized.

The September 18 fresh canary separately demonstrated a structurally valid bounded editorial bundle with 20 metadata candidates, 9 deep reviews, one editorial model pass, zero post-editorial model passes, an 11,176-character evidence package, six fresh accepted 1200x630 textbook images, two source-diverse podcasts, 224/224 repository tests, deterministic validation PASS, and zero deterministic-validation model calls.

The later 157-credit full reproduction did not leave the requested dedicated `repro-sep18-under80-*` branch/receipt, so it proves the measured full Work spend but does not independently prove the intended handoff/release persistence path.

## Evidence-based cost hypothesis

The strongest avoidable-cost candidate is **model-owned orchestration outside the semantic editorial/image work**, not image quality.

Before this iteration, the normal scheduled instruction path directed Work to read large historical/current policy material and could keep the model engaged through deterministic build/release work. Measured current file sizes on `main` before this change included:

- `docs/operations/publisher-runbook.md`: 33,416 characters
- `docs/images/publisher-policy.md`: 6,164 characters
- `docs/podcasts/publisher-policy.md`: 4,942 characters
- `docs/operations/efficiency-operating-policy.json`: 2,514 characters
- `_data/podcast-sources.json`: 3,110 characters

Those files alone exceed 50,000 characters before candidate evidence, source text, story memory, source registries, or tool results.

The fresh canary's measured expensive editorial inputs were already bounded: discovery 3.6 seconds, measured deep retrieval 16.8 seconds, one evidence package of 11,176 characters, one observable editorial model call, and six image generations. Image generation took 227.4 seconds, but elapsed time is **not** used as a proxy for credits. No per-stage credit meter exists, so credits are not attributed to images from timing.

## Iteration change

This branch introduces a compact 4,998-character runtime contract and a hard Work stop boundary:

1. Daily Work reads the compact runtime contract plus the machine-readable efficiency policy instead of the full historical runbook.
2. Model-visible editorial evidence is capped at 12,000 characters; the research capsule is capped at 6,500 characters.
3. Work still performs the complete quality-bearing semantic work: bounded discovery, up to 9 deep reviews, one editorial pass, six full-quality OpenAI-generated images, media/Watchlist/book decisions, and the handoff bundle.
4. Work stops after committing `_records/editorial-handoff/handoff.json` to an `editorial-handoff/*` branch.
5. A push-triggered GitHub Actions workflow takes over canonical expansion, rendering/generator execution, tests/contracts, PR creation, protected promotion, Pages, deterministic validation, and Command Center delta work with zero model calls.
6. No CI, merge, Pages, live-route, or validation polling occurs in Work.
7. No same-edition semantic retry occurs on failure.

## Qualification rule

This change does **not** claim the <80 target. After merge, a clean full scheduled-equivalent test must start from an owner-observed credit baseline, run once with no overlapping Work/Codex activity, finish through the new hard handoff path, and use no more than 79 credits. Three consecutive complete normal scheduled editions below 80 are still required for formal qualification.
