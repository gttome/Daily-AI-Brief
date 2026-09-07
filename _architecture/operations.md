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

## Known limitations

- Legacy briefs lack some evidence/status fields and show `Unspecified` in the archive.
- Client-side aggregate analytics is directional, not audited audience measurement.
- Jekyll build evidence is produced in GitHub CI rather than the local Work runtime.
