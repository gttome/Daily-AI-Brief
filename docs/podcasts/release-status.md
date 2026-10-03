# Podcast extension release status

Released September 10, 2026. The podcast launch is live in the September 9 edition.

## Completed checks

- 66 generator tests passed, including unlimited podcast duration, unchanged video limit, duplicate source rejection, reader surfaces, feeds, and aggregate-counter separation.
- 15 contract/example checks passed.
- Repository validation and integrated canonical-to-generated parity passed.
- 19 Command Center tests and its static/accessibility/security audit passed.
- Ratings service build passed and its podcast-compatible version was deployed. Existing origin restrictions, privacy controls, and duplicate-share protection were retained.
- Podcast-aware Command Center version 11 was saved during preparation and subsequently deployed as recorded below.

## Release evidence

- User explicitly approved GitHub publication, Command Center deployment, and revised instructions.
- [PR 48](https://github.com/gttome/Daily-AI-Brief/pull/48) merged as `1eb18e7775df05592397e3aa6c9e074c2e35fe09`.
- [Production CI](https://github.com/gttome/Daily-AI-Brief/actions/runs/34463075179) and [Pages deployment](https://github.com/gttome/Daily-AI-Brief/actions/runs/34463074393) passed.
- Live homepage and dated edition return HTTP 200 with nine rating groups; permanent podcast page returns HTTP 200 with one group.
- Feed and archive index include the podcast stable ID.
- Command Center version 11 deployed successfully with owner-only access.
- Daily publisher and combined Command Center validation instructions were updated and read back exactly; schedules and enabled states were preserved.

## Original release checkpoint (retained history)

Automatic approval review rejected the GitHub push because it did not consider implementation permission sufficient authorization to publish code to GitHub. Do not retry or use a different write mechanism without explicit approval.

After approval, refresh main and reconcile changes, rerun affected checks, push the candidate branch, open a pull request, wait for deterministic CI and Jekyll, verify the baseline, and merge atomically. Verify Pages, the ninth slot, permanent podcast page, archive/feed entries, and canonical share/rating identifiers. Append final live QA evidence to the existing dated QA trail.

Deploy the saved Command Center version 11 privately after confirming the published data. Update the existing Daily AI Brief + QA publisher prompt with the repository's `docs/podcasts/publisher-policy.md` requirements, preserving the current schedule and every unrelated requirement. Do not enable a second publisher or alter paused tasks. Confirm prompt persistence and include podcast gates in all subsequent runs.

The source portfolio and launch candidate evidence are in `docs/podcasts/source-research.md`, `_data/podcast-sources.json`, and `_records/editorial/podcasts/2026-09-09.json`.
