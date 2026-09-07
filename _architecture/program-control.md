# Autonomous Improvement Program Control

Authority: user-authorized autonomous execution of Iterations 1–6 and Gate 7.  
Final approval: required before any Command Center implementation.  
Authoritative requirements: `Daily_AI_Brief_17_Improvements_Implementation_Roadmap(1).docx`.

Governance override, 2026-09-07: the user explicitly removed both seven-day elapsed-time requirements. The roadmap's technical scope and acceptance criteria remain authoritative, but Iteration 1 and Gate 7 now use evidence-based immediate gates. This override does not waive QA, production smoke evidence, or final user approval.

## Operating rules

1. Run every iteration as Understand → Plan → Implement → QA → Gate.
2. Correct ordinary defects without requesting user input.
3. Pause only for an irreversible change, material cost, security/privacy decision, unavailable permission, or an unfixable blocker.
4. Preserve existing public URLs, archive history, and working behavior.
5. Do not advance merely because code exists; require the roadmap's acceptance and production evidence.
6. Keep the active publisher in its last proven mode until the current iteration's cutover criteria pass.
7. Keep the Command Center blocked until every improvement passes seven consecutive live production editions and the user gives final approval.

## Ordered gates

| Stage | Scope | Required gate evidence |
|---|---|---|
| Iteration 1 | #1, #2, #3, #7 | Comprehensive parity, atomicity, replay, rollback, failure-injection, CI and live-smoke tests; no partial publication; deduplicated failure and recovery alert evidence |
| Iteration 2 | #4, #5, #6, #9 | Prior 30-day backtest; repeat prevention; explicit score explanations; consistent evidence/status labels; append-only correction behavior |
| Iteration 3 | #10, #12, #13 | Existing URLs preserved; story-specific social metadata; validated search/deep links/mobile behavior; valid XML and JSON feeds |
| Iteration 4 | #8, #11, #14, #16 | Controlled analytics counts and privacy review; accurate public QA trends; operational accessibility severity policy; action on every story |
| Iteration 5 | #15, #17 | Every trend links to dated evidence; explainable monthly feedback cannot override evidence or novelty gates |
| Iteration 6 | all 17 | End-to-end regression, performance, failure injection, rollback and operating documentation; zero unresolved Critical/High defects; stable schemas |
| Gate 7 | all 17 live | Comprehensive end-to-end production-readiness validation and live smoke evidence; no silent drift or unsupported metric; complete readiness checklist |

## Production readiness checklist

- All 17 improvements are active in production.
- A complete live Daily Brief publication passes atomicity, CI, Pages, QA, parity, feed, analytics, accessibility, and rollback-readiness checks.
- Canonical edition, generated pages, feeds, QA, and analytics agree.
- Novelty memory has no known false-negative repeat during burn-in.
- CI and QA distinguish deterministic checks from editorial judgment.
- Analytics and QA records use stable versioned schemas.
- Story pages, archive search, feeds, and accessibility checks pass mobile and desktop validation.
- Incident and correction ledgers are append-only and traceable.
- Operational alerts are useful and deduplicated.
- Every high-impact change has a documented rollback path.

Only after every item is evidenced may the program request final user approval. No elapsed-time minimum applies. The approval request must be: `APPROVE FINAL GATE 7 or REJECT FINAL GATE 7?`
