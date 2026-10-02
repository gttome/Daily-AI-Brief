import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p,'utf8');

test('full public rehearsal routes remain isolated from canonical production publication', () => {
  const handoff=read('.github/workflows/run-supervisor-handoff.yml');
  const supervisor=read('.github/workflows/run-supervisor.yml');
  const repositoryConsumer=read('.github/workflows/repository-task-consumer.yml');

  for (const required of [
    "'rehearsal/**'",
    '_records/rehearsal/active-public-rehearsal.json',
    "x.mode==='FULL_PUBLIC_REHEARSAL'",
    'x.production_allocation===false',
    'x.canonical_pointers_mutable===false',
    'x.image_generation_allowed===true',
    "x.publication_mode==='isolated_preview'"
  ]) assert.ok(handoff.includes(required), 'handoff missing '+required);

  assert.ok(handoff.includes('TASK_1[1-7]_DONE_HANDOFF_TO_SUPERVISOR'));
  assert.ok(handoff.includes('TASK_1[1-7]_BLOCKED_HANDOFF_TO_SUPERVISOR'));
  assert.ok(handoff.includes('synthetic-active-run.json'), 'existing synthetic rehearsal route must remain');

  assert.ok(supervisor.includes('if [[ "$RUN_BRANCH" == rehearsal/* ]]'));
  assert.equal(
    supervisor.split('Canonical publication dispatch is prohibited.').length - 1, 1,
    'initial frozen-candidate handoff must fail closed for rehearsal'
  );
  assert.ok(
    supervisor.includes('Leave publication to the rehearsal preview controller.'),
    'loop boundary must hand rehearsal publication to preview controller'
  );
  assert.ok(
    supervisor.includes('node control/_tools/dispatch-frozen-publication.mjs'),
    'production publication dispatch must remain available for canonical runs'
  );

  for (const required of [
    "'rehearsal/**'",
    '_records/rehearsal/active-public-rehearsal.json',
    "x.mode==='FULL_PUBLIC_REHEARSAL'",
    'x.production_allocation===false',
    'x.canonical_pointers_mutable===false',
    'x.image_generation_allowed===true',
    "x.publication_mode==='isolated_preview'",
    'x.branch===process.env.GITHUB_REF_NAME',
    'control/data/operations/active-production-run.json'
  ]) assert.ok(repositoryConsumer.includes(required), 'repository consumer missing '+required);
});
