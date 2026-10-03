# Migration, Rollback, and Test Strategy

## Migration strategy

### Phase A - Baseline freeze

1. Record the verified production commit, Pages deployment, active automation definitions, public URL manifest, and checksums of current generated files.
2. Do not edit or relocate historical briefs or images.
3. Keep the current publisher and QA automations active.

### Phase B - Canonical backfill and shadow generation

1. Convert the newest verified edition into the canonical JSON schema without changing wording or URLs.
2. Generate all current derived views into a temporary staging tree.
3. Compare generated and current content semantically, allowing only declared frontmatter/navigation/generated-marker differences.
4. Run the deterministic validator twice from clean checkouts and require identical staged-tree digests.
5. Run at least one week of shadow editions before replacing the active path, as required by the Iteration 1 gate.

### Phase C - Atomic cutover

1. Build the complete edition and all assets off-branch.
2. Validate the staged tree.
3. Re-read `main` and require it to equal the baseline SHA used to build.
4. Create one commit containing every required change.
5. Update `main` once.
6. Verify the Pages deployment and public URL contract.
7. Append a `pages_verified` or `failed` publication event. This operational-only commit cannot change canonical or reader-visible edition content.

### Phase D - Automation transition

The existing publisher and QA prompts are updated only after shadow evidence passes. Their authority narrows: ChatGPT creates the canonical edition/assets and performs editorial review; repository code generates and validates derived files. Direct manual editing of derived views becomes a blocking contract violation.

## Rollback strategy

Rollback never rewrites Git history and never deletes an edition.

1. Identify the last verified production commit from the publication record.
2. Create one explicit rollback commit that restores reader-visible generated outputs to that commit.
3. Preserve the failed canonical edition and run record for diagnosis unless they contain prohibited sensitive data.
4. Append an incident entry and link the rollback publication run.
5. Verify Pages deployment and every stable URL.
6. Append a `rolled_back` event for the affected run; do not change its original validation evidence.

For an automation-only failure, pause or revert the automation definition to the last approved prompt while leaving the verified site commit in place.

## Test layers

### Contract tests

- Every JSON and schema file parses.
- Every valid example passes its named schema and semantic invariants.
- Every invalid example fails for the expected reason.
- Unknown fields fail where `additionalProperties` is false.
- IDs, dates, URLs, enums, and version fields follow the frozen vocabulary.

### Generator tests (Iteration 1 onward)

- Same input produces byte-identical output and digest.
- Exactly six stories and exact ordered 2/2/2 allocation.
- Canonical facts appear consistently in dated, latest, homepage, story, feed, archive, README, and search outputs.
- Missing fields/assets, duplicate IDs/URLs, invalid dates, and stale editions fail before commit.
- Generated-output edits without a canonical change fail parity validation.

### Publication tests

- Complete staged tree creates one commit.
- Concurrent `main` movement fails safely.
- Failure before ref update leaves production unchanged.
- Failure after ref update produces a detectable degraded/failed state and invokes rollback rules.
- Alert fingerprint deduplicates repeated failures.

### Regression tests

- All URLs in `url-contract.json` remain mapped.
- All 21 historical dated briefs remain byte-identical during Iteration 1.
- Existing archive ordering and Home/Archive navigation remain functional.
- Existing image URLs remain resolvable.
- Share controls do not regress before analytics replaces unauthenticated counts.
- Jekyll build succeeds and output includes every contracted route.

### Failure injection (Iteration 6)

Missing source, broken image, stale date, duplicate story, invalid 2/2/2 allocation, analytics outage, feed error, concurrent publish, Pages failure, corrupted QA record, and rollback failure are mandatory injected cases.

## Exit evidence

Each iteration produces an immutable QA record with acceptance results, regression result, remaining severity counts, limitations, rollback status, and approval recommendation. Gate 7 requires seven consecutive live editions with all 17 improvements, no silent drift, and no unresolved High/Critical defect.
