import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_CHANGE_EVENT_VERSION,parseSystemChangeLedger,systemChangeLedgerDigest,
  materializeSystemChanges,validateSystemChangeLedgerReadiness,changesSinceKnownGood,
  certifyRunSystemChangesForTask29,renderSystemChangeMarkdown
} from '../lib/system-change-ledger.mjs';

const base={
  schema_version:SYSTEM_CHANGE_EVENT_VERSION,event_id:'DAB-CHG-E-000001',
  change_id:'DAB-CHG-20261002-001',event_type:'introduced',
  changed_at:'2026-10-02T12:00:00Z',recorded_at:'2026-10-02T12:00:01Z',
  pr_number:350,source_sha:'a'.repeat(40),main_sha:'b'.repeat(40),
  category:'policy',status:'validated',title:'Make blockers route scoped',
  data:{
    reason:'Keep production alive when one route is blocked',
    components:['_generator/lib/run-readiness.mjs'],
    previous_behavior:'Image admission stopped the whole run',
    new_behavior:'Only image-dependent work is blocked',
    invariants_affected:['route_specific_blocker_never_stops_run'],
    dependencies_affected:['Task 00','Tasks 11-29'],
    expected_operational_impact:'Non-image work continues safely',
    known_risks:['publication must remain fail closed'],
    validation:['run-readiness tests'],
    rollback:'Revert PR #350',
    first_exposed_run:'reliable-edition-20261002-run5',
    last_known_good:{run_id:'reliable-edition-20261001-run4',main_sha:'c'.repeat(40)},
    related_problem_ids:['DAB-OPS-20261002-010'],
    resulting_problem_ids:[],
    production_outcome:'validated'
  }
};
const text=JSON.stringify(base)+'\n';

test('system change ledger parses, hashes and materializes',()=>{
  assert.equal(parseSystemChangeLedger(text).length,1);
  assert.match(systemChangeLedgerDigest(text),/^sha256:[a-f0-9]{64}$/);
  const [c]=materializeSystemChanges(text);
  assert.equal(c.change_id,'DAB-CHG-20261002-001');
  assert.equal(c.production_outcome,'validated');
});

test('system change ledger requires diagnostic fields on introduction',()=>{
  const broken={...base,event_id:'DAB-CHG-E-000002',change_id:'DAB-CHG-20261002-002',data:{...base.data,rollback:null}};
  assert.throws(()=>parseSystemChangeLedger(JSON.stringify(broken)+'\n'),/introduced_rollback/);
});

test('readiness exposes unproven and regression changes',()=>{
  const unproven={...base,event_id:'DAB-CHG-E-000002',change_id:'DAB-CHG-20261002-002',status:'unproven',
    data:{...base.data,production_outcome:'unproven',related_problem_ids:[]}};
  const regression={...base,event_id:'DAB-CHG-E-000003',change_id:'DAB-CHG-20261002-003',status:'regression',
    data:{...base.data,production_outcome:'regression',resulting_problem_ids:['DAB-OPS-20261002-011']}};
  const result=validateSystemChangeLedgerReadiness({ledgerText:[base,unproven,regression].map(JSON.stringify).join('\n')+'\n'});
  assert.equal(result.result,'PASS');
  assert.deepEqual(result.unproven_change_ids,['DAB-CHG-20261002-002']);
  assert.deepEqual(result.regression_change_ids,['DAB-CHG-20261002-003']);
});

test('changes since known good correlate by protected SHA or PR',()=>{
  const bySha=changesSinceKnownGood(text,{commit_shas:['b'.repeat(40)]});
  assert.deepEqual(bySha.change_ids,['DAB-CHG-20261002-001']);
  const byPr=changesSinceKnownGood(text,{pr_numbers:[350]});
  assert.deepEqual(byPr.change_ids,['DAB-CHG-20261002-001']);
});

test('Task 29 requires outcomes for changes first exposed to the run',()=>{
  const unresolved={...base,status:'unproven',data:{...base.data,production_outcome:'unproven'}};
  const fail=certifyRunSystemChangesForTask29({ledgerText:JSON.stringify(unresolved)+'\n',runId:'reliable-edition-20261002-run5'});
  assert.equal(fail.result,'FAIL');
  const pass=certifyRunSystemChangesForTask29({ledgerText:text,runId:'reliable-edition-20261002-run5'});
  assert.equal(pass.result,'PASS');
});

test('human projection includes behavior, risk and problem links',()=>{
  const md=renderSystemChangeMarkdown(text);
  assert.match(md,/Previous behavior/);
  assert.match(md,/Known risks/);
  assert.match(md,/DAB-OPS-20261002-010/);
});
