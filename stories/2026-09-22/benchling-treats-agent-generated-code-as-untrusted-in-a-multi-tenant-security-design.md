---
layout: default
title: "Benchling treats agent-generated code as untrusted in a multi-tenant security design"
description: "As agents gain the ability to write and run code, the key design assumption should be that generated code is untrusted. Security has to come from containment, least privilege, netw"
image: "https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-22/06-multitenant-agent-security.png?v=c6735dd73cdad04d"
permalink: /stories/2026-09-22/benchling-treats-agent-generated-code-as-untrusted-in-a-multi-tenant-security-design/
brief_date: 2026-09-22
story_id: dab-story-2026-09-22-b12135af
reader_release: true
---

[← Daily Brief for September 22, 2026]({{ '/briefs/2026-09-22/' | relative_url }})

# Benchling treats agent-generated code as untrusted in a multi-tenant security design

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source reading time unavailable</span></div></aside>
<!-- reader-release:end -->

<span class="story-data" data-story-id="dab-story-2026-09-22-b12135af" hidden></span>

**Focus:** Agents for Everyone  
**Date:** September 21, 2026  
**Topics:** agent security, sandboxing, multi-tenancy, data exfiltration  
**Evidence:** Official Announcement  
**Availability:** Published

![Professional editorial diagram used for the September 22 agent security story, showing isolated execution, sandbox boundaries, policy controls, and protected data flows.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-22/06-multitenant-agent-security.png?v=c6735dd73cdad04d)

**Summary:** AWS describes how Benchling runs AI agent-generated scientific code using AgentCore Code Interpreter in VPC mode, combining network isolation, DNS controls, and endpoint policies to reduce cross-tenant and data-exfiltration risk.

**Why it matters:** As agents gain the ability to write and run code, the key design assumption should be that generated code is untrusted. Security has to come from containment, least privilege, network controls, tenancy boundaries, and observable execution—not confidence in the model.

<!-- reader-release:start -->
<aside class="book-bridge"><p class="book-kicker">READ DEEPER · GENERATIVE AI PROFESSIONAL SERIES</p><h3>Reliable Generative AI</h3><p class="chapter">Chapter 4, section 4.1.2 — Managing Expectations and Calibrating Trust</p><p>Use calibrated-trust principles when deciding how much autonomy, isolation, review, escalation, and rollback an agent should receive.</p><p><a class="book-cta" href="https://leanpub.com/reliablegenerativeai" target="_blank" rel="noopener noreferrer">Get the book and explore contents ↗</a></p><p class="small-note">The link opens the Leanpub.com book webpage; chapter access requires the book.</p></aside>
<!-- reader-release:end -->

## What to do now

**Treat agent code as untrusted:** Place code-executing agents behind isolated runtimes, least-privilege policies, outbound network controls, tenant boundaries, and audit logs.

**Source:** <a href="https://aws.amazon.com/blogs/machine-learning/how-benchling-secured-multi-tenant-ai-agents-with-amazon-bedrock-agentcore/" data-item-id="dab-story-2026-09-22-b12135af" data-edition-date="2026-09-22" data-action="source_clicks">How Benchling secured multi-tenant AI agents with Amazon Bedrock AgentCore</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-22" data-feedback-story-id="dab-story-2026-09-22-b12135af">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 22, 2026]({{ '/briefs/2026-09-22/' | relative_url }})
