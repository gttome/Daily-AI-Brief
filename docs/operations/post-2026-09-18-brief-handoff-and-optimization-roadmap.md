# Daily Generative AI Brief — Post–September 18 Handoff & Optimization Roadmap

> **Status:** 🟠 **PRE-RUN HANDOFF — revise after the September 18, 2026 Brief completes**  
> **Repository:** `gttome/Daily-AI-Brief`  
> **Production branch:** `main`  
> **Production anchor at handoff creation:** `e19d8284c3a77fe4827201340c67b7438019100f`  
> **Primary objective:** drive the **Daily Brief publisher below 100 owner-observed Work credits per normal run** while preserving or improving reliability, editorial quality, freshness, accessibility, security, and rollback safety.

![Daily AI Brief path to under 100 Work credits](assets/post-sep18-credit-reduction-roadmap.svg)

---

## 1. Purpose of this handoff

This document is the working handoff for the first production run after the September 17 efficiency implementation was promoted to `main`. It has two jobs:

1. define exactly what must be captured, verified, compared, and recorded after the **September 18, 2026** Brief run; and
2. define the next optimization program aimed at materially reducing **Work credits** and **wall-clock time** without weakening any production quality or security gate.

This is deliberately a **pre-run draft**. Do not fill unknown September 18 results with estimates. After the September 18 Brief completes, replace the placeholders in §6 and revise the priorities in §9–§12 using actual observed evidence.

### Non-negotiable principle

**Optimize around the quality gates, not through them.** A run that is slower or more expensive than the target but passes quality must be reported truthfully. Do not lower story quality, freshness, evidence standards, required media handling, accessibility, route integrity, rating/share behavior, rollback safety, or Command Center security merely to improve a metric.

---

## 2. Current production state before the September 18 run

The September 17 efficiency revision has been promoted to production. The production state at the time this handoff was created is:

| Area | Verified state before Sep 18 |
|---|---|
| Production `main` | `e19d8284c3a77fe4827201340c67b7438019100f` |
| PR #117 | Merged into `main` |
| Post-merge deterministic publication CI | **PASS** — run `35276907406` |
| Post-merge GitHub Pages build/deploy | **PASS** — run `35276906646` |
| Main protection | Active ruleset `23615327`; PR required; strict `validate`; no bypass actors; deletion/non-fast-forward blocked |
| Efficiency policy effective date | September 18, 2026 |
| Normal metadata candidate ceiling | 20 |
| Normal deep-review target | 9 |
| Deep-review exception ceiling | 12 |
| Normal retrieved-character budget | 1.5M |
| Absolute retrieved-character ceiling | 2.5M |
| Research capsule target | 9,000 chars |
| Normal editorial context target | 6,500 chars |
| Normal semantic/editorial passes | 1 |
| Routine post-editorial model calls | 0 |
| Routine validation model calls | 0 unless deterministic resolution is insufficient |
| Watchlist | shared acquisition + changed-only semantic refresh design |
| Reader ordering for new editions | Agents → Knowledge Workers → Technical |
| Prewarm workflow | installed on `main`, **manual-only** (`workflow_dispatch`) before Sep 18 |

### Measurement baseline

The latest owner-observed pre-promotion benchmark is:

> 🔴 **September 17, 2026:** **566 Work credits** and **50:19 wall time**.

Treat the 566-credit number as **owner-observed usage evidence**, not platform-attributed per-stage telemetry. Preserve that provenance in every comparison.

The September 18 run is the first production measurement of the new efficiency architecture. It is therefore the control point for the next optimization tranche.

---

## 3. What must happen immediately after the September 18 Brief run

![Post September 18 evidence and optimization decision flow](assets/post-sep18-decision-flow.svg)

Perform the following in order. Do not begin another major optimization until the evidence package is complete enough to explain where the September 18 credits and time went.

### 3.1 Freeze the production evidence

Capture and preserve:

- final production `main` SHA associated with the September 18 edition;
- publication attempt ID / receipt and pipeline version;
- publisher start time, end time, and actual wall-clock duration;
- owner-observed Work credits consumed by the publisher run;
- if available, before/after usage screenshots or other owner evidence with observation time;
- publication PR/commit(s), CI runs, Pages deployment run and final live-route result;
- any repair PR, targeted repair cycle, retry, restart, recovery action, or manual intervention;
- final quality result and unresolved defect severity, if any.

**Do not** rewrite historical failure evidence. If a stage failed and later recovered, retain both the failure and recovery.

### 3.2 Capture the complete efficiency telemetry set

Record every available raw measurement before calculating derived metrics.

| Measurement family | Capture after Sep 18 |
|---|---|
| Work usage | owner-observed credits consumed; observation method/time; exact/unavailable distinction |
| Timing | total publisher wall time plus stage timings where observable |
| Candidate funnel | metadata candidates; filtered candidates; deep candidates; selected 6; rejected/backup counts |
| Retrieval | sources scanned; retrievals; failures; bytes/chars; full-text vs metadata retrievals |
| Cache | hits; misses; conditional revalidations; `304 Not Modified`; hit rate |
| Context | evidence-packet chars; research capsule size; editorial context size; compression ratio |
| Model use | observable model-call count; semantic passes; any escalation calls; token metrics only if genuinely observable |
| Images | attempts; deterministic attempts; generative fallbacks; rejects; accepted 6; quality-gate failures |
| Videos | metadata candidates; trusted-source candidates; deep-reviewed finalists; selected count; duration-tier use |
| Podcasts | metadata candidates; selected count; source diversity; freshness tier |
| Watchlist | changed/carried/new topics; semantic refresh count; failed-source retry count |
| QA | deterministic tests; contract checks; route checks; live smoke; model escalation count |
| Repairs | targeted repair count; full restart count; repair time; repair share of total runtime |
| Publication | PR count; commits; Pages deploy; live verification |

