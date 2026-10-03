# Append-only correction and incident ledgers

Material factual corrections are appended to `corrections.jsonl`. Operational incidents are appended to `incidents.jsonl`. Each non-empty line is one immutable JSON object conforming to `_contracts/v1/ledger-entry.schema.json`.

Existing bytes may never be edited or removed. A later entry may supersede an earlier entry by ID, but history remains present. CI compares changed JSONL files with the pull-request or push baseline and rejects non-append modifications.

Correction writers must compute the deterministic semantic fingerprint implemented in `_generator/lib/ledger.mjs` before appending. A matching fingerprint is a no-op, not a new event. CI rejects unreconciled semantic duplicates even when their IDs or timestamps differ. If a duplicate already exists in immutable history, append one resolved, non-material correction with a null `story_id` and every canonical and duplicate entry ID in `related_entry_ids`; the original bytes remain intact while reporting counts only the canonical events.

Trivial spelling, formatting, image-cache, and derived-view synchronization repairs belong in QA or publication records, not the factual correction ledger. No empty or invented correction entry is created merely to initialize the ledger.
