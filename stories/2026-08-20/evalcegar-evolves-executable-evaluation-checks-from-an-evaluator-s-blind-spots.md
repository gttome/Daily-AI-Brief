---
layout: default
title: "EvalCEGAR evolves executable evaluation checks from an evaluator’s blind spots"
description: "*Metrics That Write Themselves* proposes EvalCEGAR, a loop that searches for pairs of answers an existing evaluator scores identically even though one is correct and the other is not. Those counterexamples become the specification for a small Python operator that detects one named defect or abstains. On MBPP+ and HumanEval+, the system produced a 55-line operator that closed 15.4% of the gap between flagging nothing and a perfect filter on 428 unseen tasks. Six of eight runs admitted a useful operator, and all six improved out-of-sample filtering."
image: "https://arxiv.org/static/browse/0.3.4/images/icons/apple-touch-icon.png"
permalink: /stories/2026-08-20/evalcegar-evolves-executable-evaluation-checks-from-an-evaluator-s-blind-spots/
brief_date: 2026-08-20
story_id: dab-story-2026-08-20-6364926f
---

[← Daily Brief for August 20, 2026]({{ '/briefs/2026-08-20/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})

# EvalCEGAR evolves executable evaluation checks from an evaluator’s blind spots

<span class="story-data" data-story-id="dab-story-2026-08-20-6364926f" hidden></span>

**Focus:** Earlier edition  
**Date:** August 19, 2026  
**Topics:** Evaluation engineering, guardrails, loop engineering, executable metrics, LLM-as-judge  
**Evidence:** Unspecified  
**Availability:** Unspecified

![arXiv research](https://arxiv.org/static/browse/0.3.4/images/icons/apple-touch-icon.png)

**Summary:** *Metrics That Write Themselves* proposes EvalCEGAR, a loop that searches for pairs of answers an existing evaluator scores identically even though one is correct and the other is not. Those counterexamples become the specification for a small Python operator that detects one named defect or abstains. On MBPP+ and HumanEval+, the system produced a 55-line operator that closed 15.4% of the gap between flagging nothing and a perfect filter on 428 unseen tasks. Six of eight runs admitted a useful operator, and all six improved out-of-sample filtering.

**Why it matters:** Many Generative AI applications fail because teams cannot define a complete metric in advance. EvalCEGAR treats evaluator development as a diagnostic loop: find a blind spot, express it as a counterexample, add a narrow executable check, and test whether it generalizes. This can complement rather than replace human rubrics or LLM judges.

**For George’s work:** This offers a concrete evaluation-engineering pattern for books and workshops: **baseline rubric → find indistinguishable good/bad examples → add one narrow check → regression test → retain only if it helps unseen cases**. It makes evaluation iteration more tangible for knowledge workers than asking an AI to “improve the rubric” generically.

**Source:** [arXiv](https://arxiv.org/abs/2608.18744)

---

[← Daily Brief for August 20, 2026]({{ '/briefs/2026-08-20/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})
