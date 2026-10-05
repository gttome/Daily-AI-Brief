import test from 'node:test';
import assert from 'node:assert/strict';
import {IMAGE_EXECUTION_ADMISSION_VERSION,IMAGE_GENERATOR_CONTEXT_MODE,evaluateImageExecutionAdmission,assertImageExecutionAdmission} from '../lib/image-execution-admission.mjs';

const base={
  execution_id:'reliable-edition-test',task_id:'11',request_key:'req',candidate_id:'m02',
  sealed_instruction:'Detailed professional story-only mechanism illustration with exact labels and no people or orchestration content.',
  submitted_instruction:'Detailed professional story-only mechanism illustration with exact labels and no people or orchestration content.',
  generator_context_mode:IMAGE_GENERATOR_CONTEXT_MODE,
  orchestration_context_visible:false,
  runtime_bytes_readable:true,
  persistence_mode:'protected_base64_chunk_bridge',
  persistence_preflight_pass:true,
  owner_intervention_required:false,
  observed_at:'2026-10-05T03:20:00Z'
};

test('image execution admission passes only after story isolation and exact-byte persistence are both proven',()=>{
  const r=evaluateImageExecutionAdmission(base);
  assert.equal(r.schema_version,IMAGE_EXECUTION_ADMISSION_VERSION);
  assert.equal(r.generation_authorized,true);
  assert.equal(r.preflight_failure_consumes_attempt,false);
  assert.equal(r.story_only_context_verified,true);
  assert.equal(r.exact_byte_persistence_verified,true);
});

test('mixed Watchdog or orchestration context blocks generation before attempt budget begins',()=>{
  const r=evaluateImageExecutionAdmission({...base,orchestration_context_visible:true});
  assert.equal(r.generation_authorized,false);
  assert.equal(r.preflight_failure_consumes_attempt,false);
  assert.ok(r.errors.includes('orchestration_context_must_be_absent_from_generator'));
});

test('missing byte bridge blocks generation before attempt budget begins',()=>{
  const r=evaluateImageExecutionAdmission({...base,runtime_bytes_readable:false,persistence_preflight_pass:false,persistence_mode:null});
  assert.equal(r.generation_authorized,false);
  assert.ok(r.errors.includes('runtime_generated_bytes_must_be_readable_before_generation'));
  assert.ok(r.errors.includes('approved_exact_byte_persistence_mode_required'));
  assert.ok(r.errors.includes('exact_byte_persistence_preflight_required'));
});

test('direct Git blob and protected chunk bridge are the only admitted persistence modes',()=>{
  assert.equal(evaluateImageExecutionAdmission({...base,persistence_mode:'git_data_direct_blob'}).generation_authorized,true);
  assert.throws(()=>assertImageExecutionAdmission({...base,persistence_mode:'owner_upload'}),/IMAGE_EXECUTION_ADMISSION_BLOCKED/);
});
