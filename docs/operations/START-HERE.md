# Daily AI Brief — Current Operations Entry Point

## September 28, 2026 — Connector-first image transport parity

> [!IMPORTANT]
> **Current routing: `connector-first-v1`.** The existing authenticated GitHub connector is the normal image-transfer route for both production and qualification: `create_blob` (complete Base64-encoded binary bytes), `create_tree`, `create_commit`, and non-force `update_ref`. **No local GitHub token or native Git credential is required for that connector route.** This amendment corrects the adapter-precedence regression; it does not claim that an outstanding image has been uploaded.

The authoritative machine policies remain `under80-runtime-contract.json` and `efficiency-operating-policy.json`. Their normal image lane remains `github_git_data_api`, including the existing restriction on Contents-based binary transport in that lane. The PR286 file-host uploader is retained as an independently tested utility for an already authenticated file-capable host, not a replacement or prerequisite for the normal connector path. Its missing-token result is adapter-specific and must never disable or disqualify the connector. Do not rerun that local CLI merely to rediscover absent local credentials. No credential export, new credentials, Work, Codex or paid-model API is authorized.

**Payload delivery is a separate capability:** the full real image must actually reach the connector's binary-content argument using a supported execution-host mechanism. Tool exposure, a computed SHA, a Library file ID or a partial encoded snapshot is not delivery. Never put a local path or opaque file reference into a literal Base64 field. Where complete payload delivery is unavailable, record `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`, not missing GitHub authentication. Do not invent an adapter or pass fixture results as a live transfer.

**Complete the real round trip:** verify the returned blob against the original file, attach it to the current isolated handoff tree, create a commit with the live handoff head as parent, and update only that branch without force. Preserve concurrent changes; do not rebuild a recovery branch from an old main tree. Reuse existing exact blobs and the existing image read-back workflow. Require actual byte equality and SHA-256 read-back before capture completion; all V2 raw/final provenance, factual, professional-quality, differentiation and accepted-byte gates remain unchanged. A current denial stops that operation; this routing rule never authorizes an alternate endpoint to evade a safety block.

**Q24:** both earlier m04 outputs are already preserved and rejected. The third correct-subject native output and its 1200x630 candidate are preserved in Library, but their Git capture and final acceptance remain governed by live Q24 receipts. Reuse the original cutoff, five passed components, frozen requests and failures; do not generate attempt 4 or advance to m03 while the third output is unresolved. Do not infer successful native ingress from PR286's repository-local sample. The supervisor must stay on the first incomplete operation and notify only on real advancement or a new material blocker.

---


## Historical PR286 utility guidance — not the normal connector route

The independently tested `github-image-file-transfer-v1` utility applies only where its explicit file-host prerequisites and separate authorization are satisfied; it is not the normal production or qualification image route. The shared `transferImageFile` function, `_tools/github-image-transfer.mjs` and `.github/actions/transfer-image` take an actual local PNG/WebP, perform one Contents API write and verify raw bytes at the returned immutable commit. Base64 stays inside executable code; no per-image text bridges, bespoke workflow or owner upload. Identical existing bytes are verified and reused without another write; different bytes, protected branches, unsafe paths, denials and uncertain writes fail closed. Keep one writer per handoff branch.

A verified transfer is not image acceptance. All V2 image quality and visual-only task-delivery requirements remain. The local file and existing repository credential must be present on the same host. This code does not add a file-upload parameter to a text-only ChatGPT connector or prove native-output delivery to GitHub Actions. Known safety-blocked operations must not be replayed through this helper or another endpoint. Q24's previously blocked attempt-2 branch operation remains separate from the independent transport proof; do not report it recovered from a proof-branch upload.

See [Image file transfer](image-file-transfer.md) for interfaces, recovery codes, host requirements and proof scope. Preserve all frozen Q24 components and failed outputs.

---


## September 28, 2026 — Visual-only native generation task delivery

