# Daily Generative AI Brief — Reliability Hardening Iteration 3

**Date:** September 25, 2026  
**Wave:** Wave 3 — Close Quality-Gate Gaps  
**Problem:** P06 — Image Quality Gate Misalignment  
**Starting production SHA:** `218bb348144313a915cd38ba0e18a5e2c1924929`  
**Implementation branch:** `hardening/reliability-iteration3-2026-09-25`

## Scope

Iteration 3 closes the gap where an image could satisfy dimensions, format, hashes and lock metadata yet remain editorially below the established Daily AI Brief standard.

No September 25 editorial, image, media or Watchlist work is regenerated or republished. The new contract is forward-effective for editions on or after **September 26, 2026**. September 25 remains a historical compatibility fixture.

## Two independent gates

The canonical handoff validator now reports:

- `structural_gate`;
- `editorial_quality_gate`;
- `overall_gate`.

`overall_gate=pass` is possible only when both independent gates pass.

Structural validation covers exact asset identity and integrity: path, format, exact 1200×630 dimensions, corruption/clipping checks, story and accessibility identity, SHA-256, Git blob identity, lock state, unique bytes and replacement/version evidence.

Editorial validation requires a complete versioned `2.0.0` rendered benchmark evidence record. It does not accept dimensions, build success or a legacy `quality_accepted` boolean as editorial proof for new editions.

## Locked benchmark profile

`_records/image-quality/benchmark-profile-v1.json` binds the benchmark to exact Git blobs for:

1. the six accepted September 9 professional images;
2. the six accepted September 10 `premium3` images.

The profile preserves dimension-level comparison requirements for professional finish, meaningful detail, explanatory mechanism, annotation richness, visual depth, hierarchy, composition, story specificity and six-image differentiation.

## Six-image set gate

The quality record must contain explicit composition, layout, diagram-grammar, hierarchy and annotation-pattern signatures. The gate fails duplicated compositions and excessive reuse across the set.

This makes “six copies of the same template with different labels” a blocking condition even when every file is technically valid.

## Fail-closed behavior

Publication blocks when:

- structural validation fails;
- editorial benchmark evidence is missing or incomplete;
- editorial review is unavailable;
- an image is generic, sparse, low-detail or decorative-only;
- information-density evidence is below the benchmark;
- the six-image set is insufficiently differentiated;
- replacement provenance is incomplete;
- the final image-review entry is not `overall_gate=pass`.

The existing low-detail deterministic fallback remains disabled.

## Publication-manifest integration

Iteration 2's manifest remains the canonical contract. For editions on or after September 26, it additionally requires the versioned `image_quality_evidence` artifact and includes it in both `IMAGES_READY` and `HANDOFF_COMMITTED` dependency sets.

The post-editorial workflow validates the accepted image manifest structurally, then validates the manifest-bound final review with the combined structural + editorial gate. It does not recreate image review downstream.

## Replacement and deployed-byte verification

Accepted replacements are versioned events. The evidence must preserve the superseded asset and introduce a new version, content hash and cache key.

Post-deployment validation fetches all six live assets and compares their SHA-256 bytes with the accepted repository assets. HTTP success without byte identity is not completion evidence.

## Smart testing

Affected tests are selected first through the existing smart-test selector. Iteration 3 adds targeted sentinel coverage for weak-but-valid imagery, generic imagery, duplicated compositions, structural failures, missing quality evidence, unavailable editorial review, replacement identity failures, live-byte mismatches and preservation of the September 25 accepted fixture.

The protected PR CI remains the one authoritative integrated full-suite gate. No historical Brief generation or image generation is used as a test.

## Preserved controls

Iteration 0 lifecycle/deployment binding, Iteration 1 content-addressed recovery/idempotency and Iteration 2 publication-manifest/media/Watchlist/image-review path freezing remain intact.

Closure run IDs, the final tested PR head, merged production SHA and post-merge validation evidence are recorded on the protected Iteration 3 pull request after the exact integrated head completes CI.
