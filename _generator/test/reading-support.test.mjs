import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderReadingSupport,readingMinutes,validateReadingSupport} from '../lib/reading-support.mjs';
import {readerFoundationFiles} from '../lib/reader.mjs';
const edition=JSON.parse(fs.readFileSync(new URL('../../_data/editions/2026-09-12.json',import.meta.url)));
test('source estimates match the brief and all permanent shared article pages',()=>{
 const current=JSON.parse(fs.readFileSync('_data/editions/2026-09-13.json'));
 const files=readerFoundationFiles(current,process.cwd());
 for(const story of current.stories){const brief=renderReadingSupport(story,story.story_id,current.brief_date);const match=brief.match(/Source article · about \d+ min read/);assert.ok(match);assert.ok(files.get(`stories/2026-09-13/${story.slug}.md`).includes(match[0]));}
});
test('approved article and podcast context is safe and preserves uncertainty',()=>{
 validateReadingSupport(edition);
 const p=renderReadingSupport(edition.podcast,edition.podcast.item_id,edition.brief_date,'Podcast');
 assert.match(p,/Related perspective: practical AI risks/);assert.match(p,/does not substantiate/);assert.match(p,/duration not verified/);
 const a=renderReadingSupport(edition.stories[0],edition.stories[0].story_id,edition.brief_date);assert.match(a,/Update/);assert.match(a,/Agent ensemble/);assert.match(a,/What you’ll learn/);assert.doesNotMatch(a,/Why this coverage label/);
});
test('duration and estimated reading time have explicit boundaries',()=>{
 assert.equal(readingMinutes({summary:'word '.repeat(201)}),null);
 assert.equal(readingMinutes({status:'verified',word_count:201,source_url:'https://example.com/article',verified_at:'2026-09-13',method:'main text'}),2);
 assert.match(renderReadingSupport({summary:'word '.repeat(1000)},'unknown','2026-09-13'),/Source reading time unavailable/);
 assert.match(renderReadingSupport({runtime_seconds:429},'new','2026-09-13','Video'),/7:09 video/);
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
