---
layout: default
title: "Codex 0.152 puts limits and durable evidence around agent tool use"
description: "OpenAI released Codex CLI 0.152 with per-tool `output_token_limit` settings for MCP tools, configurable shell-command timeouts, package-style MCP server names, and fixes that preserve user instructions, answers and valid authorizations across approval-history compaction. The release also keeps MCP tools available through cache and plugin changes, restores saved working directories on resumed threads, and rejects untrusted cloud-task backend URLs and redirects."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-01/01-codex-tool-budget.svg"
permalink: /stories/2026-09-01/codex-0-152-puts-limits-and-durable-evidence-around-agent-tool-use/
brief_date: 2026-09-01
story_id: dab-story-2026-09-01-4df260d4
---

[← Daily Brief for September 1, 2026]({{ '/briefs/2026-09-01/' | relative_url }})

# Codex 0.152 puts limits and durable evidence around agent tool use

<span class="story-data" data-story-id="dab-story-2026-09-01-4df260d4" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** September 1, 2026  
**Topics:** coding agents, MCP, output budgets, authorization evidence, cloud-task security  
**Evidence:** Unspecified  
**Availability:** Unspecified

![An MCP output pipe passing through a token-limit gauge into an approval transcript protected by a lock](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-01/01-codex-tool-budget.svg)

**Summary:** OpenAI released Codex CLI 0.152 with per-tool `output_token_limit` settings for MCP tools, configurable shell-command timeouts, package-style MCP server names, and fixes that preserve user instructions, answers and valid authorizations across approval-history compaction. The release also keeps MCP tools available through cache and plugin changes, restores saved working directories on resumed threads, and rejects untrusted cloud-task backend URLs and redirects.

**Why it matters:** These changes address common harness failure points: tools can flood context, long-running work can outlive default timeouts, compaction can erase approval evidence, and saved credentials can be exposed through unsafe routing. The release improves control surfaces rather than model intelligence, and teams still need local policies for tool budgets, trusted origins, timeout escalation and review retention.

**For George’s work:** Use this release as a checklist for “production harness” training: bound every tool’s output, preserve authorization evidence through summarization, restore execution context deliberately, and treat URLs that receive credentials as policy-controlled resources.

**Source:** [OpenAI Codex 0.152 release](https://github.com/openai/codex/releases/tag/rust-v0.152.0)

---

[← Daily Brief for September 1, 2026]({{ '/briefs/2026-09-01/' | relative_url }})
