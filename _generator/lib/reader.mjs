import {readerRelease, renderBookReading} from './book-reading.mjs';
import {editionFeed} from './edition-feed.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {PUBLIC_BASE} from './constants.mjs';
import {scanHistoricalBriefs} from './historical.mjs';
import {formatDate} from './util.mjs';
import {trendFiles} from './trends.mjs';

const focusLabels = {
  technical_ai_engineering: 'Technical AI Engineering',
  applied_genai_knowledge_workers: 'Applied Generative AI for Knowledge Workers',
  agents_non_technical_people: 'Agents for Non-Technical People',
  historical_unspecified: 'Earlier edition'
};

const label = value => String(value || 'unspecified').split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
const yamlString = value => JSON.stringify(String(value || ''));
const xml = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function renderInlineFeedback(story, compact = true) {
  if (story.brief_date >= '2026-09-10') return renderStarFeedback(story);
  const className = compact ? 'story-feedback story-feedback-compact' : 'story-feedback';
  const subject = ['video', 'podcast'].includes(story.feedback_subject) ? story.feedback_subject : 'story';
  const prompt = subject === 'story' ? 'Was this useful?' : `Was this ${subject} useful?`;
  return `<div class="${className}" data-feedback-brief-date="${story.brief_date}" data-feedback-story-id="${story.story_id}">
  <span class="feedback-prompt">${prompt}</span>
  <div class="feedback-buttons" role="group" aria-label="Rate this ${subject}">
    <button type="button" data-feedback-rating="most_useful" aria-label="Most useful">Very useful</button>
    <button type="button" data-feedback-rating="useful">Useful</button>
    <button type="button" data-feedback-rating="neutral">Neutral</button>
    <button type="button" data-feedback-rating="not_useful">Not useful</button>
  </div>
  <span class="feedback-status" aria-live="polite"></span>
</div>`;
}

export function renderStarFeedback(story) {
  const meanings=['Not useful','Slightly useful','Useful','Very useful','Extremely useful'];
  return `<div class="story-feedback story-feedback-compact star-feedback" data-feedback-scale="stars" data-feedback-brief-date="${story.brief_date}" data-feedback-story-id="${story.story_id}">
  <span class="feedback-prompt">How useful was this?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate usefulness from 1 to 5 stars">${meanings.map((meaning,i)=>`<button type="button" data-feedback-rating="${i+1}" title="${i+1} — ${meaning}" aria-label="${i+1} star${i?'s':''}: ${meaning}" aria-pressed="false">☆</button>`).join('')}</div>
  <span class="feedback-privacy">Anonymous feedback. No name or email collected.</span>
  <span class="feedback-status" aria-live="polite"></span>
</div>`;
}

function canonicalStory(story, edition) {
  return {
    story_id: story.story_id,
    edition_id: edition.edition_id,
    brief_date: edition.brief_date,
    ordinal: story.ordinal,
    headline: story.headline,
    slug: story.slug,
    permanent_url: story.permanent_url,
    event_date: story.event_date,
    focus: story.focus,
    topics: story.topics,
    companies: story.companies || [story.source.organization].filter(Boolean),
    normalized_urls: [story.source.normalized_url],
    source_title: story.source.title,
    source_organization: story.source.organization,
    source_url: story.source.url,
    evidence_type: story.source.evidence_type || 'unspecified',
    availability_status: story.source.availability_status || 'unspecified',
    image: {url: story.image.public_url, alt: story.image.alt},
    summary: story.summary,
    why_it_matters: story.why_it_matters,
    george_implication: story.george_implication,
    series_implications: story.series_implications,
    what_to_do_now: story.what_to_do_now || null,
    social: story.social,
    trends: []
  };
}

function historicalStory(story) {
  return {
    ...story,
    companies: [story.source_organization].filter(Boolean),
    source_url: story.normalized_urls[0] || null,
    evidence_type: 'unspecified',
    availability_status: 'unspecified',
    social: {title: story.headline, description: story.summary || story.why_it_matters || story.headline, image_url: story.image?.url || ''},
    trends: []
  };
}

