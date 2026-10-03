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
