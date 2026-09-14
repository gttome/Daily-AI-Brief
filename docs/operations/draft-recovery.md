# Private unfinished-draft recovery

Use this preparation-runner extension during writing and image review. It does not generate, approve, commit or publish content. Verify the scheduled environment can access durable private storage before relying on interrupted-run recovery.

## Save each useful draft

After producing or revising a writing draft or PNG image draft, place its working file and a JSON descriptor inside the existing private evidence root, outside public Git. Call:

```text
node _tools/production-run.mjs save-draft --manifest <private-manifest> --file <private-descriptor.json>
```

The descriptor is one object with:

- `kind`: `writing` or `image`.
- `draft_id`: a nonempty local identity for the draft, up to 160 characters.
- `story_id`: an existing selected story in the manifest's canonical edition.
- `artifact_path`: absolute path to the private working file, outside the immutable draft archive. Writing must be nonempty UTF-8; image drafts must have a PNG signature. Files are limited to 25 MiB. This format check is not a final image-quality check.
- `packet`: the current reviewed evidence packet with matching story source URL, source-content hash and verified claims.
- `generation_instructions`: the actual instructions used for this draft. Keep these private.
- `review`: an object with `status` (`pending`, `needs_revision` or `rejected`) and factual `notes`. Include completed checks, remaining issues and rejection reasons. `approved` is deliberately unsupported here.
- `spec`: for images, the reviewed visual specification required by `visualPreflight`, with claim references, current/planned/unknown relationships and its explicit review checks. Writing drafts do not need this field.

Retain the returned checkpoint identifier in the private attempt evidence. Each checkpoint stores immutable artifact bytes, full source packet, instructions, visual specification when present, review notes and a timestamped integrity record. New saves preserve prior versions. A save interrupted before the atomic directory rename leaves an incomplete private staging directory, not a usable checkpoint. Do not automatically delete prior drafts or staging evidence.

## Inspect or restore

```text
node _tools/production-run.mjs recover-draft --manifest <same-private-manifest> --file <private-descriptor.json> --checkpoint <returned-checkpoint>
```

This checks recoverability without restoring a file. Add `--restore` to restore missing working bytes inside the private evidence root. It never overwrites a different working draft, writes a public repository asset or restores into the immutable archive. The descriptor may name a new private working path; it must provide the current story evidence, instructions and image specification for comparison.

Recovery binds the same attempt, edition, cutoff, article window, selected story, reviewed packet, generation instructions and image preflight. It checks hashes of the publisher runbook, runner, draft/manifest implementation and, for images, image policy and approval/preflight implementations. Changed inputs, corrupt records/bytes or unsafe paths return `requires_review`. This check is not exhaustive publication dependency validation: source freshness and every final contract/editorial/image gate still apply.

A successful result is `recoverable_draft`, always `approval: not_granted` and `requires_final_gates: true`. The returned private evidence file retains original notes. A recovered rejected image stays rejected; use its notes to revise or discard it, never to bypass review. Restore does not perform a fresh source check or update original observation times. An unchanged rejected draft can be retained for reference without repeating the same failed generation.

Keep completed image approval separate: only `save-images` and `recover-images` under the existing full six-image gate cover approved assets. These draft commands cannot create an approved-image checkpoint or release manifest. They require an explicit save after each useful draft; work not saved before interruption cannot be recovered. They do not introduce a background writer, new schedule, paid API call or unattended end-to-end publisher.

## Validation evidence

Automated fixtures cover interrupted writing restoration, preserved rejected-image status, changed-input/policy invalidation, corruption, retained old versions, traversal and link escapes, archive protection and the real preparation CLI. They use fixture prose and PNG draft bytes, generate no images and do not establish production token or credit savings.