export function readerStories(repoRoot, edition, days = 30) {
  const historical = scanHistoricalBriefs(repoRoot, edition.brief_date, days).stories.map(historicalStory);
  const byEditionPosition = new Map(historical.map(story => [`${story.brief_date}:${story.ordinal}`, story]));
  for (const story of edition.stories) byEditionPosition.set(`${edition.brief_date}:${story.ordinal}`, canonicalStory(story, edition));
  const canonicalDir = path.join(repoRoot, '_data', 'editions');
  if (fs.existsSync(canonicalDir)) for (const name of fs.readdirSync(canonicalDir).filter(n => n.endsWith('.json'))) {
    const record = name === `${edition.brief_date}.json` ? edition : JSON.parse(fs.readFileSync(path.join(canonicalDir, name), 'utf8'));
    const age = (Date.parse(edition.brief_date) - Date.parse(record.brief_date)) / 86400000;
    if (age >= 0 && age < days) {
      for (const story of record.stories || []) {
        byEditionPosition.set(`${record.brief_date}:${story.ordinal}`, canonicalStory(story, record));
      }
      if (record.podcast?.status === 'included') byEditionPosition.set(`${record.brief_date}:9`, podcastStory(record.podcast, record));
      for (const [key, suffix, ordinal] of [['general','general',7],['agents_non_technical_people','agent-skills',8]]) {
        const slot=record.worth_watching?.[key];
        if(slot?.status==='included') byEditionPosition.set(`${record.brief_date}:${ordinal}`,videoStory(slot,record,suffix,ordinal));
      }
    }
  }
  if (edition.podcast?.status === 'included') byEditionPosition.set(`${edition.brief_date}:9`, podcastStory(edition.podcast, edition));
  return [...byEditionPosition.values()].sort((a, b) => b.brief_date.localeCompare(a.brief_date) || a.ordinal - b.ordinal);
}

export function renderStoryPage(story, feedbackEnabled = false) {
  const source = story.source_url || story.normalized_urls?.[0];
  const image = story.image?.url || '';
  const action = story.what_to_do_now ? `\n\n## What to do now\n\n**${story.what_to_do_now.label}:** ${story.what_to_do_now.rationale}` : '';
  return `---
layout: default
title: ${yamlString(story.social?.title || story.headline)}
description: ${yamlString(story.social?.description || story.summary || story.headline)}
image: ${yamlString(story.social?.image_url || image)}
permalink: ${story.permanent_url}
brief_date: ${story.brief_date}
story_id: ${story.story_id}
${readerRelease(story.brief_date)?'reader_release: true\n':''}---

[← Daily Brief for ${formatDate(story.brief_date)}]({{ '/briefs/${story.brief_date}/' | relative_url }})

# ${story.headline}

<span class="story-data" data-story-id="${story.story_id}" hidden></span>

**Focus:** ${focusLabels[story.focus] || label(story.focus)}  
**Date:** ${formatDate(story.event_date)}  
**Topics:** ${(story.topics || []).join(', ')}  
**Evidence:** ${label(story.evidence_type)}  
**Availability:** ${label(story.availability_status)}

${image ? `![${story.image.alt}](${image})\n\n` : ''}**Summary:** ${story.summary || 'Summary retained in the dated edition.'}

**Why it matters:** ${story.why_it_matters || 'See the dated edition for the original analysis.'}

${renderSeriesImplications(story,story.brief_date)}${renderBookReading(story.story_id,story.brief_date)}${action}

**Source:** ${source ? trackedLink(source,story.source_title || story.source_organization || 'Original source',story.story_id,story.brief_date,'source_clicks',story.content_type === 'Video') : 'Source retained in the dated edition.'}${feedbackEnabled ? `

${renderInlineFeedback(story)}` : ''}

---

[← Daily Brief for ${formatDate(story.brief_date)}]({{ '/briefs/${story.brief_date}/' | relative_url }})
`;
}

export function renderFeedbackPage(_stories, briefDate) {
  return `---
layout: default
title: Reader Ratings Have Moved
permalink: /feedback/
description: Rate each Daily Generative AI Brief story directly beneath the article.
brief_date: ${briefDate}
---

# Reader ratings are built into each daily brief

The separate Daily Reader Feedback form has been retired. Rate each item directly on the homepage, dated brief or permanent shared-story page. Editions from September 10, 2026 use five usefulness stars; earlier editions retain their original rating choices. Shared links never include the sender’s selection. This browser remembers your selection, while submissions are sent for private aggregation.

<div class="feedback-notice">
  <strong>Privacy and editorial control:</strong> The inline controls collect only the brief date, stable story ID, and selected rating. Ratings collect no name, email, cookie, persistent reader identifier or browsing history. Optional comments are sent privately to the editor and retained for 90 days; please avoid personal or confidential information. One selection per story is retained only in this browser to prevent accidental duplicate votes.
</div>

[Open today’s brief and rate its stories]({{ '/' | relative_url }})
`;
}

