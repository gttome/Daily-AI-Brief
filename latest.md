# Daily Generative AI Brief — September 15, 2026

**Published:** September 15, 2026  
**Coverage period:** Verified developments published September 11–14, 2026; overnight primary-source volume was limited, so documented recency fallbacks were used where needed.

<!-- reader-release:start -->
<section class="edition-overview" id="edition-overview"><p class="book-kicker">IN THIS EDITION · 6 ARTICLES / 2 VIDEOS / 1 PODCAST</p><h2>Choose what matters to your work</h2><ol><li><a href="#reading-dab-story-2026-09-15-a1c3f9e2">GitHub lets Copilot Auto balance cost, speed, and quality per prompt</a><span>Article · about 1 min source read</span></li><li><a href="#reading-dab-story-2026-09-15-b7d4e8a1">Microsoft publishes a draft control contract for MAI models</a><span>Article · about 6 min source read</span></li><li><a href="#reading-dab-story-2026-09-15-c2f6a9d4">Anthropic connects Claude to financial-advisor workflows</a><span>Article · about 5 min source read</span></li><li><a href="#reading-dab-story-2026-09-15-d8e1b5c7">GitHub shows how marketing operations can run as reviewed code</a><span>Article · about 11 min source read</span></li><li><a href="#reading-dab-story-2026-09-15-e3a7d2f9">An open Agent Skills library adds verification gates and restartable workflows</a><span>Article · about 15 min source read</span></li><li><a href="#reading-dab-story-2026-09-15-f4b8c1e6">Salesforce’s Campaign Agent turns a marketing goal into a reviewed plan</a><span>Article · about 4 min source read</span></li><li><a href="#general">Use Writing Blocks with ChatGPT for Teachers</a><span>Video · 3:21</span></li><li><a href="#agents-for-non-technical-people">Connect Apps with ChatGPT for Teachers</a><span>Video · 3:44</span></li><li><a href="#worth-listening--podcast">GPT-6 Astra, NYC Bans AI in Schools, Trump Goes All-In on Data Centers &amp; Lawyers Under Pressure to Pass on AI Savings</a><span>Podcast</span></li></ol></section>
<!-- reader-release:end -->

<span id="reading-dab-story-2026-09-15-a1c3f9e2"></span>

## 1. GitHub lets Copilot Auto balance cost, speed, and quality per prompt

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 1 min read</span></div><p><strong>Routing tier:</strong> A routing tier changes how an orchestrator weighs cost, latency, and quality. It does not promise one fixed model or outcome.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to evaluate prompt-level model routing as a cost, speed, and review control.</p></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 14, 2026

**Topics:** model routing, cost controls, latency, AI-assisted development

<span class="story-data" data-story-id="dab-story-2026-09-15-a1c3f9e2" data-story-url="/stories/2026-09-15/github-lets-copilot-auto-balance-cost-speed-and-quality/" hidden></span>

<a href="{{ '/stories/2026-09-15/github-lets-copilot-auto-balance-cost-speed-and-quality/' | relative_url }}" data-item-id="dab-story-2026-09-15-a1c3f9e2" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Changelog  
**Availability:** General Availability

![White-background textbook architecture showing a coding prompt triage layer routing docstring and complex-refactor requests through Efficiency, Balance, or Intelligence priorities into one shared model pool, followed by response, latency, and usage checks.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/01-copilot-auto-model-selection.png?v=20260915textbook)

**Summary:** GitHub Copilot Auto now offers Efficiency, Balance, and Intelligence tiers. Auto evaluates each prompt and chooses from the same available model pool while weighting cost, quality, and response time differently. The feature is rolling out in Visual Studio Code, Copilot CLI, and the Copilot app.

**Why it matters:** This moves model routing from a hidden convenience toward an explicit engineering control. Teams can match routine work to lower-cost paths and reserve quality-first routing for harder tasks, but the tier is not a fixed-model guarantee: usage is billed according to the model Auto selects, and GitHub has not published an independent quality or cost comparison for the three settings.

<span class="story-editorial-note" data-george-implication="Add routing policy to coding-agent workshops: classify tasks by reversibility, complexity, latency tolerance, and verification cost, then compare all three tiers on the same small benchmark before standardizing a default." hidden></span>

