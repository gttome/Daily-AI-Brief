# Daily AI Brief — Production System Change Ledger

Canonical source: `data/operations/production-system-change-ledger.jsonl`

Changes: 13 · Events: 13

> This ledger records intentional production-system changes independently of incidents. A problem may later link to one or more change IDs, but the ledger does not infer causation from temporal proximity alone.

## DAB-CHG-20261002-001 — Replace self-certifying image worker and prove six-image trial

- **Category:** quality_gate
- **Changed:** 2026-10-02T05:06:00Z
- **PR / source / main:** #343 · 4848daa185f3ea9ffcf223f6469ec893cd082247 · 4848daa185f3ea9ffcf223f6469ec893cd082247
- **Production outcome:** unproven
- **Reason:** Separate native generation from saved-pixel quality judgment.
- **Components:** _tools/native-image-worker.py, _generator/lib/image-review-evidence.mjs, _generator/lib/image-execution.mjs
- **Previous behavior:** Renderer-side receipts could effectively certify image quality.
- **New intended behavior:** Generated image quality requires separate hash-bound visual inspection and recovery evidence.
- **Invariants affected:** renderer_cannot_self_certify_editorial_quality, saved_image_review_requires_hash_bound_observations
- **Dependencies affected:** image generation, saved-pixel review, Run readiness
- **Expected operational impact:** Reduce false image acceptance while retaining native generation speed.
- **Known risks:** Interactive/trial success might be mistaken for unattended host proof.
- **Validation:** Protected PR #343 | six-image trial evidence
- **Rollback:** Revert PR #343 and restore prior worker only if the prior quality contract is also intentionally restored.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-005, DAB-OPS-20261002-006
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-002 — Prepare unattended Run 5 execution while preserving live host blocker

- **Category:** workflow
- **Changed:** 2026-10-02T05:43:33Z
- **PR / source / main:** #344 · f78fed1ba6b798e42497d641b463b3255d25ee6d · f78fed1ba6b798e42497d641b463b3255d25ee6d
- **Production outcome:** unproven
- **Reason:** Prepare persistent unattended recovery, publication freeze and host qualification for Run 5.
- **Components:** .github/workflows/run-supervisor.yml, _generator/lib/run-supervisor.mjs, _generator/lib/unattended-image-qualification.mjs
- **Previous behavior:** Run execution and image recovery depended on less integrated one-shot paths.
- **New intended behavior:** Run 5 uses persistent supervision, bounded recovery, explicit host admission and a protected publication freeze.
- **Invariants affected:** single_writer, candidate_write_freeze_before_task23, unattended_host_must_be_proven
- **Dependencies affected:** Supervisor, image recovery, publication
- **Expected operational impact:** Make unattended Run 5 resumable and fail-closed.
- **Known risks:** New orchestration paths could interact with writer leases or recovery schemas in ways not exposed by fixtures.
- **Validation:** Protected PR #344 | Run 5 preparation tests
- **Rollback:** Revert PR #344 while preserving completed durable Run evidence.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-003, DAB-OPS-20261002-006, DAB-OPS-20261002-011, DAB-OPS-20261002-013
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-003 — Recognize scheduled ChatGPT invocation evidence and define daily bootstrap

- **Category:** schema
- **Changed:** 2026-10-02T06:15:48Z
- **PR / source / main:** #345 · 0f6cc4e5115f3604bb98aa6fc8099b54d69c3757 · 0f6cc4e5115f3604bb98aa6fc8099b54d69c3757
- **Production outcome:** unproven
- **Reason:** Allow real ChatGPT scheduler observations to satisfy scheduler identity without inventing GitHub workflow IDs.
- **Components:** _generator/lib/unattended-image-qualification.mjs, docs/operations/DAILY-UNATTENDED-STARTUP.md
- **Previous behavior:** Host qualification expected GitHub-style scheduler evidence.
- **New intended behavior:** ChatGPT scheduled invocation observations are a supported evidence type when digest-bound and real.
- **Invariants affected:** scheduler_identity_matches_actual_executor, no_fabricated_workflow_id
- **Dependencies affected:** host admission, daily startup
- **Expected operational impact:** Restore compatibility with the actual scheduler surface.
- **Known risks:** Scheduler evidence could be confused with runtime-mode or image-host qualification evidence.
- **Validation:** Protected PR #345 | scheduled-image-host tests
- **Rollback:** Revert PR #345 and require the older scheduler evidence format.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-009, DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-004 — Activate daily and recovery schedules and request immediate run