export function archiveIndex(stories) {
  return {
    schema_version: '1.0.0',
    generated_from: 'canonical-edition-and-30-day-story-memory',
    stories: stories.map(story => ({
      content_type: story.content_type || 'Article',
      story_id: story.story_id,
      brief_date: story.brief_date,
      event_date: story.event_date,
      headline: story.headline,
      url: story.permanent_url,
      focus: story.focus,
      topics: story.topics || [],
      companies: story.companies || [],
      evidence_type: story.evidence_type || 'unspecified',
      availability_status: story.availability_status || 'unspecified',
      trends: story.trends || [],
      summary: story.summary || ''
    }))
  };
}

export function renderArchiveSearch(stories) {
  const dates = [...new Set(stories.map(story => story.brief_date))].sort().reverse();
  return `---
layout: default
title: Brief Archive
permalink: /briefs-archive/
description: Find a complete daily edition or an individual article, video, or podcast.
---

<div class="archive-browser">
<p>Find a complete daily edition or an individual article, video, or podcast.</p>
<div class="archive-view-switch" role="tablist" aria-label="Archive view" hidden><button id="archive-items-tab" type="button" role="tab" aria-selected="true" aria-controls="archive-items-panel">Individual items</button><button id="archive-editions-tab" type="button" role="tab" aria-selected="false" aria-controls="archive-editions-panel" tabindex="-1">Complete editions</button></div>
<div class="archive-controls archive-dates" hidden><label>From <input id="archive-from" type="date"></label><label>To <input id="archive-to" type="date"></label><button id="archive-reset" type="button">Reset filters</button></div>
<p id="archive-date-error" role="alert" hidden>Choose a “To” date on or after the “From” date.</p>
<section id="archive-items-panel" role="tabpanel" aria-labelledby="archive-items-tab">
<div class="archive-controls archive-item-controls" role="search" aria-label="Daily AI Brief archive filters" hidden>
  <label>Find an item <input id="archive-query" type="search" placeholder="Topic, company, or headline"></label>
  <label>Content type <select id="archive-type"><option value="">All types</option><option value="Article">Articles</option><option value="Video">Videos</option><option value="Podcast">Podcasts</option></select></label>
  <details class="archive-advanced"><summary>More filters<span id="archive-advanced-active"></span></summary><div class="archive-controls">
    <label>Focus <select id="archive-focus"><option value="">All focus areas</option></select></label>
    <label>Evidence <select id="archive-evidence"><option value="">All evidence classes</option></select></label>
    <label>Availability <select id="archive-status"><option value="">All availability states</option></select></label>
    <label>Trend <select id="archive-trend"><option value="">All trends</option></select></label>
  </div></details>
</div>
<p id="archive-result-count" role="status" aria-live="polite">${stories.length} items</p>
<div id="archive-empty" hidden><h2>No matching items</h2><p>Try a broader date range, a different content type, or fewer filters.</p><button id="archive-clear" type="button">Clear all filters</button></div>
<div id="archive-results" class="archive-results">
${stories.map(story => `<article class="archive-story"><p class="archive-story-meta"><span class="archive-type">${story.content_type || 'Article'}</span> ${formatDate(story.brief_date)} · ${focusLabels[story.focus] || label(story.focus)}</p><h2>${trackedLink(story.permanent_url,story.headline,story.story_id,story.brief_date,'permanent_page_clicks')}</h2><p>${xml(story.summary || '')}</p><a class="archive-edition-link" href="{{ '/briefs/${story.brief_date}/' | relative_url }}">Read the complete ${formatDate(story.brief_date)} edition →</a></article>`).join('\n')}
</div>
</section>
<noscript><p>Interactive filters require JavaScript. Individual items and complete editions remain available below and above.</p></noscript>
<section id="archive-editions-panel" role="tabpanel" aria-labelledby="archive-editions-tab">
<h2 id="editions">Complete editions</h2>
<p id="archive-edition-count" role="status" aria-live="polite">${dates.length} complete editions</p>
<p>Date filters apply here. Item search and type filters apply only to Individual items.</p>
<div id="archive-editions">
${dates.map(date => `<article class="archive-story" data-archive-edition="${date}"><h3><a href="{{ '/briefs/${date}/' | relative_url }}">${formatDate(date)}</a></h3><p>Open the full daily brief, including its editorial context and media availability notes.</p><button type="button" data-archive-show-date="${date}" hidden>Show archived items from this edition</button></article>`).join('\n')}
</div>
<p id="archive-editions-empty" hidden>No editions match these dates. Reset the filters to see all editions.</p>
</section>
</div>

[← Back to Home]({{ '/' | relative_url }})
`;
}

