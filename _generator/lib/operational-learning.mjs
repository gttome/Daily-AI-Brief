import {createHash} from 'node:crypto';

export const OPERATIONAL_LEARNING_EVENT_VERSION = 'production-operational-learning-event-v1';
export const OPERATIONAL_LEARNING_LEDGER_VERSION = 'production-operational-learning-ledger-v1';
export const PROBLEM_STATUSES = Object.freeze(['open','mitigated','permanently_fixed','superseded']);
export const EVENT_TYPES = Object.freeze([
  'observed','root_cause','attempted_fix','fix_outcome','permanent_fix',
  'regression_test','invariant','recurrence','status','timing_baseline',
  'next_run_validation','backfill'
]);

const hash = value => createHash('sha256').update(value).digest('hex');
const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const uniq = values => [...new Set((values || []).filter(Boolean))];
const refPath = value => {
  if (typeof value !== 'string') return null;
  const candidate=value.split('#')[0];
  // The ledger permits both executable repository references and descriptive
  // regression labels. Only unambiguous repo-relative path tokens are eligible
  // for filesystem existence validation; prose labels must not be reinterpreted
  // as missing files merely because they contain punctuation or a slash.
  if (!candidate || /\s/.test(candidate)) return null;
  if (candidate.startsWith('/') || candidate.includes('..')) return null;
  return /^(?:\.github|_generator|_tools|_records|docs|data|assets|briefs|stories|feeds|scripts|config)\//.test(candidate) ||
    /^(?:package\.json|Gemfile|README\.md)$/.test(candidate) ? candidate : null;
};

export function parseOperationalLearningLedger(text = '') {
  if (typeof text !== 'string') throw Error('operational_learning_ledger_text_required');
  const events = [];
  const ids = new Set();
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    let event;
    try { event = JSON.parse(line); }
    catch (error) { throw Error(`operational_learning_line_${index + 1}:${error.message}`); }
    const errors = validateOperationalLearningEvent(event);
    if (errors.length) throw Error(`operational_learning_line_${index + 1}:${errors.join(',')}`);
    if (ids.has(event.event_id)) throw Error(`operational_learning_duplicate_event_id:${event.event_id}`);
    ids.add(event.event_id);
    events.push(event);
  }
  return events;
}

export function validateOperationalLearningEvent(event = {}) {
  const errors = [];
  if (event.schema_version !== OPERATIONAL_LEARNING_EVENT_VERSION) errors.push('schema_version');
  if (!/^DAB-OPS-E-\d{6}$/.test(event.event_id || '')) errors.push('event_id');
  if (!/^DAB-OPS-\d{8}-\d{3}$/.test(event.problem_id || '')) errors.push('problem_id');
  if (!EVENT_TYPES.includes(event.event_type)) errors.push('event_type');
  if (!stamp(event.recorded_at)) errors.push('recorded_at');
  if (event.occurred_at !== null && event.occurred_at !== undefined && !stamp(event.occurred_at)) errors.push('occurred_at');
  if (typeof event.summary !== 'string' || !event.summary.trim()) errors.push('summary');
  if (event.status !== undefined && !PROBLEM_STATUSES.includes(event.status)) errors.push('status');
  if (event.run_id !== null && event.run_id !== undefined && typeof event.run_id !== 'string') errors.push('run_id');
  if (event.edition_id !== null && event.edition_id !== undefined && typeof event.edition_id !== 'string') errors.push('edition_id');
  if (event.task_id !== null && event.task_id !== undefined && !/^\d{2}$/.test(String(event.task_id))) errors.push('task_id');
  if (event.data !== undefined && (event.data === null || typeof event.data !== 'object' || Array.isArray(event.data))) errors.push('data');
  return errors;
}

export function canonicalLedgerText(events) {
  return (events || []).map(event => JSON.stringify(event)).join('\n') + ((events || []).length ? '\n' : '');
}

export function operationalLearningDigest(textOrEvents) {
  const events = Array.isArray(textOrEvents) ? textOrEvents : parseOperationalLearningLedger(textOrEvents);
  return 'sha256:' + hash(canonicalLedgerText(events));
}

function initialProblem(event) {
  return {
    problem_id:event.problem_id,
    first_observed_run:event.run_id || null,
    first_observed_edition:event.edition_id || null,
    first_observed_at:event.occurred_at || null,
    tasks:[],
    symptom:null,
    root_cause:null,
    operational_impact:null,
    timing_impact_seconds:null,
    attempted_fixes:[],
    actual_fix:null,
    fix_outcome:null,
    permanent_implementation:[],
    regression_tests:[],
    invariants:[],
    recurrences:[],
    next_run_validation:[],
    timing_baseline:null,
    current_status:'open',
    last_event_id:null,
    last_recorded_at:null,
    summaries:[]
  };
}

