# Continuous Qualification Image-Only Harness

**Status:** qualification hardening only  
**Identity:** `2026-09-26-IH1`  
**Production mutation:** prohibited  
**Full Q release:** Q13 remains blocked until this harness passes 6/6.

## Purpose

Prove the image subsystem independently using the frozen Q12 story packets before another full qualification run is released.

## Fixed story order

1. m02
2. m04
3. m06
4. m07
5. m01
6. m08

The harness does not run discovery, editorial selection, Watchlist, media, Professional Series mapping, publication, Pages, or Command Center synchronization.

## Required per-story path

`PACKET_READY -> WORKER_STARTED -> IMAGE_GENERATED -> DURABLE_LIBRARY_CAPTURED -> WORKER_EXITED -> RAW_FILE_MATERIALIZED -> SUBJECT_LINEAGE_PASS -> FACTUAL_SUPPORT_PASS -> STRUCTURAL_QUALITY_PASS -> EDITORIAL_QUALITY_PASS -> EXACT_GIT_BLOB_PERSISTED -> ACCEPTED_LOCKED`

Only one story worker may be active at a time.

## Pre-generation controls

Every attempt requires both:

- a fresh sealed-packet-only worker-context attestation;
- a subject lock cryptographically bound to story ID, candidate ID, headline, source URL and packet SHA-256.

Any inherited operational context, other-story context, reused worker context, alternate subject allowance, or mismatched lock fails closed before generation.

## Exact-byte rule

Generation and durable Library capture occur before worker exit. Review materializes the durable raw file, computes SHA-256 and dimensions, applies subject/factual/structural/editorial gates, then persists the exact reviewed bytes with binary-safe Git blob transport.

No resize, re-encode, edit, redraw, enhancement, transformation or substitution is permitted between review and Git persistence.

## Acceptance

The harness may report PASS only when:

- all six fixed candidates are present in the required order;
- all six are `accepted_locked=true`;
- cross-story contamination count is zero;
- fallback was never used;
- Work usage = 0;
- Codex usage = 0;
- paid API usage = 0;
- production mutation = false.

Only then may fresh Q13 be released.


## IH1 failure and launcher correction

IH1 failed before a valid accepted image because the worker launch itself carried orchestration/runtime language. That made `sealed_story_packet_only` impossible to attest truthfully even when no other story was present.

The permanent correction separates orchestration from generation:

- orchestration may hold harness identity, retry state, scheduler state, branch/record paths, and review instructions;
- the image worker payload is built deterministically from an allowlist of sealed story fields only;
- any extra payload key fails closed before launch;
- the generation instruction is synthesized only from the validated sealed payload;
- harness IDs, Q IDs, scheduler/publication/repair state, parent-conversation fields, and other operational metadata are never copied into the image-generation payload.

This correction does not relax the context gate. It makes the launch boundary testable and prevents the launcher itself from contaminating the image-generation instruction.

The correction must be proved on a fresh harness identity. IH1 remains terminal evidence and must not be reopened.
