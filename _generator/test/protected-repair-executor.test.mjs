import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRepairKey,
  buildProtectedRepairRecord,
  validateProtectedRepairRecord,
  selectRepairPr,
  exactHeadCiGate,
  mergeGate,
  parseGitHubActionsOwner,
  buildDeadWriterProof,
  validateDeadWriterProof,
  writerTakeoverDecision,
  verifyProtectedRepairProgress,
  syntheticProtectedRepairTrace
} from '../lib/protected-repair-executor.mjs';

const active={active:true,terminal:false,execution_id:'exec-1',edition_id:'edition-1',branch:'production/run-1'};
const record=buildProtectedRepairRecord({
  execution_id:'exec-1',
  edition_id:'edition-1',
  execution_key:'key-1',
  production_branch:'production/run-1',
  task_id:'11',
  incident_id:'inc-1',
  repair_branch:'repair/inc-1',
  repair_branch_head_sha:'a'.repeat(40),
  repair_scope_digest:'sha256:scope',
  required_checks:['validate'],
  created_at:'2026-10-04T06:00:00Z'
});
const goodChecks=[{name:'validate',status:'completed',conclusion:'success'}];

test('repair key is deterministic',()=>{
  assert.equal(record.repair_key,buildRepairKey(record));
});

test('protected repair record validates against exact active execution',()=>{
  assert.deepEqual(validateProtectedRepairRecord(record,active),[]);
});

test('active execution mismatch fails closed',()=>{
  assert.ok(validateProtectedRepairRecord(record,{...active,execution_id:'other'}).includes('execution_mismatch'));
});

test('terminal execution cannot accept protected repair',()=>{
  assert.ok(validateProtectedRepairRecord(record,{...active,active:false,terminal:true}).includes('active_execution_required'));
});

test('exact one PR is reused',()=>{
  const pr={number:9,state:'OPEN',baseRefName:'main',headRefName:record.repair_branch,headRefOid:record.repair_branch_head_sha,body:'Repair-Key: '+record.repair_key};
  assert.equal(selectRepairPr([pr],record).number,9);
});

test('duplicate Watchdogs cannot create duplicate repair PR identity',()=>{
  const pr={number:9,state:'OPEN',baseRefName:'main',headRefName:record.repair_branch,headRefOid:record.repair_branch_head_sha,body:'Repair-Key: '+record.repair_key};
  assert.throws(()=>selectRepairPr([pr,{...pr,number:10}],record),/duplicate_protected_repair_pr/);
});

test('exact-head CI PASS permits merge',()=>{
  const ci=exactHeadCiGate({record,observed_head_sha:record.repair_branch_head_sha,check_runs:goodChecks});
  assert.equal(ci.allowed,true);
  assert.equal(mergeGate({record,activePointer:active,current_task:'11',observed_head_sha:record.repair_branch_head_sha,ciGate:ci}).allowed,true);
});

test('CI FAIL prevents merge and remains a continuation state',()=>{
  const ci=exactHeadCiGate({record,observed_head_sha:record.repair_branch_head_sha,check_runs:[{name:'validate',status:'completed',conclusion:'failure'}]});
  assert.equal(ci.allowed,false);
  assert.equal(ci.state,'REPAIR_CI_FAIL');
  assert.equal(mergeGate({record,activePointer:active,current_task:'11',observed_head_sha:record.repair_branch_head_sha,ciGate:ci}).allowed,false);
});

test('repair branch head movement fails closed',()=>{
  assert.equal(exactHeadCiGate({record,observed_head_sha:'b'.repeat(40),check_runs:goodChecks}).state,'REPAIR_HEAD_CHANGED');
});

test('active task mismatch fails closed',()=>{
  const ci=exactHeadCiGate({record,observed_head_sha:record.repair_branch_head_sha,check_runs:goodChecks});
  assert.equal(mergeGate({record,activePointer:active,current_task:'12',observed_head_sha:record.repair_branch_head_sha,ciGate:ci}).state,'REPAIR_EXECUTION_MISMATCH');
});

test('GitHub Actions owner identity is parsed exactly',()=>{
  assert.deepEqual(parseGitHubActionsOwner('github-actions-37178305599-2'),{workflow_run_id:37178305599,run_attempt:2});
});