**What to do now — Benchmark all three tiers:** Run the same routine and complex tasks through each tier, then compare usage, latency, review burden, and accepted output.

**Source:** <a href="https://github.blog/changelog/2026-09-14-configure-cost-and-quality-in-copilot-auto-model-selection/" data-item-id="dab-story-2026-09-15-a1c3f9e2" data-edition-date="2026-09-15" data-action="source_clicks">Configure cost and quality in Copilot auto model selection</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-a1c3f9e2">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-15-b7d4e8a1"></span>

## 2. Microsoft publishes a draft control contract for MAI models

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 6 min read</span></div><p><strong>Control contract:</strong> A control contract states intended behavior and boundaries. It becomes operational only when paired with training, tests, monitoring, and enforcement.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to separate absolute constraints, configurable defaults, monitoring, and human interruption.</p></div></aside>
<!-- reader-release:end -->

**Focus: Technical AI Engineering**

**Date:** September 14, 2026

**Topics:** model behavior, guardrails, human control, public consultation

<span class="story-data" data-story-id="dab-story-2026-09-15-b7d4e8a1" data-story-url="/stories/2026-09-15/microsoft-publishes-a-draft-control-contract-for-mai-models/" hidden></span>

<a href="{{ '/stories/2026-09-15/microsoft-publishes-a-draft-control-contract-for-mai-models/' | relative_url }}" data-item-id="dab-story-2026-09-15-b7d4e8a1" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Proposed

![White-background layered textbook cutaway placing a human goal inside useful defaults, operator control, absolute constraints, and monitoring, with correction, pause, shutdown, audit trace, and public-feedback pathways around a clearly marked draft blueprint.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/02-humanist-ai-control-layers.png?v=20260915textbook)

**Summary:** Microsoft AI published a draft Humanist AI Code of Conduct for a six-week public consultation. It describes intended model behavior, absolute constraints, operator-configurable defaults, uncertainty handling, evaluation, monitoring, and a requirement that MAI models remain subject to human interruption, correction, and shutdown.

**Why it matters:** The document is useful as an inspectable behavioral contract: teams can translate values into tests, escalation rules, and operational controls. Microsoft explicitly says the draft is not being used to train its models today, so it is a proposal and future governing document—not evidence that deployed systems already satisfy every stated behavior.

<span class="story-editorial-note" data-george-implication="Use the draft as a workshop comparison point: separate absolute constraints from configurable defaults, then require an observable test, owner, escalation path, and shutdown mechanism for each important agent behavior." hidden></span>

**What to do now — Turn principles into tests:** Choose one absolute constraint and one configurable default, then define measurable pass, fail, escalation, and shutdown behavior.

**Source:** <a href="https://microsoft.ai/news/mai-code-of-conduct/" data-item-id="dab-story-2026-09-15-b7d4e8a1" data-edition-date="2026-09-15" data-action="source_clicks">Humanist AI in practice: A public consultation on our Code of Conduct for MAI Models</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-b7d4e8a1">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-15-c2f6a9d4"></span>

## 3. Anthropic connects Claude to financial-advisor workflows

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 5 min read</span></div><p><strong>Professional review:</strong> Connected context can improve preparation, but a licensed or accountable professional still owns regulated judgment and client action.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>Where connected AI assistance ends and professional accountability begins.</p></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 14, 2026

**Topics:** financial advice, data connectors, meeting preparation, human review

<span class="story-data" data-story-id="dab-story-2026-09-15-c2f6a9d4" data-story-url="/stories/2026-09-15/anthropic-connects-claude-to-financial-advisor-workflows/" hidden></span>

<a href="{{ '/stories/2026-09-15/anthropic-connects-claude-to-financial-advisor-workflows/' | relative_url }}" data-item-id="dab-story-2026-09-15-c2f6a9d4" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Authoritative Reporting  
**Availability:** Announced

![White-background textbook evidence flow showing authorized CRM, holdings, research, and meeting-note sources passing through permissions and an evidence ledger into meeting prep, portfolio review, and follow-up drafts, with uncertainty and advisor review before client action.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/03-financial-advisor-evidence-flow.png?v=20260915textbook)

