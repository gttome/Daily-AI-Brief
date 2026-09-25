---
layout: default
title: Daily Generative AI Brief
brief_date: 2026-09-25
reader_release: true
---

# Daily Generative AI Brief — September 25, 2026

**Published:** September 25, 2026  
**Coverage period:** 24-hour primary window ending at 2026-09-25T10:46:27.000Z; recency fallback used for reviewed items outside the primary window.

<!-- reader-release:start -->
<section class="edition-overview" id="edition-overview"><p class="book-kicker">IN THIS EDITION · 6 ARTICLES / 2 VIDEOS / 2 PODCASTS</p><h2>Choose what matters to your work</h2><ol><li><a href="#reading-dab-story-2026-09-25-e2f16170">AWS adds skill-specific evaluation for agents using reusable procedures</a><span>Article · about 20 min source read</span></li><li><a href="#reading-dab-story-2026-09-25-ab3f39a4">AWS uses MCP and AgentCore Gateway to connect agents across account boundaries</a><span>Article · about 25 min source read</span></li><li><a href="#reading-dab-story-2026-09-25-566bb67b">GitHub changes the default policy for generally available Copilot features</a><span>Article · about 4 min source read</span></li><li><a href="#reading-dab-story-2026-09-25-80681ec6">Microsoft frames workplace AI as a system of models, context, agents, and governance</a><span>Article · about 7 min source read</span></li><li><a href="#reading-dab-story-2026-09-25-fbf2fd8f">NVIDIA opens 3D CT reasoning model for volumetric radiology workflows</a><span>Article · about 16 min source read</span></li><li><a href="#reading-dab-story-2026-09-25-fc65e87b">NVIDIA adds workload-driven validation for GPU cluster readiness</a><span>Article · about 13 min source read</span></li><li><a href="#general">Stop guessing which model your agent needs</a><span>Video · 9:33</span></li><li><a href="#agents-for-non-technical-people">Using Claude Opus 5.5 as your daily driver</a><span>Video · 3:33</span></li><li><a href="#podcast-dab-podcast-2026-09-25-agents-rules-business">Are AI agents changing the rules of business?</a><span>Podcast</span></li><li><a href="#podcast-dab-podcast-2026-09-25-upnext-ai">Gemini’s Internet Escape, AI Chemistry, and the Test for Game-Playing Agents</a><span>Podcast</span></li></ol></section>
<!-- reader-release:end -->

<span id="reading-dab-story-2026-09-25-e2f16170"></span>

## 1. AWS adds skill-specific evaluation for agents using reusable procedures

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 20 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Everyone**

**Date:** September 22, 2026

**Topics:** Agent Skills, agent evaluation, Strands Evals, AgentCore

<span class="story-data" data-story-id="dab-story-2026-09-25-e2f16170" data-story-url="/stories/2026-09-25/aws-adds-skill-specific-evaluation-for-agents-using-reusable-procedures/" hidden></span>

<a href="{{ '/stories/2026-09-25/aws-adds-skill-specific-evaluation-for-agents-using-reusable-procedures/' | relative_url }}" data-item-id="dab-story-2026-09-25-e2f16170" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram showing an agent task, skill selection, instruction execution, and evaluator checks for skill accuracy and fidelity.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/05-aws-adds-skill-specific-evaluation-for-agents-using-reusable-procedures.png?v=5c9dda37b01869de)

**Summary:** AWS shows how Strands Evals and Amazon Bedrock AgentCore Evaluations can test whether skill-equipped agents select the correct reusable skill and follow its instructions, rather than judging only the fluency of the final answer.

**Why it matters:** Agent Skills turn repeatable methods into portable instructions, but they also create a new failure surface: the agent can choose the wrong skill or ignore the skill’s procedure. Skill-selection and instruction-following metrics make that behavior testable.

<!-- reader-release:start -->
<aside class="book-bridge"><p class="book-kicker">PUT IT INTO PRACTICE · GENERATIVE AI PROFESSIONAL SERIES</p><h3>Reliable Generative AI Context Engineering</h3><p class="chapter">Chapter 3 — Designing High-Quality Contexts</p><p>Use the context-quality checklist when defining the instructions, references, tools, constraints, and evaluation evidence that belong inside a reusable Agent Skill.</p><p><a class="book-cta" href="https://leanpub.com/reliable-context-engineering" target="_blank" rel="noopener noreferrer">Get the book and explore contents ↗</a></p><p class="small-note">The link opens the Leanpub.com book webpage; chapter access requires the book.</p></aside>
<!-- reader-release:end -->

