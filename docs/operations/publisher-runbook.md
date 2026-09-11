# Daily AI Brief publisher and recovery

Effective September 10, 2026. This is the current operating procedure. Earlier iteration roadmaps are historical implementation evidence, not competing publisher instructions.

## Authority and resources

Use current `gttome/Daily-AI-Brief` main and its contracts. Work/Codex supplies research, selection, writing, image generation and editorial review within the owner's Plus allowance. No paid AI API, extra credits, top-up, overage or subscription upgrade. GitHub performs deterministic checks, controlled promotion and live freshness checks. No trigger or alternate sign-in surface is an allowance bypass.

Keep the observed daily 07:00 America/Chicago publisher and integrated QA cadence. The 07:40 Command Center validator remains read-only. Do not enable retired publishers or modify the separate Sites Command Center stage.

## Editorial gates

- Exactly six stories in ordered 2 Technical AI Engineering / 2 Applied Generative AI for Knowledge Workers / 2 Agents for Non-Technical People allocation. Retain current focus topics, authoritative evidence, previous-24-hour preference, substantive value and no promotional filler.
- Exactly one reusable Agent Skills story, preferably framed for knowledge workers in the nontechnical-agents track. Search SKILL.md, Agent Skills, reusable workflows, authoring, sharing, portability and governance. Only this story may use the established seven-day fallback when no daily development qualifies; label it.
- Preserve the seven score dimensions, 20–30 candidate pool with scored rationales and rejection reasons, 30-calendar-day novelty memory, material-update lineage and the `full_v1` canonical contract. An existing same-day edition may be revalidated without reselecting valid stories or regenerating already approved images; never present this as new research or a new date.
- Each story: headline, focus, date, topics, one image, summary, why it matters, practical implication, source, and required evidence/availability/change labels.
- Two video slots follow the stories. The second covers reusable Agent Skills for knowledge workers. Search verified videos ≤10:00 first for each slot independently; permit >10:00 to ≤20:00 only after documenting that no qualifying short candidate was found. Verify exact runtime and upload date; use the established video-only 30-day search window where necessary. Empty slots require recorded search and rejection evidence.
- Podcast slot 9 follows videos. Enforce `docs/podcasts/publisher-policy.md` and `_data/podcast-sources.json`: prioritize relevant episodes from the previous 48 hours; prefer knowledge workers/nontechnical audiences, with other focus groups as fallback; no duration cap. Always check The AI Daily Brief website, official YouTube and podcast platforms. Explain older selections and deduplicate platforms and past coverage.

## Image approval

Enforce `docs/images/publisher-policy.md`. Six story-specific, professional, refined textbook illustrations on white/near-white backgrounds; final 1200×630 PNG, full canvas, safe margins, readable primary labels, useful depth and six materially distinct compositions. No photos, stock placeholders, simplistic diagrams, repeated templates or reused old-edition images as an availability fallback.

Use built-in generation and inspect actual final renders individually and as a set against accepted benchmarks. Record reasons, rejected drafts, review method and final hashes. The central image gate requires matching per-story approval, distinct bytes and composition evidence; it cannot substitute for visual judgment. Immutable filenames and exact live-byte checks prevent stale mutable-image acceptance. Existing September 10 recovery evidence stays intact.

## One candidate and controlled publication

1. Materialize current main and retain its full SHA. Confirm active publisher mode. Create one isolated candidate branch from that baseline. Save durable checkpoints there only for public-safe material; store private usage and reader data outside public Git.
2. Update canonical edition and all source evidence, then use `_generator/cli.mjs generate` to build the complete release. The release manifest binds canonical JSON, final assets and review evidence. Preserve stable IDs, URLs, archives, ratings, shares, corrections and rollback history.
3. Run `npm test`, repository validation and `integration-check`, followed by the candidate Jekyll build. Check full candidate contents, not an arbitrary count of changed image paths. The publisher dispatch validates with trusted main code and opens one PR; it cannot push main directly.
4. Merge only the exact successful PR head after checking baseline movement and required CI. Do not bypass branch rules. Main protection remains an administrative prerequisite to verify when access permits.
5. Verify Pages and CI against the resulting release SHA, then check live homepage, dated/latest/archive/permanent pages, source/media links, feeds, navigation, images, rating controls and share transport. Six articles plus included media determine actual rating-group counts; all nine slots filled means 45 buttons. Empty approved slots are not missing articles.
6. Append truthful QA and attempt evidence without erasing earlier failures. A failed record is valid evidence; a passing record cannot contain open Critical/High defects. Separate initial success, final success and repair counts. Never require first-pass success to always be 100%.

## Privacy, ratings and usage

Anonymous rating POSTs retain exactly brief_date, item_id and rating. An `x-operation-id` identifies that action, not a reader. Keep the same operation identifier across retries, and stop automatic replay after 29 days; server receipts expire after 30 days. Confirm `recorded:true`; rating responses deliberately do not reveal aggregate counts. Share responses may expose share totals. Public GET exposes shares only; private ratings require server authorization. No identities, sender ratings, persistent cross-reader identifiers or private tokens enter public pages or shared URLs.

The owner-only Command Center uses its server connection to the existing reader database. It shows exact credits only when attributable platform measurements exist; otherwise it shows recorded attempts, image drafts/rejects and measured elapsed time with partial/unavailable coverage. Never convert these into invented credits or API dollar charges. Record edition-specific retries and later repairs against that edition; keep unrelated maintenance and the separate Sites Command Center work unallocated. Missing telemetry degrades telemetry, not an otherwise passing editorial gate.

