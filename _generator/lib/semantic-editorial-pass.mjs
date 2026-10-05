import {kernelReceipt,validateEditorialKernel} from './editorial-kernel.mjs';

export const SEMANTIC_EDITORIAL_PASS_VERSION='one-semantic-editorial-pass-v1';
const digest=value=>typeof value==='string'&&/^sha256:[a-f0-9]{64}$/.test(value);
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const text=value=>typeof value==='string'&&value.trim()?value.trim():null;

export function buildSemanticEditorialPassReceipt({
  execution_id,edition_id,evidence_digest,kernel,performed_at=new Date().toISOString()
}={}){
  const errors=validateEditorialKernel(kernel);
  if(errors.length)throw Error('editorial_kernel_invalid:'+errors.join(';'));
  if(!text(execution_id)||kernel.edition_id!==edition_id)throw Error('semantic_editorial_pass_identity_required');
  if(!digest(evidence_digest))throw Error('semantic_editorial_pass_evidence_digest_required');
  if(!stamp(performed_at))throw Error('semantic_editorial_pass_clock_required');
  const kernelInfo=kernelReceipt(kernel);
  return {
    schema_version:SEMANTIC_EDITORIAL_PASS_VERSION,
    execution_id,edition_id,evidence_digest,
    editorial_semantic_passes:1,
    post_editorial_semantic_validation_passes:0,
    additional_semantic_pass_reason:null,
    semantic_input_invalidated:false,
    output_kernel_digest:'sha256:'+kernelInfo.kernel_sha256,
    deterministic_handoff_ready:kernelInfo.deterministic_handoff_ready===true,
    later_repair_reused_semantic_result:false,
    performed_at
  };
}

export function semanticEditorialReuseDecision(receipt,{evidence_digest}={}){
  const errors=validateSemanticEditorialPassReceipt(receipt);
  if(errors.length)return {reuse:false,reason:'invalid_semantic_receipt',errors};
  if(!digest(evidence_digest))return {reuse:false,reason:'invalid_evidence_digest'};
  if(receipt.evidence_digest!==evidence_digest)
    return {reuse:false,reason:'semantic_input_digest_changed',requires_documented_invalidation:true};
  return {reuse:true,reason:'semantic_input_digest_unchanged',kernel_digest:receipt.output_kernel_digest};
}

export function markSemanticResultReused(receipt,{evidence_digest}={}){
  const decision=semanticEditorialReuseDecision(receipt,{evidence_digest});
  if(!decision.reuse)throw Error(decision.reason);
  return {...receipt,later_repair_reused_semantic_result:true};
}

export function authorizeAdditionalSemanticPass(receipt,{new_evidence_digest,reason,performed_at=new Date().toISOString()}={}){
  const errors=validateSemanticEditorialPassReceipt(receipt);
  if(errors.length)throw Error(errors.join(';'));
  if(!digest(new_evidence_digest)||new_evidence_digest===receipt.evidence_digest)
    throw Error('additional_semantic_pass_requires_changed_evidence_digest');
  if(!text(reason))throw Error('additional_semantic_pass_reason_required');
  if(!stamp(performed_at))throw Error('semantic_editorial_pass_clock_required');
  return {
    ...receipt,
    evidence_digest:new_evidence_digest,
    editorial_semantic_passes:receipt.editorial_semantic_passes+1,
    additional_semantic_pass_reason:reason.trim(),
    semantic_input_invalidated:true,
    later_repair_reused_semantic_result:false,
    performed_at
  };
}

export function validateSemanticEditorialPassReceipt(receipt={}){
  const errors=[];
  if(receipt.schema_version!==SEMANTIC_EDITORIAL_PASS_VERSION)errors.push('semantic_editorial_pass_schema');
  if(!text(receipt.execution_id)||!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(receipt.edition_id||''))errors.push('semantic_editorial_pass_identity');
  if(!digest(receipt.evidence_digest)||!digest(receipt.output_kernel_digest))errors.push('semantic_editorial_pass_digest');
  if(!Number.isInteger(receipt.editorial_semantic_passes)||receipt.editorial_semantic_passes<1)errors.push('semantic_editorial_pass_count');
  if(receipt.post_editorial_semantic_validation_passes!==0)errors.push('post_editorial_semantic_validation_must_be_zero');
  if(receipt.editorial_semantic_passes===1&&(receipt.additional_semantic_pass_reason!==null||receipt.semantic_input_invalidated!==false))
    errors.push('normal_path_must_be_one_semantic_pass');
  if(receipt.editorial_semantic_passes>1&&(!text(receipt.additional_semantic_pass_reason)||receipt.semantic_input_invalidated!==true))
    errors.push('additional_semantic_pass_requires_documented_input_invalidation');
  if(receipt.deterministic_handoff_ready!==true)errors.push('semantic_editorial_deterministic_handoff_required');
  if(typeof receipt.later_repair_reused_semantic_result!=='boolean')errors.push('semantic_editorial_reuse_flag');
  if(!stamp(receipt.performed_at))errors.push('semantic_editorial_pass_clock');
  return [...new Set(errors)];
}
