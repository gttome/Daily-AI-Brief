import {renderReadingSupport,validateReadingSupport} from './reading-support.mjs';
import {readerRelease, readerAddition, renderBookReading, renderSeriesInvitation, renderEditionOverview, validateBookReading} from './book-reading.mjs';
import {watchlistPreview} from './watchlist.mjs';
import {publicAnalyticsEvidence} from './analytics.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {FOCUS} from './constants.mjs';
import {formatDate, listBriefDates} from './util.mjs';
import {readerFoundationFiles, renderInlineFeedback, renderPodcast, renderSeriesImplications, trackedLink} from './reader.mjs';
import {loadQaRecords, qaAggregate, renderQaDashboard} from './quality.mjs';

const SERIES_SEPARATION_DATE='2026-09-16';
const EMPTY_MEDIA_COPY_EFFECTIVE_DATE='2026-09-17';
const EMPTY_MEDIA_PUBLIC_COPY=Object.freeze({
  video:'No video met today’s editorial quality standards.',
  podcast:'No podcast met today’s editorial quality standards.'
});

function label(value) {
  return value.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function readerSafeItem(item) {
  if (!item || typeof item !== 'object') return item;
  const copy = structuredClone(item);
  delete copy.george_implication;
  delete copy.series_implications;
  return copy;
}

function readerSafeEdition(edition) {
  const copy = structuredClone(edition);
  copy.stories = (copy.stories || []).map(readerSafeItem);
  for (const key of ['general','agents_non_technical_people']) if (copy.worth_watching?.[key]) copy.worth_watching[key] = readerSafeItem(copy.worth_watching[key]);
  if (copy.podcast) copy.podcast = readerSafeItem(copy.podcast);
  return copy;
}

function publicPodcast(slot, briefDate) {
  if (!slot || slot.status !== 'empty' || briefDate<EMPTY_MEDIA_COPY_EFFECTIVE_DATE) return slot;
  return {...slot, exception: EMPTY_MEDIA_PUBLIC_COPY.podcast};
}

function stripEditorOnlyMarkup(content) {
  return String(content || '').replace(/<span class="story-editorial-note" data-george-implication="[^"]*" hidden><\/span>/g, '');
}

function currentEditionReaderPath(name,date){
  return name.startsWith(`stories/${date}/`)||name.startsWith(`videos/${date}/`)||name.startsWith(`podcasts/${date}/`);
}

function renderStory(story, briefDate) {
  const separated=briefDate>=SERIES_SEPARATION_DATE;
  return `${readerRelease(briefDate)?`<span id="reading-${story.story_id}"></span>\n\n`:""}## ${story.ordinal}. ${story.headline}

${renderReadingSupport(story,story.story_id,briefDate)}

**Focus: ${FOCUS[story.focus]}**

**Date:** ${formatDate(story.event_date)}

**Topics:** ${story.topics.join(', ')}

<span class="story-data" data-story-id="${story.story_id}" data-story-url="${story.permanent_url}" hidden></span>

${trackedLink(story.permanent_url,'Open the permanent story page',story.story_id,briefDate,'permanent_page_clicks')}

${story.source.evidence_type ? `**Evidence:** ${label(story.source.evidence_type)}  \n**Availability:** ${label(story.source.availability_status)}\n\n` : ''}${story.novelty && story.novelty.disposition !== 'new' ? `**What changed since last coverage:** ${story.novelty.what_changed}\n\n` : ''}![${story.image.alt}](${story.image.public_url})

**Summary:** ${story.summary}

**Why it matters:** ${story.why_it_matters}

${separated?'':renderSeriesImplications(story, briefDate)}${renderBookReading(story.story_id, briefDate)}${story.what_to_do_now ? `

**What to do now — ${story.what_to_do_now.label}:** ${story.what_to_do_now.rationale}` : ''}

**Source:** ${trackedLink(story.source.url,story.source.title,story.story_id,briefDate,'source_clicks')}

${renderInlineFeedback({...story, brief_date: briefDate})}`;
}

function runtime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = String(value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderVideo(name, slot, briefDate, slotId) {
  const ordinal = slotId === 'general' ? 7 : 8;
  const anchor = slotId === 'general' ? 'general' : 'agents-for-non-technical-people';
  const heading = `${readerRelease(briefDate)?`<span id="${anchor}"></span>\n\n`:''}## ${ordinal}. ${name}`;
  if (slot.status === 'empty') return `${heading}\n\n${briefDate>=EMPTY_MEDIA_COPY_EFFECTIVE_DATE?EMPTY_MEDIA_PUBLIC_COPY.video:slot.exception}`;
  if(briefDate<SERIES_SEPARATION_DATE)return `${heading}

### ${slot.title}

${renderReadingSupport(slot,`dab-video-${briefDate}-${slotId}`,briefDate,"Video")}

${trackedLink(`/videos/${briefDate}/${slotId}/`,'Open the permanent video page',`dab-video-${briefDate}-${slotId}`,briefDate,'permanent_page_clicks')}  
**Channel:** ${slot.channel}  
**Date:** ${slot.upload_date ? formatDate(slot.upload_date) : 'Not available'}  
**Runtime:** ${runtime(slot.runtime_seconds)}${slot.runtime_seconds>600 && briefDate>='2026-09-11'?' · Longer selection today: no suitable video of 10 minutes or less was found.':''}  
**Format:** Video

**Summary:** ${slot.why_useful}

**Why it matters:** ${slot.connection}

${renderSeriesImplications(slot, briefDate)}${slot.series_implications?.length ? '\n\n' : ''}**Source:** ${trackedLink(slot.url, /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(new URL(slot.url).hostname) ? 'Watch on YouTube' : `Watch on ${slot.channel || new URL(slot.url).hostname}`, `dab-video-${briefDate}-${slotId}`,briefDate,'source_clicks',true)}

${renderInlineFeedback({
    brief_date: briefDate,
    story_id: `dab-video-${briefDate}-${slotId}`,
    feedback_subject: 'video'
  })}${renderBookReading(`dab-video-${briefDate}-${slotId}`,briefDate)}`;
  return `${heading}

### ${slot.title}

${renderReadingSupport(slot,`dab-video-${briefDate}-${slotId}`,briefDate,"Video")}

${trackedLink(`/videos/${briefDate}/${slotId}/`,'Open the permanent video page',`dab-video-${briefDate}-${slotId}`,briefDate,'permanent_page_clicks')}  
**Channel:** ${slot.channel}  
**Date:** ${slot.upload_date ? formatDate(slot.upload_date) : 'Not available'}  
**Runtime:** ${runtime(slot.runtime_seconds)}${slot.runtime_seconds>600?' · Longer selection today: no suitable video of 10 minutes or less was found.':''}  
**Format:** Video

**Summary:** ${slot.why_useful}

**Why it matters:** ${slot.connection}

${renderBookReading(`dab-video-${briefDate}-${slotId}`,briefDate)}

**Source:** ${trackedLink(slot.url, /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(new URL(slot.url).hostname) ? 'Watch on YouTube' : `Watch on ${slot.channel || new URL(slot.url).hostname}`, `dab-video-${briefDate}-${slotId}`,briefDate,'source_clicks',true)}

${renderInlineFeedback({
    brief_date: briefDate,
    story_id: `dab-video-${briefDate}-${slotId}`,
    feedback_subject: 'video'
  })}`;
}

export function renderBody(edition) {
  validateBookReading(edition);
  validateReadingSupport(edition);
  const separated=edition.brief_date>=SERIES_SEPARATION_DATE;
  const podcastSource=separated&&edition.podcast?readerSafeItem(edition.podcast):edition.podcast;
  const podcast=publicPodcast(podcastSource,edition.brief_date);
  const podcastBlock=podcast?(separated?stripEditorOnlyMarkup(renderPodcast(podcast,edition.brief_date)):renderPodcast(podcast,edition.brief_date))+'\n\n':'';
  return `# Daily Generative AI Brief — ${formatDate(edition.brief_date)}

**Published:** ${formatDate(edition.brief_date)}  
**Coverage period:** ${edition.coverage_period}

${readerRelease(edition.brief_date)?renderEditionOverview(edition)+'\n\n':watchlistPreview(edition.brief_date)}${edition.stories.map(story => renderStory(story, edition.brief_date)).join('\n\n')}

## Worth Watching

${renderVideo('General', edition.worth_watching.general, edition.brief_date, 'general')}

${renderVideo('Agents for Non-Technical People', edition.worth_watching.agents_non_technical_people, edition.brief_date, 'agent-skills')}

${podcastBlock}${readerRelease(edition.brief_date)?readerAddition(watchlistPreview(edition.brief_date))+'\n\n':''}## Editorial takeaway

${edition.editorial_takeaway}

${renderSeriesInvitation(edition.brief_date)}`;
}

export function renderDated(edition) {
  const frontmatter = `---
layout: default
title: "Daily Generative AI Brief - ${formatDate(edition.brief_date)}"
permalink: /briefs/${edition.brief_date}/
brief_date: ${edition.brief_date}
${readerRelease(edition.brief_date)?'reader_release: true\n':''}---`;
  const body = renderBody(edition);
  const firstBreak = body.indexOf('\n\n## 1.');
  const withTopNavigation = `${body.slice(0, firstBreak)}\n\n[← Home]({{ '/' | relative_url }}) · [Briefs Archive]({{ '/briefs-archive/' | relative_url }})${body.slice(firstBreak)}`;
  return `${frontmatter}\n\n${withTopNavigation}\n\n---\n\n[← Back to Home]({{ '/' | relative_url }}) · [View Briefs Archive]({{ '/briefs-archive/' | relative_url }})\n`;
}

export function renderLatest(edition) {
  return `${renderBody(edition)}\n`;
}

export function renderIndex(edition) {
  return `---\nlayout: default\ntitle: Daily Generative AI Brief\nbrief_date: ${edition.brief_date}\n${readerRelease(edition.brief_date)?'reader_release: true\n':''}---\n\n${renderBody(edition)}\n\n${renderSubscriptionCard()}\n`;
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
  const separated=edition.brief_date>=SERIES_SEPARATION_DATE;
  const foundationEdition=separated?readerSafeEdition(edition):edition;
  for (const [name, content] of readerFoundationFiles(foundationEdition, repoRoot)) files.set(name,separated&&currentEditionReaderPath(name,edition.brief_date)?stripEditorOnlyMarkup(content):content);
  const analyticsPath=`_records/analytics/${edition.brief_date}.json`;
  if(!fs.existsSync(path.join(repoRoot,analyticsPath)))files.set(analyticsPath,JSON.stringify(publicAnalyticsEvidence(edition),null,2));
  files.set('data/operations/current-edition.json', JSON.stringify({schema_version:'1.0.0',edition_id:edition.edition_id,brief_date:edition.brief_date,completion_path:'_records/publication/'+edition.brief_date+'/completion.json'},null,2));
  files.set('qa/index.md', renderQaDashboard(repoRoot));
  files.set('data/qa/30-day.json', JSON.stringify(qaAggregate(loadQaRecords(repoRoot)), null, 2));
  return files;
}

export function renderSubscriptionCard(){return fs.readFileSync(new URL('../../_includes/subscription-guidance.html',import.meta.url),'utf8');}