For any unavailable metric, record **why it is unavailable**. Do not infer tokens, credits, private metrics, or per-stage costs from weak proxies.

### 3.3 Apply the quality gate before interpreting savings

The September 18 efficiency result is only comparable if the edition preserves the operating quality baseline:

- exactly **6 stories**;
- canonical **2 Technical + 2 Knowledge Worker + 2 Agents/Non-technical** allocation;
- authoritative evidence and required novelty checks;
- qualifying Agent Skills coverage where required by current policy;
- six acceptable story-specific images;
- required video handling and bounded-discovery evidence when a slot cannot be filled;
- podcast handling under current source-diversity rules;
- permanent article/media routes, archive/feed parity and reading-time behavior;
- rating/share behavior and privacy contract;
- accessibility and deterministic CI;
- append-only corrections and stable URLs;
- zero unresolved **Critical/High** defects.

If quality fails, repair the failed stage and record the repair separately. **Do not restart the entire pipeline unless the failure invalidates the pipeline state.**

---

## 4. September 18 comparison calculations

Once the raw evidence is frozen, calculate at minimum:

- credit change vs September 17: `(Sep18 credits - 566) / 566`;
- wall-time change vs September 17: `(Sep18 wall time - 50:19) / 50:19`;
- credits per selected story;
- credits per elapsed minute;
- cache-hit rate;
- retrieval-volume change vs the active baseline;
- metadata-to-deep-review reduction rate;
- deep-review-to-selection rate;
- raw-source-to-editorial-context compression ratio;
- repair-overhead share of wall time;
- stage share of total wall time;
- distance to the **<100-credit** target;
- distance to provisional wall-time targets in §11.

### Required interpretation discipline

A lower credit total does **not** by itself prove every new optimization worked. Separate, as far as the evidence allows:

- workload differences on September 18;
- cache behavior;
- source availability;
- image generation/recovery burden;
- media availability;
- Watchlist changes;
- repair activity;
- publisher/model behavior;
- deterministic processing and CI overhead.

---

## 5. Prewarm decision after September 18

### 5.1 Intended end state

The acquisition prewarm is intended to become a normal daily optimization **if and only if the publisher actually consumes the warmed cache**.

Current prewarm behavior:

- metadata-only;
- maximum of 12 high-priority endpoints;
- concurrency in bounded groups;
- no semantic/model work;
- GitHub Actions cache at `.cache/dab-retrieval`;
- cache TTL currently one hour in the retrieval implementation;
- workflow currently manual-only.

### 5.2 Why it is not automatically scheduled yet

The repository proves the GitHub Actions prewarm cache is produced and restored within Actions. It does **not yet prove** that the separate 07:00 Work publisher can consume that same persisted cache across the execution boundary.

Running a daily prewarm without proving that handoff risks adding network/Actions activity without materially reducing Work credits or publisher wall time.

### 5.3 Post-run prewarm experiment

After the September 18 baseline is captured:

1. identify the publisher's actual cache location and lifecycle;
2. run prewarm manually and retain its receipt/artifact;
3. prove that the subsequent publisher/integrated acquisition sees those entries as hits or conditional revalidations rather than independent cold misses;
4. verify freshness remains correct and stale entries are revalidated;
5. verify no private data or credentials enter the portable cache;
6. compare acquisition wall time, cache-hit rate, bytes/chars downloaded and Work credits;
7. only then promote prewarm to a daily scheduled optimization.

### 5.4 Proposed permanent schedule after proof

If the cross-environment cache handoff is proven, schedule prewarm approximately **06:15–06:30 America/Chicago** for the normal **07:00 publisher** so direct cache hits remain inside the one-hour TTL. Preserve DST correctness.

The exact schedule must be treated as a production change and validated independently before activation.

---

## 6. September 18 results — fill after the run

> 🟡 **PLACEHOLDER SECTION — do not estimate. Replace with observed evidence after the run.**

| Metric | Sep 17 baseline | Sep 18 actual | Change | Evidence/provenance |
|---|---:|---:|---:|---|
| Work credits — publisher | 566 | TBD | TBD | Sep 17 owner-observed; Sep 18 TBD |
| Wall time | 50:19 | TBD | TBD | attempt timing |
| Metadata candidates | TBD | TBD | TBD | publication telemetry |
| Deep candidates | TBD | TBD | TBD | publication telemetry |
| Cache hits | TBD | TBD | TBD | retrieval telemetry |
| Cache misses | TBD | TBD | TBD | retrieval telemetry |
| Conditional revalidations | TBD | TBD | TBD | retrieval telemetry |
| 304 responses | TBD | TBD | TBD | retrieval telemetry |
| Retrieved chars | TBD | TBD | TBD | retrieval telemetry |
| Editorial context chars | TBD | TBD | TBD | context telemetry |
| Semantic/model calls | TBD | TBD | TBD | observable call telemetry |
| Image attempts / rejects | TBD | TBD | TBD | image receipt |
| Videos selected | 2 target | TBD | — | media receipt |
| Podcasts selected | 2 target when qualifying | TBD | — | media receipt |
| Watchlist topics semantically refreshed | TBD | TBD | TBD | delta receipt |
| Repair cycles | TBD | TBD | TBD | attempt/QA receipts |
| Critical/High defects | 0 target | TBD | — | final QA |

