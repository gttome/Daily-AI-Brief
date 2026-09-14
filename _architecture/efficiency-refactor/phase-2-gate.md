# Phase 2 checkpoint evidence

Phase 1 checkpoint: c3b0a13abc2dc55dbdf7ce98b4e3dc25a1d42c92 (tree ad7e9a94fd964fdc8e91a38a014f7c041119ef94). 118 tests and 15 contracts passed; archive replay and canonical parity passed. Production savings remain unmeasured.

Compact memory: `node _generator/cli.mjs novelty-index --date YYYY-MM-DD --cache <private-local-index.json>` returns a 30-day compact record set. `novelty-query --file candidate.json` uses the unchanged source/concept thresholds and identifies historical evidence to reopen. Missing/corrupt cache or changed parser/content forces rebuilding affected records. The full backtest is compared exactly with the compact backtest.

Watchlist: the existing discovery command checks due sources, retains successful source history through failures, uses body fingerprints to avoid reprocessing unchanged catalogs, and retains current verified topic content. State lives in _data/watchlist-source-state.json; append-only discovery records retain every invocation. A --full-sweep option forces all catalog checks. Assisted-review sources are placed on a seven-day review interval; failed automatic sources use bounded backoff up to 24 hours. Daily sources remain daily, explicitly weekly sources remain weekly, and high_velocity sources can be checked every six hours.

Schedule inspection: the repository has a consolidated daily freshness workflow, not a daily research scheduler. No GitHub or Work schedule was added or altered. These intervals govern the next invocation of the existing discovery process; they are not new scheduled jobs. The existing Work maintenance process must honor next_check_at and perform the explicit assisted review. Public Watchlist topics and routes are never rebuilt by the discovery command.

Quality: failures remain degraded, no-link results remain distinct from failed retrievals, and retained/not-due sources never count as checks today. All current reader routes and eight-topic content remain unchanged. Compact-index output preserves every field used by the existing novelty algorithm; full evidence remains available for ambiguity.
