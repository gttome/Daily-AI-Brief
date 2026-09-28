# Daily Generative AI Brief freshness policy

## September 28, 2026 — Article policy amendment (`article-24-72-168-v1`)

> [!IMPORTANT]
> This policy applies only after the coordinated change passes protected CI and is merged. A prepared branch or local test is not a release. Historical Q1–Q21 failures and D01–D05 audits remain immutable.

| Publication age at the recorded cutoff | Treatment |
|---|---|
| 0–24 hours inclusive | Primary priority, subject to evidence, relevance, novelty and focus fit |
| Over 24–72 hours inclusive | Normal recency fallback only when qualifying primary items cannot fill that focus |
| Over 72–168 hours inclusive | Extended recency fallback only when newer qualifying items cannot fill that focus |
| Over 168 hours, future or unresolved | Not eligible for a daily article slot |

Shortlist reservation and the nine-candidate evidence plan use freshness-band priority before score. Required focus/Agent Skills reservations remain; there is no rigid recent-story quota. The 24-hour discovery early-stop measure excludes fallback articles. Original publication timestamps are preserved; `dateModified` never creates a new publication date. Every new-policy fallback requires a substantive editorial `fallback_reason`; its `fallback_band` must match its age. Reader labels are **Recency fallback** or **Extended recency fallback**, with the original source timestamp. The coverage statement discloses fallback use.

The explicit `article_freshness_policy` field identifies new-policy artifacts. Missing identity on historical artifacts retains ordinary-72/Skills-168 semantics. Legacy constants, historical Q14/Q15/Q16 reports and older editions are not reinterpreted. The legacy metadata CLI option remains available for regression evidence only, not new runs.

**Verified source paths:** n8n RSS and Notion releases RSS are activated with bounded transport/date-parser evidence. The captured n8n samples and latest captured Notion entry are older than seven days, so activation is not proof of fresh yield. Box and Airtable remain limited by article/date qualification; Make HTTP 403 and Adobe saved-feed HTTP 404 are not operational paths. Google Workspace feed recovery from PR #280 is reused without a duplicate registration. Expired source pins are omitted from live seeding, not deleted from history.

**Unchanged:** six stories in 2/2/2 order, one reusable Agent Skills story, <=20 metadata candidates, nine balanced evidence candidates, <=12,000 model-visible evidence characters, one semantic pass, two verified videos, two source-diverse podcasts, all media freshness/duration rules, professional accepted_locked images, novelty, evidence and nonproduction isolation. No Work, Codex or paid model API invocation is authorized; account billing is unobserved.

**Recovery and acceptance:** commit code, registry, source plan, tests and all living documents in this same change set; run targeted/full tests and protected CI; merge before allocating the next unused Q from live refs and current UTC time. Require an actual matching execution before reporting a Q started. A failed Q is terminal and is followed by a minimal tested correction and a fresh identity. Preserve valid completed stages and do not repeat D05 or PR #280.

**September 28 persistence incident:** the earlier assistant reported local test counts, but the next runtime contained only the baseline workspace and publisher fixtures, not the substantive patch or its test logs. Those old counts cannot certify the recovered implementation. Reconstruct only the missing patch from preserved inputs, persist it before ending the invocation, and attach fresh actual CI evidence. Do not report local-only work as a GitHub release.

---

### Earlier operating record (superseded only for current ARTICLE freshness by the amendment above)


**Effective:** September 16, 2026  
**Status:** Authoritative supplement to `docs/operations/publisher-runbook.md`. Where an older instruction describes article freshness only as a preference or uses a broader undifferentiated research window, this policy controls.

## Articles: primary window first

The six article slots use a rolling **24-hour primary window** measured from the edition's recorded `research_cutoff_at` timestamp.

1. Record `research_cutoff_at` before final article selection. For the normal 07:00 America/Chicago run, use the actual research cutoff reached by that run; do not invent or backdate it.
2. Search, verify, score, and exhaust qualifying primary-window candidates before selecting any older candidate for the same required focus slot.
3. Every selected story dated September 16, 2026 or later must include:
   - `freshness.tier`: `primary` or `fallback`;
   - `freshness.source_published_at`: a verified source/discovery timestamp used for freshness evaluation;
   - `freshness.fallback_reason` when `tier` is `fallback`.
4. A `primary` story must be no more than 24 hours old at `research_cutoff_at`.
5. An ordinary `fallback` story may be used only when no qualifying primary-window candidate survives the existing authority, evidence, novelty, significance, practical-value, and category gates for that required slot. Ordinary fallback age is capped at **72 hours**.
6. The required reusable Agent Skills story retains its already approved exception: if no qualifying primary-window Agent Skills development exists, it may use a fallback up to **168 hours / 7 days** old. It still requires a specific fallback reason.
7. A fallback is never labeled `New development`. Reader-facing reading context must use **Recency fallback**. A material update whose qualifying new evidence occurred inside the primary window may use `Update` and must retain its prior-story lineage.
8. The edition `coverage_period` must state the **24-hour primary window**. If any fallback is selected, it must also disclose recency-fallback use rather than using vague wording such as “fallbacks were used where needed.”

Missing or unverifiable timestamps do not justify claiming primary-window freshness. Resolve the date evidence or choose a different candidate; never invent a publication time.

## Research ordering and stopping

Shared discovery may retain older candidates as bounded fallback leads, but `_generator/lib/research.mjs` must queue primary-window candidates ahead of fallback candidates within every focus area. Older fallback packets do not satisfy the fresh-research sufficiency / early-stop gate.

This rule is intended to prevent a five-day research window from making older material compete as though it were equally fresh. It does not weaken the existing evidence, source-reliability, novelty, 2/2/2 allocation, Agent Skills, media, image, or QA gates.

## Watchlist: rolling topics with daily-change labels

The Emerging AI Watchlist remains a rolling research product. A topic does not disappear merely because no new evidence arrived today.

For every daily refresh, classify each active topic from the canonical dates:

- **New today** — `first_detected` falls on the current `edition_date`.
- **Updated today** — the topic was detected earlier and `updated_at` falls on the current `edition_date` because qualifying evidence or the topic assessment materially changed.
- **Carried forward** — neither condition above is true; the topic remains under observation with its real prior evidence dates.

The public Watchlist must show a **What changed today** summary. When no topic is new or materially updated, say so explicitly and report that existing topics are being carried forward. Do not rewrite old evidence dates to make a carried topic appear new.

The topic's maturity status (`early_signal`, `gaining_evidence`, and so on) remains separate from its daily-change label.

## QA requirements from September 16 onward

Before publication, verify that:

- all six stories have valid freshness metadata;
- no primary story exceeds 24 hours;
- no ordinary fallback exceeds 72 hours;
- no Agent Skills fallback exceeds 168 hours;
- each fallback has a specific reason and visible `Recency fallback` label;
- the edition coverage statement discloses the 24-hour primary window and any fallback use;
- the Watchlist shows New today / Updated today / Carried forward status and a truthful daily-change summary.

A freshness validation failure blocks promotion just like the existing mandatory editorial gates. Preserve the previous verified edition until the defect is corrected.
