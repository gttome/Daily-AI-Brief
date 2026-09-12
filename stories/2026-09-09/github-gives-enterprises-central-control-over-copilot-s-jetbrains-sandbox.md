---
layout: default
title: "GitHub gives enterprises central control over Copilot’s JetBrains sandbox"
description: "GitHub added enterprise-managed sandbox policies for Copilot in JetBrains IDEs. Administrators can centrally control sandbox enablement, filesystem and network access, proxy settin"
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-09/01-enterprise-managed-sandbox.png?v=20260909-1"
permalink: /stories/2026-09-09/github-gives-enterprises-central-control-over-copilot-s-jetbrains-sandbox/
brief_date: 2026-09-09
story_id: dab-story-2026-09-09-e9be6ec5
---

[← Daily Brief for September 9, 2026]({{ '/briefs/2026-09-09/' | relative_url }})

# GitHub gives enterprises central control over Copilot’s JetBrains sandbox

<span class="story-data" data-story-id="dab-story-2026-09-09-e9be6ec5" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** September 8, 2026  
**Topics:** GitHub Copilot, sandboxing, enterprise policy, agent security  
**Evidence:** Official Changelog  
**Availability:** Public Preview

![Layered textbook diagram showing administrator policy governing filesystem, network, proxy, tools, keychain, and terminal access inside a sandboxed IDE agent workspace.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-09/01-enterprise-managed-sandbox.png?v=20260909-1)

**Summary:** GitHub added enterprise-managed sandbox policies for Copilot in JetBrains IDEs. Administrators can centrally control sandbox enablement, filesystem and network access, proxy settings, developer tools, and macOS Keychain access; managed restrictions override local user settings and policy diagnostics show whether controls are enforced.

**Why it matters:** Agentic coding tools increasingly operate across files, terminals, and external services. Central policy converts safety from a developer preference into an enforceable organizational boundary. The sandbox controls are in public preview, and the broader release also includes preview features, so teams should validate behavior on their own platforms before relying on it.

<span class="story-editorial-note" data-george-implication="Use this as a concrete governance example in agent training: define allowed resources centrally, lock high-risk controls, and verify enforcement with diagnostics rather than trusting written instructions alone." hidden></span>

## What to do now

**Update Policy:** Use this as a concrete governance example in agent training: define allowed resources centrally, lock high-risk controls, and verify enforcement with diagnostics rather than trusting written instructions alone.

**Source:** <a href="https://github.blog/changelog/2026-09-08-enterprise-managed-sandbox-in-copilot-for-jetbrains/" data-item-id="dab-story-2026-09-09-e9be6ec5" data-edition-date="2026-09-09" data-action="source_clicks">Enterprise-managed sandbox in Copilot for JetBrains</a>

<div class="story-feedback story-feedback-compact" data-feedback-brief-date="2026-09-09" data-feedback-story-id="dab-story-2026-09-09-e9be6ec5">
  <span class="feedback-prompt">Was this useful?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate this story">
    <button type="button" data-feedback-rating="most_useful" aria-label="Most useful">Very useful</button>
    <button type="button" data-feedback-rating="useful">Useful</button>
    <button type="button" data-feedback-rating="neutral">Neutral</button>
    <button type="button" data-feedback-rating="not_useful">Not useful</button>
  </div>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 9, 2026]({{ '/briefs/2026-09-09/' | relative_url }})