- **Category:** schedule
- **Changed:** 2026-10-02T06:20:10Z
- **PR / source / main:** #346 · a6e0bad26777e7b532864fe0d4bc11d121e63d14 · a6e0bad26777e7b532864fe0d4bc11d121e63d14
- **Production outcome:** neutral
- **Reason:** Turn on the intended unattended controller/recovery cadence and capture the activation.
- **Components:** _records/run5-preparation/2026-10-02/schedule-activation.json
- **Previous behavior:** Daily/recovery schedules were not active for the new Run 5 attempt.
- **New intended behavior:** The existing daily and recovery schedule identities were activated and an immediate invocation requested.
- **Invariants affected:** reuse_existing_schedule_identity, no_duplicate_executor
- **Dependencies affected:** ChatGPT schedules, Run 5 bootstrap
- **Expected operational impact:** Start unattended execution using existing schedule slots.
- **Known risks:** Actual runtime surface could differ from the intended non-Work execution boundary.
- **Validation:** Protected PR #346 | schedule activation receipt
- **Rollback:** Disable the activated schedules without deleting their identities.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-009, DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-005 — Route qualified image requests to existing scheduled consumer

- **Category:** recovery
- **Changed:** 2026-10-02T06:23:45Z
- **PR / source / main:** #347 · 9a662e4c2b8f5a244efe3a148a6bec05a633f9c5 · 9a662e4c2b8f5a244efe3a148a6bec05a633f9c5
- **Production outcome:** unproven
- **Reason:** Let the repository-side worker queue a native image request for a qualified scheduled ChatGPT consumer.
- **Components:** _tools/native-image-worker.py, _generator/test/scheduled-image-routing.test.mjs
- **Previous behavior:** Missing local native capability was reported immediately.
- **New intended behavior:** Qualified requests may wait for the bound scheduled consumer without fabricated generation or acceptance.
- **Invariants affected:** queueing_is_not_execution, scheduled_consumer_must_be_qualified
- **Dependencies affected:** Supervisor, scheduled image worker
- **Expected operational impact:** Connect repository orchestration to the scheduled native-image surface.
- **Known risks:** Queued state could be misread as active execution or success.
- **Validation:** Protected PR #347 | scheduled routing regression tests
- **Rollback:** Revert PR #347 to fail closed on missing local capability.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-009, DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-006 — Pause prohibited scheduled execution after live runtime observation

- **Category:** schedule
- **Changed:** 2026-10-02T06:31:00Z
- **PR / source / main:** #348 · caa16eb85312eaede6b72b5af560d6fb9c5a20b2 · caa16eb85312eaede6b72b5af560d6fb9c5a20b2
- **Production outcome:** neutral
- **Reason:** Stop a schedule route that was observed using a prohibited Work/Codex execution surface.
- **Components:** docs/operations/DAILY-UNATTENDED-STARTUP.md, _records/image-trials/2026-10-02-scheduled/schedule-pause.json
- **Previous behavior:** The newly activated schedules could keep invoking the incompatible runtime.
- **New intended behavior:** The incompatible route was paused while evidence and Run 4 were preserved.
- **Invariants affected:** cost_boundary_fail_closed, prohibited_route_not_retried_blindly
- **Dependencies affected:** scheduled controller, image host admission
- **Expected operational impact:** Prevent policy-violating retries.
- **Known risks:** Pausing the entire controller can accidentally stop dependency-safe production work.
- **Validation:** Protected PR #348 | live runtime capability evidence
- **Rollback:** Re-enable only the affected schedule after a supported runtime path is proven.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-007 — Record repeated host-policy blocker and stop duplicate prohibited executions

- **Category:** schedule
- **Changed:** 2026-10-02T07:30:38Z
- **PR / source / main:** #349 · b87da6185660e3185020b9db789c4c6a9a9f4ba6 · b87da6185660e3185020b9db789c4c6a9a9f4ba6
- **Production outcome:** neutral
- **Reason:** Preserve a second scheduler observation and prevent repeated incompatible invocations.
- **Components:** _records/image-trials/2026-10-02-scheduled, data/operations/production-continuous-improvement-ledger.jsonl
- **Previous behavior:** Schedule reactivation could repeat the same prohibited route.
- **New intended behavior:** Repeated probes are stopped and the route remains explicitly blocked.
- **Invariants affected:** unchanged_prohibited_execution_must_not_repeat
- **Dependencies affected:** scheduled image host, recovery cadence
- **Expected operational impact:** Avoid wasted retries and preserve exact blocker evidence.
- **Known risks:** Stopping repeated probes must not stop unrelated safe work.
- **Validation:** Protected PR #349 | second scheduler observation
- **Rollback:** Resume only after a materially different supported route exists.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-008 — Make image-host blocker route-scoped instead of global

