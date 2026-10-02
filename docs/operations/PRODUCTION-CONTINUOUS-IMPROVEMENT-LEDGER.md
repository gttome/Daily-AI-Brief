# Daily AI Brief — Production Continuous Improvement Ledger

Canonical source: `data/operations/production-continuous-improvement-ledger.jsonl`

Ledger digest: `sha256:928d1171dfcd06e2caa06ab4d2dcd3212d2c32d940f2aa232a0a3eb0635878b1`

Problems: 32 · Events: 46

## DAB-OPS-20260930-001 — Image progress reconciliation could loop without advancing

- **Status:** permanently_fixed
- **First observed run:** unknown
- **Task(s):** unknown
- **Symptom:** Image progress reconciliation could loop without advancing
- **Root cause:** Mutable image-progress projection could diverge from immutable attempt results, causing repeated no-op reconciliation.
- **Operational impact:** Production could spend time reconciling an already-known image outcome instead of advancing.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Derive image progress from immutable attempt results and use mutable controller state only as a rebuildable projection.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/edition-execution.mjs#deriveImageProgress
- **Regression tests:** _generator/test/self-healing-simplification.test.mjs
- **Production invariants:** immutable-image-attempt-results-authoritative
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove immutable-image-attempt-results-authoritative

## DAB-OPS-20260930-002 — Professional diagrams were blocked by an overstrict native-receipt requirement

- **Status:** permanently_fixed
- **First observed run:** unknown
- **Task(s):** unknown
- **Symptom:** Professional diagrams were blocked by an overstrict native-receipt requirement
- **Root cause:** Admission policy treated verified professional editorial diagrams as if every accepted image required the same native-generation receipt.
- **Operational impact:** Valid professional images could be rejected by administration rather than quality.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Allow verified, visually reviewed, accepted_locked professional editorial diagrams without a native generation receipt while preserving modern native-generation receipt rules.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/image-gate.mjs
- **Regression tests:** _generator/test/professional-editorial-diagram-admission.test.mjs
- **Production invariants:** professional-image-quality-not-receipt-form-is-admission-basis
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove professional-image-quality-not-receipt-form-is-admission-basis

## DAB-OPS-20260930-003 — Same-invocation image capture was incorrectly coupled to cross-invocation recovery proof

- **Status:** permanently_fixed
- **First observed run:** unknown
- **Task(s):** unknown
- **Symptom:** Same-invocation image capture was incorrectly coupled to cross-invocation recovery proof
- **Root cause:** The admission model conflated immediate exact-byte capture with a separate native-result recovery capability.
- **Operational impact:** A working professional image path could be blocked despite exact bytes being available in the same invocation.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Add explicit same-invocation direct-capture admission and enforce exact-byte persistence at the image stage.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/edition-execution.mjs#verifyDirectCaptureAdmission
- **Regression tests:** _generator/test/reliable-execution.test.mjs
- **Production invariants:** same-invocation-direct-capture-is-valid-when-exact-bytes-are-persisted
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove same-invocation-direct-capture-is-valid-when-exact-bytes-are-persisted

## DAB-OPS-20261001-001 — Publisher 401/403 access controls were treated like content failures

- **Status:** permanently_fixed
- **First observed run:** unknown
- **Task(s):** unknown
- **Symptom:** Publisher 401/403 access controls were treated like content failures
- **Root cause:** Post-publication source checks did not distinguish publisher anti-bot/access controls from hard missing-content failures.
- **Operational impact:** Valid published editions could be held by a source that blocks automated access.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Classify publisher-controlled 401/403 as explicit warnings while preserving hard failures such as 404.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/source-http-state.mjs
- **Regression tests:** _generator/test/source-http-state.test.mjs
- **Production invariants:** publisher-access-controls-are-warnings-not-silent-success-or-hard-404
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove publisher-access-controls-are-warnings-not-silent-success-or-hard-404

## DAB-OPS-20261001-002 — Publication finalization encountered missing durable run state

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20260930-second
- **Task(s):** unknown
- **Symptom:** Publication finalization encountered missing durable run state
- **Root cause:** Finalization assumed a run-state record existed even when canonical artifacts already proved earlier stages.
- **Operational impact:** Publication completion could stop after valuable work had already been produced.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Seed missing run state only from existing canonical artifacts, preserving already-completed work and consequential-action idempotency.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-state.mjs, _tools/run-state.mjs
- **Regression tests:** _generator/test/run-state-recovery.test.mjs
- **Production invariants:** missing-run-state-may-be-seeded-only-from-canonical-evidence
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove missing-run-state-may-be-seeded-only-from-canonical-evidence

