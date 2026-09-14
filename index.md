---
layout: default
title: Daily Generative AI Brief
brief_date: 2026-09-14
reader_release: true
---

# Daily Generative AI Brief — September 14, 2026

**Published:** September 14, 2026  
**Coverage period:** Verified primary-source developments published September 10–14, 2026; weekend publication volume was limited.

<!-- reader-release:start -->
<section class="edition-overview" id="edition-overview"><p class="book-kicker">IN THIS EDITION · 6 ARTICLES / 2 VIDEOS / 1 PODCAST</p><h2>Choose what matters to your work</h2><ol><li><a href="#reading-dab-story-2026-09-14-8c4f2a71">OpenAI’s Habitat turns storage scale into a centralized control plane</a><span>Article · about 15 min source read</span></li><li><a href="#reading-dab-story-2026-09-14-2e7b9d40">Google Cloud packages reusable Agent Skills for four coding-agent hosts</a><span>Article · about 6 min source read</span></li><li><a href="#reading-dab-story-2026-09-14-a13c6f85">Codex supports antimicrobial search, but experiments still set ground truth</a><span>Article · about 7 min source read</span></li><li><a href="#reading-dab-story-2026-09-14-f5d208be">ChatGPT Work’s Data agent connects plain-language questions to governed action</a><span>Article · about 8 min source read</span></li><li><a href="#reading-dab-story-2026-09-14-74b1ea3c">Microsoft turns conversation into governed business apps</a><span>Article · about 5 min source read</span></li><li><a href="#reading-dab-story-2026-09-14-c09e57d2">Salesforce frames agents as long-running job systems, not chatbots</a><span>Article · about 9 min source read</span></li><li><a href="#general">Use Deep Research with ChatGPT for Teachers</a><span>Video · 4:26</span></li><li><a href="#agents-for-non-technical-people">Use Plugins with ChatGPT for Teachers</a><span>Video · 8:46</span></li><li><a href="#worth-listening--podcast">How a 700-Person Bank Is Using AI to Build Apps, Agents, and Digital Employees</a><span>Podcast</span></li></ol></section>
<!-- reader-release:end -->

<span id="reading-dab-story-2026-09-14-8c4f2a71"></span>

## 1. OpenAI’s Habitat turns storage scale into a centralized control plane

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 15 min read</span></div><p><strong>Control plane:</strong> A control plane centralizes policy, routing and observation around a simpler data path. It must remain available and auditable because many products depend on it.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How centralized controls, constrained APIs and load-balancing feedback loops affect reliability at extreme scale.</p></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 11, 2026

**Topics:** distributed systems, storage architecture, tail latency, AI-assisted migration

<span class="story-data" data-story-id="dab-story-2026-09-14-8c4f2a71" data-story-url="/stories/2026-09-14/openai-habitat-turns-storage-scale-into-a-control-plane/" hidden></span>

<a href="{{ '/stories/2026-09-14/openai-habitat-turns-storage-scale-into-a-control-plane/' | relative_url }}" data-item-id="dab-story-2026-09-14-8c4f2a71" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Reported

![White-background textbook architecture showing ChatGPT, API and Codex request streams entering Habitat routing, regional stores and cache, with access, residency, rate-limit, audit and change-capture controls; LIFO and FIFO reuse are compared beside a Python-to-Rust migration.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/01-habitat-storage-control-plane.png?v=20260914textbook)

**Summary:** OpenAI describes Habitat, its online storage platform, as serving more than 70 million requests per second, more than 1 billion weekly users, and over 500 petabytes across nearly 40 regions. The engineering account explains why OpenAI centralized routing, authorization, audit logging, request shaping and data-residency logic; how LIFO connection reuse created a metastable overload loop that FIFO reuse broke; and how two engineers used Codex and GPT-5.5 to rewrite the service from Python to Rust.

**Why it matters:** The durable lesson is not a language benchmark but a systems pattern: constrain the API, centralize policy and observability, measure tail latency, and test feedback loops under burst traffic. OpenAI reports the Rust service now handles 95% of production requests with 6× CPU and 15× memory efficiency versus Python; those are vendor-reported production measurements without an independently reproducible workload.

<span class="story-editorial-note" data-george-implication="Use this as a technical chapter and workshop case on harness architecture: separate a simple, predictable data plane from a centralized control plane, then make retry, load balancing, rate limits, audit trails and rollback observable before optimizing implementation language." hidden></span>

**What to do now — Stress-test feedback loops:** Replay burst traffic while tracing connection reuse, tail latency, downstream fan-in and recovery behavior.

