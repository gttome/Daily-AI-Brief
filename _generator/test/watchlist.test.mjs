import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateWatchlist,publicWatchlist,watchlistPreview} from '../lib/watchlist.mjs';
const data=JSON.parse(fs.readFileSync('_data/watchlist.json'));
test('public watchlist matches researched canonical data',()=>{assert.deepEqual(validateWatchlist(data),[]);assert.deepEqual(publicWatchlist(data),JSON.parse(fs.readFileSync('data/watchlist.json')));});
test('watchlist launches September 12 without changing earlier briefs',()=>{assert.equal(watchlistPreview('2026-09-11'),'');assert.match(watchlistPreview('2026-09-12'),/data-watchlist-preview/);});
test('single development and unmeasured momentum cannot advance',()=>{const copy=structuredClone(data);copy.topics[0].status='gaining_evidence';assert.ok(validateWatchlist(copy).some(e=>e.includes('independent developments')));copy.topics[0].momentum={classification:'rising',observations:[]};assert.ok(validateWatchlist(copy).some(e=>e.includes('Momentum requires')));});
test('private ballots cannot leak into public data',()=>{const copy=structuredClone(data);copy.ballot_hash='secret';assert.ok(validateWatchlist(copy).includes('Private data in public watchlist'));});