## DAB-OPS-20261001-003 — Run 3 used one-shot execution without persistent liveness

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task(s):** unknown
- **Symptom:** Run 3 used one-shot execution without persistent liveness
- **Root cause:** A start trigger existed, but no single persistent control loop remained responsible from Task 00 through cleanup.
- **Operational impact:** Production stopped silently until an owner status request exposed the lack of progress.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Introduce Run Supervisor v2 with an internal approximately 60-second loop and a separate watchdog.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, .github/workflows/run-supervisor.yml, .github/workflows/run-supervisor-watchdog.yml
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** run-supervisor-v2, owner-status-is-read-only-not-a-liveness-trigger
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove run-supervisor-v2 | Task 00 must prove owner-status-is-read-only-not-a-liveness-trigger

## DAB-OPS-20261001-004 — A task remained Active after its executor stopped

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task(s):** unknown
- **Symptom:** A task remained Active after its executor stopped
- **Root cause:** Task state and executor liveness were recorded independently but no persistent authority reconciled them automatically.
- **Operational impact:** The Kanban could show work as Active while no executor was actually advancing it.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Supervisor classifies stale Active state from durable progress and executor evidence and resumes/reconciles the same task under a fenced writer.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#classifyRunHealth
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** stale-active-must-auto-recover, single-writer-fence-v1
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove stale-active-must-auto-recover | Task 00 must prove single-writer-fence-v1

## DAB-OPS-20261001-005 — Run 3 regressed to basic SVG imagery instead of the proven professional image path

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task(s):** unknown
- **Symptom:** Run 3 regressed to basic SVG imagery instead of the proven professional image path
- **Root cause:** Successful image-path inheritance was not mechanically enforced before production started.
- **Operational impact:** A production run could create low-value visual output despite a previously proven professional path.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Task 00 now requires the proven professional image path, exact-byte capture, saved-asset review, accepted_locked state, and explicitly disables SVG/basic and low-quality fallbacks.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-readiness.mjs
- **Regression tests:** _generator/test/run-readiness.test.mjs
- **Production invariants:** professional-native-image-path-required, svg-basic-fallback-prohibited, low-quality-image-fallback-prohibited
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove professional-native-image-path-required | Task 00 must prove svg-basic-fallback-prohibited | Task 00 must prove low-quality-image-fallback-prohibited

## DAB-OPS-20261001-006 — Prior successful mechanisms were not fully inherited by the next run

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** Prior successful mechanisms were not fully inherited by the next run
- **Root cause:** Operational knowledge was scattered across run-specific receipts, chats and narrative plans rather than one cumulative machine-readable source.
- **Operational impact:** Previously solved problems could recur and be rediscovered during production.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Create an append-only cumulative operational-learning ledger that Task 00 reads in full and verifies against implementation/tests/invariants before every run.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/operational-learning.mjs, data/operations/production-continuous-improvement-ledger.jsonl
- **Regression tests:** _generator/test/operational-learning.test.mjs
- **Production invariants:** full-operational-ledger-read-required-at-task00, permanent-fix-must-have-regression-protection
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove full-operational-ledger-read-required-at-task00 | Task 00 must prove permanent-fix-must-have-regression-protection

## DAB-OPS-20261001-007 — The run-scoped keeper could disable while the run was incomplete

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** The run-scoped keeper could disable while the run was incomplete
- **Root cause:** Keeper lifetime was not structurally bound to terminal Task 29 completion and did not have an independent restart authority.
- **Operational impact:** Liveness could disappear while durable run state still said production was incomplete.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Bind Supervisor lifetime to the active-run pointer and Tasks 00–29; watchdog restarts only the same execution when no Supervisor is queued/running.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** .github/workflows/run-supervisor.yml, .github/workflows/run-supervisor-watchdog.yml
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** supervisor-lives-through-task29, watchdog-restarts-same-execution-only
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove supervisor-lives-through-task29 | Task 00 must prove watchdog-restarts-same-execution-only

## DAB-OPS-20261001-008 — The previous keeper handled stale Active but not actionable Blocked state

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** The previous keeper handled stale Active but not actionable Blocked state
- **Root cause:** Recovery logic was incomplete and reactive rather than driven by durable per-task recovery contracts.
- **Operational impact:** Known recoverable blockers could remain Blocked until a person asked for status.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Supervisor v2 classifies BLOCKED_ACTIONABLE and executes the task's first/alternate recovery contract automatically.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, docs/operations/task-recovery-contracts.json
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** actionable-blocked-must-auto-recover, task00-through-task29-recovery-contracts-required
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove actionable-blocked-must-auto-recover | Task 00 must prove task00-through-task29-recovery-contracts-required

