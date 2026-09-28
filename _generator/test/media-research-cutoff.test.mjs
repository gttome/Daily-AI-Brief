import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MEDIA_FRESHNESS_POLICY as POLICY, explicitMediaTimestamp, mediaReferenceTime} from '../lib/media-freshness.mjs';
import {selectPodcasts, selectVideo, VIDEO_MAX_AGE_HOURS, PODCAST_PRIMARY_AGE_DAYS, PODCAST_FALLBACK_AGE_DAYS, PODCAST_EXCEPTION_AGE_DAYS} from '../lib/media-selection.mjs';
import {validateEdition} from '../lib/validate.mjs';
import {expandEditorialKernel, validateEditorialKernel, STORY_FOCUSES} from '../lib/editorial-kernel.mjs';

const date='2026-09-28',cutoff='2026-09-28T19:10:36Z',options={date,cutoff,policy:POLICY};
const publicationAtAge=hours=>new Date(Date.parse(cutoff)-hours*3600000).toISOString();
const podcast=(overrides={})=>({url:'https://example.org/podcast/1',show:'Test Show A',publication_date:'2026-09-28T11:00:00Z',runtime_seconds:1853,verified:true,editorial_pass:true,duplicate:false,score:90,...overrides});
const video=(overrides={})=>({url:'https://example.org/video/1',slot:'general',upload_date:'2026-09-28T11:00:00Z',runtime_seconds:600,verified:true,editorial_pass:true,duplicate:false,score:90,...overrides});

test('Q23 same-day podcast is accepted against the recorded cutoff, not midnight',()=>{
 const item=podcast({url:'https://podcasts.apple.com/us/podcast/ep-871-desktop-agent-lingo-simplified-goals-loops-plans/id1683401861?i=1000792012779'});
 assert.equal(selectPodcasts([item],{date}).selected.length,0);
 const current=selectPodcasts([item],options);
 assert.equal(current.selected.length,1);
 assert.equal(current.selected[0].publication_date,item.publication_date);
 assert.equal(current.selected[0].freshness_tier,'primary_48h');
 assert.equal(current.research_cutoff_at,cutoff);
 assert.equal(current.media_freshness_policy,POLICY);
});

test('equivalent explicit offsets give the same media reference instant',()=>{
 assert.equal(mediaReferenceTime(options),mediaReferenceTime({...options,cutoff:'2026-09-28T14:10:36-05:00'}));
 assert.equal(mediaReferenceTime({date}),Date.parse(date));
});

for(const bad of ['2026-09-28','2026-09-28T11:00:00','2026-02-30T11:00:00Z','not-a-date',null]){
 test('current media timestamp rejects unresolved or invalid value '+String(bad),()=>{
  assert.ok(Number.isNaN(explicitMediaTimestamp(bad)));
  assert.equal(selectPodcasts([podcast({publication_date:bad})],options).selected.length,0);
 });
}

for(const bad of [{...options,policy:'unknown'}, {...options,cutoff:null}, {...options,cutoff:'2026-09-29T00:00:00Z'}, {date,cutoff}]){
 test('invalid media policy or cutoff fails closed '+JSON.stringify(bad),()=>assert.throws(()=>selectPodcasts([],bad),/media_/));
}

for(const [age,tier] of [[0,'primary_48h'],[48,'primary_48h'],[48+1/3600,'fallback_7d'],[168,'fallback_7d'],[168+1/3600,'exception_30d'],[720,'exception_30d'],[720+1/3600,null],[-1/3600,null]]){
 test('podcast cutoff age boundary '+age,()=>{
  const item=podcast({publication_date:publicationAtAge(age),freshness_exception_reason:'A specifically documented older episode remains useful after primary-source review.'});
  const result=selectPodcasts([item],options);
  assert.equal(result.selected.length,tier?1:0);
  if(tier)assert.equal(result.selected[0].freshness_tier,tier);
 });
}

test('older podcasts still need an explicit fallback reason and distinct shows',()=>{
 const old=podcast({publication_date:publicationAtAge(49)});
 assert.equal(selectPodcasts([old],options).selected.length,0);
 const first=podcast(),same=podcast({url:'https://example.org/podcast/2'}),other=podcast({url:'https://example.org/podcast/3',show:'Test Show B'});
 const result=selectPodcasts([first,same,other],options);
 assert.equal(result.selected.length,2);
 assert.equal(new Set(result.selected.map(x=>x.show)).size,2);
});

for(const [age,eligible] of [[0,true],[72,true],[72+1/3600,false],[-1/3600,false]]){
 test('video uses the same recorded-cutoff boundary '+age,()=>{
  const item=video({upload_date:publicationAtAge(age)});
  assert.equal(Boolean(selectVideo([item],'general',date,{cutoff,policy:POLICY}).candidate),eligible);
 });
}

test('media age and video duration ceilings are unchanged',()=>{
 assert.deepEqual([VIDEO_MAX_AGE_HOURS,PODCAST_PRIMARY_AGE_DAYS,PODCAST_FALLBACK_AGE_DAYS,PODCAST_EXCEPTION_AGE_DAYS],[72,2,7,30]);
 assert.equal(selectVideo([video({runtime_seconds:1201})],'general',date,{cutoff,policy:POLICY}).candidate,null);
 assert.equal(selectVideo([video({runtime_seconds:1200})],'general',date,{cutoff,policy:POLICY}).duration_tier,'last_resort');
});

