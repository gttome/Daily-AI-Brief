# Cloud checkpoint transport and ordinary-edition observation

This is the publisher's durable-file transport procedure. Use the existing ChatGPT Library capability within the owner's account. No new paid service, API runner, schedule, public storage, or Site deployment is required. Read the installed Library skill for the current tool schemas and transfer helpers.

## Evidence levels

Keep these states separate: local_checkpoint_saved; cloud_upload_confirmed; cloud_readback_verified; scheduled_readback_verified; scheduled_draft_recovery_verified. A same-session cloud round trip proves only cloud_readback_verified. A filesystem path, saved prompt, test suite, usage database row or Site deployment does not prove scheduled recovery. Only actual receipts may advance status.

## Prepare and save

1. At ordinary publisher startup, resolve the owner's dedicated Library folder named Daily AI Brief Private Checkpoints. This folder was created for private checkpoints; do not share it or its files. Do not substitute Shared with me, a shared project destination or a Site projection. If ownership/private destination cannot be established, record a storage blocker and keep evidence local and outside public Git.
2. Use a dedicated owner-only filesystem evidence root outside every repository, with mode 0700. Do not use an entire home, workspace, checkout or download directory. Keep credentials, cookies, environment files and authentication tokens out of this root. Save only the publisher's private evidence, drafts, reviewed inputs, telemetry and recovery receipts. A local root is a staging area; it becomes durable only after a successful cloud upload.
3. Initialize or resume the same production-run manifest. Execute save-draft after each useful writing/image draft or revision; after the full six-image approval gate, execute save-images. Before packaging, retain the current private candidate canonical JSON and any visual-approval inputs needed to resume an unpublished candidate. These remain private and are not an approved release.
4. After each useful save, and after shared discovery/evidence stages, pause writes briefly and run from the checked-out repository:

   node _tools/private-checkpoint-bundle.mjs pack --root <absolute-private-root> --output <absolute-private-bundle-outside-root-and-repo>

   Choose a unique file name containing edition, attempt and timestamp. The helper snapshots all files without truncation, rejects links/unsafe paths, requires an owner-only root, and returns a SHA-256 receipt. Limits are 100 MiB uncompressed, 45 MiB compressed and 10,000 files. If exceeded, report the blocker; never silently omit evidence or delete prior drafts to fit.
5. Use Library create_library_file for the private bundle in that dedicated folder. Retain the exact returned Library file ID/version, file ID, filename, upload time, bundle SHA-256, original root, attempt ID and saved checkpoint IDs in a small private receipt. Save the receipt in the same folder. Use immutable, uniquely named bundles/receipts; do not replace earlier snapshots. Save receipts through the Library skill's ordered transfer route. Never put their IDs, local paths, source extracts, prompts or private usage in public Git.
6. Materialize the just-saved bundle to a separate private download location through the supported Library helper, then run:

   node _tools/private-checkpoint-bundle.mjs verify --root <original-private-root> --bundle <downloaded-bundle> --sha256 <receipt-sha256>

   Only successful upload plus exact-byte readback establishes cloud_readback_verified. Keep the original files. If upload succeeds but receipt save fails, report an incomplete save and use the immutable filename to resolve it next time; do not claim there is no saved work or blindly duplicate it.

## Later cloud recovery

1. During a later ordinary run or authorized continuation, retrieve the matching immutable receipt and bundle from the same owner-only destination. Select by exact edition and attempt; never guess from the newest filename alone. Read the receipt; materialize the bundle using the Library skill.
2. Verify its independent SHA-256 receipt with the helper. Its original absolute root must match; do not rewrite absolute paths, manifest hashes or evidence to make restoration pass. If that root is unavailable or unsafe in this runtime, report a relocation blocker. The current recovery format is intentionally same-root.
3. If working files are genuinely missing, restore with:

   node _tools/private-checkpoint-bundle.mjs restore --root <original-private-root> --bundle <downloaded-bundle> --sha256 <receipt-sha256> --restore

   It preflights every artifact and refuses differing existing files, symlinks, hardlinks, traversal, duplicate entries and file/directory collisions. It only writes missing private files. An interrupted write remains detectable by hash; no automatic cleanup or overwrite is authorized. Transport restoration never writes repository files or grants approval.
4. Resume the original canonical candidate and reviewed inputs only after checking current repository baseline, source freshness and policy compatibility. Run existing recover-draft or recover-images checks with the original manifest and checkpoint IDs. A restored rejected image stays rejected. Every final editorial, visual, contract, CI, publication and live gate remains mandatory.
5. Retain an actual recovery receipt identifying original save time, new runtime/session observation, same attempt, integrity result, original review status, current recovery result and remaining gates. Only a later scheduled publisher doing this establishes scheduled recovery. A later manual session is manual cross-session evidence, not scheduled evidence.
6. Do not delete useful work, force an interruption, rerun the publisher or generate images solely to test this path. If no interruption occurs, scheduled readback can be verified without restoring files; actual interrupted-draft restoration remains unobserved.

## Private usage authentication

Retrieve the current Command Center through Sites get_site. Send the existing token as:
OAI-Sites-Authorization: Bearer <token>

The literal Bearer prefix and one separating space are required. Keep the token in memory only; never print it, save it in a checkpoint, put it in a URL or change Site sharing. The September 14 audit's 401 came from a request missing this prefix; correctly formatted GET /api/usage returned 200 and the existing records. No service repair or token rotation was needed.

Read metrics from each attempt's metrics array, retaining measurement_status, source and coverage. The September 14 private time ends before public final QA; do not rewrite either measurement or treat the difference as savings. Validator reads remain read-only; comments require retain=false. Collection writes remain the publisher's separate authorized operation.

## Three ordinary completed editions

Use the first three actual completed editions running the updated pipeline, not the three pre-rollout baselines. Count one edition once even if it has later repairs. Keep attempts and later revisions linked, preserving all failures. As of the September 14 audit, optimized completed editions = 0; no forecast may advance the count.

During ordinary publishing save actual retrieval metrics, cache hits/misses, shared-request reuse, checkpoint stage reuse/invalidations, packet consumption, writing/image drafts and rejects, repairs, stage intervals and final completion boundary. Preserve original source observation times and due/not-due/failed/assisted dispositions. Cache hits, shared in-flight requests and restored stages are distinct measures. A stage reused in a later invocation must not count all historical cache events again.

Use the current efficiency contract for public-safe records. Keep private receipts and raw metrics outside Git, and leave unavailable fields null. Export only schema-supported, reviewed public-safe fields through the established report builder. Do not invent new fields inside a strict contract or treat snapshot byte/character counts as token measurements.

After passing ordinary completion gates, compare like-for-like scopes with historical baselines. Review quality, source coverage and repairs alongside duration. Extend to seven completed editions if three are inconclusive because of missing telemetry, variable coverage or repairs. Seven does not justify estimated credits or token savings. Exact attributable platform usage remains null without platform evidence.

The validator may read these records and report observations, but must not write acknowledgments, checkpoints, usage, private snapshots or repository files. Preserve the existing 07:00 publisher and 09:00 validation/sync settings. The separately authorized Sites synchronization and explicit affected-Site incident production approval rules remain unchanged.

## Rollout status

The transport helper and cloud upload/readback were tested with a clearly labeled storage probe containing no generated images, source text or reader data. This is not an ordinary edition and does not count toward the three-edition sample. The next actual scheduled run must establish its own access and receipts. A missing separate validation run report remains missing evidence; publisher-integrated QA is not a replacement report.
