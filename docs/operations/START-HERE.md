# Daily AI Brief — Current Operations Entry Point

**Current production authorization:** follow [Daily unattended startup](DAILY-UNATTENDED-STARTUP.md). The production controller starts at **19:00 America/Chicago on the evening before the edition date** and targets the next local calendar day. Resume only the exact active nonterminal execution; otherwise allocate one new target-edition execution. Every prior terminal execution is immutable.

**Cost and liveness boundary:** production uses the existing scheduled ChatGPT + GitHub path only. ChatGPT Work, Codex, paid model APIs/services, billable overage, alternate accounts and new credentials are prohibited. A route-specific blocker never pauses unrelated dependency-safe work. Images and publication still require the protected unattended-image-host admission contract.

> [!IMPORTANT]
> **Run learning/readiness is now a production gate.** Before every new production run,
> complete Task 00 using [the Living Run Learning, Cleanup and Readiness Plan](RUN-LEARNING-READINESS-PLAN.md)
> and `run-learning-readiness-v2`. A one-time schedule may trigger a start, but every run
> must already have a run-scoped keeper bound through terminal cleanup. An Active task
> is evaluated by route-specific durable liveness evidence. The Supervisor observes approximately every minute, the GitHub watchdog protects the Supervisor every five minutes, and the ChatGPT Watchdog Ring independently re-evaluates unresolved real stalls at a nominal ten-minute cadence. The Ring is also the reusable native-image consumer: all six slots A–F are equally eligible to pick up an exact queued unclaimed Task 11–16 request at their next scheduled opportunity, without waiting for Slot F or for a stale threshold. For an actionable stall, the Ring does not stop after one repair attempt: it continues through the remaining safe authorized recovery options until the task/process has a real active executor and demonstrable durable progress, or hands the still-unresolved incident to the next slot at a safe boundary. Failed repair attempts alone never justify `BLOCKED_EXTERNAL`.
> The proven production image path is locked; repository-generated SVG/basic-diagram
> substitution and low-quality fallback are prohibited. After `PUBLIC CLOSED` or
> `FAILED`, Task 29 cleanup and the promotion review are mandatory before the next run.


> [!IMPORTANT]
> Read live machine evidence before narrative status. This entry point is a current
> index, not another run-state record. Normal image transport remains `connector-first-v1`, implemented through the permanent simple lifecycle **generate → transfer file → verify content identity → review → accept/reject**.
> Git content-address identity is the primary persistence verification; optional raw reread must not become a publication blocker.
> When complete binary payload delivery itself is unavailable, retain the existing classification `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`.
> Preserve all V2 raw/final provenance, exact-byte verification and professional-quality
> gates. A current denial stops that operation; do not use another endpoint to evade it.
> Before every new native image attempt, compile `strict-image-render-spec-v1`: omit
> headline/source/orchestration text from the render prompt, lint positive fields against
> prohibited story specifics, use an exact visible-text allowlist, prohibit people/human
> icons, and explicitly forbid cross-story carryover. A render-spec lint failure consumes
> zero image attempts.

## Scope and authorities

Only `gttome/Daily-AI-Brief` is in scope. Production authorities are
[the runtime contract](under80-runtime-contract.json) and
[the efficiency policy](efficiency-operating-policy.json). Qualification additionally
uses [its contract](continuous-qualification-contract.json). Versioned validators and
actual artifact receipts remain mandatory. The latest applicable released amendments
supersede older chronological narratives; older instructions are not a second controller.
No Work, Codex, paid-model APIs/services, new credentials, owner-created image chats,
manual uploads/approvals or low-quality image fallback. Account billing is unobserved
unless separately measured. Preserve PR #117, greenfield repositories, separate Sites,
sharing/access settings, accepted images, public archives and historical failure records.

## First safe unfinished action

Source reading-time repair (September 30): normal research and recovery handoffs
must retain reviewed **full article body** word counts, source URL, retrieval time
and counting method. Carry these through `source_word_count` into the canonical
story's `source.reading_evidence`, or use the URL-bound `source_reading` catalog.
Never substitute a bounded evidence capsule or Brief summary word count. Existing
reading-support validation rejects missing estimates for September 30 onward;
capture counts during the first source review, before discarding the source text.

