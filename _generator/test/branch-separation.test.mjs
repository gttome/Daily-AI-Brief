import test from 'node:test';
import assert from 'node:assert/strict';
import {
  branchRole,productionCandidateSeparationErrors,validateHardeningQueue,candidateResumeDependency
} from '../lib/branch-separation.mjs';

test('branch roles separate production candidates from hardening and bounded repair',()=>{
  assert.equal(branchRole('reliable-edition/dab-edition-2026-10-07-run11'),'production_candidate');
  assert.equal(branchRole('hardening/p1p2-event-supervisor'),'hardening');
  assert.equal(branchRole('repair/run11-task17'),'repair');
  assert.equal(branchRole('main'),'protected_main');
});

test('production candidate accepts edition/runtime delta but rejects system hardening',()=>{
  const base={branch:'reliable-edition/dab-edition-2026-10-07-run11',baseline_main_sha:'a'.repeat(40),current_main_sha:'a'.repeat(40)};
  assert.deepEqual(productionCandidateSeparationErrors({...base,changed_paths:[
    '_data/editions/2026-10-07.json','briefs/2026-10-07.md','briefs/images/2026-10-07/a.png',
    '_records/edition-execution/events/2026-10-07-run11/00.json','data/operations/active-production-run.json'
  ]}),[]);
  for(const path of [
    '_generator/lib/run-supervisor.mjs','.github/workflows/run-supervisor.yml',
    '_tools/validate-contracts.mjs','docs/operations/task-recovery-contracts.json'
  ]) assert.ok(productionCandidateSeparationErrors({...base,changed_paths:[path]}).includes('production_candidate_contains_hardening:'+path));
});

test('stale protected-main ancestry fails before candidate publication',()=>{
  const errors=productionCandidateSeparationErrors({
    branch:'reliable-edition/dab-edition-2026-10-07-run11',changed_paths:['briefs/2026-10-07.md'],
    baseline_main_sha:'a'.repeat(40),current_main_sha:'b'.repeat(40)
  });
  assert.ok(errors.includes('production_candidate_stale_main_ancestry'));
});

test('hardening queue contract is centralized and complete',()=>{
  const queue={schema_version:'hardening-queue-v1',updated_at:'2026-10-06T22:00:00Z',items:[{
    item_id:'p1-e-branch-separation',source_run:'reliable-edition-20261006-run10',source_task:'23',
    failure_fingerprint:'production-candidate-hardening-contamination',severity:'high',status:'in_progress',
    owner_type:'system_hardening',branch:'hardening/p1p2-branch-separation-2026-10-06',pr:null,merged_sha:null,
    regression_test:'_generator/test/branch-separation.test.mjs',production_dependency:true,next_run_gate:true
  }]};
  assert.deepEqual(validateHardeningQueue(queue),[]);
  queue.items.push(structuredClone(queue.items[0]));
  assert.ok(validateHardeningQueue(queue).some(x=>x.includes('hardening_queue_duplicate_item')));
});

test('bounded repair dependency resumes the same execution without replay',()=>{
  const receipt=candidateResumeDependency({
    execution_id:'reliable-edition-20261007-run11',repair_branch:'repair/run11-task17',
    merged_sha:'c'.repeat(40),regression_test:'node --test task17.test.mjs',verified_at:'2026-10-07T05:00:00Z'
  });
  assert.equal(receipt.resume_same_execution,true);
  assert.equal(receipt.preserve_completed_tasks,true);
  assert.equal(receipt.preserve_accepted_locked_images,true);
});