> [!IMPORTANT]
> Use `visual-only-task-delivery-v1` alongside the unchanged V2 image gates. The supervisor prepares and verifies an automatic image-only task whose prompt is the exact compiled visual instruction. Do not put GitHub, run status, capture, review, retry or continuation instructions into that task prompt. No owner-created chat or manual transfer is required; hidden context isolation is not asserted.

`_generator/lib/native-image-delivery.mjs` and `_tools/native-image-delivery.mjs` bind the actual submitted task text and select the next safe unfinished operation. Recover existing generated bytes, complete exact Git capture/read-back and rejection review before allocating another attempt. A pending task is not permission to duplicate generation; four attempts remain the maximum. A preserved Library copy is not a Git receipt, and a compiler/test PASS is not successful native generation. The execution host must still demonstrate scheduling, native output recovery, review and exact persistence.

See [Native image task delivery](native-image-task-delivery.md). Preserve frozen Q24 requests, its five completed components, cutoff/policies, failed outputs and earlier receipts. No acceptance gate, historical result or public edition is changed by this repair. Protected CI and normal merge are required before adoption; actual corrected-image and unattended-production proof remain separate.

---

## September 28, 2026 — Automated production/qualification image parity

> [!IMPORTANT]
> **Current image policy: `production-image-execution-v2`.** Production and qualification now use the same request builder, execution/receipt contract and production image gate. No owner-created fresh chats, owner image uploads, mandatory manual Library transfers or manual image approvals are part of the new path. This amendment supersedes earlier fresh-worker and Library-exit procedures for new runs only; historical IH/Q evidence remains unchanged.

The automatic sequence is sealed single-story request → native image generation → exact output capture → automated post-generation review → bounded same-story regeneration when needed → exact Git persistence/read-back. Review must be a later phase, not necessarily a different conversation. The explicit payload excludes other stories and operational content; hidden runtime isolation is **not asserted**. Keep all factual, professional-quality, six-image differentiation and exact-byte gates. No Work, Codex or paid-model API use is authorized.

`_generator/lib/image-execution.mjs` is shared by both modes. The qualification builder is a direct alias of the production builder. `_tools/image-execution.mjs` prepares requests and validates actual receipts; request preparation is not generation. Missing native generation/review/transport is `CAPABILITY_BLOCKED`, never an owner-upload workaround. For September 28 editions onward, the combined production image gate requires V2 live execution evidence. Earlier editions retain historical validators.

**Release and proof are distinct:** require protected CI/merge for this change; require actual scheduled native generation, capture, review and exact persistence before declaring the image stage unattended. Adapter fixtures cannot establish production automation. See [Automated image execution](automated-image-execution.md). Preserve Q24's completed components and original cutoff; record the execution amendment without rewriting frozen receipts or allocating Q25 while Q24 is nonterminal.

---


## September 28, 2026 — Q23 media reference-time correction

> [!IMPORTANT]
> Q23 is terminal FAIL at MEDIA_READY, preserved at `cd940858dee9bb5a4c5e6d84cf2a7dbf47b4618d`. Its article preflight and one semantic selection passed and remain unchanged. This correction is not released until protected CI passes on the actual final head and normal merge completes. Never resume or refill Q23 into PASS.

**Demonstrated defect:** workflow 36474976174 used publisher-verified Everyday AI episode 871 metadata: publication `2026-09-28T11:00:00Z`, duration 1,853 seconds, Q23 cutoff `2026-09-28T19:10:36Z`. The old selector rejected that 8.18-hour-old candidate because it used UTC midnight. Both video and podcast edition-validation paths contained the same reference-time error. No source timestamp was changed to make it pass.

**Versioned correction:** `media-research-cutoff-v1` uses the original recorded research cutoff for selection and canonical edition validation. New run requests, semantic receipts and kernels must carry `media_freshness_policy`; kernel expansion retains it. Selectors receive the original cutoff and policy explicitly. Unknown policies, missing or timezone-free cutoffs, unresolved source dates and future sources fail closed. Historical artifacts without the field retain their recorded legacy interpretation. The metadata gate remains the authoritative cutoff source; execution time does not extend it.