export function materializeOperationalProblems(eventsOrText) {
  const events = Array.isArray(eventsOrText) ? eventsOrText : parseOperationalLearningLedger(eventsOrText);
  const problems = new Map();
  for (const event of events) {
    const problem = problems.get(event.problem_id) || initialProblem(event);
    const data = event.data || {};
    problem.tasks = uniq([...problem.tasks, event.task_id ? String(event.task_id) : null]);
    problem.summaries.push(event.summary);
    if (data.symptom) problem.symptom = data.symptom;
    if (data.root_cause) problem.root_cause = data.root_cause;
    if (data.operational_impact) problem.operational_impact = data.operational_impact;
    if (Number.isFinite(data.timing_impact_seconds) && data.timing_impact_seconds >= 0) problem.timing_impact_seconds = data.timing_impact_seconds;
    if (data.attempted_fix) problem.attempted_fixes.push(data.attempted_fix);
    if (Array.isArray(data.attempted_fixes)) problem.attempted_fixes.push(...data.attempted_fixes);
    if (data.actual_fix) problem.actual_fix = data.actual_fix;
    if (data.fix_outcome) problem.fix_outcome = data.fix_outcome;
    if (Array.isArray(data.permanent_implementation)) problem.permanent_implementation.push(...data.permanent_implementation);
    if (Array.isArray(data.regression_tests)) problem.regression_tests.push(...data.regression_tests);
    if (Array.isArray(data.invariants)) problem.invariants.push(...data.invariants);
    if (data.recurrence) problem.recurrences.push(data.recurrence);
    if (Array.isArray(data.next_run_validation)) problem.next_run_validation.push(...data.next_run_validation);
    if (data.timing_baseline) problem.timing_baseline = data.timing_baseline;
    if (event.status) problem.current_status = event.status;
    problem.attempted_fixes = uniq(problem.attempted_fixes);
    problem.permanent_implementation = uniq(problem.permanent_implementation);
    problem.regression_tests = uniq(problem.regression_tests);
    problem.invariants = uniq(problem.invariants);
    problem.next_run_validation = uniq(problem.next_run_validation);
    problem.last_event_id = event.event_id;
    problem.last_recorded_at = event.recorded_at;
    problems.set(event.problem_id, problem);
  }
  return [...problems.values()].sort((a,b)=>a.problem_id.localeCompare(b.problem_id));
}

export function validateOperationalLearningReadiness({ledgerText, pathExists = () => true} = {}) {
  const errors = [];
  let events = [];
  try { events = parseOperationalLearningLedger(ledgerText || ''); }
  catch (error) { return {result:'FAIL', errors:[error.message], ledger_digest:null, problem_count:0}; }
  const problems = materializeOperationalProblems(events);
  if (!problems.length) errors.push('operational_learning_ledger_empty');
  for (const problem of problems) {
    if (problem.current_status === 'permanently_fixed') {
      if (!problem.actual_fix) errors.push(`permanent_fix_missing_actual_fix:${problem.problem_id}`);
      if (!problem.permanent_implementation.length) errors.push(`permanent_fix_missing_implementation:${problem.problem_id}`);
      if (!problem.regression_tests.length) errors.push(`permanent_fix_missing_regression_test:${problem.problem_id}`);
      if (!problem.invariants.length) errors.push(`permanent_fix_missing_invariant:${problem.problem_id}`);
      for (const ref of [...problem.permanent_implementation, ...problem.regression_tests]) {
        const p = refPath(ref);
        if (p && !pathExists(p)) errors.push(`operational_learning_reference_missing:${problem.problem_id}:${p}`);
      }
    }
    if (problem.current_status === 'mitigated' && !problem.next_run_validation.length)
      errors.push(`mitigated_problem_missing_next_run_validation:${problem.problem_id}`);
  }
  return {
    schema_version:OPERATIONAL_LEARNING_LEDGER_VERSION,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    ledger_digest:operationalLearningDigest(events),
    event_count:events.length,
    problem_count:problems.length,
    open_problem_ids:problems.filter(p=>p.current_status === 'open').map(p=>p.problem_id),
    mitigated_problem_ids:problems.filter(p=>p.current_status === 'mitigated').map(p=>p.problem_id),
    permanent_problem_ids:problems.filter(p=>p.current_status === 'permanently_fixed').map(p=>p.problem_id),
    required_invariants:uniq(problems.flatMap(p=>p.invariants)),
    unresolved_risks:problems.filter(p=>['open','mitigated'].includes(p.current_status)).map(p=>({
      problem_id:p.problem_id,status:p.current_status,next_run_validation:p.next_run_validation
    }))
  };
}

