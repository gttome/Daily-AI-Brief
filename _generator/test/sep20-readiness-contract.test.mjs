import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path,'utf8'));

test('September 20 runtime contract is fail-closed for media and uses the new reader label',()=>{
  const runtime=read('docs/operations/under80-runtime-contract.json');
  const policy=read('docs/operations/efficiency-operating-policy.json');
  const template=read('docs/operations/editorial-handoff-template.json');

  assert.equal(runtime.output.videos_required,2);
  assert.equal(runtime.output.podcasts_required,2);
  assert.equal(runtime.media.videos_required,2);
  assert.equal(runtime.media.podcasts_required,2);
  assert.equal(runtime.media.bounded_omission_allowed,false);
  assert.equal(policy.video.required_count,2);
  assert.equal(policy.video.minimum_desirable_count,2);
  assert.equal(policy.video.publication_required,true);
  assert.equal(policy.podcast.required_count,2);
  assert.equal(policy.podcast.publication_required,true);

  assert.equal(runtime.output.display_focus_labels.agents_non_technical_people,'Agents for Everyone');
  assert.equal(policy.display_labels.agents_non_technical_people,'Agents for Everyone');
  assert.equal(template.media_shape.worth_watching.agents_non_technical_people.display_label,'Agents for Everyone');
  assert.equal(template.media_shape.podcasts.length,2);
  assert.ok(template.hard_rules.some(rule=>/exactly two verified videos and exactly two verified source-diverse podcasts/.test(rule)));
});

test('zero-Work scheduling remains explicitly unqualified until the scheduler proves a non-Work execution path',()=>{
  const runtime=read('docs/operations/under80-runtime-contract.json');
  const policy=read('docs/operations/efficiency-operating-policy.json');

  assert.equal(runtime.scheduler_execution.zero_work_target,true);
  assert.equal(runtime.scheduler_execution.zero_work_qualified,false);
  assert.equal(runtime.scheduler_execution.execution_mode_selector_exposed,false);
  assert.equal(runtime.qualification_test.zero_work_status,'not_qualified');
  assert.equal(policy.scheduler_execution.zero_work_target,true);
  assert.equal(policy.scheduler_execution.zero_work_qualified,false);
  assert.equal(policy.scheduler_execution.execution_mode_selector_exposed,false);
});

test('September 20 image contract remains WebP-preferred and PNG-compatible without quality reduction',()=>{
  const runtime=read('docs/operations/under80-runtime-contract.json');
  const policy=read('docs/operations/efficiency-operating-policy.json');
  const template=read('docs/operations/editorial-handoff-template.json');

  assert.equal(runtime.image.preferred_canonical_format,'webp');
  assert.deepEqual(runtime.image.accepted_formats,['webp','png']);
  assert.equal(runtime.image.historical_png_compatible,true);
  assert.equal(runtime.images.quality_reduction_for_cost_prohibited,true);
  assert.equal(policy.image.quality_protected,true);
  assert.match(policy.work_stop_boundary,/WebP or PNG/);
  assert.equal(template.images_shape.c01.format,'webp');
  assert.ok(template.hard_rules.some(rule=>/accepted WebP or PNG blobs/.test(rule)));
});


test('production handoff does not depend on GitHub Actions permission to create pull requests',()=>{
  const runtime=read('docs/operations/under80-runtime-contract.json');
  assert.equal(runtime.handoff.publication_pr.creation_owner,'scheduled_publisher_github_connector');
  assert.equal(runtime.handoff.publication_pr.initial_label_state,'unlabelled');
  assert.equal(runtime.handoff.publication_pr.actions_create_pr_dependency,false);
  assert.match(runtime.handoff.publication_pr.deterministic_workflow_role,/add publication-candidate only after deterministic validation succeeds/);
  assert.match(runtime.handoff.hard_stop,/authenticated GitHub connector to open or reuse one unlabelled PR/);
});


test('failed current-edition recovery continues until live verification and Sep 20+ images are professional-only',()=>{
  const policy=read('docs/operations/efficiency-operating-policy.json');
  assert.equal(policy.failed_brief_recovery.mode,'continuous_until_live_verified');
  assert.equal(policy.failed_brief_recovery.preserve_completed_work,true);
  assert.equal(policy.failed_brief_recovery.redo_completed_editorial_work,false);
  assert.match(policy.failed_brief_recovery.completion_definition,/live site/);
  assert.equal(policy.image.quality_protected,true);
});