**Summary:** Anthropic launched Claude for Financial Advisors, a package that connects Claude to wealth-management data and software for tasks such as meeting preparation, portfolio review, and follow-up. Reuters reports that the offering is aimed at advisors rather than autonomous client-facing decision-making.

**Why it matters:** The practical shift is from generic chat to permissioned, workflow-specific assistance with relevant client and portfolio context. The launch does not remove fiduciary, suitability, privacy, or recordkeeping duties, and the available evidence is announcement reporting rather than an independent evaluation of accuracy, security, or advisor outcomes.

<span class="story-editorial-note" data-george-implication="Use the pattern for consulting and publishing research: connect only approved sources, preserve citations and assumptions, mark uncertainty, and place a named professional review gate before any external recommendation or client action." hidden></span>

**What to do now — Map the review boundary:** For one advisory workflow, list approved sources, required citations, uncertainty labels, prohibited actions, and the accountable reviewer.

**Source:** <a href="https://www.reuters.com/business/anthropic-targets-financial-advisers-with-new-claude-tool-2026-09-14/" data-item-id="dab-story-2026-09-15-c2f6a9d4" data-edition-date="2026-09-15" data-action="source_clicks">Anthropic targets financial advisers with new Claude tool</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-c2f6a9d4">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-15-d8e1b5c7"></span>

## 4. GitHub shows how marketing operations can run as reviewed code

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 11 min read</span></div><p><strong>Operations as code:</strong> Structured inputs, visible state, guarded triggers, logs, and retries make a workflow easier to review and repair.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to convert a repetitive knowledge-work process into a visible, restartable automation.</p></div></aside>
<!-- reader-release:end -->

**Focus: Applied Generative AI for Knowledge Workers**

**Date:** September 11, 2026

**Topics:** marketing operations, workflow automation, human approval, failure handling

<span class="story-data" data-story-id="dab-story-2026-09-15-d8e1b5c7" data-story-url="/stories/2026-09-15/github-shows-how-marketing-operations-can-run-as-reviewed-code/" hidden></span>

<a href="{{ '/stories/2026-09-15/github-shows-how-marketing-operations-can-run-as-reviewed-code/' | relative_url }}" data-item-id="dab-story-2026-09-15-d8e1b5c7" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Practitioner Analysis  
**Availability:** Reported

![White-background textbook process map showing an issue form and event-setup label triggering guarded automation for landing pages, tracking, invitations, project boards, and registrant checks, followed by human approval, launch, follow-up, reporting, audit, and retry.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/04-marketing-ops-as-code.png?v=20260915textbook)

**Summary:** A GitHub marketing lead documents an event-operations system that treats an Issue as the unit of work, structured issue forms as inputs, labels as triggers, and GitHub Actions as the machinery. The workflow stages landing pages, tracking links, invitations, boards, registrant checks, follow-up, and reporting while retaining human and platform guardrails.

**Why it matters:** This is an unusually concrete knowledge-work automation pattern: write the process down, make inputs structured, keep the work record visible, and automate repetitive transitions. It is one practitioner implementation rather than a comparative study, and credentials, CRM writes, error paths, approvals, and maintenance still require explicit ownership.

<span class="story-editorial-note" data-george-implication="Model one workshop, launch, or publishing campaign as a single tracked work item with typed inputs, guarded triggers, review checkpoints, audit logs, and restartable failure handling before adding an AI agent." hidden></span>

**What to do now — Automate one visible handoff:** Start with a structured intake form and one reversible trigger, then add approval, logging, and retry before expanding the workflow.

**Source:** <a href="https://github.blog/ai-and-ml/github-copilot/marketing-ops-as-code-automating-events-from-planning-to-follow-up-on-github/" data-item-id="dab-story-2026-09-15-d8e1b5c7" data-edition-date="2026-09-15" data-action="source_clicks">Marketing ops as code: Automating events from planning to follow-up on GitHub</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-d8e1b5c7">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-15-e3a7d2f9"></span>

