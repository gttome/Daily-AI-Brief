import test from 'node:test';
import assert from 'node:assert/strict';
import {compactDiscoveryHtml,extractCandidateMetadata} from '../../_tools/discovery-links.mjs';
import {retainCandidates} from '../lib/discovery-queue.mjs';

test('catalog compaction retains article-bound dates and JSON-LD and removes scripts/styles',()=>{
 const html=`<style>${'x'.repeat(30000)}</style><script>${'x'.repeat(30000)}</script><script type="application/ld+json">{"@type":"NewsArticle","url":"https://example.org/story","headline":"Verified source title","datePublished":"2026-09-18T10:00:00Z"}</script><article><h2><a href="/other">Another article headline</a></h2><time datetime="2026-09-17T14:00:00Z"></time></article>`;
 const compact=compactDiscoveryHtml(html);
 assert.ok(compact.length<1000);
 assert.deepEqual(extractCandidateMetadata(compact,'https://example.org'),extractCandidateMetadata(html,'https://example.org'));
});
test('dated URL retention preserves newest GitHub leads without asserting publication timestamps',()=>{
 const items=['2026-09-10','2026-09-17','2026-09-18'].map(date=>({url:`https://github.blog/changelog/${date}-agent-news`,source_id:'github',published_at:null}));
 const retained=retainCandidates(items,{limit:2});
 assert.equal(retained.candidates[0].url,items[2].url);
 assert.equal(retained.candidates[1].url,items[1].url);
 assert.ok(retained.candidates.every(c=>c.published_at===null));
 assert.equal(retained.retention.overflow[0].reason,'queue_capacity_not_editorial_rejection');
});

import {runWatchlistFallback} from '../lib/incremental-watchlist.mjs';
import {DiscoveryAcquisition} from '../../_tools/discovery-context.mjs';
import {RetrievalCache} from '../lib/research.mjs';

test('Watchlist recovery stops at three successes and never forces assisted sources',async()=>{
 const sources=Array.from({length:8},(_,i)=>({source_id:'s'+i,endpoint:'https://example.org/'+i,automated:i!==0}));
 const checks=sources.map(s=>({source_id:s.source_id,status:'not_due',previous_status:s.automated?'retrieved':'assisted_review_required'}));
 checks.push({source_id:'initial',status:'retrieved'});
 const calls=[];
 const recovery=await runWatchlistFallback(sources,checks,async(source,force)=>{
  calls.push(source.source_id);assert.equal(force,true);
  return {source_id:source.source_id,status:'retrieved',checked_at:'2026-09-18T13:00:00Z'};
 });
 assert.deepEqual(calls,['s1','s2']);assert.equal(recovery.checks.length,2);
 assert.equal(checks.filter(c=>c.status==='retrieved').length,3);
 assert.equal(checks.find(c=>c.source_id==='s0').status,'not_due');
 assert.ok(recovery.checks.every(c=>c.previous_disposition.status==='not_due'));
});
test('Watchlist recovery is bounded at five failures',async()=>{
 const sources=Array.from({length:8},(_,i)=>({source_id:'s'+i,endpoint:'https://example.org/'+i,automated:true}));
 const checks=sources.map(s=>({source_id:s.source_id,status:'not_due',previous_status:'retrieved'}));
 const recovery=await runWatchlistFallback(sources,checks,async s=>({source_id:s.source_id,status:'unavailable'}));
 assert.equal(recovery.checks.length,5);assert.equal(checks.filter(c=>c.status==='not_due').length,3);
});
test('forced Watchlist retrieval rechecks cached content',async()=>{
 let calls=0;
 const acquisition=new DiscoveryAcquisition({cache:new RetrievalCache(),fetcher:async()=>({text:'catalog '+(++calls)})});
 await acquisition.retrieve('https://example.org/');
 await acquisition.retrieve('https://example.org/');assert.equal(calls,1);
 await acquisition.retrieve('https://example.org/',{force:true});assert.equal(calls,2);
});
test('catalog compaction preserves literal markup inside structured JSON',()=>{
 const json='<script type="application/ld+json">{"description":"<p class=\\"keep\\">A  B</p>"}</script>';
 assert.equal(compactDiscoveryHtml(json),json);
});
