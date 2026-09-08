import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {archiveIndex, readerFoundationFiles, readerStories, validateFeeds} from '../lib/reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const edition = JSON.parse(fs.readFileSync(path.join(root, '_data/editions/2026-09-07.json'), 'utf8'));

test('reader foundation creates six stable current story pages with story-specific social metadata', () => {
  const files = readerFoundationFiles(edition, root);
  const current = [...files.keys()].filter(name => name.startsWith('stories/2026-09-07/') && name.endsWith('.md'));
  assert.equal(current.length, 6);
  for (const story of edition.stories) {
    const page = files.get(`stories/${edition.brief_date}/${story.slug}.md`);
    assert.match(page, new RegExp(`permalink: ${story.permanent_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.ok(page.includes(JSON.stringify(story.social.title)));
    assert.ok(page.includes(JSON.stringify(story.social.image_url)));
    assert.equal((page.match(/class="story-feedback story-feedback-compact"/g) || []).length, 1);
    assert.equal((page.match(/data-feedback-rating=/g) || []).length, 4);
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

test('shareable feedback page exposes six accessible anonymous rating groups', () => {
  const files = readerFoundationFiles(edition, root);
  const page = files.get('feedback/index.md');
  assert.match(page, /permalink: \/feedback\//);
  assert.equal((page.match(/class="feedback-story"/g) || []).length, 6);
  assert.equal((page.match(/role="group"/g) || []).length, 6);
  assert.equal((page.match(/data-feedback-rating="most_useful"/g) || []).length, 6);
  assert.match(page, /only George can approve an editorial-weight change/);
  assert.match(page, /Share this feedback page/);
});
