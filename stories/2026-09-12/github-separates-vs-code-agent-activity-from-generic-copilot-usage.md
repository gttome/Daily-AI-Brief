---
layout: default
title: "GitHub separates VS Code agent activity from generic Copilot usage"
description: "New Copilot metrics distinguish VS Code Agents-window activity, time windows, access policy, and unavailable data from broader usage rollups."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-12/02-vscode-agent-metrics.png?v=20260912textbook"
permalink: /stories/2026-09-12/github-separates-vs-code-agent-activity-from-generic-copilot-usage/
brief_date: 2026-09-12
story_id: dab-story-2026-09-12-8b2e61d4
reader_release: true
---

[← Daily Brief for September 12, 2026]({{ '/briefs/2026-09-12/' | relative_url }})

# GitHub separates VS Code agent activity from generic Copilot usage

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated at 200 words per minute for the summary, significance, practical step, and context note; linked reading and media are excluded.">About 1 min read</span></div><p><strong>Activity versus outcomes:</strong> Sessions and messages describe how much a tool is used. They do not show whether its work is correct or valuable.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>What agent activity reports measure, why missing values matter, and why usage alone does not establish quality or value.</p></div><div class="related-coverage"><strong>Earlier Brief</strong><p><a href="https://gttome.github.io/Daily-AI-Brief/stories/2026-09-10/microsoft-argues-ai-value-should-be-measured-in-completed-work-not-prompt-volume/" target="_blank" rel="noopener noreferrer">Microsoft argues AI value should be measured in completed work, not prompt volume</a></p><p>2026-09-10 · Earlier: measure completed work. Here: understand what activity fields can and cannot establish.</p></div></aside>
<!-- reader-release:end -->

<span class="story-data" data-story-id="dab-story-2026-09-12-8b2e61d4" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** September 11, 2026  
**Topics:** agent observability, usage metrics, adoption measurement, data availability  
**Evidence:** Official Changelog  
**Availability:** General Availability

![Isometric observability cutaway tracing VS Code agent-window activity through a policy gate into one-day, twenty-eight-day, aggregate, and per-user reports, with unavailable fields explicitly marked null.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-12/02-vscode-agent-metrics.png?v=20260912textbook)

**Summary:** GitHub added generally available VS Code Agents-window fields to Copilot usage reports for one-day and 28-day periods. Aggregate reports can expose active users, sessions, and user messages; user-level reports can expose whether the window was used plus session and message totals. The optional fields remain absent or null when data is unavailable.

**Why it matters:** Agent adoption needs a defined measurement boundary. GitHub explicitly separates the dedicated Agents window from editor Agent Mode and generic usage rollups, which reduces misleading comparisons. These fields measure activity, not task quality, business value, safety, or correctness, and access depends on enabled policy and authorized roles.

<span class="story-editorial-note" data-george-implication="For consulting dashboards, label the surface, time window, population, and missing-data semantics. Pair adoption counts with completed-work evidence, review outcomes, and qualitative failure notes before drawing an ROI conclusion." hidden></span>

## What to do now

**Separate activity from outcomes:** Instrument agent surfaces distinctly and add task-quality measures before interpreting adoption.

**Source:** <a href="https://github.blog/changelog/2026-09-11-add-vs-code-agents-to-copilot-usage-metrics/" data-item-id="dab-story-2026-09-12-8b2e61d4" data-edition-date="2026-09-12" data-action="source_clicks">Add VS Code Agents to Copilot usage metrics</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-12" data-feedback-story-id="dab-story-2026-09-12-8b2e61d4">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 12, 2026]({{ '/briefs/2026-09-12/' | relative_url }})
