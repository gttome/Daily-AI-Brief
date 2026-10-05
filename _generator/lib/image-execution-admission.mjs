import {createHash} from 'node:crypto';

export const IMAGE_EXECUTION_ADMISSION_VERSION='image-execution-admission-v1';
export const IMAGE_PERSISTENCE_MODES=Object.freeze(['git_data_direct_blob','protected_base64_chunk_bridge']);
export const IMAGE_GENERATOR_CONTEXT_MODE='dedicated_story_only_generation_context';

const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const hash=v=>createHash('sha256').update(String(v)).digest('hex');

export function evaluateImageExecutionAdmission({
  execution_id,task_id,request_key,candidate_id,
  sealed_instruction=null,submitted_instruction=null,
  generator_context_mode=null,orchestration_context_visible=null,
  runtime_bytes_readable=false,persistence_mode=null,
  persistence_preflight_pass=false,owner_intervention_required=false,
  observed_at=new Date().toISOString()
}={}){
  const errors=[];
  const task=String(task_id||'').padStart(2,'0');
  if(!execution_id||!/^1[1-6]$/.test(task)||!request_key||!candidate_id||!stamp(observed_at))
    errors.push('image_admission_identity_invalid');
  if(typeof sealed_instruction!=='string'||sealed_instruction.length<40)
    errors.push('sealed_story_instruction_required');
  if(submitted_instruction!==sealed_instruction)
    errors.push('submitted_instruction_must_equal_sealed_story_instruction');
  if(generator_context_mode!==IMAGE_GENERATOR_CONTEXT_MODE)
    errors.push('dedicated_story_only_generation_context_required');
  if(orchestration_context_visible!==false)
    errors.push('orchestration_context_must_be_absent_from_generator');
  if(runtime_bytes_readable!==true)
    errors.push('runtime_generated_bytes_must_be_readable_before_generation');
  if(!IMAGE_PERSISTENCE_MODES.includes(persistence_mode))
    errors.push('approved_exact_byte_persistence_mode_required');
  if(persistence_preflight_pass!==true)
    errors.push('exact_byte_persistence_preflight_required');
  if(owner_intervention_required!==false)
    errors.push('owner_intervention_prohibited');
  const generation_authorized=errors.length===0;
  return {
    schema_version:IMAGE_EXECUTION_ADMISSION_VERSION,
    execution_id,task_id:task,request_key,candidate_id,
    observed_at,
    story_only_context_verified:generation_authorized,
    exact_byte_persistence_verified:generation_authorized,
    owner_intervention_required:false,
    generation_authorized,
    preflight_failure_consumes_attempt:false,
    generator_context_mode:generator_context_mode||null,
    orchestration_context_visible:orchestration_context_visible===true,
    sealed_instruction_sha256:typeof sealed_instruction==='string'?hash(sealed_instruction):null,
    submitted_instruction_sha256:typeof submitted_instruction==='string'?hash(submitted_instruction):null,
    persistence_mode:persistence_mode||null,
    persistence_preflight_pass:persistence_preflight_pass===true,
    errors
  };
}

export function assertImageExecutionAdmission(input={}){
  const result=evaluateImageExecutionAdmission(input);
  if(!result.generation_authorized)throw Error('IMAGE_EXECUTION_ADMISSION_BLOCKED:'+result.errors.join(','));
  return result;
}