## 5. An open Agent Skills library adds verification gates and restartable workflows

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Update</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 15 min read</span></div><p><strong>Restartable skill:</strong> A reusable skill should define what can be resumed, what evidence is durable, and which checks prove that work is complete.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How restartable boundaries, adapters, tests, and rollback improve reusable skill operations.</p></div><div class="related-coverage"><strong>Earlier Brief</strong><p><a href="https://gttome.github.io/Daily-AI-Brief/stories/2026-09-14/google-cloud-plugin-packages-reusable-agent-skills/" target="_blank" rel="noopener noreferrer">Google Cloud packages reusable Agent Skills for four coding-agent hosts</a></p><p>2026-09-14 · Earlier: one vendor plugin across hosts. Here: a broader open skill library adds lifecycle commands, restartable boundaries, and verification gates.</p></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Non-Technical People**

**Date:** September 11, 2026

**Topics:** Agent Skills, verification, restartable work, portable instructions

<span class="story-data" data-story-id="dab-story-2026-09-15-e3a7d2f9" data-story-url="/stories/2026-09-15/an-open-agent-skills-library-adds-verification-gates-and-restartable-workflows/" hidden></span>

<a href="{{ '/stories/2026-09-15/an-open-agent-skills-library-adds-verification-gates-and-restartable-workflows/' | relative_url }}" data-item-id="dab-story-2026-09-15-e3a7d2f9" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Repository  
**Availability:** General Availability

**What changed since last coverage:** This repository adds a 25-skill engineering library, nine lifecycle commands, restartable task boundaries, native adapters, and verification gates to the reusable Agent Skills pattern covered in prior editions.

![White-background exploded textbook view of a maintained open Agent Skills package with instructions, references, scripts, examples, tests, adapters, context budget, and permissions, above an inspect, install, run, verify, and rollback lifecycle.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/05-agent-skills-validation-lifecycle.png?v=20260915textbook)

**Summary:** Addy Osmani’s open agent-skills repository packages 25 engineering skills and nine lifecycle commands for compatible coding agents. Recent updates added restartable task boundaries, native adapters, double-routing avoidance, and setup guidance for existing projects, while the repository emphasizes verification gates rather than treating generated work as complete by default.

**Why it matters:** For non-technical leaders, the useful idea is procedural reuse: a reviewed method can travel as instructions, references, scripts, examples, and tests. This is approved repeat coverage of the Agent Skills pattern because the repository adds a broad lifecycle library and restartable boundaries; community maintenance, portability, and included tests do not guarantee safety or equivalent behavior in every host.

<span class="story-editorial-note" data-george-implication="Package one recurring book or workshop workflow as a small skill with an explicit stopping point, acceptance checks, and rollback notes. Inspect every file and permission before installation, then test it in a non-sensitive project." hidden></span>

**What to do now — Pilot one bounded skill:** Inspect its files and permissions, define a stopping point and acceptance checks, then run it on a reversible project with rollback ready.

**Source:** <a href="https://github.com/addyosmani/agent-skills" data-item-id="dab-story-2026-09-15-e3a7d2f9" data-edition-date="2026-09-15" data-action="source_clicks">Production-grade Agent Skills for software engineering</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-e3a7d2f9">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="reading-dab-story-2026-09-15-f4b8c1e6"></span>

## 6. Salesforce’s Campaign Agent turns a marketing goal into a reviewed plan

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">New development</span><span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">Source article · about 4 min read</span></div><p><strong>Campaign orchestration:</strong> An agent can coordinate campaign workstreams, but approved data, brand rules, channel ownership, and human approval still bound the process.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How a goal becomes reviewed audience, content, channel, timing, and outcome decisions.</p></div></aside>
<!-- reader-release:end -->

**Focus: Agents for Non-Technical People**

**Date:** September 14, 2026

**Topics:** campaign planning, personalization, human approval, marketing agents

<span class="story-data" data-story-id="dab-story-2026-09-15-f4b8c1e6" data-story-url="/stories/2026-09-15/salesforce-campaign-agent-turns-a-marketing-goal-into-a-reviewed-plan/" hidden></span>

<a href="{{ '/stories/2026-09-15/salesforce-campaign-agent-turns-a-marketing-goal-into-a-reviewed-plan/' | relative_url }}" data-item-id="dab-story-2026-09-15-f4b8c1e6" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent story page</a>

