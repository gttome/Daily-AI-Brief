import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {renderDated,renderIndex,renderLatest} from '../lib/render.mjs';

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
