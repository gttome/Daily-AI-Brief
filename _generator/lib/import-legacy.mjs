import fs from 'node:fs';
import path from 'node:path';
import {FOCUS, PUBLIC_BASE} from './constants.mjs';
import {formatDate, normalizeUrl, slugify, stableSuffix} from './util.mjs';

const FOCUS_KEY = Object.fromEntries(Object.entries(FOCUS).map(([key, value]) => [value, key]));

function capture(text, pattern, label, optional = false) {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value && !optional) throw new Error(`Unable to parse ${label}`);
  return value || null;
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n+/, '');
}

function storyBlocks(markdown) {
  const positions = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  return positions.map((match, index) => ({
    ordinal: Number(match[1]),
    headline: match[2].trim(),
    content: markdown.slice(match.index + match[0].length, positions[index + 1]?.index ?? markdown.indexOf('\n## Worth Watching', match.index)).trim()
  }));
}

function imageDimensions(repoRoot, imagePath) {
  try {
    const source = fs.readFileSync(path.join(repoRoot, imagePath), 'utf8');
    const viewBox = source.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)["']/i);
    if (viewBox) return {width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2]))};
    const width = source.match(/<svg[^>]+width=["']([\d.]+)/i)?.[1];
    const height = source.match(/<svg[^>]+height=["']([\d.]+)/i)?.[1];
    if (width && height) return {width: Math.round(Number(width)), height: Math.round(Number(height))};
  } catch {}
  return {width: 1200, height: 630};
}

function sourceOrganization(label, url) {
  const named = label.split(/\s+[—–-]\s+/)[0]?.trim();
  if (named && named.length <= 80) return named;
  return new URL(url).hostname.replace(/^www\./, '');
}

function parseStory(block, briefDate, repoRoot) {
  const focusLabel = capture(block.content, /\*\*Focus:\s*([^*]+)\*\*/i, `story ${block.ordinal} focus`);
  const eventLabel = capture(block.content, /\*\*Date:\*\*\s*([^\n]+)/i, `story ${block.ordinal} date`);
  const eventDate = new Date(`${eventLabel} UTC`).toISOString().slice(0, 10);
  const topics = capture(block.content, /\*\*Topics:\*\*\s*([^\n]+)/i, `story ${block.ordinal} topics`).split(',').map(item => item.trim()).filter(Boolean);
  const image = block.content.match(/!\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
  if (!image) throw new Error(`Unable to parse story ${block.ordinal} image`);
  const imageUrl = image[2];
  const imagePath = imageUrl.match(/raw\.githubusercontent\.com\/gttome\/Daily-AI-Brief\/[^/]+\/(briefs\/images\/[^?]+)/)?.[1];
  if (!imagePath) throw new Error(`Story ${block.ordinal} image must be a stable repository asset`);
  const source = block.content.match(/\*\*Source:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
  if (!source) throw new Error(`Unable to parse story ${block.ordinal} source`);
  const normalized = normalizeUrl(source[2]);
  const slug = slugify(block.headline);
  const dimensions = imageDimensions(repoRoot, imagePath);
  return {
    story_id: `dab-story-${briefDate}-${stableSuffix(`${briefDate}|${normalized}`)}`,
    ordinal: block.ordinal,
    slug,
    permanent_url: `/stories/${briefDate}/${slug}/`,
    focus: FOCUS_KEY[focusLabel],
    headline: block.headline,
    event_date: eventDate,
    topics,
    companies: [],
    image: {
      path: imagePath,
      public_url: imageUrl,
      alt: image[1].trim(),
      width: dimensions.width,
      height: dimensions.height,
      kind: 'editorial_explainer',
      cache_key: new URL(imageUrl).searchParams.get('v')
    },
    summary: capture(block.content, /\*\*Summary:\*\*\s*([\s\S]*?)(?=\n\n\*\*Why it matters:\*\*)/i, `story ${block.ordinal} summary`),
    why_it_matters: capture(block.content, /\*\*Why it matters:\*\*\s*([\s\S]*?)(?=\n\n\*\*For George(?:’s|'s) work:\*\*)/i, `story ${block.ordinal} why it matters`),
    george_implication: capture(block.content, /\*\*For George(?:’s|'s) work:\*\*\s*([\s\S]*?)(?=\n\n\*\*Source:\*\*)/i, `story ${block.ordinal} George implication`),
    source: {
      title: source[1].trim(),
      organization: sourceOrganization(source[1], source[2]),
      url: source[2],
      normalized_url: normalized,
      publication_date: eventDate
    },
    social: {
      title: block.headline,
      description: capture(block.content, /\*\*Summary:\*\*\s*([\s\S]*?)(?=\n\n\*\*Why it matters:\*\*)/i, `story ${block.ordinal} social summary`).replace(/[*_`]/g, '').slice(0, 200),
      image_url: imageUrl
    }
  };
}

function parseVideoSlot(section, name) {
  const normalizedSection = section.trim().replace(/^###.*\n+/, '');
  const link = section.match(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/[^)]+)\)/i);
  if (!link) return {status: 'empty', exception: normalizedSection || `No qualifying ${name} video was available.`};
  const runtime = section.match(/\b(\d{1,2}):(\d{2})\b/);
  return {
    status: 'included',
    title: link[1],
    channel: capture(section, /\*\*(?:Presenter|Channel):\*\*\s*([^\n]+)/i, `${name} channel`, true) || 'Unknown',
    upload_date: capture(section, /\*\*Upload date:\*\*\s*([^\n]+)/i, `${name} upload date`, true) || null,
    runtime_seconds: runtime ? Number(runtime[1]) * 60 + Number(runtime[2]) : null,
    why_useful: capture(section, /\*\*Why it is useful:\*\*\s*([^\n]+)/i, `${name} why useful`, true) || 'See the editorial note.',
    connection: capture(section, /\*\*Connection to the brief:\*\*\s*([^\n]+)/i, `${name} connection`, true) || 'Related to this edition.',
    url: link[2]
  };
}

function parseWorthWatching(markdown) {
  const section = markdown.split('\n## Worth Watching\n')[1]?.split('\n## Editorial takeaway\n')[0] || '';
  const general = section.split(/^### Agents for Non-Technical People\s*$/m)[0] || '';
  const agents = section.split(/^### Agents for Non-Technical People\s*$/m)[1] || '';
  return {
    general: parseVideoSlot(general, 'general'),
    agents_non_technical_people: parseVideoSlot(agents, 'agents')
  };
}

export function importLegacyMarkdown(markdown, repoRoot, sourceCommit = null) {
  const body = stripFrontmatter(markdown);
  const titleLine = capture(body, /^# Daily Generative AI Brief\s+—\s+(.+)$/m, 'brief title date');
  const briefDate = new Date(`${titleLine} UTC`).toISOString().slice(0, 10);
  const blocks = storyBlocks(body);
  const editorialTakeaway = capture(body, /## Editorial takeaway\s*\n+([\s\S]*?)(?=\n---|\n\[← Back to Home\]|$)/i, 'editorial takeaway');
  return {
    schema_version: '1.0.0',
    policy_profile: 'publication_reliability_v1',
    edition_id: `dab-edition-${briefDate}`,
    brief_date: briefDate,
    timezone: 'America/Chicago',
    title: `Daily Generative AI Brief - ${formatDate(briefDate)}`,
    published_at: `${briefDate}T12:00:00Z`,
    coverage_period: capture(body, /\*\*Coverage period:\*\*\s*([^\n]+)/i, 'coverage period'),
    status: 'validated',
    stories: blocks.map(block => parseStory(block, briefDate, repoRoot)),
    worth_watching: parseWorthWatching(body),
    editorial_takeaway: editorialTakeaway,
    provenance: {
      created_by: 'legacy importer v1.0.0',
      created_at: new Date().toISOString(),
      source_commit: sourceCommit
    }
  };
}

export function importLegacyFile(filePath, repoRoot, sourceCommit = null) {
  return importLegacyMarkdown(fs.readFileSync(filePath, 'utf8'), repoRoot, sourceCommit);
}

export function semanticEditionView(edition) {
  return {
    brief_date: edition.brief_date,
    coverage_period: edition.coverage_period,
    stories: edition.stories.map(story => ({
      ordinal: story.ordinal,
      focus: story.focus,
      headline: story.headline,
      event_date: story.event_date,
      topics: story.topics,
      image_url: story.image.public_url,
      summary: story.summary,
      why_it_matters: story.why_it_matters,
      george_implication: story.george_implication,
      source_url: story.source.url
    })),
    worth_watching: edition.worth_watching,
    editorial_takeaway: edition.editorial_takeaway
  };
}
