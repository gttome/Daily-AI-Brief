# P1 + P2 Autonomous Control Plane — Final Implementation Record

**Plan date:** October 6, 2026  
**Source production execution:** `reliable-edition-20261006-run10`  
**Result:** **PASS / NEXT PRODUCTION GO**  
**Final integrated code main:** `6f5b1a439d4088af6c284e28c8201842ce3b8468`  
**Final protected-main CI:** run `37545132702` — PASS  
**Integrated rehearsal:** run `37545271745` — PASS

## Outcome

All six required P1/P2 changes are merged to protected `main`. The completed October 6 production run was never reopened, no accepted October 6 image was regenerated, and no historical production evidence was rewritten. The final non-production rehearsal exercised the merged cross-component control path and all ten required fault injections.

The production runtime dependency boundary is unchanged: **0 Work, 0 Codex, 0 paid-model API, 0 owner liveness prompts**. Development evidence may use explicitly permitted development tooling, but no such capability is required by production.

## Implemented architecture

| Work package | Permanent behavior | PR | Merge |
|---|---|---:|---|
| WP-01 / P1-E | Production candidates reject unrelated hardening; hardening/repair work is isolated and queued | #495 | `a78fd3248609da12ba17b9f089ad2d1725a41407` |
| WP-02 / P1-A | Durable substantive transition events drive idempotent dispatch; Watchdogs are fallback recovery | #496 | `744b34deacb6215484e8e428b8f65e3b8bc4eef3` |
| WP-02 repair | Corrected malformed Supervisor workflow env serialization | #498 | `fb158509308e68f123a0b305cfd77d8b7a8f8d37` |
| WP-03 / P1-B | Tasks 11–16 use one admission→generation→persistence→review→accepted_locked→next-event contract | #497 | `e969d067b85dcae84b98ad62ed538207be2e1665` |
| WP-04 / P1-C | Task 17 validates normalized registered persistence evidence; pre-run compatibility matrix is required | #499 | `ec0208dd2fd964e506cf5512e346c5f0468a6f00` |
| WP-05 / P1-D | Deterministic publication prerequisites must pass before any publication PR opens | #500 | `a85bd5671fac02b677447766281e05384ba21843` |
| WP-06 / P2-A | Exact live verification triggers deterministic atomic Tasks 27–29 closeout with incident reconciliation | #501 | `13cbf5449fe411fd199b81ceef3ef1e5bc0dbd0a` |
| WP-07 | Integrated final-main rehearsal and ten mandatory fault injections | #502 | `6f5b1a439d4088af6c284e28c8201842ce3b8468` |

## Protected exact-head CI

Every implementation/repair PR passed deterministic CI on its final unchanged head: #495 run 37537872636; #496 run 37538752673; #497 run 37539879807; #498 run 37540179070; #499 run 37541051339; #500 run 37541491861; #501 run 37542151088; #502 run 37544820314. Final integrated protected-main CI run 37545132702 passed.

## Image proof

The integrated rehearsal uses synthetic exact bytes to test the merged state machine safely. Real native generator→Git evidence is separately bound to the October 2 non-production development trial under `_records/image-trials/2026-10-02-six-image/`: seven built-in image-generation calls produced six accepted images, exact Git tree binding was verified, and recovery read the persisted assets from Git without regeneration.

That development trial records `work_or_codex_session_used: true`; this is development-only evidence and **not** a production dependency. Production remains 0 Work/Codex/paid API.

## Integrated rehearsal

Rehearsal run 37545271745 passed the required path:

1. non-production allocation fixture;
2. Task 00→01 transition;
3. event-driven idempotent dispatch;
4. image admission;
5. exact-byte persistence/readback;
6. automatic next-image transition;
7. mixed-mode Task 17;
8. deterministic Tasks 18–22 progression;
9. Task 23 pre-PR gate;
10. candidate freeze;
11. final-main protected-CI equivalent;
12. live-verification fixture;
13. atomic Tasks 27–29 closeout;
14. incident reconciliation;
15. terminal pointer state.

All ten required fault injections passed: duplicate transition, expired writer, worker loss after durable output, delayed review after exact-byte persistence, mixed Task 17 locks, stale main ancestry, Watchlist mismatch, learning-ledger mismatch, crash after every atomic closeout write, and duplicate closeout.

## Rehearsal control metrics

- transition events: 7
- event dispatches: 7
- duplicate dispatch no-ops: 1
- Watchdog invocations: 11
- compact exits: 10
- expanded reads: 1 (9.1%)
- Supervisor reconcile loops: 0
- heartbeat-only commits: 0
- wake PRs: 0
- Task 17 fixture runtime: 0.005s
- Task 17 repairs: 0
- Task 23 repairs: 0
- protected publication CI runs in clean fixture: 1
- closeout AI calls: 0
- owner liveness prompts: 0

## Before/after mechanism comparison

October 6 took 12h53m, used 15 in-run repair/control PRs before publication, had a ~93.5-minute Task 15 image cycle, ~31 minutes from first Task 17 wake to completion, and ~1h54m from Task 22 completion to Task 23 completion. Account-level usage cannot be reconstructed exactly from repository evidence.

The integrated proof removes the specific mechanisms targeted by this program: normal reconcile loops, pointer-only wake PRs, Task 17 runtime persistence discovery, post-PR deterministic Task 23 contract repair, production-branch hardening contamination, and AI-driven post-live closeout.

The plan's 70–90% avoidable-control-plane usage reduction remains a **target**, not a measured claim. Actual production performance must be measured on the next edition.

## Remaining risks / next-run measurements

These are measurements, not GO blockers: production image-lane <=90 minutes; Task 17 <=5 minutes; live verification→PUBLIC_CLOSED <=15 minutes; Watchdog expanded-read rate <=10%; and actual production usage comparison against the October 6 baseline.

## Admission

**GO** for the next production edition once this final reconciliation is merged to protected `main` and its post-merge deterministic CI passes. Any deterministic gate regression before allocation converts this to NO-GO until repaired.

The system no longer relies on an owner liveness prompt for normal progression or routine internal recovery.