### Post-run conclusion placeholder

- **Quality gate:** `TBD`
- **Efficiency gate:** `TBD`
- **Primary bottleneck:** `TBD`
- **Largest avoidable Work-credit consumer:** `TBD`
- **Largest avoidable wall-time consumer:** `TBD`
- **Prewarm handoff priority:** `TBD`
- **Next optimization iteration selected:** `TBD`
---

## 7. Ultimate optimization goal

### Target

> 🟢 **Sustained normal publisher runs below 100 owner-observed Work credits per Brief.**

“Achieved” should mean at least **three consecutive representative normal runs** below 100 credits with the full quality gate passing and no hidden manual work moved outside the recorded attempt.

### Provisional sub-100 credit budget

This is a planning allocation, **not measured telemetry**. Revise it after September 18.

| Stage | Provisional Work-credit budget | Design intent |
|---|---:|---|
| Acquisition + metadata filtering + cache management | **0–5** | deterministic/offloaded; Work sees compact evidence, not raw discovery |
| Semantic editorial selection + writing | **35–45** | one compact structured editorial pass |
| Visuals + media semantic work | **20–25** | deterministic diagrams/metadata-first media; generative fallback only when quality requires |
| Assembly + deterministic QA + publication | **0–5** | no routine model work |
| Exception reserve | **10–15** | source ambiguity, novelty conflict, quality escalation |
| **Total target** | **65–95** | leaves headroom below 100 |

The architecture should be designed so a normal run can satisfy the Brief contract without consuming the exception reserve.

---

## 8. Optimization strategy

The fastest path to <100 credits is **not** to make the model slightly more concise. It is to shrink the amount of work that needs Work/model intelligence at all.

The next program should pursue four architectural principles:

1. **Deterministic first:** move deterministic retrieval, filtering, hashing, rendering, validation, route checks and publication mechanics out of Work wherever safely possible.
2. **Evidence once, reuse many times:** content-addressed cache, conditional revalidation, evidence capsules and unchanged-state carry-forward.
3. **Semantic work only at decision boundaries:** one editorial pass; model escalation only for genuinely ambiguous evidence or quality failures.
4. **Never rerun unaffected stages:** checkpoint every expensive stage and repair only the invalidated dependency chain.

---

## 9. Next optimization iterations

Priorities below are intentionally aggressive. Reorder them after the September 18 evidence identifies the real bottlenecks.

### Iteration 1 — Complete cost and stage observability

**Objective:** make every optimization measurable and prevent credit/time regressions from hiding inside an aggregate run.

Implement or complete:

- stage-level start/end timestamps for discovery, filtering, deep retrieval, evidence compilation, editorial pass, images, media, Watchlist, generation, QA, publication and live verification;
- explicit model-call counter by stage;
- context-size measurement by stage;
- retrieval chars/bytes by source and stage;
- cache hit/miss/revalidation/304 metrics;
- repair/retry/full-restart counters;
- owner-observed credit snapshot association with the exact attempt ID;
- append-only per-edition efficiency assessment record;
- Command Center trend view for credits, runtime, cache efficiency, repairs and quality.

#### How

1. Add a small **stage-telemetry wrapper** around each publisher stage rather than scattering timing code through business logic. Each wrapper should emit `stage_id`, start/end timestamps, elapsed seconds, input/output hashes, retry count, model-call count, context characters, and status.
2. Extend the existing attempt/efficiency receipt schema so every stage writes into one append-only attempt record. Use `null` plus an explicit `unavailable_reason` whenever the platform does not expose a metric.
3. Instrument retrieval at the shared acquisition/cache layer so bytes, normalized characters, cache hits/misses, conditional requests, `304` responses, timeouts, and failures are captured once and inherited by Brief and Watchlist consumers.
4. Add counters at the semantic boundary rather than trying to infer model usage later. Record the number and purpose of editorial calls, escalation calls, and any image/media semantic calls.
5. Link owner-observed credit measurements to the exact attempt ID and observation timestamp in the private Command Center; do not place private account balances or screenshots in public Git.
6. Build a deterministic aggregation step that computes comparable derived metrics—credits/story, credits/minute, cache-hit rate, compression ratio, repair share, and stage share—only from recorded raw fields.
7. Add regression tests for receipt completeness, metric provenance, null handling, append-only history, and stable definitions across editions.
8. Surface a compact Command Center trend panel only after the underlying receipt is authoritative, so the dashboard is a view over evidence rather than a second source of truth.

**Proof / acceptance:** one complete production attempt can be reconstructed stage by stage from its receipts; every reported metric has provenance; unavailable metrics state why; and the September 17/18 comparison can be recomputed without manual interpretation.

**Value:** without this, sub-100 work becomes guesswork.  
**Reliability impact:** high positive.  
**Expected Work-credit leverage:** indirect but foundational.

---

### Iteration 2 — Prove portable prewarm cache and schedule it daily

**Objective:** remove avoidable acquisition latency from the 07:00 Work critical path.

Implement:

- a portable, content-addressed metadata cache contract usable by GitHub Actions and the publisher;
- cache manifest with URL, content hash, fetched time, TTL, ETag/Last-Modified and provenance;
- integrity validation before publisher reuse;
- conditional revalidation for expired entries;
- prewarm receipt linked to publisher attempt receipt;
- daily 06:15–06:30 America/Chicago prewarm only after the handoff is proven;
- failure isolation so a failed prewarm never blocks the publisher.

#### How

1. Define a **portable cache manifest** independent of a particular runner. Each entry should include normalized URL, retrieval kind, content hash, fetched time, expiry/TTL, ETag, Last-Modified, response size, source ID, and schema/version identifiers.
2. Store cache payloads by content hash and keep the manifest small. The publisher should validate the manifest and hashes before trusting any warmed entry.
3. Change the prewarm workflow to publish a bounded cache artifact/manifest that the publisher can actually consume; do not assume the GitHub Actions cache namespace is visible to ChatGPT Work.
4. Add a publisher bootstrap step that attempts to load the prewarm package, records `prewarm_loaded=true/false`, validates freshness/integrity, and falls back safely to normal acquisition when the package is absent or invalid.
5. Preserve conditional revalidation: a warmed item inside TTL may be a direct hit; an expired/stale item should supply ETag/Last-Modified and be revalidated rather than blindly reused.
6. Run a controlled experiment after the September 18 baseline: first without prewarm, then with a manually produced prewarm package close to publisher start. Compare cache hits, conditional requests, retrieved chars/bytes, acquisition time, total wall time, and owner-observed credits.
7. Verify prewarm contains only public acquisition data and no owner identity, private ratings, credentials, or Command Center private records.
8. If reuse is proven, schedule the prewarm around **06:15–06:30 America/Chicago**, add DST-safe scheduling, and make prewarm failure non-blocking. The publisher must still be able to complete from a cold cache.

**Proof / acceptance:** the publisher receipt cites the exact prewarm manifest/artifact, shows warmed entries becoming cache hits or conditional revalidations, and demonstrates measurable acquisition benefit without stale-content or privacy regressions.

**Value:** lower cold-source latency and fewer duplicate network fetches.  
**Reliability impact:** positive if stale/failure handling remains explicit.  
**Expected Work-credit leverage:** potentially meaningful, but must be measured after handoff proof.

---

### Iteration 3 — Move deterministic work out of Work

**Objective:** reserve Work intelligence for editorial judgment rather than orchestration.

Candidates for deterministic/offloaded execution:

- source registry loading and endpoint planning;
- metadata retrieval and normalization;
- URL/date/category validation;
- duplicate/event-fingerprint filtering;
- 30-day novelty precheck where it can be deterministic;
- candidate scoring heuristics before semantic review;
- unchanged Watchlist topic carry-forward;
- static page generation and derived fields;
- reading-time calculation;
- archive/feed generation;
- route/integrity validation;
- deterministic accessibility checks;
- publication receipt generation;
- Command Center public-safe delta packet generation;
- standard post-publication QA.

Work should receive a compact, validated evidence contract rather than raw repository state plus raw source payloads.

#### How

1. Draw a hard boundary between **deterministic orchestration** and **semantic judgment**. Anything whose output is fully determined by validated inputs and policy should run in code, not in a Work/model turn.
2. Create a deterministic pre-editorial package that performs registry loading, source planning, normalization, date/category checks, duplicate/event filtering, preliminary scoring, Watchlist unchanged-state detection, and policy-safe novelty prechecks.
3. Emit one compact, schema-validated **editorial evidence contract** containing only the finalist evidence and fields that truly require judgment. Do not send raw repository files, full historical policies, or already-derived presentation fields to Work.
4. After the editorial response, run a deterministic post-editorial kernel for route generation, reading time, labels, archive/feed entries, page assembly, accessibility checks, receipt generation, and routine QA.
5. Move standard live-route comparison and unchanged-state validation to deterministic scripts; allow a model escalation only when a named failure cannot be classified or repaired deterministically.
6. Add contract tests that compare old and new deterministic outputs for identical approved editorial inputs, including immutable historical fixtures.
7. Measure Work context size and model-call count before/after the boundary change, not just total runtime.
8. Promote components incrementally so a failure can be attributed to a specific moved stage; retain a compatibility path only until live equivalence is proven.

**Proof / acceptance:** a normal run performs acquisition, filtering, rendering, QA, and publication mechanics with zero routine model calls; Work receives only the compact editorial contract; and public output remains byte/semantic equivalent where identity is expected.

**Value:** likely one of the largest paths to the <100-credit target.  
**Reliability impact:** positive because deterministic contracts are repeatable and testable.

---

### Iteration 4 — Content-addressed evidence store and cross-run reuse

**Objective:** stop paying repeatedly to rediscover and re-understand unchanged evidence.

Implement:

- cache key = normalized URL + evidence kind + source-content hash;
- durable evidence capsules with claim/source traceability;
- reuse across Brief, Watchlist, media screening and validation;
- unchanged-source semantic result reuse with strict freshness rules;
- source delta detection so only changed content re-enters semantic review;
- compact 30-day novelty/event index rather than broad historical rereads;
- explicit invalidation when source content, policy, or review version changes.

#### How

