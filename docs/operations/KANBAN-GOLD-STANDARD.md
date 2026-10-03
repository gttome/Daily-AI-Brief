# Daily AI Brief Kanban Gold Standard

## Canonical visual example

The October 3, 2026 Run 7 Kanban approved by the owner is the **single canonical visual example** for all future Daily Generative AI Brief Kanban PNGs.

![Canonical Daily AI Brief Kanban](../../_records/edition-execution/status/kanban-gold-standard-2026-10-03.png)

## Required format

Future Kanban renderings must follow this example's information architecture and visual hierarchy while using current durable run data rather than copying historical values.

- Header: edition date, run number, current CT time, and overall progress.
- Columns are exactly **Backlog → WIP → Done**. Never add a Current column.
- Show every Task 00–29. The active task belongs in WIP.
- Every task displays its authoritative duration; use `unavailable` when event evidence cannot support one. Never invent estimated or elapsed values from appearance alone.
- Display total Brief elapsed time from the authoritative append-only timing projection.
- Right-side operational panels: Run Information, Edition Completion, Content Targets, and Key Notes.
- Bottom operational panels: Recent Activity, Upcoming Tasks, **Current Risk**, and **Next Action**.
- Preserve the clean high-resolution professional dashboard treatment: dark navy header, restrained status colors, dense but readable cards, strong hierarchy, and no decorative imagery.
- Current Risk and Next Action must be explicit even when risk is “No active blockers.”
- Content Targets must expose the six-story 2/2/2 allocation, exactly one Agent Skills story, two videos, two source-diverse podcasts, Watchlist status, and six-image status.
- Repository/deployment evidence must distinguish production main, CI, Pages, delta validation, publication PR, live edition, and PUBLIC_CLOSED state.

## Task 00 requirement

Task 00 Production Readiness Validation must load this gold-standard specification before any run status/Kanban rendering. It must verify that the current Kanban renderer/projection can produce this required structure from authoritative append-only transition evidence. A future Kanban request should use this example by default unless the owner explicitly requests another format.

## Learning

Owner feedback on 2026-10-03: this is the best Daily AI Brief Kanban produced to date and is the one example to always follow. Treat that approval as a durable presentation requirement, not a run-specific preference.

## Measurement-only rule

Kanban metrics and projections are **observability only**. They measure and display the production system; they never control, gate, block, pause, retry, stop, authorize, or change production task state for any reason. A stale/missing/contradictory Kanban projection is a telemetry defect only. Task state comes exclusively from authoritative execution contracts and append-only transition evidence. If Kanban disagrees with those sources, the Kanban must be reprojected from the authoritative evidence while production continues unaffected. No task may be shown as Blocked solely because of a Kanban metric, duration, freshness threshold, projection age, visualization state, or Kanban contract failure.
