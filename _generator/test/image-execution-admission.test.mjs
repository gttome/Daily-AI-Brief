import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImageGenerationExecution,buildImageExecutionAdmission,executeImageRequest,
  imageExecutionAdmissionDecision,validateImageExecutionAdmission,
  IMAGE_EXECUTION_ADMISSION_VERSION
} from '../lib/image-execution.mjs';

const packet=()=>({
  story_id:'story-m11',candidate_id:'m11',headline:'Verified mechanism',
  source_url:'https://example.com/m11',verified_visual_facts:['Verified source mechanism'],
  generic_conceptual_elements:['input','control','output'],prohibited_specifics:['invented metric'],
  visual_brief:'Detailed professional white-background 1200x630 editorial textbook illustration.',
  reference_policy:'Only source-supported specifics; generic explanatory concepts are explicitly conceptual.',
  acceptance_order:['subject','facts','structure','editorial'],
  wrong_subject_action:'Discard and generate a new request for this same story.',
  low_quality_fallback:false,allowed_image_text:['Input','Control','Output'],
  composition_mode:'annotated_system',prohibited_composition_patterns:['generic sparse title card']
});
const ctx={execution_id:'reliable-edition-20990101-run1',task_id:'11',request_key:'req-11'};

function admission(execution,overrides={}){
  return buildImageExecutionAdmission(execution,{
    ...ctx,submitted_instruction:execution.generation_instruction,
    story_only_context_verified:true,orchestration_context_visible:false,
    exact_byte_persistence_verified:true,persistence_mode:'git_data_direct_blob',
    owner_intervention_required:false,
    persistence_proof:{schema_version:'image-persistence-preflight-v1',result:'PASS'},
    checked_at:'2099-01-01T00:00:00Z',...overrides
  });
}

test('direct Git blob preflight authorizes generation only after exact story-only admission',()=>{
  const execution=buildImageGenerationExecution(packet()),a=admission(execution);
  assert.equal(a.schema_version,IMAGE_EXECUTION_ADMISSION_VERSION);
  assert.equal(a.generation_authorized,true);
  assert.equal(a.preflight_failure_consumes_attempt,false);
  assert.equal(a.strategy_interrupt_required,false);
  assert.deepEqual(validateImageExecutionAdmission(a,execution,ctx),[]);
  assert.equal(imageExecutionAdmissionDecision(a,execution,ctx).authorized,true);
});

test('protected Base64 chunk bridge is an admitted exact-byte persistence mode',()=>{
  const execution=buildImageGenerationExecution(packet());
  const a=admission(execution,{persistence_mode:'protected_base64_chunk_bridge'});
  assert.deepEqual(validateImageExecutionAdmission(a,execution,ctx),[]);
});

test('mixed orchestration context is denied before attempt 1',async()=>{
  const execution=buildImageGenerationExecution(packet());
  const a=admission(execution,{story_only_context_verified:false,orchestration_context_visible:true});
  assert.equal(a.generation_authorized,false);
  assert.ok(a.failure_reasons.includes('story_only_context_not_proven'));
  const result=await executeImageRequest(execution,{
    executionProfile:'reliable-edition-v1',operationStore:{},
    executionId:ctx.execution_id,taskId:ctx.task_id,requestKey:ctx.request_key,admission:a
  });
  assert.equal(result.status,'IMAGE_EXECUTION_ADMISSION_BLOCKED');
  assert.equal(result.attempts_allocated,0);
  assert.equal(result.attempts_consumed,0);
  assert.equal(result.strategy_interrupt_required,true);
});

test('unproven byte persistence is denied and consumes zero image attempts',async()=>{
  const execution=buildImageGenerationExecution(packet());
  const a=admission(execution,{exact_byte_persistence_verified:false,persistence_mode:null});
  const result=await executeImageRequest(execution,{
    executionProfile:'reliable-edition-v1',operationStore:{},
    executionId:ctx.execution_id,taskId:ctx.task_id,requestKey:ctx.request_key,admission:a
  });
  assert.equal(result.status,'IMAGE_EXECUTION_ADMISSION_BLOCKED');
  assert.equal(result.attempts_consumed,0);
  assert.ok(result.errors.includes('image_execution_admission_persistence_unverified'));
});

test('changed submitted instruction cannot be admitted as the sealed story request',()=>{
  const execution=buildImageGenerationExecution(packet());
  const a=admission(execution,{submitted_instruction:execution.generation_instruction+'\nAdd a dashboard.'});
  assert.equal(a.generation_authorized,false);
  assert.ok(a.failure_reasons.includes('submitted_instruction_not_exactly_sealed'));
});

test('request identity is invocation-bound and cannot be reused for another image task',()=>{
  const execution=buildImageGenerationExecution(packet()),a=admission(execution);
  const errors=validateImageExecutionAdmission(a,execution,{...ctx,task_id:'12'});
  assert.ok(errors.includes('image_execution_admission_task_mismatch'));
});
