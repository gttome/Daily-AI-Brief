# Reliable edition execution

> [!IMPORTANT]
> **September 30 simplification / self-healing amendment:** a controller run is a start
> trigger, not a stage pacer. Once started, the controller drains all safe dependent work
> until completion, execution-host limits, or a blocker that remains after bounded recovery.
> Durable image attempt results are authoritative; controller counters/cursors are derived
> projections and may be rebuilt with `node _tools/edition-execution.mjs image-progress`.

## Self-healing blocker ladder

The controller must classify and clear recoverable blockers before yielding:

1. **Stale mutable state** → rebuild the controller projection from immutable attempt
   results/bindings and continue.
2. **Known durable outcome with incomplete bookkeeping** → reconcile that same result;
   never regenerate.
3. **Transport/ack uncertainty** → recover the same bytes by content identity and the
   same operation key.
4. **Documented quality rejection** → close append-only, bind the next bounded attempt,
   and continue.
5. **Pre-generation deterministic lint/contract defect** → correct the render spec
   without consuming an image attempt.
6. **External CI/deployment wait** → trigger/check the existing workflow once and yield
   only while it is actually pending.
7. **Current safety/tool denial** → never evade via a different endpoint. Preserve the
   exact blocker and retry the same minimal authorized operation on a later invocation.

`drainOperations` supports bounded same-invocation blocker resolution through explicit
`OperationBlocked({recoverable:true})` + a step `resolveBlock` hook. Blind retries are
forbidden when the outcome is uncertain.

## Atomic image completion and state authority

An immutable accepted/rejected attempt result is the fact. In one state commit whenever
possible, image completion writes the attempt result and reconciles the derived controller
projection. `accepted_images`, current candidate and next attempt are not independently
authoritative counters. They are derived from immutable attempt results plus the one
in-flight operation binding. This removes stale-count/cursor recovery as a separate
publication activity.

## Passive performance evidence

Operation events record elapsed milliseconds. Image results may additionally record
binding-to-acceptance wall time. Metrics are advisory only: attempts-to-accept, first-attempt
acceptance rate, median accepted-image wall time, and available phase/overhead timing.
A timing regression never blocks publication; it triggers simplification of non-value-add
steps before any new test, workflow, or evidence layer is added.


> [!IMPORTANT]
> **September 30 first-attempt hardening:** reliable-edition image jobs must compile and lint a `strict-image-render-spec-v1` before allocating a native generation attempt. The compiled prompt excludes headline/source/orchestration metadata, uses an exact visible-text allowlist, prohibits people/human icons and explicitly forbids inherited cross-story motifs. A render-spec lint failure allocates zero attempts. This is a smaller pre-generation guard inside the existing recoverable job, not a new executor or qualification lane.


> [!IMPORTANT]
> Owner-approved September 29 changes: one recoverable image job, deterministic
> continuation from one journal, and immutable edition bundles with separate execution
> and qualification identities. This is a staged integration into the existing system,
> not a second publishing platform. A real supported native execution host is still
> required. The code, fixtures and local Git integration do not prove that host exists.

## Scope and rollout

| Component | Implemented interface | Live boundary |
|---|---|---|
| Image production and delivery | `executeImageRequest(..., {executionProfile:'reliable-edition-v1', operationStore, host, transport, ...})` | A real native host must supply `generate`, `recover` and `review`; never fabricate these capabilities |
| Binary persistence | `connectorImageDelivery` passes complete bytes through Git Data and checks immutable read-back | Actual authorized connector methods and an exact binary reader must coexist on the host |
| Continuation | `drainOperations` and `executeEdition` | Stage handlers must use the established source, media, quality, qualification and production validators; missing handlers block rather than fake success |
| Edition reuse | `sealPublicationBundle`, `verifyPublicationBundle`, `promotionDecision` | Production still requires protected CI, compatible deployment packaging, real live checks and PUBLIC CLOSED |
| Consistent status | `_tools/edition-execution.mjs status` | Terminal result takes precedence; no narrative override |

Do not switch a working legacy execution onto an unproved host. Historical profiles
retain their previous interpretation. New reliable-profile requests may not silently
fall back to the volatile executor. No new full qualification should be started until
native handoff works on the intended host. Q24 and Q25 remain immutable terminal tests;
new code cannot turn either into PASS. The approved mission still requires two distinct
fully completed public Briefs, not two fixture or qualification results.

## One image job, durable at every boundary