const historical=JSON.parse(fs.readFileSync(new URL('../../_data/editions/2026-09-26.json',import.meta.url),'utf8'));
const editionFixture=()=>({...structuredClone(historical),media_freshness_policy:POLICY,research_cutoff_at:historical.brief_date+'T19:10:36Z'});
const itemFreshnessErrors=(edition,prefix)=>validateEdition(edition).filter(e=>e.startsWith(prefix)&&/freshness|upload date/.test(e));

test('historical edition without media-policy identity remains valid and unchanged',()=>{
 const before=JSON.stringify(historical);
 assert.deepEqual(validateEdition(historical),[]);
 assert.equal(JSON.stringify(historical),before);
});

test('independent edition validator accepts exact same-day podcast timestamp',()=>{
 const e=editionFixture();e.podcasts[0].publication_date=e.brief_date+'T11:00:00Z';e.podcasts[0].freshness_tier='primary_48h';
 assert.deepEqual(itemFreshnessErrors(e,'podcasts[0]'),[]);
 delete e.media_freshness_policy;
 assert.ok(itemFreshnessErrors(e,'podcasts[0]').length>0);
});

test('independent edition validator accepts same-day video but rejects after-cutoff video',()=>{
 const e=editionFixture();e.worth_watching.general.upload_date=e.brief_date+'T11:00:00Z';
 assert.deepEqual(itemFreshnessErrors(e,'worth_watching.general'),[]);
 e.worth_watching.general.upload_date=e.brief_date+'T19:10:37Z';
 assert.ok(itemFreshnessErrors(e,'worth_watching.general').length>0);
});

test('edition validator rejects video aged past 72 hours even if midnight would admit it',()=>{
 const e=editionFixture();e.worth_watching.general.upload_date=new Date(Date.parse(e.research_cutoff_at)-72*3600000-1000).toISOString();
 assert.ok(itemFreshnessErrors(e,'worth_watching.general').length>0);
 delete e.media_freshness_policy;
 assert.deepEqual(itemFreshnessErrors(e,'worth_watching.general'),[]);
});

test('edition validator rejects a future podcast without changing its source timestamp',()=>{
 const e=editionFixture();e.podcasts[0].publication_date=e.brief_date+'T19:10:37Z';
 assert.ok(itemFreshnessErrors(e,'podcasts[0]').length>0);
});

test('edition validator rejects unknown policy and absent current cutoff',()=>{
 const e=editionFixture();e.media_freshness_policy='unrecognized';
 assert.ok(validateEdition(e).some(x=>x.includes('unknown_media_freshness_policy')));
 e.media_freshness_policy=POLICY;delete e.research_cutoff_at;
 assert.ok(validateEdition(e).some(x=>x.includes('media_same_edition_explicit_cutoff_required')));
});

test('kernel expansion preserves the media policy and the metadata cutoff',()=>{
 const facts={},images={},candidates=[];
 const kernel={schema_version:'1.0.0',brief_date:date,edition_id:'dab-edition-'+date,baseline_sha:'a'.repeat(40),normal_model_passes:1,normal_post_editorial_model_passes:0,media_freshness_policy:POLICY,editorial_takeaway:'A synthetic round-trip checks metadata preservation, not publication readiness.',media_decisions:{},changed_watchlist_topics:[],stories:[]};
 for(let i=0;i<6;i++){
  const id='m'+i,url='https://example.org/article/'+i;
  kernel.stories.push({story_id:'test-'+i,candidate_id:id,canonical_ordinal:i+1,focus:STORY_FOCUSES[Math.floor(i/2)],headline:'Synthetic story '+i,summary:'Synthetic summary has sufficient text for structural validation.',why_it_matters:'Synthetic explanation has sufficient text for structural validation.',editorial_limitation:'Synthetic fixture only.',visual:{},what_to_do_now:{action:'test',label:'Test',rationale:'Test the versioned media cutoff without changing source timestamps.'},agent_skill:i===4,topic_labels:['testing'],source_url:url});
  facts[id]={event_date:date,source:{url,title:'Synthetic source',organization:'Test',publication_date:date,evidence_type:'publisher_authored',availability_status:'available'}};
  images[id]={path:'briefs/images/'+date+'/'+id+'.png',alt:'Synthetic fixture'};
  candidates.push({candidate_id:id,canonical_url:url,published_at:date+'T10:00:00Z'});
 }
 const result=expandEditorialKernel(kernel,{candidateFacts:facts,imageAssets:images,metadataCandidates:{cutoff,candidates},media:{podcasts:[]},publishedAt:cutoff,coveragePeriod:'Synthetic test of immutable source timestamps and media cutoff.'});
 assert.equal(result.media_freshness_policy,POLICY);assert.equal(result.research_cutoff_at,cutoff);
 kernel.media_freshness_policy='unknown';
 assert.ok(validateEditorialKernel(kernel).includes('unknown_media_freshness_policy'));
});

test('edition schema permits only the explicit current media policy',()=>{
 const schema=JSON.parse(fs.readFileSync(new URL('../../_contracts/v1/edition.schema.json',import.meta.url),'utf8'));
 assert.deepEqual(schema.properties.media_freshness_policy.enum,[POLICY]);
 assert.ok(!schema.required.includes('media_freshness_policy'));
});
