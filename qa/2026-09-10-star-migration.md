# Star-rating migration QA — September 10 transition

Result: implementation published; automated and isolated browser checks passed. Live read-only reconciliation passed.

## Published revisions
- Daily AI Brief: da860c40a6ac6a253dbd4a3a2d3ffecc8c4961cc
- Ratings service: 2e34a58c6459465320c1b5d606587e12e1a3c079 (Site version 8)
- Command Center: 5d164733c3fba4b4b4bd1af56e714788ff799ab4 (Site version 18)

## Verified source and live results
- September 10 source contained exactly seven Most useful ratings: six articles and one podcast.
- Existing counters were not rewritten. Read-time normalization yields 7 ratings, 5.00 stars, seven 5-star equivalents, and zero other star buckets.
- The live Command Center adapter retrieved all seven included items successfully: 6 articles, 1 podcast, 7 share initiations, 7 original Most useful counters.
- The two empty video slots remain visible with reasons and Not applicable rating/share cells.
- The public September 10 page displayed seven aggregate summaries of 5.00 stars / 1 rating and seven five-star controls.
- Original legacy response keys remain preserved; no copied migration records or new production test ratings were created.
- Mapping: most_useful=5, useful=4, neutral=3, not_useful=1. Native numeric keys remain unchanged.
- September 9 and earlier brief/story source files, image bytes, permanent URLs, and share implementation were unchanged by this release.
- Existing browser selections map for display without resubmission; pending legacy retries retain their original payload and operation identifier.

## Validation
- 69 publisher regression tests passed.
- 23 Command Center regression tests passed.
- 15 schema-contract cases passed; Command Center static accessibility/security audit passed.
- Mixed legacy/native normalization, weighted average 13/3, empty-data average null, provenance counts, and seven-rating transition assertions passed.
- September 9/10/11 renderer-boundary checks passed for articles, included videos, and podcasts.
- Isolated browser: each of five stars submitted exactly once, Enter selected a star, successful submission disabled further voting, and reload preserved all five selections with zero additional submissions.
- Browser inspection of actual star CSS at a 340px content width passed.
- The real Command Center renderer was inspected in an isolated preview using analytics retrieved from its live authenticated proxy; seven rated items and two empty slots rendered correctly.
- Both Sites deployments reached succeeded status. GitHub published the updated dated brief.
- Public summaries expose aggregate usefulness only; owner API additionally exposes original aggregate counters.

## Scope and remaining limitations
Browser submission checks used isolated mocked transport, avoiding fabricated production reader feedback. Live production verification was read-only. Owner-only production pages cannot be opened by this environment's cloud browser; the deployed private data proxy was verified directly and the renderer was checked in preview. A full production write-cycle test and physical-device touch test were not performed.

The Command Center's pre-existing historical editorial-learning evidence migration remains unavailable/pending; this release does not activate editorial weighting or claim that missing evidence is zero.

Future publishing uses the date-gated native star renderer automatically. No recurring automation or article selection was replaced.