| Existing limit | Unchanged value |
|---|---|
| Videos | Exactly two; maximum age 72 hours; preferred duration <=10 minutes, fallback <=15, last resort <=20 |
| Podcasts | Exactly two source-diverse selections; 48-hour primary, 7-day fallback and documented 30-day exception |
| Evidence | Verified identity, original timestamp, exact runtime and reviewed source support; metadata capture is not editorial approval |
| Other gates | Six stories, 2/2/2, one reusable Agent Skills story, nine article packets, 12,000 characters, novelty, professional images and nonproduction isolation |

**Verified source-resolution lesson:** the stale Everyday AI WordPress feed is not evidence that the podcast has no recent episodes. Publisher-distributed Apple episode pages bind episode ID, show ID, GUID, exact release time and exact runtime. Saved-page artifact 10991834733 plus metadata-verification artifact 10992499980 provide three independently extracted records: Everyday AI 871 (September 28, 11:00 UTC, 30:53), Practical AI 373 (September 24, 09:00 UTC, 48:52), and AI for Humans 197 (September 24, 10:00 UTC, 48:21). Practical AI also supplies an episode page and transcript. These are metadata-qualified candidates, not selected media or reusable approval for a later Q. Preserve source hashes and review/novelty limitations. No oversized feed limit was raised.

**YouTube diagnostic correction:** offline inspection of the three saved IBM-linked responses found LOGIN_REQUIRED / bot challenges with absent videoDetails. They are access challenges, not confirmed identity mismatches. Retain the original observations and append this diagnosis; do not retry or bypass challenges, invent dates/runtimes, or claim zero qualifying videos exist. Video selections remain unresolved.

**Acceptance and continuation:** run new same-day/future/boundary/historical/kernel-round-trip tests, the full suite and protected CI; include contracts and these living-document amendments in the same PR; remove the temporary workbench. After normal merge, resolve live refs and start the next unused Q from actual merged main and an observed fresh cutoff. Require matching execution evidence. Preserve PR281/PR282, terminal Q/IH records, PR117, published content, the separate greenfield repository and Sites. No Work, Codex or paid-model API is authorized; billing is unobserved.

---

## September 28, 2026 — Recovered Q22 repair: current continuation boundary

> [!IMPORTANT]
> **The saved repair is recovered, not missing.** The owner attached `Q22_Article_Evidence_Repair_2026-09-28.zip`; all 17 checksum entries passed. The exact four source/test files were reviewed and committed through the ordinary connected GitHub file tools. The earlier safety-status block did not recur. Do not repeat the source reconstruction, PR #281, D01–D05 or the two-response capture.

| Checkpoint | Durable meaning |
|---|---|
| Seven-day article policy | Already released in PR #281 at `adc2b88aeee4b946f3c9b6bf801b4e0ba416b486`, protected CI `36460152038` |
| Q22 | Terminal FAIL at `4466d7f499b1848238bbe4594af4589d20d062f0`; successful preflight does not supersede its failed semantic gate |
| Article-body correction | `hardening/q22-article-evidence-body-2026-09-28`; exact saved patch SHA-256 `16c70db6377c35e37b4d0e2d62d5b8f212f4f5511cbea080027395a991993a09` |
| Saved tests | 468 local tests and 24 contract checks; these are prior evidence, not the eventual protected-CI result |
| Release requirement | Same-PR operating documents, successful protected CI on final head, then normal merge |
| Next Q | Q23 was unused at recovery; resolve live refs again after merge rather than assuming it remains available |

Read Q22's `_records/qualification/2026-09-28-Q22/result.json` on its qualification branch before older receipts. Its m05 and m06 Applied evidence contains only titles. Never rerun discovery, refill its evidence, restart semantic selection or turn that failed Q into a pass.

