import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateReaderSemanticCloseGate} from '../lib/reader-semantic-close-gate.mjs';
import {scanWorkflowText,validateActiveProductionWorkflows} from '../lib/workflow-static-guards.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const date='2026-10-04';
const executionKey='2026-10-04-run8';

test('correct generated edition passes reader semantic PUBLIC_CLOSED gate',()=>{
  const gate=evaluateReaderSemanticCloseGate({root,editionDate:date,executionKey,observedAt:'2026-10-04T18:00:00Z'});
  assert.equal(gate.result,'PASS',gate.errors.join('\n'));
  assert.equal(gate.checks.six_articles,true);
  assert.equal(gate.checks.two_videos,true);
  assert.equal(gate.checks.two_podcasts,true);
  assert.equal(gate.checks.exactly_one_agent_skill_story,true);
  assert.equal(gate.checks.rating_control_count,10);
  assert.equal(gate.checks.book_bridge_mapping_count,6);
  assert.equal(gate.checks.exactly_six_permanent_story_pages,true);
});

test('removing one required Brief block fails the close gate',()=>{
  const relative='briefs/'+date+'.md';
  const original=fs.readFileSync(path.join(root,relative),'utf8');
  const altered=original.replace('CONTINUE LEARNING','CONTINUE_REMOVED');
  assert.notEqual(altered,original);
  const gate=evaluateReaderSemanticCloseGate({
    root,editionDate:date,executionKey,observedAt:'2026-10-04T18:00:00Z',
    fileOverrides:{[relative]:altered}
  });
  assert.equal(gate.result,'FAIL');
  assert.ok(gate.errors.some(error=>error.includes('dated_brief_canonical')));
  assert.ok(gate.errors.includes('continue_learning_or_archive_navigation_missing')||gate.checks.continue_learning_and_archive===true);
});

test('altering one permanent story page fails the close gate',()=>{
  const edition=JSON.parse(fs.readFileSync(path.join(root,'_data/editions',date+'.json'),'utf8'));
  const story=edition.stories[0];
  const relative='stories/'+date+'/'+story.slug+'.md';
  const original=fs.readFileSync(path.join(root,relative),'utf8');
  const altered=original.replace('class="reading-context"','class="reading-context-removed"');
  assert.notEqual(altered,original);
  const gate=evaluateReaderSemanticCloseGate({
    root,editionDate:date,executionKey,observedAt:'2026-10-04T18:00:00Z',
    fileOverrides:{[relative]:altered}
  });
  assert.equal(gate.result,'FAIL');
  assert.ok(gate.errors.some(error=>error.includes('permanent_story_1:canonical_mismatch')));
  assert.ok(gate.errors.some(error=>error.includes('permanent_story_semantic_incomplete')));
});

test('semantic gate requires all six article book bridges and reader evidence',()=>{
  const gate=evaluateReaderSemanticCloseGate({root,editionDate:date,executionKey,observedAt:'2026-10-04T18:00:00Z'});
  for(let i=1;i<=6;i++){
    assert.equal(gate.checks['story_'+String(i).padStart(2,'0')+'_reading_evidence'],true);
    assert.equal(gate.checks['story_'+String(i).padStart(2,'0')+'_evidence_availability'],true);
    assert.equal(gate.checks['permanent_story_'+i+'_semantic'],true);
  }
});


test('workflow static guard accepts valid Node heredoc and active production workflows',()=>{
  const fixture="run: |\\n  node - <<'NODE'\\n  const x={ok:true};\\n  process.stdout.write(JSON.stringify(x));\\n  NODE\\n";
  assert.deepEqual(scanWorkflowText({workflowPath:'fixture.yml',text:fixture}),[]);
  const live=validateActiveProductionWorkflows(root);
  assert.equal(live.result,'PASS',JSON.stringify(live.errors,null,2));
});

test('workflow static guard rejects heredoc indentation and Node syntax defects',()=>{
  const badIndent="run: |\\n  node - <<'NODE'\\n  const x=1;\\n   NODE\\n";
  assert.ok(scanWorkflowText({workflowPath:'fixture.yml',text:badIndent}).some(error=>error.code==='WORKFLOW_HEREDOC_CLOSER_INDENT_MISMATCH'));
  const badNode="run: |\\n  node - <<'NODE'\\n  const broken = ;\\n  NODE\\n";
  assert.ok(scanWorkflowText({workflowPath:'fixture.yml',text:badNode}).some(error=>error.code==='NODE_HEREDOC_SYNTAX_INVALID'));
});