## DAB-OPS-20261001-009 — Small-PNG persistence was repeatedly rediscovered instead of treated as a solved primitive

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 11
- **Symptom:** Small-PNG persistence was repeatedly rediscovered instead of treated as a solved primitive
- **Root cause:** Image generation and Git persistence were operationally coupled without a pre-run proof that at least one standard exact-byte route was usable.
- **Operational impact:** Good images could be delayed or regenerated unnecessarily because transport was re-solved during the run.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Make exact-byte small-PNG persistence mandatory: primary direct Git Data create_blob Base64, fallback bounded Base64-chunk bridge, followed by read-back identity verification.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-readiness.mjs, docs/operations/run-learning-readiness-contract.json
- **Regression tests:** _generator/test/run-readiness.test.mjs, _generator/test/github-image-transfer.test.mjs, _generator/test/image-transport-parity.test.mjs
- **Production invariants:** small-png-persistence-route-required, small-png-readback-identity-required, never-regenerate-while-exact-good-bytes-are-recoverable
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove small-png-persistence-route-required | Task 00 must prove small-png-readback-identity-required | Task 00 must prove never-regenerate-while-exact-good-bytes-are-recoverable

## DAB-OPS-20261001-010 — Run 4 authoritative events advanced while the committed Kanban remained frozen near Task 02

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 15
- **Symptom:** Run 4 authoritative events advanced while the committed Kanban remained frozen near Task 02
- **Root cause:** Kanban state was maintained as an independent mutable projection rather than a digest-bound derivative of append-only transition events.
- **Operational impact:** Owner-visible status could be materially stale even though production evidence had advanced.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Project Kanban solely from transition events, store the source-event digest, and have every Supervisor loop regenerate it when the digest drifts.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#projectKanbanFromEvents
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** kanban-derived-from-authoritative-events, kanban-source-digest-must-match-event-ledger
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove kanban-derived-from-authoritative-events | Task 00 must prove kanban-source-digest-must-match-event-ledger

## DAB-OPS-20261001-011 — PR #317 documented small-PNG readiness but executable Task 00 did not enforce it

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 00
- **Symptom:** PR #317 documented small-PNG readiness but executable Task 00 did not enforce it
- **Root cause:** The change updated the living plan and JSON contract without atomically updating validateRunReadiness and regression coverage.
- **Operational impact:** A documented invariant could appear mandatory while production admission still passed without proving it.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Move readiness to v2 and require an approved small-PNG route plus exact read-back identity in executable validation and regression tests.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-readiness.mjs
- **Regression tests:** _generator/test/run-readiness.test.mjs
- **Production invariants:** policy-contract-validator-test-must-change-atomically, small-png-route-is-an-executable-task00-gate
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove policy-contract-validator-test-must-change-atomically | Task 00 must prove small-png-route-is-an-executable-task00-gate

## DAB-OPS-20261001-012 — Owner status requests had become an accidental mechanism for discovering and repairing stalled production

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** Owner status requests had become an accidental mechanism for discovering and repairing stalled production
- **Root cause:** No always-on control loop continuously compared task state, executor state, progress age, blocker class and recovery contract.
- **Operational impact:** Liveness depended on human observation, making unattended production unreliable.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Make status reporting strictly observational: Supervisor checks every ~60 seconds, performs recovery without prompts, and watchdog restores the same Supervisor if it disappears.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, .github/workflows/run-supervisor.yml
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** owner-status-never-controls-liveness, supervisor-checks-progress-without-human-prompt
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove owner-status-never-controls-liveness | Task 00 must prove supervisor-checks-progress-without-human-prompt

## DAB-OPS-20261001-013 — Multiple recovery mechanisms were being added reactively

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** Multiple recovery mechanisms were being added reactively
- **Root cause:** Control responsibility was split among one-shot continuations, keeper behavior, controller state and owner intervention.
- **Operational impact:** Each new blocker risked creating another recovery path rather than converging on a stable system.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Centralize diagnosis in one Supervisor state machine and keep recovery policy declarative in a versioned Task 00–29 contract.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, docs/operations/task-recovery-contracts.json
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** single-supervisor-control-plane, no-ad-hoc-production-recovery-architecture
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove single-supervisor-control-plane | Task 00 must prove no-ad-hoc-production-recovery-architecture

## DAB-OPS-20261001-014 — A dead Supervisor could leave no authority responsible for restarting production

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** A dead Supervisor could leave no authority responsible for restarting production
- **Root cause:** The inner liveness loop had no independent process responsible for its own failure.
- **Operational impact:** Even a correct Supervisor could become a single point of failure.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Add a five-minute GitHub watchdog with actions:write/contents:read that dispatches only the exact active execution when no Supervisor is queued/in-progress.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** .github/workflows/run-supervisor-watchdog.yml
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** outer-watchdog-required, watchdog-cannot-create-new-run-identity
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove outer-watchdog-required | Task 00 must prove watchdog-cannot-create-new-run-identity

