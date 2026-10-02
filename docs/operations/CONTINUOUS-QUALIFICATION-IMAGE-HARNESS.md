# Continuous Qualification Image-Only Harness

## September 28, 2026 — Automated production/qualification image parity

> [!IMPORTANT]
> **Current image policy: `production-image-execution-v2`.** Production and qualification now use the same request builder, execution/receipt contract and production image gate. No owner-created fresh chats, owner image uploads, mandatory manual Library transfers or manual image approvals are part of the new path. This amendment supersedes earlier fresh-worker and Library-exit procedures for new runs only; historical IH/Q evidence remains unchanged.

The automatic sequence is sealed single-story request → native image generation → exact output capture → automated post-generation review → bounded same-story regeneration when needed → exact Git persistence/read-back. Review must be a later phase, not necessarily a different conversation. The explicit payload excludes other stories and operational content; hidden runtime isolation is **not asserted**. Keep all factual, professional-quality, six-image differentiation and exact-byte gates. No Work, Codex or paid-model API use is authorized.

`_generator/lib/image-execution.mjs` is shared by both modes. The qualification builder is a direct alias of the production builder. `_tools/image-execution.mjs` prepares requests and validates actual receipts; request preparation is not generation. Missing native generation/review/transport is `CAPABILITY_BLOCKED`, never an owner-upload workaround. For September 28 editions onward, the combined production image gate requires V2 live execution evidence. Earlier editions retain historical validators.

**Release and proof are distinct:** require protected CI/merge for this change; require actual scheduled native generation, capture, review and exact persistence before declaring the image stage unattended. Adapter fixtures cannot establish production automation. See [Automated image execution](automated-image-execution.md). Preserve Q24's completed components and original cutoff; record the execution amendment without rewriting frozen receipts or allocating Q25 while Q24 is nonterminal.

---


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


## IH6 pre-generation reference-policy correction

IH6 failed closed before image generation because the frozen m02 reference policy was semantically valid for the sealed story packet but did not contain the validator's historical magic substring `no other story`.

Permanent control:

- no-cross-story isolation is enforced structurally by the fixed worker-payload key allowlist, rejection of extra runtime/orchestration/other-story keys, and fresh-worker attestation;
- `reference_policy` remains a required non-empty sealed story field, but validation no longer depends on a particular phrase;
- the frozen policy `Use only frozen evidence phrases above for concrete labels; all other elements must remain generic conceptual symbols.` is accepted verbatim;
- regression coverage proves that harness IDs, parent-conversation state, and explicit other-story context still fail closed when injected as worker payload keys;
- all prior exact-text, mechanism-rich composition, lineage, exact-byte, no-fallback, and zero-cost controls remain unchanged.

IH6 remains immutable terminal evidence. This correction must be merged through protected CI and proved on a fresh harness identity before Q13 can advance.


## IH7 incidental-glyph correction

IH7 proved that exact required labels alone are insufficient if the generator also renders incidental glyph-bearing technical motifs such as code brackets, binary digits, or alert punctuation.

Permanent control:

- outside the exact `allowed_image_text` labels, zero visible alphanumeric or punctuation glyphs are permitted;
- code brackets, slashes, angle brackets, binary digits, numerals, alert punctuation, browser/status text, UI microtext, and glyph-bearing code/data cards are explicitly prohibited;
- code, data, test-input, failure, browser, and status concepts must be represented only with unlabeled abstract geometric forms, lines, shapes, textures, or color regions;
- exact-set text validation remains unchanged and still rejects any rendered string outside `allowed_image_text`;
- all prior subject-lineage, composition, Library handoff, raw-byte, no-fallback, zero-cost, and protected-CI controls remain unchanged.

IH7 remains immutable terminal evidence. This correction must be merged through protected CI and proved on a fresh later harness identity before Q13 can advance.


## IH8 policy-risk rebalance

IH8 proved that the prior image contract had become over-prescriptive: the second attempt solved the extra-glyph class but still failed solely because a clear six-stage left-to-right process matched a categorically prohibited composition form. The owner reviewed the image constraints and directed the system to reduce false-negative risk while preserving factuality, professional quality, artifact integrity, no fallback, and zero-cost requirements.

Revised controls:

