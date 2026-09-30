# Image file transfer — one reusable operation

## September 28, 2026 — Connector-first image transport parity

> [!IMPORTANT]
> **Current routing: `connector-first-v1`.** The existing authenticated GitHub connector is the normal image-transfer route for both production and qualification: `create_blob` (complete Base64-encoded binary bytes), `create_tree`, `create_commit`, and non-force `update_ref`. **No local GitHub token or native Git credential is required for that connector route.** This amendment corrects the adapter-precedence regression; it does not claim that an outstanding image has been uploaded.

The authoritative machine policies remain `under80-runtime-contract.json` and `efficiency-operating-policy.json`. Their normal image lane remains `github_git_data_api`, including the existing restriction on Contents-based binary transport in that lane. The PR286 file-host uploader is retained as an independently tested utility for an already authenticated file-capable host, not a replacement or prerequisite for the normal connector path. Its missing-token result is adapter-specific and must never disable or disqualify the connector. Do not rerun that local CLI merely to rediscover absent local credentials. No credential export, new credentials, Work, Codex or paid-model API is authorized.

**Payload delivery is a separate capability:** the full real image must actually reach the connector's binary-content argument using a supported execution-host mechanism. Tool exposure, a computed SHA, a Library file ID or a partial encoded snapshot is not delivery. Never put a local path or opaque file reference into a literal Base64 field. Where complete payload delivery is unavailable, record `CAPABILITY_BLOCKED_CONNECTOR_BINARY_PAYLOAD_DELIVERY`, not missing GitHub authentication. Do not invent an adapter or pass fixture results as a live transfer.

**Complete the real round trip:** verify the returned blob against the original file, attach it to the current isolated handoff tree, create a commit with the live handoff head as parent, and update only that branch without force. Preserve concurrent changes; do not rebuild a recovery branch from an old main tree. Reuse existing exact blobs and the existing image read-back workflow. Require actual byte equality and SHA-256 read-back before capture completion; all V2 raw/final provenance, factual, professional-quality, differentiation and accepted-byte gates remain unchanged. A current denial stops that operation; this routing rule never authorizes an alternate endpoint to evade a safety block.

**Q24:** both earlier m04 outputs are already preserved and rejected. The third correct-subject native output and its 1200x630 candidate are preserved in Library, but their Git capture and final acceptance remain governed by live Q24 receipts. Reuse the original cutoff, five passed components, frozen requests and failures; do not generate attempt 4 or advance to m03 while the third output is unresolved. Do not infer successful native ingress from PR286's repository-local sample. The supervisor must stay on the first incomplete operation and notify only on real advancement or a new material blocker.

---


**Policy:** `github-image-file-transfer-v1`  
**Applies to:** production and qualification image transport; does not change image-generation, review, or acceptance policies.

> [!IMPORTANT]
> Read the actual local image, commit it with one GitHub Contents API write, retrieve raw bytes at the returned immutable commit, and compare exact bytes, SHA-256 and Git blob identity. Do not build a new per-image workflow, manually copy Base64, split images into text files, or ask the owner to upload an image.

## Runner interfaces

`_generator/lib/github-image-transfer.mjs` exports `transferImageFile`. `_tools/github-image-transfer.mjs` is its executable file-backed command. `.github/actions/transfer-image` exposes the same operation to an existing GitHub Actions job. Node 20 or newer is required; no paid image API or new credential is introduced.

```sh
node _tools/github-image-transfer.mjs \
  --file "$LOCAL_IMAGE" --repo gttome/Daily-AI-Brief \
  --branch "$EXISTING_HANDOFF_BRANCH" --destination "$IMMUTABLE_IMAGE_PATH" \
  --sha256 "$OBSERVED_ORIGINAL_SHA256" --receipt "$NEW_LOCAL_RECEIPT_PATH"
```

The authenticated host supplies its existing `GH_TOKEN` or `GITHUB_TOKEN`; tokens are not passed in command arguments or logged. This is an internal runner operation, not an owner task. All binary encoding occurs in executable code. A model never has to reproduce the file's Base64 text.

## Normal transaction