`generate -> transfer file -> verify identity -> prepare/review -> accept or reject -> receipt`

The job owns result delivery. It stores the native result bytes and exact identity
before continuing. A supervisor reads that record, not a guessed filename or an
unbounded conversation/Library search. Generated and reviewed byte objects are
content-addressed and immutable. Normalization occurs before review and only its
saved output is used thereafter.

**Permanent simple image lifecycle:** generate one PNG, transfer that exact file once,
verify its locally computed SHA-256 and Git blob identity against the GitHub-returned
content-addressed blob and committed tree, then review it. If review passes, persist the
accepted final bytes with the same content-address check; if review fails, close that
attempt and bind the next attempt. A second raw binary download is optional strengthening
when the host supports it; it is not a publication blocker when Git content identity is
already proven. Raw/final provenance and the existing V2 receipt validator remain
mandatory. Individual acceptance does not grant six-image set differentiation or
publication approval.

The adapter gets a stable operation key before invoking native generation. It must
be able to recover the **same actual operation**. After an uncertain response, the
controller invokes recovery instead of generating again. A timeout is not a quality
rejection. Only a recorded subject/factual/structural/editorial rejection may use the
next of the four allowed image attempts. Storage, status and bookkeeping failures
resume the existing attempt. A current denial stops that action; no alternate route
is used to evade it.

`connectorImageDelivery` encodes actual Buffer bytes internally, invokes the existing
`create_blob`, `create_tree`, `create_commit` and non-force `update_ref` interfaces,
and requires GitHub's returned blob identity to equal the Git blob computed from the
exact local bytes. That content-address match plus the committed tree binding is the
primary exact-byte verification. When a binary reader is available, the implementation
may additionally re-read and compare the raw bytes, but absence of that optional reread
does not block a content-address-verified image. Existing matching paths are verified
and reused without another write. Different bytes cannot replace an image silently.
The current branch tree and parent are retained; stale writers cannot force a ref.
There is no local-token requirement, public relay, partial Base64 shuttle or owner
upload step.

**Host integration is explicit.** Repository code cannot call a native ChatGPT tool
merely by declaring a callback. The current tool surface has not demonstrated a
programmatic native producer/result bridge and complete-byte connector adapter on
one recoverable execution host. Keep that limitation visible. Do not call fixture
replays, past image downloads or readiness flags a new unattended native success.

## Simplification-first blocker rule

Whenever publication is blocked, first ask whether the current requirement can be met
with fewer moving parts while preserving the actual quality, provenance, safety and
publication contracts. Prefer deleting redundant proof layers, reusing one existing
transport primitive and resuming the current artifact over adding another workflow,
probe, executor, handoff format or recovery service. Complexity is justified only when
the simpler path cannot preserve a required invariant. Record the smallest blocker and
the simplification considered before adding infrastructure.

## Deterministic continuation and one state source

The generic runner consumes trusted executable handlers, not shell commands from
an editable JSON plan. It performs all ready dependent operations in the current
invocation, within a bounded step budget. Successful completion and the next cursor
are saved together. Thus interruption after a successful step resumes the next step,
rather than waiting for another owner instruction or rerunning successful work.

The file journal uses immutable, hash-linked versions published by atomic filesystem
operations, with compare-and-swap revisions. A lease and fencing token protect against
competing executors. An uncertain side effect needs keyed recovery. A blocked operation
with unchanged inputs and no due retry does not blindly repeat on every status tick.
A retry signal must represent an actual changed capability/result observation, not
an invented reason to bypass the block. A pure replay-safe operation can be retried;
publication and other consequential handlers require explicit recovery.

The file store is durable **on a shared filesystem**. A new container does not acquire
that filesystem merely because it can see a filename in a prior chat. A remote store
must supply the same tested immutable-object and CAS contract. This limitation must
not be hidden behind a success receipt. Current adapters do not export credentials.

`operationView` and `renderExecutionCheckpoint` derive status from the journal.
`canonicalExecutionStatus` gives a terminal qualification `result.json` precedence
over old prose. A result cannot be reopened by a later checkpoint saying nonterminal.
Legacy human documents remain historical evidence, not an alternative control plane.

## Admission before expensive work

`executeEdition` runs the existing-result handoff probe before calling discovery.
The probe performs recovery and exact Git read-back; it does not generate a throwaway
image. It binds host, actual invocation, native result, artifact identity, exact bytes,
release, observed time and expiry. Fixtures cannot admit a live edition.

