import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderBody} from '../lib/render.mjs';
import {readerFoundationFiles} from '../lib/reader.mjs';

const root=process.cwd();
const edition=JSON.parse(fs.readFileSync('_data/editions/2026-10-02.json','utf8'));
const watchlist=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8'));

test('October 2 and future reader rendering keeps coverage and media duration reader-facing',()=>{
  const body=renderBody(edition,{watchlist});
  assert.match(body,/\*\*Coverage period:\*\* September 29–October 1, 2026/);
  assert.doesNotMatch(body,/24-hour primary window|fixed Run 5 research cutoff/);
  assert.doesNotMatch(body,/\d+:\d{2} video<\/span>|\d+:\d{2} podcast<\/span>/);
  assert.doesNotMatch(body,/\*\*Runtime:\*\*/);
  assert.match(body,/\*\*Duration:\*\* 9:24/);
  assert.match(body,/\*\*Duration:\*\* 0:20/);
  assert.match(body,/\*\*Duration:\*\* 11:06/);
  assert.match(body,/\*\*Duration:\*\* 13:00/);
  assert.doesNotMatch(body,/No episode time limit/);
});

test('book bridges explain reader value instead of internal selection operations',()=>{
  const body=renderBody(edition,{watchlist});
  assert.doesNotMatch(body,/Run 5 all-four-book review selected|reader-value match|selected this verified section/i);
  assert.match(body,/Use this section to break a reusable Gemini Skill into the prompt components it must preserve/);
  assert.match(body,/Use this chapter to turn Dogwood’s sequence-aware policy checks into concrete failure-mode playbooks/);
});

test('Watchlist reader summary surfaces archived topics and their reason',()=>{
  const body=renderBody(edition,{watchlist});
  assert.match(body,/Archived \/ dropped/);
  assert.match(body,/Source-aware verification for tool-using agents/);
  assert.match(body,/Not retained as a distinct active mechanism after the October 1 independent sweep/);
});

test('permanent media pages use one explicit Duration field',()=>{
  const files=readerFoundationFiles(edition,root);
  const video=files.get('videos/2026-10-02/general.md');
  const video2=files.get('videos/2026-10-02/agent-skills.md');
  const podcast1=files.get('podcasts/2026-10-02/run5-1.md');
  const podcast2=files.get('podcasts/2026-10-02/run5-2.md');
  assert.match(video,/\*\*Duration:\*\* 9:24/);
  assert.match(video2,/\*\*Duration:\*\* 0:20/);
  for(const page of [video,video2])assert.doesNotMatch(page,/\d+:\d{2} video<\/span>|\*\*Runtime:\*\*/);
  assert.match(podcast1,/\*\*Duration:\*\* 11:06/);
  assert.match(podcast2,/\*\*Duration:\*\* 13:00/);
  for(const page of [podcast1,podcast2])assert.doesNotMatch(page,/\d+:\d{2} podcast<\/span>|No episode time limit/);
});

test('article Topics never expose internal candidate IDs',()=>{
  const body=renderBody(edition,{watchlist});
  assert.doesNotMatch(body,/\*\*Topics:\*\*\s*m\d{2}(?:,|\s|$)/i);
  const files=readerFoundationFiles(edition,root);
  for(const story of edition.stories){
    const page=files.get(`stories/${edition.brief_date}/${story.slug}.md`);
    assert.doesNotMatch(page,/\*\*Topics:\*\*\s*m\d{2}(?:,|\s|$)/i);
  }
});