The recovered extractor uses canonical-URL/headline-checked JSON-LD article bodies, visible-body fallback, and 80-source-word/25-excerpt-word title-shell guards. The collector and current-policy semantic validator both enforce evidence sufficiency without expanding the nine-item packet or relaxing editorial quality. See the Q22 amendment in `LIVING-SYSTEM-OPERATIONS.md` for the mechanism and preserved fixture proof.

Reuse any newer valid remote work. Remove the temporary workbench before the final release PR. Do not allocate a fresh Q until the correction has passed protected CI and merged. Then start the next unused identity from actual merged main and current observed UTC time; report the real matching workflow, not merely a request, branch or enabled schedule. Keep at most one nonterminal Q and preserve terminal evidence, PR #117, public content, the greenfield repository and Sites. No Work, Codex or paid model APIs are authorized; billing is unobserved.

---

## September 28, 2026 — Article policy amendment (`article-24-72-168-v1`)

> [!IMPORTANT]
> This policy applies only after the coordinated change passes protected CI and is merged. A prepared branch or local test is not a release. Historical Q1–Q21 failures and D01–D05 audits remain immutable.

| Publication age at the recorded cutoff | Treatment |
|---|---|
| 0–24 hours inclusive | Primary priority, subject to evidence, relevance, novelty and focus fit |
| Over 24–72 hours inclusive | Normal recency fallback only when qualifying primary items cannot fill that focus |
| Over 72–168 hours inclusive | Extended recency fallback only when newer qualifying items cannot fill that focus |
| Over 168 hours, future or unresolved | Not eligible for a daily article slot |

Shortlist reservation and the nine-candidate evidence plan use freshness-band priority before score. Required focus/Agent Skills reservations remain; there is no rigid recent-story quota. The 24-hour discovery early-stop measure excludes fallback articles. Original publication timestamps are preserved; `dateModified` never creates a new publication date. Every new-policy fallback requires a substantive editorial `fallback_reason`; its `fallback_band` must match its age. Reader labels are **Recency fallback** or **Extended recency fallback**, with the original source timestamp. The coverage statement discloses fallback use.

The explicit `article_freshness_policy` field identifies new-policy artifacts. Missing identity on historical artifacts retains ordinary-72/Skills-168 semantics. Legacy constants, historical Q14/Q15/Q16 reports and older editions are not reinterpreted. The legacy metadata CLI option remains available for regression evidence only, not new runs.

**Verified source paths:** n8n RSS and Notion releases RSS are activated with bounded transport/date-parser evidence. The captured n8n samples and latest captured Notion entry are older than seven days, so activation is not proof of fresh yield. Box and Airtable remain limited by article/date qualification; Make HTTP 403 and Adobe saved-feed HTTP 404 are not operational paths. Google Workspace feed recovery from PR #280 is reused without a duplicate registration. Expired source pins are omitted from live seeding, not deleted from history.

**Unchanged:** six stories in 2/2/2 order, one reusable Agent Skills story, <=20 metadata candidates, nine balanced evidence candidates, <=12,000 model-visible evidence characters, one semantic pass, two verified videos, two source-diverse podcasts, all media freshness/duration rules, professional accepted_locked images, novelty, evidence and nonproduction isolation. No Work, Codex or paid model API invocation is authorized; account billing is unobserved.

**Recovery and acceptance:** commit code, registry, source plan, tests and all living documents in this same change set; run targeted/full tests and protected CI; merge before allocating the next unused Q from live refs and current UTC time. Require an actual matching execution before reporting a Q started. A failed Q is terminal and is followed by a minimal tested correction and a fresh identity. Preserve valid completed stages and do not repeat D05 or PR #280.

**September 28 persistence incident:** the earlier assistant reported local test counts, but the next runtime contained only the baseline workspace and publisher fixtures, not the substantive patch or its test logs. Those old counts cannot certify the recovered implementation. Reconstruct only the missing patch from preserved inputs, persist it before ending the invocation, and attach fresh actual CI evidence. Do not report local-only work as a GitHub release.

---

### Earlier operating record (superseded only for current ARTICLE freshness by the amendment above)


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