**What to do now — Test one reusable skill for selection and instruction fidelity:** Create representative tasks, measure whether the agent invokes the correct skill, and verify that required steps are followed before scaling.

**Source:** <a href="https://aws.amazon.com/blogs/machine-learning/evaluate-skill-equipped-agents-with-strands-evals-and-amazon-bedrock-agentcore/" data-item-id="dab-story-2026-09-25-e2f16170" data-edition-date="2026-09-25" data-action="source_clicks">Evaluate skill-equipped agents with Strands Evals and Amazon Bedrock AgentCore</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-e2f16170">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-25-ab3f39a4"></span>

## 2. AWS uses MCP and AgentCore Gateway to connect agents across account boundaries

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 25 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Everyone**

**Date:** September 24, 2026

**Topics:** MCP, AgentCore Gateway, multi-account architecture, agent security

<span class="story-data" data-story-id="dab-story-2026-09-25-ab3f39a4" data-story-url="/stories/2026-09-25/aws-uses-mcp-and-agentcore-gateway-to-connect-agents-across-account-boundaries/" hidden></span>

<a href="{{ '/stories/2026-09-25/aws-uses-mcp-and-agentcore-gateway-to-connect-agents-across-account-boundaries/' | relative_url }}" data-item-id="dab-story-2026-09-25-ab3f39a4" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram showing a central agent, gateway, account-local MCP servers, authorization boundaries, and an audited governed response.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/06-aws-uses-mcp-and-agentcore-gateway-to-connect-agents-across-account-boun.png?v=9ee924fc974b7762)

**Summary:** AWS presents a multi-account agent architecture where each business unit keeps data in its own account while a central agent queries approved MCP servers through AgentCore Gateway using cross-account authorization.

**Why it matters:** Enterprise agents often need access to distributed data without centralizing everything. A gateway-plus-MCP pattern can separate agent orchestration from data ownership while preserving account boundaries and fine-grained authorization.



**What to do now — Prototype one governed cross-boundary agent query:** Keep data ownership local, expose only a narrow MCP surface, and log every cross-account action for review.

**Source:** <a href="https://aws.amazon.com/blogs/machine-learning/build-a-multi-account-ai-agent-with-agentcore-gateway-and-mcp/" data-item-id="dab-story-2026-09-25-ab3f39a4" data-edition-date="2026-09-25" data-action="source_clicks">Build a multi-account AI agent with AgentCore Gateway and MCP</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-ab3f39a4">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-25-566bb67b"></span>

## 3. GitHub changes the default policy for generally available Copilot features

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 4 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 24, 2026

**Topics:** GitHub Copilot, enterprise governance, AI policy, feature management

<span class="story-data" data-story-id="dab-story-2026-09-25-566bb67b" data-story-url="/stories/2026-09-25/github-changes-the-default-policy-for-generally-available-copilot-features/" hidden></span>

<a href="{{ '/stories/2026-09-25/github-changes-the-default-policy-for-generally-available-copilot-features/' | relative_url }}" data-item-id="dab-story-2026-09-25-566bb67b" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram showing a generally available Copilot feature flowing through enterprise defaults, organization controls, and governed user access.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/03-github-changes-the-default-policy-for-generally-available-copilot-featur.png?v=a5e3e7b06861ad3a)

**Summary:** GitHub introduced a global default policy for generally available Copilot features and supported client capabilities in Business and Enterprise settings, shifting how new capabilities become enabled across organizations.

**Why it matters:** AI feature governance is becoming a default-management problem, not just an adoption problem. Administrators need explicit ownership of organization defaults, exceptions, and review windows so feature rollout does not outpace policy.



**What to do now — Review Copilot defaults and exception ownership:** Confirm who owns default settings, which capabilities are permitted, and how new features are reviewed before broad use.

**Source:** <a href="https://github.blog/changelog/2026-09-24-default-enablement-of-copilot-features-for-copilot-business-and-enterprise" data-item-id="dab-story-2026-09-25-566bb67b" data-edition-date="2026-09-25" data-action="source_clicks">Default Enablement of Copilot Features for Copilot Business and Enterprise</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-566bb67b">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-25-80681ec6"></span>

## 4. Microsoft frames workplace AI as a system of models, context, agents, and governance

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 7 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 23, 2026

