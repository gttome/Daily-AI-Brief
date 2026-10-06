import {createHash} from 'node:crypto';
import {buildProductionRunCloseout} from './production-run-closeout.mjs';

export const ATOMIC_CLOSEOUT_VERSION='atomic-closeout-v1';
const h=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const sha=value=>/^[a-f0-9]{40}$/.test(value||'');
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

export function deriveIncidentInventory({
  repair_prs=[],protected_repairs=[],blocked_transitions=[],liveness_faults=[],failed_workers=[],
  dead_writer_proofs=[],strategy_interrupts=[],task23_recoveries=[],wake_actions=[]
}={}){
  const groups={repair_prs,protected_repairs,blocked_transitions,liveness_faults,failed_workers,dead_writer_proofs,strategy_interrupts,task23_recoveries,wake_actions};
  const items=[];
  for(const [kind,values] of Object.entries(groups)){
    for(const raw of values||[]){
      const value=typeof raw==='string'?raw:JSON.stringify(raw);
      items.push({kind,key:'sha256:'+h(kind+'|'+value),evidence:raw});
    }
  }
  return {schema_version:'closeout-incident-inventory-v1',items,
    counts:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,(v||[]).length])),
    digest:'sha256:'+h(items)};
}

export function validateIncidentLearningCoverage(inventory,learning_incident_keys=[]){
  const covered=new Set(learning_incident_keys||[]);
  const missing=(inventory?.items||[]).filter(item=>!covered.has(item.key)).map(item=>item.key);
  return {result:missing.length?'FAIL':'PASS',missing,covered_count:(inventory?.items||[]).length-missing.length,total:(inventory?.items||[]).length};
}

export function buildAtomicCloseoutTransaction(args,{
  incident_inventory={schema_version:'closeout-incident-inventory-v1',items:[],counts:{},digest:'sha256:'+h([])},
  learning_incident_keys=[],
  transaction_at=args?.now
}={}){
  if(!stamp(transaction_at))throw Error('atomic_closeout_clock_required');
  const pointer=args?.pointer,completion=args?.completion,validation=args?.validation,tasks=args?.tasks,events=args?.events||[];
  if(!pointer?.execution_id||!pointer?.edition_id||!sha(completion?.production_sha))throw Error('atomic_closeout_identity_required');
  if(completion.production_sha!==completion.deployed_sha||validation?.publication_sha!==completion.production_sha)
    throw Error('atomic_closeout_exact_sha_mismatch');
  if(completion?.live_verification?.final_result!=='pass')throw Error('atomic_closeout_live_verification_required');
  const done=new Set(events.filter(e=>(e.to||e.to_state)==='Done').map(e=>String(e.task_id).padStart(2,'0')));
  for(let n=0;n<=26;n++)if(!done.has(String(n).padStart(2,'0')))throw Error('atomic_closeout_requires_tasks_00_26_done');
  const coverage=validateIncidentLearningCoverage(incident_inventory,learning_incident_keys);
  if(coverage.result!=='PASS')throw Error('atomic_closeout_incident_learning_unreconciled:'+coverage.missing.join(','));
  const close=buildProductionRunCloseout(args);
  if(!['PUBLIC_CLOSED_PENDING_PROTECTED_PERSISTENCE','PRESERVED_TERMINAL_OR_INACTIVE'].includes(close.status))
    throw Error('atomic_closeout_builder_unexpected_status');
  if(close.status==='PRESERVED_TERMINAL_OR_INACTIVE')return {
    schema_version:ATOMIC_CLOSEOUT_VERSION,status:'ALREADY_CLOSED_VERIFIED',execution_id:pointer.execution_id,
    production_sha:completion.production_sha,ai_calls:0,owner_prompts:0,files:{},incident_inventory,learning_coverage:coverage
  };
  const prohibited=Object.keys(close.files).filter(p=>/\/events\/.*\/(?:23|24|25|26)-protected-closeout\.json$/.test(p));
  if(prohibited.length)throw Error('atomic_closeout_upstream_publication_tasks_not_preclosed:'+prohibited.join(','));
  const files={...close.files};
  const txId='sha256:'+h({execution_id:pointer.execution_id,production_sha:completion.production_sha,
    paths:Object.keys(files).sort(),incident_digest:incident_inventory.digest});
  files[`_records/edition-execution/closeout-transactions/${pointer.execution_id}.json`]={
    schema_version:ATOMIC_CLOSEOUT_VERSION,transaction_id:txId,status:'COMMIT_READY',
    execution_id:pointer.execution_id,edition_id:pointer.edition_id,production_sha:completion.production_sha,
    live_verified_at:completion.live_verified_at||null,prepared_at:transaction_at,
    tasks_closed:['27','28','29'],ai_calls:0,owner_prompts:0,editorial_work:false,image_work:false,deployment_work:false,
    incident_inventory,learning_coverage:coverage,file_count:Object.keys(files).length+1
  };
  return {schema_version:ATOMIC_CLOSEOUT_VERSION,status:'COMMIT_READY',transaction_id:txId,
    execution_id:pointer.execution_id,edition_id:pointer.edition_id,production_sha:completion.production_sha,
    ai_calls:0,owner_prompts:0,files,incident_inventory,learning_coverage:coverage};
}

export function simulateAtomicCommit(transaction,{existing={},crash_after=null}={}){
  if(transaction?.schema_version!==ATOMIC_CLOSEOUT_VERSION)throw Error('atomic_closeout_transaction_required');
  if(transaction.status==='ALREADY_CLOSED_VERIFIED')return {status:'ALREADY_CLOSED_VERIFIED',visible:{...existing},writes:0};
  const staged={...existing};let writes=0;
  for(const [path,value] of Object.entries(transaction.files)){
    staged[path]=structuredClone(value);writes++;
    if(Number.isInteger(crash_after)&&writes===crash_after)return {status:'CRASHED_BEFORE_COMMIT',visible:{...existing},staged,writes};
  }
  return {status:'COMMITTED',visible:staged,writes};
}
