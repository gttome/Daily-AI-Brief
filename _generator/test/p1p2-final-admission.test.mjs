import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('P1/P2 next-run GO receipt is internally consistent',()=>{
  const r=JSON.parse(fs.readFileSync('_records/hardening/p1-p2-2026-10-06/next-run-admission.json','utf8'));
  assert.equal(r.decision,'GO');
  assert.equal(r.all_gates_pass,true);
  assert.equal(Object.values(r.gates||{}).every(value=>value===true),true);
  assert.equal(r.observations?.owner_prompt_required_by_rehearsal,false);
  assert.equal(r.observations?.happy_path_wake_pr_required,false);
  assert.equal(r.production_runtime_boundary?.work_invocations,0);
  assert.equal(r.production_runtime_boundary?.codex_invocations,0);
  assert.equal(r.production_runtime_boundary?.paid_model_api_calls,0);
  assert.equal(r.production_runtime_boundary?.owner_liveness_prompts,0);
  assert.equal(r.owner_liveness_prompt_dependency,false);
});
