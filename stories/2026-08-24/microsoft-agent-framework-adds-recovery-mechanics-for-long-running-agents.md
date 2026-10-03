---
layout: default
title: "Microsoft Agent Framework adds recovery mechanics for long-running agents"
description: "Microsoft Agent Framework Python 1.15.0 adds steering, retry, and recovery support for resilient Foundry Hosted Agents, along with long-running workflow samples. The release also introduces a first-class fatal middleware signal, a workflow checkpoint type registry, persisted approval state, and fixes for A2A inputs, tool-call duplication, remote MCP name shadowing, and superlinear history growth."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-24/microsoft-agent-framework.svg"
permalink: /stories/2026-08-24/microsoft-agent-framework-adds-recovery-mechanics-for-long-running-agents/
brief_date: 2026-08-24
story_id: dab-story-2026-08-24-f58c2c99
---

[← Daily Brief for August 24, 2026]({{ '/briefs/2026-08-24/' | relative_url }})

# Microsoft Agent Framework adds recovery mechanics for long-running agents

<span class="story-data" data-story-id="dab-story-2026-08-24-f58c2c99" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** August 21, 2026  
**Topics:** Harness engineering, long-running workflows, checkpoints, approvals, A2A, MCP  
**Evidence:** Unspecified  
**Availability:** Unspecified

![Rail-style diagram showing checkpoints, steering, and recovery in a long-running agent workflow](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-24/microsoft-agent-framework.svg)

**Summary:** Microsoft Agent Framework Python 1.15.0 adds steering, retry, and recovery support for resilient Foundry Hosted Agents, along with long-running workflow samples. The release also introduces a first-class fatal middleware signal, a workflow checkpoint type registry, persisted approval state, and fixes for A2A inputs, tool-call duplication, remote MCP name shadowing, and superlinear history growth.

**Why it matters:** The release treats failure recovery, approvals, state restoration, and trace continuity as core harness responsibilities. Those mechanics determine whether an agent can resume safely after interruption instead of repeating work, losing context, or silently diverging.

<span class="story-editorial-note" data-george-implication="This is a concrete teaching example for distinguishing the model from the harness around it. A useful workshop exercise could deliberately interrupt an agent at a checkpoint and verify that state, approvals, tools, and audit evidence resume correctly." hidden></span>

**Source:** <a href="https://github.com/microsoft/agent-framework/releases/tag/python-1.15.0" data-item-id="dab-story-2026-08-24-f58c2c99" data-edition-date="2026-08-24" data-action="source_clicks">Microsoft Agent Framework 1.15.0 release</a>

---

[← Daily Brief for August 24, 2026]({{ '/briefs/2026-08-24/' | relative_url }})