1. Introduce a **content-addressed evidence record** keyed by normalized URL + evidence kind + source-content hash + review/policy version. A changed URL alone should not force semantic work if content is identical; changed content must invalidate prior semantic conclusions.
2. Persist reviewed claims, evidence excerpts, novelty/event fingerprints, category, confidence, limitations, review version, and source provenance in a compact capsule.
3. Before any semantic review, compute the current source hash and check for a reusable capsule that is still valid under the current freshness and policy versions.
4. Share the same capsule across Brief selection, Watchlist delta evaluation, media screening where applicable, and later validation instead of re-retrieving/re-summarizing the same source.
5. Build a compact rolling novelty/event index for the previous 30 days using stable fingerprints and selected metadata; avoid loading entire prior briefs or raw source text into each run.
6. Add explicit invalidation rules for source-content change, policy/reviewer version change, corrected publication date, changed category, novelty conflict, or expired freshness window.
7. Record reuse telemetry: evidence capsules reused, invalidated, rebuilt, and semantic calls avoided.
8. Test adversarial cases such as same URL with changed article body, mirrored URLs with same content, corrected dates, and policy-version changes.

**Proof / acceptance:** unchanged evidence is reused without semantic reprocessing, changed evidence is reliably invalidated, every reused claim remains traceable to the current source hash, and the run records how much retrieval/semantic work reuse avoided.

**Value:** reduces repeated retrieval, repeated summarization and repeated semantic reasoning.  
**Reliability impact:** positive if invalidation rules are strict.

---

### Iteration 5 — Adaptive candidate budgets and earlier stopping

**Objective:** stop discovery/deep review as soon as the editorial contract is safely satisfiable.

Current normal limits remain 20 metadata candidates / 9 deep reviews / 12 exception ceiling. Use September 18 data to test whether normal runs can safely operate below those ceilings.

Candidate improvements:

- rank trusted primary sources first;
- category-specific sufficiency counters;
- stop metadata discovery once each category has enough strong candidates plus backups;
- stop deep retrieval immediately when the three-category sufficiency gate and Agent Skills requirement are satisfied;
- avoid full text for candidates eliminated by date, duplicate, source, topic, or event fingerprint;
- dynamically lower candidate ceilings on high-signal days;
- preserve the exception path for thin-news days.

#### How

1. Replace fixed “process up to the ceiling” behavior with a **sufficiency-driven planner**. Track, per category, how many fresh high-confidence candidates, finalists, and backups have been verified.
2. Rank metadata candidates using deterministic source reliability, freshness, category fit, novelty/event fingerprint, and preliminary signal score before any full-text retrieval.
3. Reject candidates on metadata-only grounds whenever possible: stale date, duplicate URL/content, already-covered event without material update, unsupported source, promotional filler, category mismatch, or missing required metadata.
4. Deep-retrieve in small batches (for example 2–3 at a time) rather than all 9 immediately. After each batch, recompute whether all three categories have enough qualifying candidates plus Agent Skills coverage.
5. Stop deep retrieval as soon as the existing editorial sufficiency contract is satisfied; use the 10–12 exception range only when a named category/skill insufficiency remains.
6. On high-signal days, experiment with a lower metadata ceiling and/or lower normal deep target on a shadow branch. On thin-news days, preserve the current bounded fallback so freshness/quality do not degrade.
7. Record why discovery stopped (`sufficiency_met`, `candidate_ceiling`, `freshness_shortfall`, etc.) and how many retrievals/model evaluations were avoided.
8. Compare final story quality, backup depth, source diversity, and novelty performance against September 18 before lowering any production ceiling.

**Proof / acceptance:** the planner exits early on representative strong-news days while still producing the full 2/2/2 + Agent Skills contract, and the measured deep-retrieval/context volume falls without increased repair or quality failures.

**Value:** directly reduces retrieval, context, semantic evaluation and wall time.  
**Guardrail:** never let the efficiency stop condition override freshness, 2/2/2 allocation or evidence quality.

---

### Iteration 6 — Editorial pass compression

**Objective:** make the one remaining semantic pass smaller, more structured and more reusable.

Implement/test:

- strict structured input containing evidence capsules only;
- remove repository prose, repeated policies and already-derived values from model context;
- send policy IDs/hashes rather than full unchanged policy text when safe;
- structured output contract containing selection, story text, rationale, uncertainty and only fields requiring judgment;
- derive reading time, links, route metadata, archive entries, labels and layout deterministically;
- no routine “review your answer,” re-summarization, or second editorial rewrite pass;
- semantic escalation only for named unresolved conflicts.

#### How

1. Define a strict **editorial input schema** containing only candidate/evidence capsules, compact novelty context, current editorial rules that require semantic judgment, and explicit output requirements.
2. Replace repeated prose policies with stable policy IDs, hashes, or compact rule summaries when the full text is unchanged and already enforced deterministically.
3. Order the input by decision utility: category sufficiency, candidate facts/evidence, novelty conflicts, limitations, then required output schema. Exclude HTML, route boilerplate, archive state, and fields the deterministic kernel can derive.
4. Require one structured editorial response that includes selection, story title/summary/why-it-matters text, rationale, confidence/uncertainty, and any named unresolved exception. Avoid a second “review/rewrite” turn on the normal path.
5. Validate the response against a schema before accepting it. Missing or malformed fields should trigger targeted repair of the response contract, not a full research rerun.
6. Generate reading time, labels, IDs/routes, page metadata, related links, archive entries, and layout fields deterministically after the editorial pass.
7. Establish explicit escalation predicates—e.g., conflicting publication evidence, unresolved novelty identity, insufficient category coverage—so extra semantic calls occur only for those named conditions.
8. Track editorial input characters, output characters, call count, and escalation reason across runs; use September 18 as the first comparison anchor.

