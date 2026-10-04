# Refactoring implementation status

September 10, 2026. Approved scope: implement and test the Plus-only assessment, then run and verify actual outputs.

| Area | Implementation |
|---|---|
| Image gate | Final PNG hashes, canvas, per-story/set approval and differentiated composition evidence required by central integration validation |
| Release | Canonical and binary assets included before digest; typed release manifest; one PR path; no dispatch direct-main update |
| QA | Historical failed records accepted as evidence; 30-day calendar window; regression fixtures for tampered images and failed/recovered runs |
| Privacy/feedback | Existing service protects rating GET and returns only public share totals; per-action transactional receipts replace cross-reader time suppression |
| Command Center | Same owner-only Site; private server transport, revision-pinned repository records, missing/partial states, historical video index and usage tables |
| Plus usage | Private immutable attempt records, native units, unavailable credits; same-edition recovery evidence kept separate from unknown earlier usage |
| Automation | Current runbook, Plus-only resource semantics; read-only GitHub freshness workflow replaces public analytics writer |
| Capacity | Preserve premium image quality and old paths; measure current asset growth; no paid object-store migration or branch deletion in this release |

## Outstanding constraints

- Automatic approval review blocked uploading historical analytics and feedback snapshots to the existing ratings service database, requesting explicit authorization of that sensitive payload and destination. The migration is stopped. New public aggregate writes are stopped; prior Git history still contains previously published aggregates. Do not claim complete historical privacy migration.
- No exposed authenticated GitHub administrative operation was established for enforcing main branch protection. PR-only workflows and exact-head checks are implemented; required-check enforcement at the repository settings level remains an owner/admin action unless authorized access becomes available.
- Exact Plus credits per edition are not exposed to this workflow; show Unavailable and measured effort rather than estimates labeled as charges.
- Uninterrupted publication during Plus exhaustion is not possible when mandatory research or images remain incomplete. Prior live content keeps its original date.
- Additional object storage, destruction of branches/data and the separate Sites Command Center remain outside this release.

## Rollback

Restore a verified public release through a PR. Preserve the private service's authorization boundary, original database totals, operation receipts and usage observations. Disable a faulty collector or retry trigger without deleting its evidence. Restore a compatible Command Center renderer, not an old public aggregate reader. Keep the original September 10 recovery evidence and all canonical item IDs and URLs.

<!-- oct4-current-hardening-status -->
## October 4, 2026 post-close hardening status

Run 8 and its post-close reader corrections leave these current high-priority items:

| Priority | Area | Status |
|---|---|---|
| P0 | Strategy Interrupt / meta-diagnostic escalation | Open — DAB-KB-033 |
| P0 | Deterministic compact health polling / lower ChatGPT polling usage | Open — DAB-KB-034 |
| P0 | Story-only native-image execution context | Open — DAB-KB-035 |
| P0 | Task 29 complete incident inventory | Open — DAB-KB-036 |
| P0 | Semantic reader parity before PUBLIC_CLOSED | Open — DAB-KB-037 |
| P0 | Normal 19:00 controller start proof | Open — DAB-KB-040 |
| P1 | Recovered-task timing integrity | Open — DAB-KB-038 |
| P1 | Typed handoffs / workflow-script and repository-context hardening | Open — DAB-KB-039 |
| P1 | Capability-aware executor routing | Open — DAB-KB-041 |
| P1 | Frozen historical contract migration | Done — DAB-KB-042 |
| P1 | October 4 reader parity repair | Done — DAB-KB-043 |

Canonical details live in `OCT4-RUN-INCIDENT-RECONCILIATION-2026-10-04.md` and the operational-learning ledger.
