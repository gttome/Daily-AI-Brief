# Native image task delivery

## September 28, 2026 — Connector-first image transport parity

> [!IMPORTANT]
> **Current routing: `connector-first-v1`.** The existing authenticated GitHub connector is the normal image-transfer route for both production and qualification: `create_blob` (complete Base64-encoded binary bytes), `create_tree`, `create_commit`, and non-force `update_ref`. **No local GitHub token or native Git credential is required for that connector route.** This amendment corrects the adapter-precedence regression; it does not claim that an outstanding image has been uploaded.

The authoritative machine policies remain `under80-runtime-contract.json` and `efficiency-operating-policy.json`. Their normal image lane remains `github_git_data_api`, including the existing restriction on Contents-based binary transport in that lane. The PR286 file-host uploader is retained as an independently tested utility for an already authenticated file-capable host, not a replacement or prerequisite for the normal connector path. Its missing-token result is adapter-specific and must never disable or disqualify the connector. Do not rerun that local CLI merely to rediscover absent local credentials. No credential export, new credentials, Work, Codex or paid-model API is authorized.

**Payload delivery is a separate capability:** the full real image must actually reach the connector's binary-content argument using a supported execution-host mechanism. Tool exposure, a computed SHA, a Library file ID or a partial encoded snapshot is not delivery. Never put a local path or opaque file reference into a literal Base64 field. Where complete payload delivery is unavailable, record `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`, not missing GitHub authentication. Do not invent an adapter or pass fixture results as a live transfer.

**Complete the real round trip:** verify the returned blob against the original file, attach it to the current isolated handoff tree, create a commit with the live handoff head as parent, and update only that branch without force. Preserve concurrent changes; do not rebuild a recovery branch from an old main tree. Reuse existing exact blobs and the existing image read-back workflow. Require actual byte equality and SHA-256 read-back before capture completion; all V2 raw/final provenance, factual, professional-quality, differentiation and accepted-byte gates remain unchanged. A current denial stops that operation; this routing rule never authorizes an alternate endpoint to evade a safety block.

**Q24:** both earlier m04 outputs are already preserved and rejected. The third correct-subject native output and its 1200x630 candidate are preserved in Library, but their Git capture and final acceptance remain governed by live Q24 receipts. Reuse the original cutoff, five passed components, frozen requests and failures; do not generate attempt 4 or advance to m03 while the third output is unresolved. Do not infer successful native ingress from PR286's repository-local sample. The supervisor must stay on the first incomplete operation and notify only on real advancement or a new material blocker.

---


## September 28, 2026 — Separate supervision from visual instruction

> [!IMPORTANT]
> `visual-only-task-delivery-v1` supplements, but does not replace, `production-image-execution-v2`. Production and qualification use the same compiler and recovery planner. It introduces no owner-created chats, uploads, manual reviews, new credentials, Work, Codex or paid-model API calls.

A correct JSON request is not proof that its instruction reached native image generation. The two Q24 m04 outputs instead illustrated operational/branding context. The internal prompt-construction mechanism is not independently observable. The tested correction prepares an automatic **image-only task** whose user instruction is the compiled visual text, rather than asking the generator to infer a picture from the supervisor's run instructions. No hidden-context isolation is asserted and successful native generation is still unproven.

## Implementation

`_generator/lib/native-image-delivery.mjs` provides:

| Function | Obligation |
|---|---|
| `buildNativeImageDelivery` | Validate the unchanged frozen V2 request; derive a plain visual-only task prompt from its headline, visual brief, verified facts, conceptual elements, essential labels and restrictions. Keep IDs, storage, retries and acceptance logic outside that prompt. |
| `validateNativeImageDelivery` | Reconstruct and check the exact projected content and hashes. Reject a self-consistent but unrelated prompt. |
| `assertNativeImageTaskPrompt` | Compare the actual submitted task prompt to the projection. Do not certify a saved request while submitting an orchestration prompt. |
| `planNativeImageContinuation` | Inspect normalized durable attempt history; finish capture and review before another attempt; prevent duplicates; stop after four attempts; require separate verification of accepted checkpoints. |

The compiler leaves the frozen request bytes and hashes unchanged. Its envelope retains `runtime_context_isolation=not_asserted`. The native tool still receives its real exposed arguments, including a null deprecated prompt argument; the visual instructions belong in the image-only task's user prompt. Do not invent a native API parameter.

## Automatic execution-host sequence

The supervisor resolves current GitHub attempts, actual scheduled-task state and source-file identities first. It normalizes each actual attempt into the planner input: attempt number, original request hash, generation call/artifact/raw hash, verified Git capture and rejection record. A plan is not evidence that any operation ran.

For `CAPTURE_EXISTING_RAW`, automatically recover the existing native/Library bytes, verify their expected hash, store the exact bytes through a supported binary transport, and perform actual Git read-back. Library durability alone is not a Git receipt. For `REVIEW_EXISTING_RAW`, review those same bytes and preserve the rejection. For `RECOVER_OR_RECONCILE_EXISTING_ATTEMPT`, inspect actual task/output evidence; do not create a duplicate simply because an execution timestamp is absent.

Only `PREPARE_IMAGE_ONLY_TASK` permits the supervisor to persist the next attempt binding and queue **one** automatically created, single-story generation task. Set the task's prompt to `delivery.task_prompt` exactly, without prepending or appending GitHub, scheduler, capture, review, status or continuation instructions. Validate the actual task prompt, bind its returned task identifier outside the prompt, and avoid a second competing executor. The image task produces only one new illustration.

The supervisor then recovers that task's actual native output through available file capabilities and completes the unchanged V2 capture, review and final-byte acceptance sequence. No owner transfers may be requested. Actual cross-invocation recovery must be demonstrated; neither successful task creation nor a returned compiler JSON proves it. An unavailable scheduler, native tool or automatic artifact transport is a system capability blocker. Do not try to bypass a tool safety block or turn it into an owner-image task.

## Internal commands

```sh
node _tools/native-image-delivery.mjs prepare --execution request.json --out delivery.json
node _tools/native-image-delivery.mjs validate-task --execution request.json --delivery delivery.json --prompt actual-submitted-task.txt
node _tools/native-image-delivery.mjs plan --execution request.json --attempts normalized-durable-attempts.json
```

These are runner operations, not owner instructions. Preparation uses immutable writes. The compiler is not a scheduler or image API; the existing authorized execution host supplies those capabilities. The old synchronous V2 adapter coordinator remains available, but an operational supervisor must not call native generation in its own mixed-content conversation as the next Q24 remedy. Use the visual-only task boundary for this native tool interface. Do not change historical requests or receipts to claim they used the new delivery.

## Proof and preserved gates

Unit tests cover production/qualification identity, all required labels, frozen-request preservation, exclusion of execution metadata, actual submitted-prompt checking, hash tampering, duplicate prevention, unfinished raw capture, Library/Git distinction, unfinished review, request/sequence mismatch, four-attempt exhaustion and verification-only accepted-state handling. Test fixtures are not native outputs.

Protected release CI is required before adoption. A later actual native attempt must establish subject correctness and all existing factual, professional, structural, differentiated-six-image, exact-byte, manifest and qualification gates. This change neither lowers those gates nor certifies unattended production. Q24 stays nonterminal; its five completed components, original cutoff and policies must be preserved. No new Q25 or public edition is authorized by this delivery repair.
