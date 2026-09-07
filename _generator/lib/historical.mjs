import fs from 'node:fs';
import path from 'node:path';
import {normalizeUrl, slugify, stableSuffix} from './util.mjs';

const FOCUS_LABELS = new Map([
  ['technical ai engineering', 'technical_ai_engineering'],
  ['applied generative ai for knowledge workers', 'applied_genai_knowledge_workers'],
  ['agents for non-technical people', 'agents_non_technical_people']
]);

const STOP_WORDS = new Set('a an and are as at be by for from has have how in into is it its of on or our that the their this to turns use uses using with now new adds brings gives lets makes shows'.split(' '));

export function conceptTokens(headline) {
  return [...new Set(headline.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(token => token.length > 2 && !STOP_WORDS.has(token)))].sort();
}

function isoDate(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(`${value.replace(/\s+/g, ' ').trim()} UTC`);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString().slice(0, 10);
}

function linksFrom(block) {
  const marker = block.search(/\*\*Sources?:\*\*/i);
  const region = marker >= 0 ? block.slice(marker) : block;
  const found = [];
  for (const match of region.matchAll(/(?<!!)\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g)) found.push(match[1]);
  for (const match of region.matchAll(/(^|[\s:])((?:https?:\/\/)[^\s)>]+)/gm)) found.push(match[2].replace(/[.,;]+$/, ''));
  if (!found.length && marker < 0) {
    for (const match of block.matchAll(/(?<!!)\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g)) found.push(match[1]);
  }
  return [...new Set(found.filter(url => !url.includes('raw.githubusercontent.com/gttome/Daily-AI-Brief')).map(normalizeUrl))];
}

function textField(block, labels) {
  const alternatives = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = block.match(new RegExp(`\\*\\*(?:${alternatives}):\\*\\*\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*|\\n\\n\\[|\\n\\n---|$)`, 'i'));
  return match?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function organizationFor(url) {
  if (!url) return null;
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (/openai\.com$/.test(host)) return 'OpenAI';
  if (/(anthropic\.com|claude\.com)$/.test(host)) return 'Anthropic';
  if (/(github\.com|github\.blog)$/.test(host)) return 'GitHub';
  if (/(google\.com|googleblog\.com)$/.test(host)) return 'Google';
  if (/microsoft\.com$/.test(host)) return 'Microsoft';
  if (/nvidia\.com$/.test(host)) return 'NVIDIA';
  if (/huggingface\.co$/.test(host)) return 'Hugging Face';
  if (/arxiv\.org$/.test(host)) return 'arXiv';
  return host;
}

export function parseHistoricalBrief(markdown, briefDate) {
  const headings = [...markdown.matchAll(/^## (\d+)\.\s+(.+)$/gm)];
  return headings.map((heading, index) => {
    const ordinal = Number(heading[1]);
    const headline = heading[2].trim();
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.search(/^## Worth Watching/m);
    const block = markdown.slice(start, end > start ? end : undefined);
    const focusText = block.match(/\*\*Focus:\s*([^*]+)\*\*/i)?.[1]?.trim().toLowerCase();
    const focus = FOCUS_LABELS.get(focusText) || (headings.length === 6 ? (ordinal <= 2 ? 'technical_ai_engineering' : ordinal <= 4 ? 'applied_genai_knowledge_workers' : 'agents_non_technical_people') : 'historical_unspecified');
    const eventDate = isoDate(block.match(/\*\*Date:\*\*\s*([^\n]+)/i)?.[1]?.replace(/\s{2,}$/, ''), briefDate);
    const topics = block.match(/\*\*Topics:\*\*\s*([^\n]+)/i)?.[1]?.split(/[;,]/).map(item => item.trim()).filter(Boolean) || [];
    const normalizedUrls = linksFrom(block);
    const identity = `${normalizedUrls[0] || 'no-source'}|${headline.toLowerCase()}`;
    const slug = slugify(headline);
    const image = block.match(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/);
    const relativeImage = block.match(/!\[([^\]]*)\]\(\{\{\s*['"](\/briefs\/images\/[^'"]+)['"]\s*\|\s*relative_url\s*\}\}\)/);
    const imageUrl = image?.[2] || (relativeImage ? `https://gttome.github.io/Daily-AI-Brief${relativeImage[2]}` : null);
    const imageAlt = image?.[1] || relativeImage?.[1] || headline;
    const sourceRegion = block.slice(Math.max(0, block.search(/\*\*Sources?:\*\*/i)));
    const sourceLink = sourceRegion.match(/(?<!!)\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    return {
      story_id: `dab-story-${briefDate}-${stableSuffix(`${briefDate}|${identity}`)}`,
      edition_id: `dab-edition-${briefDate}`,
      brief_date: briefDate,
      ordinal,
      headline,
      slug,
      permanent_url: `/stories/${briefDate}/${slug}/`,
      event_date: eventDate,
      focus,
      topics,
      normalized_urls: normalizedUrls,
      source_title: sourceLink?.[1] || organizationFor(normalizedUrls[0]) || 'Source',
      source_organization: organizationFor(normalizedUrls[0]),
      image: imageUrl ? {url: imageUrl, alt: imageAlt} : null,
      summary: textField(block, ['Summary']),
      why_it_matters: textField(block, ['Why it matters']),
      george_implication: textField(block, ["For George’s work", "For George's work", "Implications for George’s work", "Implications for George's work", "Implications for George’s publishing and training work", "Implications for George's publishing and training work"]),
      concept_tokens: conceptTokens(headline)
    };
  });
}

export function scanHistoricalBriefs(repoRoot, endDate, days = 30) {
  const end = new Date(`${endDate}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const startDate = start.toISOString().slice(0, 10);
  const briefDir = path.join(repoRoot, 'briefs');
  const dates = fs.readdirSync(briefDir).map(name => name.match(/^(\d{4}-\d{2}-\d{2})\.md$/)?.[1]).filter(date => date && date >= startDate && date <= endDate).sort();
  const stories = dates.flatMap(date => parseHistoricalBrief(fs.readFileSync(path.join(briefDir, `${date}.md`), 'utf8'), date));
  return {
    schema_version: '1.0.0',
    window: {start_date: startDate, end_date: endDate, days},
    editions_scanned: dates,
    stories
  };
}
