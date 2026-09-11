---
layout: default
title: "Atlassian’s TWG CLI installs one reusable skill package across major agent tools"
description: "Atlassian’s updated TWG CLI documentation shows an installer placing reusable skills in the universal .agents/skills directory for tools including Codex, Cursor, Gemini CLI, GitHub Copilot, "
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-11/06-atlassian-agent-skills.png?v=20260911textbook"
permalink: /stories/2026-09-11/atlassian-s-twg-cli-installs-one-reusable-skill-package-across-major-agent-tools/
brief_date: 2026-09-11
story_id: dab-story-2026-09-11-bc8138fb
---

[← Daily Brief for September 11, 2026]({{ '/briefs/2026-09-11/' | relative_url }})

# Atlassian’s TWG CLI installs one reusable skill package across major agent tools

<span class="story-data" data-story-id="dab-story-2026-09-11-bc8138fb" hidden></span>

**Focus:** Agents for Non-Technical People  
**Date:** September 10, 2026  
**Topics:** Agent Skills, SKILL.md, reusable workflows, cross-agent portability  
**Evidence:** Official Documentation  
**Availability:** General Availability

![Exploded reusable skill package containing SKILL.md, product semantics, workflows and on-demand references, installed through a universal directory and routed to several compatible agent runtimes with review controls.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-11/06-atlassian-agent-skills.png?v=20260911textbook)

**Summary:** Atlassian’s updated TWG CLI documentation shows an installer placing reusable skills in the universal .agents/skills directory for tools including Codex, Cursor, Gemini CLI, GitHub Copilot, and Rovo Dev, with a compatibility copy for Claude tooling. The package separates an operating contract, product semantics, workflow instructions, and references loaded when needed.

**Why it matters:** This is a concrete distribution pattern for reusable procedural knowledge: one reviewed package can serve several compatible runtimes without pasting a long prompt each time. Compatibility does not guarantee identical behavior, permissions, or tool access, and Atlassian documents network allowlisting requirements that administrators must assess.

**For George’s work:** Package one recurring book, workshop, or consulting workflow as a small reviewed skill. Keep references modular, test it in two runtimes, compare outputs and permissions, and version the package before sharing it.

## What to do now

**Build one reusable skill:** Package a bounded workflow with concise instructions, modular references, explicit review, and cross-runtime tests.

**Source:** [Agent Skills](https://developer.atlassian.com/cloud/twg-cli/agents/skills/)

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-11" data-feedback-story-id="dab-story-2026-09-11-bc8138fb">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <details class="rating-guide"><summary>What do the stars mean?</summary><p>Rate how useful this was to you.</p><ol><li>Not useful</li><li>Slightly useful</li><li>Useful</li><li>Very useful</li><li>Extremely useful</li></ol></details>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 11, 2026]({{ '/briefs/2026-09-11/' | relative_url }})
