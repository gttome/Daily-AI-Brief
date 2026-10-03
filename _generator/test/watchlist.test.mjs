import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateWatchlist,publicWatchlist,watchlistPreview,watchlistDailySummary,watchlistDailyState} from '../lib/watchlist.mjs';
const publicData=JSON.parse(fs.readFileSync('data/watchlist.json'));
let data=JSON.parse(fs.readFileSync('_data/watchlist.json'));
if(data.edition_date!==publicData.edition_date&&fs.existsSync('_records/editorial-handoff/publication-manifest.json')){
 const manifest=JSON.parse(fs.readFileSync('_records/editorial-handoff/publication-manifest.json'));
 const currentPath=manifest.artifacts?.watchlist?.path;
 if(currentPath&&fs.existsSync(currentPath))data=JSON.parse(fs.readFileSync(currentPath));
}
test('public watchlist matches researched canonical data',()=>{assert.deepEqual(validateWatchlist(data),[]);assert.equal(data.edition_date,publicData.edition_date);assert.deepEqual(publicWatchlist(data),publicData);});
test('watchlist launches September 12 without changing earlier briefs',()=>{assert.equal(watchlistPreview('2026-09-11'),'');assert.match(watchlistPreview('2026-09-12'),/data-watchlist-preview/);});
test('single development and unmeasured momentum cannot advance',()=>{const copy=structuredClone(data);copy.topics[0].evidence=copy.topics[0].evidence.slice(0,1);copy.topics[0].status='gaining_evidence';assert.ok(validateWatchlist(copy).some(e=>e.includes('independent developments')));copy.topics[0].momentum={classification:'rising',observations:[]};assert.ok(validateWatchlist(copy).some(e=>e.includes('Momentum requires')));});
test('private ballots cannot leak into public data',()=>{const copy=structuredClone(data);copy.ballot_hash='secret';assert.ok(validateWatchlist(copy).includes('Private data in public watchlist'));});

test('current homepage Watchlist preview derives daily counts and changed-item list from canonical state',()=>{
 const preview=watchlistPreview(data.edition_date,data);
 const counts=watchlistDailySummary(data);
 assert.ok(preview.includes(counts.new_today+' new today · '+counts.updated_today+' updated · '+counts.carried_forward+' carried forward.'));
 const active=(data.topics||[]).filter(topic=>topic.status!=='archived');
 const fresh=active.filter(topic=>watchlistDailyState(topic,data.edition_date)==='new_today');
 const updated=active.filter(topic=>watchlistDailyState(topic,data.edition_date)==='updated_today');
 const listed=fresh.length?fresh:updated;
 if(listed.length){
   assert.ok(preview.includes(data.edition_date>='2026-09-24'?'Changed today:':(fresh.length?'New today:':'Updated today:')));
   for(const topic of listed) assert.ok(preview.includes(topic.name));
 }
});