1. Resolve current `main` and the relevant execution branches. Check actual terminal
   `result.json` before a checkpoint, issue comment or automation snapshot. Resolve
   current-day production separately from qualification. Q24 and Q25 are historical
   terminal failures; never reopen them or consume further attempts under those identities.
2. Check for an executor making durable progress. Keep one writer, one pending image
   job and no competing publication task. Use small branch-specific queries rather than
   whole-history dumps or repeated empty broad searches.
3. Reuse valid frozen inputs, original cutoffs, source dates, accepted images and stage
   receipts. Before consequential retries reconcile uncertain outcomes. Finish every
   available dependent step in the current invocation rather than ending at a status note.
4. **Simplify before expanding:** whenever a blocker holds publication, first determine
   whether an existing component or a smaller contract can satisfy the real invariant.
   Prefer one reusable primitive and fewer handoffs over adding probes, workflows,
   supervisors or evidence layers. Preserve quality, provenance and protected publication
   gates, but remove redundant proof machinery when it becomes the blocker.
5. **Self-heal before yielding:** classify the blocker. Reconcile stale state from immutable
   results; recover the same operation/bytes after uncertain handoff; advance from a
   documented quality rejection; fix pre-generation deterministic lint without consuming
   an attempt; and continue through every applicable safe authorized recovery option until
   a real executor is ACTIVE and substantive durable progress is proven. One failed attempt
   never ends actionable recovery. A safe-boundary yield is an unresolved handoff to the
   next Watchdog, not success. Only a verified external wait, host limit, or current
   safety/tool denial may stop internal repair. Never route around a denial.
6. Treat immutable image attempt results as truth. Controller image counts/cursors and
   Kanban/status are derived projections, not independent records. Use
   `node _tools/edition-execution.mjs image-progress --state <controller-state.json>`
   to inspect/rebuild image progress. Timing is passive evidence, never a publication gate.
7. Report scheduled, queued, running, completed, failed, blocked and not-started accurately.
   An enabled schedule, prepared request or green component test is not execution or a
   finished Brief. Preserve the exact evidence and smallest unresolved next operation.

## Released recovery code; live image connection still unproved

[Recoverable edition execution](reliable-edition-execution.md) documents PR #290's staged
`reliable-edition-v1` profile: a durable operation journal, stable operation keys,
producer-owned generate/capture/prepare/review/persist/receipt phases, single-writer
continuation and immutable build-once bundles. The shared image entry point cannot
silently fall back to volatile execution when this profile is requested.

A real supported native host, its recoverable operation-to-result association, complete
binary connector delivery and shared durable storage still need live proof. Callback
interfaces, local Git integration, fixtures and capability flags do not supply them.
Do not replace the working legacy path with an unproved adapter or start a new full
qualification/research cycle while that admission remains blocked. New-profile discovery
checks admission before network work; historical requests are not silently migrated.

Use `_tools/edition-execution.mjs status` for terminal-first machine-derived status.
After live handoff proof, verify six real story-specific image jobs including interruption
and recovery without owner intervention. Unknown generation outcomes require recovery;
transport failures resume the same attempt; documented quality rejection alone permits
another bounded attempt. Preserve the four-attempt maximum and six-image differentiation.

## Shared media source recovery

[Saved media source recovery](media-source-recovery.md) supplies the executable
`_tools/parse-media-source.mjs` command and shared parser. Reuse original captured Apple
Podcasts/YouTube catalog bytes and their SHA-256 instead of creating another extraction
workbench or refetching sources to fix a parser. Complete Apple playback metadata takes
precedence over partial menu records; current YouTube duration badges bind to their
own video IDs. Results remain unreviewed metadata until existing evidence, freshness,
novelty and selection gates pass. Never rerun frozen selection just to demonstrate this fix.

## Editorial, image and publication boundaries