## DAB-OPS-20261001-015 — Writer ownership could be ambiguous across recovery/restart boundaries

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** unknown
- **Symptom:** Writer ownership could be ambiguous across recovery/restart boundaries
- **Root cause:** A process-level notion of one writer was insufficient after crashes or overlapping recovery attempts.
- **Operational impact:** A stale executor could theoretically commit after ownership moved unless writes were fenced.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Historical production evidence was reviewed; prior temporary/ad hoc recovery was treated as insufficient until the permanent control below was installed.
- **Actual fix:** Persist writer generation and owner in the run branch; every Supervisor instance acquires/renews the fence and stale owners are rejected.
- **Fix outcome:** Permanent control encoded in protected production code/contract with regression coverage.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#acquireWriterLease
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** exactly-one-fenced-writer-authority, stale-writer-generation-must-fail
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove exactly-one-fenced-writer-authority | Task 00 must prove stale-writer-generation-must-fail

## DAB-OPS-20261001-016 — Supervisor did not immediately dispatch the next bounded image recovery after an explicit rejected attempt

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 15
- **Symptom:** m08 attempt 3 was durably rejected with a recovery_action, but Task 15 remained Active and the Supervisor classified fresh progress as HEALTHY_ACTIVE instead of immediately recovering.
- **Root cause:** The tick classified only transition-event state. A rejected image attempt carried recovery_action evidence outside the task transition ledger, while the task itself remained Active, so recent progress suppressed recovery until staleness.
- **Operational impact:** The next image attempt would wait for the stale threshold even though the exact recovery action was already known.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Observed the next Supervisor loop and worker-request directory without forcing a duplicate request; confirmed the control-path defect rather than restarting or redoing Task 15.
- **Actual fix:** Add image-aware recovery override: Tasks 11-16 with a rejected attempt and explicit recovery_action are classified as BLOCKED_ACTIONABLE immediately, with recovery_attempts derived from the immutable image attempt number.
- **Fix outcome:** The Supervisor can dispatch the next bounded image recovery on the next loop without waiting for stale Active timeout, and retry exhaustion maps to terminal failure instead of a fifth attempt.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#applyImmediateImageRecovery, _tools/run-supervisor.mjs
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** explicit-image-rejection-recovery-is-immediate, image-attempt-budget-must-not-overrun
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove explicit-image-rejection-recovery-is-immediate | Task 00 must prove image-attempt-budget-must-not-overrun

## DAB-OPS-20261001-017 — Long-running orchestration context contaminated repeated m08 story-image generations

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 15
- **Symptom:** m08 attempts 2 and 3 generated Daily AI Brief/Supervisor dashboard architecture instead of the sealed Business Skill subject; fresh-context attempt 4 restored subject_match=PASS.
- **Root cause:** The image request was executed with unrelated orchestration/dashboard context available to the generation worker, allowing that context to displace the sealed single-story subject. Fresh single-story isolation removed the repeated subject mismatch.
- **Operational impact:** Two bounded image attempts were spent on the wrong subject and Task 15 was delayed.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Run attempt 4 from a fresh context containing only the sealed Business Skill image specification.
- **Actual fix:** Require a fresh single-story image worker after a context/subject mismatch, using only the sealed image specification and explicitly excluding orchestration/dashboard context.
- **Fix outcome:** Attempt 4 restored subject_match=PASS; its separate human-icon and transport defects are handled by the engineering-repair epoch.
- **Permanent implementation:** docs/operations/task-recovery-contracts.json, _generator/lib/repository-repair-consumer.mjs
- **Regression tests:** _generator/test/repository-repair-consumer.test.mjs
- **Production invariants:** fresh_single_story_image_worker_after_context_mismatch
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove fresh_single_story_image_worker_after_context_mismatch

## DAB-OPS-20261001-018 — Repository engineering-repair request was queued without any active consumer

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 15
- **Symptom:** Task 15 Engineering Repair Epoch 1 remained queued while the one-minute Supervisor repeatedly observed it without executing repository repair work.
- **Root cause:** The Supervisor enqueue path persisted run-engineering-repair-request-v1 JSON but no GitHub Actions repository-repair consumer existed.
- **Operational impact:** A live Supervisor loop could falsely appear healthy while production made no progress and required owner observation to expose the stall.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Confirmed the repair request remained queued across multiple Supervisor intervals and audited .github/workflows plus the enqueue implementation for an executor.
- **Actual fix:** Execute repository engineering-repair requests inside the fenced Supervisor GitHub Actions lifecycle immediately after enqueue/reuse, require protected-CI evidence, write an idempotent repair epoch/result, and treat absence of a consumer beyond one interval as a liveness defect.
- **Fix outcome:** Repository repair work has an executable same-loop consumer rather than a passive queue; the current Run 4 repair request can be adopted by the current fenced writer without creating or rebasing a run.
- **Permanent implementation:** .github/workflows/run-supervisor.yml, _tools/repository-repair-consumer.mjs, _generator/lib/repository-repair-consumer.mjs, _tools/run-supervisor.mjs
- **Regression tests:** _generator/test/repository-repair-consumer.test.mjs, _generator/test/run-supervisor.test.mjs
- **Production invariants:** queued_action_without_consumer_is_not_progress, repository_repair_request_must_have_active_consumer
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove queued_action_without_consumer_is_not_progress | Task 00 must prove repository_repair_request_must_have_active_consumer

