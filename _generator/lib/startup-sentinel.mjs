export const STARTUP_SENTINEL_VERSION = 'daily-brief-startup-sentinel-v1';

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const ymd = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

function localClock(now, timeZone) {
  if (!stamp(now)) throw Error('valid_startup_sentinel_clock_required');
  const formatter = new Intl.DateTimeFormat('en-CA',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(now))
    .filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return {
    date:parts.year+'-'+parts.month+'-'+parts.day,
    hour:Number(parts.hour),minute:Number(parts.minute),second:Number(parts.second)
  };
}

function nextCalendarDate(date) {
  if (!ymd(date)) throw Error('valid_local_date_required');
  const d = new Date(date+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()+1);
  return d.toISOString().slice(0,10);
}

function task00Progress(events=[],workerResults=[]) {
  const taskEvents=events.filter(event=>String(event?.task_id||'').padStart(2,'0')==='00');
  const done=taskEvents.some(event=>['Done','Tested'].includes(event?.to));
  const substantiveEvent=taskEvents.some(event=>{
    if (!event?.at) return false;
    if (event?.to==='Done') return true;
    const proof=event?.proof;
    return proof && typeof proof==='object' && Object.keys(proof).length>0 &&
      event?.reason_code!=='MISSED_START_ALLOCATION' &&
      event?.reason_code!=='PRODUCTION_EXECUTION_ALLOCATED';
  });
  const worker=workerResults.some(result=>
    String(result?.task_id||'').padStart(2,'0')==='00' &&
    ['passed','completed_pass','done'].includes(String(result?.status||result?.task_outcome||'').toLowerCase())
  );
  return {proven:done||substantiveEvent||worker,done,substantive_event:substantiveEvent,worker_result:worker};
}

export function evaluateStartupSentinel({
  pointer=null,events=[],workerResults=[],now=new Date().toISOString(),
  timeZone='America/Chicago',scheduledHour=19,minimumMinute=3
}={}) {
  const local=localClock(now,timeZone);
  const targetDate=nextCalendarDate(local.date);
  const targetEdition='dab-edition-'+targetDate;
  const inWindow=local.hour===scheduledHour && local.minute>=minimumMinute;
  const progress=task00Progress(events,workerResults);
  const identity=pointer ? {
    active:pointer.active===true,terminal:pointer.terminal===true,
    edition_id:pointer.edition_id||null,execution_id:pointer.execution_id||null,
    execution_key:pointer.execution_key||null,branch:pointer.branch||null,
    current_task:pointer.current_task||null,current_task_state:pointer.current_task_state||null
  } : null;

  let status='OUTSIDE_START_WINDOW',fault=null,escalation=false;
  if (inWindow) {
    if (pointer?.edition_id===targetEdition && pointer?.terminal===true) {
      status='TARGET_ALREADY_TERMINAL';
    } else if (pointer?.active===true && pointer?.terminal!==true && pointer?.edition_id===targetEdition && progress.proven) {
      status='STARTED_OR_RESUMED_WITH_PROGRESS';
    } else if (pointer?.active===true && pointer?.terminal!==true && pointer?.edition_id!==targetEdition) {
      status='ACTIVE_OTHER_EXECUTION';
      fault='ACTIVE_OTHER_EXECUTION_AT_SCHEDULED_START';
      escalation=true;
    } else if (pointer?.active===true && pointer?.terminal!==true && pointer?.edition_id===targetEdition) {
      status='MISSED_START';
      fault='MISSED_START_TASK00_PROGRESS_NOT_PROVEN';
      escalation=true;
    } else {
      status='MISSED_START';
      fault='MISSED_START_NO_TARGET_EXECUTION';
      escalation=true;
    }
  }

  return {
    schema_version:STARTUP_SENTINEL_VERSION,
    observed_at:now,time_zone:timeZone,
    local_date:local.date,local_hour:local.hour,local_minute:local.minute,
    scheduled_hour:scheduledHour,target_edition_date:targetDate,target_edition_id:targetEdition,
    status,normalized_fault_code:fault,escalation_required:escalation,
    task00_progress:progress,pointer_identity:identity,
    production_allocation_performed:false,
    recovery_instruction:escalation
      ? 'Re-read protected durable state; never duplicate or reopen. If the target edition is genuinely missing and admission permits startup, use the existing guarded missed-start recovery path and prove real Task 00 progress.'
      : null
  };
}
