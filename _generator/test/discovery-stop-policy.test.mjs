import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {discoveryStopDecision} from '../lib/discovery-stop-policy.mjs';

const base={
  scanned:12,
  minSources:12,
  freshMetadata:13,
  freshMetadataTarget:24,
  focusCoverage:{technical_ai_engineering:8,applied_genai_knowledge_workers:2,agents_non_technical_people:1},
  normalChars:1500000,
  normalBudget:1500000,
  absoluteBudget:2500000
};

test('production discovery still stops at normal acquisition budget',()=>{
  assert.deepEqual(discoveryStopDecision({...base,qualification:false}),{
    stop:true,reason:'normal_acquisition_budget',focus_minimum:3
  });
});

test('qualification discovery does not stop at normal budget while source supply is insufficient',()=>{
  assert.deepEqual(discoveryStopDecision({...base,qualification:true}),{
    stop:false,reason:null,focus_minimum:5
  });
});

test('qualification discovery stops when fresh metadata and focus supply are sufficient',()=>{
  assert.deepEqual(discoveryStopDecision({
    ...base,qualification:true,freshMetadata:24,
    focusCoverage:{technical_ai_engineering:8,applied_genai_knowledge_workers:5,agents_non_technical_people:5}
  }),{stop:true,reason:'fresh_metadata_and_focus_sufficiency',focus_minimum:5});
});

test('qualification discovery keeps the absolute retrieval budget hard',()=>{
  assert.deepEqual(discoveryStopDecision({...base,qualification:true,normalChars:2500000}),{
    stop:true,reason:'qualification_absolute_acquisition_budget',focus_minimum:5
  });
});

test('under80 qualification workflow passes discovery purpose to catalog acquisition',()=>{
  const yml=fs.readFileSync('.github/workflows/under80-discovery-preflight.yml','utf8');
  const discover=fs.readFileSync('_tools/discover-sources.mjs','utf8');
  assert.match(yml,/DAB_DISCOVERY_PURPOSE:\s*\$\{\{ steps\.config\.outputs\.purpose \}\}/);
  assert.match(discover,/DAB_DISCOVERY_PURPOSE==='continuous_qualification'/);
  assert.match(discover,/discoveryStopDecision/);
});
