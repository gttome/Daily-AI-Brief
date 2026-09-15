# Generative AI Professional Series integration policy

Effective: September 16, 2026

## Purpose

The Daily Generative AI Brief uses the Generative AI Professional Series in two distinct ways that must never be mixed:

1. **Reader learning bridge** — a short, visible section under a Brief item when a verified book chapter or section materially helps a reader understand, apply, or contextualize that article, video, or podcast.
2. **Book change proposal** — an owner-only editorial recommendation that a book should be revised, expanded, or supplied with a new teaching asset. These proposals belong only in the private Brief Command Center backlog for owner approval or rejection and are not reader-facing content or public-repository output.

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

Book-change evaluation is an owner-only Command Center workflow. The 09:00 validation/synchronization task reviews the completed edition and its source evidence, creates a proposal only when the evidence warrants a material book change, deduplicates it against the existing private backlog, and stores it directly in the Brief Command Center. Do not create a public `_records/book-change-proposals/` file or any other public-repository proposal queue.

Each private proposal should retain:

- source Brief date
- source item type, title, and permanent URL
- book title
- proposed change
- evidence reason
- suggested teaching asset when useful
- stable deduplication identity
- initial workflow state `Pending review`

The Brief Command Center owns approval/rejection workflow. Publication does not imply approval. Repeated proposals for the same underlying change should be grouped rather than creating duplicate backlog work unless later evidence materially changes the recommendation.

For historical recovery, the Command Center sync may use existing canonical `series_implications` from September 12–15, 2026 as evidence for backfill. This is a one-time recovery path, not the forward storage design.

## Public/private separation rule

Reader pages must never display, visibly or in hidden markup:

- `george_implication`
- proposed book changes
- evidence reasons for proposed revisions
- teaching-asset proposals
- Command Center approval state

The public Brief may show only the verified reader learning bridge described above.

## QA requirements

For every edition beginning September 16, 2026:

- Confirm all included articles, videos, and the podcast were evaluated for a reader bridge.
- Confirm each visible reader bridge has a verified book locator and reader-benefit explanation.
- Confirm no visible or hidden reader output contains owner-specific editorial notes or proposed book changes from the current edition.
- Confirm the owner-only Command Center sync evaluated all included items for possible book changes.
- Confirm new proposals were deduplicated and imported into the private backlog without resetting prior owner approval/rejection decisions.
- Confirm no public proposal-backlog artifact was created.