## DAB-OPS-20261002-001 — Native image work could be queued without an active consumer

- **Status:** superseded
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 16
- **Symptom:** The owner rejected m07 and m08 after PUBLIC CLOSED. Inspection found a deterministic Pillow renderer declaring its own visual review PASS.
- **Root cause:** A queue consumer was mistaken for native generation and independent visual inspection.
- **Operational impact:** Production could appear active while the sixth image made no progress.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Confirmed the queue item was durable and avoided creating a duplicate run or regenerating accepted images.
- **Actual fix:** Retire the drawing/self-approval path and report an explicit capability blocker. Track visual-review enforcement and real host admission separately below.
- **Fix outcome:** The historical Run 4 record remains intact; its native-worker quality conclusion is corrected by this append-only event.
- **Permanent implementation:** .github/workflows/run-supervisor.yml, _tools/native-image-worker.py
- **Regression tests:** _generator/test/run-supervisor.test.mjs
- **Production invariants:** native_image_request_must_have_active_consumer, queued_action_without_consumer_is_not_progress
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove native_image_request_must_have_active_consumer

## DAB-OPS-20261002-002 — Emergency finalizer loaded stale control-tree state while building the Run 4 candidate

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 18
- **Symptom:** Initial finalizer attempts failed on an undefined Watchlist binding and stale book-catalog/module state.
- **Root cause:** The finalizer executed from the control checkout and imported render validators before Run 4 projections were written.
- **Operational impact:** Canonical assembly required several narrow protected repairs before Task 18 could pass.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Repaired only each exact finalizer defect while preserving the locked stories, media, books and accepted images.
- **Actual fix:** Execute the finalizer from the Run 4 checkout and load renderer/integrity modules only after durable book and Watchlist projections are written.
- **Fix outcome:** Finalizer workflow 36959230022 passed and produced the validated October 1 candidate without content reselection.
- **Permanent implementation:** .github/workflows/run4-finalizer.yml, _tools/run4-finalizer.mjs
- **Regression tests:** _generator/test/run4-closeout.test.mjs
- **Production invariants:** finalizer_reads_and_validates_same_durable_run_tree, module_snapshots_must_follow_projection_writes
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove finalizer_reads_and_validates_same_durable_run_tree

## DAB-OPS-20261002-003 — The persistent Supervisor mutated the publication branch after exact-SHA CI passed

- **Status:** mitigated
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 23
- **Symptom:** Minute-loop reconciliation commits moved the publication PR head between CI PASS and merge.
- **Root cause:** The Supervisor could continue committing while protected CI and merge depended on a stable candidate SHA.
- **Operational impact:** A valid protected CI result became stale before merge and publication was delayed.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Paused the existing Run 4 writer through protected main and confirmed the old Supervisor was cancelled before retriggering CI. | Introduce an executable pre-lease and per-tick publication boundary and fault-oriented closure tests.
- **Actual fix:** Freeze the run writer after Tasks00-22; automatically hand off to trusted candidate validation, exact-SHA CI/merge and existing Pages/live validation. Persist generic Task29 cleanup on the protected closure branch.
- **Fix outcome:** Deterministic tests pass; no live Run5 publication or closure has been attempted. Existing Run4 closeout is preserved.
- **Permanent implementation:** _generator/lib/frozen-publication.mjs, _generator/lib/production-run-closeout.mjs, .github/workflows/run-supervisor.yml, .github/workflows/publish-candidate.yml, .github/workflows/daily-delta-validation.yml
- **Regression tests:** _generator/test/run5-unattended.test.mjs
- **Production invariants:** publication_candidate_write_freeze_before_task23, protected_finalization_owns_post_publication_run_cleanup
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove publication_candidate_write_freeze_before_task23 | Task 00 must prove no run-branch mutation between exact-SHA CI PASS and merge | Prove the unchanged candidate SHA through CI and merge in an admitted future run. | Verify generic Task29 closure from real deployment and live-verification evidence.