- story isolation remains structural and fail-closed on actual inherited/other-story context; brittle free-form attestation wording is not itself a blocker when the sealed payload proves isolation;
- concrete factual claims remain limited to verified evidence, while generic explanatory shapes, metaphors, conventional technical symbols, and editorial devices are allowed when they do not assert unsupported facts;
- `allowed_image_text` is treated as essential story-specific text: essential labels must be present and readable, useful duplicates are allowed, and short generic non-factual headings/descriptors/legends/symbols may appear;
- generic symbolic glyphs such as punctuation, brackets, arrows, or decorative digits do not fail solely because they are outside the essential label set; unsupported factual code, metrics, identifiers, vulnerabilities, filenames, product specifics, or misleading UI still fail;
- professional story-fit composition replaces one mandatory composition archetype. Approved structures include mechanism-rich plates, linear flows, layered architectures, comparisons, taxonomies, annotated systems, and panel-based explanations;
- a central core, multiple layers, and nonlinear feedback are used only when they improve truthful explanation; a genuinely linear story may remain linear;
- card, panel, status-flow, dashboard/system-view, six-panel, and tile forms are judged by professional quality and explanatory value rather than categorically banned;
- density is not required for its own sake; clarity, story specificity, polish, explanatory value, and sufficient meaningful detail are the outcome gates;
- people/human figures may appear when human workflow, review, collaboration, or adoption is materially relevant, while identifiable real-person depiction remains outside this qualification policy unless explicitly supported and intended;
- bounded generation attempts increase from two to four per story, with early stop on a deterministic contract defect;
- the first failed gate remains the official failure cause, but later non-mutating diagnostic review may continue when safe so structural/editorial information is not lost;
- final production still requires six accepted/locked professional images; qualification may advance with exactly one isolated image-remediation lane open when five images are accepted/locked, but publication cannot proceed until the sixth image passes.

No low-quality fallback is introduced. Cross-story contamination remains a hard failure. Exact-byte Library/Git persistence, Work=0, Codex=0, paid API=0, and production_mutation=false remain unchanged during qualification.

IH1-IH8 remain immutable historical evidence. This revised policy must be merged through protected CI and proved on a fresh harness identity.


## IH9 fresh image-only execution correction

IH9 proved that payload sanitization alone is insufficient. The sealed m02 packet and generation instruction were story-specific, but the real image-generation environment still inherited operational context and twice rendered the harness/status subject instead of the frozen GitHub Security Lab Taskflow Agent / AI-powered fuzzing story.

Permanent control:

- every generation attempt must be represented by a `fresh_image_only` execution contract;
- parent/ambient conversation inheritance is explicitly disabled;
- prior messages are required to be an empty array;
- attachments are required to be an empty array so prior generated images or unrelated artifacts cannot enter the generation context;
- the execution object may contain only the fixed generation-execution keys;
- the sealed story packet is rebuilt through the existing story-only allowlist before launch;
- the generation instruction must exactly equal the deterministic instruction derived from that sealed story packet;
- harness identity, Q identity, scheduler/publication/failure state, parent conversation, issue/PR state, review instructions, and other-story context may exist only in orchestration outside the generation environment;
- review must not occur in the generation context; after durable Library capture and worker/context exit, review occurs separately against the raw materialized artifact;
- any executor that cannot guarantee these context-boundary requirements must fail closed before generation rather than attest isolation optimistically.

IH9 remains immutable `TERMINAL_FAIL` evidence. Attempts 3-4 must not be used because the repeated wrong-subject result established a deterministic contract defect. This correction must pass protected CI, merge to protected `main`, and be proved under a fresh later harness identity before Q13 can advance.


## Append-only recovery metadata corrections

An immutable image-attempt receipt is never edited when exact recovered PNG bytes prove that one metadata field is wrong. A recovery-only qualification may add an `image-attempt-metadata-correction-v1` record only when it binds the candidate and attempt, the immutable receipt path and Git blob, the exact original PNG path, byte count, SHA-256 and Git blob, the recorded dimensions, and dimensions read directly from the PNG signature and `IHDR` unsigned 32-bit big-endian width/height fields.

The verifier re-reads the committed receipt copy and original PNG from the qualification commit. It rejects a correction if any receipt identity, original identity, byte count, hash, Git blob, recorded dimension, actual dimension, PNG signature or `IHDR` value differs. The correction is append-only and metadata-only: it cannot modify the receipt or PNG, replace saved-Git review, create owner confirmation, waive the no-Work/no-Codex/no-paid-API boundary, or authorize publication by itself.

For a completed one-time ChatGPT automation, scheduler proof may use a post-completion `automations.peek` observation only when the exact automation ID, conversation ID and one-time schedule match; the task is disabled; `observed_at` is at or after `last_run_time`; and `last_run_time` falls between `DTSTART` and the configured bounded start-delay limit. Recurring controllers must remain enabled.
