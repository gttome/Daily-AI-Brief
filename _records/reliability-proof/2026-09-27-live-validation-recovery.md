# September 27 live validation recovery

Status: recovery_stalled

The 08:30 secondary validator detected a production metadata-novelty gate defect before the editorial stage. Prior-edition source URLs were still admitted as production candidates. The current-day preflight/readiness artifacts are therefore invalidated from metadata selection forward; the September 26 live edition remains preserved.


## Secondary recovery update

- Baseline protected `main`: `96a0b3127eab0cfed72e980ff64998961c176791`.
- Current public edition remains September 26; canonical completion points to production/deployed SHA `10e9d2ac8601243cf0fcdb4698a5f1dc771bfe4b`.
- Current-day preflight/readiness evidence is invalid from metadata selection forward because prior-edition source URLs were admitted.
- Permanent correction is implemented on this branch in commit `2a1f4a7ab8c66dfa530b01d6b4797c21d4ede3db`: production novelty filtering now excludes already-published URLs unless a verified material update is newer than the prior published source event.
- Living operations documentation was synchronized on this branch in commit `8d1d6c02853c2ce97fc60068b050f29ed44e75a2`.
- Protected promotion is blocked at PR creation: the connected GitHub create-pull-request action was rejected by the tool safety layer despite explicit recovery authorization. No protected-CI bypass was attempted.
- Required next action: open this branch as a non-draft PR to `main`, require protected CI, merge only after success, then rerun only metadata preflight → discovery/article evidence → readiness → editorial and downstream publication.
- Last valid live edition remains preserved; no production content mutation occurred.
