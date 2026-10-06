import {createHash} from 'node:crypto';
import {buildWorkerRequest} from './run-supervisor.mjs';

export const TRANSITION_EVENT_VERSION='run-transition-event-v1';
export const TRANSITION_DISPATCH_VERSION='run-transition-dispatch-v1';
const TASK_STATE=new Set(['Backlog','Ready','Active','Tested','Blocked','Done']);
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const sha=value=>'sha256:'+createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
function stable(value){
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
const task=value=>String(value??'').padStart(2,'0');

export function substantiveTransition(raw={}){
  const prior=raw.prior_state??raw.from??raw.from_state??null;
  const next=raw.new_state??raw.to??raw.to_state??raw.state??null;
  const type=String(raw.event_type||'').toLowerCase();
  if(['heartbeat','health','lease_renewal','pointer_refresh','kanban_projection'].includes(type))return false;
  return TASK_STATE.has(prior)&&TASK_STATE.has(next)&&prior!==next&&stamp(raw.timestamp||raw.at);
}

export function buildCanonicalTransitionEvent({
  raw,execution_id,edition_id,writer_generation=1,request_key=null,
  content_state={},next_task_contract=null,next_task_id=null
}={}){
  if(!substantiveTransition(raw))throw Error('substantive_transition_required');
  const task_id=task(raw.task_id),prior_state=raw.prior_state??raw.from??raw.from_state;
  const new_state=raw.new_state??raw.to??raw.to_state??raw.state;
  const timestamp=raw.timestamp||raw.at;
  if(!/^\d{2}$/.test(task_id)||Number(task_id)>29||!execution_id||!edition_id||!Number.isInteger(writer_generation)||writer_generation<1)
    throw Error('transition_event_identity_required');
  const resolvedNext=next_task_id===null||next_task_id===undefined
    ? (new_state==='Done'&&Number(task_id)<29?String(Number(task_id)+1).padStart(2,'0'):task_id)
    : task(next_task_id);
  const recoverable=new_state==='Blocked'&&(raw.recoverable===true||raw.blocker?.recoverable===true)&&
    raw.external_blocker!==true&&raw.blocker?.external_blocker!==true;
  const dispatch_required=(new_state==='Done'&&Number(task_id)<29)||recoverable;
  const next_legal_action=new_state==='Done'
    ? (Number(task_id)===29?'terminal_public_closed':`dispatch_task_${resolvedNext}`)
    : recoverable?`recover_task_${task_id}`:'observe_transition';
  const state_digest=sha({raw,content_state,next_task_contract:next_task_contract||null});
  const event_type=raw.event_type||`${prior_state.toUpperCase()}_TO_${new_state.toUpperCase()}`;
  const idempotency_key=sha({execution_id,edition_id,task_id,request_key,prior_state,new_state,event_type,state_digest,writer_generation,timestamp,next_legal_action});
  return {
    schema_version:TRANSITION_EVENT_VERSION,
    execution_id,edition_id,task_id,
    request_key:request_key||raw.request_key||null,
    prior_state,new_state,event_type,
    content_state_digest:state_digest,
    writer_generation,timestamp,next_legal_action,
    dispatch_required,idempotency_key,
    next_task_id:dispatch_required?resolvedNext:null
  };
}

export function validateTransitionEvent(event={}){
  const errors=[];
  if(event.schema_version!==TRANSITION_EVENT_VERSION)errors.push('transition_event_schema');
  if(!event.execution_id||!event.edition_id||!/^\d{2}$/.test(event.task_id||''))errors.push('transition_event_identity');
  if(!TASK_STATE.has(event.prior_state)||!TASK_STATE.has(event.new_state)||event.prior_state===event.new_state)errors.push('transition_event_state');
  if(!stamp(event.timestamp))errors.push('transition_event_timestamp');
  if(!/^sha256:[a-f0-9]{64}$/.test(event.content_state_digest||''))errors.push('transition_event_state_digest');
  if(!/^sha256:[a-f0-9]{64}$/.test(event.idempotency_key||''))errors.push('transition_event_idempotency');
  if(!Number.isInteger(event.writer_generation)||event.writer_generation<1)errors.push('transition_event_writer_generation');
  if(typeof event.dispatch_required!=='boolean')errors.push('transition_event_dispatch_flag');
  if(event.dispatch_required&&!/^\d{2}$/.test(event.next_task_id||''))errors.push('transition_event_next_task');
  return [...new Set(errors)];
}

export function dispatchTransitionEvent({
  event,task_contracts={},branch,existing_dispatches=[],created_at=null
}={}){
  const errors=validateTransitionEvent(event);
  if(errors.length)throw Error('invalid_transition_event:'+errors.join(','));
  if(!branch)throw Error('transition_dispatch_branch_required');
  if(existing_dispatches.some(x=>x?.idempotency_key===event.idempotency_key))
    return {status:'ALREADY_CONSUMED',request:null,record:null};
  if(event.dispatch_required!==true)
    return {status:'NO_DISPATCH_REQUIRED',request:null,record:{
      schema_version:TRANSITION_DISPATCH_VERSION,idempotency_key:event.idempotency_key,
      execution_id:event.execution_id,task_id:event.task_id,status:'NOOP',reason:'transition_has_no_next_dispatch',
      created_at:created_at||event.timestamp
    }};
  const target=event.next_task_id,contract=task_contracts[target];
  if(!contract?.capability||!contract?.normal_operation)throw Error('transition_next_task_contract_required:'+target);
  const request=buildWorkerRequest({
    execution_id:event.execution_id,edition_id:event.edition_id,branch,task_id:target,
    capability:contract.capability,instruction:contract.normal_operation,
    writer_generation:event.writer_generation,created_at:created_at||event.timestamp
  });
  const record={
    schema_version:TRANSITION_DISPATCH_VERSION,
    idempotency_key:event.idempotency_key,
    execution_id:event.execution_id,edition_id:event.edition_id,
    source_task_id:event.task_id,target_task_id:target,
    request_key:request.request_key,capability:request.capability,
    dispatch_target:'durable_worker_request_queue',
    status:'DISPATCHED',created_at:created_at||event.timestamp
  };
  return {status:'DISPATCHED',request,record};
}

export function compactWatchdogDecision({
  event_consumed=false,worker_progressing=false,stalled=false,recovery_action=null
}={}){
  if(worker_progressing===true)return {action:'COMPACT_EXIT',expanded_read:false,reason:'worker_substantively_progressing'};
  if(event_consumed===true&&stalled!==true)return {action:'COMPACT_EXIT',expanded_read:false,reason:'transition_consumed'};
  if(stalled===true&&recovery_action)return {action:'RECOVER_EXACT_TRANSITION',expanded_read:true,recovery_action};
  return {action:'COMPACT_EXIT',expanded_read:false,reason:'no_actionable_transition_fault'};
}

export function transitionFailureFingerprint({event,operation_type='dispatch',error_class='unknown',contract_version='unknown'}={}){
  if(!event?.idempotency_key)throw Error('transition_event_required_for_failure_fingerprint');
  return sha({stage:event.task_id,operation_type,error_class,contract_version,state_digest:event.content_state_digest});
}
