import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderReadingSupport,readingMinutes,validateReadingSupport} from '../lib/reading-support.mjs';
const edition=JSON.parse(fs.readFileSync(new URL('../../_data/editions/2026-09-12.json',import.meta.url)));
test('approved article and podcast context is safe and preserves uncertainty',()=>{
 validateReadingSupport(edition);
 const p=renderReadingSupport(edition.podcast,edition.podcast.item_id,edition.brief_date,'Podcast');
 assert.match(p,/Related perspective: practical AI risks/);assert.match(p,/does not substantiate/);assert.match(p,/duration not verified/);
 const a=renderReadingSupport(edition.stories[0],edition.stories[0].story_id,edition.brief_date);assert.match(a,/Update/);assert.match(a,/Agent ensemble/);assert.match(a,/What you’ll learn/);assert.doesNotMatch(a,/Why this coverage label/);
});
test('duration and estimated reading time have explicit boundaries',()=>{
 assert.equal(readingMinutes({summary:'word '.repeat(201)}),2);
 assert.match(renderReadingSupport({runtime_seconds:429},'new','2026-09-13','Video'),/7:09 video/);
 assert.doesNotMatch(renderReadingSupport({summary:'text'},'unknown','2026-09-13'),/coverage-label|Earlier in the Brief/);
 assert.equal(renderReadingSupport({},'old','2026-09-11'),'');
});
test('related future items and duplicate selections are rejected',()=>{
 const x={item_id:edition.stories[0].story_id,coverage_label:'Background',label_reason:'reason',learning_outcome:'Useful outcome',context_term:'term',context:'context',related:{title:'future',connection:'test',brief_date:'2026-09-13',url:'https://gttome.github.io/Daily-AI-Brief/stories/2026-09-13/test/'}};
 assert.throws(()=>validateReadingSupport(edition,{editions:{[edition.brief_date]:[x]}}),/earlier/);
});
