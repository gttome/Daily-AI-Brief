# Q20 feed recovery — 2026-09-28

## Evidence, not another speculative shortlist change

Q20 remains terminal FAIL. D01 (`qualification-diagnostic/2026-09-28-D01`, workflow `36445276484`) established full eligible-pool coverage of 29 Technical / 1 Applied / 2 Agents after novelty, versus retained coverage 13 / 1 / 2. The Applied/Agents shortage exists before shortlist selection. D01 is diagnostic evidence, not a qualification pass and not a Q20 rerun.

D02 (`qualification-diagnostic/2026-09-28-D02`, workflow `36445745499`) tested six feed endpoints. The registered Google Workspace feed returned 25 XML entries, redirected to `http://feeds.feedburner.com/GoogleAppsUpdates`, and yielded zero candidates both before and after compaction. The body contained HTTP links. Direct Blogger feed variants returned the identical feed body. Atlassian's configured feed instead returned HTML; changing its query form did not improve the tested result. No endpoint replacement has been made on that unproven basis.

## Smallest verified code defect and correction

The metadata extractor rejects HTTP article URLs before normalization. `publisherFeedUrl` permits upgrading an HTTP URL only when its exact hostname matches the original registered HTTPS discovery endpoint. User information, nondefault ports, lookalike domains, unrelated HTTP hosts, and non-web schemes remain rejected. All emitted candidate URLs are HTTPS. This does not declare an article verified: source retrieval, original publication dates, novelty, relevance, editorial review, and normal evidence gates still apply.

The change retains the 72-hour ordinary freshness window, Agent Skills policy, three-candidate focus minimum, 20-item model-visible metadata limit, nine-item article evidence limit, and exact 2/2/2 editorial allocation. No source dates or article bodies are manufactured. Main publication artifacts, accepted images, prior Q identities, and PR #117 are untouched.

## Verification and continuation

Nine regression tests cover URL boundaries and Atom/RSS extraction, including compaction and unchanged publication timestamps. Six pure URL-boundary tests passed locally; protected repository CI runs the complete integration suite. Merge only after protected CI is green. Start the next unused full Q from the merged baseline with an observed current UTC cutoff; do not reopen Q20.

This patch corrects a demonstrated feed-loss mechanism. It does not yet prove that all remaining fresh-source coverage requirements are satisfied. The next Q is the live integration proof. If coverage still fails, retain its exact result and continue targeted diagnostics rather than repeatedly making ranking changes or changing quality thresholds.

The operational priority is qualification testing and verified repairs, not further cleanup. Diagnostic results must be read as diagnostic results, never as full-run PASS. No Work, Codex, or paid model API execution is authorized; account billing remains unobserved.
