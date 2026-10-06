export const PUBLICATION_PREREQUISITE_GATE_VERSION='publication-prerequisite-gate-v1';

const sha=value=>/^[a-f0-9]{40}$/.test(value||'');
const digest=value=>/^sha256:[a-f0-9]{64}$/.test(value||'');
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];

export const PUBLICATION_PREREQUISITE_CHECKS=Object.freeze([
  'candidate_identity',
  'protected_main_ancestry',
  'production_candidate_branch_separation',
  'publication_manifest',
  'sealed_artifact_digests',
  'accepted_image_immutability',
  'watchlist_projection',
  'book_mappings',
  'operational_learning_input',
  'reader_projection',
  'accessibility',
  'archive_feed_routes',
  'candidate_frozen'
]);

export function buildPublicationPrerequisiteGate({
  edition_id,execution_id,branch,candidate_sha,candidate_content_digest,baseline_main_sha,
  checks={},errors_by_check={},expected_deployment_routes=[],checked_at=new Date().toISOString()
}={}){
  if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(edition_id||'')||!execution_id||!branch||
     !sha(candidate_sha)||!digest(candidate_content_digest)||!sha(baseline_main_sha)||!stamp(checked_at))
    throw Error('publication_prerequisite_identity_required');
  const normalized={};
  const errors=[];
  for(const name of PUBLICATION_PREREQUISITE_CHECKS){
    const local=uniq(errors_by_check[name]||[]);
    const pass=checks[name]===true&&local.length===0;
    normalized[name]={result:pass?'PASS':'FAIL',errors:local};
    if(!pass)errors.push(...(local.length?local:[name+'_failed']));
  }
  if(expected_deployment_routes.length<10){
    normalized.archive_feed_routes={result:'FAIL',errors:['deployment_route_set_incomplete']};
    errors.push('deployment_route_set_incomplete');
  }
  const result=errors.length?'FAIL':'PASS';
  return {
    schema_version:PUBLICATION_PREREQUISITE_GATE_VERSION,
    edition_id,execution_id,branch,candidate_sha,candidate_content_digest,baseline_main_sha,checked_at,
    model_calls:0,work_invocations:0,codex_invocations:0,paid_model_api_calls:0,
    publication_pr_opened:false,candidate_frozen:result==='PASS',
    expected_deployment_routes:[...expected_deployment_routes],
    checks:normalized,errors:uniq(errors),result,
    next_action:result==='PASS'?'OPEN_EXACTLY_ONE_PROTECTED_PUBLICATION_PR':'DO_NOT_OPEN_PUBLICATION_PR'
  };
}

export function validatePublicationPrerequisiteGate(receipt={}){
  const errors=[];
  if(receipt.schema_version!==PUBLICATION_PREREQUISITE_GATE_VERSION)errors.push('publication_prerequisite_gate_schema');
  if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(receipt.edition_id||'')||!receipt.execution_id||!receipt.branch)
    errors.push('publication_prerequisite_gate_identity');
  for(const key of ['candidate_sha','baseline_main_sha'])if(!sha(receipt[key]))errors.push('publication_prerequisite_gate_'+key);
  if(!digest(receipt.candidate_content_digest))errors.push('publication_prerequisite_gate_candidate_digest');
  if(!stamp(receipt.checked_at))errors.push('publication_prerequisite_gate_clock');
  for(const key of ['model_calls','work_invocations','codex_invocations','paid_model_api_calls'])if(receipt[key]!==0)errors.push('publication_prerequisite_gate_zero_usage:'+key);
  if(receipt.publication_pr_opened!==false)errors.push('publication_prerequisite_gate_must_precede_pr');
  if(!Array.isArray(receipt.expected_deployment_routes)||!Array.isArray(receipt.errors))errors.push('publication_prerequisite_gate_arrays');
  for(const name of PUBLICATION_PREREQUISITE_CHECKS)if(!['PASS','FAIL'].includes(receipt.checks?.[name]?.result))errors.push('publication_prerequisite_check_missing:'+name);
  const failed=PUBLICATION_PREREQUISITE_CHECKS.some(name=>receipt.checks?.[name]?.result!=='PASS')||receipt.expected_deployment_routes?.length<10;
  if(receipt.result!==(failed?'FAIL':'PASS'))errors.push('publication_prerequisite_gate_result');
  if(receipt.result==='PASS'&&(receipt.candidate_frozen!==true||receipt.next_action!=='OPEN_EXACTLY_ONE_PROTECTED_PUBLICATION_PR'))errors.push('publication_prerequisite_gate_pass_semantics');
  if(receipt.result==='FAIL'&&receipt.next_action!=='DO_NOT_OPEN_PUBLICATION_PR')errors.push('publication_prerequisite_gate_fail_semantics');
  return uniq(errors);
}

export function publicationPrDecision(receipt={},existingPrs=[]){
  const invalid=validatePublicationPrerequisiteGate(receipt);
  if(invalid.length||receipt.result!=='PASS')return {allowed:false,action:'DO_NOT_OPEN_PUBLICATION_PR',reason:invalid[0]||receipt.errors?.[0]||'prerequisite_gate_failed'};
  const exact=(existingPrs||[]).filter(pr=>pr?.candidate_sha===receipt.candidate_sha);
  if(exact.length>1)return {allowed:false,action:'FAIL_CLOSED',reason:'duplicate_exact_candidate_prs'};
  if(exact.length===1)return {allowed:true,action:'REUSE_EXACT_PUBLICATION_PR',pr:exact[0]};
  return {allowed:true,action:'OPEN_EXACTLY_ONE_PROTECTED_PUBLICATION_PR'};
}
