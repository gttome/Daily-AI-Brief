# Empty media slots — public copy and private diagnostics

Effective for new Daily Generative AI Brief editions beginning September 17, 2026.

When a Worth Watching video slot or the Worth Listening podcast slot has no qualifying selection, the public Brief must communicate only the editorial outcome. Operational sourcing and verification detail belongs in private editorial, QA, telemetry, checkpoint, and correction evidence.

## Fixed reader-facing copy

- Empty video slot: `No video met today’s editorial quality standards.`
- Empty podcast slot: `No podcast met today’s editorial quality standards.`

These sentences are fixed public copy. Do not substitute a dynamically generated reason from the media record.

## Public/private boundary

The public empty slot must not expose source counts, search or retrieval mechanics, unavailable sources, HTTP/network errors, redirects, candidate rejection counts or reasons, retries, media-preflight details, source-coverage gaps, date or runtime mismatches, tool/API failures, or other operational diagnostics.

Private records must continue to retain the actual reason and supporting evidence required for diagnosis, QA, editorial review, and future reliability improvements. Sanitizing the public output must not delete or weaken private evidence.

## QA contract

For every new edition with an empty media slot, QA must verify both conditions:

1. The reader-facing output contains the exact fixed sentence for that media type and no operational diagnostic detail.
2. The underlying private editorial/QA evidence still records the actual exception or rejection reason.

Historical editions are not rewritten solely to apply this presentation rule.