**Source:** <a href="https://openai.com/index/scaling-storage-one-billion-users-part-one/" data-item-id="dab-story-2026-09-14-8c4f2a71" data-edition-date="2026-09-14" data-action="source_clicks">Rapidly scaling online storage to serve over 1 billion ChatGPT users</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-8c4f2a71">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-14-2e7b9d40"></span>

## 2. Google Cloud packages reusable Agent Skills for four coding-agent hosts

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 6 min read</span></div><p><strong>Portable Agent Skill:</strong> A skill packages reusable instructions and supporting context. Portability does not remove the need to review files, permissions and tool behavior in each host.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>What belongs in a portable Agent Skill and which controls remain local to the host and environment.</p></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 10, 2026

**Topics:** Agent Skills, MCP, grounded documentation, cloud governance

<span class="story-data" data-story-id="dab-story-2026-09-14-2e7b9d40" data-story-url="/stories/2026-09-14/google-cloud-plugin-packages-reusable-agent-skills/" hidden></span>

<a href="{{ '/stories/2026-09-14/google-cloud-plugin-packages-reusable-agent-skills/' | relative_url }}" data-item-id="dab-story-2026-09-14-2e7b9d40" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** General Availability

![White-background textbook exploded software stack showing a plugin manifest, Agent Skills, official documentation and MCP configuration connected to Antigravity, Claude Code, Codex and Gemini CLI, followed by authenticated preview, apply and audit stages.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/02-google-cloud-developer-plugin.png?v=20260914textbook)

**Summary:** Google Cloud released an open-source Developer Plugin that bundles Agent Skills, official documentation grounding and MCP configuration for Antigravity, Claude Code, Codex and Gemini CLI. The package is designed to give coding agents reusable Google Cloud procedures and current platform context while using existing authentication and project configuration.

**Why it matters:** This is the edition’s single reusable Agent Skills story: it shows how instructions, references and tool configuration can travel as one inspectable package across agent hosts. Portability does not establish correctness or least privilege; teams still need to review the skill files, pin versions, scope credentials, preview changes and test each target environment.

<span class="story-editorial-note" data-george-implication="Package one repeatable consulting or publishing workflow as a small Agent Skill: a concise instruction file, verified references, tool configuration, examples and acceptance tests. Try it in two compatible hosts and document where behavior diverges." hidden></span>

**What to do now — Audit one portable skill:** Inspect its instructions, references, MCP settings, permissions and version behavior in two agent hosts.

**Source:** <a href="https://cloud.google.com/blog/topics/developers-practitioners/introducing-the-google-cloud-developer-plugin-for-ai-coding-agents" data-item-id="dab-story-2026-09-14-2e7b9d40" data-edition-date="2026-09-14" data-action="source_clicks">Introducing the Google Cloud Developer Plugin for AI Coding Agents</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-2e7b9d40">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-14-a13c6f85"></span>

## 3. Codex supports antimicrobial search, but experiments still set ground truth

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 7 min read</span></div><p><strong>Ground-truth boundary:</strong> AI can propose and prioritize candidates. A separate expert or experimental process must decide whether the claim is true in the real world.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>Where generative AI contributes to scientific search and where empirical evidence must take over.</p></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 10, 2026

**Topics:** scientific discovery, AI-assisted coding, evidence trace, human validation

<span class="story-data" data-story-id="dab-story-2026-09-14-a13c6f85" data-story-url="/stories/2026-09-14/codex-supports-antimicrobial-search-but-labs-set-ground-truth/" hidden></span>

<a href="{{ '/stories/2026-09-14/codex-supports-antimicrobial-search-but-labs-set-ground-truth/' | relative_url }}" data-item-id="dab-story-2026-09-14-a13c6f85" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Reported

![White-background textbook flow from literature signals and biological sequence data through hypothesis, code, candidate filtering and evidence tracing to a clearly marked laboratory-validation boundary with active, inactive and uncertain result states.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/03-antimicrobial-discovery-loop.png?v=20260914textbook)

**Summary:** OpenAI profiles César de la Fuente’s lab using ChatGPT and Codex to brainstorm hypotheses, write and refine code, process datasets, analyze results and connect ideas across disciplines while custom deep-learning models search genome and protein data for candidate antimicrobial molecules. AI narrows the search; experimental testing must still establish biological activity, toxicity, resistance, manufacturability and eventual clinical evidence.

**Why it matters:** The useful pattern for knowledge work is a tight loop between literature, computation, evidence and domain tests—not replacing experts with generated conclusions. The source is an OpenAI customer profile, and reported acceleration in early candidate search does not prove that a candidate becomes a safe or effective medicine.

