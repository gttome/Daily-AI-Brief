# Daily AI Brief — Production Continuous Improvement Ledger

**Canonical machine source:** `data/operations/production-continuous-improvement-ledger.jsonl`

**Policy:** This Markdown file is a human-readable projection. The JSONL event stream is append-only and authoritative. Historical timing not supported by durable evidence is recorded as unknown rather than inferred.

**Backfilled material problems:** 19

Every future Task 00 reads the full JSONL ledger and proves all permanent fixes/invariants/tests remain present. Every material production problem is appended during the run. Task 29 reconciles status, timing, regression protection and next-run readiness.

## DAB-OPS-20260930-001 — Image progress reconciliation could loop without advancing

- **Status:** permanently_fixed
- **First observed run:** historical / exact execution not safely inferable
- **Task:** multiple / not safely inferable
- **Root cause:** Mutable image-progress projection could diverge from immutable attempt results, causing repeated no-op reconciliation.
- **Operational impact:** Production could spend time reconciling an already-known image outcome instead of advancing.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Derive image progress from immutable attempt results and use mutable controller state only as a rebuildable projection.
- **Permanent implementation:** _generator/lib/edition-execution.mjs#deriveImageProgress
- **Regression coverage:** _generator/test/self-healing-simplification.test.mjs
- **Production invariant(s):** immutable-image-attempt-results-authoritative

## DAB-OPS-20260930-002 — Professional diagrams were blocked by an overstrict native-receipt requirement

- **Status:** permanently_fixed
- **First observed run:** historical / exact execution not safely inferable
- **Task:** multiple / not safely inferable
- **Root cause:** Admission policy treated verified professional editorial diagrams as if every accepted image required the same native-generation receipt.
- **Operational impact:** Valid professional images could be rejected by administration rather than quality.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Allow verified, visually reviewed, accepted_locked professional editorial diagrams without a native generation receipt while preserving modern native-generation receipt rules.
- **Permanent implementation:** _generator/lib/image-gate.mjs
- **Regression coverage:** _generator/test/professional-editorial-diagram-admission.test.mjs
- **Production invariant(s):** professional-image-quality-not-receipt-form-is-admission-basis

## DAB-OPS-20260930-003 — Same-invocation image capture was incorrectly coupled to cross-invocation recovery proof

- **Status:** permanently_fixed
- **First observed run:** historical / exact execution not safely inferable
- **Task:** multiple / not safely inferable
- **Root cause:** The admission model conflated immediate exact-byte capture with a separate native-result recovery capability.
- **Operational impact:** A working professional image path could be blocked despite exact bytes being available in the same invocation.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Add explicit same-invocation direct-capture admission and enforce exact-byte persistence at the image stage.
- **Permanent implementation:** _generator/lib/edition-execution.mjs#verifyDirectCaptureAdmission
- **Regression coverage:** _generator/test/reliable-execution.test.mjs
- **Production invariant(s):** same-invocation-direct-capture-is-valid-when-exact-bytes-are-persisted

## DAB-OPS-20261001-001 — Publisher 401/403 access controls were treated like content failures

- **Status:** permanently_fixed
- **First observed run:** historical / exact execution not safely inferable
- **Task:** multiple / not safely inferable
- **Root cause:** Post-publication source checks did not distinguish publisher anti-bot/access controls from hard missing-content failures.
- **Operational impact:** Valid published editions could be held by a source that blocks automated access.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Classify publisher-controlled 401/403 as explicit warnings while preserving hard failures such as 404.
- **Permanent implementation:** _generator/lib/source-http-state.mjs
- **Regression coverage:** _generator/test/source-http-state.test.mjs
- **Production invariant(s):** publisher-access-controls-are-warnings-not-silent-success-or-hard-404

## DAB-OPS-20261001-002 — Publication finalization encountered missing durable run state

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20260930-second
- **Task:** multiple / not safely inferable
- **Root cause:** Finalization assumed a run-state record existed even when canonical artifacts already proved earlier stages.
- **Operational impact:** Publication completion could stop after valuable work had already been produced.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Seed missing run state only from existing canonical artifacts, preserving already-completed work and consequential-action idempotency.
- **Permanent implementation:** _generator/lib/run-state.mjs, _tools/run-state.mjs
- **Regression coverage:** _generator/test/run-state-recovery.test.mjs
- **Production invariant(s):** missing-run-state-may-be-seeded-only-from-canonical-evidence

