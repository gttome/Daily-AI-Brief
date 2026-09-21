import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderBody} from '../lib/render.mjs';
import {readerFoundationFiles} from '../lib/reader.mjs';
import {renderBookReading,validateBookReading} from '../lib/book-reading.mjs';
const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-12.json'));
const catalog=JSON.parse(fs.readFileSync('_data/book-reading.json'));
test('historical approved reading remains byte-compatible in edition and permanent article, video and podcast',()=>{
 const body=renderBody(edition);assert.equal((body.match(/class="book-bridge"/g)||[]).length,3);assert.equal((body.match(/class="series-invitation"/g)||[]).length,1);assert.doesNotMatch(body,/Proposed update:/);assert.equal((body.match(/data-feedback-rating=/g)||[]).length,45);
 const files=readerFoundationFiles(edition,process.cwd());
 for(const name of [`stories/2026-09-12/${edition.stories[0].slug}.md`,'videos/2026-09-12/agent-skills.md','podcasts/2026-09-12/ai-risk-specificity.md']){assert.match(files.get(name),/class="book-bridge"/);assert.match(files.get(name),/data-feedback-rating="5"/);}
 assert.match(body,/Chapter 3, section 3.3.3/);assert.match(body,/Quick Reference: Context Quality Checklist/);assert.match(body,/does not validate/);
 assert.match(body,/Get the book and explore contents ↗/);assert.match(body,/Leanpub.com book webpage/);
 assert.doesNotMatch(body,/watchlist-fold|Emerging AI Watchlist · explore after the brief/);
 assert.ok(body.indexOf('class="watchlist-preview"')>body.indexOf('### 9.'));
 assert.ok(body.indexOf('class="watchlist-preview"')<body.indexOf('## Editorial takeaway'));
});
test('historical selections retain the three-placement limit',()=>{
 const bad=structuredClone(catalog);bad.editions['2026-09-12'][0].reference_id='imaginary-chapter';assert.throws(()=>validateBookReading(edition,bad));
 const extra=structuredClone(catalog);extra.editions['2026-09-12'].push({...extra.editions['2026-09-12'][0]});assert.throws(()=>validateBookReading(edition,extra));
 const exercise=structuredClone(catalog);exercise.editions['2026-09-12'][0].practice='invented exercise';assert.throws(()=>validateBookReading(edition,exercise));
});
test('September 16 forward permits one verified bridge per Brief item',()=>{
 const future=structuredClone(edition);future.brief_date='2026-09-16';
 const ids=[...future.stories.map(story=>story.story_id),'dab-video-2026-09-16-general','dab-video-2026-09-16-agent-skills',future.podcast.item_id];
 const full=structuredClone(catalog);full.editions['2026-09-16']=ids.map(item_id=>({item_id,reference_id:'reliable-verification',label:'READ DEEPER',why:'This verified chapter provides useful background for the selected Brief item.'}));
 assert.equal(full.editions['2026-09-16'].length,9);assert.doesNotThrow(()=>validateBookReading(future,full));
 full.editions['2026-09-16'].push({...full.editions['2026-09-16'][0]});assert.throws(()=>validateBookReading(future,full));
});
test('September 16 forward public body removes owner-only editorial metadata and does not force book matches',()=>{
 const future=structuredClone(edition);future.brief_date='2099-09-17';future.worth_watching.general={status:'empty',exception:'PRIVATE VIDEO DIAGNOSTIC'};const body=renderBody(future);
 assert.doesNotMatch(body,/class="book-bridge"/);assert.doesNotMatch(body,/data-george-implication|Proposed update:|George Tome/);assert.match(body,/Video · No qualifying selection/);assert.match(body,/No video met today’s editorial quality standards\./);assert.doesNotMatch(body,/PRIVATE VIDEO DIAGNOSTIC/);assert.match(body,/Purchasing a book supports continued development/);
});
test('September 16 forward bridges use the approved Leanpub wording',()=>{
 const selection=catalog.editions['2026-09-16'][0];
 const bridge=renderBookReading(selection.item_id,'2026-09-16');
 assert.match(bridge,/Get the book and explore contents ↗/);
 assert.match(bridge,/Leanpub\.com book webpage/);
 assert.doesNotMatch(bridge,/Explore contents &amp; buy the book|Leanpub book page/);
});
test('September 16 public canonical and reader files contain no owner-only book-change metadata',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-16.json'));
 assert.doesNotMatch(JSON.stringify(current),/george_implication|series_implications|proposed book/i);
 for(const file of ['briefs/2026-09-16.md','latest.md','index.md']){
  const text=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(text,/data-george-implication|Proposed update:|owner-only book/i);
 }
});


test('September 19 restores data-driven professional-series mappings without filling every slot',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-19.json'));
 assert.doesNotThrow(()=>validateBookReading(current,catalog));
 const selections=catalog.editions['2026-09-19'];
 assert.equal(selections.length,3);
 assert.ok(selections.some(x=>x.item_id==='dab-story-2026-09-19-5b233997'));
 assert.match(renderBookReading('dab-story-2026-09-19-5b233997','2026-09-19'),/GENERATIVE AI PROFESSIONAL SERIES/);
});


test('September 21 includes appropriate Professional Series bridges and homepage order matches brief order',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-21.json'));
 assert.doesNotThrow(()=>validateBookReading(current,catalog));
 const selections=catalog.editions['2026-09-21'];
 assert.equal(selections.length,4);
 for(const id of ['dab-story-2026-09-21-b624254e','dab-story-2026-09-21-cf2a803f','dab-story-2026-09-21-454cb9e6','dab-story-2026-09-21-9782e549'])assert.match(renderBookReading(id,'2026-09-21'),/GENERATIVE AI PROFESSIONAL SERIES/);
 const body=renderBody(current);
 const overview=body.slice(0,body.indexOf('## 1.'));
 const presented=[...body.matchAll(/^## ([1-6])\. (.+)$/gm)].map(x=>x[2]);
 assert.equal(presented.length,6);
 let cursor=-1;
 for(const headline of presented){const next=overview.indexOf(headline);assert.ok(next>cursor,`overview order mismatch for ${headline}`);cursor=next;}
 assert.equal((body.match(/class="book-bridge"/g)||[]).length,4);
});