- **Category:** policy
- **Changed:** 2026-10-02T12:32:45Z
- **PR / source / main:** #350 · 3e97356f9f497fef7ffc2851e7a106dbf47d01f3 · 3e97356f9f497fef7ffc2851e7a106dbf47d01f3
- **Production outcome:** validated
- **Reason:** Restore liveness by separating image/publication admission from non-image run start.
- **Components:** _generator/lib/run-readiness.mjs, _tools/run-readiness.mjs, docs/operations/run-learning-readiness-contract.json
- **Previous behavior:** Missing image-host qualification stopped Run allocation and disabled liveness.
- **New intended behavior:** Task 00 may authorize non_image_production while image tasks and publication remain fail-closed.
- **Invariants affected:** route_specific_blocker_never_disables_global_liveness, cost_boundary_remains_fail_closed
- **Dependencies affected:** Task 00, Tasks 01-10, Tasks 11-29
- **Expected operational impact:** Allow useful safe work to continue without weakening image/publication gates.
- **Known risks:** Incorrect scope separation could accidentally authorize image or publication work.
- **Validation:** Protected PR #350 | run-readiness and unattended-run tests | Run 5 Tasks 00-10 completed
- **Rollback:** Revert PR #350 and restore the prior global start gate.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-010
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-009 — Point protected control plane at active Run 5

- **Category:** configuration
- **Changed:** 2026-10-02T12:51:48Z
- **PR / source / main:** #351 · 5f44ecbc03a4c335e86a0941c2b79c7ae1f4dbe1 · 5f44ecbc03a4c335e86a0941c2b79c7ae1f4dbe1
- **Production outcome:** validated
- **Reason:** Make protected main identify the exact nonterminal Run 5 execution for watchdog/supervision.
- **Components:** data/operations/active-production-run.json
- **Previous behavior:** The protected control plane did not point at the current Run 5 identity.
- **New intended behavior:** Main now points to the exact Run 5 branch, execution ID and edition.
- **Invariants affected:** single_active_production_run, resume_exact_same_execution
- **Dependencies affected:** watchdog, Supervisor
- **Expected operational impact:** Allow automated recovery to locate and resume Run 5.
- **Known risks:** A stale pointer could direct recovery to the wrong execution.
- **Validation:** Protected PR #351 | subsequent watchdog/Supervisor runs resolved Run 5
- **Rollback:** Restore the previous active-run pointer only if that execution is again authoritative.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** none
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-010 — Keep Run 5 Supervisor writer fence alive

- **Category:** recovery
- **Changed:** 2026-10-02T13:44:54Z
- **PR / source / main:** #352 · 32b0efb2f80b6fd4808fa8086fc06472505ac810 · 32b0efb2f80b6fd4808fa8086fc06472505ac810
- **Production outcome:** validated
- **Reason:** Prevent same-owner recovery heartbeats from shortening a healthy long-lived writer lease.
- **Components:** .github/workflows/run-supervisor.yml, _generator/lib/run-supervisor.mjs, _generator/test/run-supervisor.test.mjs
- **Previous behavior:** Same-owner renewal could replace a six-hour expiry with a shorter expiry and the loop asserted before renewing.
- **New intended behavior:** Same-owner renewal is monotonic and each loop renews before fence assertion.
- **Invariants affected:** same_owner_heartbeat_never_shortens_writer_fence, supervisor_renews_before_fence_assertion
- **Dependencies affected:** writer lease, Supervisor loop
- **Expected operational impact:** Prevent healthy Supervisors from failing with WRITER_LEASE_EXPIRED.
- **Known risks:** Lease takeover rules must still reject different-owner stale writers.
- **Validation:** Protected PR #352 | deterministic CI run 37014908589 | same Run 5 resumed
- **Rollback:** Revert PR #352 to the prior lease semantics.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-011
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-011 — Record verified Run 5 Supervisor repair outcome

