import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const policyPath=fileURLToPath(new URL('../../_data/command-center-access-policy.json',import.meta.url));
export function loadCommandCenterAccessPolicy(){return JSON.parse(fs.readFileSync(policyPath,'utf8'));}

export function classifyCommandCenterObservation(observation,{ownerAuthenticated=false}={}){
 const policy=loadCommandCenterAccessPolicy();
 switch(observation){
  case 'signed_out_dashboard_read': return {result:'PASS',reason:'Link-accessible read-only dashboard is expected.'};
  case 'signed_out_public_safe_aggregate_read': return {result:'PASS',reason:'Approved aggregate/public-safe signals may be visible.'};
  case 'signed_out_owner_operation_owner_identity_required': return {result:'PASS',reason:'Owner identity requirement is an expected security control.'};
  case 'signed_out_owner_operation_not_executed': return {result:'NOT_APPLICABLE',reason:'Signed-out validation does not execute owner-only operations.'};
  case 'signed_out_state_mutation': return {result:'FAIL',severity:'critical',reason:'State mutation must remain owner-only.'};
  case 'signed_out_private_record_read': return {result:'FAIL',severity:'critical',reason:'Private records/comments must not be readable signed out.'};
  case 'owner_operation_owner_identity_required': return ownerAuthenticated
    ? {result:'FAIL',severity:'high',reason:'Authenticated owner workflow is incorrectly blocked.'}
    : {result:'PASS',reason:'Signed-out owner-only operation is correctly blocked.'};
  case 'documentation_claims_dashboard_is_private': return {result:'FAIL',severity:'medium',reason:'Documentation drift: dashboard is link-accessible read-only, not wholly private.'};
  default: throw Error('Unknown Command Center access observation: '+observation);
 }
}

export function commandCenterAccessContract(){
 const p=loadCommandCenterAccessPolicy();
 return {dashboard_read_access:p.dashboard_read_access,viewer_mode:p.viewer_mode,owner_authentication_required_for:p.owner_authentication_required_for,validator_classification:p.validator_classification};
}
