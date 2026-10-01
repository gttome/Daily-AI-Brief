# Independent discovery and four-book selection

Effective edition date: 2026-09-30. Existing dated receipts and reader mappings retain their original contracts. September 29 editorial, media and image work is complete and is not rerun for this change.

## Watchlist

The existing discovery stage now emits an independent discovery plan. Execute its fourteen focused checks (two in each of seven domains) in the existing semantic publisher pass. The six selected stories and their sources are not the discovery boundary. The seven domains are frontier models, agents/harnesses, developer tooling, multimodal/interface, knowledge-worker workflows, safety/governance, and open-source/community. Preserve the existing six source-surface checks, including broad web and YouTube; one real check may serve both a source surface and a domain. The bounded assisted-query budget is twenty, increased from eight to accommodate fourteen checks. Retrieval-cache reuse is allowed; a plan or cached old result does not count as a current check.

`node _tools/emerging-discovery.mjs plan YYYY-MM-DD` prints the plan without retrieving sources, changing production state or generating images. Record results in the existing `_records/watchlist-sweeps/YYYY-MM-DD.json`, with `schema_version: "2.0.0"` and `discovery_scope: "independent_watchlist"`.

Each `domain_checks` entry has an `id` and at least two distinct `checks`. Each check records `check_id`, actual `query` or `endpoint`, `method` (`web_search`, `primary_retrieval`, or `community_review`), `checked_at`, `status` (`complete` or `degraded`), `result_summary`, every discovered `candidate_id` in `candidate_ids`, and a reason for degradation. Do not silently omit candidates: the union of these IDs must exactly equal the candidate ledger. Every candidate retains the existing name, concept class, disposition, rationale and evidence URLs, plus its stable `candidate_id` and reviewed admission fields.

Admission fields are `mechanism`, `materially_new`, `relevant`, `routine_update`, `promotional_only` and `evidence`. Original evidence includes title, URL, publisher, development ID, check time, review depth, `kind: "primary"`, and the reviewer's `credible: true` judgment. One credible original technical source permits `new_topic`, `status: "early_signal"`, `confidence: "limited"`. Preserve `limitations` and the matching `topic_id` in both the ledger and topic. Corroboration, durability, cross-cutting breadth and popularity are not first-admission gates. Research scores remain descriptive, not an admission cutoff.

Merge only when `same_mechanism_topic_id` and a substantive `mechanism_comparison` establish conceptual identity. A broad common theme is insufficient. For updates, record `prior_development_ids` and `meaningful_new_evidence: true`; the new primary development must differ from the prior inventory. An exact repeated development is `duplicate`, not a timestamp refresh. Unclear distinctions remain separate early signals if they meet admission requirements. Promotional/routine items can be rejected; absent primary evidence remains `needs_research`.

Use `emergingDiscoveryTelemetry(receipt)` to derive `telemetry` from actual checks and dispositions. `node _tools/emerging-discovery.mjs validate <receipt> <watchlist>` checks the complete ledger, domains, telemetry, admissions and delta IDs. Zero-new certification still requires the fourteen-day missed-signal check, all required source surfaces and all seven domains complete, at least three reviewed candidates, and substantive justification. Degraded discovery cannot certify zero new.

The build, frozen publication manifest and required `validate` CI gate enforce these checks. Reader summaries list counts and every New today, Updated today and Carried forward item. The historical September 29 data and static pages are preserved.

## Books

The catalog has eight verified anchors for each of four books (32 total). New anchors retain a source URL, exact heading, source location and verification date. Sample-based locators additionally record the downloaded sample SHA-256 and actual PDF page. The Prompt Engineering Guide's sample is a table of contents: its printed book page numbers differ from sample PDF pages. The Learning Ecosystem's six-page sample has named sections, not numbered chapters; its locators explicitly say sample PDF page. No advanced technique locator was inferred from marketing copy. Full-book text was not reviewed.

Once canonical item IDs and editorial text exist, run:

```sh
node _tools/book-selection.mjs plan <edition.json> > book-plan.json
node _tools/book-selection.mjs select <edition.json> <semantic-review.json> > book-selection.json
```

The existing semantic pass evaluates every article, included video and podcast against every eligible anchor. Return the plan's edition date, catalog digest and item digest, plus one `items` row per item. Each row has `item_id` and a `scores` array with one record per anchor: `reference_id`, `rationale`, and integer 0–4 scores for `mechanism`, `topic`, `practical_lesson`, `audience`, `section_relevance`, and `reader_value`. A zero score is a considered nonmatch; an omitted anchor is incomplete review. The rationale must explain that item's reader benefit without claiming access to unreviewed book text.

Selection is deterministic over those semantic judgments: weighted relevance ranks first, and recent anchor, chapter, then book usage breaks exact-score ties. A qualifying reference needs section relevance and reader value at least 3/4 and weighted score at least 36/60. No match is valid and no balance quota exists. The selector returns at most one reference per item and always uses READ DEEPER; a verified practice recommendation can subsequently use the existing practice contract without changing the chosen reference or rationale.

Save the semantic review in `_data/book-reading.json` at `selection_reviews[date]`, and the returned selections at `editions[date]`, before freezing handoff. All eligible references must be considered, even if the best references come from the same book. New-date rendering refuses incomplete/stale reviews or mappings that disagree with the selector. Earlier editions are not reselected.

QA reports available/considered books, anchors and item-anchor pairs, mapped items, selected books, repeated anchors, prior-seven-edition usage by book/chapter/anchor, and concentration warnings. Concentration at 60% or more triggers review (minimum three current items or five historical items), not automatic substitution. The prior window counts editions, not calendar days, and excludes the current/future edition. Repetition may win when it has higher relevance.

`node _tools/validate-intelligence.mjs` runs these checks in the existing protected `validate` job. With `PR_BASE`/`EVENT_BEFORE`, it also rejects changes to historical mappings or their referenced anchors. The completed Sep 29 manifest points to an exact snapshot of its original catalog, retaining its original digest; growing the current catalog no longer invalidates that frozen artifact.
