# Run 5 unattended preparation — October 2, 2026

The execution improvements are implemented. **Run 5 may start in `non_image_production` scope even while the unattended image host remains unavailable.** The live unattended image route remains blocked under the existing no-Work, no-Codex, no-paid-API production policy. No supervised image stage or paid adapter is introduced. Image Tasks 11-16 and publication remain blocked until a qualified unattended host exists; Run allocation, controller liveness and dependency-safe non-image work must continue.

Run 4 remains PUBLIC CLOSED with Task 29 PASS and original production SHA `ce3dac9d75949f381821dfd34163048bf08c65d6`. Its accepted artifacts, image replacements, six-image interactive trial, completed tasks and historical closure receipts are preserved.

## Changes in the existing execution path

| Area | Executable behavior |
|---|---|
| Immediate capture | Original bytes remain in the existing durable operation store and exact-byte Git capture. The normalized candidate is also stored under its attempt before visual review. |
| Generation context | The generator receives only the sealed story prompt and output count. Provenance and edition metadata stay outside the rendering input. |
| Transfer recovery | Explicit connection resets, timeouts and 502/503/504 transport errors receive at most three same-operation attempts in a drain. The operation key and bytes are reused. Authorization denials, unknown errors and integrity failures do not trigger a fallback. |
| Visual acceptance | A failed saved-image criterion stops final persistence even when broad quality fields say PASS. Generation and review must have different call IDs. |
| Recovery scope | A rejection belongs to its task or sealed candidate. An accepted_locked result suppresses obsolete rejection recovery. |
| Advancement | The Supervisor immediately rechecks after real task/image/result changes. Idle work retains the one-minute observation loop and independent watchdog. An elapsed-time deadline prevents rapid advancement from consuming the job's rotation budget. |
| Timing | The journal records actual blocked waiting separately from operation execution time. Missing start times remain unknown. |
| Publication | After Tasks 00–22 complete, the Supervisor checks the write boundary before taking a lease and on every tick. It stops writing the candidate and dispatches the existing trusted candidate workflow. |
| Protected promotion | Autonomous mode requires the exact active run, completed upstream tasks, current baseline and durable validated event. Trusted candidate validation, site build, exact-head CI and protected PR merge precede Pages/live validation. |
| Closure | Existing deterministic live validation calls generic run closeout for new active runs. Task 29, learning reconciliation, timing, promotion review, writer release and the terminal pointer travel through the protected finalization PR. The frozen run branch is not rewritten. |
| Admission | Task 00 may authorize `non_image_production` without a READY image host. A registered READY host plus the actual six-image qualification report is required before image Tasks 11-16 and publication. Interactive trials and fixture PASS records cannot qualify the image route. |

A capability declaration still requires a trusted, working host implementation. Receipt validation cannot manufacture actual visual judgment, verify unobserved account billing, or supply a missing runtime. The registry therefore remains CAPABILITY_BLOCKED.

## Verification

The local full suite passed **769 tests**, plus **24 contract checks**. Two additional admission regressions subsequently passed. Changed workflow YAML and shell syntax passed. Protected GitHub CI is the merge gate.

The six-image **fixture control rehearsal** exercised the real batch/durable engine with:

- One simulated visual rejection followed by automatic retry.
- A transient raw-image transfer failure.
- A final upload whose acknowledgement was lost after saving.
- A runner restart after the third accepted image.
- Re-entry after all six images were complete.

Results: seven fixture generation calls, seven fixture reviews, six accepted final files, zero transfer-driven generation repeats, and no additional generation/review/writes when completed work was revisited. The fixture uses already preserved trial images; it neither generates new production images nor proves live image quality or speed.

Evidence: [`control-rehearsal.json`](../../_records/run5-preparation/2026-10-02/control-rehearsal.json) and [`readiness.json`](../../_records/run5-preparation/2026-10-02/readiness.json).

## Remaining admission requirements

1. Start or resume Run 5 in `non_image_production` scope and drain all dependency-safe non-image work while preserving the image blocker.
2. Bind a supported unattended image generator and saved-image visual reviewer within the existing cost policy. No such host is currently registered.
3. Execute the existing six-image batch engine from that runtime in isolated nonproduction qualification, without owner prompts, uploads or per-image approvals.
4. Retain real quality observations, all rejected attempts, actual timestamps, and raw/final files. Recover all twelve accepted files from Git without generation.
5. Register the qualification report and re-evaluate readiness; the CLI keeps the run alive but will not authorize image tasks or publication until the report passes.
6. In the first fully admitted image-capable run, verify the connected publication and generic cleanup path against real CI, merge, Pages and live evidence. Fixture tests are not a completed production rehearsal.

Status requests remain observational. Neither the Supervisor nor the watchdog waits for a status request to progress. A route-specific blocker must not disable the controller or keeper. The original cumulative ledger is retained, with later liveness corrections superseding the earlier global-stop interpretation.
