import fs from 'node:fs';
import path from 'node:path';
import {FOCUS} from './constants.mjs';
import {formatDate, listBriefDates} from './util.mjs';
import {readerFoundationFiles, renderInlineFeedback} from './reader.mjs';
import {loadQaRecords, qaAggregate, renderQaDashboard} from './quality.mjs';

function label(value) {
  return value.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function renderStory(story, briefDate) {
  return `## ${story.ordinal}. ${story.headline}

**Focus: ${FOCUS[story.focus]}**

**Date:** ${formatDate(story.event_date)}

**Topics:** ${story.topics.join(', ')}

<span class="story-data" data-story-id="${story.story_id}" data-story-url="${story.permanent_url}" hidden></span>

[Open the permanent story page]({{ '${story.permanent_url}' | relative_url }})

${story.source.evidence_type ? `**Evidence:** ${label(story.source.evidence_type)}  \n**Availability:** ${label(story.source.availability_status)}\n\n` : ''}${story.novelty && story.novelty.disposition !== 'new' ? `**What changed since last coverage:** ${story.novelty.what_changed}\n\n` : ''}![${story.image.alt}](${story.image.public_url})

**Summary:** ${story.summary}

**Why it matters:** ${story.why_it_matters}

**For George’s work:** ${story.george_implication}${story.what_to_do_now ? `

**What to do now — ${story.what_to_do_now.label}:** ${story.what_to_do_now.rationale}` : ''}

**Source:** [${story.source.title}](${story.source.url})

${renderInlineFeedback({...story, brief_date: briefDate})}`;
}

function runtime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = String(value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderVideo(name, slot, briefDate, slotId) {
  const heading = `### ${name}`;
  if (slot.status === 'empty') return `${heading}\n\n${slot.exception}`;
  return `${heading}

**Title:** [${slot.title}](${slot.url})  
**Channel:** ${slot.channel}  
**Upload date:** ${slot.upload_date ? formatDate(slot.upload_date) : 'Not available'}  
**Runtime:** ${runtime(slot.runtime_seconds)}  
**Why it is useful:** ${slot.why_useful}  
**Connection to the brief:** ${slot.connection}

${renderInlineFeedback({
    brief_date: briefDate,
    story_id: `dab-video-${briefDate}-${slotId}`,
    feedback_subject: 'video'
  })}`;
}

export function renderBody(edition) {
  return `# Daily Generative AI Brief — ${formatDate(edition.brief_date)}

**Published:** ${formatDate(edition.brief_date)}  
**Coverage period:** ${edition.coverage_period}

${edition.stories.map(story => renderStory(story, edition.brief_date)).join('\n\n')}

## Worth Watching

${renderVideo('General', edition.worth_watching.general, edition.brief_date, 'general')}

${renderVideo('Agents for Non-Technical People', edition.worth_watching.agents_non_technical_people, edition.brief_date, 'agent-skills')}

## Editorial takeaway

${edition.editorial_takeaway}`;
}

export function renderDated(edition) {
  const frontmatter = `---
layout: default
title: "Daily Generative AI Brief - ${formatDate(edition.brief_date)}"
permalink: /briefs/${edition.brief_date}/
brief_date: ${edition.brief_date}
---`;
  const body = renderBody(edition);
  const firstBreak = body.indexOf('\n\n## 1.');
  const withTopNavigation = `${body.slice(0, firstBreak)}\n\n[← Home]({{ '/' | relative_url }}) · [Briefs Archive]({{ '/briefs-archive/' | relative_url }})${body.slice(firstBreak)}`;
  return `${frontmatter}\n\n${withTopNavigation}\n\n---\n\n[← Back to Home]({{ '/' | relative_url }}) · [View Briefs Archive]({{ '/briefs-archive/' | relative_url }})\n`;
}

export function renderLatest(edition) {
  return `${renderBody(edition)}\n`;
}

export function renderIndex(edition) {
  return `---\nlayout: default\ntitle: Daily Generative AI Brief\nbrief_date: ${edition.brief_date}\n---\n\n${renderBody(edition)}\n`;
}

export function renderArchive(repoRoot, currentDate) {
  const dates = new Set(listBriefDates(repoRoot));
  dates.add(currentDate);
  const items = [...dates].sort().reverse().map(date => `- [Daily Generative AI Brief - ${formatDate(date)}]({{ '/briefs/${date}/' | relative_url }})`).join('\n');
  return `---
layout: default
title: Briefs Archive
permalink: /briefs-archive/
---

# Briefs Archive

Past editions of the Daily Generative AI Brief are listed below, newest first.

[← Back to Home]({{ '/' | relative_url }})

${items}

[← Back to Home]({{ '/' | relative_url }})
`;
}

export function renderReadme(repoRoot, currentDate) {
  const source = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const prefix = source.split(/^## Archive\s*$/m)[0].trimEnd();
  const dates = new Set(listBriefDates(repoRoot));
  dates.add(currentDate);
  const items = [...dates].sort().reverse().map(date => `- [${formatDate(date)}](briefs/${date}.md)`).join('\n');
  return `${prefix}\n\n## Archive\n\n${items}\n`;
}

export function generatedFiles(edition, repoRoot) {
  const files = new Map([
    [`briefs/${edition.brief_date}.md`, renderDated(edition)],
    ['latest.md', renderLatest(edition)],
    ['index.md', renderIndex(edition)],
    ['README.md', renderReadme(repoRoot, edition.brief_date)]
  ]);
  for (const [name, content] of readerFoundationFiles(edition, repoRoot)) files.set(name, content);
  files.set('qa/index.md', renderQaDashboard(repoRoot));
  files.set('data/qa/30-day.json', JSON.stringify(qaAggregate(loadQaRecords(repoRoot)), null, 2));
  return files;
}
