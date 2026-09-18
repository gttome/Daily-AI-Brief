# September 18, 2026 Under-80 qualification canary

Status: **PASS locally; remote Jekyll qualification pending at checkpoint creation.**

This is a non-production canary. It does not authorize merge, publication, Pages deployment, replacement of the live September 18 edition, or qualification credit toward the three required normal scheduled editions. Production baseline `d5bf6633f252694caef46e89ecaa37a18bfb121e` remained unchanged.

## Structural result

- Fresh canary metadata pool: 20 candidates. The historical 22-candidate production pool was retained as provenance only and was not used as canary editorial input.
- Deep reviews: 9, with no expansion.
- Accepted stories: 6 in ordered 2 Technical / 2 Applied / 2 Agents allocation.
- Reusable Agent Skills stories: exactly 1.
- Editorial model passes: 1.
- Post-editorial model passes: 0.
- Deterministic validation model calls: 0.
- Evidence package: 11,176 characters.
- Images: 6 fresh, accepted, distinct 1200x630 textbook PNGs; exact hashes are in `bundle-manifest.json`.
- Videos: 0 included; bounded omission retained.
- Podcasts: 2 included from two different registered shows.
- Book bridges: 0; no unverified locator was invented.
- Watchlist: evaluated in the shared editorial pass; no canary mutation was justified.

## Deterministic checks

- Candidate schema: PASS.
- Generator and atomic staged bundle: PASS.
- Contract fixtures: 16/16 PASS.
- Repository tests: 224/224 PASS.
- Repository validation: PASS.
- Integration check: PASS.
- Deterministic canary delta validation: PASS with 0 model calls.
- Local Jekyll executable: unavailable in the runner; the isolated GitHub dry-run workflow is the required Jekyll evidence.

Initial deterministic failures are retained:

1. Eight candidate score totals did not equal component sums. The builder was corrected without changing editorial selection.
2. A changed story ID conflicted with stable reading-support identity. The stable item ID was restored without changing story evidence.
3. The efficiency record used a non-schema scope name. It was corrected to `publication_generation` without changing measurements.
4. The first isolated full-suite copy removed a production-history story page required by the production delta-validation fixture. The production fixture was retained while canary outputs were validated separately.

## Usage and timing

- Owner-provided starting meter: 3,106 Credits remaining.
- Ending meter: unavailable inside the run.
- Credit result: `credit target externally measured`.
- Exact model input/output tokens: unavailable; not inferred.
- Observable editorial model-pass count: 1.
- Observable image generation attempts: 6; accepted: 6; rejects: 0.
- Observable image generation elapsed: 227.4 seconds.
- Observable deep-retrieval tool elapsed: 16.8 seconds for measured calls; earlier successful source observations were not separately timed.
- Final local deterministic QA elapsed: 2.833 seconds.
- Unmeasured required stage boundaries remain null, so efficiency measurement status is DEGRADED even though structural checks pass.

## Checkpoint

The branch is intentionally isolated and must never receive the `publication-candidate` label. Do not merge it to `main`. The live edition remains the separately published production edition.