## DAB-OPS-20261001-003 — Run 3 used one-shot execution without persistent liveness

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task:** multiple / not safely inferable
- **Root cause:** A start trigger existed, but no single persistent control loop remained responsible from Task 00 through cleanup.
- **Operational impact:** Production stopped silently until an owner status request exposed the lack of progress.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Introduce Run Supervisor v2 with an internal approximately 60-second loop and a separate watchdog.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, .github/workflows/run-supervisor.yml, .github/workflows/run-supervisor-watchdog.yml
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** run-supervisor-v2, owner-status-is-read-only-not-a-liveness-trigger

## DAB-OPS-20261001-004 — A task remained Active after its executor stopped

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task:** multiple / not safely inferable
- **Root cause:** Task state and executor liveness were recorded independently but no persistent authority reconciled them automatically.
- **Operational impact:** The Kanban could show work as Active while no executor was actually advancing it.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Supervisor classifies stale Active state from durable progress and executor evidence and resumes/reconciles the same task under a fenced writer.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#classifyRunHealth
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** stale-active-must-auto-recover, single-writer-fence-v1

## DAB-OPS-20261001-005 — Run 3 regressed to basic SVG imagery instead of the proven professional image path

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run3
- **Task:** multiple / not safely inferable
- **Root cause:** Successful image-path inheritance was not mechanically enforced before production started.
- **Operational impact:** A production run could create low-value visual output despite a previously proven professional path.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Task 00 now requires the proven professional image path, exact-byte capture, saved-asset review, accepted_locked state, and explicitly disables SVG/basic and low-quality fallbacks.
- **Permanent implementation:** _generator/lib/run-readiness.mjs
- **Regression coverage:** _generator/test/run-readiness.test.mjs
- **Production invariant(s):** professional-native-image-path-required, svg-basic-fallback-prohibited, low-quality-image-fallback-prohibited

## DAB-OPS-20261001-006 — Prior successful mechanisms were not fully inherited by the next run

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** Operational knowledge was scattered across run-specific receipts, chats and narrative plans rather than one cumulative machine-readable source.
- **Operational impact:** Previously solved problems could recur and be rediscovered during production.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Create an append-only cumulative operational-learning ledger that Task 00 reads in full and verifies against implementation/tests/invariants before every run.
- **Permanent implementation:** _generator/lib/operational-learning.mjs, data/operations/production-continuous-improvement-ledger.jsonl
- **Regression coverage:** _generator/test/operational-learning.test.mjs
- **Production invariant(s):** full-operational-ledger-read-required-at-task00, permanent-fix-must-have-regression-protection

## DAB-OPS-20261001-007 — The run-scoped keeper could disable while the run was incomplete

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** Keeper lifetime was not structurally bound to terminal Task 29 completion and did not have an independent restart authority.
- **Operational impact:** Liveness could disappear while durable run state still said production was incomplete.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Bind Supervisor lifetime to the active-run pointer and Tasks 00–29; watchdog restarts only the same execution when no Supervisor is queued/running.
- **Permanent implementation:** .github/workflows/run-supervisor.yml, .github/workflows/run-supervisor-watchdog.yml
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** supervisor-lives-through-task29, watchdog-restarts-same-execution-only

## DAB-OPS-20261001-008 — The previous keeper handled stale Active but not actionable Blocked state

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** Recovery logic was incomplete and reactive rather than driven by durable per-task recovery contracts.
- **Operational impact:** Known recoverable blockers could remain Blocked until a person asked for status.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Supervisor v2 classifies BLOCKED_ACTIONABLE and executes the task's first/alternate recovery contract automatically.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, docs/operations/task-recovery-contracts.json
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** actionable-blocked-must-auto-recover, task00-through-task29-recovery-contracts-required

## DAB-OPS-20261001-009 — Small-PNG persistence was repeatedly rediscovered instead of treated as a solved primitive

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** 11
- **Root cause:** Image generation and Git persistence were operationally coupled without a pre-run proof that at least one standard exact-byte route was usable.
- **Operational impact:** Good images could be delayed or regenerated unnecessarily because transport was re-solved during the run.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Make exact-byte small-PNG persistence mandatory: primary direct Git Data create_blob Base64, fallback bounded Base64-chunk bridge, followed by read-back identity verification.
- **Permanent implementation:** _generator/lib/run-readiness.mjs, docs/operations/run-learning-readiness-contract.json
- **Regression coverage:** _generator/test/run-readiness.test.mjs, _generator/test/github-image-transfer.test.mjs, _generator/test/image-transport-parity.test.mjs
- **Production invariant(s):** small-png-persistence-route-required, small-png-readback-identity-required, never-regenerate-while-exact-good-bytes-are-recoverable

