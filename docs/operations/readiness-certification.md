# Daily Brief Readiness Certification

<!-- current-authority-oct4 -->
> [!IMPORTANT]
> **Current schedule authority is not the 05:45 / 06:45 / 07:00 sequence below.** Current production starts at **19:00 America/Chicago on the evening before the edition date** under [Daily unattended startup](DAILY-UNATTENDED-STARTUP.md) and `run-learning-readiness-v2`. The older sequence below is retained as historical readiness-design evidence. October 4 also proved the normal 19:00 allocation must be observed and recorded; MISSED_START_RECOVERY is a fallback, not normal-start certification.

## Purpose

Strengthen the existing Daily Generative AI Brief production path without adding another schedule.

The system uses the already-scheduled **05:45 Preflight Guard** and **06:45 Final Gate** to create one machine-readable readiness receipt for the current edition. The **07:00 publisher** consumes that final result.

## Receipt

Path:

```
_records/readiness/YYYY-MM-DD.json
```

Branch:

```
discovery-preflight/daily/YYYY-MM-DD
```

Allowed final statuses:

- `READY`
- `READY_WITH_WARNINGS`
- `NOT_READY`

## Sequence

```text
05:45 metadata preflight
05:50 discovery + article-evidence preflight
05:45 Preflight Guard
      -> full infrastructure/system certification
      -> targeted deterministic repair when safe
      -> writes preliminary readiness receipt
06:45 Final Gate
      -> rechecks current main + current-day evidence
      -> finalizes READY / READY_WITH_WARNINGS / NOT_READY
07:00 Publisher
      -> must read final receipt
      -> proceeds only on READY or explicitly nonblocking READY_WITH_WARNINGS
```

No new automation schedule is created.

## 05:45 certification scope

The Preflight Guard verifies:

1. exact current `main` SHA;
2. active main protection/ruleset and required `validate` status check;
3. latest current-main Deterministic publication CI success;
4. matching current-main Pages deployment success;
5. latest deterministic delta validation success;
6. current-day metadata preflight exists and is ready;
7. current-day discovery preflight is coverage-ready;
8. bounded article evidence is ready;
9. no more than 20 metadata candidates;
10. at least three candidates per focus;
11. at least one story-ready Agent Skills signal and preferred candidate;
12. required production automations are enabled;
13. no known open Critical/High blocker for the current run;
14. GitHub capability needed for bounded repair is available.

Any safe deterministic defect is repaired within the existing bounded-repair policy. Completed valid work is never restarted.

## 06:45 final gate

The Final Gate rechecks:

- current main did not change without recertification;
- both preflights remain current and ready;
- article evidence remains ready;
- no new blocking GitHub Actions failure appeared;
- publisher is enabled;
- GitHub publication capability is available.

It then writes the final status.

## Status semantics

### READY

All required checks pass.

### READY_WITH_WARNINGS

All publication-blocking requirements pass, but a nonblocking condition exists. Examples include a deprecation warning or historical cleanup issue that has no current production impact.

Warnings must include:
- code;
- evidence;
- why they are nonblocking;
- follow-up action.

### NOT_READY

Any required condition is missing, failed, stale, contradictory, or unverifiable.

The last valid live edition remains in place. The publisher must not begin editorial/media/image work.

## Required receipt fields

See `docs/operations/readiness-receipt-template.json`.

The receipt must include:
- edition date;
- stage (`preliminary` or `final`);
- status;
- exact current main SHA;
- certification timestamp;
- check list with PASS/WARN/FAIL;
- warning list;
- blocker list;
- repairs performed;
- relevant workflow/run identifiers;
- automation-state verification;
- next action.

## Publisher rule

A missing receipt is not equivalent to ready.

A stale receipt is not equivalent to ready.

A receipt whose `main_sha` differs from current `main` is not equivalent to ready.

Only `READY` or `READY_WITH_WARNINGS` with explicitly nonblocking warnings allows the scheduled publisher to begin.

## Cost rule

This certification is part of the normal zero-Work production path. It must not add ChatGPT Work/Codex usage.
