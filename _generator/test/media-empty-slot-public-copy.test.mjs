import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderLatest} from '../lib/render.mjs';

const baseEdition=JSON.parse(fs.readFileSync('_data/editions/2026-09-16.json','utf8'));

function editionWithPrivateMediaDiagnostics(){
  const edition=structuredClone(baseEdition);
  edition.brief_date='2026-09-17';
  edition.worth_watching.general={status:'empty',exception:'PRIVATE_VIDEO_GENERAL_DIAGNOSTIC: HTTP 404 after three retries'};
  edition.worth_watching.agents_non_technical_people={status:'empty',exception:'PRIVATE_VIDEO_AGENT_DIAGNOSTIC: source coverage exhausted'};
  edition.podcast={status:'empty',exception:'PRIVATE_PODCAST_DIAGNOSTIC: runtime mismatch after preflight'};
  return edition;
}

test('empty media slots use fixed reader-facing editorial copy without leaking diagnostics',()=>{
  const edition=editionWithPrivateMediaDiagnostics();
  const output=renderLatest(edition);
  assert.equal((output.match(/No video met today’s editorial quality standards\./g)||[]).length,2);
  assert.equal((output.match(/No podcast met today’s editorial quality standards\./g)||[]).length,1);
  assert.doesNotMatch(output,/PRIVATE_VIDEO_GENERAL_DIAGNOSTIC/);
  assert.doesNotMatch(output,/PRIVATE_VIDEO_AGENT_DIAGNOSTIC/);
  assert.doesNotMatch(output,/PRIVATE_PODCAST_DIAGNOSTIC/);
  assert.equal(edition.worth_watching.general.exception,'PRIVATE_VIDEO_GENERAL_DIAGNOSTIC: HTTP 404 after three retries');
  assert.equal(edition.worth_watching.agents_non_technical_people.exception,'PRIVATE_VIDEO_AGENT_DIAGNOSTIC: source coverage exhausted');
  assert.equal(edition.podcast.exception,'PRIVATE_PODCAST_DIAGNOSTIC: runtime mismatch after preflight');
});
