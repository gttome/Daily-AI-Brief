import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sha256} from '../lib/util.mjs';
import {RetrievalCache,filterCandidates,createEvidencePacket,researchSufficiency,FOCUSES,researchTelemetry,runSelectiveResearch,PRIMARY_FRESHNESS_HOURS,DEFAULT_FALLBACK_HOURS,AGENT_SKILLS_FALLBACK_HOURS,DEFAULT_METADATA_CANDIDATE_LIMIT,MAX_DEEP_CANDIDATE_EXCEPTION} from '../lib/research.mjs';
const now='2026-09-14T12:00:00Z';
const candidate={candidate_id:'candidate-1',headline:'A reviewed development',canonical_url:'https://example.org/news',published_at:'2026-09-14T10:00:00Z',focus:FOCUSES[0],source_reliability:'primary',publisher:'Example'};
const source={canonical_url:candidate.canonical_url,text:'The evaluated system completed 12 tasks. This is a controlled test.',fetched_at:now};
const review={status:'reviewed',reviewer:'editorial-review',reviewed_at:now,source_content_hash:sha256(source.text),claims:[{claim:'Twelve tasks completed in the evaluation.',excerpt:'The evaluated system completed 12 tasks.'}],novelty_status:'pass',confidence:'high',agent_skill_relevance:true};

