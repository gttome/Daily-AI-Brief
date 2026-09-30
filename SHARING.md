# Daily AI Brief — Per-Item Sharing

This feature is implemented globally through the site layout, so every published Daily AI Brief automatically receives per-item sharing controls without adding share markup to each briefing.

## Reader experience

Each numbered briefing item receives a compact button in the form:

`↗ Share · 24`

The number is the count of recorded share actions for that specific Daily AI Brief item.

On devices and browsers that support the Web Share API, the button opens the native operating-system share sheet. This includes modern Android and iOS browsers and supported desktop browsers. If native sharing is unavailable, the site opens a responsive fallback panel with Copy Link, Email, WhatsApp, LinkedIn, Facebook, and X.

The shared URL points to the permanent archived Daily AI Brief page and directly to the selected item, for example:

`/Daily-AI-Brief/briefs/2026-09-01/#story-3`

When a qualifying YouTube link appears in the Worth Watching section, it also receives an item-specific share control and permanent fragment link such as `#video-1`.

## Share-count definition

The visible count records successful share actions that the site can observe:

- Native share operation resolves successfully.
- Copy Link succeeds.
- A fallback share destination is selected.

A browser cannot reliably determine whether a recipient ultimately received or opened a message after the operating-system share sheet hands off the content. Therefore the number is an engagement/share-action count, not a verified-delivery count.

## Counter storage

The site is static GitHub Pages, so persistent cross-device counts are stored through the lightweight public CountAPI replacement at `countapi.mileshilliard.com`. Counter keys are unique per brief date and item, for example:

`daily-ai-brief-shares-2026-09-01-story-1`

If the external count service is temporarily unavailable, sharing still works and the browser preserves an immediate local fallback count. The global service is public and unauthenticated, so these counts are useful lightweight engagement indicators rather than tamper-proof analytics. If audited analytics become necessary, replace the counter adapter in `assets/js/share.js` with an authenticated serverless endpoint while keeping the same UI.

## Files

- `_layouts/default.html` — loads the global share CSS and JavaScript and exposes `brief_date` to the client when present.
- `assets/js/share.js` — discovers briefing items and qualifying YouTube links, creates permanent anchors, invokes native/fallback sharing, and reads/increments counts.
- `assets/css/share.css` — responsive share-button, fallback-panel, target-highlight, and toast styles.

## Publication requirements

The normal daily briefing format should continue to use numbered H2 headings such as:

`## 1. Story headline`

Archived brief files should retain their existing `brief_date: YYYY-MM-DD` front matter. The homepage script can also derive the briefing date from the displayed H1 date, so the feature continues to work when `index.md` is refreshed from `latest.md`.

YouTube links intended for individual sharing should appear under the `## Worth Watching` section and use normal YouTube or youtu.be URLs.

## QA checklist

Before release, verify:

1. Every numbered story shows one Share button.
2. The button displays a numeric count.
3. On Android/iOS, tapping Share opens the native share sheet when supported.
4. On desktop browsers without native share support, the fallback panel opens.
5. Copy Link produces the archived item URL, not merely the external source URL.
6. Shared story URLs end in the correct `#story-N` anchor and scroll to that story.
7. Qualifying Worth Watching YouTube links receive their own share controls.
8. Cancelling the native share sheet does not increment the count.
9. A completed native share or fallback action increments the visible count.
10. Archive pages retain the same per-item buttons and counters.
