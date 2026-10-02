import {createHash} from 'node:crypto';

export const SYSTEM_CHANGE_EVENT_VERSION = 'production-system-change-event-v1';
export const SYSTEM_CHANGE_LEDGER_VERSION = 'production-system-change-ledger-v1';
export const SYSTEM_CHANGE_EVENT_TYPES = Object.freeze(['introduced','promoted','outcome','problem_link','status','backfill']);
export const SYSTEM_CHANGE_CATEGORIES = Object.freeze([
  'code','workflow','schema','policy','schedule','configuration','recovery',
  'quality_gate','deployment','observability','documentation'
]);
export const SYSTEM_CHANGE_STATUSES = Object.freeze([
  'introduced','unproven','validated','neutral','regression','modified','reverted','superseded'
]);

const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const uniq = values => [...new Set((values || []).filter(Boolean))];
const problemId = value => /^DAB-OPS-\d{8}-\d{3}$/.test(value || '');

export function validateSystemChangeEvent(event = {}) {
  const errors = [];
  if (event.schema_version !== SYSTEM_CHANGE_EVENT_VERSION) errors.push('schema_version');
  if (!/^DAB-CHG-E-\d{6}$/.test(event.event_id || '')) errors.push('event_id');
  if (!/^DAB-CHG-\d{8}-\d{3}$/.test(event.change_id || '')) errors.push('change_id');
  if (!SYSTEM_CHANGE_EVENT_TYPES.includes(event.event_type)) errors.push('event_type');
  if (!stamp(event.recorded_at)) errors.push('recorded_at');
  if (event.changed_at !== null && event.changed_at !== undefined && !stamp(event.changed_at)) errors.push('changed_at');
  if (event.main_sha !== null && event.main_sha !== undefined && !sha(event.main_sha)) errors.push('main_sha');
  if (event.source_sha !== null && event.source_sha !== undefined && !sha(event.source_sha)) errors.push('source_sha');
  if (event.pr_number !== null && event.pr_number !== undefined && (!Number.isInteger(event.pr_number) || event.pr_number < 1)) errors.push('pr_number');
  if (event.category !== undefined && !SYSTEM_CHANGE_CATEGORIES.includes(event.category)) errors.push('category');
  if (event.status !== undefined && !SYSTEM_CHANGE_STATUSES.includes(event.status)) errors.push('status');
  if (typeof event.title !== 'string' || !event.title.trim()) errors.push('title');
  if (event.data !== undefined && (event.data === null || typeof event.data !== 'object' || Array.isArray(event.data))) errors.push('data');
  const data = event.data || {};
  for (const field of ['related_problem_ids','resulting_problem_ids']) {
    if (data[field] !== undefined && (!Array.isArray(data[field]) || data[field].some(x=>!problemId(x)))) errors.push(field);
  }
  if (['introduced','backfill'].includes(event.event_type)) {
    if (!SYSTEM_CHANGE_CATEGORIES.includes(event.category)) errors.push('introduced_category');
    for (const field of ['reason','previous_behavior','new_behavior','expected_operational_impact','rollback'])
      if (typeof data[field] !== 'string' || !data[field].trim()) errors.push('introduced_' + field);
    for (const field of ['components','invariants_affected','dependencies_affected','known_risks','validation'])
      if (!Array.isArray(data[field])) errors.push('introduced_' + field);
    if (!data.last_known_good || typeof data.last_known_good !== 'object' ||
        typeof data.last_known_good.run_id !== 'string' || !sha(data.last_known_good.main_sha || ''))
      errors.push('introduced_last_known_good');
    if (data.first_exposed_run !== null && data.first_exposed_run !== undefined && typeof data.first_exposed_run !== 'string')
      errors.push('introduced_first_exposed_run');
    if (typeof data.production_outcome !== 'string' || !SYSTEM_CHANGE_STATUSES.includes(data.production_outcome))
      errors.push('introduced_production_outcome');
  }
  return uniq(errors);
}

export function parseSystemChangeLedger(text = '') {
  if (typeof text !== 'string') throw Error('system_change_ledger_text_required');
  const events = [], ids = new Set();
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    let event;
    try { event = JSON.parse(line); }
    catch (error) { throw Error(`system_change_line_${index + 1}:${error.message}`); }
    const errors = validateSystemChangeEvent(event);
    if (errors.length) throw Error(`system_change_line_${index + 1}:${errors.join(',')}`);
    if (ids.has(event.event_id)) throw Error(`system_change_duplicate_event_id:${event.event_id}`);
    ids.add(event.event_id); events.push(event);
  }
  return events;
}

export function canonicalSystemChangeLedgerText(events = []) {
  return events.map(event=>JSON.stringify(event)).join('\n') + (events.length ? '\n' : '');
}

