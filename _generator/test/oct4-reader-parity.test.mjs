import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {generatedFiles,renderDated,renderIndex,renderLatest} from '../lib/render.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const edition=JSON.parse(fs.readFileSync(path.join(root,'_data/editions/2026-10-04.json'),'utf8'));
const watchlist=JSON.parse(fs.readFileSync(path.join(root,'_data/watchlist.json'),'utf8'));

test('October 4 historical correction preserves the complete reader contract',()=>{
  const outputs=[renderDated(edition,{watchlist}),renderLatest(edition,{watchlist}),renderIndex(edition,{watchlist})];
  for(const output of outputs){
    assert.match(output,/IN THIS EDITION · 6 ARTICLES \/ 2 VIDEOS \/ 2 PODCASTS/);
    assert.equal((output.match(/class="book-bridge"/g)||[]).length,6);
    assert.equal((output.match(/class="story-feedback story-feedback-compact star-feedback"/g)||[]).length,10);
    assert.match(output,/Extended recency fallback/);
    assert.match(output,/\*\*Evidence:\*\* Publisher Authored/);
    assert.match(output,/\*\*Availability:\*\* Available/);
    assert.match(output,/0 new today · 3 updated · 17 carried forward\./);
    assert.match(output,/AI harness engineering becomes a first-class layer/);
    assert.match(output,/Agent safeguards tailored to the task/);
    assert.match(output,/Agentic workloads move toward measured edge inference/);
    assert.match(output,/CONTINUE LEARNING/);
  }
  assert.match(outputs[0],/View Briefs Archive/);
});


test('October 4 permanent article pages match the canonical reader renderer',()=>{
  const files=generatedFiles(edition,root,{watchlist});
  for(const story of edition.stories){
    const relative=`stories/2026-10-04/${story.slug}.md`;
    const expected=files.get(relative);
    const actual=fs.readFileSync(path.join(root,relative),'utf8');
    assert.equal(actual,expected,`${relative}: saved page must match the canonical permanent-story renderer`);
    assert.match(actual,/class="reading-context"/);
    assert.match(actual,/class="book-bridge"/);
    assert.match(actual,/class="story-feedback story-feedback-compact star-feedback"/);
    assert.match(actual,/\*\*Evidence:\*\* Publisher Authored/);
    assert.match(actual,/\*\*Availability:\*\* Available/);
  }
});
