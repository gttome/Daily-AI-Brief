import {projectKanbanFromEvents,publicationWriteBoundary} from './run-supervisor.mjs';
import {canonicalLedgerText,parseOperationalLearningLedger,certifyRunLearningForTask29,renderOperationalLearningMarkdown,operationalLearningDigest} from './operational-learning.mjs';
import {buildPromotionReview} from './run-readiness.mjs';
import {READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE,READER_SEMANTIC_CLOSE_GATE_VERSION} from './reader-semantic-close-gate.mjs';

/** Project cleanup only from an already live-verified protected publication.
 * This does no rendering, selection, image generation or production deployment. */
export function buildProductionRunCloseout({pointer,completion,validation,runState,cc,tasks,events,ledgerText,deltaText='',readerSemanticGate=null,now}) {
  if(pointer?.active!==true || pointer.terminal===true) return {status:'PRESERVED_TERMINAL_OR_INACTIVE',files:{}};
  const key=pointer.execution_key,match=/^(\d{4}-\d{2}-\d{2})-run(\d+)$/.exec(key||'');
  if(!match || Number(match[2])<5 || !/^[\w-]+$/.test(pointer.execution_id||'') || !Number.isFinite(Date.parse(now))) throw Error('new_run_identity_required');
  const date=match[1],id=pointer.execution_id,edition='dab-edition-'+date,sha=completion?.production_sha;
  if(date>=READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE){
    if(readerSemanticGate?.schema_version!==READER_SEMANTIC_CLOSE_GATE_VERSION||
       readerSemanticGate?.edition_date!==date||readerSemanticGate?.edition_id!==edition||
       readerSemanticGate?.result!=='PASS'||!Array.isArray(readerSemanticGate?.errors)||readerSemanticGate.errors.length)
      throw Error('reader_semantic_close_gate_required');
  }
  if(pointer.edition_id!==edition || completion?.edition_id!==edition || !/^[a-f0-9]{40}$/.test(sha||'') ||
    completion.phase!=='live_verified' || completion.deployed_sha!==sha || completion.pages?.conclusion!=='success' ||
    completion.live_verification?.final_result!=='pass' || !completion.pr_number || !completion.ci_run_id)
    throw Error('exact_live_publication_evidence_required');
  const required=['publication_receipt','pages_deployment','live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets'];
  if(validation?.date!==date || validation.publication_sha!==sha || validation.final_result!=='pass' || required.some(id=>!validation.checks?.some(c=>c.check_id===id&&c.result==='pass')))
    throw Error('independent_live_validation_required');
  if(runState?.stage!=='CLOSED' || runState.current_sha!==sha || cc?.edition_date!==date || cc.publication_sha!==sha ||
    cc.canonical_publication_status?.terminal_outcome!=='COMPLETED') throw Error('closure_projection_evidence_required');
  const before=projectKanbanFromEvents({tasks,events,execution_id:id,edition_id:edition,observed_at:now});
  if(!publicationWriteBoundary(before.tasks,events).frozen || !Array.from({length:23},(_,i)=>before.tasks[String(i).padStart(2,'0')].state==='Done').every(Boolean))
    throw Error('completed_frozen_candidate_required');
  const merged=parseOperationalLearningLedger(ledgerText),byId=new Map(merged.map(e=>[e.event_id,e]));
  for(const event of parseOperationalLearningLedger(deltaText)) {
    if(event.run_id!==id) throw Error('run_learning_delta_identity_mismatch');
    if(byId.has(event.event_id)) {
      if(JSON.stringify(byId.get(event.event_id))!==JSON.stringify(event)) throw Error('learning_event_conflict');
    } else {merged.push(event);byId.set(event.event_id,event);}
  }
  const canonical=canonicalLedgerText(merged),cert=certifyRunLearningForTask29({ledgerText:canonical,runId:id});
  if(cert.result!=='PASS') throw Error('task29_learning_not_reconciled:'+cert.errors.join(','));
  const files={},all=[...events];
  if(date>=READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE)files[`_records/publication/${date}/reader-semantic-close-gate.json`]=readerSemanticGate;
  // These are observed reconciliation times. Original CI, merge and live times
  // stay in their source receipts; absent Active timestamps remain unknown.
  for(let n=23;n<=29;n++) {
    const task=String(n);
    if(before.tasks[task].state==='Done') continue;
    const event={task_id:task,from:before.tasks[task].state,to:'Done',at:now,
      timestamp_scope:'evidence_reconciliation_observed',proof:{production_sha:sha,
        completion:`_records/publication/${date}/completion.json`,validation:`_records/publication/${date}/delta-validation.json`,
        pr_number:completion.pr_number,ci_run_id:completion.ci_run_id,
        ...(n===29?{learning_certification:`_records/run-learning/certification/${id}.json`,reader_semantic_close_gate:date>=READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE?`_records/publication/${date}/reader-semantic-close-gate.json`:null,result:'PASS'}:{})}};
    files[`_records/edition-execution/events/${key}/${task}-protected-closeout.json`]=event;all.push(event);
  }
  const kanban=projectKanbanFromEvents({tasks,events:all,execution_id:id,edition_id:edition,observed_at:now});
  files[`_records/edition-execution/kanban/${key}.json`]=kanban;
  files[`_records/edition-execution/timing/${key}.json`]={schema_version:'run-timing-observations-v1',execution_id:id,
    observed_at:now,tasks:kanban.tasks,note:'No missing start time or duration is inferred. Publication source timestamps remain in completion evidence.'};
  files[`_records/run-learning/certification/${id}.json`]=cert;
  files[`_records/edition-execution/promotion-review/${key}.json`]=buildPromotionReview({
    edition_id:edition,execution_id:id,run_number:Number(match[2]),terminal_state:'PUBLIC_CLOSED',reviewed_at:now,
    ledger_digest:operationalLearningDigest(merged),keep:['All accepted artifacts and completed upstream tasks','Frozen exact-SHA publication candidate'],
    fix:cert.problem_ids,simplify:['Advance eligible operations immediately; recover only the failed operation'],
    validate_next:['Read the full cumulative ledger and pass fresh unattended-host admission before the next run'],
    timing_comparison:{current:`_records/edition-execution/timing/${key}.json`,prior_comparable_measurement:null,
      reason:'No missing or non-comparable duration is inferred.'}});
  files['data/operations/production-continuous-improvement-ledger.jsonl']=canonical;
  files['docs/operations/PRODUCTION-CONTINUOUS-IMPROVEMENT-LEDGER.md']=renderOperationalLearningMarkdown(canonical);
  files[`_records/edition-execution/public-closed/${key}.json`]={schema_version:'public-closed-v1',state:'PUBLIC_CLOSED',
    edition_id:edition,execution_id:id,production_sha:sha,observed_at:now,completion:`_records/publication/${date}/completion.json`,
    reader_semantic_close_gate:date>=READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE?`_records/publication/${date}/reader-semantic-close-gate.json`:null};
  files[`_records/edition-execution/writer-leases/${id}.json`]={schema_version:'run-writer-lease-v1',execution_id:id,
    owner_id:'released-task29',released:true,expires_at:now,publication_candidate_frozen:true};
  files['data/operations/active-production-run.json']={...pointer,active:false,terminal:true,updated_at:now,
    start_scope:'full_production',image_tasks_authorized:true,publication_authorized:true,deferred_blocker:null,
    current_task:'29',current_task_state:'Done',
    note:'PUBLIC_CLOSED; Task 29 PASS through protected finalization. Admission for a future run is separate.'};
  files[`_records/edition-execution/cleanup/${key}.json`]={schema_version:'daily-brief-run-cleanup-v2',result:'PASS',
    edition_id:edition,execution_id:id,run_number:Number(match[2]),terminal_state:'PUBLIC_CLOSED',cleanup_at:now,
    activation:'on_protected_main_merge',source_completion:`_records/publication/${date}/completion.json`,
    production_sha:sha,run_branch_write_frozen:true,active_pointer_cleared:true,learning_certification:cert,
    next_run_start_authorized:false};
  return {status:'PUBLIC_CLOSED_PENDING_PROTECTED_PERSISTENCE',files};
}