export function systemChangeLedgerDigest(textOrEvents) {
  const events = Array.isArray(textOrEvents) ? textOrEvents : parseSystemChangeLedger(textOrEvents);
  return 'sha256:' + hash(canonicalSystemChangeLedgerText(events));
}

function initialChange(event) {
  return {
    change_id:event.change_id,title:event.title,category:event.category || null,
    introduced_at:event.changed_at || null,recorded_at:event.recorded_at,
    pr_number:event.pr_number || null,source_sha:event.source_sha || null,main_sha:event.main_sha || null,
    reason:null,components:[],previous_behavior:null,new_behavior:null,invariants_affected:[],
    dependencies_affected:[],expected_operational_impact:null,known_risks:[],validation:[],
    rollback:null,first_exposed_run:null,last_known_good:null,related_problem_ids:[],
    resulting_problem_ids:[],production_outcome:'unproven',status:event.status || 'introduced',
    outcome_notes:[],events:[]
  };
}

export function materializeSystemChanges(eventsOrText) {
  const events = Array.isArray(eventsOrText) ? eventsOrText : parseSystemChangeLedger(eventsOrText);
  const changes = new Map(), introduced = new Set();
  for (const event of events) {
    const change = changes.get(event.change_id) || initialChange(event);
    const data = event.data || {};
    change.events.push(event.event_id);
    change.title = event.title || change.title;
    change.category = event.category || change.category;
    change.pr_number = event.pr_number || change.pr_number;
    change.source_sha = event.source_sha || change.source_sha;
    change.main_sha = event.main_sha || change.main_sha;
    change.recorded_at = event.recorded_at;
    if (event.changed_at) change.introduced_at = change.introduced_at || event.changed_at;
    if (['introduced','backfill'].includes(event.event_type)) {
      if (introduced.has(event.change_id)) throw Error(`system_change_duplicate_introduction:${event.change_id}`);
      introduced.add(event.change_id);
      change.reason=data.reason;
      change.components=uniq(data.components);
      change.previous_behavior=data.previous_behavior;
      change.new_behavior=data.new_behavior;
      change.invariants_affected=uniq(data.invariants_affected);
      change.dependencies_affected=uniq(data.dependencies_affected);
      change.expected_operational_impact=data.expected_operational_impact;
      change.known_risks=uniq(data.known_risks);
      change.validation=uniq(data.validation);
      change.rollback=data.rollback;
      change.first_exposed_run=data.first_exposed_run || null;
      change.last_known_good=data.last_known_good;
      change.related_problem_ids=uniq(data.related_problem_ids);
      change.resulting_problem_ids=uniq(data.resulting_problem_ids);
      change.production_outcome=data.production_outcome;
    }
    if (Array.isArray(data.related_problem_ids)) change.related_problem_ids=uniq([...change.related_problem_ids,...data.related_problem_ids]);
    if (Array.isArray(data.resulting_problem_ids)) change.resulting_problem_ids=uniq([...change.resulting_problem_ids,...data.resulting_problem_ids]);
    if (data.production_outcome) change.production_outcome=data.production_outcome;
    if (data.outcome_note) change.outcome_notes.push(data.outcome_note);
    if (event.status) change.status=event.status;
    changes.set(event.change_id,change);
  }
  for (const id of changes.keys()) if (!introduced.has(id)) throw Error(`system_change_missing_introduction:${id}`);
  return [...changes.values()].sort((a,b)=>a.change_id.localeCompare(b.change_id));
}

export function validateSystemChangeLedgerReadiness({ledgerText} = {}) {
  let events=[], changes=[];
  const errors=[];
  try {
    events=parseSystemChangeLedger(ledgerText || '');
    changes=materializeSystemChanges(events);
  } catch (error) {
    return {schema_version:SYSTEM_CHANGE_LEDGER_VERSION,result:'FAIL',errors:[error.message],ledger_digest:null,change_count:0};
  }
  if (!changes.length) errors.push('system_change_ledger_empty');
  for (const c of changes) {
    if (!c.reason || !c.previous_behavior || !c.new_behavior || !c.expected_operational_impact || !c.rollback)
      errors.push(`system_change_incomplete:${c.change_id}`);
    if (c.production_outcome === 'regression' && !c.resulting_problem_ids.length)
      errors.push(`regression_missing_problem_link:${c.change_id}`);
  }
  return {
    schema_version:SYSTEM_CHANGE_LEDGER_VERSION,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    ledger_digest:systemChangeLedgerDigest(events),
    event_count:events.length,
    change_count:changes.length,
    unproven_change_ids:changes.filter(c=>['introduced','unproven'].includes(c.production_outcome)).map(c=>c.change_id),
    regression_change_ids:changes.filter(c=>c.production_outcome==='regression').map(c=>c.change_id)
  };
}