## DAB-OPS-20261002-004 — Emergency publication path lacked the durable validated-event bridge required by closure

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task(s):** 27
- **Symptom:** Exact-SHA Pages deployment succeeded but deterministic closure failed because the October 1 publication directory and completion seed were absent.
- **Root cause:** The emergency finalizer/release-sealer path reached protected publication without writing the validated publication event expected by the standard delta-validation lifecycle.
- **Operational impact:** A correctly deployed Brief could not reach PUBLIC CLOSED even though content and deployment were valid.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Preserved the deployed production SHA and repaired only the missing closure evidence path; no republish or content regeneration was performed.
- **Actual fix:** Add a protected closeout bridge that reconstructs the missing validated event from exact PR/CI/merge/Pages evidence, independently live-verifies the reader and exact image bytes, then persists lifecycle/run-state/Command Center/cleanup evidence.
- **Fix outcome:** The closeout path can complete the same Run 4 from authoritative evidence without changing the published Brief.
- **Permanent implementation:** _tools/run4-closeout.mjs, .github/workflows/run4-closeout.yml, _tools/daily-validation.mjs
- **Regression tests:** _generator/test/run4-closeout.test.mjs
- **Production invariants:** publication_success_requires_durable_validated_event_for_closure, closure_recovery_must_preserve_original_production_sha, dated_image_manifest_must_be_visible_to_live_validator
- **Recurrences:** none recorded
- **Future validation:** Task 00 must prove publication_success_requires_durable_validated_event_for_closure

## DAB-OPS-20261002-005 — An image-producing script could certify its own visual quality without inspecting saved pixels.

- **Status:** permanently_fixed
- **First observed run:** image-pipeline-trial-20261002
- **Task(s):** unknown
- **Symptom:** Sparse, pale images had editorial_quality PASS and saved_asset_reviewed true written by the renderer.
- **Root cause:** Generation and visual judgment were not separated at the worker boundary.
- **Operational impact:** not recorded
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Inspected the saved images and native worker source; ran a six-image trial with actual post-generation visual inspection.
- **Actual fix:** Remove the deterministic drawing worker; require byte-bound visual-inspection observations for new live image receipts and stop before persistence when review evidence is missing.
- **Fix outcome:** Six images accepted in 633.475 seconds wall time, seven tool calls totaling 277.073 seconds, one honest visual rejection and targeted edit, zero transport-driven regenerations. Four ordinary first-pass images completed in 64-74 seconds each; the first included helper setup overhead. All 12 raw/final assets recovered from Git without generation.
- **Permanent implementation:** _tools/native-image-worker.py, _generator/lib/image-review-evidence.mjs, _generator/lib/image-execution.mjs, _generator/lib/recoverable-image-job.mjs
- **Regression tests:** _generator/test/image-review-evidence.test.mjs
- **Production invariants:** renderer_cannot_self_certify_editorial_quality, saved_image_review_requires_hash_bound_observations
- **Recurrences:** none recorded
- **Future validation:** Prove a separate saved-image inspection exists for each final image; a script-written PASS is insufficient. | Read _records/image-trials/2026-10-02-six-image/summary.json and recovery-check.json; retain actual waiting and rejected-attempt time.

## DAB-OPS-20261002-006 — Interactive image success does not establish an unattended zero-Work production capability.

- **Status:** mitigated
- **First observed run:** image-pipeline-trial-20261002
- **Task(s):** unknown
- **Symptom:** The interactive tool created good images quickly, but GitHub Actions has no registered native generation/review host.
- **Root cause:** Interactive image quality and declared admission flags do not establish an unattended zero-cost production host.
- **Operational impact:** not recorded
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Executed a real six-image interactive trial and recovered all raw/final files from Git. | Run the existing six-image batch engine with recovery faults and audit the live host registration.
- **Actual fix:** Require a registered READY host and a digest-bound six-image live scheduled qualification report; recover raw/final files from its Git commit and validate each execution receipt before Task00 can pass.
- **Fix outcome:** Control rehearsal PASS; actual unattended image qualification remains CAPABILITY_BLOCKED. No Run5 or paid/Work/Codex production adapter was started.
- **Permanent implementation:** _generator/lib/run-readiness.mjs, docs/operations/run-learning-readiness-contract.json, _tools/native-image-worker.py, _tools/run-readiness.mjs, _generator/lib/unattended-image-qualification.mjs, docs/operations/unattended-image-host.json
- **Regression tests:** _generator/test/run-readiness.test.mjs, _generator/test/run5-unattended.test.mjs, _generator/test/reliable-execution.test.mjs
- **Production invariants:** none
- **Recurrences:** none recorded
- **Future validation:** Bind a supported unattended native image host and verify live generation, exact raw-byte recovery, saved-image review, transport and the zero-production-cost boundary before production. | Bind and demonstrate a supported unattended generator and saved-image visual reviewer within the existing cost policy. | Recover all twelve raw/final files from the live six-image trial without generation; inspect quality evidence and measured waits.