**Proof / acceptance:** normal editions complete with one editorial semantic call, materially smaller input/output context, no routine second-pass rewrite, and no reduction in factual traceability or editorial quality.

**Value:** direct reduction in Work/model context and output volume.  
**Reliability impact:** positive if schema validation rejects malformed outputs before publication.

---

### Iteration 7 — Visual pipeline cost reduction without quality regression

**Objective:** preserve the September 17 professional textbook baseline while reducing expensive retries and model-dependent image work.

Implement/test:

- promote deterministic diagram rendering only for story classes where it demonstrably meets or exceeds the visual baseline;
- story-to-layout classifier using deterministic features where possible;
- reusable layout grammar for process, layered architecture, hub/spoke, lifecycle, compare/decision, pipeline, control/approval, evidence verification, annotated system and composite diagrams;
- validate typography, node count, density, clipping, contrast and 1200×630 output deterministically;
- use generative image production only as the quality fallback;
- content-address approved images so retry/recovery never regenerates an already accepted image;
- checkpoint each accepted image independently.

#### How

1. Classify each selected story into a deterministic visual grammar (process, layered architecture, hub/spoke, lifecycle, comparison, pipeline, control/approval, evidence verification, annotated system, composite) using structured story features.
2. Generate a story-specific diagram specification from the approved editorial facts: title, explanatory nodes, relationships, annotations, hierarchy, and emphasis. The spec—not a free-form image prompt—becomes the durable checkpoint.
3. Render the spec through the deterministic visual renderer at **1200×630** with the required white-background textbook style and run automated checks for clipping, text overflow, contrast, node count, whitespace, and output dimensions.
4. Add a semantic/visual quality gate comparing deterministic output against the September 17 baseline criteria: explanatory specificity, information density, legibility, professional composition, and no generic placeholder behavior.
5. If a deterministic diagram fails that gate, route only that story to the high-quality generative image path; do not degrade the public image to save credits.
6. Hash the accepted visual spec and final PNG so retries and downstream repairs reuse an already accepted image instead of regenerating it.
7. Record per-story path (`deterministic` vs `generative_fallback`), attempts, rejects, elapsed time, and any Work/model usage associated with visual production.
8. Promote deterministic layouts category by category only after repeated parity evidence, rather than switching all six images at once.

**Proof / acceptance:** an increasing share of stories use deterministic diagrams that meet the visual baseline on first attempt, accepted images are reusable across retries, and generative fallbacks remain isolated to stories that need them.

**Value:** potentially large wall-time and Work reduction on image-heavy runs.  
**Guardrail:** no low-information placeholders and no quality downgrade to satisfy a cost target.

---

### Iteration 8 — Media discovery fully metadata-first

**Objective:** keep video/podcast discovery off the expensive semantic path until the finalist set is very small.

Implement/test:

- deterministic publisher/source trust filtering;
- duration parsing before semantic review;
- freshness/source-diversity checks before semantic review;
- title/description fingerprint dedupe;
- only the strongest 3–5 video candidates deep-reviewed;
- podcast source-diversity enforcement deterministically;
- cache media metadata independently of story evidence;
- no model call when a candidate can be accepted/rejected by policy metadata alone.

#### How

1. Build separate **video and podcast metadata candidate tables** before any semantic review. Capture title, publisher/show, canonical URL, publish time, duration where applicable, source trust, description, and duplicate fingerprint.
2. Apply deterministic policy filters first: approved/trusted source, freshness window, duration ladder for video, podcast source diversity, maximum one _AI Daily Brief_ selection, URL validity, and duplicate detection.
3. Rank surviving candidates with transparent metadata heuristics (freshness, trusted source, title/description relevance, desired intent coverage) and retain only a small finalist set.
4. Retrieve/deep-review only the top 3–5 video finalists and the minimum podcast finalists needed to verify topical relevance; avoid full transcript/content retrieval unless metadata is insufficient.
5. Cache media metadata independently with ETag/Last-Modified support so the next day's discovery can cheaply revalidate known feeds/channels.
6. Encode acceptance/rejection reasons in the media receipt so a zero/one-slot result can prove bounded discovery without re-running broad search.
7. Keep media semantic work separate from the six-story editorial pass so a media failure or replacement does not invalidate story selection/writing.
8. Measure metadata candidates, deep-reviewed finalists, selected slots, retrieval volume, semantic calls, and media-stage wall time before/after.

**Proof / acceptance:** most media candidates are accepted/rejected deterministically, only a handful receive deep review, the 2-video/2-podcast policies remain satisfied when qualifying media exists, and media repair never forces a Brief rerun.

**Value:** lower retrieval/context cost and faster media fill.

---

### Iteration 9 — Checkpoint/resume and targeted repair architecture

**Objective:** eliminate catastrophic credit waste from full reruns.

Persist durable completion receipts after:

1. acquisition;
2. candidate filtering;
3. evidence compilation;
4. editorial selection/writing;
5. each accepted image;
6. media selection;
7. Watchlist delta;
8. deterministic generation;
9. CI/QA;
10. publication/live verification.

Each checkpoint should include input hashes and dependency hashes so a repair invalidates only downstream stages that actually depend on the changed artifact.

Examples:

- failed image → regenerate only that image;
- broken route → regenerate/validate affected route set, not editorial research;
- media slot failure → rerun media selection only;
- Command Center sync failure → retry sync only;
- Pages deployment failure → retry deployment/live verification, not content generation.