**Evidence:** Official Announcement  
**Availability:** Announced

![White-background textbook funnel showing a business goal branching through coworking stages for audience, content, channels, and send priority, constrained by data access and brand policy, then passing human approval before launch and a bounded outcomes and decisioning loop.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-15/06-campaign-agent-orchestration.png?v=20260915textbook)

**Summary:** Salesforce announced Campaign Agent for Marketing Cloud Next. It is designed to turn a stated campaign goal into coordinated audience, content, channel, and send-priority work, with marketers reviewing and approving before launch. Salesforce describes coworking and decisioning phases and says general availability is planned for October.

**Why it matters:** The product makes a complex cross-channel workflow accessible through intent while keeping a person at the approval boundary. It is not generally available yet, and vendor descriptions do not establish lift, accuracy, brand safety, or data-governance performance; teams must verify which data, assets, channels, and actions the agent may use.

<span class="story-editorial-note" data-george-implication="Use the orchestration pattern for a book or workshop launch: state one measurable goal, separate audience, message, channel, and timing decisions, enforce approved data and brand rules, and require review before any external action." hidden></span>

**What to do now — Map one campaign safely:** Define the goal, approved audience data, brand rules, channel owners, approval gate, and outcome measures before evaluating the October release.

**Source:** <a href="https://www.salesforce.com/blog/introducing-the-campaign-agent-that-turns-goals-into-growth/" data-item-id="dab-story-2026-09-15-f4b8c1e6" data-edition-date="2026-09-15" data-action="source_clicks">Introducing the Campaign Agent that turns goals into growth</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-story-2026-09-15-f4b8c1e6">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Watching

<span id="general"></span>

## 7. General

### Use Writing Blocks with ChatGPT for Teachers

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>3:21 video</span></div><p><strong>Writing block:</strong> A bounded writing workspace can make a transformation easier to review than a long conversational thread.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to transform source material, revise passages, and translate a reviewed artifact.</p></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-15/general/' | relative_url }}" data-item-id="dab-video-2026-09-15-general" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** OpenAI Academy  
**Date:** September 11, 2026  
**Runtime:** 3:21  
**Format:** Video

**Summary:** A three-minute official example of turning source material into a structured handout, revising passages, and translating the result.

**Why it matters:** It complements today’s operations-as-code story by showing a small, reviewable content transformation for knowledge workers.

<span class="story-editorial-note" data-george-implication="" hidden></span>**Source:** <a href="https://academy.openai.com/public/clubs/k-12-education-aacga/videos/use-writing-blocks-with-chatgpt-for-teachers" data-item-id="dab-video-2026-09-15-general" data-edition-date="2026-09-15" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on OpenAI Academy</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-video-2026-09-15-general">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<span id="agents-for-non-technical-people"></span>

## 8. Agents for Non-Technical People

### Connect Apps with ChatGPT for Teachers

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>3:44 video</span></div><p><strong>Connected app:</strong> A connector provides authorized context. Review access scope and generated drafts before sending or acting.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to use connected context for a bounded email-review and drafting workflow.</p></div></aside>
<!-- reader-release:end -->

<a href="{{ '/videos/2026-09-15/agent-skills/' | relative_url }}" data-item-id="dab-video-2026-09-15-agent-skills" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent video page</a>  
**Channel:** OpenAI Academy  
**Date:** September 11, 2026  
**Runtime:** 3:44  
**Format:** Video

**Summary:** A concise official demonstration of connecting Gmail, reviewing unread messages, and drafting replies for human review.

**Why it matters:** It gives non-technical readers a bounded example of permissioned context and an approval-before-action workflow.

<span class="story-editorial-note" data-george-implication="" hidden></span>**Source:** <a href="https://academy.openai.com/public/clubs/k-12-education-aacga/videos/connect-apps-with-chatgpt-for-teachers" data-item-id="dab-video-2026-09-15-agent-skills" data-edition-date="2026-09-15" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Watch on OpenAI Academy</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-video-2026-09-15-agent-skills">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

## Worth Listening — Podcast

