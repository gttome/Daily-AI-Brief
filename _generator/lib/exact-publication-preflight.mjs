export const EXACT_PUBLICATION_PREFLIGHT_VERSION='exact-publication-preflight-v1';

const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const uniq=values=>[...new Set((values||[]).filter(Boolean))];

export function classifyPublicationPreflightError(error=''){
  const value=String(error);
  if(value.startsWith('publication_manifest_'))return 'publication_manifest_compatibility';
  if(value.includes('frozen')||value.includes('migration'))return 'frozen_contract_migration_boundary';
  if(value.includes('image_')||value.includes('accepted_locked')||value.includes('canvas'))return 'locked_image_canvas_integration';
  if(value.includes('current_edition_pointer')||value.includes('historical')||value.includes('mutable_current'))return 'historical_edition_independence';
  if(value.startsWith('reader:')||value.includes('canonical_mismatch')||value.includes('reader_')||value.includes('permanent_story_semantic'))return 'reader_projection_contract';
  if(value.includes('required_derived_file')||value.includes('required_teaser_surface')||value.includes('projection')||value.includes('route'))
    return 'deterministic_projection_set';
  return 'other_deterministic_preflight';
}

export function buildExactPublicationPreflightReceipt({
  edition_id,edition_date,candidate_sha=null,manifest_errors=[],candidate_errors=[],reader_result=null,
  expected_deployment_routes=[],checked_at=new Date().toISOString()
}={}){
  if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id||'')||edition_id!=='dab-edition-'+edition_date)
    throw Error('exact_publication_preflight_identity_required');
  if(candidate_sha!==null&&!/^[a-f0-9]{40}$/.test(candidate_sha))throw Error('exact_publication_preflight_candidate_sha_invalid');
  if(!stamp(checked_at))throw Error('exact_publication_preflight_clock_required');
  if(!Array.isArray(manifest_errors)||!Array.isArray(candidate_errors)||!Array.isArray(expected_deployment_routes))
    throw Error('exact_publication_preflight_arrays_required');
  const readerErrors=reader_result?.result==='PASS'?[]:(reader_result?.errors||['reader_semantic_preflight_missing_or_failed']).map(x=>'reader:'+x);
  const errors=uniq([...manifest_errors,...candidate_errors,...readerErrors]);
  const failureClasses=uniq(errors.map(classifyPublicationPreflightError)).sort();
  return {
    schema_version:EXACT_PUBLICATION_PREFLIGHT_VERSION,
    edition_id,edition_date,candidate_sha,checked_at,
    model_calls:0,
    publication_pr_opened:false,
    result:errors.length?'FAIL':'PASS',
    checks:{
      publication_manifest_compatibility:manifest_errors.length===0,
      publication_candidate_contract:candidate_errors.length===0,
      reader_semantic_close_prerequisites:reader_result?.result==='PASS',
      exact_projection_routes:expected_deployment_routes.length>=10
    },
    expected_deployment_routes:[...expected_deployment_routes],
    failure_classes:failureClasses,
    errors
  };
}

export function validateExactPublicationPreflightReceipt(receipt={}){
  const errors=[];
  if(receipt.schema_version!==EXACT_PUBLICATION_PREFLIGHT_VERSION)errors.push('exact_publication_preflight_schema');
  if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(receipt.edition_id||'')||receipt.edition_id!=='dab-edition-'+receipt.edition_date)
    errors.push('exact_publication_preflight_identity');
  if(receipt.candidate_sha!==null&&!/^[a-f0-9]{40}$/.test(receipt.candidate_sha||''))errors.push('exact_publication_preflight_candidate_sha');
  if(!stamp(receipt.checked_at))errors.push('exact_publication_preflight_clock');
  if(receipt.model_calls!==0)errors.push('exact_publication_preflight_model_calls_must_be_zero');
  if(receipt.publication_pr_opened!==false)errors.push('exact_publication_preflight_must_precede_pr');
  if(!Array.isArray(receipt.errors)||!Array.isArray(receipt.failure_classes)||!Array.isArray(receipt.expected_deployment_routes))
    errors.push('exact_publication_preflight_arrays');
  if(receipt.result!==(receipt.errors?.length?'FAIL':'PASS'))errors.push('exact_publication_preflight_result_mismatch');
  if(receipt.result==='PASS'){
    if(Object.values(receipt.checks||{}).some(value=>value!==true))errors.push('exact_publication_preflight_pass_check_false');
    if(receipt.expected_deployment_routes.length<10)errors.push('exact_publication_preflight_route_set_incomplete');
  }
  return [...new Set(errors)];
}
