# Phase 1 plan

Baseline: 580b34dd4082d5de22240652ead2e3ecf50fa557; local immutable tag efficiency-baseline-2026-09-14.

Existing behavior: _tools/discover-sources.mjs already retrieves catalog pages in batches of five and extracts candidate links; it does not deep-read or select articles. Work performs editorial research. The generator derives reader output from canonical editions. Existing scoring, novelty, media, publication and live gates remain authoritative.

1. Add metadata extraction to _tools/discovery-links.mjs, retaining HTML link discovery and adding RSS/Atom entry metadata. Unknown dates remain null.
2. Add _generator/lib/research.mjs for conservative prefiltering, evidence validation, reusable packets, explicit cache expiry/hash validation, and measured retrieval/context counters.
3. Add _tools/research.mjs to provide a durable, reviewable research plan and packet-building boundary for Work. Selection still requires the existing scored 20–30 candidate pool and canonical validation.
4. Test corruption, expiry, failures, duplicates, unknown metadata, claim traceability, category backup sufficiency, and preserved reader output. Use an explicitly labeled archive replay/shadow test; do not replay publication or invent historic full-text/token metrics.
5. Preserve all 109 tests and 15 contracts. Record the phase acceptance evidence and checkpoint before advancing.

Pending preflight evidence: private September 14 usage is stored outside the two tables exposed by the database connector. Supported authenticated snapshot retrieval must be inspected before declaring full private-operations baseline coverage. No authentication change is proposed.
