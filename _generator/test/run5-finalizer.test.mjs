import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Run 5 finalizer resumes only after Task 17 and never reopens Tasks 00-17',()=>{
  const y=fs.readFileSync('.github/workflows/run5-finalizer.yml','utf8');
  assert.match(y,/17-done\*\.json/);
  assert.match(y,/21-done\*\.json/);
  assert.match(y,/run5-post-image-finalizer\.mjs/);
  assert.match(y,/run5-release-sealer\.mjs/);
  assert.match(y,/TASKS_18_THROUGH_21_DONE_HANDOFF_TO_SUPERVISOR/);
  assert.doesNotMatch(y,/image_gen|native-image-worker|generate.*image/i);
});

test('Task 18 finalizer binds only frozen Run 5 evidence and reuses accepted image bytes',()=>{
  const s=fs.readFileSync('_tools/run5-post-image-finalizer.mjs','utf8');
  assert.match(s,/Task 17 must be durably Done before Task 18/);
  assert.match(s,/_records\/editorial\/2026-10-02-run5\/story-selection\.json/);
  assert.match(s,/_records\/image-attempts/);
  assert.match(s,/accepted_locked===true/);
  assert.match(s,/accepted_image_identity_mismatch/);
  assert.match(s,/validateIntegratedRepository/);
  assert.doesNotMatch(s,/image_gen|native_chatgpt_image_generation|render.*image/i);
});

test('Tasks 19-21 require manifest and integrated qualification before Done',()=>{
  const s=fs.readFileSync('_tools/run5-release-sealer.mjs','utf8');
  assert.match(s,/Task 18 must be Done before sealing/);
  assert.match(s,/validatePublicationManifest/);
  assert.match(s,/validateIntegratedRepository/);
  assert.match(s,/manifestValidation\.result!=='PASS'/);
  assert.match(s,/run5_release_integration_fail/);
  assert.match(s,/event\('19','Done'/);
  assert.match(s,/event\('20','Done'/);
  assert.match(s,/event\('21','Done'/);
  assert.match(s,/work_usage:0,codex_usage:0,paid_api_usage:0/);
});


test('Run 5 finalizer resolves only the known active-pointer merge conflict',()=>{
  const y=fs.readFileSync('.github/workflows/run5-finalizer.yml','utf8');
  assert.match(y,/diff --name-only --diff-filter=U/);
  assert.match(y,/conflicts\" != \"data\/operations\/active-production-run\.json/);
  assert.match(y,/checkout --ours data\/operations\/active-production-run\.json/);
  assert.match(y,/Unexpected merge conflicts/);
});


test('Run 5 finalizer executes release code from the active run working tree',()=>{
  const y=fs.readFileSync('.github/workflows/run5-finalizer.yml','utf8');
  assert.match(y,/node run\/_tools\/run5-post-image-finalizer\.mjs run/);
  assert.match(y,/node run\/_tools\/run5-release-sealer\.mjs run/);
  assert.doesNotMatch(y,/node control\/_tools\/run5-(?:post-image-finalizer|release-sealer)\.mjs run/);
});