test('freshness constants preserve a 24-hour primary window and bounded fallbacks',()=>{
 assert.equal(PRIMARY_FRESHNESS_HOURS,24);assert.equal(DEFAULT_FALLBACK_HOURS,72);assert.equal(AGENT_SKILLS_FALLBACK_HOURS,168);
 assert.equal(DEFAULT_METADATA_CANDIDATE_LIMIT,20);assert.equal(MAX_DEEP_CANDIDATE_EXCEPTION,9);
});
test('prefilter retains missing metadata for review and never caps categories',()=>{
 const list=Array.from({length:25},(_,i)=>({...candidate,canonical_url:'https://example.org/'+i}));
 const result=filterCandidates([...list,{...candidate,published_at:null}],{now});
 assert.equal(result.accepted.length,25);assert.equal(result.fresh.length,25);assert.equal(result.fallback.length,0);assert.equal(result.needs_review.length,1);
 assert.throws(()=>filterCandidates(list,{}),/time/);
});
test('prefilter marks older eligible candidates as fallback and rejects beyond the outer window',()=>{
 const result=filterCandidates([
  candidate,
  {...candidate,candidate_id:'fallback',canonical_url:'https://example.org/fallback',published_at:'2026-09-13T10:00:00Z'},
  {...candidate,candidate_id:'too-old',canonical_url:'https://example.org/too-old',published_at:'2026-09-06T10:00:00Z'}
 ],{now});
 assert.equal(result.fresh.length,1);assert.equal(result.fallback.length,1);assert.equal(result.fallback[0].freshness_tier,'fallback');
 assert.equal(result.rejected[0].reason,'outside_freshness_window');
});
test('prefilter separates stale, tracking duplicate, unsupported and reviewed covered events',()=>{
 const result=filterCandidates([candidate,{...candidate,canonical_url:candidate.canonical_url+'?utm_source=x'},
 {...candidate,canonical_url:'https://example.org/stale',published_at:'2026-08-01'},
 {...candidate,canonical_url:'https://example.org/unsupported',source_status:'unsupported'},
 {...candidate,canonical_url:'https://example.org/repeat',event_fingerprint:'known'}],{now,coveredEvents:['known']});
 assert.equal(result.accepted.length,1);
 assert.deepEqual(result.rejected.map(x=>x.reason),['duplicate_url','outside_freshness_window','unsupported_source','covered_event_requires_material_update']);
});
test('evidence packets reject unsupported excerpts, changed source bytes and unreviewed claims',()=>{
 const packet=createEvidencePacket(candidate,source,review);
 assert.equal(packet.source_content_hash,sha256(source.text));
 assert.throws(()=>createEvidencePacket(candidate,source,{...review,claims:[{claim:'Unfounded',excerpt:'99 tasks'}]}),/traceable/);
 assert.throws(()=>createEvidencePacket(candidate,{...source,text:source.text+' update'},review),/hash/);
 assert.throws(()=>createEvidencePacket(candidate,source,{...review,status:'pending'}),/review/);
});
test('early stop needs unique reviewed primary-window finalists plus backups in every category and skill coverage',()=>{
 const p=createEvidencePacket(candidate,source,review);
 const packets=FOCUSES.flatMap((category,i)=>Array.from({length:3},(_,j)=>({...p,canonical_url:'https://example.org/'+i+'/'+j,category})));
 assert.equal(researchSufficiency(packets,{now}).sufficient,true);
 assert.equal(researchSufficiency(packets.slice(1),{now}).sufficient,false);
 assert.equal(researchSufficiency(packets.map(x=>({...x,agent_skill_relevance:false})),{now}).sufficient,false);
 assert.equal(researchSufficiency(packets.map(x=>({...x,published_at:'2026-09-13T10:00:00Z'})),{now}).sufficient,false);
 assert.equal(researchSufficiency(packets.map(x=>({...x,published_at:'2026-08-01'})),{now}).sufficient,false);
 assert.equal(researchSufficiency(packets.map(x=>({...x,canonical_url:p.canonical_url})),{now}).sufficient,false);
 assert.equal(researchSufficiency(packets.map(x=>({...x,novelty_status:'review_required'})),{now}).sufficient,false);
});
test('cache coalesces simultaneous calls and distinguishes metadata from fulltext',async()=>{
 let count=0;const cache=new RetrievalCache({now:()=>now});
 const fetcher=async()=>{count++;await new Promise(r=>setTimeout(r,5));return{text:source.text};};
 await Promise.all([cache.retrieve(candidate.canonical_url,fetcher),cache.retrieve(candidate.canonical_url+'?utm_source=a',fetcher)]);
 assert.equal(count,1);assert.equal(cache.metrics.cache_hits,1);
 await cache.retrieve(candidate.canonical_url,fetcher,{kind:'metadata'});assert.equal(count,2);
});
test('persistent cache rejects expiry, future clocks, corruption and honors fresh verification',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dab-cache-test-'));
 try{
 let current=now,count=0;const options={directory,now:()=>current,ttlMs:1000};
 const fetcher=async()=>({text:'version '+(++count)});
 let cache=new RetrievalCache(options);await cache.retrieve(candidate.canonical_url,fetcher);
 cache=new RetrievalCache(options);assert.equal((await cache.retrieve(candidate.canonical_url,fetcher)).cache_status,'hit');
 current='2026-09-14T12:00:01Z';await cache.retrieve(candidate.canonical_url,fetcher);assert.equal(count,2);
 current='2026-09-14T11:59:59Z';await cache.retrieve(candidate.canonical_url,fetcher);assert.equal(count,3);
 const file=cache.file(cache.key(candidate.canonical_url,'fulltext'));
 const entry=JSON.parse(fs.readFileSync(file));entry.text='tampered';fs.writeFileSync(file,JSON.stringify(entry));
 cache=new RetrievalCache(options);await cache.retrieve(candidate.canonical_url,fetcher);assert.equal(count,4);
 await cache.retrieve(candidate.canonical_url,fetcher,{force:true});assert.equal(count,5);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('expired persistent cache conditionally revalidates and 304 carries prior bytes without reacquisition',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dab-cache-conditional-'));
 try{
  let current=now,calls=0,seenConditional=null;
  const cache1=new RetrievalCache({directory,now:()=>current,ttlMs:1000});
  await cache1.retrieve(candidate.canonical_url,async()=>({text:'stable evidence',etag:'"v1"',last_modified:'Mon, 14 Sep 2026 11:00:00 GMT'}),{kind:'metadata'});
  assert.equal(cache1.metrics.source_text_chars_retrieved,'stable evidence'.length);
  current='2026-09-14T12:00:02Z';
  const cache2=new RetrievalCache({directory,now:()=>current,ttlMs:1000});
  const result=await cache2.retrieve(candidate.canonical_url,async(url,options)=>{calls++;seenConditional=options.conditional;return {not_modified:true};},{kind:'metadata'});
  assert.equal(calls,1);assert.equal(seenConditional.etag,'"v1"');assert.equal(result.cache_status,'not_modified');
  assert.equal(cache2.metrics.not_modified_304,1);assert.equal(cache2.metrics.source_text_chars_retrieved,0);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('failed retrieval is not cached or labeled successful; missing telemetry is null',async()=>{
 const cache=new RetrievalCache({now:()=>now});
 await assert.rejects(cache.retrieve(candidate.canonical_url,async()=>{throw Error('403');}),/403/);
 assert.equal(cache.metrics.fulltext_retrievals,0);assert.equal(cache.metrics.failed_retrievals,1);
 assert.equal(cache.load(cache.key(candidate.canonical_url,'fulltext')),null);
 const telemetry=researchTelemetry({startedAt:now,endedAt:now,cache});
 assert.equal(telemetry.research.early_stop_triggered,null);assert.equal(telemetry.usage.exact_platform_tokens,null);
});

import {extractCandidateMetadata} from '../../_tools/discovery-links.mjs';
test('metadata discovery parses RSS and Atom without inventing missing dates',()=>{
 const rss='<rss><item><title><![CDATA[New <b>agent</b> research]]></title><link>https://example.org/rss?utm_source=x</link><pubDate>Mon, 14 Sep 2026 09:00:00 GMT</pubDate><description>Evidence summary</description></item></rss>';
 const [r]=extractCandidateMetadata(rss,'https://example.org',{source_id:'rss',owner:'Publisher',evidence_class:'primary'});
 assert.equal(r.headline,'New agent research');assert.equal(r.published_at,'2026-09-14T09:00:00.000Z');assert.equal(r.snippet,'Evidence summary');
 const atom='<feed><entry><title>Atom research announcement</title><link rel="self" href="https://example.org/self"/><link rel="alternate" href="https://example.org/article"/><updated>2026-09-14</updated></entry></feed>';
 const [a]=extractCandidateMetadata(atom,'https://example.org');
 assert.equal(a.canonical_url,'https://example.org/article');assert.equal(a.published_at,null);
 const [h]=extractCandidateMetadata('<a href="/a">An unfamiliar concept explained</a>','https://example.org');
 assert.equal(h.published_at,null);assert.equal(h.retrieval_status,'metadata_only');
});

test('selective research stops at the 9 normal target when fresh category backups are sufficient',async()=>{
 const candidates=FOCUSES.flatMap((focus,i)=>Array.from({length:7},(_,j)=>({...candidate,candidate_id:i+'-'+j,canonical_url:'https://example.org/'+i+'/'+j,focus})));
 const fetcher=async()=>({text:source.text});
 const reviewer=async()=>review;
 const result=await runSelectiveResearch(candidates,{now,cache:new RetrievalCache({now:()=>now}),fetcher,reviewer});
 assert.equal(result.processed.length,9);assert.equal(result.telemetry.research.early_stop_triggered,true);assert.equal(result.selection_status,'ready_for_single_editorial_pass');
});
test('selective research permits only a targeted +3 deep-review exception before escalation',async()=>{
 const candidates=FOCUSES.flatMap((focus,i)=>Array.from({length:7},(_,j)=>({...candidate,candidate_id:i+'-'+j,canonical_url:'https://example.org/'+i+'/'+j,focus})));
 const result=await runSelectiveResearch(candidates,{now,cache:new RetrievalCache({now:()=>now}),fetcher:async()=>({text:source.text}),reviewer:async(c)=>({...review,confidence:c.focus===FOCUSES[2]?'low':'high'})});
 assert.equal(result.processed.length,12);assert.equal(result.sufficiency.sufficient,false);assert.equal(result.telemetry.research.hard_stop_reason,'deep_exception_ceiling');
 assert.equal(result.selection_status,'requires_targeted_exception_or_additional_evidence');assert.ok(result.deferred.length>0);
});
test('selective research processes primary-window candidates before fallback leads in every focus',async()=>{
 const candidates=FOCUSES.flatMap((focus,i)=>[
  {...candidate,candidate_id:i+'-fallback',canonical_url:'https://example.org/'+i+'/fallback',published_at:'2026-09-13T10:00:00Z',focus},
  ...Array.from({length:4},(_,j)=>({...candidate,candidate_id:i+'-fresh-'+j,canonical_url:'https://example.org/'+i+'/fresh/'+j,focus}))
 ]);
 const result=await runSelectiveResearch(candidates,{now,cache:new RetrievalCache({now:()=>now}),fetcher:async()=>({text:source.text}),reviewer:async()=>review});
 assert.equal(result.processed.length,9);assert.ok(result.processed.every(id=>id.includes('-fresh-')));assert.equal(result.plan.fallback.length,3);
});
