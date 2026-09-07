---
layout: default
title: "InsufficiencyBench shows frontier models struggle to ask for legally decisive missing facts"
description: "*InsufficiencyBench* evaluates whether a model recognizes when a legal question lacks facts that materially determine the answer, identifies what is missing, and avoids a premature conclusion. Its 202 items—58 complete queries and 144 deficient variants—span six legal domains and 24 U.S. jurisdictions and were annotated by practicing attorneys. Across ten frontier models, none exceeded an F2 score of 0.46 for missing-element identification, and median recall was 0.44. The authors observed two recurring failure modes: models hedged broadly even when a question was sufficiently specified, or answered an underspecified question using unstated assumptions."
image: "https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-08-23/insufficiency-bench.svg"
permalink: /stories/2026-08-23/insufficiencybench-shows-frontier-models-struggle-to-ask-for-legally-decisive-mi/
brief_date: 2026-08-23
story_id: dab-story-2026-08-23-be5593e7
---

[← Daily Brief for August 23, 2026]({{ '/briefs/2026-08-23/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})

# InsufficiencyBench shows frontier models struggle to ask for legally decisive missing facts

<span class="story-data" data-story-id="dab-story-2026-08-23-be5593e7" hidden></span>

**Focus:** Earlier edition  
**Date:** August 20, 2026  
**Topics:** Clarification, guardrails, human review, legal AI, evaluation  
**Evidence:** Unspecified  
**Availability:** Unspecified

![Editorial diagram showing a sufficiency check before an AI system answers](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-08-23/insufficiency-bench.svg)

**Summary:** *InsufficiencyBench* evaluates whether a model recognizes when a legal question lacks facts that materially determine the answer, identifies what is missing, and avoids a premature conclusion. Its 202 items—58 complete queries and 144 deficient variants—span six legal domains and 24 U.S. jurisdictions and were annotated by practicing attorneys. Across ten frontier models, none exceeded an F2 score of 0.46 for missing-element identification, and median recall was 0.44. The authors observed two recurring failure modes: models hedged broadly even when a question was sufficiently specified, or answered an underspecified question using unstated assumptions.

**Why it matters:** A fluent answer can be wrong before reasoning begins because the task definition is incomplete. Reliability therefore needs a pre-answer gate that asks whether the available facts are sufficient, not just a post-answer fact check.

**For George’s work:** Add an explicit **sufficiency check** to high-consequence prompt and agent patterns: identify decision-changing unknowns → ask targeted questions → state remaining assumptions → escalate to a qualified human when needed. This applies well beyond law to finance, health, policy, and business analysis.

**Source:** [arXiv](https://arxiv.org/abs/2608.20220)

---

[← Daily Brief for August 23, 2026]({{ '/briefs/2026-08-23/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})
