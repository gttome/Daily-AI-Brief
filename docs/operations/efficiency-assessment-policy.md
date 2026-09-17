# Daily AI Brief efficiency assessment policy

Effective September 17, 2026.

## Purpose

Preserve a complete, comparable history of Daily Generative AI Brief efficiency assessments without rewriting immutable production evidence or misrepresenting later observations as platform-attributed telemetry.

## Recording rule

Every efficiency assessment must retain all observable raw metrics used in the analysis, all derived comparison metrics reported to the owner, the provenance of every measurement, and explicit null/unavailable reasons for metrics that cannot be measured. Do not discard an unfavorable result or a recovered failure.

For each assessed edition, record at minimum when available:

- edition date, production content SHA, attempt identifier and pipeline version;
- actual attempt start/end and wall-clock seconds;
- initial publication time and post-publication QA/repair time;
- candidate, deep-candidate, selected and rejected counts;
- registered/scanned/retrieved source counts and retrieval failures;
- raw retrieved characters/bytes, evidence-packet size and downstream-context size;
- cache hits/misses and early-stop state;
- image attempts/rejects/accepted images and media candidate/fill counts;
- deterministic tests, contract fixtures, semantic checks and live-route checks;
- publication, repair and QA PR counts; targeted repair cycles and full restarts;
- Watchlist checked/success/no-link/unavailable/assisted counts;
- stage timings for discovery, filtering, deep retrieval, evidence packets, selection/writing, images, media, Watchlist, generation, QA, publication and live verification;
- observable model calls, input/output tokens and platform usage only when the platform exposes attributable values;
- owner-observed credit or allowance measurements only in the private Command Center, with provenance such as `owner_observed` and the observation method/time; never relabel them as exact platform-attributed telemetry;
- quality outcome, unresolved Critical/High defects and all recovered/degraded stages.

## Derived metrics

When their inputs are available, calculate and retain the comparisons actually used in the assessment, including:

- runtime change versus the immediately prior comparable edition and the active baseline;
- retrieval-volume change versus baseline;
- repair-overhead share of wall time;
- stage shares of wall time;
- cache-hit rate;
- deep-candidate and selection rates;
- raw-source-to-downstream-context compression ratio;
- average evidence-packet and raw-retrieval size per deep candidate;
- owner-observed credits per selected story and credits per elapsed minute when a trustworthy owner observation exists;
- distance from the current runtime and credit targets.

Derived values must identify their source measurements and must not upgrade an observed/proxy value into an exact platform measurement.

## Privacy and storage

Production attempt, QA and public-safe efficiency evidence remain append-only in GitHub. Private account usage, credit balances, owner-only reader metrics and other private operational data remain outside public Git and belong in the owner-only Daily AI Brief Command Center. If private write-back is unavailable, mark it pending rather than publishing private data in GitHub.

## Comparison discipline

Use the same metric definitions across editions. Separate actual attempt wall time from broader orchestration windows. Explain changes in workload or quality requirements before attributing an improvement to an optimization. Prefer controlled experiments that change one or two major pipeline variables at a time.

Preserve the publication quality gates while optimizing: six stories, 2/2/2 allocation, authoritative verification, novelty controls, required media handling, final public QA and zero unresolved Critical/High defects.

## Current optimization sequence

1. Prevent known pre-publication integrity failures before a PR is opened: production-date fixture collisions, truncated image/blob transport, missing story-memory snapshots and invalid UTF-8/incomplete blobs.
2. Audit raw retrieval payload by source and stage; cap or skip giant payloads while preserving evidence quality, and keep evidence packets rather than raw text in downstream context.
3. Complete stage and model/context telemetry wherever the platform exposes it, with a null reason everywhere it does not.
4. Compare credit efficiency against the latest owner-observed private benchmark while preserving provenance.
5. Maintain an append-only assessment history so future reviews can reconstruct both gains and regressions.

Targets are experiment goals, not quality overrides. A run that misses a speed/credit target but passes quality must be reported truthfully rather than repaired solely to improve the metric.