export function certifyRunLearningForTask29({ledgerText, runId} = {}) {
  const errors = [];
  const events = parseOperationalLearningLedger(ledgerText || '');
  const problems = materializeOperationalProblems(events).filter(p=>p.first_observed_run === runId || events.some(e=>e.problem_id===p.problem_id && e.run_id===runId));
  for (const problem of problems) {
    if (problem.current_status === 'open') errors.push(`run_problem_still_open:${problem.problem_id}`);
    if (!problem.root_cause) errors.push(`run_problem_missing_root_cause:${problem.problem_id}`);
    if (problem.current_status !== 'open' && !problem.attempted_fixes.length) errors.push(`run_problem_missing_attempted_fix:${problem.problem_id}`);
    if (['mitigated','permanently_fixed'].includes(problem.current_status) && !problem.actual_fix) errors.push(`run_problem_missing_actual_fix:${problem.problem_id}`);
    if (problem.current_status === 'permanently_fixed') {
      if (!problem.permanent_implementation.length) errors.push(`run_problem_missing_permanent_implementation:${problem.problem_id}`);
      if (!problem.regression_tests.length) errors.push(`run_problem_missing_regression_test:${problem.problem_id}`);
      if (!problem.invariants.length) errors.push(`run_problem_missing_invariant:${problem.problem_id}`);
    }
    if (problem.current_status === 'mitigated' && !problem.next_run_validation.length)
      errors.push(`run_problem_missing_next_run_validation:${problem.problem_id}`);
  }
  return {
    schema_version:'run-learning-task29-certification-v1',
    run_id:runId || null,
    result:errors.length ? 'FAIL' : 'PASS',
    errors:uniq(errors),
    problem_ids:problems.map(p=>p.problem_id),
    reconciled_problem_count:problems.length
  };
}

export function renderOperationalLearningMarkdown(eventsOrText) {
  const events = Array.isArray(eventsOrText) ? eventsOrText : parseOperationalLearningLedger(eventsOrText);
  const problems = materializeOperationalProblems(events);
  const lines = [
    '# Daily AI Brief — Production Continuous Improvement Ledger',
    '',
    `Canonical source: \`data/operations/production-continuous-improvement-ledger.jsonl\``,
    '',
    `Ledger digest: \`${operationalLearningDigest(events)}\``,
    '',
    `Problems: ${problems.length} · Events: ${events.length}`,
    ''
  ];
  for (const p of problems) {
    lines.push(`## ${p.problem_id} — ${p.summaries[0] || 'Production problem'}`);
    lines.push('');
    lines.push(`- **Status:** ${p.current_status}`);
    lines.push(`- **First observed run:** ${p.first_observed_run || 'unknown'}`);
    lines.push(`- **Task(s):** ${p.tasks.length ? p.tasks.join(', ') : 'unknown'}`);
    lines.push(`- **Symptom:** ${p.symptom || 'not recorded'}`);
    lines.push(`- **Root cause:** ${p.root_cause || 'not yet determined'}`);
    lines.push(`- **Operational impact:** ${p.operational_impact || 'not recorded'}`);
    lines.push(`- **Timing impact:** ${p.timing_impact_seconds === null ? 'unknown / not safely inferable' : p.timing_impact_seconds + ' seconds'}`);
    lines.push(`- **Attempted fixes:** ${p.attempted_fixes.length ? p.attempted_fixes.join(' | ') : 'none recorded'}`);
    lines.push(`- **Actual fix:** ${p.actual_fix || 'not yet determined'}`);
    lines.push(`- **Fix outcome:** ${p.fix_outcome || 'not recorded'}`);
    lines.push(`- **Permanent implementation:** ${p.permanent_implementation.length ? p.permanent_implementation.join(', ') : 'none'}`);
    lines.push(`- **Regression tests:** ${p.regression_tests.length ? p.regression_tests.join(', ') : 'none'}`);
    lines.push(`- **Production invariants:** ${p.invariants.length ? p.invariants.join(', ') : 'none'}`);
    lines.push(`- **Recurrences:** ${p.recurrences.length ? p.recurrences.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' | ') : 'none recorded'}`);
    lines.push(`- **Future validation:** ${p.next_run_validation.length ? p.next_run_validation.join(' | ') : 'none'}`);
    lines.push('');
  }
  return lines.join('\n') + '\n';
}
