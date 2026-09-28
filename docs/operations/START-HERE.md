# Daily AI Brief — Current Operations Entry Point

> [!IMPORTANT]
> **Read current evidence, not the newest-looking historical narrative.** This entry point is a navigation and maintenance guide, not a replacement for publication contracts. A saved task, branch, status paragraph or successful preflight does not prove that the next stage has started or that an edition is complete.

## Authority and scope

Production: `docs/operations/under80-runtime-contract.json`, `docs/operations/efficiency-operating-policy.json`, then `docs/operations/LIVING-SYSTEM-OPERATIONS.md`. Qualification additionally requires `docs/operations/continuous-qualification-contract.json`. Tests and accepted artifact contracts remain mandatory. Do not infer an image-method exception from a legacy adapter. Conflicting image policies require reconciliation and proof before changing the generation lane. Work, Codex and paid model APIs remain prohibited; account billing is unavailable unless independently observed.

`gttome/Daily-AI-Brief` is the repository covered here. Do not modify the separate greenfield repository or Sites Command Center as part of this cleanup. PR #117 and all of its refs are explicitly protected.

## Fast status and resume path

1. Resolve live `main` once. Inspect the latest qualification branch and current-day production branch separately. Use exact repository-relative paths; do not guess artifact filenames from old runs.
2. Read the terminal result first. A terminal result on protected main takes precedence over an old semantic receipt on an isolated branch. Never resume Q18 or Q19 from their earlier apparently successful checkpoints. Determine later identities from live refs rather than hardcoding the current Q into schedule prompts.
3. Fetch only the relevant branch's latest commit, request, receipt and workflow. Use per-branch filters and small result pages. Search code once with a precise identifier; if indexing returns no match, list the relevant directory once. Do not repeat broad empty searches or dump all workflow history.
4. Distinguish **scheduled**, **queued**, **running**, **completed**, **failed**, **blocked** and **not started**. Report a task enabled flag only as schedule configuration. Actual start requires a matching workflow execution or a substantive, time-stamped work artifact. Unknown costs are not zero.
5. Before claiming semantic completion, run `_tools/validate-qualification-semantic-receipt.mjs` against the frozen article-evidence packet. Do not start another editorial pass to conceal an invalid selection.
6. Do the next available safe action in the present invocation. Do not end after updating a watchdog when the actual work can be performed. When a stage cannot execute, record the concrete limitation, not an invented executor or a future promise.

## Historical evidence is retained, not active instruction

Dated handoffs, Q/IH result records, old implementations, replay branches and previous image instructions are historical evidence unless explicitly referenced by the current contract. Do not load all of them for ordinary status. Existing paths are retained to protect audits, image lineage and regression fixtures. Preserve published editions, assets, corrections, run receipts, failure evidence, novelty history, CI evidence and restoration tags. Do not rewrite Git history or delete public archive images to make the repository smaller.

## Reversible branch cleanup

`_tools/maintenance-cleanup.mjs` and `.github/workflows/maintenance-cleanup.yml` implement explicit-request maintenance, with no recurring destructive schedule.

| May be archived | Always retained |
|---|---|
| Allowlisted working branch whose exact current head matches a PR merged into main before the request cutoff | Main, protected branches, PR #117, open/unmerged PR heads, active workflow branches, current Q/IH and publication namespaces, and branches mentioned in tracked text |
| Old fix/repair/feature/docs/ops/policy/refactor branches that pass all safeguards | A branch whose head changed after planning; unknown or incompletely inventoried state |

A cleanup must first persist its complete plan under `maintenance-results/<maintenance_id>`. For each eligible branch, create and verify `refs/tags/archive/<maintenance_id>/<original-branch>` at its exact head SHA, recheck the head and live work, then remove only the obsolete branch ref. Update the report throughout execution and read back the final branch inventory. Never claim a deletion solely because it was planned. An interrupted cleanup stops safely; its restoration map and archive tags remain available. Do not rerun the same maintenance identity.

To restore, read the original branch and SHA from the cleanup report, verify the corresponding archive tag, and use the connected `create_branch` action at that SHA. Do not force-update an existing branch. No new credential is needed for normal repository maintenance; the workflow uses the existing repository-scoped token.

## Do not repeat ineffective repairs

Q20's preflight again reported 13 Technical / 1 Applied / 2 Agents after Q19's reservation repair. That does not prove the complete source-supply problem was fixed. Distinguish selection starvation from genuinely insufficient eligible source supply, extraction failure, date precision, stale pins and coverage aging before another fresh Q. Test the proposed repair against preserved bounded evidence before starting a full qualification. Do not loosen freshness, novelty, category allocation, evidence or image quality to manufacture a pass.
