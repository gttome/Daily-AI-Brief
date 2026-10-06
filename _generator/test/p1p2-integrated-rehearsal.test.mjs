import test from 'node:test';
import assert from 'node:assert/strict';
import {runP1P2IntegratedRehearsal} from '../lib/p1p2-integrated-rehearsal.mjs';

test('final integrated P1/P2 rehearsal passes every required stage and fault injection',async()=>{
  const receipt=await runP1P2IntegratedRehearsal({
    repo_root:'.',
    protected_main_sha:'a'.repeat(40),
    protected_main_ci_run_id:1,
    protected_main_ci_conclusion:'success',
    rehearsal_run_id:99,
    observed_at:'2099-02-03T02:00:00Z'
  });
  assert.equal(receipt.result,'PASS');
  assert.equal(receipt.mode,'NON_PRODUCTION');
  assert.equal(receipt.production_run_reopened,false);
  assert.equal(Object.keys(receipt.stages).filter(k=>receipt.stages[k]?.result==='FAIL').length,0);
  assert.equal(Object.keys(receipt.fault_injections).length,10);
  assert.equal(Object.values(receipt.fault_injections).every(x=>x.result==='PASS'),true);
  assert.equal(receipt.metrics.production_work_invocations,0);
  assert.equal(receipt.metrics.codex_invocations,0);
  assert.equal(receipt.metrics.paid_model_api_calls,0);
  assert.equal(receipt.metrics.owner_liveness_prompts,0);
  assert.equal(receipt.metrics.wake_prs,0);
  assert.equal(receipt.metrics.closeout_ai_calls,0);
  assert.ok(receipt.metrics.watchdog_expanded_read_rate<=0.10);
  assert.equal(receipt.stages.real_native_image_capability_proof.result,'PASS');
  assert.equal(receipt.stages.real_native_image_capability_proof.accepted_historical_images_modified,false);
  assert.equal(receipt.next_action,'BUILD_FINAL_GO_NO_GO_RECEIPTS');
});

test('rehearsal refuses unverified protected-main CI identity',async()=>{
  await assert.rejects(
    runP1P2IntegratedRehearsal({repo_root:'.',protected_main_sha:'a'.repeat(40),protected_main_ci_run_id:0}),
    /verified_protected_main_ci_required/
  );
});
