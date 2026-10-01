import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPERATIONAL_LEARNING_EVENT_VERSION,
  parseOperationalLearningLedger,
  operationalLearningDigest,
  materializeOperationalProblems,
  validateOperationalLearningReadiness,
  certifyRunLearningForTask29,
  renderOperationalLearningMarkdown
} from '../lib/operational-learning.mjs';

const events = [
  {
    schema_version:OPERATIONAL_LEARNING_EVENT_VERSION,
    event_id:'DAB-OPS-E-000001',
    problem_id:'DAB-OPS-20261001-001',
    event_type:'observed',
    occurred_at:'2026-10-01T20:00:00Z',
    recorded_at:'2026-10-01T20:00:01Z',
    run_id:'reliable-edition-20261001-run4',
    edition_id:'dab-edition-2026-10-01',
    task_id:'15',
    status:'open',
    summary:'Worker stopped while task remained Active',
    data:{symptom:'Task state remained Active after worker stopped',operational_impact:'Production stopped without automatic recovery'}
  },
  {
    schema_version:OPERATIONAL_LEARNING_EVENT_VERSION,
    event_id:'DAB-OPS-E-000002',
    problem_id:'DAB-OPS-20261001-001',
    event_type:'root_cause',
    occurred_at:'2026-10-01T20:01:00Z',
    recorded_at:'2026-10-01T20:01:01Z',
    run_id:'reliable-edition-20261001-run4',
    edition_id:'dab-edition-2026-10-01',
    task_id:'15',
    status:'open',
    summary:'Missing persistent supervision allowed stale Active',
    data:{root_cause:'Task state and executor liveness were not bound to a persistent supervisor'}
  },
  {
    schema_version:OPERATIONAL_LEARNING_EVENT_VERSION,
    event_id:'DAB-OPS-E-000003',
    problem_id:'DAB-OPS-20261001-001',
    event_type:'attempted_fix',
    occurred_at:'2026-10-01T20:02:00Z',
    recorded_at:'2026-10-01T20:02:01Z',
    run_id:'reliable-edition-20261001-run4',
    edition_id:'dab-edition-2026-10-01',
    task_id:'15',
    summary:'Persistent supervisor introduced',
    data:{attempted_fix:'Add fenced Run Supervisor and one writer lease'}
  },
  {
    schema_version:OPERATIONAL_LEARNING_EVENT_VERSION,
    event_id:'DAB-OPS-E-000004',
    problem_id:'DAB-OPS-20261001-001',
    event_type:'permanent_fix',
    occurred_at:'2026-10-01T20:03:00Z',
    recorded_at:'2026-10-01T20:03:01Z',
    run_id:'reliable-edition-20261001-run4',
    edition_id:'dab-edition-2026-10-01',
    task_id:'15',
    status:'permanently_fixed',
    summary:'Fenced Supervisor permanently fixes stale Active recovery',
    data:{
      actual_fix:'Run Supervisor detects stale Active and requeues same task under a new fence',
      fix_outcome:'Fault-injection test passes',
      permanent_implementation:['_generator/lib/run-supervisor.mjs#classifyRunHealth'],
      regression_tests:['_generator/test/run-supervisor.test.mjs#stale Active'],
      invariants:['run-supervisor-v2','single-writer-fence-v1']
    }
  }
];
const text = events.map(JSON.stringify).join('\n')+'\n';

test('operational learning ledger parses and hashes deterministically',()=>{
  assert.equal(parseOperationalLearningLedger(text).length,4);
  assert.match(operationalLearningDigest(text),/^sha256:[a-f0-9]{64}$/);
});

test('materialized problem accumulates cause, attempts, fix, tests and invariant',()=>{
  const [p]=materializeOperationalProblems(text);
  assert.equal(p.current_status,'permanently_fixed');
  assert.equal(p.attempted_fixes.length,1);
  assert.equal(p.regression_tests.length,1);
  assert.equal(p.invariants.length,2);
});

test('Task 00 readiness rejects missing referenced permanent-fix evidence',()=>{
  const fail=validateOperationalLearningReadiness({ledgerText:text,pathExists:()=>false});
  assert.equal(fail.result,'FAIL');
  assert.ok(fail.errors.some(x=>x.startsWith('operational_learning_reference_missing')));
  const pass=validateOperationalLearningReadiness({ledgerText:text,pathExists:()=>true});
  assert.equal(pass.result,'PASS');
  assert.equal(pass.problem_count,1);
});

test('Task 29 refuses to certify unresolved or undocumented run problems',()=>{
  const openText=JSON.stringify(events[0])+'\n';
  const fail=certifyRunLearningForTask29({ledgerText:openText,runId:'reliable-edition-20261001-run4'});
  assert.equal(fail.result,'FAIL');
  assert.ok(fail.errors.includes('run_problem_still_open:DAB-OPS-20261001-001'));
  const pass=certifyRunLearningForTask29({ledgerText:text,runId:'reliable-edition-20261001-run4'});
  assert.equal(pass.result,'PASS');
});

test('human-readable ledger is a projection of canonical JSONL',()=>{
  const md=renderOperationalLearningMarkdown(text);
  assert.match(md,/DAB-OPS-20261001-001/);
  assert.match(md,/Ledger digest: `sha256:/);
  assert.match(md,/permanently_fixed/);
});