test('failed workflow writer can be superseded immediately with exact evidence',()=>{
  const lease={execution_id:'exec-1',owner_id:'github-actions-100-1',generation:20,expires_at:'2026-10-04T12:00:00Z'};
  const proof=buildDeadWriterProof({
    lease,
    workflow_run:{id:100,status:'completed',conclusion:'failure',updated_at:'2026-10-04T06:01:00Z'},
    proved_dead_at:'2026-10-04T06:01:01Z'
  });
  assert.deepEqual(validateDeadWriterProof(proof,lease),[]);
  assert.equal(writerTakeoverDecision({
    lease,
    request_execution_id:'exec-1',
    request_owner_id:'github-actions-200-1',
    dead_writer_proof:proof,
    now:'2026-10-04T06:02:00Z'
  }).allowed,true);
});

test('cancelled workflow writer can be superseded immediately',()=>{
  const lease={execution_id:'exec-1',owner_id:'github-actions-101-1',generation:20,expires_at:'2026-10-04T12:00:00Z'};
  const proof=buildDeadWriterProof({
    lease,
    workflow_run:{id:101,status:'completed',conclusion:'cancelled'},
    proved_dead_at:'2026-10-04T06:01:01Z'
  });
  assert.equal(writerTakeoverDecision({
    lease,
    request_execution_id:'exec-1',
    request_owner_id:'github-actions-201-1',
    dead_writer_proof:proof,
    now:'2026-10-04T06:02:00Z'
  }).allowed,true);
});

test('live workflow writer cannot be stolen',()=>{
  const lease={execution_id:'exec-1',owner_id:'github-actions-102-1',generation:20,expires_at:'2026-10-04T12:00:00Z'};
  assert.equal(writerTakeoverDecision({
    lease,
    request_execution_id:'exec-1',
    request_owner_id:'github-actions-202-1',
    now:'2026-10-04T06:02:00Z'
  }).allowed,false);
  assert.throws(()=>buildDeadWriterProof({
    lease,
    workflow_run:{id:102,status:'in_progress',conclusion:null},
    proved_dead_at:'2026-10-04T06:01:01Z'
  }),/terminal_failure_or_cancel/);
});

test('explicit exact-task handoff remains available to the native-image consumer',()=>{
  const lease={execution_id:'exec-1',owner_id:'github-actions-102-1',generation:20,expires_at:'2026-10-04T12:00:00Z'};
  assert.equal(writerTakeoverDecision({
    lease,
    request_execution_id:'exec-1',
    request_owner_id:'scheduled-image-worker',
    authorized_handoff:true,
    now:'2026-10-04T06:02:00Z'
  }).reason,'explicit_exact_task_handoff');
});

test('merge alone is not recovery success',()=>{
  assert.equal(verifyProtectedRepairProgress({record,merge_sha:'b'.repeat(40)}).verified,false);
});

test('same production task resumes only with real executor and durable progress',()=>{
  assert.equal(verifyProtectedRepairProgress({
    record,
    merge_sha:'b'.repeat(40),
    same_task_resumed:true,
    executor_active:true,
    durable_progress:true,
    post_repair_attempts:1
  }).verified,true);
});

test('post-repair attempt stays bounded to exactly one',()=>{
  assert.equal(verifyProtectedRepairProgress({
    record,
    merge_sha:'b'.repeat(40),
    same_task_resumed:true,
    executor_active:true,
    durable_progress:true,
    post_repair_attempts:2
  }).verified,false);
});

test('accepted_locked mutation fails recovery verification',()=>{
  assert.equal(verifyProtectedRepairProgress({
    record,
    merge_sha:'b'.repeat(40),
    same_task_resumed:true,
    executor_active:true,
    durable_progress:true,
    accepted_locked_changed:true
  }).verified,false);
});

test('synthetic branch to PR to CI to merge to same-task progress trace passes',()=>{
  const trace=syntheticProtectedRepairTrace();
  assert.equal(trace.ci.allowed,true);
  assert.equal(trace.merge.allowed,true);
  assert.equal(trace.progress.verified,true);
  assert.deepEqual(trace.states,[
    'PROTECTED_REPAIR_REQUIRED',
    'REPAIR_PR_OPENED',
    'REPAIR_CI_PASS',
    'REPAIR_MERGED',
    'SAME_TASK_RESUMED',
    'RECOVERY_VERIFIED_PROGRESSING'
  ]);
});
