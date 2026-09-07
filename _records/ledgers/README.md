# Append-only correction and incident ledgers

Material factual corrections are appended to `corrections.jsonl`. Operational incidents are appended to `incidents.jsonl`. Each non-empty line is one immutable JSON object conforming to `_contracts/v1/ledger-entry.schema.json`.

Existing bytes may never be edited or removed. A later entry may supersede an earlier entry by ID, but history remains present. CI compares changed JSONL files with the pull-request or push baseline and rejects non-append modifications.

Trivial spelling, formatting, image-cache, and derived-view synchronization repairs belong in QA or publication records, not the factual correction ledger. No empty or invented correction entry is created merely to initialize the ledger.
