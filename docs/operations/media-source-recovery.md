# Saved media source recovery

> [!IMPORTANT]
> Use the shared parser for saved Apple Podcasts and YouTube catalog responses instead
> of recreating per-run extraction workbenches. This is metadata recovery, not source
> acquisition, editorial approval, freshness approval or publication authorization.

## Executable path

```sh
node _tools/parse-media-source.mjs --kind apple --file saved-catalog.html \
  --sha256 ORIGINAL_RESPONSE_SHA256 --identity PUBLISHER_SHOW_ID --out new-metadata.json
node _tools/parse-media-source.mjs --kind youtube --file saved-channel.html \
  --sha256 ORIGINAL_RESPONSE_SHA256 --identity VERIFIED_CHANNEL_ID --out new-metadata.json
```

The automation supplies the saved file and its recorded identity/hash; these commands
are not an owner task. JSON documents are also supported. The CLI consumes actual
saved bytes, checks the original SHA-256, parses known structured data without executing
JavaScript, and invokes `_generator/lib/media-source-parsers.mjs`. It makes no network
requests, does not overwrite existing outputs, and retains the acquisition byte limit.
Wrong hashes, unsafe inputs, conflicting identities or ambiguous records fail explicitly.

Apple extraction takes the complete `playAction.episodeOffer`, not a partial
`contextAction.episodeOffer`. Episode/show/title/date/runtime and episode URL must agree.
Dates require the existing explicit timestamp/zone validation. Duplicate conflicting
complete offers are rejected; partial menu offers cannot erase verified metadata.

YouTube extraction supports `videoRenderer` and current `lockupViewModel` records.
The latter's duration badge must belong to the same video ID. Conflicting durations
fail rather than choosing one. Missing durations remain missing, not zero. Catalog
channel identity is checked, but a channel catalog alone does not prove an upload's
publication date or uploader: reconcile the selected video with its saved primary feed
and existing evidence/novelty review before selection. No relative age is converted
into an invented original publication timestamp.

## Unchanged downstream authorities

Every output explicitly says `metadata_only: true`, `editorial_review_complete: false`
and `selection_complete: false`. Continue through `normalizeMediaEvidence`, the existing
selectors and the current `media-research-cutoff-v1` gates with the original recorded
cutoff. Duration ceilings, freshness, show diversity, original dates, source review,
novelty and required media counts are unchanged. Saved evidence replay never reopens
terminal Q24/Q25, changes a selected episode, or proves a complete public Brief.

## Verification basis

Original five parser regression tests are retained. Added tests cover wrong show/episode
URLs, duplicate conflicts, ambiguous dates, cyclic input, conflicting duration badges,
known-script extraction, no JavaScript execution, exact source hashes, UTF-8 validation
and exclusive output creation. Protected CI runs the full suite before release.

The executable parser was also replayed against six exact original Q25 catalog responses:
three Apple catalogs yielded 25 complete episode records, and three YouTube catalogs
yielded 90 video runtime records. This is saved-source extraction, not 115 new eligible
or approved stories. Acquisition source hashes and replay results are retained in
`_records/hardening/media-source-parsers-2026-09-29/saved-source-replay.json`.
No publisher page was fetched again and no previous selection was repeated.

The native-image execution/result handoff remains a separate unresolved capability.
This parser release does not satisfy image admission or authorize another full Q.
