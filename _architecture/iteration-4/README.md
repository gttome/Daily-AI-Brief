# Iteration 4 — Measurement & Accessibility

Status: PASS
Scope: improvements #8, #11, #14 and #16

The public QA page is generated from versioned machine-readable QA records and reports first-pass rate, final-pass rate, repairs, deploy latency, and deterministic/editorial check counts. The analytics client records only aggregate story events—views, source clicks, share initiations, video clicks, and 30-second retention—with no names, emails, cookies, persistent reader identifiers, page content, or raw request records stored in the repository. Counts below five are suppressed in story-level public records.

The current transport is intentionally documented as directional: blockers, bots, and replay can affect any client-side aggregate. Collection failures become `partial` or `unavailable`, never a misleading zero-count success.

Accessibility QA blocks missing alt text and broken assets, records contrast/link findings, and requires a six-story editorial alt review. Every current story now contains a decision-oriented “What to do now” action.
