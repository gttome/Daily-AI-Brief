# Podcast publishing — publisher and QA requirements

Effective for new editions beginning September 18, 2026, target **two qualifying podcasts per edition when two qualifying selections are available**. Editions from September 10–17 retain their historical single-podcast contract and must not be rewritten merely to adopt this policy. No podcast-duration ceiling applies, including video versions of podcasts.

Preserve the six-article 2/2/2 allocation, required Agent Skills coverage, video policy, schedules, privacy controls, visual-quality baseline, and protected editorial-learning criteria.

## Selection and freshness

Read `_data/podcast-sources.json` and `docs/podcasts/source-research.md`. Search approved core audience sources and use technical fallbacks when no suitably strong knowledge-worker/non-technical episode qualifies. Search publisher notes, official YouTube, Apple Podcasts, Spotify, verified publisher-linked RSS, and other approved source-registry destinations. Do not invent episode links.

Strongly prioritize the preceding **48 hours**, preferably the previous calendar day or two in America/Chicago. Evaluate worthwhile verified episodes across all focus areas inside that window before considering older episodes. A somewhat better audience fit alone does not justify an older selection. Only when a second worthwhile relevant verified episode does not qualify inside 48 hours may discovery expand to **seven days**, then **30 days as an exceptional last resort**. Every older selection must record the date, expanded window, and specific freshness-exception reason. Relevance and evidence remain hard gates.

## Two-podcast diversity rule

- Target two qualifying selections when available.
- **No more than one** selection per edition may be from _The AI Daily Brief_.
- Never publish two episodes from the same show/source in one edition.
- _The AI Daily Brief_ receives no reserved slot.
- When two podcasts are published, they must come from two different approved shows/sources.
- If only one qualifying episode exists after the bounded search, publish one and record the evidence-backed shortfall privately.
- If none qualifies, publish the fixed reader-facing empty-state sentence: `No podcast met today’s editorial quality standards.`

Record candidates and inclusion/rejection rationales under `_records/editorial/podcasts/YYYY-MM-DD.json`. Compare episodes with prior 30-day podcast records, the six stories, and both video slots; normalize URLs and match episode identity across platforms. Never include the same episode as both video and podcast. Check publisher title, show, date, actual substantive notes/transcript/audio, direct links, practical fit, and material factual claims. Attribute practitioner opinions. Avoid promotional filler. Detailed search, retrieval, verification, rejection, retry, source-coverage, HTTP, date/runtime mismatch, and fallback diagnostics remain private editorial/QA evidence.

## Canonical representation

For editions beginning September 18, 2026, `podcasts` is the canonical collection and contains zero, one, or two included podcast items. Each included podcast has its own stable item ID, ordinal, permanent URL, focus, topics, publication date, show, host/guest, summary, rationale, verification and coverage notes, source URL, and verified platform links. Ordinals follow the two video slots: the first podcast is 9 and the second is 10. Exact runtime may be null when unknown; positive runtimes have no upper bound.

The legacy singular `podcast` field remains valid for historical editions and compatibility reads. New code must normalize both representations without duplicating a podcast that appears in the compatibility field and the canonical collection.

Regenerate homepage, latest, dated brief, permanent podcast pages, archive, feeds and trend records. Preserve previous pages and IDs. In the same atomic candidate include the podcast search record and all permanent podcast pages when included. Do not overwrite old editions to pretend they contained two podcasts.

## QA

QA must count only actually included media. When all six articles, two videos, and two podcasts are included, verify **10 rating groups / 50 native star controls** across edition surfaces and five stars on each permanent podcast page. With one podcast, verify nine groups / 45 controls. Verify one Share initiation per click, canonical podcast URLs without sender ratings, identical stable IDs across surfaces, podcast analytics and Command Center coverage, backward compatibility, and Home navigation.

For an empty podcast collection, QA must verify the exact fixed public sentence and verify that detailed diagnostics remain confined to private editorial/QA evidence. Keep six-article learning sufficiency independent of podcast/video ratings. Publication success still requires deterministic gates, atomic publication, Pages verification, and the permanent QA trail.
