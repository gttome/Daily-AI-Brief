import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {validateMediaSemanticDistinctness} from '../lib/validate.mjs';

const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const futureEdition=()=>{
  const edition=structuredClone(read('_data/editions/2026-10-06.json'));
  edition.brief_date='2026-10-07';
  return edition;
};

test('media semantic distinctness accepts role-specific reader copy',()=>{
  assert.deepEqual(validateMediaSemanticDistinctness(futureEdition()),[]);
});

test('media semantic distinctness rejects duplicated video summary and why-it-matters copy',()=>{
  const edition=futureEdition();
  edition.worth_watching.general.connection=edition.worth_watching.general.why_useful;
  assert.ok(validateMediaSemanticDistinctness(edition).includes(
    'media_semantic_duplicate:video:general:summary_vs_why_it_matters'
  ));
});

test('media semantic distinctness rejects pairwise duplicated podcast reader fields',()=>{
  const edition=futureEdition();
  const podcast=edition.podcasts[0];
  podcast.why_useful=podcast.summary;
  podcast.connection=podcast.summary;
  const errors=validateMediaSemanticDistinctness(edition);
  assert.ok(errors.includes('media_semantic_duplicate:podcast:'+podcast.item_id+':summary_vs_why_it_matters'));
  assert.ok(errors.includes('media_semantic_duplicate:podcast:'+podcast.item_id+':summary_vs_connection_to_brief'));
  assert.ok(errors.includes('media_semantic_duplicate:podcast:'+podcast.item_id+':why_it_matters_vs_connection_to_brief'));
});

test('media semantic distinctness rejects near-literal copies with small suffix changes',()=>{
  const edition=futureEdition();
  const source=edition.worth_watching.agents_non_technical_people.why_useful;
  edition.worth_watching.agents_non_technical_people.connection=source+' for readers';
  assert.ok(validateMediaSemanticDistinctness(edition).includes(
    'media_semantic_duplicate:video:agents_non_technical_people:summary_vs_why_it_matters'
  ));
});