- **Category:** observability
- **Changed:** 2026-10-02T13:49:10Z
- **PR / source / main:** #353 · 2c329a333391350dafb44149178a4eee0eb5d931 · 2c329a333391350dafb44149178a4eee0eb5d931
- **Production outcome:** neutral
- **Reason:** Persist the protected-CI and same-run validation outcome into cumulative operational learning.
- **Components:** data/operations/production-continuous-improvement-ledger.jsonl, docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md
- **Previous behavior:** The lease repair outcome existed in runtime evidence but was not yet reflected in the canonical learning baseline.
- **New intended behavior:** The verified outcome and next-run validation are part of the canonical learning record.
- **Invariants affected:** material_fix_outcomes_are_durable
- **Dependencies affected:** Task 00 learning inheritance
- **Expected operational impact:** Ensure future runs inherit verified repair evidence.
- **Known risks:** Documentation may lag runtime if not updated in the same recovery cycle.
- **Validation:** Protected PR #353 | ledger validation
- **Rollback:** Revert the learning-only commit; runtime behavior is unchanged.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-011
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-012 — Make bounded PNG chunk transport executable

- **Category:** recovery
- **Changed:** 2026-10-02T14:25:16Z
- **PR / source / main:** #354 · 76d9f952bed6c0b9b9f411ccabd22720652d0513 · 76d9f952bed6c0b9b9f411ccabd22720652d0513
- **Production outcome:** unproven
- **Reason:** Turn the documented binary fallback into a fenced executable transport path.
- **Components:** _generator/lib/image-chunk-bridge.mjs, _tools/image-chunk-bridge.mjs, .github/workflows/run-supervisor.yml
- **Previous behavior:** Direct create_blob failure left only a documented but non-executable chunk fallback.
- **New intended behavior:** The Supervisor can reconstruct bounded Base64 chunks, verify identities, persist PNG bytes and clean temporary chunks.
- **Invariants affected:** small_png_chunk_bridge_is_executable, transport_success_does_not_self_certify_visual_quality
- **Dependencies affected:** image worker, Supervisor, Git persistence
- **Expected operational impact:** Prevent visually valid generated images from becoming stranded by connector payload limits.
- **Known risks:** The live path remains unproven until a visually valid candidate actually requires the bridge.
- **Validation:** Protected PR #354 | deterministic CI run 37019748073 | chunk bridge regression tests
- **Rollback:** Revert PR #354 and block on direct binary transport only.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-012
- **Confirmed resulting problems:** none confirmed

## DAB-CHG-20261002-013 — Harden Run 5 recovery learning and incident contracts

- **Category:** policy
- **Changed:** 2026-10-02T14:51:47Z
- **PR / source / main:** #355 · cd8329af736cab7d0aae05df306b329a142a00f6 · cd8329af736cab7d0aae05df306b329a142a00f6
- **Production outcome:** validated
- **Reason:** Make material learning completeness, machine-readable recovery, current-fence handoff and pseudo-text rules explicit.
- **Components:** docs/operations/run-learning-readiness-contract.json, docs/operations/LIVING-SYSTEM-OPERATIONS.md, data/operations/production-continuous-improvement-ledger.jsonl
- **Previous behavior:** Several Run 5 lessons existed only in live recovery reasoning or incomplete schemas.
- **New intended behavior:** The production baseline explicitly requires complete incident records, canonical recoverable blockers, execution-time writer authority and pseudo-text rejection.
- **Invariants affected:** learning_is_part_of_recovery, recoverable_blocker_must_be_machine_readable, scheduled_worker_refreshes_fence_at_execution, pseudo_text_counts_as_visible_text
- **Dependencies affected:** Task 00, Supervisor, scheduled image worker, image review
- **Expected operational impact:** Reduce recurrence and make recovery behavior diagnosable from durable evidence.
- **Known risks:** Policy documentation alone is insufficient until corresponding code/tests exist for schema normalization and handoff automation.
- **Validation:** Protected PR #355 | deterministic publication CI run 37022724576
- **Rollback:** Revert PR #355 documentation/contract changes without changing already durable incident history.
- **Last known-good baseline:** reliable-edition-20261001-run4 @ 17918ed14683be96ee361da810f127097769f946
- **First exposed run:** reliable-edition-20261002-run5
- **Related problems:** DAB-OPS-20261002-013, DAB-OPS-20261002-014, DAB-OPS-20261002-015
- **Confirmed resulting problems:** none confirmed

