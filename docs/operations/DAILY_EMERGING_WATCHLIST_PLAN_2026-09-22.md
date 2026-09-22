# Daily Emerging Watchlist Discovery Plan — 2026-09-22

## Problem

The September 22 review exposed a detection gap: Jev/System One decision models accumulated meaningful technical and YouTube attention after a September 15 launch, but the Watchlist's daily process concentrated too heavily on the registered source set and existing topics. A current Watchlist date therefore did not prove that genuinely new concepts had been sought.

## Objective

Beginning with the September 23 edition, every daily publisher run must perform a bounded emerging-concept sweep that can discover unfamiliar model families, architectures, agent patterns, evaluation methods, infrastructure changes, developer tooling, interfaces, safety/security techniques, and knowledge-worker workflows.

## Executed controls

1. Add a machine-readable emerging-signal policy with six required discovery surfaces: primary research, frontier/small labs, open source, technical communities, broad web, and the YouTube creator ecosystem.
2. Keep automated source acquisition, but explicitly require assisted broad-web and YouTube searches because those surfaces are not reliably covered by static publisher endpoints.
3. Review at least six concept classes each day and use a seven-day primary lookback plus a fourteen-day missed-signal lookback.
4. Preserve the Watchlist evidence standard: one credible original development may create an `early_signal`; popularity is a discovery signal, not validation.
5. Require a dated receipt at `_records/watchlist-sweeps/YYYY-MM-DD.json` from September 23 onward.
6. Make repository tests fail future publication when the receipt is absent, invalid, or inconsistent with the Watchlist's new/updated topic IDs.
7. Make a zero-new claim fail closed unless all six required surfaces completed, at least three candidate concepts were reviewed, the fourteen-day missed-signal check completed, and a substantive written justification is present.
8. Add broad-web and creator-ecosystem channels to the early-signal registry and bind the policy into the under-80 runtime contract and production-run checkpoint inputs.

## Daily execution

The existing single publisher remains the only semantic AI task. The emerging sweep is folded into that same pass after deterministic preflight evidence is ready; it does not create a second daily AI validator or a new paid service. Search is bounded by the machine policy. Candidate popularity, views, stars, reposts, and discussion volume can trigger investigation but cannot independently advance a topic.

## Success metrics

Track daily: required-surface completion, candidate concepts reviewed, new topics, updated topics, missed signals discovered after initial launch, first-detection lag from original evidence, source-family diversity, and rejected-candidate reasons. Review false positives and misses after fourteen completed editions.

## Failure behavior

A source outage is recorded as degraded; it is never represented as a successful review. A run may not certify “0 new” while any required surface is degraded. The system must either complete targeted recovery or carry a clearly unresolved Watchlist discovery state into publication handling under the existing freshness policy.