## DAB-OPS-20261002-007 — Recoverable transport errors and late visual rejection could delay image completion.

- **Status:** permanently_fixed
- **First observed run:** run5-preparation-20261002
- **Task(s):** unknown
- **Symptom:** not recorded
- **Root cause:** Known transient transfer errors fell through to a generic blocked state; per-criterion visual failures could be caught after the final asset was persisted.
- **Operational impact:** not recorded
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Exercise the existing durable engine with transfer faults and a saved-image visual rejection.
- **Actual fix:** Retry recognized transport failures up to three operation attempts using the same bytes and operation key; save the review candidate before review and reject failed visual criteria before final persistence.
- **Fix outcome:** Fault-injected six-image control rehearsal passes without transport-driven regeneration. This is fixture evidence, not live host admission.
- **Permanent implementation:** _generator/lib/recoverable-image-job.mjs, _generator/lib/durable-operation.mjs
- **Regression tests:** _generator/test/reliable-execution.test.mjs
- **Production invariants:** transient_transfer_recovery_preserves_generation_and_review, review_candidate_persisted_before_inspection, visual_failure_stops_before_final_persistence
- **Recurrences:** none recorded
- **Future validation:** Measure actual unattended generation, capture, review, transport and waiting time on the registered live host.

## DAB-OPS-20261002-008 — An earlier image rejection could influence recovery for a later image task.

- **Status:** permanently_fixed
- **First observed run:** run5-preparation-20261002
- **Task(s):** unknown
- **Symptom:** not recorded
- **Root cause:** The Supervisor selected the latest rejection across all candidates and did not suppress rejections once that candidate was accepted_locked.
- **Operational impact:** not recorded
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Trace the selector and test two candidate identities plus an accepted result.
- **Actual fix:** Scope rejection recovery to the current task or its sealed ordinal-to-candidate binding, and preserve accepted_locked results.
- **Fix outcome:** Regression tests reject cross-candidate recovery and stale rejected attempts.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#latestRecoverableImage, _tools/run-supervisor.mjs
- **Regression tests:** _generator/test/run5-unattended.test.mjs
- **Production invariants:** image_recovery_is_candidate_scoped, accepted_image_suppresses_stale_rejection
- **Recurrences:** none recorded
- **Future validation:** Verify each image task maps to its own sealed candidate before dispatch.

## DAB-OPS-20261002-009 — The image migration removed the prior worker before an unattended replacement was proven and incorrectly required GitHub-only scheduler evidence.

- **Status:** mitigated
- **First observed run:** scheduled-executor-restoration-20261002
- **Task(s):** unknown
- **Symptom:** not recorded
- **Root cause:** An interactive development trial and component improvements were treated as sufficient migration progress; the new admission validator only recognized numeric GitHub workflow IDs, excluding the existing scheduled ChatGPT controller.
- **Operational impact:** Run 5 remains unadmitted until a live authorized scheduled executor proves the image path.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Restore compatibility with actual ChatGPT automation invocation observations, preserve the existing automation identities, and provide a durable daily startup/recovery contract.
- **Actual fix:** When protected registration is READY and binds a ChatGPT automation qualification receipt, preserve the exact fenced request as awaiting_scheduled_executor. The GitHub script does not generate, review, accept, or mark the task Done. Without qualification the capability blocker remains.
- **Fix outcome:** Routing and no-fabricated-acceptance tests pass. The daily 01:00 Chicago controller and hourly keeper are enabled; an immediate invocation was requested. Actual scheduled qualification and Run5 admission remain unobserved.
- **Permanent implementation:** _generator/lib/unattended-image-qualification.mjs, docs/operations/DAILY-UNATTENDED-STARTUP.md, _tools/native-image-worker.py
- **Regression tests:** _generator/test/scheduled-image-host.test.mjs, _generator/test/scheduled-image-routing.test.mjs
- **Production invariants:** production_cutover_requires_live_unattended_compatibility, scheduler_identity_must_match_actual_executor
- **Recurrences:** none recorded
- **Future validation:** Observe the scheduled invocation and actual native generation, saved-pixel review and exact-byte recovery. | Do not retire an existing execution path on the strength of interactive or fixture success. | Keep daily and recovery schedules independent of owner status requests. | Verify the registered scheduled worker consumes the exact operation and fence and saves real generation/review evidence. | Do not equate awaiting_scheduled_executor with active execution or successful generation.

## DAB-OPS-20261002-010 — Reusing the existing controller invoked Codex Work, outside the authorized production boundary; no image was generated.

