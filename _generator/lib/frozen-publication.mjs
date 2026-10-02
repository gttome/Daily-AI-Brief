import {publicationWriteBoundary} from './run-supervisor.mjs';
export function assertFrozenPublication({pointer,branch,tasks,events,manifest,validated,baselineSha}) {
  if(pointer?.active!==true || pointer.terminal===true || pointer.branch!==branch)
    throw Error('exact_active_run_required');
  const boundary=publicationWriteBoundary(tasks,events);
  if(!boundary.frozen || boundary.terminal || !Array.from({length:23},(_,i)=>tasks[String(i).padStart(2,'0')]?.state==='Done').every(Boolean))
    throw Error('tasks00_through22_must_be_done');
  if(manifest?.edition_id!==pointer.edition_id || manifest.baseline_sha!==baselineSha)
    throw Error('frozen_candidate_baseline_or_edition_mismatch');
  if(!validated.some(v=>v.phase==='validated' && v.edition_id===pointer.edition_id &&
    v.baseline_main_sha===baselineSha && Array.isArray(v.checks) && v.checks.length>0 &&
    v.checks.every(c=>c.severity!=='critical' || c.result==='pass')))
    throw Error('durable_validated_event_required_before_publication');
  return {edition_id:pointer.edition_id,edition_date:manifest.edition_date,execution_id:pointer.execution_id,branch};
}
