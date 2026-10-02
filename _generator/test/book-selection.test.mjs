import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SERIES_BOOKS,MATCH_DIMENSIONS,bookItems,bookSelectionPlan,selectBookReferences,recentBookUse,validateBookCatalog,bookCoverageMetrics} from '../lib/book-selection.mjs';
import {validateBookReading} from '../lib/book-reading.mjs';
const catalog=JSON.parse(fs.readFileSync('_data/book-reading.json','utf8'));
const edition={brief_date:'2026-09-30',stories:[{story_id:'story',headline:'An example mechanism'}],worth_watching:{general:{status:'included',title:'Video'},agents_non_technical_people:{status:'included',title:'Skills'}},podcasts:[{status:'included',item_id:'podcast',title:'Podcast'}]};
function reviewFor(data=catalog,ed=edition,winners={}){
 const p=bookSelectionPlan(ed,data);
 return {...p,items:p.items.map(i=>({item_id:i.item_id,scores:p.anchors.map(a=>({reference_id:a.id,...Object.fromEntries(Object.keys(MATCH_DIMENSIONS).map(k=>[k,(winners[i.item_id]||[]).includes(a.id)?4:0])),rationale:`${i.item_id}: ${a.section_title} supplies the directly relevant learning framework.`}))}))};
}
test('four books each have eight verified anchors; sample headings have source provenance',()=>{
 assert.deepEqual(validateBookCatalog(catalog),[]);
 for(const b of SERIES_BOOKS)assert.equal(Object.values(catalog.references).filter(r=>r.book===b).length,8);
 for(const r of Object.values(catalog.references).filter(r=>r.verified_date==='2026-09-30')){
  assert.equal(r.verification.heading,r.section_title);assert.ok(r.verification.source_location);
  if(r.verification.source_url.endsWith('.pdf'))assert.match(r.verification.sha256,/^[a-f0-9]{64}$/);
 }
});
test('all four books can win semantic selection across articles, both videos and podcasts',()=>{
 const ids=bookItems(edition).map(i=>i.item_id),winners=Object.fromEntries(ids.map((id,i)=>[id,[Object.values(catalog.references).find(r=>r.book===SERIES_BOOKS[i]).id]]));
 const result=selectBookReferences(edition,catalog,reviewFor(catalog,edition,winners));
 assert.equal(result.selections.length,4);assert.equal(result.metrics.books_available,4);assert.equal(result.metrics.books_considered,4);
 assert.equal(result.metrics.anchors_considered,32);assert.equal(result.metrics.item_anchor_pairs_considered,128);assert.equal(result.metrics.books_selected.length,4);
 const saved=structuredClone(catalog);saved.editions[edition.brief_date]=result.selections;saved.selection_reviews={[edition.brief_date]:reviewFor(catalog,edition,winners)};
 assert.doesNotThrow(()=>validateBookReading(edition,saved));saved.editions[edition.brief_date].push(result.selections[0]);assert.throws(()=>validateBookReading(edition,saved),/duplicate/);
});
test('missing anchor, missing item, duplicate, stale evidence and invalid score cannot bypass selection',()=>{
 for(const mutate of [r=>r.items[0].scores.pop(),r=>r.items.pop(),r=>r.items[0].scores[1]=r.items[0].scores[0],r=>r.catalog_digest='stale',r=>r.items[0].scores[0].reader_value=NaN]){
  const r=reviewFor();mutate(r);assert.throws(()=>selectBookReferences(edition,catalog,r));
 }
 const changed=structuredClone(edition);changed.stories[0].headline='Different facts';assert.throws(()=>selectBookReferences(changed,catalog,reviewFor()),/match current/);
});
test('recent-use penalty breaks relevance ties but never overrides a higher score',()=>{
 const ed={...edition,worth_watching:{},podcasts:[]},data=structuredClone(catalog);
 const a='reliable-verification',b='prompt-pattern-selection';
 data.editions['2026-09-29']=[{item_id:'prior',reference_id:a}];
 let r=reviewFor(data,ed,{story:[a,b]});assert.equal(selectBookReferences(ed,data,r).selections[0].reference_id,b);
 r.items[0].scores.find(s=>s.reference_id===b).topic=3;
 assert.equal(selectBookReferences(ed,data,r).selections[0].reference_id,a);
});
test('no forced match; usage uses prior editions only, repeated chapters warn and missing books are visible',()=>{
 assert.equal(selectBookReferences(edition,catalog,reviewFor()).selections.length,0);
 const data=structuredClone(catalog);data.editions['2026-09-30']=[{reference_id:'prompt-pattern-selection'}];
 const history=recentBookUse(data,'2026-09-30');assert.equal(history.editions.length,7);assert.ok(!history.editions.includes('2026-09-30'));
 data.editions['2026-09-29']=Array.from({length:12},(_,i)=>({item_id:'prior-'+i,reference_id:'context-quality-checklist'}));
 const metrics=bookCoverageMetrics(data,'2026-09-30',[{reference_id:'context-quality-checklist'}]);
 assert.equal(metrics.repeated_anchors,1);assert.ok(metrics.concentration_warnings.some(w=>w.kind==='chapter'));
 for(const [id,r] of Object.entries(data.references))if(r.book===SERIES_BOOKS[3])delete data.references[id];
 assert.equal(bookCoverageMetrics(data,'2026-09-30',[]).catalog_incomplete,true);assert.ok(validateBookCatalog(data).length);
});
test('later verified anchors do not invalidate an already-reviewed historical edition',()=>{
 const review=reviewFor(),expanded=structuredClone(catalog);
 expanded.references['later-anchor']={...expanded.references['prompt-pattern-selection'],id:'later-anchor',verified_date:'2026-10-01'};
 assert.deepEqual(selectBookReferences(edition,expanded,review),selectBookReferences(edition,catalog,review));
 assert.equal(bookSelectionPlan({...edition,brief_date:'2026-10-01'},expanded).anchors.length,33);
});

test('selected book rationale rejects internal review or run language',()=>{
 const ed={...edition,brief_date:'2026-10-02',worth_watching:{},podcasts:[]};
 const winner='reliable-verification';
 const review=reviewFor(catalog,ed,{story:[winner]});
 review.items.find(x=>x.item_id==='story').scores.find(x=>x.reference_id===winner).rationale='Run 5 all-four-book review selected this verified section as a direct mechanism and reader-value match for the item.';
 assert.throws(()=>selectBookReferences(ed,catalog,review),/short reader-facing connection/);
});
