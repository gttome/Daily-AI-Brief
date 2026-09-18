# Daily Generative AI Brief — Efficiency Operating Policy

**Current profile:** `under80-v1`  
**Effective:** September 18, 2026  
**Machine-readable authority:** `docs/operations/efficiency-operating-policy.json`

This policy supersedes older efficiency instructions where they conflict. September 17 remains the visual baseline and historical evidence remains unchanged.

## Whole-cycle objective

A complete edition is qualified only when all attributable Work/Codex usage—publisher, failures, recovery, validation, Brief Command Center AI work, and edition-related maintenance—is below **80 credits**. The first three consecutive normal scheduled editions must each pass independently. Missing cost evidence is **unverified**, never zero. When a reliable scoped meter is available, 65 consumed credits is the no-new-AI-work admission threshold.

No new paid service, API runner, credential, account, model provider, permission expansion, or manual approval checkpoint is part of this profile.

## One bounded AI task

Use one daily editorial AI task. Normal operation has one semantic editorial pass, zero post-editorial model passes, zero validation model passes, zero automatic AI recovery runs, and zero AI polling of CI or deployment.

Retain at most 20 metadata article candidates and deep-review **at most nine** candidates. There is no +3 deep-review exception in this profile. If nine reviews cannot support six compliant stories, preserve the last valid edition and record the insufficiency instead of broadening automatically. Aim for at most 18,000 model-visible evidence characters and 4,000 characters of semantic rule/context overhead. Full evidence remains outside normal model input.

Capture verified source word counts during the first retrieval/review so reading-time estimates can be derived without a second source pass.

## Images

The existing high-quality OpenAI image-generation path remains the default. Preserve six story-specific 1200×630 white-background textbook illustrations with the established detail, information density, annotations, composition, hierarchy, and mobile legibility. Reuse an accepted image during recovery whenever its story evidence, visual brief, style version, and settings are unchanged. Repair only the invalidated image. Never regenerate the accepted set because another stage failed.

The deterministic renderer is not authorized to replace the current generative path unless same-story side-by-side evidence demonstrates equivalent or better quality. An uncertain or failed comparison keeps the current generator. Image quality is not a budget variable.

## Media and Watchlist

Target two verified videos under the current 10/15/20-minute ladder and two qualifying podcasts from distinct approved sources, with at most one from _The AI Daily Brief_. Empty positions use the current reason-coded, privacy-safe behavior.

Articles, media, book relevance, and Watchlist semantic decisions share the same editorial package. There is no independent broad Watchlist AI research session or second semantic book-review pass.

## Deterministic release and validation

After the accepted editorial bundle exists, ordinary software owns generation, tests, protected PR promotion, deployment verification, and the public-safe status packet. GitHub main protection remains authoritative: exact-head required CI must pass, strict main compatibility must hold, and no bypass or direct-main push is allowed.

A publication candidate may merge automatically only when it is a same-repository, open, non-draft PR to `main`, carries the trusted `publication-candidate` label, its exact head completed the required deterministic CI successfully, and the repository policy enables autonomous merge. A merge denied by GitHub protection is a release failure, not a reason to weaken protection.

Deterministic validation runs with zero model calls after Pages completion, with the existing 09:00 America/Chicago GitHub schedule as a fallback. The separate 09:00 **Work** validator may be disabled only after a successful live deterministic validation receipt proves parity. Validation failure may produce a bounded diagnostic packet; it must not automatically start an AI repair session.

## Command Center and private domains

The link-accessible dashboard is a read-only projection of canonical edition/deployment state. Owner authentication remains required for private mutation and private records. Publication, coverage, measurement, retention, learning, and book-backlog states remain independent; private owner-operation failure cannot erase a verified public release.

## Failure behavior

Failures stop cheaply. Preserve the last valid edition and all completed checkpoints. Retry only a permitted transient network failure once. Never broaden research indefinitely, regenerate unchanged accepted images, start an autonomous semantic repair, hide a cost in another session, or restore the old two-Work-task architecture as a cost workaround.

The full image standard, editorial contract, privacy rules, stable URLs, ratings/sharing behavior, archive/feed/calendar parity, append-only corrections, and protected-main rules remain mandatory.