<span class="story-editorial-note" data-george-implication="Use the case to teach evidence handoffs: label what the model proposed, what code transformed, what data supported and what an expert or experiment must verify. Apply the same boundary to consulting claims, book research and educational examples." hidden></span>

**What to do now — Mark the ground-truth boundary:** In every AI-assisted research workflow, label which outputs are hypotheses and which require independent expert or experimental verification.

**Source:** <a href="https://openai.com/index/using-codex-chatgpt-to-search-for-new-antimicrobials/" data-item-id="dab-story-2026-09-14-a13c6f85" data-edition-date="2026-09-14" data-action="source_clicks">How a researcher uses Codex and ChatGPT to search for new antimicrobial molecules</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-a13c6f85">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-14-f5d208be"></span>

## 4. ChatGPT Work’s Data agent connects plain-language questions to governed action

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 8 min read</span></div><p><strong>Semantic grounding:</strong> A semantic layer supplies agreed business definitions and relationships. It helps interpretation, but analysts still need to check evidence and assumptions.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How governed sources, business definitions, evidence review and approval fit into conversational analysis.</p></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 10, 2026

**Topics:** data analysis, semantic layers, grounding, human approval

<span class="story-data" data-story-id="dab-story-2026-09-14-f5d208be" data-story-url="/stories/2026-09-14/chatgpt-work-data-agent-connects-questions-to-governed-action/" hidden></span>

<a href="{{ '/stories/2026-09-14/chatgpt-work-data-agent-connects-questions-to-governed-action/' | relative_url }}" data-item-id="dab-story-2026-09-14-f5d208be" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** General Availability

![White-background textbook architecture linking warehouses, files, BI systems and semantic layers to a Data agent that plans queries, gathers evidence and builds analysis, with role, row and column controls before dashboards and approved actions.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/04-data-agent-governed-analysis.png?v=20260914textbook)

**Summary:** OpenAI introduced a Data agent in ChatGPT Work that can connect to approved warehouses, files, semantic layers and BI tools; investigate business questions; expose evidence; build refreshable dashboards; and carry out connected actions a user approves. Administrators control connections and roles, while underlying table, row and column permissions continue to apply.

**Why it matters:** The product moves conversational analysis closer to governed operational work, but semantic grounding and access controls do not guarantee correct joins, causal explanations or recommendations. Availability depends on workspace installation, configured plugins and connected accounts; the customer outcomes in the announcement are vendor-selected examples rather than comparative evaluation.

<span class="story-editorial-note" data-george-implication="Pilot one bounded data question for a workshop or consulting engagement. Define trusted metrics, allowed sources, a reconciliation check and an approval gate before sharing the dashboard or triggering any action." hidden></span>

**What to do now — Reconcile one governed analysis:** Compare the agent’s result with an existing trusted report and inspect evidence, definitions and permissions before reuse.

**Source:** <a href="https://openai.com/index/put-data-to-work/" data-item-id="dab-story-2026-09-14-f5d208be" data-edition-date="2026-09-14" data-action="source_clicks">Now everyone can put data to work</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-f5d208be">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-14-74b1ea3c"></span>

## 5. Microsoft turns conversation into governed business apps

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 5 min read</span></div><p><strong>Generated app:</strong> Natural-language generation can create a working prototype. Production use still requires code, data, security, accessibility and ownership review.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to move from an app prompt to a reviewed, governed and owned deployment.</p></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Non-Technical People**

**Date:** September 10, 2026

**Topics:** vibe coding, no-code apps, Copilot Studio, deployment governance

<span class="story-data" data-story-id="dab-story-2026-09-14-74b1ea3c" data-story-url="/stories/2026-09-14/microsoft-turns-conversation-into-governed-business-apps/" hidden></span>

<a href="{{ '/stories/2026-09-14/microsoft-turns-conversation-into-governed-business-apps/' | relative_url }}" data-item-id="dab-story-2026-09-14-74b1ea3c" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Public Preview

![White-background isometric textbook blueprint showing intent expanding into UI, logic and data layers, connected to Work IQ and business data, then moving through preview, code review, testing, identity, tenant-policy, version and human-approval gates.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/05-copilot-app-building.png?v=20260914textbook)

**Summary:** Microsoft is adding natural-language app building to Copilot Cowork through an /app skill in the Frontier program and to Copilot Studio through a public preview. Users can describe a business app, connect organizational context and data, preview it, inspect generated code, revise it conversationally and move through governed deployment stages.

**Why it matters:** Accessible app generation can let subject-matter experts turn process knowledge into working prototypes, but generated full-stack code still creates security, data-quality, maintenance and ownership obligations. Cowork and Studio have different availability paths, and Microsoft’s announcement is not evidence that an unreviewed prototype is production-ready.