| Step | Operation |
|---|---|
| Inspect | Open an actual regular PNG/WebP, reject symlinks, verify source hash and image structure; maximum 25 MiB by application policy |
| Preflight | Read the explicit existing unprotected branch and immutable destination identity |
| Create or reuse | One Contents PUT creates the file and commit together; identical existing bytes require no write; different bytes fail without overwrite |
| Verify | Request `application/vnd.github.raw+json` at the returned commit, even when the object response has empty content for a large image |
| Receipt | Return `TRANSFER_VERIFIED` only after exact Buffer equality, SHA-256 and Git blob SHA-1 comparison |

Typical new upload: four HTTP requests, including **one write**. Typical identical reuse: three reads and zero writes. The metadata-only empty content field for images over 1 MiB is not treated as a missing file. The operation preserves raw bytes; it does not resize, re-encode or normalize the image. Exact-commit verification is not a promise that an unrelated concurrent writer cannot later change a branch. Keep one image writer per handoff branch; ordinary GitHub conflicts fail closed.

Destination rules allow raw attempt PNG/WebP paths and versioned final images on explicit editorial-handoff branches. Independent transport proofs use only `image-transfer-proof/*` branches and `_records/image-transfer-proof/*` paths. Main, unrelated branches, arbitrary repository files and protected branches are denied. Existing accepted image paths cannot be overwritten; any legitimate replacement needs a new versioned path and the existing replacement/quality gates.

## Recovery without wasted generations

| Result | Required response |
|---|---|
| `TRANSFER_VERIFIED` | Bind this receipt to the image execution; continue the separate factual/editorial review |
| `IMMUTABLE_IMAGE_PATH_CONFLICT` | Preserve both identities; do not overwrite or re-encode to hide the conflict |
| `WRITE_OUTCOME_UNCERTAIN_RECONCILE_BEFORE_RETRY` | Inspect the same immutable destination through the normal operation; identical stored bytes are verified and reused without another write |
| `COMMITTED_IMAGE_READBACK_PENDING` | Keep the returned commit/path; retry only the read/reconciliation, not generation |
| `TRANSFER_DENIED` / `TRANSFER_CONFLICT` | Stop; no alternate endpoint, force update or blind retry |
| `CAPABILITY_BLOCKED_AUTHENTICATED_FILE_HOST_REQUIRED` | The current host lacks the required authenticated file executor; do not invent credentials or shift work to the owner |
| Known tool safety block | Set `knownSafetyBlock=true` / `--known-safety-block`; this operation refuses to replay the blocked action through another transport |

A receipt means transport only. The source image may be wrong or rejected. `image_acceptance_asserted=false` is intentional. V2 factual, structural, professional-quality, six-image differentiation, exact-byte and final-publication gates remain mandatory.

## Host availability is separate from code release

The file and an existing authorized GitHub credential must be available on the **same execution host**. The available ChatGPT text-only GitHub connector does not acquire a file-backed upload argument merely because this helper exists. A runner that has only a Library reference or opaque file ID must first recover actual bytes through a supported automatic file path. A runner with no network or credential cannot execute this command. No credentials may be copied out of the connector or manufactured.

The September 28 active chat had local images but no supplied GitHub credential and no working direct GitHub DNS. GitHub Actions can use its existing repository token. A live round-trip on an independent proof branch validates this transfer implementation; it does not prove a newly generated ChatGPT image can automatically reach that runner.

**Q24 restriction:** the prior attempt-2 tree/branch write was reported blocked by tool safety checks. This new transport is not authorization to replay that particular action through the Contents API, Actions or another endpoint. Preserve the verified Library snapshot, pending Git capture and failed subject result until the restriction is legitimately resolved. Do not claim Q24 recovery, attempt 3 or unattended image acceptance based on a separate transfer test.

## Verification and sources

The regression suite covers real byte encoding, large-image raw reads with empty metadata content, identical reuse, overwrite refusal, source/returned hash mismatches, protected branches and path guards, authentication, symlinks, size/structure, HTTP denials, write uncertainty and read-back failures. The live proof must commit an existing actual PNG over 1 MiB to an isolated proof branch and repeat the identical operation with zero additional writes. It is a transport proof, not generated-image approval.

GitHub reference: https://docs.github.com/en/rest/repos/contents — Create or update file contents; Get repository content, including large-file raw media behavior. No browser upload limitation was used to weaken any gate.
