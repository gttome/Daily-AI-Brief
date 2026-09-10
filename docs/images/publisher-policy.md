# Daily AI Brief — Story Image Publisher Policy

Status: **Required**

This policy governs the six story images in every `full_v1` Daily AI Brief edition.

## Canonical visual benchmark

The September 9, 2026 story-image set is the repository benchmark for visual quality, especially:

- `briefs/images/2026-09-09/01-enterprise-managed-sandbox.png`
- the other five images under `briefs/images/2026-09-09/`

Future custom images must be comparable in **professional finish, information density, instructional clarity, depth, annotation quality, and textbook-illustration polish**. Matching the benchmark does not mean copying its subject or exact layout; each story must have its own composition.

## Required visual standard

Every custom story image MUST:

- use a dominant white or near-white background;
- be exactly **1200×630 PNG** and render as the complete uncropped canvas;
- look like a professionally commissioned technical/editorial textbook plate, not a presentation placeholder;
- use refined vector or semi-realistic diagram rendering with subtle depth, shading, linework, hierarchy, and polished icons;
- contain enough meaningful story-specific components to explain the core mechanism or implication visually;
- use layered system views, cutaways, annotated workflows, control planes, evidence paths, comparison structures, or similarly information-rich constructions when appropriate;
- use concise, legible labels and callouts with safe margins and mobile readability;
- remain factually grounded in the story and avoid invented claims;
- be materially differentiated from the other five images in concept and composition while retaining the common white-background textbook aesthetic.

## Explicit failures

The following FAIL the image gate:

- simple or blocky placeholder diagrams;
- sparse icon rows or generic box-and-arrow slides;
- title cards, logo-only art, or mostly-text graphics;
- dark hero backgrounds or cinematic/stock-photo compositions;
- generic AI brains/robots unrelated to the story;
- repeated templates with only labels swapped;
- clipped, cropped, distorted, crowded, or illegible diagrams;
- programmatic low-detail SVG/PNG substitutes created only because the preferred image-generation path was unavailable.

## No quality downgrade / no fallback rule

**Image quality may not be relaxed to complete a publication.** If the normal high-quality image-generation capability is unavailable, slow, or fails, the publisher must leave the candidate off production and report the image gate as FAIL/Pending. It must **not** substitute a simplified programmatic block diagram, sparse SVG, title card, stock visual, or other lower-quality placeholder.

A manually or programmatically constructed illustration is acceptable only when it is deliberately designed to meet the full benchmark above and passes rendered visual inspection; programmatic generation is never an automatic fallback.

## Required QA

Before merge and again after GitHub Pages deployment, inspect all six rendered images individually and as a set. QA must compare them with the September 9 benchmark and explicitly verify:

1. textbook-level professional finish;
2. story-specific explanatory value;
3. adequate visual detail and component richness;
4. refined depth, iconography, hierarchy, and annotations;
5. 1200×630 full-canvas rendering with no clipping;
6. white/near-white background and restrained professional accents;
7. material differentiation across all six images.

File existence, metadata, dimensions, or an accessibility pass alone do **not** prove image quality. If rendered quality is materially below the September 9 benchmark, QA must fail and repair the images before publication can be reported PASS.

### Stricter visual gate — September 10 recovery

The six accepted `premium3` illustrations in the September 10 edition supplement the earlier benchmark. The superseded September 10 cylinder-and-icon set is an explicit negative example: repeating a template with different labels fails even when every file is valid and readable.

Inspect every final PNG individually at its published size and compare the complete set before merge. Record the exact asset hashes, composition-specific assessment, meaningful components, rejected attempts and regeneration outcomes in a dated image-quality record. Aim for 6–12 or more meaningful story-specific components where appropriate; component count alone never proves quality. Primary labels must remain readable, while fine details may require opening the full image on mobile.

Fail any primarily simplistic, generic, sparse, flat, title-card, low-detail icon-board or repeated-template image. Decorative props and scenery do not count as instructional richness. The gate must explicitly judge refinement, professional finish, conceptual storytelling, useful visual depth and material differentiation. An external-looking log, screenshot, chart or runtime setting must be clearly conceptual unless it is verified source evidence. Never represent a self-review as an external human or independent-agent review.

For an image recovery, compare all replacement hashes against the observed main baseline and confirm every requested image changed. Record failed attempts honestly. Preserve prior QA entries and append the reason an earlier visual PASS was superseded. Rerun deterministic publication, integration, accessibility and append-only checks, then verify the deployed image bytes and reader surfaces before recording final publication PASS.

## Cache and replacement behavior

When replacing an already-published story image, prefer a new versioned asset filename and update the canonical `path`, `cache_key` and `public_url`, regenerate all derived reader surfaces from the canonical edition, and verify the exact public asset after deployment. Do not rely on a stale branch URL or browser cache when judging the replacement.

The September 10 recovery demonstrated that changing a query cache key alone can still serve stale raw-main bytes. If a byte comparison fails, use a new asset filename and regenerate the reader surfaces; do not report success from a Pages build alone.
