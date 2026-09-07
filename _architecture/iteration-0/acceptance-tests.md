# Iteration 0 Acceptance Tests

| ID | Test | Expected result |
|---|---|---|
| I0-01 | Inventory current repository, Pages workflow, QA records, and active publisher/QA automations | Baseline identifies authoritative paths, duplicate views, commit behavior, CI/branch state, and schedules |
| I0-02 | Freeze current public URL patterns and historical instances | URL contract includes homepage, archive, dated briefs, QA history/reports, and stable asset paths |
| I0-03 | Define a single canonical edition/story authority | Exactly one canonical edition record owns editorial facts; derived-output ownership is explicit |
| I0-04 | Define stable identifiers and status/evidence vocabulary | IDs are immutable; all statuses are enumerated and machine-readable |
| I0-05 | Define Command Center operational records | Publication, QA, alert, ledger, analytics, trend, and feedback contracts are versioned and safe for a public repository |
| I0-06 | Validate contract schemas and positive fixtures | All schemas parse and every valid fixture passes |
| I0-07 | Validate negative fixtures | Invalid story allocation and incomplete publication transaction fail with the expected assertions |
| I0-08 | Define deterministic versus editorial QA | Each check is explicitly typed and acceptance/rollback behavior is documented |
| I0-09 | Define migration and rollback | Shadow mode, compare-and-swap cutover, one-commit rollback, and append-only evidence are documented |
| I0-10 | Confirm production isolation | `main`, active automations, public files, public URLs, and Pages behavior are unchanged |

Iteration 0 passes only when I0-01 through I0-10 pass and no Critical or High defect remains in the architecture artifacts.