export function renderJsonFeed(stories) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Daily Generative AI Brief',
    home_page_url: `${PUBLIC_BASE}/`,
    feed_url: `${PUBLIC_BASE}/feed.json`,
    description: 'Six AI articles, two videos, and one podcast selected daily for George Tome.',
    items: stories.map(story => ({
      id: story.story_id,
      url: absoluteItemUrl(story.permanent_url),
      title: story.headline,
      summary: story.summary || story.why_it_matters || story.headline,
      image: story.image?.url || undefined,
      date_published: `${story.brief_date}T13:00:00-05:00`,
      tags: [...new Set([...(story.topics || []), ...(story.companies || [])])]
    }))
  }, null, 2);
}

export function renderAtomFeed(stories, updatedAt) {
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Daily Generative AI Brief</title>
  <id>${PUBLIC_BASE}/</id>
  <link href="${PUBLIC_BASE}/feed.xml" rel="self" />
  <link href="${PUBLIC_BASE}/" />
  <updated>${xml(updatedAt)}</updated>
${stories.map(story => `  <entry>
    <title>${xml(story.headline)}</title>
    <id>${xml(story.story_id)}</id>
    <link href="${xml(absoluteItemUrl(story.permanent_url))}" />
    <updated>${story.brief_date}T18:00:00Z</updated>
    <summary>${xml(story.summary || story.why_it_matters || story.headline)}</summary>
  </entry>`).join('\n')}
</feed>`;
}

export function readerFoundationFiles(edition, repoRoot) {
  const baseStories = readerStories(repoRoot, edition);
  const trends = trendFiles(baseStories, edition, repoRoot);
  const stories = trends.tagged;
  const editionDir = path.join(repoRoot, '_data', 'editions');
  const feedbackDates = new Set(fs.existsSync(editionDir) ? fs.readdirSync(editionDir).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)) : [edition.brief_date]);
  const files = new Map();
  for (const story of stories) {
    if (story.content_type === 'Video') {
      files.set(`videos/${story.brief_date}/${story.slug}.md`,renderStoryPage(story, true));
    } else if (story.content_type === 'Podcast') {
      const header = renderStoryPage(story, false).split('---\n\n')[0] + '---\n\n';
      files.set(`podcasts/${story.brief_date}/${story.slug}.md`, header + `[← Home]({{ '/' | relative_url }}) · [Daily Brief]({{ '/briefs/${story.brief_date}/' | relative_url }})\n\n# ${story.headline}\n\n` + renderPodcast(story.podcast, story.brief_date).replace(/^## Worth Listening — Podcast\n\n### 9\. [^\n]+\n\n/, '') + `\n\n[← Back to Home]({{ '/' | relative_url }})\n`);
    } else files.set(`stories/${story.brief_date}/${story.slug}.md`, renderStoryPage(story, feedbackDates.has(story.brief_date)));
  }
  files.set('archive.md', renderArchiveSearch(stories));
  const index=archiveIndex(stories);
  files.set('data/archive-index.json', JSON.stringify(index, null, 2));
  files.set('daily-feed.xml', editionFeed(repoRoot, edition.brief_date));
  files.set('feed.json', renderJsonFeed(stories));
  files.set('feed.xml', renderAtomFeed(stories, edition.published_at));
  files.set('feedback/index.md', renderFeedbackPage(stories, edition.brief_date));
  for (const [name, content] of trends.files) files.set(name, content);
  return files;
}

export function validateFeeds(atom, json) {
  const errors = [];
  if (!atom.startsWith('<?xml version="1.0"') || !atom.includes('<feed xmlns="http://www.w3.org/2005/Atom">') || !atom.includes('</feed>')) errors.push('Atom feed is not a complete Atom document');
  try {
    const parsed = JSON.parse(json);
    if (parsed.version !== 'https://jsonfeed.org/version/1.1') errors.push('JSON Feed version is invalid');
    if (!Array.isArray(parsed.items) || !parsed.items.length) errors.push('JSON Feed has no items');
    if (parsed.items?.some(item => !item.id || !item.url || !item.title)) errors.push('JSON Feed item is missing an ID, URL, or title');
  } catch (error) { errors.push(`JSON Feed is invalid: ${error.message}`); }
  return errors;
}