#### How

1. Define a checkpoint schema with `stage_id`, attempt ID, input hash(es), output artifact hash(es), dependency hashes, completion status, timestamp, pipeline version, and repair provenance.
2. Persist checkpoints immediately after each expensive/meaningful stage: acquisition, filtering, evidence, editorial, each image, media, Watchlist, generation, QA, publication, and live verification.
3. Build a dependency graph that states exactly which downstream stages depend on each artifact. Example: changing one image should invalidate page generation/QA for affected routes, not acquisition or editorial selection.
4. On restart or repair, load the latest valid checkpoints, recompute current input hashes, and skip stages whose dependency hashes still match.
5. Make each stage idempotent: rerunning with the same validated inputs should either produce the same artifact or detect/reuse the existing one without creating duplicate publication state.
6. Add targeted repair commands/workflows for common failures (single image, media slot, route set, Command Center sync, Pages deploy) instead of exposing only a full-pipeline rerun.
7. Preserve all failed checkpoints and repair receipts append-only so reliability analysis can distinguish first-pass success from recovered success.
8. Test failure injection at every checkpoint boundary and prove that recovery reruns only the necessary dependency chain.

**Proof / acceptance:** simulated and real failures resume from the last valid checkpoint, unaffected expensive stages are skipped, no duplicate publication artifacts are created, and recovery cost/time is attributable.

**Value:** major reliability gain and potentially very large savings on failure days.

---

### Iteration 10 — Credit budget governor and runaway protection

**Objective:** make exceeding the credit target an explicit controlled exception rather than an invisible outcome.

Implement a policy-driven governor with:

- normal per-stage Work budgets;
- hard deterministic retrieval/context ceilings;
- semantic-call ceilings;
- named escalation reasons;
- early-stop sufficiency checks;
- no automatic full rerun after budget exhaustion;
- pause/escalate state when quality cannot be satisfied within the normal budget;
- owner-visible reason when the run legitimately needs an exception.

The governor must **not** publish a low-quality edition merely to remain under budget.

#### How

1. Convert the provisional credit plan into a **policy-driven budget envelope** with stage-level soft targets and hard structural ceilings (candidate count, retrieval chars, context chars, semantic-call count, retry count).
2. Because exact credits may not be observable in real time, enforce what is observable during the run—calls, context size, retrieval volume, image attempts, retries—and use owner-observed credits after the run to recalibrate those proxy ceilings.
3. Add a running budget state to the attempt receipt: `normal`, `approaching_limit`, `exception_required`, or `halted_for_owner_review`, with the specific stage/reason that caused escalation.
4. Before any extra semantic call, deep-review expansion, generative image retry, or full-stage retry, require a named exception reason and verify that a cheaper deterministic/targeted repair path is unavailable.
5. Prohibit automatic full-pipeline reruns after a budget exception. Resume from checkpoints or stop in a recoverable state when quality cannot be met inside the normal envelope.
6. Distinguish **quality exceptions** from waste: thin-news days, source conflicts, or necessary visual fallback may legitimately exceed the normal budget; repeated orchestration, duplicate retrieval, or avoidable reruns should not.
7. Surface the exception reason and estimated/observed budget impact in the owner Command Center after each run, preserving private credit provenance.
8. Tune budgets over at least three representative production runs; only tighten a ceiling when quality, reliability, and recovery behavior remain stable.

**Proof / acceptance:** normal runs stay inside the defined call/context/retrieval/retry envelope, exceptions are explicit and diagnosable, runaway reruns are prevented, and three representative quality-passing runs eventually demonstrate <100 owner-observed credits.

**Value:** prevents runaway usage and makes exception runs diagnosable.

---

## 10. Reliability optimizations that should accompany the cost work

Cost reduction and reliability should reinforce each other. Prioritize:

- immutable input/output hashes at stage boundaries;
- idempotent publication operations;
- strict UTF-8 and blob integrity checks before PR creation;
- source timeout/circuit-breaker behavior;
- selective retry with backoff rather than broad rescans;
- no repeated polling loops when a webhook/event or one later validation can suffice;
- cached policy/version fingerprints;
- deterministic route manifest and live-route diff;
- append-only incident and correction evidence;
- explicit degraded-mode classification rather than silent substitution;
- rollback by additive revert commits only;
- no weakening of `main` ruleset `23615327`;
- owner authentication for private/administrative Command Center operations while retaining link-accessible read-only viewer behavior.

---

## 11. Provisional wall-time goals

Credit usage is the primary optimization target, but wall time should fall as the same architecture removes repeated work.

These are **experiment targets**, not current guarantees:

| Milestone | Publisher wall-time goal | Condition |
|---|---:|---|
| Near-term | **<30 minutes** | quality gate passes; no major source outage |
| Intermediate | **<20 minutes** | portable cache + deterministic offload + checkpointing active |
| Stretch | **<15 minutes** | high cache reuse and no generative-image recovery loop |

Do not classify a quality-passing run as defective solely because it misses an experiment timing target.

---

## 12. Promotion gates for future optimizations

Every optimization should move through the same sequence:

1. **Implement on a branch.**
2. **Unit/contract test.**
3. **Shadow against immutable production evidence where possible.**
4. **Prove no historical output mutation.**
5. **Measure the target stage before/after.**
6. **Verify zero new Critical/High defects.**
7. **Merge through protected `main` only after required CI passes.**
8. **Run a real production measurement.**
9. **Retain both successful and failed experiment evidence.**

