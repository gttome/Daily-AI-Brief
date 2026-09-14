import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {scanHistoricalBriefs} from '../lib/historical.mjs';import {noveltyMatches} from '../lib/novelty.mjs';import {extractCandidateMetadata,extractMainText,publicationTimestamp} from '../../_tools/discovery-links.mjs';import {retainCandidates} from '../lib/discovery-queue.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
test('canonical history retains six real story identities and URLs after markup changes',()=>{
 const memory=scanHistoricalBriefs(root,'2026-09-14');
 for(const date of ['2026-09-11','2026-09-12','2026-09-13','2026-09-14']){
  const canonical=JSON.parse(fs.readFileSync(path.join(root,'_data/editions',date+'.json'))),items=memory.stories.filter(s=>s.brief_date===date);
  assert.equal(items.length,6);assert.deepEqual(items.map(x=>x.story_id),canonical.stories.map(x=>x.story_id));assert.ok(items.every(x=>x.normalized_urls.length===1));
 }
});
test('exact source repeat requires review even with entirely rewritten headline',()=>{
 assert.equal(noveltyMatches({concept_tokens:['new'],normalized_urls:['https://example.org/a']},[{story_id:'old',concept_tokens:['different'],normalized_urls:['https://example.org/a']}])[0].reason,'exact_source_requires_review');
});
test('article dates stay associated with the article and conflicts remain unresolved',()=>{
 const html='<a href="/unrelated">Unrelated agent page</a><script type="application/ld+json">'+JSON.stringify({'@type':'NewsArticle',url:'https://example.org/story',headline:'New workflow',datePublished:'2026-09-14',dateModified:'2026-09-15'})+'</script><meta property="og:url" content="https://example.org/story"><meta property="og:title" content="New workflow"><meta property="article:published_time" content="2026-09-13T12:00:00Z">';
 const out=extractCandidateMetadata(html,'https://example.org/');const story=out.find(x=>x.canonical_url.endsWith('/story'));
 assert.equal(story.published_at,null);assert.equal(story.date_conflict,true);assert.equal(story.updated_at,'2026-09-15T00:00:00.000Z');assert.equal(out.find(x=>x.canonical_url.endsWith('/unrelated')).published_at,null);
 assert.equal(publicationTimestamp('2026-02-30'),null);assert.equal(publicationTimestamp('2026-09-14T08:00:00'),null);assert.equal(publicationTimestamp('2026-09-14T08:00:00-05:00'),'2026-09-14T13:00:00.000Z');
});
test('HTML cards and functional video query parameters survive discovery',()=>{
 const out=extractCandidateMetadata('<article><h2><a href="https://youtube.com/watch?v=abc&amp;utm_source=x">Reusable agent workflow</a></h2><time datetime="2026-09-14"></time></article>','https://example.org/');
 assert.equal(out.length,1);assert.equal(out[0].canonical_url,'https://youtube.com/watch?v=abc');assert.equal(out[0].published_at,'2026-09-14T00:00:00.000Z');
});
test('queue retention is stable across completion ordering and preserves distinct video identities',()=>{
 const items=Array.from({length:12},(_,i)=>({url:'https://youtube.com/watch?v='+i,source_id:'source-'+i%3,headline:'Candidate '+i,published_at:i%2?'2026-09-14':null}));
 const a=retainCandidates(items,{limit:5}),b=retainCandidates([...items].reverse(),{limit:5});assert.deepEqual(a,b);assert.equal(a.retention.overflow.length,7);assert.equal(new Set(a.candidates.map(x=>x.source_id)).size,3);
});
test('main-text extraction keeps evidence and removes page furniture without claiming review',()=>{
 const x=extractMainText('<nav>Noise</nav><article><h1>Trial</h1><table><tr><td>12</td><td>tasks</td></tr></table><p>Limit: synthetic tests only.</p><pre>config=sample</pre></article><footer>Noise</footer>');
 assert.match(x.text,/12 tasks/);assert.match(x.text,/synthetic tests/);assert.match(x.text,/config=sample/);assert.doesNotMatch(x.text,/Noise/);assert.equal(x.main_text_verified,false);assert.equal(x.reading_minutes,null);
});
import {DiscoveryAcquisition} from '../../_tools/discovery-context.mjs';import {RetrievalCache} from '../lib/research.mjs';import {evidenceViews,completionDecision,assertRunManifest} from '../lib/production-run.mjs';
test('actual catalog and Watchlist registries share 59 cold acquisitions, and warm reads fetch none',async()=>{
 const reg=JSON.parse(fs.readFileSync(path.join(root,'_data/source-registry.json'))),watch=JSON.parse(fs.readFileSync(path.join(root,'_data/watchlist-sources.json'))),early=JSON.parse(fs.readFileSync(path.join(root,'_data/early-signal-sources.json')));
 const extra=early.channels.flatMap(c=>c.endpoints).filter(x=>x.automated).map(x=>x.url);
 const a=[...new Set([...reg.sources.filter(s=>s.status==='active'&&s.discovery_endpoint).map(x=>x.discovery_endpoint),...extra])],b=[...new Set([...watch.sources.filter(s=>s.automated!==false&&s.endpoint).map(x=>x.endpoint),...extra])];
 let calls=0;const acquisition=new DiscoveryAcquisition({cache:new RetrievalCache(),fetcher:async url=>{calls++;return {text:'Evidence',url};}});
 await Promise.all([...a,...b].map(u=>acquisition.retrieve(u)));assert.equal(a.length+b.length,87);assert.equal(calls,59);
 await Promise.all([...a,...b].map(u=>acquisition.retrieve(u)));assert.equal(calls,59);
});
test('one denied source does not trigger repeated retrieval in the other consumer',async()=>{
 let calls=0;const a=new DiscoveryAcquisition({fetcher:async()=>{calls++;throw Error('HTTP 403');}});
 await Promise.allSettled([a.retrieve('https://example.org/no'),a.retrieve('https://example.org/no')]);await assert.rejects(a.retrieve('https://example.org/no'));assert.equal(calls,1);
});
test('monitoring completion requires successful Pages for the expected edition and deduplicates revisions',()=>{
 const editionDate='2026-09-14',completion={edition_id:'dab-edition-'+editionDate,phase:'pages_verified',commit_sha:'a'.repeat(40),pages:{conclusion:'success'}};
 assert.equal(completionDecision({editionDate,completion:null}).state,'pending');assert.equal(completionDecision({editionDate:'2026-09-15',completion}).state,'pending');
 const first=completionDecision({editionDate,completion});assert.equal(first.collect,true);const again=completionDecision({editionDate,completion,lastProcessed:first.key});assert.equal(again.collect,false);assert.equal(again.research,false);assert.equal(again.publish,false);
});
test('compact stage views retain claim excerpts and limitations without claiming model savings',()=>{
 const packets=[{candidate_id:'a',verification_status:'reviewed',source_content_hash:'hash',verified_claims:[{claim:'A bounded result',evidence:'In a synthetic test only.'}],limitations:['Not independently replicated'],availability:'preview'}];
 const r=evidenceViews(packets);assert.deepEqual(r.views.writing[0].limitations,packets[0].limitations);assert.equal(r.views.editorial_qa[0].claims[0].evidence,'In a synthetic test only.');assert.equal(r.telemetry.actual_model_input_chars,null);assert.equal(r.views.images[0].review_status,'pending_visual_brief_review');
});

import os from 'node:os';import {assertPrivateRoot} from '../lib/production-run.mjs';
test('private evidence cannot use the repository, its ancestor, or a public manifest',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-private-'));
 try{const repo=path.join(dir,'repo'),privateRoot=path.join(dir,'private');fs.mkdirSync(repo);fs.mkdirSync(privateRoot);
 assert.equal(assertPrivateRoot(repo,privateRoot,path.join(privateRoot,'run.json')),fs.realpathSync(privateRoot));
 assert.throws(()=>assertPrivateRoot(repo,repo,path.join(repo,'run.json')));
 assert.throws(()=>assertPrivateRoot(repo,dir,path.join(dir,'run.json')));
 assert.throws(()=>assertPrivateRoot(repo,privateRoot,path.join(repo,'run.json')));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('a successful forced retry clears the prior in-process retrieval failure',async()=>{
 let denied=true,calls=0;const a=new DiscoveryAcquisition({fetcher:async url=>{calls++;if(denied)throw Error('HTTP 403');return {url,text:'Evidence'};}});
 await assert.rejects(a.retrieve('https://example.org/retry'));denied=false;await a.retrieve('https://example.org/retry',{force:true});await a.retrieve('https://example.org/retry');assert.equal(calls,2);
});