### 9. GPT-6 Astra, NYC Bans AI in Schools, Trump Goes All-In on Data Centers & Lawyers Under Pressure to Pass on AI Savings

<!-- reader-release:start -->
<aside class="reading-context" aria-label="Reading context"><div class="reading-meta"><span class="coverage-label">Background</span><span>87:30 podcast</span></div><p><strong>Evidence layers:</strong> Vendor claims, host interpretation, anecdotes, and verified operating results carry different evidentiary weight.</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>How to separate product claims from interpretation and operational proof across a broad AI discussion.</p></div></aside>
<!-- reader-release:end -->

<span class="podcast-data" data-podcast-id="dab-podcast-2026-09-15-ai-show-237" data-podcast-title="GPT-6 Astra, NYC Bans AI in Schools, Trump Goes All-In on Data Centers &amp; Lawyers Under Pressure to Pass on AI Savings" data-podcast-url="/podcasts/2026-09-15/ai-show-237/" hidden></span>

<a href="{{ '/podcasts/2026-09-15/ai-show-237/' | relative_url }}" data-item-id="dab-podcast-2026-09-15-ai-show-237" data-edition-date="2026-09-15" data-action="permanent_page_clicks">Open the permanent podcast page</a>

**Show:** The Artificial Intelligence Show  
**Host / guest:** Paul Roetzer and Mike Kaput  
**Focus:** Applied Generative AI for Knowledge Workers  
**Date:** September 8, 2026  
**Duration:** 87:30 · No episode time limit  
**Topics:** professional work, AI literacy, services pricing, agent oversight

**Summary:** Paul Roetzer and Mike Kaput discuss GPT-6 Astra, school AI policy, professional-services pricing, education assessment, and practical agent use, with chapter timestamps and a full transcript.

**Why it matters:** The episode connects frontier capability claims to operating questions for schools, professional services, and everyday agent use while exposing the hosts’ interpretation for readers to assess.

**Connection to the brief:** Its discussion of AI-assisted professional work, education, pricing, and supervised computer use complements today’s governance and knowledge-work stories.

<span class="story-editorial-note" data-george-implication="Use selected timestamped segments to compare vendor claims, practitioner interpretation, and the evidence needed before changing a consulting or education workflow." hidden></span>

**Coverage:** Mandatory and core registered sources were checked. No eligible unused episode was verified in the preceding 48 hours; the documented seven-day boundary fallback was used.

**Evidence:** Practitioner analysis. The publisher page identifies September 8, 2026, Paul Roetzer and Mike Kaput as hosts, and a transcript ending at 1:27:30; podcasts have no duration cap.

**Listen / watch:** <a href="https://podcast.smarterx.ai/shownotes/237" data-item-id="dab-podcast-2026-09-15-ai-show-237" data-edition-date="2026-09-15" data-action="source_clicks" target="_blank" rel="noopener noreferrer">Publisher show notes and transcript</a>

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-15" data-feedback-story-id="dab-podcast-2026-09-15-ai-show-237">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>

<!-- reader-release:start -->


<section class="watchlist-preview" aria-labelledby="watchlist-preview-heading"><h2 id="watchlist-preview-heading">Emerging AI Watchlist</h2><p>Help choose what we investigate next. Explore emerging ideas and tell us which interest you.</p><div data-watchlist-preview></div><p><a href="{{ '/watchlist/' | relative_url }}">Explore the watchlist and vote →</a></p></section>


<!-- reader-release:end -->

## Editorial takeaway

Today’s through-line is explicit control: route models by task, translate values into testable boundaries, connect only approved evidence, automate visible state transitions, and keep accountable human review before consequential action.

<!-- reader-release:start -->
<aside class="series-invitation" id="explore-series"><p class="book-kicker">CONTINUE LEARNING</p><h2>Explore the Generative AI Professional Series</h2><p>Take the next step from today’s developments to deeper professional learning. Explore George Tome’s books on prompting, context, and reliable AI.</p><p><a class="book-cta" href="https://leanpub.com/u/george-tome" target="_blank" rel="noopener noreferrer">Explore the books ↗</a></p><p class="small-note">Written by the curator of this brief. Buying a book supports his work.</p></aside>
<!-- reader-release:end -->