export function changesSinceKnownGood(eventsOrText, {
  commit_shas = [], pr_numbers = [], last_known_good_at = null
} = {}) {
  const changes=materializeSystemChanges(eventsOrText);
  const shas=new Set(commit_shas), prs=new Set(pr_numbers.map(Number));
  const useRefs=shas.size>0 || prs.size>0;
  const selected=changes.filter(c=>{
    if (useRefs) return (c.main_sha && shas.has(c.main_sha)) || (c.source_sha && shas.has(c.source_sha)) || (c.pr_number && prs.has(Number(c.pr_number)));
    return stamp(last_known_good_at) && stamp(c.introduced_at) && Date.parse(c.introduced_at)>Date.parse(last_known_good_at);
  });
  return {
    schema_version:'system-change-exposure-set-v1',
    result:'PASS',
    change_ledger_digest:systemChangeLedgerDigest(eventsOrText),
    change_count:selected.length,
    change_ids:selected.map(c=>c.change_id),
    changes:selected.map(c=>({
      change_id:c.change_id,title:c.title,category:c.category,pr_number:c.pr_number,
      main_sha:c.main_sha,source_sha:c.source_sha,components:c.components,
      invariants_affected:c.invariants_affected,dependencies_affected:c.dependencies_affected,
      known_risks:c.known_risks,production_outcome:c.production_outcome,
      related_problem_ids:c.related_problem_ids,resulting_problem_ids:c.resulting_problem_ids
    }))
  };
}

export function certifyRunSystemChangesForTask29({ledgerText, runId} = {}) {
  const errors=[];
  const changes=materializeSystemChanges(ledgerText || '').filter(c=>c.first_exposed_run===runId);
  for (const c of changes) {
    if (['introduced','unproven'].includes(c.production_outcome))
      errors.push(`run_change_outcome_unresolved:${c.change_id}`);
    if (!c.main_sha) errors.push(`run_change_main_sha_missing:${c.change_id}`);
  }
  return {
    schema_version:'run-system-change-task29-certification-v1',
    run_id:runId || null,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    change_ids:changes.map(c=>c.change_id),
    reconciled_change_count:changes.length
  };
}

export function renderSystemChangeMarkdown(eventsOrText) {
  const events=Array.isArray(eventsOrText)?eventsOrText:parseSystemChangeLedger(eventsOrText);
  const changes=materializeSystemChanges(events);
  const lines=[
    '# Daily AI Brief — Production System Change Ledger','',
    'Canonical source: `data/operations/production-system-change-ledger.jsonl`','',
    `Ledger digest: \`${systemChangeLedgerDigest(events)}\``,'',
    `Changes: ${changes.length} · Events: ${events.length}`,''
  ];
  for (const c of changes) {
    lines.push(`## ${c.change_id} — ${c.title}`,'');
    lines.push(`- **Category:** ${c.category}`);
    lines.push(`- **Changed:** ${c.introduced_at || 'unknown'}`);
    lines.push(`- **PR / source / main:** ${c.pr_number ? '#'+c.pr_number : 'none'} · ${c.source_sha || 'unknown'} · ${c.main_sha || 'pending reconciliation'}`);
    lines.push(`- **Status / production outcome:** ${c.status} / ${c.production_outcome}`);
    lines.push(`- **Reason:** ${c.reason}`);
    lines.push(`- **Components:** ${c.components.length ? c.components.join(', ') : 'none recorded'}`);
    lines.push(`- **Previous behavior:** ${c.previous_behavior}`);
    lines.push(`- **New intended behavior:** ${c.new_behavior}`);
    lines.push(`- **Invariants affected:** ${c.invariants_affected.length ? c.invariants_affected.join(', ') : 'none'}`);
    lines.push(`- **Dependencies affected:** ${c.dependencies_affected.length ? c.dependencies_affected.join(', ') : 'none'}`);
    lines.push(`- **Expected operational impact:** ${c.expected_operational_impact}`);
    lines.push(`- **Known risks:** ${c.known_risks.length ? c.known_risks.join(' | ') : 'none recorded'}`);
    lines.push(`- **Validation:** ${c.validation.length ? c.validation.join(' | ') : 'none recorded'}`);
    lines.push(`- **Rollback:** ${c.rollback}`);
    lines.push(`- **Last known-good baseline:** ${c.last_known_good?.run_id || 'unknown'} @ ${c.last_known_good?.main_sha || 'unknown'}`);
    lines.push(`- **First exposed run:** ${c.first_exposed_run || 'not yet exposed'}`);
    lines.push(`- **Related problems:** ${c.related_problem_ids.length ? c.related_problem_ids.join(', ') : 'none'}`);
    lines.push(`- **Resulting problems:** ${c.resulting_problem_ids.length ? c.resulting_problem_ids.join(', ') : 'none confirmed'}`);
    lines.push(`- **Outcome notes:** ${c.outcome_notes.length ? c.outcome_notes.join(' | ') : 'none'}`,'');
  }
  return lines.join('\n')+'\n';
}