**Topics:** knowledge work, Microsoft 365 Copilot, enterprise AI, workflow design

<span class="story-data" data-story-id="dab-story-2026-09-25-80681ec6" data-story-url="/stories/2026-09-25/microsoft-frames-workplace-ai-as-a-system-of-models-context-agents-and-governance/" hidden></span>

<a href="{{ '/stories/2026-09-25/microsoft-frames-workplace-ai-as-a-system-of-models-context-agents-and-governance/' | relative_url }}" data-item-id="dab-story-2026-09-25-80681ec6" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram connecting organizational context, copilots and agents, workflow execution, governance, and measured outcomes.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/04-microsoft-frames-workplace-ai-as-a-system-of-models-context-agents-and-g.png?v=642ad488499257a4)

**Summary:** Microsoft’s AI at Work update argues that enterprise value comes from connecting copilots and agents to organizational context, workflow, governance, and measurement rather than treating AI as a standalone chat interface.

**Why it matters:** Knowledge-worker adoption increasingly depends on system design: trustworthy context, repeatable workflows, governed actions, and measurable outcomes. That is a more durable operating model than distributing isolated prompts or assistants.



**What to do now — Map one knowledge workflow as an AI system:** Define the context, actions, controls, human checkpoints, and outcome metrics around one recurring workflow.

**Source:** <a href="https://www.microsoft.com/en-us/copilot/blog/2026/09/23/building-the-system-for-ai-at-work/" data-item-id="dab-story-2026-09-25-80681ec6" data-edition-date="2026-09-25" data-action="source_clicks">Building the system for AI at work</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-80681ec6">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-25-fbf2fd8f"></span>

## 5. NVIDIA opens 3D CT reasoning model for volumetric radiology workflows

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 16 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 23, 2026

**Topics:** multimodal AI, 3D vision-language models, medical AI, reasoning evaluation

<span class="story-data" data-story-id="dab-story-2026-09-25-fbf2fd8f" data-story-url="/stories/2026-09-25/nvidia-opens-3d-ct-reasoning-model-for-volumetric-radiology-workflows/" hidden></span>

<a href="{{ '/stories/2026-09-25/nvidia-opens-3d-ct-reasoning-model-for-volumetric-radiology-workflows/' | relative_url }}" data-item-id="dab-story-2026-09-25-fbf2fd8f" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram showing a 3D CT volume passing through multimodal reasoning, structured reporting, and human clinical review.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/01-nvidia-opens-3d-ct-reasoning-model-for-volumetric-radiology-workflows.png?v=bf765b462d75b3fa)

**Summary:** NVIDIA introduced NV-Reason-CT, an open 3D CT vision-language model designed to reason across full volumetric chest and abdomen scans, produce structured diagnostic reports, and support multistep follow-up dialogue.

**Why it matters:** The release pushes multimodal reasoning beyond 2D images into full 3D clinical volumes. For AI engineering teams, it highlights the growing importance of structured reasoning, domain-specific evaluation, and workload-specific safety controls for high-stakes multimodal systems.



**What to do now — Evaluate domain reasoning with explicit clinical guardrails:** Separate model capability tests from clinical acceptance, define task-specific metrics, and keep qualified human review mandatory.

**Source:** <a href="https://developer.nvidia.com/blog/introducing-nv-reason-ct-open-3d-ct-vlm-for-radiologist-chain-of-thought-reasoning/" data-item-id="dab-story-2026-09-25-fbf2fd8f" data-edition-date="2026-09-25" data-action="source_clicks">Introducing NV-Reason-CT Open 3D CT VLM for Radiologist Chain-of-Thought Reasoning</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-fbf2fd8f">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-25-fc65e87b"></span>

## 6. NVIDIA adds workload-driven validation for GPU cluster readiness

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 13 min read</span></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 23, 2026

**Topics:** GPU infrastructure, AI reliability, cluster validation, production readiness

<span class="story-data" data-story-id="dab-story-2026-09-25-fc65e87b" data-story-url="/stories/2026-09-25/nvidia-adds-workload-driven-validation-for-gpu-cluster-readiness/" hidden></span>

<a href="{{ '/stories/2026-09-25/nvidia-adds-workload-driven-validation-for-gpu-cluster-readiness/' | relative_url }}" data-item-id="dab-story-2026-09-25-fc65e87b" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Published

