# Podcast extension release status

Implementation is prepared; the complete feature is not yet live.

## Completed checks

- 66 generator tests passed, including unlimited podcast duration, unchanged video limit, duplicate source rejection, reader surfaces, feeds, and aggregate-counter separation.
- 15 contract/example checks passed.
- Repository validation and integrated canonical-to-generated parity passed.
- 19 Command Center tests and its static/accessibility/security audit passed.
- Ratings service build passed and its podcast-compatible version was deployed. Existing origin restrictions, privacy controls, and duplicate-share protection were retained.
- Podcast-aware Command Center version 11 is saved but not deployed.

## Pending release

Automatic approval review rejected the GitHub push because it did not consider implementation permission sufficient authorization to publish code to GitHub. Do not retry or use a different write mechanism without explicit approval.

After approval, refresh main and reconcile changes, rerun affected checks, push the candidate branch, open a pull request, wait for deterministic CI and Jekyll, verify the baseline, and merge atomically. Verify Pages, the ninth slot, permanent podcast page, archive/feed entries, and canonical share/rating identifiers. Append final live QA evidence to the existing dated QA trail.

Deploy the saved Command Center version 11 privately after confirming the published data. Update the existing Daily AI Brief + QA publisher prompt with the repository's `docs/podcasts/publisher-policy.md` requirements, preserving the current schedule and every unrelated requirement. Do not enable a second publisher or alter paused tasks. Confirm prompt persistence and include podcast gates in all subsequent runs.

The source portfolio and launch candidate evidence are in `docs/podcasts/source-research.md`, `_data/podcast-sources.json`, and `_records/editorial/podcasts/2026-09-09.json`.