export function podcastStory(slot, edition) {
  return {
    story_id: slot.item_id, edition_id: edition.edition_id, brief_date: edition.brief_date,
    ordinal: 9, content_type: 'Podcast', feedback_subject: 'podcast', headline: slot.title,
    slug: slot.permanent_url.split('/').filter(Boolean).at(-1), permanent_url: slot.permanent_url,
    event_date: slot.publication_date, focus: slot.focus, topics: slot.topics,
    companies: [slot.show], normalized_urls: [slot.url], source_title: slot.show,
    source_organization: slot.show, source_url: slot.url, evidence_type: 'practitioner_analysis',
    availability_status: 'not_applicable', summary: slot.summary, why_it_matters: slot.why_useful,
    george_implication: slot.george_implication, series_implications: slot.series_implications, trends: [], podcast: slot
  };
}

export function renderPodcast(slot, briefDate) {
  if (!slot) return '';
  if (slot.status === 'empty') return `## Worth Listening — Podcast\n\n**Slot 9:** ${slot.exception}`;
  return `## Worth Listening — Podcast

### 9. ${slot.title}

<span class="podcast-data" data-podcast-id="${slot.item_id}" data-podcast-title="${xml(slot.title)}" data-podcast-url="${slot.permanent_url}" hidden></span>

${trackedLink(slot.permanent_url,'Open the permanent podcast page',slot.item_id,briefDate,'permanent_page_clicks')}

**Show:** ${slot.show}  
**Host / guest:** ${slot.host}  
**Focus:** ${focusLabels[slot.focus]}  
**Date:** ${formatDate(slot.publication_date)}  
**Duration:** ${slot.runtime_seconds === null ? 'Not independently verified' : `${Math.floor(slot.runtime_seconds / 60)}:${String(slot.runtime_seconds % 60).padStart(2,'0')}`} · No episode time limit  
**Topics:** ${slot.topics.join(', ')}

**Summary:** ${slot.summary}

**Why it matters:** ${slot.why_useful}

**Connection to the brief:** ${slot.connection}

${renderSeriesImplications(slot,briefDate)}

**Coverage:** ${slot.coverage_note}

**Evidence:** Practitioner analysis. ${slot.verification_note}

**Listen / watch:** ${slot.platforms.map(p => trackedLink(p.url,p.name,slot.item_id,briefDate,'source_clicks',true)).join(' · ')}

${renderInlineFeedback({brief_date:briefDate,story_id:slot.item_id,feedback_subject:'podcast'})}${renderBookReading(slot.item_id,briefDate)}`;
}

export const absoluteItemUrl = url => /^https:\/\//.test(url) ? url : `${PUBLIC_BASE}${url}`;
export function trackedLink(url,title,id,date,action,newTab=false) {
  const href=/^https:\/\//.test(url)?xml(url):`{{ '${url}' | relative_url }}`;
  return `<a href="${href}" data-item-id="${xml(id)}" data-edition-date="${xml(date)}" data-action="${action}"${newTab?' target="_blank" rel="noopener noreferrer"':''}>${xml(title)}</a>`;
}
export function renderSeriesImplications(item, briefDate = item.brief_date) {
  const rows=item.series_implications || [];
  const metadata=`<span class="story-editorial-note" data-george-implication="${xml(item.george_implication || '')}" hidden></span>`;
  if(!rows.length || readerRelease(briefDate))return metadata;
  const entry=x=>`<p><strong>${xml(x.book_title)}</strong> — Proposed update: ${xml(x.proposed_change)} ${xml(x.evidence_reason)} Teaching asset: ${xml(x.teaching_asset)}</p>`;
  return `${metadata}\n\n### Evolving the Generative AI Professional Series\n\n${rows.slice(0,2).map(entry).join('\n')}${rows.length>2?`<details><summary>More proposed book updates</summary>${rows.slice(2).map(entry).join('')}</details>`:''}`;
}
export function videoStory(slot, edition, suffix, ordinal) {
 return {story_id:`dab-video-${edition.brief_date}-${suffix}`,edition_id:edition.edition_id,brief_date:edition.brief_date,
 ordinal,content_type:'Video',feedback_subject:'video',headline:slot.title,slug:suffix,
 permanent_url:`/videos/${edition.brief_date}/${suffix}/`,event_date:slot.upload_date || edition.brief_date,
 focus:ordinal===7?'general_video':'agents_non_technical_people',topics:[],companies:[slot.channel],source_url:slot.url,
 source_title:slot.channel,source_organization:slot.channel,evidence_type:'practitioner_analysis',availability_status:'not_applicable',
 summary:slot.why_useful,why_it_matters:slot.connection,series_implications:slot.series_implications,trends:[],runtime_seconds:slot.runtime_seconds};
}
