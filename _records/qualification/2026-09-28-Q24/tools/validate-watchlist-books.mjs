import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateWatchlist,watchlistDailySummary} from '../../../../_generator/lib/watchlist.mjs';
import {watchlistDeltaPlan} from '../../../../_generator/lib/watchlist-delta.mjs';
import {validateEmergingSignalSweep} from '../../../../_generator/lib/emerging-signal-sweep.mjs';
import {validateBookReading} from '../../../../_generator/lib/book-reading.mjs';
const base='_records/qualification/2026-09-28-Q24',dir=base+'/watchlist-book-evidence';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');
const r=read(dir+'/editorial-review.json'),capture=read(dir+'/source-capture.json');
const sourceDir=process.env.Q24_SOURCE_DIR||'/tmp/q24-watchlist-book-sources';
const checks=[];
function check(name,fn){fn();checks.push({name,result:'pass'});}
function rejects(name,fn){check(name,()=>assert.throws(fn));}
function verifyBindings(x){
 assert.equal(x.qualification_id,'2026-09-28-Q24');
 assert.equal(x.cutoff,'2026-09-28T20:04:36Z');
 assert.equal(x.baseline_sha,'1def5c4ba158247a9c02106dc4e4820d80a7133d');
 assert.equal(x.article_freshness_policy,'article-24-72-168-v1');
 assert.equal(x.media_freshness_policy,'media-research-cutoff-v1');
 for(const [p,h]of Object.entries(x.frozen_git_blobs))assert.equal(blob(fs.readFileSync(p)),h,p);
 assert.equal(hash(fs.readFileSync(x.preservation_baseline.path)),x.preservation_baseline.sha256);
 assert.equal(hash(fs.readFileSync('_data/watchlist.json')),x.public_watchlist_sha256);
 assert.equal(hash(fs.readFileSync('_data/book-reading.json')),x.book_catalog_sha256);
 assert.equal(hash(fs.readFileSync(dir+'/source-capture.json')),x.source_capture_sha256);
 assert.equal(hash(fs.readFileSync(path.join(sourceDir,'source-capture.json'))),x.source_capture_sha256);
 assert(!fs.existsSync(base+'/result.json'),'Q24 already terminal');
}
check('frozen components, policies and preservation baselines',()=>verifyBindings(r));
const py=String.raw`
import json,pathlib,sys,hashlib
from html.parser import HTMLParser
import pypdf
assert pypdf.__version__=='5.9.0'
root=pathlib.Path(sys.argv[1]);record=json.loads((root/'source-capture.json').read_text())
class Visible(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.parts=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ('script','style'):self.skip+=1
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip=max(0,self.skip-1)
 def handle_data(self,d):
  if not self.skip:self.parts.append(d)
texts={};extractions={}
for row in record['outcomes']:
 assert row['status']=='captured',row
 file=root/row['artifact_file'];raw=file.read_bytes()
 assert hashlib.sha256(raw).hexdigest()==row['sha256'],row['source_id']
 if file.suffix=='.pdf':
  pdf=pypdf.PdfReader(file);text='\n\f\n'.join(page.extract_text() or '' for page in pdf.pages)
  extra={'pages':len(pdf.pages),'sha256':hashlib.sha256(text.encode()).hexdigest(),'title':str(pdf.metadata.title or ''),'method':'pypdf 5.9.0'}
  extra['contains_toc']='Table of Contents' in text
  extractions[row['source_id']]=extra
 elif row['source_id'] in ('clm','clm-commit'):text=raw.decode('utf-8')
 else:
  parser=Visible();parser.feed(raw.decode('utf-8'));text=' '.join(parser.parts)
 texts[row['source_id']]=text
print(json.dumps({'texts':texts,'extractions':extractions}))
`;
const extracted=JSON.parse(execFileSync('python3',['-c',py,sourceDir],{encoding:'utf8',maxBuffer:8*1024*1024}));
const norm=s=>String(s).replace(/\s+/g,' ').trim();
function excerpt(source,text){assert(norm(extracted.texts[source]).includes(norm(text)),`unbound excerpt: ${source}: ${text}`);}
function beforeCutoff(stamp){assert(Number.isFinite(Date.parse(stamp))&&Date.parse(stamp)<=Date.parse(r.cutoff),'future or missing original time');}
check('nine raw source hashes and exact captured manifest',()=>assert.equal(capture.outcomes.length,9));
check('original arXiv v1 and pinned CLM timestamps',()=>{
 excerpt('agensh',r.source_review.agensh.title);excerpt('agensh',r.source_review.agensh.excerpt);
 excerpt('agensh','Tue, 22 Sep 2026 17:56:25 UTC');beforeCutoff(r.source_review.agensh.published_at);
 excerpt('clm',r.source_review.clm.excerpt);
 const commit=JSON.parse(extracted.texts['clm-commit']);assert.equal(commit.sha,r.source_review.clm.commit);
 assert.equal(commit.commit.committer.date,r.source_review.clm.evidence_available_at);beforeCutoff(commit.commit.committer.date);
});
check('exact PDF extraction and honest fourth-book evidence type',()=>{
 const pdf=r.source_review.pdf_extraction;
 assert.equal(extracted.extractions['prompt-guide-sample'].sha256,pdf.guide_text_sha256);
 assert.equal(extracted.extractions['learning-sample'].sha256,pdf.learning_text_sha256);
 assert.equal(extracted.extractions['prompt-guide-sample'].pages,6);assert(extracted.extractions['prompt-guide-sample'].contains_toc);
 assert.match(extracted.extractions['prompt-guide-sample'].title,/Release 11/);
 assert.equal(extracted.extractions['learning-sample'].pages,6);assert(!extracted.extractions['learning-sample'].contains_toc);
 assert(capture.outcomes.filter(x=>x.source_id.endsWith('-sample')).every(x=>x.extraction_status==='pdftotext_unavailable'));
 excerpt('learning-sample',r.book_inventory.find(x=>x.source_id==='learning-sample').verified_section);
});
const prior=read(r.preservation_baseline.path),semantic=read(base+'/semantic-receipt.json');
const facts=new Map(read('_records/discovery-preflight/result/article-evidence.json').model_visible.map(x=>[x.candidate_id,x]));
const videos=read(base+'/media-evidence/video-selection.json'),podcasts=read(base+'/media-evidence/podcast-selection.json');
for(const x of [semantic,videos,podcasts])assert.equal(x.cutoff,r.cutoff);
assert.deepEqual(semantic.selection.map(x=>x.candidate_id),['m04','m03','m05','m06','m01','m09']);
const next=structuredClone(prior);next.edition_date='2026-09-28';next.updated_at=r.reviewed_at;
next.baseline_note=r.preservation_baseline.reason;next.coverage_status='degraded';
for(const change of r.watchlist_updates){
 const t=next.topics.find(x=>x.topic_id===change.topic_id);assert(t,'unknown topic');
 assert(!t.evidence.some(x=>x.development_id===change.development_id),'duplicate development');
 let evidence;
 if(change.candidate_id){
  const f=facts.get(change.candidate_id);assert(['m03','m04'].includes(change.candidate_id));beforeCutoff(f.published_at);
  evidence={title:f.headline,url:f.canonical_url,publisher:f.publisher,kind:'primary',publication_date:f.published_at.slice(0,10),checked_at:r.reviewed_at,development_id:change.development_id,review_depth:'Frozen Q24 publisher excerpt; no new article retrieval'};
 }else{
  assert.equal(change.source_id,'clm');
  evidence={title:change.evidence_title,url:change.evidence_url,publisher:change.publisher,kind:'primary',publication_date:change.publication_date,checked_at:r.reviewed_at,development_id:change.development_id,review_depth:r.source_review.clm.scope};
 }
 Object.assign(t,change.semantic_fields);t.evidence.push(evidence);t.updated_at=r.reviewed_at;
 if(change.source_id==='clm'){
  t.rubric.momentum={score:null,reason:'No new comparable attention measurements.'};
  t.rubric.independence={score:2,reason:'Two distinct first-party implementations, not independent benchmark reproductions.'};
 }
}
const fresh=structuredClone(r.new_topic);fresh.first_detected=r.reviewed_at;fresh.updated_at=r.reviewed_at;
fresh.evidence=[{title:r.source_review.agensh.title,url:'https://arxiv.org/abs/2609.26781v1',publisher:'Agensh authors / arXiv',kind:'primary',publication_date:r.source_review.agensh.published_at.slice(0,10),checked_at:r.reviewed_at,development_id:'agensh-v1-2026-09-22',review_depth:r.source_review.agensh.scope}];
next.topics.push(fresh);next.daily_summary=watchlistDailySummary(next);
const delta=watchlistDeltaPlan(prior.topics,next.topics);
function verifyPreservation(value){
 const plan=watchlistDeltaPlan(prior.topics,value.topics);
 assert.deepEqual(plan.removed_topics,[]);
 assert.deepEqual([...plan.changed_topics].sort(),[...r.watchlist_updates.map(x=>x.topic_id),r.new_topic.topic_id].sort());
 for(const id of delta.carried_topics)assert.deepEqual(value.topics.find(x=>x.topic_id===id),prior.topics.find(x=>x.topic_id===id),id);
 for(const old of prior.topics){const updated=value.topics.find(x=>x.topic_id===old.topic_id);for(const e of old.evidence)assert(updated.evidence.some(x=>JSON.stringify(x)===JSON.stringify(e)),'prior evidence lost');}
}
check('released watchlist validator and exact 1/3/13 daily delta',()=>{
 assert.deepEqual(validateWatchlist(next),[]);assert.deepEqual(next.daily_summary,{new_today:1,updated_today:3,carried_forward:13});
 verifyPreservation(next);assert.equal(delta.carried_topics.length,13);
});
check('Qoder is preserved without another development or timestamp',()=>{
 const t=next.topics.find(x=>x.topic_id==='dab-topic-agent-skills-observability');
 assert(t.evidence.some(x=>x.development_id==='qoder-skill-evolution-0.4.1'));
 assert(!delta.changed_topics.includes(t.topic_id));
});
const sweep=structuredClone(r.emerging_sweep);
sweep.assisted_search_query_count=sweep.assisted_search_queries.length;
sweep.surfaces=sweep.surfaces.map(s=>({...s,queries:s.query_indices.map(i=>sweep.assisted_search_queries[i]),candidates_found:s.surfaced_examples.length,count_scope:'Relevant surfaced concepts inspected, not total engine hits'}));
check('released emerging sweep validator; eight queries and degraded coverage retained',()=>{
 assert.equal(sweep.assisted_search_query_count,8);assert.deepEqual(validateEmergingSignalSweep(sweep,{editionDate:'2026-09-28'}),[]);
 assert.equal(sweep.zero_new_certified,false);assert.equal(sweep.overall_coverage,'degraded');
});
const book=read('_data/book-reading.json'),oldBook=structuredClone(book);
for(const ref of r.book_references){assert(!book.references[ref.id]);excerpt(ref.source_id,ref.section_title);book.references[ref.id]=ref;}
excerpt('reliable',book.references['reliable-verification'].section_title);
const storyId=id=>'dab-story-2026-09-28-'+hash(Buffer.from('2026-09-28|'+id)).slice(0,8);
const envelope={brief_date:'2026-09-28',stories:semantic.selection.map(x=>({story_id:storyId(x.candidate_id)})),worth_watching:videos.worth_watching,podcasts:[]};
// Only story/video bridges are selected. Podcast decisions are checked by frozen
// candidate identity; no unfinalized canonical podcast IDs are invented here.
const expected=[...semantic.selection.map(x=>'article:'+x.candidate_id),...Object.values(videos.worth_watching).map(x=>'video:'+x.candidate_id),...podcasts.selection.selected.map(x=>'podcast:'+x.candidate_id)].sort();
check('all ten frozen items reviewed against four-book inventory',()=>{
 assert.equal(r.book_inventory.length,4);
 assert.deepEqual(r.book_item_reviews.map(x=>x.kind+':'+x.candidate_id).sort(),expected);
 assert.equal(new Set(expected).size,10);
 for(const x of r.book_item_reviews){assert(['include','omit'].includes(x.disposition));assert(x.disposition==='include'?x.why:x.reason);}
});
book.editions['2026-09-28']=r.book_item_reviews.filter(x=>x.disposition==='include').map(x=>{
 let id;
 if(x.kind==='article'){assert(semantic.selection.some(y=>y.candidate_id===x.candidate_id));id=storyId(x.candidate_id);}
 else{assert.equal(x.kind,'video');assert.equal(videos.worth_watching[x.slot].candidate_id,x.candidate_id);id='dab-video-2026-09-28-'+(x.slot==='general'?'general':'agent-skills');}
 return {item_id:id,reference_id:x.reference_id,label:'READ DEEPER',why:x.why};
});
check('released reader-bridge validator; historical catalog preserved; seven links across three books',()=>{
 validateBookReading(envelope,book);
 assert.equal(book.editions['2026-09-28'].length,7);
 assert.equal(new Set(book.editions['2026-09-28'].map(x=>book.references[x.reference_id].book)).size,3);
 for(const [date,items]of Object.entries(oldBook.editions))assert.deepEqual(book.editions[date],items);
 for(const [id,ref]of Object.entries(oldBook.references))assert.deepEqual(book.references[id],ref);
 assert.equal(r.private_book_change_evaluation.evaluation_completed,false);assert.equal(r.private_book_change_evaluation.proposal_count,null);
});
rejects('reject changed cutoff',()=>verifyBindings({...r,cutoff:'2026-09-28T23:59:00Z'}));
rejects('reject changed source digest',()=>verifyBindings({...r,source_capture_sha256:'0'.repeat(64)}));
rejects('reject fabricated literal excerpt',()=>excerpt('agensh','This benchmark was independently reproduced by the Daily AI Brief.'));
rejects('reject future evidence timestamp',()=>beforeCutoff('2026-09-29T00:00:00Z'));
rejects('reject unknown book reference',()=>{const b=structuredClone(book);b.editions['2026-09-28'][0].reference_id='imaginary';validateBookReading(envelope,b);});
rejects('reject duplicate book placement',()=>{const b=structuredClone(book);b.editions['2026-09-28'].push({...b.editions['2026-09-28'][0]});validateBookReading(envelope,b);});
rejects('reject relabeled unsupported book evidence type',()=>{const b=structuredClone(book);b.references[b.editions['2026-09-28'][0].reference_id].evidence_level='public sample section';validateBookReading(envelope,b);});
rejects('reject invented practice',()=>{const b=structuredClone(book);b.editions['2026-09-28'][0].practice='Unverified exercise';validateBookReading(envelope,b);});
rejects('reject non-Leanpub book destination',()=>{const b=structuredClone(book);b.references[b.editions['2026-09-28'][0].reference_id].url='https://example.com/book';validateBookReading(envelope,b);});
rejects('reject unknown reader item',()=>{const b=structuredClone(book);b.editions['2026-09-28'][0].item_id='imaginary-item';validateBookReading(envelope,b);});
rejects('reject invented book section',()=>excerpt('context','Guaranteed Agent Safety in Every Deployment'));
rejects('reject watchlist topic without primary evidence',()=>{const v=structuredClone(next);v.topics.at(-1).evidence=[];assert.deepEqual(validateWatchlist(v),[]);});
rejects('reject invented momentum',()=>{const v=structuredClone(next);v.topics.at(-1).momentum.classification='rising';assert.deepEqual(validateWatchlist(v),[]);});
rejects('reject false zero-new certificate',()=>assert.deepEqual(validateEmergingSignalSweep({...sweep,zero_new_certified:true}),[]));
rejects('reject omitted missed-signal check',()=>assert.deepEqual(validateEmergingSignalSweep({...sweep,missed_signal_check:{completed:false,lookback_days:14}}),[]));
rejects('reject removed prior topic',()=>{const v=structuredClone(next);v.topics.shift();verifyPreservation(v);});
rejects('reject retimed carried topic',()=>{const v=structuredClone(next);v.topics.find(x=>x.topic_id===delta.carried_topics[0]).updated_at=r.reviewed_at;verifyPreservation(v);});
const testPath=process.env.Q24_TEST_LOG||'/tmp/q24-watchlist-book-validation/targeted-tests.tap';
const tap=fs.readFileSync(testPath,'utf8');assert.match(tap,/# fail 0(?:\r?\n|$)/);const count=Number(tap.match(/# tests (\d+)/)?.[1]);assert(count>0);
verifyBindings(r);
const outputs={'watchlist-selection.json':next,'watchlist-delta.json':delta,'emerging-signal-sweep.json':sweep,'book-reading-selection.json':book};
for(const [name,value]of Object.entries(outputs)){assert(!fs.existsSync(dir+'/'+name),'Do not overwrite accepted evidence');fs.writeFileSync(dir+'/'+name,JSON.stringify(value,null,2)+'\n');}
const receipt={schema_version:'1.0.0',qualification_id:r.qualification_id,baseline_sha:r.baseline_sha,cutoff:r.cutoff,article_freshness_policy:r.article_freshness_policy,media_freshness_policy:r.media_freshness_policy,workflow_run_id:process.env.GITHUB_RUN_ID||null,execution_commit:process.env.GITHUB_SHA||null,validated_at:new Date().toISOString(),result:'pass',scope:'Watchlist and reader-book components only; not final edition, protected release CI, assembled media gate, private book-change evaluation, qualification closure or publication.',watchlist_daily_summary:next.daily_summary,watchlist_coverage_status:'degraded',book_items_evaluated:10,books_considered:4,reader_bridges_selected:7,books_linked:3,book_contract_gap:'Learning Ecosystem has verified public sample content but no public table of contents in captured evidence; do not mislabel.',private_book_change_evaluation:r.private_book_change_evaluation,source_artifact_id:r.source_artifact_id,source_artifact_sha256:r.source_artifact_sha256,source_capture_sha256:r.source_capture_sha256,review_sha256:hash(fs.readFileSync(dir+'/editorial-review.json')),output_sha256:Object.fromEntries(Object.keys(outputs).map(n=>[n,hash(fs.readFileSync(dir+'/'+n))])),checks,checks_passed:checks.length,targeted_existing_tests_passed:count,targeted_test_log_sha256:hash(Buffer.from(tap)),pdf_extractions:extracted.extractions,article_and_media_components_reused:true,media_ready:false,images_started:false,qualification_terminal:false,new_publisher_requests:0,model_api_calls:0,production_mutation:false,account_billing_observed:false,final_gate_obligation:'Revalidate these projections against the complete final edition and its canonical media IDs. Do not treat the minimal story/video bridge identity envelope as an assembled edition.'};
fs.writeFileSync(dir+'/validation.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