<span class="story-editorial-note" data-george-implication="Turn one workshop worksheet or publishing calculator into a small internal app. Start with a narrow user story, connect only non-sensitive test data, inspect the generated code and permissions, and require a named owner before deployment." hidden></span>

**What to do now — Prototype one governed app:** Use test data, review the generated code and connectors, and assign an owner before any production deployment.

**Source:** <a href="https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/build-apps-in-copilot-cowork-and-copilot-studio/" data-item-id="dab-story-2026-09-14-74b1ea3c" data-edition-date="2026-09-14" data-action="source_clicks">Build business apps with Copilot Cowork and Copilot Studio</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-74b1ea3c">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-14-c09e57d2"></span>

## 6. Salesforce frames agents as long-running job systems, not chatbots

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 9 min read</span></div><p><strong>Durable job:</strong> A long-running agent needs durable state, checkpoints and a safe way for a person to pause, redirect or approve consequential steps.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>Why job-level agents require state, steering, deterministic rules, audit trails and human approval.</p></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Non-Technical People**

**Date:** September 11, 2026

**Topics:** long-horizon agents, durable execution, human steering, availability

<span class="story-data" data-story-id="dab-story-2026-09-14-c09e57d2" data-story-url="/stories/2026-09-14/salesforce-frames-agents-as-long-running-job-systems/" hidden></span>

<a href="{{ '/stories/2026-09-14/salesforce-frames-agents-as-long-running-job-systems/' | relative_url }}" data-item-id="dab-story-2026-09-14-c09e57d2" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Announced

![White-background circular textbook operating loop around a job goal, with plan, tool use, state, policy, approval and continuation stages, connected to sales, service, marketing and commerce lanes plus durable-runtime, steering, deterministic-rule and audit controls.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-14/06-agentforce-job-ready-loop.png?v=20260914textbook)

**Summary:** Salesforce announced a set of Agentforce capabilities organized around complete jobs across sales, service, marketing and commerce. Its product description emphasizes durable execution, persistent state, steering, deterministic rules, auditability and human approvals so agents can continue multi-step work rather than answer only one prompt.

**Why it matters:** The shift from chat to jobs makes failure handling, ownership and availability more important: a long-running system needs checkpoints, resumable state, permissions and a clear human override. The announcement mixes generally available, pilot and planned capabilities, and its performance examples are vendor-reported; buyers must verify the exact feature and release status they need.

<span class="story-editorial-note" data-george-implication="Map one recurring client or publishing job as states, not prompts: trigger, plan, tools, evidence, exceptions, approval and completion. Automate only the reversible steps first and keep one human accountable for the outcome." hidden></span>

**What to do now — Map one job as states:** Document triggers, tools, checkpoints, exception paths, approvals and completion evidence before choosing an agent product.

**Source:** <a href="https://www.salesforce.com/news/stories/agentforce-job-ready-ai-agents/" data-item-id="dab-story-2026-09-14-c09e57d2" data-edition-date="2026-09-14" data-action="source_clicks">Salesforce expands Agentforce with new job-ready AI agents</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-story-2026-09-14-c09e57d2">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Watching

<span id="general"></span>

## 7. General

### Use Deep Research with ChatGPT for Teachers

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>4:26 video</span></div><p><strong>Source review:</strong> A generated research report is a starting point for judgment. Open the cited sources and verify that they support the report’s key claims.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to request a research report, inspect its sources and export the result.</p></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-14/general/' | relative_url }}" data-item-id="dab-video-2026-09-14-general" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** OpenAI Academy  
**Date:** September 11, 2026  
**Runtime:** 4:26  
**Format:** Video

**Summary:** A concise official walkthrough of researching school policy and lesson plans, checking sources and exporting a report.

**Why it matters:** It reinforces today’s evidence-handoff theme: useful research artifacts still depend on source review.

<span class="story-editorial-note" data-george-implication="" hidden></span>**Source:** <a href="https://academy.openai.com/public/clubs/k-12-education-aacga/videos/use-deep-research-with-chatgpt-for-teachers" data-item-id="dab-video-2026-09-14-general" data-edition-date="2026-09-14" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on OpenAI Academy</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-video-2026-09-14-general">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="agents-for-non-technical-people"></span>

## 8. Agents for Non-Technical People

### Use Plugins with ChatGPT for Teachers

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>8:46 video</span></div><p><strong>Domain plugin:</strong> A domain plugin packages a reusable capability. Confirm what materials it can access and review the result before reuse.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How a non-technical user can invoke a reusable education plugin for bounded tasks.</p></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-14/agent-skills/' | relative_url }}" data-item-id="dab-video-2026-09-14-agent-skills" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** OpenAI Academy  
**Date:** September 11, 2026  
**Runtime:** 8:46  
**Format:** Video

