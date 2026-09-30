
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {compactMemory,queryCompactMemory} from '../lib/compact-memory.mjs';
import {scanHistoricalBriefs} from '../lib/historical.mjs';
import {backtestNovelty} from '../lib/novelty.mjs';
import {watchlistDue,recordWatchlistCheck,incrementalCoverage} from '../lib/incremental-watchlist.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
test('compact 30-day index preserves every historical novelty match and reuses unchanged parses',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-memory-'));
 try{
 const full=scanHistoricalBriefs(root,'2026-09-14'),cacheFile=path.join(temp,'index.json');
 const first=compactMemory(root,'2026-09-14',{cacheFile}),second=compactMemory(root,'2026-09-14',{cacheFile});
 assert.deepEqual(backtestNovelty(first.memory),backtestNovelty(full));
 assert.equal(second.telemetry.briefs_reparsed,0);
 assert.equal(second.telemetry.briefs_reused,full.editions_scanned.length);
 assert.ok(JSON.stringify(first.memory).length<JSON.stringify(full).length);
 const candidate={concept_tokens:['zebra','unrelated','quasar'],normalized_urls:['https://example.org/unrelated']};
 assert.equal(queryCompactMemory(candidate,first.memory).requires_historical_evidence_review,false);
 fs.writeFileSync(cacheFile,'corrupt');
 assert.ok(compactMemory(root,'2026-09-14',{cacheFile}).telemetry.briefs_reparsed>0);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('Watchlist retains old success after failure, reports backoff and invalidates changed endpoints',()=>{
 const source={source_id:'source',endpoint:'https://example.org/catalog'},now='2026-09-14T12:00:00Z';
 const prior=recordWatchlistCheck(source,null,{now,text:'catalog',candidates:[{url:'https://example.org/a'}],status:'retrieved'});
 assert.equal(watchlistDue(source,prior,'2026-09-14T13:00:00Z'),false);
 assert.equal(watchlistDue(source,prior,'2026-09-15T12:00:00Z'),true);
 assert.equal(watchlistDue({...source,endpoint:'https://example.org/new'},prior,now),true);
 const failed=recordWatchlistCheck(source,prior,{now:'2026-09-15T12:00:00Z',status:'unavailable'});
 assert.equal(failed.last_successful_check,now);assert.deepEqual(failed.candidate_urls,prior.candidate_urls);
 assert.equal(incrementalCoverage([{status:'not_due',previous_status:'unavailable'}]).coverage_status,'degraded');
 assert.equal(incrementalCoverage([{status:'not_due',previous_status:'retrieved'}]).sources_checked,0);
 const same=recordWatchlistCheck(source,prior,{now:'2026-09-15T12:00:00Z',text:'catalog',candidates:[{url:'https://example.org/a'}],status:'retrieved'});
 assert.equal(same.unchanged,true);
});