![Professional white-background instructional diagram showing component health, workload-driven cluster tests, observed distributed behavior, and a production readiness gate.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-09-25/02-nvidia-adds-workload-driven-validation-for-gpu-cluster-readiness.png?v=59f15009ee16051e)

**Summary:** NVIDIA’s Cluster Readiness Engine uses real distributed workloads across topology-aware GPU groups to test whether a cluster is actually ready for production AI workloads rather than relying only on component health checks.

**Why it matters:** AI infrastructure can look healthy while failing under real distributed load. Workload-level readiness testing gives engineering teams a stronger pre-production signal for networking, topology, collective communication, and GPU behavior.



**What to do now — Add workload-level readiness tests before deployment:** Use representative distributed jobs to expose failures that static health checks can miss.

**Source:** <a href="https://developer.nvidia.com/blog/validate-gpu-cluster-readiness-before-ai-workloads-land/" data-item-id="dab-story-2026-09-25-fc65e87b" data-edition-date="2026-09-25" data-action="source_clicks">Validate GPU Cluster Readiness Before AI Workloads Land</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-story-2026-09-25-fc65e87b">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Watching

<span id="general"></span>

## 7. General

### Stop guessing which model your agent needs

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span>9:33 video</span></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-25/general/' | relative_url }}" data-item-id="dab-video-2026-09-25-general" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** Microsoft Developer  
**Date:** September 23, 2026  
**Runtime:** 9:33  
**Format:** Video

**Summary:** A concise walkthrough of choosing an agent model with Microsoft Foundry using repeatable evaluations rather than intuition, including latency, token usage, output quality, and cost.

**Why it matters:** Extends today’s engineering and evaluation coverage by showing how model choice can become a measured production decision.



**Source:** <a href="https://www.youtube.com/watch?v=iTiKeH3FDoQ" data-item-id="dab-video-2026-09-25-general" data-edition-date="2026-09-25" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-video-2026-09-25-general">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="agents-for-non-technical-people"></span>

## 8. Agents for Everyone

### Using Claude Opus 5.5 as your daily driver

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span>3:33 video</span></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-25/agent-skills/' | relative_url }}" data-item-id="dab-video-2026-09-25-agent-skills" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** Claude  
**Date:** September 23, 2026  
**Runtime:** 3:33  
**Format:** Video

**Summary:** A short practical comparison showing how the new model behaves in everyday Claude Code work, including speed, usage limits, and when medium effort is enough.

**Why it matters:** Complements today’s agent and knowledge-work stories with a concrete example of matching model capability and operating cost to routine work.



**Source:** <a href="https://www.youtube.com/watch?v=jKRl_CSVxyI" data-item-id="dab-video-2026-09-25-agent-skills" data-edition-date="2026-09-25" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-video-2026-09-25-agent-skills">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Listening — Podcasts

### 9. Are AI agents changing the rules of business?

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span>Podcast · duration not verified</span></div></aside>
<!-- reader-release:end -->

<span class="podcast-data" data-podcast-id="dab-podcast-2026-09-25-agents-rules-business" data-podcast-title="Are AI agents changing the rules of business?" data-podcast-url="/podcasts/2026-09-25/agents-rules-business/" hidden></span>

<a href="{{ '/podcasts/2026-09-25/agents-rules-business/' | relative_url }}" data-item-id="dab-podcast-2026-09-25-agents-rules-business" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent podcast page</a>

**Show:** Take on Tomorrow  
**Host / guest:** PwC; guests Rob Seaman and Joe Atkinson  
**Focus:** Applied Generative AI for Knowledge Workers  
**Date:** September 22, 2026  
**Duration:** Not independently verified · No episode time limit  
**Topics:** AI agents, workflow redesign, enterprise adoption, human work

**Summary:** PwC discusses how organizations move from isolated agent experiments toward redesigned business workflows and measurable value.

**Why it matters:** Adds an enterprise-adoption lens to today’s operational stories.

**Connection to the brief:** Reinforces the shift from AI features to governed, outcome-oriented workflows.



**Coverage:** Fallback selection reused during publication recovery to avoid unnecessary rediscovery.

**Evidence:** Practitioner analysis. PwC page previously verified the September 22, 2026 publication date.

