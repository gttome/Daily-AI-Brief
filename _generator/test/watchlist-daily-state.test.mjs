import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {watchlistDailyState,watchlistDailySummary} from '../lib/watchlist.mjs';

test('Watchlist classifies new, updated, and carried-forward topics by edition date',()=>{
 const edition_date='2026-09-16';
 assert.equal(watchlistDailyState({first_detected:'2026-09-16T10:00:00Z',updated_at:'2026-09-16T10:00:00Z'},edition_date),'new_today');
 assert.equal(watchlistDailyState({first_detected:'2026-09-12T10:00:00Z',updated_at:'2026-09-16T09:00:00Z'},edition_date),'updated_today');
 assert.equal(watchlistDailyState({first_detected:'2026-09-12T10:00:00Z',updated_at:'2026-09-15T09:00:00Z'},edition_date),'carried_forward');
});

test('Watchlist daily summary excludes archived topics',()=>{
 const data={edition_date:'2026-09-16',topics:[
  {status:'early_signal',first_detected:'2026-09-16T10:00:00Z',updated_at:'2026-09-16T10:00:00Z'},
  {status:'gaining_evidence',first_detected:'2026-09-12T10:00:00Z',updated_at:'2026-09-16T09:00:00Z'},
  {status:'early_signal',first_detected:'2026-09-12T10:00:00Z',updated_at:'2026-09-15T09:00:00Z'},
  {status:'archived',first_detected:'2026-09-16T08:00:00Z',updated_at:'2026-09-16T08:00:00Z'}
 ]};
 assert.deepEqual(watchlistDailySummary(data),{new_today:1,updated_today:1,carried_forward:1});
});

test('Watchlist page visibly explains rolling freshness and daily states',()=>{
 const page=fs.readFileSync('watchlist/index.md','utf8');
 const js=fs.readFileSync('assets/js/watchlist.js','utf8');
 assert.match(page,/rolling research watchlist/);
 assert.match(js,/What changed today/);
 assert.match(js,/New today/);
 assert.match(js,/Updated today/);
 assert.match(js,/Carried forward/);
 assert.match(js,/No newly verified or materially updated topic cleared the evidence gates today/);
});
