# Generative AI Professional Series integration policy

Effective: September 16, 2026

## Purpose

The Daily Generative AI Brief uses the Generative AI Professional Series in two distinct ways that must never be mixed:

1. **Reader learning bridge** — a short, visible section under a Brief item when a verified book chapter or section materially helps a reader understand, apply, or contextualize that article, video, or podcast.
2. **Book change proposal** — an internal editorial recommendation that a book should be revised, expanded, or supplied with a new teaching asset. These proposals belong in the Brief Command Center backlog for owner approval or rejection and are not reader-facing content.

## Reader learning bridge

Evaluate every included Brief item: six articles, both included videos, and the included podcast.

Add a reader bridge only when all of the following are true:

- A specific existing book chapter or section is directly relevant to the Brief item.
- The chapter/section locator and title have been verified from the public table of contents or another authoritative book source.
- The bridge explains how that existing material helps the reader understand or apply the Brief item.
- The destination is the verified Leanpub page for that book.

There is no quota. An edition may contain zero to nine reader bridges, with at most one bridge per Brief item. Do not force a book reference merely to promote the series.

Preferred presentation follows the Copilot verification example used in the September 12, 2026 Brief:

- `READ DEEPER · GENERATIVE AI PROFESSIONAL SERIES` or `PUT IT INTO PRACTICE · GENERATIVE AI PROFESSIONAL SERIES`
- Book title
- Exact chapter/section locator and title
- One concise sentence explaining the connection to the Brief item
- `Explore contents & buy the book ↗`

Reader bridges are maintained in `_data/book-reading.json`. They must not contain proposed revisions, internal editorial rationale, owner-specific notes, or approval workflow information.

## Book change proposals

Independently evaluate every included article, video, and podcast for whether the new evidence suggests a material change to a Generative AI Professional Series book.

When a material change is warranted, capture it in the canonical item's `series_implications` metadata. The publication generator converts those implications into `_records/book-change-proposals/YYYY-MM-DD.json` for Brief Command Center ingestion.

Each proposal record contains:

- source Brief item and permanent URL
- book title
- proposed change
- evidence reason
- suggested teaching asset
- stable deduplication key
- initial workflow state `pending_review`

The Brief Command Center owns approval/rejection workflow. Publication does not imply approval. Repeated proposals with the same deduplication key should be grouped rather than creating duplicate backlog work unless later evidence materially changes the proposed revision.

## Public/private separation rule

Reader pages must never display:

- `george_implication`
- proposed book changes
- evidence reasons for proposed revisions
- teaching-asset proposals
- Command Center approval state

The public Brief may show only the verified reader learning bridge described above.

## QA requirements

For every edition beginning September 16, 2026:

- Confirm all included articles, videos, and the podcast were evaluated for a reader bridge and for an internal book-change proposal.
- Confirm each visible reader bridge has a verified book locator and reader-benefit explanation.
- Confirm no visible or hidden reader output contains owner-specific editorial notes or proposed book changes from the current edition.
- Confirm `_records/book-change-proposals/YYYY-MM-DD.json` exists, even when `proposal_count` is zero.
- Confirm the Command Center sync imports new pending proposals, deduplicates them, and preserves prior owner approval/rejection decisions.
