# Daily AI Brief Improvement Kanban

**Purpose:** Persistent system-improvement, technical-debt, validation and UX backlog. This board is separate from the per-edition Tasks 00–29 production Kanban.

**Canonical data:** `data/operations/improvement-kanban.json`  
**Visual interface:** `improvement-kanban/index.html`  
**Initial observation:** 2026-10-02T22:50:35-05:00

## Capture rules

1. Add a card when a living document, operational-learning event, owner decision, current production state or verified run outcome creates unresolved future work.
2. Every card carries source references and acceptance criteria.
3. Do not revive a `permanently_fixed` or superseded incident unless new evidence demonstrates a regression.
4. Backlog → WIP → Done is authoritative for improvement work. Per-edition production tasks remain on their own 00–29 Kanban.
5. When the owner asks for the Kanban, refresh the canonical JSON against the designated living sources, preserve explicit lane choices, and render a PNG using the approved navy dashboard style with Backlog, WIP and Done plus bottom panels for Improvement Pipeline / Brief Readiness, Repository / Isolation, Controller / Liveness, Current Risk and Next Action.
6. Temporary run-specific safety wording must eventually be generalized or retired. The first explicit long-term item is `DAB-KB-001`: replace Run 5-specific terminal protection with a generic immutable-terminal-run rule after the October 3 production transition is safely established.

## HTML5 editing model

The HTML5 board supports add/edit, drag/drop lane movement, local browser persistence, JSON import/export and reset-to-canonical. It intentionally does **not** embed GitHub credentials. Exported JSON can be reviewed and committed through the existing authenticated GitHub workflow.

## Initial board counts

- Backlog: 18
- WIP: 2
- Done: 8
- Total cards: 28
