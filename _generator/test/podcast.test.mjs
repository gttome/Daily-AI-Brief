import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEdition} from '../lib/validate.mjs';
import {generatedFiles} from '../lib/render.mjs';
import {aggregateAnalytics,refreshFeedbackAnalytics} from '../lib/analytics.mjs';
const root = new URL('../../',import.meta.url).pathname;
const edition = JSON.parse(fs.readFileSync(root+'_data/editions/2026-09-09.json'));
test('podcast permits long episodes while video limits stay enforced',()=>{
 const e=structuredClone(edition);e.podcast.runtime_seconds=14400;assert.deepEqual(validateEdition(e),[]);
 e.worth_watching.general.runtime_seconds=1201;assert.ok(validateEdition(e).some(x=>x.includes('1-1200')));
 e.worth_watching.general.runtime_seconds=300;e.podcast.url=e.stories[0].source.url;assert.ok(validateEdition(e).some(x=>x.includes('duplicates')));
});
test('podcast identity survives all reader surfaces and feeds with exactly four rating choices',()=>{
 const files=generatedFiles(edition,root);const p=edition.podcast;
 for(const name of ['index.md','latest.md','briefs/2026-09-09.md',p.permanent_url.slice(1,-1)+'.md']) {
  assert.ok(files.get(name).includes(p.item_id));assert.ok(files.get(name).includes('Was this podcast useful?'));
 }
 assert.ok(files.get('index.md').indexOf('Worth Listening')>files.get('index.md').indexOf('Worth Watching'));
 const items=JSON.parse(files.get('feed.json')).items;assert.equal(items.filter(x=>x.id===p.item_id).length,1);
 assert.equal(JSON.parse(files.get('data/archive-index.json')).stories.find(x=>x.story_id===p.item_id).content_type,'Podcast');
});
test('podcast totals are counted once and remain separate from six-article learning evidence',async()=>{
 const id=edition.podcast.item_id,podcasts=[{story_id:id,title:'Episode',url:edition.podcast.url}];
 const record=aggregateAnalytics({date:edition.brief_date,stories:[],podcasts,counts:{[id]:{share_initiations:3,feedback_useful:2}}});
 assert.equal(record.site_totals.share_initiations,3);assert.equal(record.podcasts[0].metrics.feedback_useful,2);assert.equal(record.stories.length,0);
 const result=await refreshFeedbackAnalytics(record,edition.brief_date,[],async()=>1,[],podcasts);
 assert.equal(result.record.podcasts[0].metrics.share_initiations,3);
});
