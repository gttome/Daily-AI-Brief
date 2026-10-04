# Daily AI Brief Kanban Gold Standard

## Canonical visual standard

Use the owner-approved October 3, 2026 Kanban **information architecture and visual hierarchy** as the standard for future Daily Generative AI Brief Kanban PNGs. The standard is generic: current values always come from the current execution's authoritative evidence; never copy a historical execution identity or historical task values into a new Kanban.

## Required format

- Header: edition date, current CT time and overall progress. Use the current execution identifier only when status context genuinely requires it; do not hard-code historical run names.
- Columns are exactly **Backlog → WIP → Done**. Never add a Current column.
- Show every Task 00–29. The active task belongs in WIP.
- Every task displays its authoritative duration; use `unavailable` when event evidence cannot support one.
- Display total Brief elapsed time from authoritative append-only timing evidence.
- Right-side operational panels: Execution Information, Edition Completion, Content Targets, and Key Notes.
- Bottom operational panels: Recent Activity, Upcoming Tasks, **Current Risk**, and **Next Action**.
- Use the clean high-resolution professional dashboard treatment: dark navy header, restrained status colors, dense but readable cards, strong hierarchy, and no decorative imagery.
- Current Risk and Next Action are explicit even when there is no active blocker.
- Content Targets expose the six-story 2/2/2 allocation, exactly one Agent Skills story, two videos, two source-diverse podcasts, Watchlist status, article reading-time readiness, podcast runtime readiness, and six-image status.
- Repository/deployment evidence distinguishes protected main, CI, Pages, validation, publication PR, live edition and `PUBLIC_CLOSED`.

## Task 00 requirement

Task 00 loads this specification before a Kanban/status rendering and verifies the renderer can derive the required structure from append-only transition evidence.

## Measurement-only invariant

Kanban metrics and projections are **observability only**. They measure and display the production system; they never control, gate, block, pause, retry, stop, authorize, consume retry budget, create a worker, or change production task state.

A stale, missing or contradictory Kanban is a telemetry defect only. Authoritative task state comes from execution contracts and append-only transition evidence. Reproject the Kanban separately while production continues from authoritative state.

<!-- oct4-timing-integrity -->
## October 4 timing integrity amendment

Run 8 exposed a timing-projection defect: recovered/bulk-closeout Tasks 23–29 were shown as `0s`, while Task 17 was effectively near-zero/unavailable despite meaningful orchestration around those boundaries.

The gold standard therefore requires:

- never infer `0s` merely because `entered_backlog_at` and `done_at` were written by the same terminal-closeout reconciliation;
- when authoritative start evidence is missing, display **unavailable**, not zero;
- where recovery events provide a trustworthy active/recovery interval, preserve that elapsed evidence rather than replacing it with closeout bookkeeping;
- timing defects remain observability-only and never reopen a completed production task.

Tracked by DAB-OPS-20261002-021 recurrence / DAB-KB-038.
