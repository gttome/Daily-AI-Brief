---
layout: default
title: "AgentX measures infrastructure using real agent-session behavior"
description: "NVIDIA published results using SemiAnalysis AgentX, an open-source InferenceX benchmark that replays recorded coding-agent sessions turn by turn. Unlike fixed prompt-and-response tests, AgentX preserves changing input and output lengths, accumulated context, reasoning time, tool-call latency, cache pressure, and varying concurrency. NVIDIA reports preview Vera Rubin NVL72 results of up to 30× more throughput per megawatt than GB300 NVL72 at 160 tokens per second per user."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-25/agentx.svg"
permalink: /stories/2026-08-25/agentx-measures-infrastructure-using-real-agent-session-behavior/
brief_date: 2026-08-25
story_id: dab-story-2026-08-25-a653e831
---

[← Daily Brief for August 25, 2026]({{ '/briefs/2026-08-25/' | relative_url }})

# AgentX measures infrastructure using real agent-session behavior

<span class="story-data" data-story-id="dab-story-2026-08-25-a653e831" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** August 24, 2026  
**Topics:** Agent evaluation, long context, inference infrastructure, KV-cache reuse, performance per watt  
**Evidence:** Unspecified  
**Availability:** Unspecified

![Irregular agent-session timeline contrasting uniform chat turns with long context, tool gaps, and cache reuse](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-25/agentx.svg)

**Summary:** NVIDIA published results using SemiAnalysis AgentX, an open-source InferenceX benchmark that replays recorded coding-agent sessions turn by turn. Unlike fixed prompt-and-response tests, AgentX preserves changing input and output lengths, accumulated context, reasoning time, tool-call latency, cache pressure, and varying concurrency. NVIDIA reports preview Vera Rubin NVL72 results of up to 30× more throughput per megawatt than GB300 NVL72 at 160 tokens per second per user.

**Why it matters:** Agent infrastructure cannot be evaluated realistically with a single fixed context length. Long-running agents create irregular bursts of model calls, tool waits, subagent work, and repeated context. A benchmark that preserves those trajectories is closer to measuring the actual cost and responsiveness of an agent harness.

<span class="story-editorial-note" data-george-implication="This offers a valuable evaluation distinction for books and courses: measure not only output quality, but also completed-work latency, context growth, cache reuse, tool-wait time, concurrency, energy, and cost across the full loop." hidden></span>

**Source:** <a href="https://developer.nvidia.com/blog/nvidia-vera-rubin-and-blackwell-set-a-new-standard-for-agentic-ai-performance-per-watt/" data-item-id="dab-story-2026-08-25-a653e831" data-edition-date="2026-08-25" data-action="source_clicks">NVIDIA AgentX and Vera Rubin analysis</a>

---

[← Daily Brief for August 25, 2026]({{ '/briefs/2026-08-25/' | relative_url }})
