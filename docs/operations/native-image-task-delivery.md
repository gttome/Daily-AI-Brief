# Native image task delivery

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
