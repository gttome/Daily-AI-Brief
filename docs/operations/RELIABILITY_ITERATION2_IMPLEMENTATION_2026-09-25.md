# Daily Generative AI Brief — Reliability Hardening Iteration 2

**Date:** September 25, 2026  
**Wave:** Wave 2 — Consolidate Publication Contracts  
**Production baseline:** `fd5cffa34489315b8ff1f2001d0701603bfa426c`  
**Implementation branch:** `hardening/reliability-iteration2-2026-09-25`

## Mission

Implement the controlling Wave 2 plan without reopening completed September 25 editorial, media, image, Watchlist, or publication work.

Iteration 2 addresses:

- **P07 — contract/schema drift**;
- the publication-freeze portion of **P08 — Watchlist publication drift**;
- the publication-freeze portion of **P09 — media publication drift**.

Image editorial-quality redesign, Command Center canonical-state binding, broader observability, and schedule redesign remain deferred to later waves.

## Versioned publication manifest

The canonical handoff contract is now:

`_records/editorial-handoff/publication-manifest.json`

Schema:

`1.0.0`

It binds these artifacts by exact `git_blob_sha1` identity:

1. editorial kernel;
2. candidate facts;
3. metadata candidates;
4. article evidence;
5. selected media;
6. media verification receipt;
7. accepted image manifest;
8. accepted image review;
9. immutable dated Watchlist;
10. dated Watchlist evidence;
11. book mappings.

Unversioned legacy shapes are legal only through named adapters:

- `candidate-facts-map-v1`;
- `selected-media-v1`;
- `accepted-images-map-v1`.

There is no implicit "latest" or dated-versus-legacy fallback in the production manifest contract.

## Pre-handoff validation

`_generator/lib/publication-manifest.mjs` and `_tools/publication-manifest.mjs` validate, before deterministic publication:

- supported manifest and artifact schema versions;
- exact artifact existence;
- exact Git blob digests;
- edition/date identity;
- trusted baseline SHA;
- staging-ref identity;
- selected-story coverage across facts, metadata and article evidence;
- locked image manifest/review coverage;
- media count, URL, freshness, runtime/explicit unknown-runtime evidence, source diversity and verification receipt;
- Watchlist edition date, evidence sweep, new/updated/carried counts and public-projection digest;
- dated book mappings;
- lifecycle dependency declarations.

A failure is fail-closed before downstream deterministic expansion.

## Media freeze

For editions on or after September 26, 2026:

- publication generation requires the manifest-bound media verification receipt;
- the selected media set must match the expanded edition;
- downstream publication code may not rediscover, repair or replace media;
- invalid media returns control to the pre-handoff/editorial side rather than mutating it late.

## Watchlist freeze

For editions on or after September 26, 2026:

- deterministic publication requires the manifest-bound dated Watchlist;
- reader rendering receives that exact Watchlist object rather than implicitly loading whichever `_data/watchlist.json` is newest;
- the atomic publication stage creates `data/watchlist.json` from that frozen artifact;
- the expected public projection digest is fixed in the publication manifest;
- late Watchlist regeneration/repair was removed from the post-editorial workflow.

The September 25 migration snapshot records:

- **0 new today**;
- **3 updated**;
- **13 carried forward**.

No Watchlist research was rerun.

## Image-review path consolidation

Iteration 2 does not redesign image quality.

It does remove image-review path ambiguity:

- the accepted image review is named in the publication manifest;
- production uses that exact path;
- the post-editorial workflow no longer reconstructs a dated review path or creates a replacement review after handoff;
- existing image-quality gates remain authoritative.

## Recovery integration

`HANDOFF_COMMITTED` now includes the publication manifest when present.

Its content-addressed dependency set includes every artifact referenced by the publication manifest. A changed frozen media, Watchlist, image-review, facts, evidence or book-mapping artifact therefore invalidates the handoff checkpoint and downstream proof without discarding earlier valid editorial work.

The recovery matrix routes Watchlist/publication-manifest drift to `HANDOFF_COMMITTED`.

## Smart testing

Targeted-first coverage:

- `_generator/test/publication-manifest.test.mjs`;
- `_generator/test/under80-handoff-transport.test.mjs`;
- `_generator/test/run-state-recovery.test.mjs`.

Sentinel cases include:

- unsupported manifest schema;
- missing artifact;
- stale baseline;
- mismatched date;
- invalid artifact digest;
- unsupported/implicit legacy adapter;
- frozen media mismatch;
- frozen Watchlist projection mismatch;
- late Watchlist repair reintroduction;
- late image rendering/review-path reconstruction reintroduction.

The post-editorial workflow no longer runs the entire repository test suite before creating the publication PR. It runs the minimum affected pre-PR contract checks. The protected PR CI remains the authoritative integrated full-suite gate.

## Existing work preserved

The September 25 migration manifest and frozen Watchlist snapshot are compatibility/control records only.

Iteration 2 does **not**:

- change the six September 25 stories;
- rediscover or replace media;
- regenerate accepted images;
- rerun Watchlist research;
- alter September 25 book mappings;
- republish September 25 for verification;
- rewrite Iteration 0/1 completion evidence.

## Acceptance gate

Iteration 2 closes only when:

1. the publication manifest validator passes;
2. targeted contract tests pass first on the integrated PR head;
3. the full protected deterministic CI passes on that same PR head;
4. the PR merges through protected main;
5. post-merge deterministic CI passes;
6. Pages deployment passes;
7. post-merge deterministic delta validation passes;
8. no reader-content regression is introduced.

Final run IDs and the production merge SHA are recorded in the PR/closure evidence after validation.
