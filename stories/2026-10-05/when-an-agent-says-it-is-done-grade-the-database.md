---
layout: default
title: "When an agent says it is done, grade the database"
permalink: /stories/2026-10-05/when-an-agent-says-it-is-done-grade-the-database/
brief_date: 2026-10-05
reader_release: true
---

[← Home]({{ '/' | relative_url }}) · [Back to October 5 Brief]({{ '/briefs/2026-10-05/' | relative_url }})

# When an agent says it is done, grade the database

**Focus:** Technical AI Engineering  
**Date:** 2026-10-03  
**Source article:** about 17 min read

![Backend-state verification for agents.](https://gttome.github.io/Daily-AI-Brief/briefs/images/2026-10-05/dab-edition-2026-10-05-m02.png?v=64f321e34414)

**Summary:** Microsoft and Hugging Face’s ThinkingBox grades agents by terminal database state and repeated outcomes instead of treating plausible text or valid-looking tool calls as success.

**Why it matters:** Backend-state grading turns agent evaluation into a systems test: the database, side effects, and repeatability become the evidence that determines whether work actually completed.

**What to watch:** Publisher-authored benchmark; production systems still need task-specific state assertions and repeat-run thresholds.

**Source:** [The Agent Said It Was Done. The Database Disagreed.](https://huggingface.co/blog/microsoft/thinkingbox)

[← Back to October 5 Brief]({{ '/briefs/2026-10-05/' | relative_url }})
