import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('protected closeout projects the terminal pointer at Task 29 with final authorization state',()=>{
  const source=fs.readFileSync('_generator/lib/production-run-closeout.mjs','utf8');
  assert.match(source,/active:false,terminal:true/);
  assert.match(source,/start_scope:'full_production'/);
  assert.match(source,/image_tasks_authorized:true/);
  assert.match(source,/publication_authorized:true/);
  assert.match(source,/deferred_blocker:null/);
  assert.match(source,/current_task:'29'/);
  assert.match(source,/current_task_state:'Done'/);
  assert.match(source,/Task 29 PASS through protected finalization/);
});
