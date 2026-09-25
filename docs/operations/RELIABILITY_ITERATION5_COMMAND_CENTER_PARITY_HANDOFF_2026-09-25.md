# Daily AI Brief Command Center — Iteration 5 Parity Handoff

**Prepared:** September 25, 2026  
**Production system only:** `gttome/Daily-AI-Brief`  
**Existing Command Center only:** `https://daily-ai-brief-command-center.gtome.chatgpt.site/`  
**Do not modify:** the separate Sites Command Center or `gttome/New-Daily-AI-Brief`.

## Mission

Close the single residual Iteration 4 acceptance item: prove that the existing live Daily AI Brief Command Center consumes and displays the exact canonical v2 publication status for September 25, 2026.

This is a **Site-side parity verification/synchronization task only**. All GitHub-side implementation is already complete. Do not repeat repository analysis, rebuild the Brief, or change publication state from the Site.

## Canonical source

Repository source of truth:

`data/operations/publication-status.json`

Required canonical values:

```text
edition_date: 2026-09-25
lifecycle_state: COMPLETED
production_sha: ed3344500a630fc44b04fc48211c027a344a8c6b
deployed_sha: ed3344500a630fc44b04fc48211c027a344a8c6b
completion.state: verified
live_reader.state: verified
command_center_sync: pending
consistency.state: pass
```

GitHub-side read-only refresh evidence:

```text
refresh workflow run: 36183470294
refresh artifact: 10885301039
canonical status digest: sha256:7e46cc76f1886699e9ef438504f3861f0b61182aca3186da455dcaa1c957d684
```

## Required live parity

After the Site refresh, verify the live Command Center shows values exactly equivalent to:

```text
repository canonical edition = Command Center edition
repository lifecycle/operator state = Command Center lifecycle/operator state
repository production SHA = Command Center production SHA
repository deployed SHA = Command Center deployed SHA
repository completion state = Command Center completion state
repository live-reader state = Command Center live-reader state
```

Also verify:

- no stale prior edition is presented as current;
- no failed refresh is labeled successful;
- no timestamp or fallback-date inference is used;
- no `Verified fallback` or equivalent ambiguous state is shown;
- the Site refresh does not mutate publication state;
- the exact canonical status digest is retained as the synchronization source identity.

## Required synchronization receipt

Only after exact parity is observed, create/return a receipt with this shape using the **actual** synchronization time:

```json
{
  "schema_version": "1.0.0",
  "result": "pass",
  "source_edition": "2026-09-25",
  "source_production_sha": "ed3344500a630fc44b04fc48211c027a344a8c6b",
  "source_deployed_sha": "ed3344500a630fc44b04fc48211c027a344a8c6b",
  "source_status_sha256": "sha256:7e46cc76f1886699e9ef438504f3861f0b61182aca3186da455dcaa1c957d684",
  "synchronized_at": "<actual ISO-8601 time>"
}
```

If any parity field cannot be proven, do **not** produce a passing receipt. Report the mismatch and leave repository `command_center_sync` pending.

## GitHub-side follow-through after a valid receipt

Persist the exact receipt under the existing protected repository path, for example:

`_records/command-center/2026-09-25-sync-receipt.json`

Then use the existing lifecycle command through a protected PR:

```text
node _tools/publication-lifecycle.mjs mark-cc-synced
  --date 2026-09-25
  --receipt _records/command-center/2026-09-25-sync-receipt.json
```

The command validates the receipt against the current canonical status digest before advancing `COMPLETED` to `CC_SYNCED`. Never hand-edit lifecycle or `publication-status.json`.

## Stop condition

If Site authorization or the live Command Center consumer cannot be inspected/updated, stop with the synchronization state still pending. Do not guess parity and do not fabricate a receipt.