Avoid stacking several unmeasured high-impact changes into the same experiment unless operational necessity requires it; attribution matters if the goal is sustained sub-100 performance.

---

## 13. Recommended priority order after the September 18 data is available

Unless the data shows a different dominant bottleneck, begin in this order:

| Priority | Optimization | Why first |
|---:|---|---|
| **1** | Complete stage/model/context telemetry | enables trustworthy attribution |
| **2** | Verify portable prewarm cache handoff | existing feature can become a daily accelerator once proven |
| **3** | Move deterministic acquisition/QA/publication work out of Work | likely largest structural reduction in Work usage |
| **4** | Durable evidence cache + changed-only semantic review | removes repeated reasoning across days/components |
| **5** | Adaptive early stopping | reduces retrieval and deep-review volume |
| **6** | Editorial context/output compression | reduces the one semantic pass |
| **7** | Deterministic visual promotion where quality passes | attacks image retries/model burden |
| **8** | Media metadata-first hardening | keeps media off semantic path |
| **9** | Full checkpoint/resume dependency graph | prevents expensive failure reruns |
| **10** | Credit budget governor | makes sub-100 the normal enforced operating envelope |

---

## 14. Definition of success

The optimization program is successful when all of the following are true:

### Efficiency

- normal publisher run is **<100 owner-observed Work credits** for at least 3 consecutive representative editions;
- no hidden manual/model work is excluded from the measurement;
- wall time shows sustained material improvement from the September 17 50:19 baseline;
- routine post-editorial validation remains zero-model unless a named exception is required.

### Reliability

- zero unresolved Critical/High defects;
- no routine full reruns;
- failed stages resume from valid checkpoints;
- retrieval/source failures are isolated and selectively retried;
- publication remains atomic and rollback-safe;
- historical editions remain immutable except append-only corrections.

### Quality

- six-story 2/2/2 contract preserved;
- authoritative verification and freshness remain intact;
- visual quality stays at or above the September 17 baseline;
- media handling remains policy-compliant;
- public route/archive/feed/rating/share/accessibility behavior remains correct.

### Security and operations

- protected `main` remains enforced;
- no bypass actors added;
- viewer/owner Command Center access semantics remain intact;
- private owner data is never written to public Git;
- credits/private usage remain provenance-labeled owner observations unless the platform exposes exact attribution.

---

## 15. Post–September 18 revision instructions

After the September 18 Brief completes, update **this same file** rather than creating a disconnected replacement.

Required revision:

1. replace §6 placeholders with the actual run metrics and evidence references;
2. add final September 18 production SHA, attempt ID, CI run and Pages deployment;
3. record the exact owner-observed publisher credits and wall time;
4. explain major workload differences vs September 17;
5. identify the top 3 credit consumers and top 3 wall-time consumers supported by evidence;
6. state whether the quality gate passed;
7. decide whether the prewarm handoff is the next experiment;
8. reorder §9 and §13 based on measured bottlenecks;
9. assign explicit acceptance metrics to the next implementation branch;
10. retain the September 17 and September 18 measurements as immutable comparison anchors.

### Suggested next-session handoff prompt

```text
Continue the Daily Generative AI Brief post–September 18 efficiency program.

Repository: gttome/Daily-AI-Brief
Primary branch: main

Read docs/operations/post-2026-09-18-brief-handoff-and-optimization-roadmap.md first.
Fetch the current main SHA and the complete September 18 publication/validation evidence before proposing or implementing changes.

Update the handoff's September 18 results section with verified metrics, preserving provenance. Compare against the September 17 baseline of 566 owner-observed Work credits and 50:19 wall time.

Then identify the measured dominant Work-credit and wall-time bottlenecks, revise the priority order, and implement only the next approved optimization tranche on a protected implementation branch. Preserve all quality, security, rollback, and historical-output constraints. The long-term target is a sustained normal publisher run below 100 Work credits without reducing Brief quality.
```

---

## 16. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-17 | Promote PR #117 efficiency implementation to production for Sep 18 | final branch verification and protected-main post-merge CI passed |
| 2026-09-17 | Do not auto-schedule acquisition prewarm before first Sep 18 measurement | preserve a clean first production measurement and verify cross-environment cache consumption before making it daily |
| 2026-09-17 | Treat daily prewarm as intended future steady state once handoff is proven | metadata-only prewarm should reduce critical-path acquisition only if publisher actually reuses its cache |
| 2026-09-17 | Set long-term publisher target below 100 Work credits | owner objective; quality remains a hard constraint |

---

## 17. Source-of-truth references

Use these repository sources together with the actual run receipts when revising this handoff:

- `docs/operations/efficiency-operating-policy-2026-09-17.md`
- `docs/operations/efficiency-operating-policy.json`
- `docs/operations/efficiency-assessment-policy.md`
- `docs/operations/publisher-runbook.md`
- `docs/operations/watchlist-runbook.md`
- `.github/workflows/acquisition-prewarm.yml`
- `.github/workflows/daily-delta-validation.yml`
- `.github/workflows/post-editorial-kernel.yml`
- `_tools/prewarm-acquisition.mjs`
- `_generator/lib/research.mjs`

> **Next mandatory revision point:** immediately after the September 18, 2026 Brief publisher and its associated validation evidence are available.
