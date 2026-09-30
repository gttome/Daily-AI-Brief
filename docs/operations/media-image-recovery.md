# Reviewed media evidence and image recovery

Use the existing private attempt manifest with `_tools/production-run.mjs`. Verify that the actual publisher can access the durable private directory before adopting this workflow unattended. Live schedule integration is not established by these commands.

## Media catalog

`media --manifest <private-manifest> --file <reviewed-media-array.json>` stores a persistent catalog at the manifest's private root. The input records require kind (video/podcast), canonical_url, publisher feed_url and episode_guid for podcast identity when available, aliases with explicit aliases_reviewed, publication timestamp with timezone or null, runtime_seconds or null, and source {url,text,checked_at}. The review requires status reviewed, reviewer, reviewed_at, source_content_hash and exact excerpts from that source text. Retain audience_fit, rejection_reason and selection_history when present.

YouTube watch/short/embed aliases share a video identity. Podcast GUIDs are scoped to the publisher feed. Do not infer cross-platform equivalence from similar titles. Conflicting aliases fail; conflicting dates/runtimes remain unresolved and require editorial reconciliation, never majority voting or last-response-wins eligibility. Original reviewed input is saved by content hash in the private media-evidence directory; catalog updates do not replace those archives.

Catalog presence does not select an item. Keep required podcast-source/platform coverage, short-video-first rules, separate freshness windows, fallback rationales and all existing editorial gates. Missing/future publication dates and missing runtime remain unresolved. Existing source acquisition can supply these records; this command does not claim a new live source check or re-read an episode automatically.

## Story-bound image preparation

`preflight --manifest <private-manifest> --file <six-reviewed-visual-inputs.json>` accepts six records containing story_id, packet (the reviewed evidence packet) and spec. Spec requires mechanism, distinct composition, labels and relationships with zero-based claim_index references, prohibited_implications, and a review naming reviewer/time plus explicit mechanism, labels, availability and composition checks. Relationships state current, planned or unknown. Preserve source limitations and availability. Explicitly check process order and never depict planned implementation as shipped. The canonical edition must already identify the six stories.

Preflight does not grant image approval or verify semantics automatically. Generate and inspect the actual images with the existing benchmark and full image gate. Include review of labels, current/planned status and six distinct compositions. Do not substitute lower-quality art.

After the existing final six-image approval passes, `save-images --manifest <same-manifest> --file <same-inputs>` records private per-story checkpoints containing approved bytes and the approval record. Checkpoints bind canonical story content, source evidence, preflight, image bytes, approval and current image policy/validator code. Older checkpoints are retained in history before replacement.

`recover-images --manifest <same-manifest> --file <same-inputs>` checks reuse without changing files. Add `--restore` to restore missing approved image files in the same edition. It never overwrites a different working image. Changed story evidence, preflight, policy or saved bytes require review; unaffected stories can still be reused. All final publication and live image gates remain mandatory, including the approval record. Recovery does not regenerate images, silently approve a changed story, or carry an image into another edition.

These boundaries cover media normalization, image preflight and recovery after final image approval. Use `docs/operations/draft-recovery.md` to explicitly save and recover unfinished writing and image drafts privately. That separate path never grants approval. Automatic writing/generation orchestration and actual scheduled storage access remain unverified; validate them before claiming complete unattended recovery.

## Validation

Frozen tests merge platform aliases, distinguish publisher-scoped GUIDs, preserve unknown/conflicting metadata and reject unsupported claim references. The actual approved September 14 set is copied only into a temporary test checkpoint; all six images remain reusable, a changed story invalidates only its own image, missing bytes restore exactly, and changed working bytes are not overwritten. No new image generation or ordinary production token saving is claimed.


## Versioned image replacement after acceptance

For editions governed by the September 26, 2026 image-quality contract, an accepted image replacement is a new versioned asset event, not an in-place overwrite.

A replacement must preserve the superseded asset identity and record a new asset version, SHA-256, Git blob identity and cache key. The final image-review entry must remain bound to the versioned `2.0.0` editorial-quality evidence record, and that evidence must explicitly require post-deployment verification.

After Pages deployment, deterministic validation fetches the live image bytes and compares their SHA-256 values with the accepted repository assets. HTTP 200 alone is not sufficient. A stale cache, old filename, mismatched bytes or unverified replacement keeps the publication/recovery state open.

Do not edit historical approval evidence to make a replacement appear to have been the originally accepted asset. Preserve supersession history and regenerate only the affected derived surfaces.
