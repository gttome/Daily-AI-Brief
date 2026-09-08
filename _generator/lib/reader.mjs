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
  const className = compact ? 'story-feedback story-feedback-compact' : 'story-feedback';
  return `<div class="${className}" data-feedback-brief-date="${story.brief_date}" data-feedback-story-id="${story.story_id}">
  <span class="feedback-prompt">Was this useful?</span>
  <div class="feedback-buttons" role="group" aria-label="Rate this story">
    <button type="button" data-feedback-rating="most_useful" aria-label="Most useful">Very useful</button>
    <button type="button" data-feedback-rating="useful">Useful</button>
    <button type="button" data-feedback-rating="neutral">Neutral</button>
    <button type="button" data-feedback-rating="not_useful">Not useful</button>
  </div>
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
---

[← Daily Brief for ${formatDate(story.brief_date)}]({{ '/briefs/${story.brief_date}/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})

# ${story.headline}

<span class="story-data" data-story-id="${story.story_id}" hidden></span>

**Focus:** ${focusLabels[story.focus] || label(story.focus)}  
**Date:** ${formatDate(story.event_date)}  
**Topics:** ${(story.topics || []).join(', ')}  
**Evidence:** ${label(story.evidence_type)}  
**Availability:** ${label(story.availability_status)}

${image ? `![${story.image.alt}](${image})\n\n` : ''}**Summary:** ${story.summary || 'Summary retained in the dated edition.'}

**Why it matters:** ${story.why_it_matters || 'See the dated edition for the original analysis.'}

**For George’s work:** ${story.george_implication || 'See the dated edition for the original implication.'}${action}

**Source:** ${source ? `[${story.source_title || story.source_organization || 'Original source'}](${source})` : 'Source retained in the dated edition.'}${feedbackEnabled ? `

${renderInlineFeedback(story)}` : ''}

---

[← Daily Brief for ${formatDate(story.brief_date)}]({{ '/briefs/${story.brief_date}/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})
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

# Reader ratings are now built into every story

The separate Daily Reader Feedback form has been retired. Each story now has its own four-button rating scale directly beneath the article, so you can read and rate in one place.

<div class="feedback-notice">
  <strong>Privacy and editorial control:</strong> The inline controls collect only the brief date, stable story ID, and selected rating. No name, email, cookie, persistent reader identifier, free text, or browsing history is collected. One selection per story is retained only in this browser to prevent accidental duplicate votes.
</div>

[Open today’s brief and rate its stories]({{ '/' | relative_url }}) · [Search the Archive]({{ '/briefs-archive/' | relative_url }})
`;
}

export function archiveIndex(stories) {
  return {
    schema_version: '1.0.0',
    generated_from: 'canonical-edition-and-30-day-story-memory',
    stories: stories.map(story => ({
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
  const editions = [...new Set(stories.map(story => story.brief_date))].length;
  return `---
layout: default
title: Briefs Archive
permalink: /briefs-archive/
description: Search and filter the Daily Generative AI Brief archive.
---

# Search the Daily AI Brief Archive

Search ${stories.length} stories across ${editions} recent editions. Existing dated-brief URLs remain unchanged.

<div class="archive-controls" role="search" aria-label="Daily AI Brief archive filters">
  <label>Search <input id="archive-query" type="search" placeholder="Company, topic, headline, or phrase"></label>
  <label>From <input id="archive-from" type="date"></label>
  <label>To <input id="archive-to" type="date"></label>
  <label>Focus <select id="archive-focus"><option value="">All focus areas</option></select></label>
  <label>Evidence <select id="archive-evidence"><option value="">All evidence classes</option></select></label>
  <label>Status <select id="archive-status"><option value="">All availability states</option></select></label>
  <label>Trend <select id="archive-trend"><option value="">All trends</option></select></label>
  <button id="archive-reset" type="button">Reset</button>
</div>

<p id="archive-result-count" role="status" aria-live="polite">${stories.length} stories</p>

<div id="archive-results" class="archive-results">
${stories.map(story => `<article class="archive-story"><p class="archive-story-meta">${formatDate(story.brief_date)} · ${focusLabels[story.focus] || label(story.focus)}</p><h2><a href="{{ '${story.permanent_url}' | relative_url }}">${xml(story.headline)}</a></h2><p>${xml(story.summary || '')}</p></article>`).join('\n')}
</div>

<noscript><p>Search and filters require JavaScript. The complete chronological archive remains listed below.</p></noscript>

## Editions

${[...new Set(stories.map(story => story.brief_date))].map(date => `- [Daily Generative AI Brief - ${formatDate(date)}]({{ '/briefs/${date}/' | relative_url }})`).join('\n')}

[← Back to Home]({{ '/' | relative_url }})
`;
}

export function renderJsonFeed(stories) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Daily Generative AI Brief',
    home_page_url: `${PUBLIC_BASE}/`,
    feed_url: `${PUBLIC_BASE}/feed.json`,
    description: 'Six worthwhile Generative AI developments selected daily for George Tome.',
    items: stories.map(story => ({
      id: story.story_id,
      url: `${PUBLIC_BASE}${story.permanent_url}`,
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
    <link href="${PUBLIC_BASE}${xml(story.permanent_url)}" />
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
  for (const story of stories) files.set(`stories/${story.brief_date}/${story.slug}.md`, renderStoryPage(story, feedbackDates.has(story.brief_date)));
  files.set('archive.md', renderArchiveSearch(stories));
  files.set('data/archive-index.json', JSON.stringify(archiveIndex(stories), null, 2));
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