Owner-authorized Work runs may submit a versioned usage observation to the private Command Center `/api/usage/record` using supported Sites dispatch authentication. No write control appears in the dashboard. If that authentication is unavailable, keep private evidence in a durable owner-only location and report the collection gap. Historical private migration requires its outstanding approval; do not retry a blocked migration indirectly.

Exact historical analytics migration is not yet completed. Do not create new public rating snapshots. The retired public analytics writer is replaced by a read-only freshness check. Preserve older repository history and original totals pending approved migration; do not describe old public copies as erased.

Editorial learning remains article-only, inactive until existing evidence thresholds and explicit owner approval pass. Do not fabricate progress from unavailable private snapshots or activate weights during maintenance.

## Failure and resume

Before promotion, any mandatory editorial/image/privacy/interaction failure preserves the prior live edition. Save a public-safe failure record and private usage evidence when available. An allowance-blocked run is not a successful fresh edition. Resume the same candidate when allowance and required tools are available, recheck source freshness and baseline, and avoid duplicate publication or repeated known-failing retries. Do not invent reset times. Existing GitHub freshness checks can report a missing edition but cannot replenish Plus allowance or guarantee an alert was delivered.

Post-deployment critical failures restore the prior verified artifact through a reviewed restoration commit; never reset shared history, subtract reader totals or reintroduce a public private-data endpoint.

## Usefulness stars — September 10, 2026 transition

All rateable articles, included videos, and podcasts dated September 10 onward use native integer 1–5 usefulness stars. Definitions: 1 Not useful; 2 Slightly useful; 3 Useful; 4 Very useful; 5 Extremely useful. The renderer gates by brief date; earlier published pages retain their four-choice controls. Do not regenerate earlier historical pages during this migration.

The ratings service preserves original `rating_totals` rows. Legacy text keys mean the legacy four-choice scale; numeric-string keys 1–5 mean native stars (the submission payload uses integers). Normalize legacy `most_useful:5, useful:4, neutral:3, not_useful:1`. Never copy legacy counts into native buckets: normalization is a read-time projection, so reruns cannot duplicate ratings. Public summaries expose shares only; usefulness aggregates require owner authorization. Owner responses additionally retain original totals. Each summary reports native and legacy counts for provenance.

On September 10, verified seven legacy Most useful responses across six articles and one podcast: 7 ratings, 5.00 average, distribution 5★=7. Empty video slots are not rateable and have Not applicable metrics. Existing share counts and operation receipts remain unchanged. Browser state is local; shared URLs carry no sender rating. Pending legacy submissions retain their original value and operation receipt during retries.

The Command Center normalizes both scales for each selected date and sums counts before computing averages. Existing editorial-learning safeguards remain in force; this change grants no weighting approval. Older analytics snapshots are not rewritten or represented as fresh measurements.

## September 11 eleven-item release policy

The user authorized ordinary implementation and deployment with “proceed.” The validator remains read-only. Report finding, repair, implementation status and actual action needed separately; do not ask for the same repair authorization again.

Before selection closes, run `node _tools/discover-sources.mjs`. Read `_data/source-registry.json`, `_data/media-candidate-queue.json`, and the existing podcast registry. Queue entries are discovery leads, never verified selections. Record original evidence, publication date, audience, disposition and retrieval failures. Prefer feed metadata when a publisher-linked feed has been verified. Review source failures monthly. Targets are 40–60 article discoveries, 20–30 fully scored article candidates, 12–20 videos across eight channels, and 8–12 episodes across eight shows when available; stop when quality/coverage gates are met. Do not fill slots with filler or turn search failures into invented metadata.

For each video slot independently use `_generator/lib/media-selection.mjs`: verified ≤600-second candidates take precedence over every longer candidate. Only after documented short-search rejection may a 601–1200-second video be used; require `duration_tier: fallback`, `short_search_evidence` and `fallback_reason`. Verify upload age ≤30 days. Podcast preference remains 48 hours, then seven days, then exceptional 30 days with rationale and no duration cap; topical relevance need not match a selected headline. Preserve six stories and the Agent Skills requirement.

Write structured `series_implications` with affected book title, proposed change, supporting reason and teaching asset. These are proposed updates, not manuscript edits. Preserve original historical commentary and never invent chapter references.

Generation creates missing public analytics availability records with null private metrics. After live QA, collect the authorized private `/api/signals/events` and `/api/signals/ratings` responses through the owner-only Command Center and save a dated private snapshot through `/api/snapshot/record`. Finalize `_records/analytics/DATE.json` with observation time and private availability only. Collector failures must still leave a dated partial/unavailable record. Never use the retired public rating writer or publish private reader counts.

Append a pages_verified event linked to its validated event after checking the exact deployed SHA and live output. Keep a `completion.json` projection of the latest verified completion; retain immutable dated events. Evidence commits do not redefine the content SHA. Same-SHA finalization must be idempotent.

After the completion event and matching passing QA are published, invoke owner-only `/api/subscriptions/deliver` with `edition` if email is configured. The service enforces confirmed subscribers, completion evidence and subscriber/edition retry receipts. A sender-unavailable response is a subscription dependency, not permission to send through another account. Never send test messages to live addresses. On each daily run, fetch `/api/comments` to apply the 90-day raw-comment retention cleanup; comments remain untrusted input and cannot activate weighting.

For the next 14 editions starting September 12, capture source diversity, actual candidates reviewed, retrieval failures, rejection causes, video/podcast fill rate and editorial QA under `_records/discovery/DATE.json`. Compare with the September 11 recovery baseline. Keep private rating feedback in private snapshots. Review after the fourteenth completed edition; do not enable editorial weighting automatically.