**Listen / watch:** <a href="https://www.pwc.com/gx/en/1/issues/reinvention/take-on-tomorrow/s05-e02-are-ai-agents-changing-the-rules-of-business.html" data-item-id="dab-podcast-2026-09-25-agents-rules-business" data-edition-date="2026-09-25" data-action="source_clicks" target="_blank" rel="noopener noreferrer">PwC</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-podcast-2026-09-25-agents-rules-business">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

### 10. Gemini’s Internet Escape, AI Chemistry, and the Test for Game-Playing Agents

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span>8:00 podcast</span></div></aside>
<!-- reader-release:end -->

<span class="podcast-data" data-podcast-id="dab-podcast-2026-09-25-upnext-ai" data-podcast-title="Gemini’s Internet Escape, AI Chemistry, and the Test for Game-Playing Agents" data-podcast-url="/podcasts/2026-09-25/upnext-ai/" hidden></span>

<a href="{{ '/podcasts/2026-09-25/upnext-ai/' | relative_url }}" data-item-id="dab-podcast-2026-09-25-upnext-ai" data-edition-date="2026-09-25" data-action="permanent_page_clicks">Open the permanent podcast page</a>

**Show:** UpNext AI  
**Host / guest:** UpNext AI  
**Focus:** Technical AI Engineering  
**Date:** September 22, 2026  
**Duration:** 8:00 · No episode time limit  
**Topics:** agent safety, long-horizon evaluation, AI security, agent platforms

**Summary:** An eight-minute AI news episode covering a real-world agent security failure mode and emerging tests for long-horizon agents.

**Why it matters:** Adds a compact reliability and safety counterpoint to the day’s product and workflow developments.

**Connection to the brief:** Pairs with today’s emphasis on observability, tool governance, and verified agent outcomes.



**Coverage:** Fallback selection reused during publication recovery to avoid unnecessary rediscovery.

**Evidence:** Practitioner analysis. Independent listing previously verified September 22, 2026 and 8-minute runtime.

**Listen / watch:** <a href="https://podscan.fm/podcasts/upnext-ai/episodes/geminis-internet-escape-ai-chemistry-and-the-test-for-game-playing-agents-upnext-ai-september-22-2026" data-item-id="dab-podcast-2026-09-25-upnext-ai" data-edition-date="2026-09-25" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Podscan</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-25" data-feedback-story-id="dab-podcast-2026-09-25-upnext-ai">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<!-- reader-release:start -->


<section class="watchlist-preview" aria-labelledby="watchlist-preview-heading"><h2 id="watchlist-preview-heading">Emerging AI Watchlist</h2><p class="watchlist-daily-counts"><strong>0 new today · 3 updated · 13 carried forward.</strong></p><p><strong>Changed today:</strong></p><ul class="watchlist-daily-items"><li>Reusable agent skills become observable</li><li>AI harness engineering becomes a first-class layer</li><li>Model lifecycle governance for AI products</li></ul><p>Help choose what we investigate next. Explore emerging ideas and tell us which interest you.</p><div data-watchlist-preview></div><p><a href="{{ '/watchlist/' | relative_url }}">Explore the watchlist and vote →</a></p></section>


<!-- reader-release:end -->

## Editorial takeaway

September 25’s strongest pattern is operational discipline: evaluate reasoning and skills explicitly, test infrastructure with real workloads, govern AI feature defaults, and keep agent access bounded by clear authorization and review.

<!-- reader-release:start -->
<aside class="series-invitation" id="explore-series"><p class="book-kicker">CONTINUE LEARNING</p><h2>Explore the Generative AI Professional Series</h2><p>Take the next step from today’s developments to deeper professional learning with books on prompting, context, and reliable AI.</p><p><a class="book-cta" href="https://leanpub.com/u/george-tome" target="_blank" rel="noopener noreferrer">Explore the books ↗</a></p><p class="small-note">Purchasing a book supports continued development of the series and the Daily Generative AI Brief.</p></aside>
<!-- reader-release:end -->

