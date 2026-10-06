import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/run-supervisor.yml','utf8');

test('Supervisor checkpoints a successful chunk bridge before next-task routing',()=>{
  const consume=workflow.indexOf('image-chunk-bridge.mjs consume');
  const checkpoint=workflow.indexOf('bridge_processed=',consume);
  const tick=workflow.indexOf('run-supervisor.mjs tick',checkpoint);
  assert.ok(consume>=0,'chunk bridge consumer missing');
  assert.ok(checkpoint>consume,'successful bridge checkpoint must follow consume');
  assert.ok(tick>checkpoint,'next-task tick must follow the checkpoint boundary');
  const boundary=workflow.slice(checkpoint,tick);
  assert.match(boundary,/git -C run push origin/);
  assert.match(boundary,/yield for saved-Git review/);
  assert.match(boundary,/\\bbreak\\b/);
});
