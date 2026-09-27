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


## IH3 factual-support text correction

IH3 proved that correct subject lineage and isolated generation are still insufficient when the generator invents explanatory prose inside the image.

Permanent control:

- every sealed story packet now carries an explicit `allowed_image_text` array;
- labels are bounded, concise, unique strings rather than prose;
- the generation instruction states that only those exact strings may be visibly rendered;
- the headline is context-only unless explicitly allowlisted;
- captions, summaries, sentences, examples, UI text, and other generated prose are prohibited;
- review records the visible text strings and deterministic validation rejects any rendered string not present in `allowed_image_text`;
- a text-policy failure is a factual-support failure and cannot be repaired by editing the generated image.

IH3 remains terminal evidence. This correction must be tested on a fresh harness identity before Q13 can be released.


## IH4 editorial-composition correction

IH4 proved the current lineage, factual-support, visible-text allowlist, durable Library capture, raw-byte materialization, structural-quality, no-fallback, and zero-cost controls. Both bounded m02 attempts still failed editorial quality because they converged on sparse six-card/icon-panel flows rather than the required professional high-detail textbook/editorial mechanism composition.

Permanent control:

- every sealed image-worker packet requires `composition_mode = mechanism_rich_textbook_plate`;
- the generated plate must contain a central mechanism or process core;
- the composition must use multiple interacting visual layers;
- causal or functional relationships must extend beyond one straight left-to-right arrow chain;
- dense but readable hierarchy is required;
- `card_grid`, `dashboard`, `status_flow`, and `six_panel_icon_strip` are mandatory prohibited patterns;
- isolated icon panels, sparse tile layouts, and simple linear status-chain compositions are explicitly prohibited;
- composition density may not be achieved by adding text outside `allowed_image_text`;
- all prior isolation, subject-lineage, factual-support, exact-text, artifact-routing, exact-byte, bounded-retry, no-fallback, and review-order controls remain unchanged.

IH4 remains terminal evidence and is not repaired or rerun. The correction must be proved on fresh harness identity `2026-09-26-IH5`, starting with m02 only. Q13 remains blocked until a later six-story harness reaches 6/6 `accepted_locked` with zero cross-story contamination, no fallback, Work=0, Codex=0, paid API=0, and production mutation=false.


## IH5 visible-text completeness correction

IH5 proved that allowlisting rendered text as a subset was insufficient: a generated image could omit one required label while still containing no disallowed strings.

Permanent control:

- rendered text must equal the complete `allowed_image_text` set;
- every required label must appear exactly once;
- missing labels fail closed;
- duplicate labels fail closed;
- extra or altered labels fail closed;
- the generation instruction explicitly requires complete exact-set coverage before factual-support PASS;
- this correction does not relax lineage, composition, structural, editorial, exact-byte, no-fallback, or zero-cost controls.

IH5 remains immutable terminal evidence. The correction must be proved on fresh harness identity `2026-09-26-IH6`. Q13 remains blocked until a later six-story harness reaches 6/6 `accepted_locked`.
