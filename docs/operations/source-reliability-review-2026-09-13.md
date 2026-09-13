# Source reliability review — September 13, 2026

The review rechecked the ten sources flagged in September 12 discovery. Confirmed configuration/parser defects are repaired; intermittent retrieval remains unresolved. This is a dated operational assessment, not a continuous availability monitor or an editorial selection.

## Repairs

- Both discovery collectors now recognize valid unquoted HTML links, whitespace around `=`, and uppercase attributes. Google DeepMind's captured page exposed this defect. The repaired ordinary filter extracted 15 candidate links from the initial successful capture; some are navigation/product links, so this is not a count of verified news articles. The later network recheck timed out.
- AlphaSignal discovery now uses its publisher-linked [Latest page](https://alphasignal.ai/). The [archive](https://alphasignal.ai/archive) returned HTML but no article links. The replacement returned 12 candidate links in the recheck.
- TLDR AI discovery now follows the publisher's [latest-edition link](https://tldr.tech/api/latest/ai), exposed by its [signup page](https://tldr.tech/ai). It redirected to the September 11 edition and returned 20 candidate links after the first attempt timed out. No fixed edition date is configured.
- Transport failures, timeouts and server errors receive one immediate bounded retry. HTTP access denials are not retried. Both attempts are retained in future discovery records. Relative links resolve against the final response URL; fragment-only links, scripts, invalid protocols and embedded credentials are excluded. Duplicate URLs count once per source.

## Findings and next actions

| Source | Evidence in this review | Next action |
|---|---|---|
| Google DeepMind | Initial HTTP 200; old parser missed unquoted links. Replay recovered candidates. Later recheck timed out twice. | Use repaired parser on normal discovery. Retain transport failure until a fresh retrieval succeeds. |
| AlphaSignal | Archive HTTP 200 without article links; Latest HTTP 200 with 12 candidate links. | Use Latest; verify original evidence and paid-access limitations before selecting a lead. |
| TLDR AI | Signup page is not an issue catalog; publisher-linked latest redirect returned 20 candidates on retry. | Use rolling latest link. Verify dates, original claims and sponsor status. |
| Hugging Face Papers | Initial timeout; later HTTP 200 with 33 candidate links, redirected to September 11. | Retain source; normal next collection and per-paper review. This recovery did not require changing its URL. |
| AI for Humans | Homepage and episodes page initially returned HTTP 200 but no usable episode catalog for the existing filter; later homepage timed out. Previously documented Libsyn feed returned audio enclosures, but sampled episode links point to the homepage. | Assisted episode research remains necessary. A dedicated feed adapter would need stable episode identity and audio metadata handling; do not pretend a homepage is an episode permalink. |
| IBM Technology | Timeout initially; later HTTP 502 followed by timeout. | Retry through normal workflow; supported search can supply candidates if accessible. No verified replacement configured. |
| Berkeley BAIR | Repeated HTTP 502 from this retrieval path. | Retain source and flag retrieval failure. No source outage or replacement URL established. |
| Import AI | Direct requests timed out; supported web retrieval exposed no usable content. | Assisted research when available; retain incomplete coverage. |
| The Median | Direct requests timed out; supported web retrieval exposed no usable content. | Assisted research when available; retain incomplete coverage. |
| LocalLLaMA | Initial timeout; later HTTP 200 with zero candidate links. | Flag empty extraction for assisted review. Do not infer that the community had no relevant news. |

## Verification and boundaries

107 generator tests and 15 contract checks passed, including new regression checks for unquoted links, entity decoding, duplicate links, bounded retries and non-retried access denials. Repository validation and integrated system validation passed. Deployment CI is verified separately with the release.

Direct HTTP checks were performed from the available execution environment. They do not establish a publisher-wide outage or guarantee access on the next scheduled run. The final ten-source recheck returned candidates from three sources, an empty extraction from one, and unavailable results from six. Earlier successful captures remain separate evidence.

The audit lives under `_records/source-reliability/`; September 12 discovery observations, candidate queues, briefs, watchlist scores, private analytics and schedules were not rewritten. Future publisher discovery uses the repaired collectors. The Command Center's existing source displays continue to show the dated publisher records; these audit results are not substituted for a publisher run. No Command Center layout changes were made.

Source links and extraction results are leads only. No news claims, publication dates, video/podcast runtimes or editorial inclusion were established from link counts. No paid access or authentication restrictions were bypassed.