<section class="subscription-card subscription-guidance" id="subscribe" aria-labelledby="subscribe-title">
<h2 id="subscribe-title">Keep up with the Brief</h2>
<p>Choose a daily reading reminder or follow new editions in your feed reader.</p>
<div class="subscription-choices" hidden aria-label="Choose how to follow"><button type="button" data-subscription-choice="calendar" aria-pressed="true">Calendar reminder</button><button type="button" data-subscription-choice="rss" aria-pressed="false">RSS reader</button></div>
<div data-subscription-panel="calendar"><h3>Make time to read</h3><p>Your calendar opens a reminder with a link to the latest Brief. No email address or phone number is needed here.</p>
<div class="calendar-reminder"><div class="subscription-fields"><label for="calendar-time">Your local time <input id="calendar-time" type="time" value="09:00" required></label><label for="calendar-quantity">Remind me for <input id="calendar-quantity" type="number" min="1" max="999" step="1" value="1" required></label><label for="calendar-period">Period <select id="calendar-period"><option value="days">days</option><option value="weeks">weeks</option><option value="months" selected>months</option><option value="years">years</option></select></label></div>
<p class="calendar-status" role="status"></p><p>1 week = 7 days · 1 month = 30 days · 1 year = 365 days.</p>
<label class="calendar-picker" hidden for="calendar-provider">Your calendar <select id="calendar-provider"><option value="google">Google Calendar</option><option value="apple">Apple Calendar</option><option value="outlook">Outlook</option></select></label>
<h3>Set it up in three steps</h3><ol><li><strong>Open the reminder.</strong> Google Calendar opens an event editor. For Apple Calendar or Outlook, download the file and open or import it in your calendar.</li><li><strong>Review and save once.</strong> Check the local time, daily repeat and final date or occurrence count. Choose an alert at the event time and mark the event Free.</li><li><strong>Check the saved event.</strong> It should contain the Brief link and the daily repeat you chose. Make sure your device allows calendar notifications.</li></ol>
<p class="calendar-actions"><a class="calendar-google" hidden target="_blank" rel="noopener noreferrer">Open in Google Calendar</a><a class="calendar-download" data-calendar="apple" hidden download="daily-ai-brief-reminder.ics">Download for Apple Calendar</a><a class="calendar-download" data-calendar="outlook" hidden download="daily-ai-brief-reminder.ics">Download for Outlook</a></p>
<div class="subscription-check"><h3>How do I know it worked?</h3><p>Find the saved event in your calendar. Check its time, repeat end date, alert, and link to the Brief. To test notifications, create a separate one-time event a few minutes ahead, then delete that test.</p><p>The Brief cannot confirm that you saved the event or that your device displayed an alert.</p></div>
<h3>If opening or importing does not work</h3><p>Create a five-minute event called <strong>Read the Daily Generative AI Brief</strong>. Add the <a href="https://gttome.github.io/Daily-AI-Brief/">Brief homepage link</a>, repeat daily for the number of days shown above, set an alert at the event time, and save once. If today’s time has passed, start tomorrow.</p>
<h3>Change or stop reminders</h3><p>Edit or delete the saved series in your calendar. Changing these controls does not update an event you already saved. Add it only once to avoid duplicates.</p>
<p class="calendar-note"><strong>A reading reminder, even when publication is late.</strong> It opens the latest available Brief; it does not detect a newly published edition. Your calendar and device notification settings control alerts.</p><noscript><p>Use the manual steps above. Choose a time and duration in your calendar; 9:00 AM for 30 days is the default suggestion.</p></noscript></div></div>
<div data-subscription-panel="rss"><h3>New editions in your reading list</h3><p>RSS lets a feed reader collect updates from publications you follow. You receive one entry per daily edition, with a link to the complete Brief.</p><ol><li><strong>Copy the feed address.</strong> Use the button below.</li><li><strong>Add it to your reader.</strong> Paste the address into its Add feed or Follow option.</li><li><strong>Check your reading list.</strong> Look for the Daily Generative AI Brief and open an edition to check the link.</li></ol>
<label for="rss-home-address" class="rss-address-label">Daily-edition feed address</label><input id="rss-home-address" class="rss-address" readonly value="https://gttome.github.io/Daily-AI-Brief/daily-feed.xml"><p><button type="button" class="rss-copy" hidden>Copy daily-edition feed address</button></p><p class="rss-copy-status" role="status"></p>
<div class="subscription-check"><h3>How do I know it worked?</h3><p>The Brief appears in your reader’s subscriptions, and an available edition opens successfully. If the list is empty, refresh your reader and check the address.</p><p>Your reader controls how often it checks for editions and whether it sends notifications. The Brief cannot confirm that you added the feed.</p></div>
<h3>If you see technical-looking text</h3><p>You opened the feed itself. Copy its address into your feed reader to see the editions as a reading list.</p><h3>Stop following</h3><p>Remove the Brief from your reader’s subscriptions. No email address or account on this site is required.</p></div></section>