- **Status:** open
- **First observed run:** scheduled-image-host-qualification-20261002
- **Task(s):** 00
- **Symptom:** The controller, hourly keeper and two immediate startup tasks were re-enabled, but the available native image and saved-pixel inspection tools remained exposed through Codex Work.
- **Root cause:** The automation schedule selects when to invoke the task, not an ordinary non-Work execution surface. The scheduler interface exposes no runtime-mode selector.
- **Operational impact:** Task 00 remains blocked and Run5 remains unallocated. Repeating the same triggers cannot qualify the host.
- **Timing impact:** unknown / not safely inferable
- **Attempted fixes:** Re-enabled the existing daily controller and keeper, requested an immediate invocation, and inspected its actual GitHub capability receipt. | Repeated the full bootstrap from current protected main, read all 42 ledger events, reconciled Run4 completion evidence and inspected a fresh automations.peek snapshot. The controller now reports a real prior last_run_time.
- **Actual fix:** Stopped the daily controller, hourly keeper and duplicate one-time startup tasks after the recurrence; kept the independent live validator enabled. Preserved a second immutable probe/result set on the isolated qualification branch.
- **Fix outcome:** Zero images generated, zero production state mutated and no proof flags changed. Run4 remains PUBLIC_CLOSED at ce3dac9d75949f381821dfd34163048bf08c65d6. The scheduler-observation timing gap is resolved for the earlier invocation, while the runtime-policy blocker remains open.
- **Permanent implementation:** _records/image-trials/2026-10-02-scheduled/bootstrap-receipt-2.json, _records/image-trials/2026-10-02-scheduled/scheduler-observation-2.json, _records/image-trials/2026-10-02-scheduled/capability-probe-2.json, _records/image-trials/2026-10-02-scheduled/result-2.json, _records/image-trials/2026-10-02-scheduled/schedule-pause-2.json
- **Regression tests:** none
- **Production invariants:** schedule_configuration_is_not_runtime_mode_proof, unchanged_prohibited_execution_must_not_repeat, blocked_is_not_progress
- **Recurrences:** none recorded
- **Future validation:** Use an actually supported ordinary non-Work/non-Codex scheduled image host within existing cost policy before re-enabling production. | Do not retry unchanged prohibited scheduled execution or treat scheduling instructions as a runtime-mode selector. | A post-run scheduler observation can resolve last_run_time timing, but cannot remove the runtime-policy blocker. | Resume only after a supported ordinary non-Work/non-Codex scheduled image host exists within the zero-paid-service boundary. | Reuse the isolated qualification branch and its valid checkpoints; do not create another controller or repeat Run4.



## DAB-OPS-20261002-010 — Route-scoped blocker incorrectly stopped global production

- **Status:** permanently fixed
- **Run:** run5-liveness-repair-20261002
- **Task:** 00
- **Symptom:** the controller and hourly keeper were disabled after the unattended image route resolved to a prohibited Work/Codex surface.
- **Root cause:** image-host admission was implemented as a global Run-start gate instead of an image/publication gate.
- **Permanent fix:** Task 00 may authorize `non_image_production`; the missing host is a deferred route blocker. Image tasks and publication remain fail-closed. Daily controller and recovery keeper remain enabled.
- **Regression protection:** `run-readiness.test.mjs` and `run5-unattended.test.mjs` verify non-image liveness, image/publication blocking, and unchanged cost-boundary failure.
- **Next-run validation:** Run 5 must allocate and drain safe non-image work even while the image route is blocked, and must not publish until host qualification passes.

## DAB-OPS-20261002-011 — Same-owner renewal shortened the active Supervisor fence

- **Status:** permanently fixed
- **Run:** reliable-edition-20261002-run5
- **Task:** 10 boundary
- **Symptom:** the persistent Supervisor failed with `WRITER_LEASE_EXPIRED` in loop 25 even though the same Run 5 content worker was still advancing durable Tasks 06–10.
- **Root cause:** a same-owner recovery heartbeat replaced the six-hour Supervisor expiry with a thirty-minute expiry. The loop asserted that persisted lease without first renewing its own authority.
- **Operational impact:** the Supervisor stopped before refreshing the event-derived Kanban for Tasks 06–10 and before recording the route-scoped Task 11 image blocker. Completed content artifacts remained durable.
- **Repair:** same-owner renewal now keeps the later expiry, and every Supervisor loop renews locally with the six-hour TTL before the fence assertion. A different owner or generation still fails closed.
- **Regression protection:** 38 focused Supervisor, Run 5 unattended, and readiness tests pass locally and in protected deterministic CI run `37014908589`.
- **Outcome:** PR #352 merged at `32b0efb2f80b6fd4808fa8086fc06472505ac810`. Recovery acquired writer generation 3 for the same Run 5, refreshed the event-derived Kanban through Task 10, and recorded Task 11 Blocked with `generation_started=false`; image and publication authorization remain false.
- **Next-run validation:** confirm every future same-owner recovery heartbeat preserves or extends the active expiry, and keep the image route blocked without retrying it until an authorized unattended native host is proven.