Keep exactly six stories in 2/2/2 allocation and exactly one reusable Agent Skills story,
no more than 20 metadata candidates, nine balanced deep evidence candidates, 12,000
model-visible evidence characters and one semantic selection pass. The current article
policy is `article-24-72-168-v1`: qualifying 24-hour material first, then normal fallback
through 72 hours, then explicitly justified/disclosed extended fallback through 168 hours.
Never treat modification time as original publication or widen media rules using this
article-only policy. Preserve two verified videos and two source-diverse podcasts under
`media-research-cutoff-v1`, existing duration/freshness limits, Watchlist and book obligations.

Use [automated image execution](automated-image-execution.md),
[native visual-only delivery](native-image-task-delivery.md) and
[connector-first transfer](image-file-transfer.md). Production and qualification share
`production-image-execution-v2`; generation consumes one sealed story's visual content.
Review is a later logical phase, not a mandatory separate conversation. Hidden context
isolation is not asserted. No owner-managed fresh chats or Library handoffs are required.
Git Data uses complete real bytes, `create_blob`, `create_tree`, `create_commit` and a
non-force `update_ref` against the live handoff tree/parent. The exact local file's
SHA-256 and Git blob are computed before transfer; GitHub must return the same blob and
that blob must be bound into the committed tree. That content-address proof is sufficient
for exact persistence. Raw reread is optional additional verification when available.
No local token is required for the authenticated connector. The reusable file-transfer
primitive is now the normal production image transport rather than a separate proof lane.

The same verified content bundle proceeds through a separate production identity,
protected PR/CI, exact-SHA deployment, actual reader verification and lifecycle
PUBLIC CLOSED. Current homepage/latest/dated/archive, story/media/image routes, required
navigation/feeds, ratings/sharing/privacy/mobile presentation and completion evidence
must pass. Qualification PASS, simulated CLOSED, PR merge or a visible homepage alone
is not public completion. The owner's mission is one finished public Brief followed
immediately by a second distinct legitimate public run through its own verified closure.
A main change requires explicit compatibility packaging, not silently redating content
or discarding valid research. Existing publication validators are not bypassed.

## Reference and historical evidence

[Living system operations](LIVING-SYSTEM-OPERATIONS.md) retains the broader operating
reference and chronological amendments; apply current machine contracts and the current
profile above rather than an obsolete run snapshot. Permanent fixes require regression
coverage, updated operating guidance and protected CI before normal merge.
The prior chronological START-HERE record is preserved at
[the immutable PR #290 revision](https://github.com/gttome/Daily-AI-Brief/blob/57991d30614681b6cce5335819aabef0d1931e71/docs/operations/START-HERE.md).
No historical evidence or published content was deleted by this index consolidation.
Maintenance/branch cleanup is a separate explicit task, not part of ordinary continuation.

## September 30 direct-capture note

For the bound September 30 second-edition recovery, use the released `same-invocation-direct-capture-v1` admission mode when the active native image surface has generation/editing but no supported cross-invocation result-recovery callback. This is not a native capability proof: all image-byte, quality, manifest, CI, deployment and live-verification gates remain required. The default recovery-proof mode remains available for hosts that actually implement it.

- `docs/operations/CHATGPT-WATCHDOG-RING.md` — current outer autonomous recovery contract.
- Watchdog recovery invariant — diagnose → fix → ACTIVE executor → durable progress; one failed attempt is never completion, and safe-boundary yield means continuation by the next slot.


## Ring-wide native image coverage

Image Tasks 11–16 are intentionally covered by **all six Watchdog slots**, not by one special schedule. The current model provides six scheduled image-consumer opportunities per hour at :03/:13/:23/:33/:43/:53. This is a nominal 6× increase in scheduled pickup opportunities versus the former single F-only hourly binding, reducing conceptual worst-case wait from under 60 minutes to under 10 minutes.

This is not a hard real-time guarantee: Scheduled task delivery can be late and active image work can take longer than ten minutes. Duplicate generation is prevented by exact-request identity, one shared Watchdog recovery/consumer lease, current production writer fencing, and accepted_locked immutability.
