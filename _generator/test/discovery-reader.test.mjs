import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterArchiveItems,inDateRange,invalidDateRange} from '../../assets/js/archive-model.js';
import {renderWatchlistEvidence,WEIGHTS} from '../../assets/js/watchlist-evidence.js';
const items=JSON.parse(fs.readFileSync('data/archive-index.json')).stories;
const topics=JSON.parse(fs.readFileSync('data/watchlist.json')).topics;
test('archive filters combine date/type and retain historical media identities',()=>{
 const daily=filterArchiveItems(items,{from:'2026-09-12',to:'2026-09-12'});
 assert.equal(daily.length,9);
 assert.equal(filterArchiveItems(items,{from:'2026-09-12',to:'2026-09-12',type:'Video'}).length,2);
 assert.equal(filterArchiveItems(items,{from:'2026-09-12',to:'2026-09-12',type:'Podcast'}).length,1);
 for(const x of filterArchiveItems(items,{type:'Video'}))assert.equal(x,items.find(i=>i.story_id===x.story_id));
 assert.equal(filterArchiveItems(items,{type:'Video',query:'Agent Skills',from:'2026-09-12',to:'2026-09-12'}).length,1);
 assert.equal(filterArchiveItems(items,{query:'no-such-item-zzzz'}).length,0);
 assert.equal(filterArchiveItems(items,{}).length,items.length);
});
test('invalid date ranges cannot produce items and edition filtering ignores item criteria',()=>{
 const f={from:'2026-09-12',to:'2026-09-11'};assert.equal(invalidDateRange(f),true);assert.deepEqual(filterArchiveItems(items,f),[]);
 assert.equal(inDateRange('2026-09-12',{from:'2026-09-12',to:'2026-09-12',query:'no-match',type:'Video'}),true);
});
test('public evidence displays review scope and unknown momentum without changing the score',()=>{
 assert.equal(Object.values(WEIGHTS).reduce((a,b)=>a+b),100);
 for(const t of topics){const html=renderWatchlistEvidence(t);assert.match(html,/Source checks recorded/);assert.match(html,/Unknown/);assert.match(html,/Reader votes do not change this score/);assert.match(html,new RegExp(t.research_score+'/100'));for(const e of t.evidence)assert.ok(html.includes(e.url.replaceAll('&','&amp;')));}
});
test('source-controlled text and URLs cannot inject markup into watchlist cards',()=>{
 const t=structuredClone(topics[0]);t.evidence[0].title='<img src=x onerror=alert(1)>';t.evidence[0].url='javascript:alert(1)';t.limitations='<script>alert(1)</script>';
 const html=renderWatchlistEvidence(t);assert.doesNotMatch(html,/<img|<script|href="javascript:/);assert.match(html,/&lt;script&gt;/);
});
