import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAtomicCloseoutTransaction,deriveIncidentInventory,simulateAtomicCommit} from '../lib/atomic-closeout.mjs';

const date='2099-01-01',execution='run-2099',edition='dab-edition-'+date,prod='a'.repeat(40);
const tasks=Object.fromEntries(Array.from({length:30},(_,i)=>[String(i).padStart(2,'0'),{title:'Task '+i}]));
const events=Array.from({length:27},(_,i)=>({task_id:String(i).padStart(2,'0'),from:'Active',to:'Done',at:'2099-01-01T00:'+String(i).padStart(2,'0')+':00Z'}));
const ledgerEvent={schema_version:'production-operational-learning-event-v1',event_id:'DAB-OPS-E-999901',problem_id:'DAB-OPS-20990101-001',event_type:'incident',occurred_at:'2099-01-01T00:01:00Z',recorded_at:'2099-01-01T00:01:00Z',run_id:execution,edition_id:edition,task_id:'23',status:'permanently_fixed',summary:'fixture incident',data:{symptom:'x',root_cause:'y',operational_impact:'z',timing_impact_seconds:1,attempted_fix:'a',actual_fix:'b',fix_outcome:'PASS',permanent_implementation:['x'],regression_tests:['x'],invariants:['x'],next_run_validation:['x']}};
const ledger=JSON.stringify(ledgerEvent)+'\n';

function base(){
 return {
  pointer:{active:true,terminal:false,execution_key:date+'-run11',execution_id:execution,edition_id:edition},
  completion:{edition_id:edition,production_sha:prod,deployed_sha:prod,phase:'live_verified',pages:{conclusion:'success'},live_verification:{final_result:'pass'},pr_number:7,ci_run_id:8,live_verified_at:'2099-01-01T01:00:00Z'},
  validation:{date,publication_sha:prod,final_result:'pass',checks:['publication_receipt','pages_deployment','live_changed_routes','live_homepage_edition','live_dated_edition','live_image_assets'].map(check_id=>({check_id,result:'pass'}))},
  runState:{stage:'CLOSED',current_sha:prod},cc:{edition_date:date,publication_sha:prod,canonical_publication_status:{terminal_outcome:'COMPLETED'}},
  tasks,events,ledgerText:ledger,deltaText:'',readerSemanticGate:{schema_version:'reader-semantic-close-gate-v1',edition_date:date,edition_id:edition,result:'PASS',errors:[]},now:'2099-01-01T01:01:00Z'
 };
}
function incident(){
 const inv=deriveIncidentInventory({task23_recoveries:['repair-1']});
 return {inv,keys:inv.items.map(x=>x.key)};
}

test('live verification closes exactly Tasks 27-29 with zero AI/owner work',()=>{
 const {inv,keys}=incident(),tx=buildAtomicCloseoutTransaction(base(),{incident_inventory:inv,learning_incident_keys:keys,transaction_at:'2099-01-01T01:01:00Z'});
 assert.equal(tx.status,'COMMIT_READY');assert.equal(tx.ai_calls,0);assert.equal(tx.owner_prompts,0);
 const eventPaths=Object.keys(tx.files).filter(x=>x.includes('/events/'));
 assert.ok(eventPaths.some(x=>x.includes('/27-protected-closeout.json')));
 assert.ok(eventPaths.some(x=>x.includes('/28-protected-closeout.json')));
 assert.ok(eventPaths.some(x=>x.includes('/29-protected-closeout.json')));
 assert.equal(eventPaths.some(x=>/\/(23|24|25|26)-protected/.test(x)),false);
});

test('crash after every closeout write exposes no partial committed state and resumes safely',()=>{
 const {inv,keys}=incident(),tx=buildAtomicCloseoutTransaction(base(),{incident_inventory:inv,learning_incident_keys:keys,transaction_at:'2099-01-01T01:01:00Z'});
 const count=Object.keys(tx.files).length;
 for(let n=1;n<=count;n++){
   const r=simulateAtomicCommit(tx,{existing:{sentinel:'good'},crash_after:n});
   assert.equal(r.status,'CRASHED_BEFORE_COMMIT');assert.deepEqual(r.visible,{sentinel:'good'});
 }
 const committed=simulateAtomicCommit(tx,{existing:{sentinel:'good'}});
 assert.equal(committed.status,'COMMITTED');assert.equal(committed.visible['data/operations/active-production-run.json'].terminal,true);
});

test('wrong production or deployed SHA and missing live verification fail closed',()=>{
 const {inv,keys}=incident();
 let x=base();x.completion.deployed_sha='b'.repeat(40);assert.throws(()=>buildAtomicCloseoutTransaction(x,{incident_inventory:inv,learning_incident_keys:keys}),/exact_sha_mismatch/);
 x=base();x.validation.publication_sha='b'.repeat(40);assert.throws(()=>buildAtomicCloseoutTransaction(x,{incident_inventory:inv,learning_incident_keys:keys}),/exact_sha_mismatch/);
 x=base();x.completion.live_verification.final_result='fail';assert.throws(()=>buildAtomicCloseoutTransaction(x,{incident_inventory:inv,learning_incident_keys:keys}),/live_verification_required/);
});

test('missing incident learning reconciliation fails before PUBLIC_CLOSED',()=>{
 const {inv}=incident();assert.throws(()=>buildAtomicCloseoutTransaction(base(),{incident_inventory:inv,learning_incident_keys:[]}),/incident_learning_unreconciled/);
});

test('Tasks 00-26 must already be complete; closeout cannot bulk-reconcile publication work',()=>{
 const {inv,keys}=incident(),x=base();x.events=x.events.filter(e=>e.task_id!=='26');
 assert.throws(()=>buildAtomicCloseoutTransaction(x,{incident_inventory:inv,learning_incident_keys:keys}),/tasks_00_26_done/);
});
