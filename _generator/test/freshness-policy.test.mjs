import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEdition} from '../lib/validate.mjs';
import {validateReadingSupport} from '../lib/reading-support.mjs';

function sep16Edition(){
 const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-15.json','utf8'));
 edition.brief_date='2026-09-16';
 edition.edition_id='dab-edition-2026-09-16';
 edition.published_at='2026-09-16T12:55:00Z';
 edition.research_cutoff_at='2026-09-16T12:00:00Z';
 edition.coverage_period='24-hour primary window ending September 16 at 07:00 America/Chicago; no recency fallbacks were needed.';
 for(const story of edition.stories){
  story.story_id=story.story_id.replace('2026-09-15','2026-09-16');
  story.permanent_url=story.permanent_url.replace('/2026-09-15/','/2026-09-16/');
  story.image.path=story.image.path.replace('/2026-09-15/','/2026-09-16/');
  story.freshness={tier:'primary',source_published_at:'2026-09-16T10:00:00Z'};
 }
 if(edition.podcast?.item_id)edition.podcast.item_id=edition.podcast.item_id.replace('2026-09-15','2026-09-16');
 if(edition.podcast?.permanent_url)edition.podcast.permanent_url=edition.podcast.permanent_url.replace('/2026-09-15/','/2026-09-16/');
 return edition;
}

const freshnessErrors=edition=>validateEdition(edition).filter(error=>/freshness|research_cutoff|coverage_period|primary window|recency fallback/i.test(error));

test('September 16 editions require a verified 24-hour primary window',()=>{
 const edition=sep16Edition();
 assert.deepEqual(freshnessErrors(edition),[]);
 delete edition.research_cutoff_at;
 assert.ok(freshnessErrors(edition).some(error=>error.includes('research_cutoff_at')));
});

test('ordinary fallbacks are capped at 72 hours and require disclosure',()=>{
 const edition=sep16Edition();
 edition.stories[0].freshness={tier:'fallback',source_published_at:'2026-09-13T04:00:00Z',fallback_reason:'No qualifying primary-window candidate survived the technical category gates.'};
 assert.ok(freshnessErrors(edition).some(error=>error.includes('exceeds 72 hours')));
 edition.stories[0].freshness.source_published_at='2026-09-15T06:00:00Z';
 edition.coverage_period='24-hour primary window ending September 16 at 07:00 America/Chicago; 1 recency fallback filled a required category after fresh candidates failed the gates.';
 assert.deepEqual(freshnessErrors(edition),[]);
 delete edition.stories[0].freshness.fallback_reason;
 assert.ok(freshnessErrors(edition).some(error=>error.includes('fallback_reason')));
});

test('Agent Skills retains the approved seven-day fallback ceiling',()=>{
 const edition=sep16Edition();
 const skill=edition.stories.find(story=>/agent skills?/i.test([story.headline,...story.topics].join(' ')));
 assert.ok(skill);
 skill.freshness={tier:'fallback',source_published_at:'2026-09-11T12:00:00Z',fallback_reason:'No qualifying Agent Skills development was found in the primary window.'};
 edition.coverage_period='24-hour primary window ending September 16 at 07:00 America/Chicago; 1 recency fallback used the approved Agent Skills exception.';
 assert.deepEqual(freshnessErrors(edition),[]);
 skill.freshness.source_published_at='2026-09-08T12:00:00Z';
 assert.ok(freshnessErrors(edition).some(error=>error.includes('exceeds 168 hours')));
});

test('fallback stories must render the visible Recency fallback label',()=>{
 const edition=sep16Edition();
 const story=edition.stories[0];
 story.freshness={tier:'fallback',source_published_at:'2026-09-15T06:00:00Z',fallback_reason:'No qualifying primary-window candidate survived the category gates.'};
 const support={editions:{'2026-09-16':[{
  item_id:story.story_id,coverage_label:'New development',label_reason:'Reviewed selection.',learning_outcome:'Understand the selected development.',context_term:'Freshness',context:'This item fills a required category.'
 }]}};
 assert.throws(()=>validateReadingSupport(edition,support),/Recency fallback/);
 support.editions['2026-09-16'][0].coverage_label='Recency fallback';
 assert.doesNotThrow(()=>validateReadingSupport(edition,support));
});
