import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderBody} from '../lib/render.mjs';
import {readerFoundationFiles} from '../lib/reader.mjs';
import {validateBookReading} from '../lib/book-reading.mjs';
const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-12.json'));
const catalog=JSON.parse(fs.readFileSync('_data/book-reading.json'));
test('approved reading appears in edition and permanent article, video and podcast without losing interactions',()=>{
 const body=renderBody(edition);assert.equal((body.match(/class="book-bridge"/g)||[]).length,3);assert.equal((body.match(/class="series-invitation"/g)||[]).length,1);assert.doesNotMatch(body,/Proposed update:/);assert.equal((body.match(/data-feedback-rating=/g)||[]).length,45);
 const files=readerFoundationFiles(edition,process.cwd());
 for(const name of [`stories/2026-09-12/${edition.stories[0].slug}.md`,'videos/2026-09-12/agent-skills.md','podcasts/2026-09-12/ai-risk-specificity.md']){assert.match(files.get(name),/class="book-bridge"/);assert.match(files.get(name),/data-feedback-rating="5"/);}
 assert.match(body,/Chapter 3, section 3.3.3/);assert.match(body,/Quick Reference: Context Quality Checklist/);assert.match(body,/does not validate/);
 assert.match(body,/Get the book and explore contents ↗/);assert.match(body,/Leanpub.com book webpage/);
 assert.doesNotMatch(body,/watchlist-fold|Emerging AI Watchlist · explore after the brief/);
 assert.ok(body.indexOf('class="watchlist-preview"')>body.indexOf('### 9.'));
 assert.ok(body.indexOf('class="watchlist-preview"')<body.indexOf('## Editorial takeaway'));
});
test('book selections reject fabricated IDs, unsupported practice references, and more than three placements',()=>{
 const bad=structuredClone(catalog);bad.editions['2026-09-12'][0].reference_id='imaginary-chapter';assert.throws(()=>validateBookReading(edition,bad));
 const extra=structuredClone(catalog);extra.editions['2026-09-12'].push({...extra.editions['2026-09-12'][0]});assert.throws(()=>validateBookReading(edition,extra));
 const exercise=structuredClone(catalog);exercise.editions['2026-09-12'][0].practice='invented exercise';assert.throws(()=>validateBookReading(edition,exercise));
});
test('future editions have no forced chapter matches and empty media slots stay visible',()=>{
 const future=structuredClone(edition);future.brief_date='2099-01-01';future.worth_watching.general={status:'empty',exception:'No suitable verified video.'};const body=renderBody(future);assert.doesNotMatch(body,/class="book-bridge"/);assert.match(body,/Video · No qualifying selection/);assert.match(body,/No suitable verified video/);
});
