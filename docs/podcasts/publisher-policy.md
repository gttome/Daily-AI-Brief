# Podcast slot 9 — publisher and QA requirements

Effective for new editions beginning September 10, 2026. The September 9 edition is the launch example.

After six articles and two Worth Watching video slots, publish Worth Listening — Podcast as slot 9. Select exactly one qualifying episode; no duration ceiling applies, including video versions of podcasts. Preserve current article allocation, required Agent Skills coverage, video limits, schedules, privacy controls, and protected editorial learning criteria.

Read `_data/podcast-sources.json` and `docs/podcasts/source-research.md`. Always check The AI Daily Brief website, official YouTube channel, and podcast-platform listings. Search all core audience sources; use technical fallbacks if no suitably strong knowledge-worker/non-technical episode qualifies. Search publisher notes, official YouTube, Apple Podcasts, Spotify, and verified publisher-linked RSS. Do not invent episode links. Prefer 24 hours, then seven days, then 30 days with the window disclosed.

Record candidates and inclusion/rejection rationales under `_records/editorial/podcasts/YYYY-MM-DD.json`. Compare the episode with prior 30-day podcast records, six stories, and both video slots; normalize URLs and match episode identity across platforms. Never include the same episode as both video and podcast. Check publisher title, show, date, actual substantive notes/transcript/audio, direct links, practical fit, and material factual claims. Attribute practitioner opinions. Avoid promotional filler. If no episode passes after broad search, record a visible empty-slot explanation and candidate evidence.

Use the canonical `podcast` field. Included episodes require the active schema's stable item ID, ordinal 9, permanent URL, focus, topics, date, show, host, summary, rationale, verification and coverage notes, and verified platform links. Exact runtime may be null when unknown; positive runtimes have no upper bound. One episode has one stable ID for all platform destinations.

Regenerate homepage, latest, dated brief, permanent podcast page, archive, feeds and trend records. Preserve previous pages and IDs. In the same atomic candidate include the podcast search record and permanent page when included. Do not overwrite old editions to pretend they contained podcasts.

QA must verify nine rating groups/36 controls when all nine items are included, four controls on the permanent podcast page, one Share initiation per click, canonical podcast URLs without sender ratings, identical share IDs across surfaces, podcast analytics and Command Center coverage, backward compatibility, and Home navigation. Count only actually included media when slots have evidence-based exceptions. Keep six-article learning sufficiency independent of podcast/video ratings. Publication success still requires CI, atomic merge, Pages verification, and the permanent QA trail.
