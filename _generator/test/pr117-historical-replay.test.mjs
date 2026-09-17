import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {replayHistoricalKernel} from '../../_tools/pr117-historical-replay.mjs';
import {expandEditorialKernel} from '../lib/editorial-kernel.mjs';
import {generatedFiles} from '../lib/render.mjs';

const edition=JSON.parse(fs.readFileSync(new URL('../../_data/editions/2026-09-17.json',import.meta.url)));
const baseline='1df531897edb50406b1d4bf2cf8089f69a797a92';
const kernel={schema_version:'1.0.0',brief_date:edition.brief_date,edition_id:edition.edition_id,baseline_sha:baseline,normal_model_passes:1,normal_post_editorial_model_passes:0,editorial_takeaway:edition.editorial_takeaway,stories:edition.stories.map(s=>({canonical_ordinal:s.ordinal,story_id:s.story_id,candidate_id:s.story_id,focus:s.focus,headline:s.headline,summary:s.summary,why_it_matters:s.why_it_matters,what_to_do_now:s.what_to_do_now,topic_labels:s.topics,editorial_limitation:'Historical diagnostic reconstruction; no new editorial approval asserted.',source_url:s.source.normalized_url,agent_skill:/agent skill/i.test(s.headline),visual:{description:s.image.alt}})),media_decisions:{replay:true},changed_watchlist_topics:[]};

test('historical adapter preserves all recorded identities, content and observations without mutating inputs',()=>{
 const before=JSON.stringify({kernel,edition});
 const replay=replayHistoricalKernel(kernel,edition,baseline);
 assert.deepEqual(replay,edition);
 assert.notEqual(replay,edition);
 assert.equal(JSON.stringify({kernel,edition}),before);
 assert.deepEqual([...generatedFiles(replay,process.cwd())],[...generatedFiles(edition,process.cwd())]);
});
test('historical adapter fails closed for changed semantics, bindings, date, baseline and visual',()=>{
 for(const mutate of [
  k=>{k.stories[0].headline+=' changed';},
  k=>{k.stories[0].source_url='https://example.org/changed';},
  k=>{k.stories[0].candidate_id='unknown';},
  k=>{k.stories[0].story_id='unknown';},
  k=>{k.stories[0].visual.description+=' changed';},
  k=>{k.brief_date='2026-09-18';k.edition_id='dab-edition-2026-09-18';},
  k=>{k.baseline_sha='0'.repeat(40);},
  k=>{k.editorial_takeaway+=' changed';},
  k=>{k.changed_watchlist_topics=['new-topic'];}
 ]){
  const altered=structuredClone(kernel);mutate(altered);
  assert.throws(()=>replayHistoricalKernel(altered,edition,baseline));
 }
});
test('unadapted historical reconstruction retains the original binding failure',()=>{
 const expanded=expandEditorialKernel(kernel,{candidateFacts:Object.fromEntries(edition.stories.map(s=>[s.story_id,s])),imageAssets:Object.fromEntries(edition.stories.map(s=>[s.story_id,s.image])),media:{worth_watching:edition.worth_watching,podcast:edition.podcast},publishedAt:edition.published_at,coveragePeriod:edition.coverage_period});
 assert.equal(expanded.stories.filter((s,i)=>s.story_id!==edition.stories[i].story_id).length,6);
 assert.equal(expanded.stories.filter((s,i)=>s.permanent_url!==edition.stories[i].permanent_url).length,3);
 assert.throws(()=>generatedFiles(expanded,process.cwd()),/Book reference has an unknown or duplicate item/);
});
