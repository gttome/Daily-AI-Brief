import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderReadingSupport,readingMinutes,sourceReadingMinutes,validateReadingSupport} from '../lib/reading-support.mjs';
import {readerFoundationFiles} from '../lib/reader.mjs';
const edition=JSON.parse(fs.readFileSync(new URL('../../_data/editions/2026-09-12.json',import.meta.url)));
test('September 30 recovery has estimates on every brief and permanent article page',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-30.json'));
 const files=readerFoundationFiles(current,process.cwd());
 validateReadingSupport(current);
 for(const story of current.stories){
  const label=`Source article · about ${sourceReadingMinutes(story)} min read`;
  assert.ok(sourceReadingMinutes(story)>0);
  assert.ok(renderReadingSupport(story,story.story_id,current.brief_date).includes(label));
  assert.ok(files.get(`stories/${current.brief_date}/${story.slug}.md`).includes(label));
 }
 const missing={editions:{},source_reading:{}};
 assert.throws(()=>validateReadingSupport(current,missing),/verified full-source reading evidence required/);
 const wrongUrl=JSON.parse(fs.readFileSync('_data/reading-support.json'));
 wrongUrl.source_reading[current.stories[0].story_id].source_url='https://example.com/unrelated';
 assert.throws(()=>validateReadingSupport(current,wrongUrl),/verified full-source reading evidence required/);
 const embedded=structuredClone(current);
 for(const story of embedded.stories)story.source.reading_evidence={status:'verified',word_count:800,verified_at:'2026-10-01T12:00:00Z',method:'retrieved_source_text_whitespace_v1'};
 assert.doesNotThrow(()=>validateReadingSupport(embedded,missing));
 const reviewedWithoutEstimate=structuredClone(current);
 for(const story of reviewedWithoutEstimate.stories)story.source.reading_evidence={status:'verified',word_count:null,verified_at:'2026-10-03T06:21:26.732Z',method:'full indexed source-body review',full_source_read:true};
 assert.doesNotThrow(()=>validateReadingSupport(reviewedWithoutEstimate,missing));
 assert.equal(sourceReadingMinutes(reviewedWithoutEstimate.stories[0],reviewedWithoutEstimate.stories[0].story_id,missing),null);
 reviewedWithoutEstimate.stories[0].source.reading_evidence.full_source_read=false;
 assert.throws(()=>validateReadingSupport(reviewedWithoutEstimate,missing),/verified full-source reading evidence required/);
});
test('October 3 overview and permanent pages show article reading times and podcast runtimes',async()=>{
 const {renderBody}=await import('../lib/render.mjs');
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-10-03.json'));
 const body=renderBody(current),files=readerFoundationFiles(current,process.cwd());
 const overview=body.match(/<section class="edition-overview"[\s\S]*?<\/section>/)[0];
 for(const story of current.stories){
  const minutes=sourceReadingMinutes(story);
  assert.ok(minutes>0,story.story_id);
  assert.ok(overview.includes(`Article · about ${minutes} min source read`),story.story_id);
  assert.ok(body.includes(`Source article · about ${minutes} min read`),story.story_id);
  assert.ok(files.get(`stories/2026-10-03/${story.slug}.md`).includes(`Source article · about ${minutes} min read`),story.story_id);
 }
 assert.match(overview,/Podcast · 1:28:30/);
 assert.match(overview,/Podcast · 56:16/);
 assert.match(files.get('podcasts/2026-10-03/run7-1.md'),/\*\*Duration:\*\* 1:28:30/);
});

test('October 4 and later require a verified reading-time estimate for every article',()=>{
 const future=JSON.parse(fs.readFileSync('_data/editions/2026-10-03.json'));
 future.brief_date='2026-10-04';
 for(const story of future.stories)story.source.reading_evidence={...story.source.reading_evidence,status:'verified',reading_minutes:5,word_count:null,verified_at:'2026-10-03T18:30:00Z',method:'verified estimate',full_source_read:true};
 const data={editions:{},source_reading:{}};
 assert.doesNotThrow(()=>validateReadingSupport(future,data));
 delete future.stories[0].source.reading_evidence.reading_minutes;
 assert.throws(()=>validateReadingSupport(future,data),/verified source reading time required/);
});

