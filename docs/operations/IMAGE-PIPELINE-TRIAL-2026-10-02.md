# Image pipeline replacement and six-image trial

The interactive image lane produced six visually reviewed, recoverable 1200×630 PNGs in **10m 33.475s** from the first generation request to the last exact Git tree verification. This excludes implementation, later recovery verification, and protected CI. The image stage ran October 1, 2026, 11:47:44–11:58:18 PM America/Chicago.

**Development trial completed. Unattended production capability remains blocked.** This was an explicitly authorized interactive Work/Codex conversation using the built-in image tool. It is not evidence of zero Work usage, zero billed credits, or scheduled execution. No paid API adapter, alternate account, new credentials, or full Brief production run was used. Billing was not observed.

## Measured results

| Story mechanism | Generation calls | Total generation | First request to reviewed files saved in Git |
|---|---:|---:|---:|
| Claude on AWS / identity boundary (m03) | 1 | 45.184s | 2m 24.142s |
| Gemini / long-horizon workflow (m01) | 1 | 41.228s | 1m 10.030s |
| Contextual bandit / feedback loop (m04) | 2 | 75.045s | 2m 38.769s |
| Nova / policy adaptation (m05) | 1 | 40.180s | 1m 14.076s |
| Reusable Business Skill (m08) | 1 | 37.221s | 1m 04.311s |
| Dots / continuing responsibility (m07) | 1 | 38.215s | 1m 08.383s |

Seven generation/edit calls totaled **4m 37.073s**. Five of six images passed first review. The first contextual-bandit image contained a prohibited person silhouette; its saved review says REJECT. One targeted image edit replaced only that icon. The rejected source, delivery image, prompt and review remain preserved. No transfer problem caused regeneration.

The first image includes 64 seconds between capture and review while the reusable review/transfer helper was installed. Subsequent capture delays were approximately two seconds. Git upload and committed-tree verification, measured from review completion, took approximately 11–13 seconds per accepted image. The wall total includes correction preparation and intervals between images; these delays are not removed from the result. These measurements are a baseline, not a guaranteed service-level commitment.

## What changed

- Retired the hard-coded Pillow drawing/self-approval implementation in `_tools/native-image-worker.py`. All six image task IDs now return a durable, idempotent capability blocker when invoked on the unsupported Actions host. Completed tasks are preserved. The worker never draws a replacement, declares visual PASS, or creates a Done event.
- Added hash-bound visual observations: subject, mechanism detail, label legibility, contrast, composition, absence of people, and absence of overlap. A renderer's `saved_asset_reviewed: true` is insufficient. The reviewer is explicitly the conversation assistant inspecting saved pixels, not a claimed separate independent service.
- Applied the stronger live-review contract to images generated on or after the owner's authorization at `2026-10-02T04:42:19Z`. Historical closed receipts keep their original contract. New recoverable jobs stop at review if observations are absent, preserving captured source bytes.
- Reused the existing durable image operation engine and Git Data transfer approach. Existing crash/acknowledgement-loss tests prove persistence resumes without repeating generation or review. No additional supervisor or scheduler was created.
- Added a small development harness, `_tools/image-trial.mjs`, to retain capture, review, persistence and measured timing evidence. It cannot generate images, inspect pixels, or authorize production itself.
- Added a scheduled-host admission requirement to Task 00. Interactive trial evidence cannot satisfy it. Receipt fields require trusted host evidence; they are not an attestation service or proof merely because they are populated.
- Corrected the earlier operational-learning conclusion about the deterministic native worker using append-only events 32–35. Run 4 closure and its historical ledger digest remain intact.

## Repeatable host procedure

1. Read the cumulative learning ledger and one sealed story specification. Store the exact prompt. Use the built-in image tool on the capable interactive host. Record actual call start/end times.
2. Immediately preserve the tool's original PNG. Normalize to 1200×630 before review; do not quantize its palette to solve transfer limits.
3. Run `node _tools/image-trial.mjs capture --candidate ID --raw SOURCE --final FINAL --prompt PROMPT --started ISO --ended ISO --artifact TOOL_ARTIFACT`. Use `--root` for a distinct trial directory. Capture refuses to overwrite existing records: resume saved work.
4. Open the saved final PNG with the host's image-viewing tool. Record actual observations and the final SHA256 in an evidence JSON. Run `review --candidate ID --evidence JSON`. The harness validates the evidence shape but does not perform the visual judgment.
5. Transfer complete original and final files via Git Data `create_blob` with Base64. If the execution bridge needs bounded chunks, assemble the exact Base64 payload before calling the connector; do not compress away quality. Match locally computed Git blob SHAs, create a tree/commit on the isolated branch, update its ref without force, and fetch the tree to verify both bindings.
6. Run `verify --candidate ID --persistence JSON` with the observed raw/final blob SHAs, immutable commit, verification timestamp and tree-binding result. Retain receipt checkpoints. Transfer interruption resumes from captured files; image-quality rejection alone permits a targeted image edit or new generation.
7. Inspect the six-image set for subject and composition differentiation. Run `summary` only after six individual reviews and saved-file identities pass. All retries and waiting remain in the report. Batch shared release metadata and protected CI after image acceptance; no per-image full-repository CI.

## Evidence and recovery

[Machine timing summary](../../_records/image-trials/2026-10-02-six-image/summary.json) · [Git recovery verification](../../_records/image-trials/2026-10-02-six-image/recovery-check.json)

All 12 accepted original/final files were independently re-read from fetched Git objects and matched their recorded SHA256 hashes with **zero new generation calls**. Protected CI is required before this change merges. Local full suite: 755 tests passed. Existing production reader content, six live images, active-run pointer, and Run 4 closure were unchanged by this trial.

| Trial image | Source and review evidence |
|---|---|
| [Claude / AWS image](../../_records/image-trials/2026-10-02-six-image/m03/final.png) | [Directory](../../_records/image-trials/2026-10-02-six-image/m03) |
| [Gemini image](../../_records/image-trials/2026-10-02-six-image/m01/final.png) | [Directory](../../_records/image-trials/2026-10-02-six-image/m01) |
| [Contextual-bandit image](../../_records/image-trials/2026-10-02-six-image/m04/final.png) | [Accepted](../../_records/image-trials/2026-10-02-six-image/m04) · [Rejected attempt](../../_records/image-trials/2026-10-02-six-image/m04-attempt1) |
| [Nova image](../../_records/image-trials/2026-10-02-six-image/m05/final.png) | [Directory](../../_records/image-trials/2026-10-02-six-image/m05) |
| [Business Skill image](../../_records/image-trials/2026-10-02-six-image/m08/final.png) | [Directory](../../_records/image-trials/2026-10-02-six-image/m08) |
| [Dots image](../../_records/image-trials/2026-10-02-six-image/m07/final.png) | [Directory](../../_records/image-trials/2026-10-02-six-image/m07) |

## Remaining production gate

A supported unattended native generation and saved-image review host must still be bound and demonstrated under the owner's cost restrictions. GitHub Actions does not acquire the conversation image tool through this change. Task 00 must not start another full production run based on these interactive results. The separate publication-candidate write-freeze risk remains in the cumulative ledger; this focused change does not claim to resolve it.
