---
layout: default
title: "Codex 0.151 makes subagent cost and restored permissions more visible"
description: "OpenAI’s Codex CLI `rust-v0.151.0` release accounts subagent token use against root goals, preserves restored permission profiles in TUI sessions, reports which capabilities remote plugin syncs affect, and adds telemetry around escalated stdin reviews and remote-executor MCP discovery. The release also includes test stabilization."
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-31/02-codex-harness-ledger.svg"
permalink: /stories/2026-08-31/codex-0-151-makes-subagent-cost-and-restored-permissions-more-visible/
brief_date: 2026-08-31
story_id: dab-story-2026-08-31-a3f5c0f6
---

[← Daily Brief for August 31, 2026]({{ '/briefs/2026-08-31/' | relative_url }})

# Codex 0.151 makes subagent cost and restored permissions more visible

<span class="story-data" data-story-id="dab-story-2026-08-31-a3f5c0f6" hidden></span>

**Focus:** Technical AI Engineering  
**Date:** August 29, 2026  
**Topics:** coding agents, harness observability, subagent accounting, permission state  
**Evidence:** Unspecified  
**Availability:** Unspecified

![A root coding agent branching to three subagents whose usage is recorded in a ledger beside a permission lock](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-08-31/02-codex-harness-ledger.svg)

**Summary:** OpenAI’s Codex CLI `rust-v0.151.0` release accounts subagent token use against root goals, preserves restored permission profiles in TUI sessions, reports which capabilities remote plugin syncs affect, and adds telemetry around escalated stdin reviews and remote-executor MCP discovery. The release also includes test stabilization.

**Why it matters:** Multi-agent systems hide cost and authority in branches. Rolling child-agent usage into the parent goal improves budget attribution, while preserving and surfacing permissions reduces ambiguity after a session is restored. This is a maintenance release, not a model-capability leap, and telemetry is useful only if teams review it and set thresholds.

**For George’s work:** Use it as a compact example of harness engineering: an agent loop is not production-ready until delegated work, restored authority and external capabilities are visible to the operator.

**Source:** [OpenAI Codex releases on GitHub](https://github.com/openai/codex/releases)

---

[← Daily Brief for August 31, 2026]({{ '/briefs/2026-08-31/' | relative_url }})