**Summary:** An eight-minute official example of invoking a reusable domain plugin for translation and exit-ticket tasks using teaching materials.

**Why it matters:** It gives non-technical readers a concrete companion to today’s portable Agent Skills story.

<span class="story-editorial-note" data-george-implication="" hidden></span>**Source:** <a href="https://academy.openai.com/public/clubs/k-12-education-aacga/videos/use-plugins-with-chatgpt-for-teachers" data-item-id="dab-video-2026-09-14-agent-skills" data-edition-date="2026-09-14" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on OpenAI Academy</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-video-2026-09-14-agent-skills">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Listening — Podcast

### 9. How a 700-Person Bank Is Using AI to Build Apps, Agents, and Digital Employees

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>38:31 podcast</span></div><p><strong>Transformation sequence:</strong> Policies, training, data foundations, embedded champions and engineering capacity are prerequisites—not side effects—of reliable agent adoption.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How one regulated organization sequenced AI adoption from chat access to internal apps and agents.</p></div></aside>
<!-- reader-release:end -->

<span class="podcast-data" data-podcast-id="dab-podcast-2026-09-14-bank-ai-transformation" data-podcast-title="How a 700-Person Bank Is Using AI to Build Apps, Agents, and Digital Employees" data-podcast-url="/podcasts/2026-09-14/bank-ai-transformation/" hidden></span>

<a href="{{ '/podcasts/2026-09-14/bank-ai-transformation/' | relative_url }}" data-item-id="dab-podcast-2026-09-14-bank-ai-transformation" data-edition-date="2026-09-14" data-action="permanent_page_clicks">Open the permanent podcast page</a>

**Show:** The Artificial Intelligence Show  
**Host / guest:** Mike Kaput  
**Focus:** Agents for Non-Technical People  
**Date:** September 10, 2026  
**Duration:** 38:31 · No episode time limit  
**Topics:** AI transformation, AI champions, build versus buy, agent governance

**Summary:** Mike Kaput interviews Peapack Private CTO John Kowal about moving from employee chat access to governed internal applications and named “digital employees,” supported by a data warehouse, an AI engineering team and 29 business-line AI champions.

**Why it matters:** The interview connects technology to operating-model choices: prerequisites, embedded champions, business-owned use cases, deterministic steps and explicit human relationships.

**Connection to the brief:** It extends today’s app-building, data-agent and long-running-job stories with one organization’s implementation path and reported outcomes.

<span class="story-editorial-note" data-george-implication="Use the bank’s sequence—policy and training, data foundation, embedded champions, then bounded agents—as a transformation roadmap to critique with clients." hidden></span>

**Coverage:** A mandatory and core-source search found no newer verified, unused podcast within the preferred 48-hour window, so the documented seven-day fallback was used.

**Evidence:** Practitioner analysis. The publisher page identifies the episode, host and September 10 date; its transcript ends at 38:31, used as the runtime.

**Listen / watch:** <a href="https://podcast.smarterx.ai/shownotes/238" data-item-id="dab-podcast-2026-09-14-bank-ai-transformation" data-edition-date="2026-09-14" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Publisher show notes and transcript</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-14" data-feedback-story-id="dab-podcast-2026-09-14-bank-ai-transformation">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<!-- reader-release:start -->


<section class="watchlist-preview" aria-labelledby="watchlist-preview-heading"><h2 id="watchlist-preview-heading">Emerging AI Watchlist</h2><p>Help choose what we investigate next. Explore emerging ideas and tell us which interest you.</p><div data-watchlist-preview></div><p><a href="{{ '/watchlist/' | relative_url }}">Explore the watchlist and vote →</a></p></section>


<!-- reader-release:end -->

## Editorial takeaway

This weekend-window edition converges on one operating principle: make the surrounding system more explicit as AI becomes more capable. Constrained interfaces, governed context, evidence handoffs, resumable state and human approval matter more than a compelling demo.

<!-- reader-release:start -->
<aside class="series-invitation" id="explore-series"><p class="book-kicker">CONTINUE LEARNING</p><h2>Explore the Generative AI Professional Series</h2><p>Take the next step from today’s developments to deeper professional learning. Explore George Tome’s books on prompting, context, and reliable AI.</p><p><a class="book-cta" href="https://leanpub.com/u/george-tome" target="_blank" rel="noopener noreferrer">Explore the books ↗</a></p><p class="small-note">Written by the curator of this brief. Buying a book supports his work.</p></aside>
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

