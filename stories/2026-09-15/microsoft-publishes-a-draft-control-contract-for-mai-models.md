---
layout: default
title: "Microsoft publishes a draft control contract for MAI models"
description: "Microsoft AI’s draft code separates absolute constraints, configurable defaults, monitoring, and human interruption—but is not yet deployed training policy."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/02-humanist-ai-control-layers.png?v=20260915textbook"
permalink: /stories/2026-09-15/microsoft-publishes-a-draft-control-contract-for-mai-models/
brief_date: 2026-09-15
story_id: dab-story-2026-09-15-b7d4e8a1
reader_release: true
---

[← Daily Brief for September 15, 2026]({{ '/briefs/2026-09-15/' | relative_url }})

# Microsoft publishes a draft control contract for MAI models

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 6 min read</span></div><p><strong>Control contract:</strong> A control contract states intended behavior and boundaries. It becomes operational only when paired with training, tests, monitoring, and enforcement.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to separate absolute constraints, configurable defaults, monitoring, and human interruption.</p></div></aside>
<!-- reader-release:end -->

<span class="story-data" data-story-id="dab-story-2026-09-15-b7d4e8a1" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** September 14, 2026  
**Topics:** model behavior, guardrails, human control, public consultation  
**Evidence:** Official Announcement  
**Availability:** Proposed

![White-background layered textbook cutaway placing a human goal inside useful defaults, operator control, absolute constraints, and monitoring, with correction, pause, shutdown, audit trace, and public-feedback pathways around a clearly marked draft blueprint.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/02-humanist-ai-control-layers.png?v=20260915textbook)

**Summary:** Microsoft AI published a draft Humanist AI Code of Conduct for a six-week public consultation. It describes intended model behavior, absolute constraints, operator-configurable defaults, uncertainty handling, evaluation, monitoring, and a requirement that MAI models remain subject to human interruption, correction, and shutdown.

**Why it matters:** The document is useful as an inspectable behavioral contract: teams can translate values into tests, escalation rules, and operational controls. Microsoft explicitly says the draft is not being used to train its models today, so it is a proposal and future governing document—not evidence that deployed systems already satisfy every stated behavior.

<span class="story-editorial-note" data-george-implication="Use the draft as a workshop comparison point: separate absolute constraints from configurable defaults, then require an observable test, owner, escalation path, and shutdown mechanism for each important agent behavior." hidden></span>

## What to do now

**Turn principles into tests:** Choose one absolute constraint and one configurable default, then define measurable pass, fail, escalation, and shutdown behavior.

**Source:** <a href="https://microsoft.ai/news/mai-code-of-conduct/" data-item-id="dab-story-2026-09-15-b7d4e8a1" data-edition-date="2026-09-15" data-action="source_clicks">Humanist AI in practice: A public consultation on our Code of Conduct for MAI Models</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-b7d4e8a1">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 15, 2026]({{ '/briefs/2026-09-15/' | relative_url }})