test('source estimates match the brief and all permanent shared article pages',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-13.json'));
 const files=readerFoundationFiles(current,process.cwd());
 for(const story of current.stories){const brief=renderReadingSupport(story,story.story_id,current.brief_date);const match=brief.match(/Source article · about \d+ min read/);assert.ok(match);assert.ok(files.get(`stories/2026-09-13/${story.slug}.md`).includes(match[0]));}
});
test('approved article and podcast context is safe and preserves uncertainty',()=>{
 validateReadingSupport(edition);
 const p=renderReadingSupport(edition.podcast,edition.podcast.item_id,edition.brief_date,'Podcast');
 assert.match(p,/Related perspective: practical AI risks/);assert.match(p,/does not substantiate/);assert.doesNotMatch(p,/duration not verified|\d+:\d{2} podcast/);
 const a=renderReadingSupport(edition.stories[0],edition.stories[0].story_id,edition.brief_date);assert.match(a,/Update/);assert.match(a,/Agent ensemble/);assert.match(a,/What you’ll learn/);assert.doesNotMatch(a,/Why this coverage label/);
});
test('duration and estimated reading time have explicit boundaries',()=>{
 assert.equal(readingMinutes({summary:'word '.repeat(201)}),null);
 assert.equal(readingMinutes({status:'verified',reading_minutes:5,word_count:null,source_url:'https://example.com/article',verified_at:'2026-10-03',method:'publisher display'}),5);
 assert.equal(readingMinutes({status:'verified',word_count:201,source_url:'https://example.com/article',verified_at:'2026-09-13',method:'main text'}),2);
 assert.match(renderReadingSupport({summary:'word '.repeat(1000)},'unknown','2026-09-13'),/Source reading time unavailable/);
 assert.equal(renderReadingSupport({runtime_seconds:429},'new','2026-09-13','Video'),'');
 assert.doesNotMatch(renderReadingSupport({summary:'text'},'unknown','2026-09-13'),/coverage-label|Earlier in the Brief/);
 assert.equal(renderReadingSupport({},'old','2026-09-11'),'');
});
test('related future items and duplicate selections are rejected',()=>{
 const x={item_id:edition.stories[0].story_id,coverage_label:'Background',label_reason:'reason',learning_outcome:'Useful outcome',context_term:'term',context:'context',related:{title:'future',connection:'test',brief_date:'2026-09-13',url:'https://gttome.github.io/Daily-AI-Brief/stories/2026-09-13/test/'}};
 assert.throws(()=>validateReadingSupport(edition,{editions:{[edition.brief_date]:[x]}}),/earlier/);
});
test('edition overview resolves video anchors and reuses source reading estimates',async()=>{
 const {renderBody}=await import('../lib/render.mjs');
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-13.json'));
 const body=renderBody(current);
 const overview=body.match(/<section class="edition-overview"[\s\S]*?<\/section>/)[0];
 for(const anchor of ['general','agents-for-non-technical-people']){
  assert.ok(overview.includes(`href="#${anchor}"`));
  assert.equal(body.split(`id="${anchor}"`).length-1,1);
 }
 assert.doesNotMatch(body,/Watch on YouTube/);
 assert.equal((body.match(/>Watch on OpenAI Academy<\/a>/g)||[]).length,2);
 for(const story of current.stories){
  const minutes=renderReadingSupport(story,story.story_id,current.brief_date).match(/about (\d+) min read/)[1];
  assert.ok(overview.includes(`Article · about ${minutes} min source read`));
 }
 const yt=structuredClone(current);yt.worth_watching.general.url='https://www.youtube.com/watch?v=example';
 assert.match(renderBody(yt),/>Watch on YouTube<\/a>/);
});

test('stale same-date catalog items are ignored only for qualification replay',()=>{
 const replacement=structuredClone(edition);replacement.policy_profile='under80-v1';replacement.stories=replacement.stories.map((story,i)=>({...story,story_id:`replacement-story-${i+1}`}));
 const prior=process.env.DAB_QUALIFICATION_NONPRODUCTION;
 try{
  delete process.env.DAB_QUALIFICATION_NONPRODUCTION;
  assert.throws(()=>validateReadingSupport(replacement),/unknown or duplicate/);
  process.env.DAB_QUALIFICATION_NONPRODUCTION='1';
  assert.doesNotThrow(()=>validateReadingSupport(replacement));
  const stale={item_id:'stale-item',coverage_label:'Background',label_reason:'stale',learning_outcome:'stale',context_term:'Context',context:'stale'};
  assert.throws(()=>validateReadingSupport(replacement,{editions:{[replacement.brief_date]:[stale]}}),/unknown or duplicate/);
 } finally {
  if(prior===undefined) delete process.env.DAB_QUALIFICATION_NONPRODUCTION; else process.env.DAB_QUALIFICATION_NONPRODUCTION=prior;
 }
});