The discovery workflow also checks admission **before network discovery** when the
request explicitly carries `execution_profile: reliable-edition-v1`. Legacy scheduled
and frozen requests are not silently migrated. Create any future reliable-profile
request only after the same admission check succeeds; do not allocate a Q merely to
rediscover a known host failure.

```sh
node _tools/edition-execution.mjs admission-check --release <pinned-protected-sha>
```

The default proof location is `_records/execution-host/image-handoff-proof.json`.
It must come from real producer recovery and `proveImageHandoff`, not manually entered
passing flags. Its raw proof bytes must be present under the bound operation key and
match the recorded SHA-256 and Git blob. A changed release or expired proof requires
new verification of the existing result, not new image generation by default.

## Build once; resume stages; preserve failed qualifications

An edition binding retains the original cutoff, research baseline, execution release,
policy versions and execution identity. These are separate from any qualification's
immutable pass/fail result. Subsequent compatible executions may reuse valid content
with provenance and freshness checks, without altering historical failures.

The bundle sealer invokes the **existing full publication-manifest validator**, then
binds all manifest artifacts, final image files and available request/receipt/raw
provenance. Verification reconstructs the complete inventory as well as checking every
byte digest. A partial inventory cannot pass by hashing itself. Source timestamps are
not changed. Required image quality, media, allocation, Skills, Watchlist and book gates
are not removed.

```sh
node _tools/edition-execution.mjs seal --manifest <manifest-path> \
  --release <pinned-protected-sha> --cutoff <original-cutoff> --out <new-bundle-path>
node _tools/edition-execution.mjs verify --bundle <bundle-path>
node _tools/edition-execution.mjs promotion-plan --bundle <bundle-path> \
  --qualification <bound-pass-result-path> --release <target-sha> \
  --production editorial-handoff/production/<edition-id>
```

An unrelated main change produces a compatibility/packaging requirement, not a
research restart. `run-state resolve` understands admitted states tagged with the new
profile; checkpoint writes cannot silently replace their original baseline. Existing
publication baseline checks remain in force: a packaging migration must be explicit,
validated and protected. This release does not bypass them or redate old sources.

The production identity must be separate and use the same verified content. A bundle,
qualification PASS or promotion plan is not deployment authorization or PUBLIC CLOSED.
Real deployment SHA, public routes, media/images, feeds, ratings/sharing/privacy/mobile
checks and completion evidence remain required. The second public run must be distinct
and must not overwrite or pretend to be the first.

## Verification and known remaining work

Regression coverage exercises interrupted generation acknowledgement, raw/final capture,
final persistence, exact bytes, CAS collisions, leases, pinned inputs, admission before
research, terminal precedence, unknown side effects, fixture refusal and immutable
promotion. Local Git integration exercises the actual executable Base64/Git Data sequence
with >1 MiB binary data and lost update acknowledgements. These are **not** live native
host certification or six new professional images.

Before complete activation: provide the supported host adapters and shared durable store,
connect trusted existing stage handlers, prove six real story-specific image jobs including
interruption recovery, then complete the first and second distinct public Briefs. Do not
launch new full Qs or claim unattended success before that evidence exists. No Work,
Codex, paid-model API, owner transfer, new credentials or low-quality fallback is authorized.

## September 30, 2026 — Same-invocation direct-capture admission

The reliable controller now has two explicit image-handoff admission modes. `native-recovery-proof-v2` remains the default and still requires the existing real producer recovery proof. `same-invocation-direct-capture-v1` is a delivery-first alternative for an execution surface that can perform native generation inside the active controller invocation but does not expose a supported cross-invocation `recover(operation_key)` callback.

Direct-capture admission is deliberately **not** a capability receipt. It records no native result ID, asserts no recovery callback, proves no image generation and proves no bytes. It only allows bounded discovery/editorial/media work to proceed. The image stage must generate one story at a time and persist the returned bytes before yielding, then perform the unchanged subject/factual/structural/editorial review and exact Git content-identity checks. Six distinct accepted/locked images, the full publication manifest, protected CI, deployment and live exact-byte verification remain mandatory.

An invoked result that becomes genuinely unobservable is handled only by the existing bounded `TASK_RESULT_UNRECOVERABLE` evidence: observed invocation, exhaustive supported search, unobservable outcome and real check time. That disposition consumes one of the same four attempts. It is never rewritten as success and never grants a fifth attempt. No deterministic/low-quality fallback is enabled by this admission mode.
