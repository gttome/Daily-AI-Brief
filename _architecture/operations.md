# Daily AI Brief Operating Procedures

## Daily publication

1. Create one canonical edition with exactly six stories in ordered 2/2/2 allocation, one 20–30 candidate pool, refreshed 30-day story memory, six dated assets, and a six-story accessibility review.
2. Run tests, contracts, repository validation, and the integrated check from the staging branch.
3. Dispatch the atomic publisher. It stages canonical inputs, derives every page/feed/index/record, builds Jekyll, confirms the baseline SHA, and updates `main` once.
4. Verify main CI, Pages, homepage, dated brief, archive, six story routes, feeds, QA, and Trend Radar.
5. Append QA/publication evidence. Never rewrite a correction or incident ledger entry.

## Incident handling

- Missing source, asset, stale date, duplicate, allocation, feed, or Critical/High accessibility failure blocks before commit.
- Counter transport outage records analytics as `partial` or `unavailable`; publishing continues because reader content is independent of analytics.
- Concurrent main movement aborts the candidate. Rebuild from the new baseline.
- Pages failure creates a degraded state and invokes the documented rollback decision; it is never reported as success.
- Alert fingerprints deduplicate repeated failures and produce one recovery update.

## Rollback

Create a new rollback commit from the last verified target; never reset or delete history. Preserve failed canonical and operational evidence, validate the restored tree, deploy Pages, and append the rollback/incident event. Iterations 3–6 use `39638bef649813f33b2dd172513164c15dadd83d` as the pre-change rollback target.

## Analytics and feedback

Analytics stores aggregate counters only, suppresses story counts below five, and states transport limitations. Monthly feedback remains pending until owner approval. Feedback cannot override novelty, evidence, source, accessibility, or 2/2/2 gates.

Personal Editorial Learning uses explicit anonymous daily ratings from compact controls beneath each story on the homepage, dated brief, and permanent shared-story page. George is the primary reader, while recipients of shared stories may contribute independently to the same aggregate. The Share control includes the share count but never transfers a sender's browser-local rating in the URL. Passive views/clicks remain secondary. The analytics workflow refreshes seven canonical editions and reevaluates learning automatically. Inline ratings may recommend only practical_value ±10%; category_fit requires richer explicitly approved owner feedback. No weight activates without George’s approval. Do not request approval until the state reports five completely rated editions, 30 ratings, ten ratings per focus, and five passing candidate-set shadow comparisons. Approved weights fail closed after ten editions or immediately on any configured rollback trigger.

## Daily book-change proposal evaluation

Every completed Brief must receive an owner-only Generative AI Professional Series book-change evaluation after the final published edition is known.

- Evaluate every included article, video, and podcast independently for whether the evidence warrants a material revision, expansion, example, checklist, exercise, diagram, or other teaching asset in a Series book.
- Keep this evaluation separate from reader-facing book bridges. A reader bridge can be appropriate without a book change, and a book change can be warranted even when no reader bridge is shown.
- Create private Command Center proposals only when the evidence clears the material-change threshold. Deduplicate against the existing private backlog and preserve prior approval/rejection state.
- Record an explicit daily outcome in the private Command Center: either `N proposals generated` with the evaluated edition date, or `0 proposals — all included items evaluated; no material book change warranted`.
- A missing outcome is a failed/incomplete Command Center synchronization, not evidence that there were zero proposals.
- If the edition is repaired or republished after the initial evaluation, rerun the book-change evaluation against the final production state before operational closure.
- Book-change proposals remain owner-only. Do not create a public proposal queue or expose proposal contents in public repository outputs.

Operational closure for a daily Brief therefore requires both publication validation and a recorded private book-change evaluation result.

## Known limitations

- Legacy briefs lack some evidence/status fields and show `Unspecified` in the archive.
- Client-side aggregate analytics is directional, not audited audience measurement.
- Jekyll build evidence is produced in GitHub CI rather than the local Work runtime.


## Efficiency workflow
For new editions, follow _architecture/efficiency-refactor/research-workflow.md and the phase checkpoint instructions. Discover metadata broadly, review uncertain dates and novelty, deep-read serious candidates, and reuse traceable evidence packets. Use the compact 30-day index, incremental Watchlist checks, and durable checkpoints without bypassing editorial or publication gates.
Publication staging emits a generation-only efficiency record. Supply measured research telemetry through generate --efficiency when available. After the actual publication and live QA finish, record a new publication_complete efficiency record with actual start/end boundaries and independent public QA, overall coverage, private operations and delivery statuses using _tools/efficiency-report.mjs record --file. Do not relabel the staged record complete or overwrite it.
Raw account allowance readings remain private. Unknown fields remain null. Never infer full-text retrieval from catalog-link discovery, exact tokens from characters, or delivery failure when delivery is disabled by choice.
