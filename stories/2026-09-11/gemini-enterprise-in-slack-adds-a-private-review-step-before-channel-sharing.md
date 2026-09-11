---
layout: default
title: "Gemini Enterprise in Slack adds a private review step before channel sharing"
description: "Google made new Gemini Enterprise for Slack interactions generally available: users can mention Gemini in a channel, receive a response privately for review, and deliberately share it back; "
image: "https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-11/05-gemini-slack-review.png?v=20260911textbook"
permalink: /stories/2026-09-11/gemini-enterprise-in-slack-adds-a-private-review-step-before-channel-sharing/
brief_date: 2026-09-11
story_id: dab-story-2026-09-11-0abd52ec
---

[← Daily Brief for September 11, 2026]({{ '/briefs/2026-09-11/' | relative_url }})

# Gemini Enterprise in Slack adds a private review step before channel sharing

<span class="story-data" data-story-id="dab-story-2026-09-11-0abd52ec" hidden></span>

**Focus:** Agents for Non-Technical People  
**Date:** September 10, 2026  
**Topics:** Slack agents, private drafting, multi-turn context, human review  
**Evidence:** Official Changelog  
**Availability:** General Availability

![Conversation-topology diagram showing a channel mention entering a private ask-review-revise capsule before deliberate sharing, plus a separate multi-turn direct-message context loop and authorization prerequisites.](https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/briefs/images/2026-09-11/05-gemini-slack-review.png?v=20260911textbook)

**Summary:** Google made new Gemini Enterprise for Slack interactions generally available: users can mention Gemini in a channel, receive a response privately for review, and deliberately share it back; direct messages can retain multi-turn context. Admins must reinstall the Slack app and users must reauthorize it to enable the update.

**Why it matters:** The private draft is a useful human-review boundary inside a familiar collaboration tool, reducing accidental channel publication. It does not verify the answer, and retained conversational context can carry forward errors or sensitive assumptions, so review and context-reset habits remain essential.

**For George’s work:** Use this in non-technical agent workshops to demonstrate a safe delegation pattern: ask in context, review privately, revise, verify, then share. Include the admin and user authorization steps in rollout checklists.

## What to do now

**Test private-to-public review:** Pilot one low-risk channel workflow and document when to verify, revise, share, or clear context.

**Source:** [Gemini Enterprise release notes](https://docs.cloud.google.com/gemini/enterprise/docs/release-notes)

<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="2026-09-11" data-feedback-story-id="dab-story-2026-09-11-0abd52ec">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars"><button type="button" data-feedback-rating="1" title="1 — Not useful" aria-label="1 star: Not useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="2" title="2 — Slightly useful" aria-label="2 stars: Slightly useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="3" title="3 — Useful" aria-label="3 stars: Useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="4" title="4 — Very useful" aria-label="4 stars: Very useful" aria-pressed="false">☆</button><button type="button" data-feedback-rating="5" title="5 — Extremely useful" aria-label="5 stars: Extremely useful" aria-pressed="false">☆</button></div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <details class="rating-guide"><summary>What do the stars mean?</summary><p>Rate how useful this was to you.</p><ol><li>Not useful</li><li>Slightly useful</li><li>Useful</li><li>Very useful</li><li>Extremely useful</li></ol></details>
  <span class="feedback-status" aria-live="polite"></span>
</div>

---

[← Daily Brief for September 11, 2026]({{ '/briefs/2026-09-11/' | relative_url }})
