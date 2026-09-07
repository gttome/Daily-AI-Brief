# Iteration 3 — Reader Foundation

Status: candidate QA PASS  
Scope: improvements #10, #12 and #13  
Rollback target: `39638bef649813f33b2dd172513164c15dadd83d`

The canonical edition and active 30-day history now generate permanent story pages, story-specific title/description/image front matter, a seven-dimension archive search index, an accessible search/filter interface, Atom, and JSON Feed 1.1. Existing homepage, archive, dated-brief, dated-QA, image, and share-control routes remain unchanged.

The archive retains a static chronological fallback when JavaScript or the index is unavailable. Search is client-side and sends no query text to a service. Mobile controls use a single-column layout below 640px and retain 44px input targets.

Acceptance evidence is recorded in `qa-results.json`; final GitHub/Jekyll and production route evidence is completed during Iteration 6 and Gate 7.