## DAB-OPS-20261001-010 — Run 4 authoritative events advanced while the committed Kanban remained frozen near Task 02

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** 15
- **Root cause:** Kanban state was maintained as an independent mutable projection rather than a digest-bound derivative of append-only transition events.
- **Operational impact:** Owner-visible status could be materially stale even though production evidence had advanced.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Project Kanban solely from transition events, store the source-event digest, and have every Supervisor loop regenerate it when the digest drifts.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#projectKanbanFromEvents
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** kanban-derived-from-authoritative-events, kanban-source-digest-must-match-event-ledger

## DAB-OPS-20261001-011 — PR #317 documented small-PNG readiness but executable Task 00 did not enforce it

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** 00
- **Root cause:** The change updated the living plan and JSON contract without atomically updating validateRunReadiness and regression coverage.
- **Operational impact:** A documented invariant could appear mandatory while production admission still passed without proving it.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Move readiness to v2 and require an approved small-PNG route plus exact read-back identity in executable validation and regression tests.
- **Permanent implementation:** _generator/lib/run-readiness.mjs
- **Regression coverage:** _generator/test/run-readiness.test.mjs
- **Production invariant(s):** policy-contract-validator-test-must-change-atomically, small-png-route-is-an-executable-task00-gate

## DAB-OPS-20261001-012 — Owner status requests had become an accidental mechanism for discovering and repairing stalled production

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** No always-on control loop continuously compared task state, executor state, progress age, blocker class and recovery contract.
- **Operational impact:** Liveness depended on human observation, making unattended production unreliable.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Make status reporting strictly observational: Supervisor checks every ~60 seconds, performs recovery without prompts, and watchdog restores the same Supervisor if it disappears.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, .github/workflows/run-supervisor.yml
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** owner-status-never-controls-liveness, supervisor-checks-progress-without-human-prompt

## DAB-OPS-20261001-013 — Multiple recovery mechanisms were being added reactively

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** Control responsibility was split among one-shot continuations, keeper behavior, controller state and owner intervention.
- **Operational impact:** Each new blocker risked creating another recovery path rather than converging on a stable system.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Centralize diagnosis in one Supervisor state machine and keep recovery policy declarative in a versioned Task 00–29 contract.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs, docs/operations/task-recovery-contracts.json
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** single-supervisor-control-plane, no-ad-hoc-production-recovery-architecture

## DAB-OPS-20261001-014 — A dead Supervisor could leave no authority responsible for restarting production

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** The inner liveness loop had no independent process responsible for its own failure.
- **Operational impact:** Even a correct Supervisor could become a single point of failure.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Add a five-minute GitHub watchdog with actions:write/contents:read that dispatches only the exact active execution when no Supervisor is queued/in-progress.
- **Permanent implementation:** .github/workflows/run-supervisor-watchdog.yml
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** outer-watchdog-required, watchdog-cannot-create-new-run-identity

## DAB-OPS-20261001-015 — Writer ownership could be ambiguous across recovery/restart boundaries

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** multiple / not safely inferable
- **Root cause:** A process-level notion of one writer was insufficient after crashes or overlapping recovery attempts.
- **Operational impact:** A stale executor could theoretically commit after ownership moved unless writes were fenced.
- **Timing impact:** unknown / not safely inferable
- **Actual permanent fix:** Persist writer generation and owner in the run branch; every Supervisor instance acquires/renews the fence and stale owners are rejected.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#acquireWriterLease
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** exactly-one-fenced-writer-authority, stale-writer-generation-must-fail

## DAB-OPS-20261001-016 — Supervisor delayed an explicit image-rejection recovery until stale timeout

- **Status:** permanently_fixed
- **First observed run:** reliable-edition-20261001-run4
- **Task:** 15
- **Root cause:** Supervisor health classification used transition-event task state only. A rejected image attempt with an explicit recovery action left Task 15 marked Active, so fresh progress was treated as healthy even though recovery was immediately actionable.
- **Operational impact:** The next bounded image attempt could sit idle until the stale threshold despite a known deterministic recovery action.
- **Timing impact:** observed during Run 4; exact final delay avoided by the fix and therefore not inferred
- **Actual permanent fix:** Promote rejected image-attempt evidence into Supervisor classification. Tasks 11–16 now become immediately BLOCKED_ACTIONABLE for Supervisor decision purposes when the latest immutable rejected attempt supplies a recovery action; the attempt number also drives retry-budget enforcement.
- **Permanent implementation:** _generator/lib/run-supervisor.mjs#applyImmediateImageRecovery, _tools/run-supervisor.mjs
- **Regression coverage:** _generator/test/run-supervisor.test.mjs
- **Production invariant(s):** explicit-image-rejection-recovery-is-immediate, image-attempt-budget-must-not-overrun
