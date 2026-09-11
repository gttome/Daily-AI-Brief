import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {archiveIndex, readerFoundationFiles, readerStories, validateFeeds} from '../lib/reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edition = JSON.parse(fs.readFileSync(path.join(root, '_data/editions/2026-09-07.json'), 'utf8'));

test('reader foundation creates six stable shared story pages with a fresh rating scale', () => {
  const files = readerFoundationFiles(edition, root);
  const current = [...files.keys()].filter(name => name.startsWith('stories/2026-09-07/') && name.endsWith('.md'));
  assert.equal(current.length, 6);
  for (const story of edition.stories) {
    const page = files.get(`stories/${edition.brief_date}/${story.slug}.md`);
    assert.match(page, new RegExp(`permalink: ${story.permanent_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.ok(page.includes(JSON.stringify(story.social.title)));
    assert.ok(page.includes(JSON.stringify(story.social.image_url)));
    assert.match(page, new RegExp(`story_id: ${story.story_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.equal((page.match(/class="story-feedback story-feedback-compact"/g) || []).length, 1);
    assert.equal((page.match(/data-feedback-rating=/g) || []).length, 4);
  }
});

test('every permanent story page inherits a visible Home link', () => {
  const layout = fs.readFileSync(path.join(root, '_layouts', 'default.html'), 'utf8');
  assert.match(layout, /href="{{ '\/' \| relative_url }}" class="btn">Home<\/a>/);
  const storiesRoot = path.join(root, 'stories');
  const storyPages = fs.readdirSync(storiesRoot, {recursive:true})
    .filter(name => name.endsWith('.md'));
  assert.ok(storyPages.length > 0);
  for (const name of storyPages) {
    const page = fs.readFileSync(path.join(storiesRoot, name), 'utf8');
    assert.match(page, /^layout: default$/m, name);
  }
});

test('archive index supports every required filter dimension', () => {
  const index = archiveIndex(readerStories(root, edition));
  assert.ok(index.stories.length >= 6);
  for (const field of ['brief_date', 'companies', 'topics', 'focus', 'evidence_type', 'availability_status', 'trends']) assert.ok(Object.hasOwn(index.stories[0], field), field);
  assert.equal(new Set(index.stories.map(story => story.story_id)).size, index.stories.length);
});

test('Atom and JSON feeds validate and point to permanent story URLs', () => {
  const files = readerFoundationFiles(edition, root);
  assert.deepEqual(validateFeeds(files.get('feed.xml'), files.get('feed.json')), []);
  const feed = JSON.parse(files.get('feed.json'));
  assert.equal(feed.items[0].url.startsWith('https://gttome.github.io/Daily-AI-Brief/stories/'), true);
  assert.equal(new Set(feed.items.map(item => item.id)).size, feed.items.length);
});

test('retired feedback route points readers to article-local ratings without duplicate controls', () => {
  const files = readerFoundationFiles(edition, root);
  const page = files.get('feedback/index.md');
  assert.match(page, /permalink: \/feedback\//);
  assert.equal((page.match(/class="feedback-story"/g) || []).length, 0);
  assert.equal((page.match(/role="group"/g) || []).length, 0);
  assert.equal((page.match(/data-feedback-rating=/g) || []).length, 0);
  assert.match(page, /separate Daily Reader Feedback form has been retired/);
  assert.match(page, /Open today’s brief and rate its stories/);
  assert.match(page, /permanent shared-story page/);
  assert.match(page, /Ratings are browser-local and are never included in a shared link/);
});

test('permanent story sharing strips query and hash state from the shared URL', () => {
  const script = fs.readFileSync(path.join(root, 'assets/js/share.js'), 'utf8');
  assert.match(script, /url: window\.location\.origin \+ window\.location\.pathname/);
  assert.doesNotMatch(script, /url: window\.location\.href\.split\('#'\)\[0\]/);
});

test('public rating client writes privately without fetching aggregate ratings', () => {
  const script = fs.readFileSync(path.join(root, 'assets/js/feedback.js'), 'utf8');
  assert.match(script, /method: 'POST'/);
  assert.match(script, /'x-operation-id':operationId/);
  assert.match(script, /JSON\.stringify\(\{brief_date: briefDate, item_id: storyId, rating:/);
  assert.match(script, /result\.recorded !== true/);
  assert.match(script, />29\*86400000/);
  assert.doesNotMatch(script, /method: 'GET'|refreshSummary|star-summary|Reader average|ratings temporarily unavailable/i);
});
