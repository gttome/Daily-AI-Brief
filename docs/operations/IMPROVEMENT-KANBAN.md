# Daily AI Brief Improvement Kanban

**Purpose:** Persistent system-improvement, technical-debt, validation and UX backlog, separate from the per-edition Tasks 00–29 production Kanban.

**Canonical data:** `data/operations/improvement-kanban.json`

## Capture and reconciliation rules

1. Add a card when a living document, operational-learning event, owner decision or verified production outcome creates unresolved future work.
2. Every card carries source references and acceptance criteria.
3. Do not revive a `permanently_fixed` or superseded incident unless new evidence demonstrates regression.
4. Backlog → WIP → Done is the visual lane order. Per-edition production tasks remain on their own production Kanban.
5. Automated reconciliation uses `_generator/lib/improvement-kanban.mjs` and the canonical operational-learning ledger.
6. Reconciliation annotates resolved source problems and surfaces unresolved ledger problems missing from the board; it **never silently moves a card between lanes**.
7. Current production instructions are generic. Historical execution names belong only in historical evidence, not current instruction text.
8. When the owner asks for a Kanban PNG, use the canonical Daily Brief Kanban visual standard and current durable evidence.

## UI direction

The canonical repository JSON is the source for future visual editing. A browser or ChatGPT Site interface may edit/export board state, but it must not embed repository credentials or become production control authority.

## Production boundary

This board records improvements. It cannot block publication, change a task state, consume retry budget, authorize a worker, or reopen a terminal execution.

<!-- oct4-improvement-cards -->
## October 4 post-close reconciliation

Run 8 added Improvement Kanban cards **DAB-KB-033 through DAB-KB-043**. The highest-priority open items are:

- DAB-KB-033 — automatic Strategy Interrupt / meta-diagnostic escalation;
- DAB-KB-034 — deterministic compact health polling instead of heavyweight ChatGPT polling;
- DAB-KB-035 — isolated story-only native-image generation context;
- DAB-KB-036 — complete Task 29 incident inventory before learning certification;
- DAB-KB-037 — semantic reader parity before PUBLIC_CLOSED;
- DAB-KB-040 — prove normal 19:00 controller start and alert on missed allocation.

DAB-KB-042 and DAB-KB-043 are Done because the frozen-contract migration and October 4 reader repairs are already protected and deployed. Open cards must not be marked Done merely because Run 8 eventually closed.
