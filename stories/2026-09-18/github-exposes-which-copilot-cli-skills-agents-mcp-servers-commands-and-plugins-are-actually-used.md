---
layout: default
title: "GitHub exposes which Copilot CLI skills, agents, MCP servers, commands, and plugins are actually used"
description: "Agent customization is becoming an operational layer that needs the same observability as models and prompts. Teams can now distinguish a large catalog of configured assets from th"
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-18/02-cli-telemetry.png?v=e69696eeaa07df9f"
permalink: /stories/2026-09-18/github-exposes-which-copilot-cli-skills-agents-mcp-servers-commands-and-plugins-are-actually-used/
brief_date: 2026-09-18
story_id: dab-story-2026-09-18-3ac3c725
reader_release: true
---

[← Daily Brief for September 18, 2026]({{ '/briefs/2026-09-18/' | relative_url }})

# GitHub exposes which Copilot CLI skills, agents, MCP servers, commands, and plugins are actually used

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Recency fallback</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source reading time unavailable</span></div><p><strong>Usage telemetry:</strong> Invocation counts describe adoption and tool mix. They need separate quality and outcome checks to assess value. Interaction counts do not measure quality or business value. MCP counts include connection attempts rather than tool calls, plugin totals overlap skill totals, and customer-defined names are intentionally grouped.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>Track which reusable agent assets are invoked, how broadly they spread, and whether high-use assets also pass quality and outcome checks before investing in more customizations.</p></div><div class="related-coverage"><strong>Earlier Brief</strong><p><a href="https://gttome.github.io/Daily-AI-Brief/stories/2026-09-12/github-separates-vs-code-agent-activity-from-generic-copilot-usage/" target="_blank" rel="noopener noreferrer">GitHub separates VS Code agent activity from generic Copilot usage</a></p><p>2026-09-12 · The September 12 story separated VS Code agent activity from generic Copilot usage. This update adds item-level CLI telemetry for skills, custom agents, MCP servers, slash commands, and plugins, including top-use and distinct-use counts.</p></div></aside>
<!-- reader-release:end -->

<span class="story-data" data-story-id="dab-story-2026-09-18-3ac3c725" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** September 17, 2026  
**Topics:** agent observability, Copilot CLI, Agent Skills, MCP, plugins, usage metrics  
**Evidence:** Official Announcement  
**Availability:** General Availability

![Textbook diagram of Copilot CLI skills, agents, MCP servers, commands, and plugins flowing into usage and distinct-use telemetry with privacy grouping.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-18/02-cli-telemetry.png?v=e69696eeaa07df9f)

**Summary:** GitHub expanded the Copilot usage metrics API with CLI customization telemetry. Reports can now show top-used skills, custom agents, MCP servers, slash commands, and plugins plus counts of how many distinct items are being used; customer-defined names are grouped to protect privacy.

**Why it matters:** Agent customization is becoming an operational layer that needs the same observability as models and prompts. Teams can now distinguish a large catalog of configured assets from the smaller set people actually invoke, identify enablement gaps, and measure whether reusable agent components are spreading.



## What to do now

**Measure reuse before expanding the catalog:** Track which reusable agent assets are invoked, how broadly they spread, and whether high-use assets also pass quality and outcome checks before investing in more customizations.

**Source:** <a href="https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/" data-item-id="dab-story-2026-09-18-3ac3c725" data-edition-date="2026-09-18" data-action="source_clicks">Agentic CLI customizations now in the usage metrics API</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-18" data-feedback-story-id="dab-story-2026-09-18-3ac3c725">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 18, 2026]({{ '/briefs/2026-09-18/' | relative_url }})
