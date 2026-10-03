import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan,validateRequest,archiveOne,REPOSITORY} from '../../_tools/maintenance-cleanup.mjs';
const sha='a'.repeat(40),later='b'.repeat(40);
const request={schema_version:'1.0.0',repository:REPOSITORY,mode:'apply',maintenance_id:'cleanup-20260928-a',expected_main_sha:sha,max_branches:200,merged_before:'2026-09-27T00:00:00Z'};
const branch=(name,protectedValue=false)=>({name,protected:protectedValue,commit:{sha}});
const pr=(name,changes={})=>({number:1,state:'closed',merged_at:'2026-09-25T00:00:00Z',base:{ref:'main'},head:{ref:name,sha,repo:{full_name:REPOSITORY}},...changes});
const plan=(branches,pulls,extra={})=>buildPlan({branches,pulls,activeBranches:[],referencedBranches:[],protected117:'special-pr117',request,...extra});
test('strict request bounds and cooling period',()=>{
 assert.doesNotThrow(()=>validateRequest(request,Date.parse('2026-09-28T16:00:00Z')));
 for(const change of [{repository:'other/repo'},{max_branches:201},{mode:'delete-all'},{expected_main_sha:'main'},{maintenance_id:'../evil'},{merged_before:'2026-09-28T15:00:00Z'}])assert.throws(()=>validateRequest({...request,...change},Date.parse('2026-09-28T16:00:00Z')));
});
test('old exact merged branch is eligible',()=>{assert.equal(plan([branch('fix/old')],[pr('fix/old')])[0].decision,'archive_candidate');});
test('protect main, protected refs, publication and Q/IH history, and PR117',()=>{
 for(const name of ['main','special-pr117','publication/old','editorial-handoff/qualification/2026-09-27-Q18','qualification-image-harness/old','hardening/q19-test','work/test'])assert.equal(plan([branch(name)],[pr(name)])[0].decision,'retain');
 assert.equal(plan([branch('fix/old',true)],[pr('fix/old')])[0].reason,'protected');
});
test('unmerged, changed-head, recent, active, referenced and open PR branches remain',()=>{
 assert.equal(plan([branch('fix/old')],[])[0].reason,'no_exact_merged_head');
 assert.equal(plan([{name:'fix/old',commit:{sha:later}}],[pr('fix/old')])[0].reason,'no_exact_merged_head');
 assert.equal(plan([branch('fix/old')],[pr('fix/old',{merged_at:'2026-09-28T00:00:00Z'})])[0].reason,'cooling_period');
 assert.equal(plan([branch('fix/old')],[pr('fix/old')],{activeBranches:['fix/old']})[0].reason,'active_workflow');
 assert.equal(plan([branch('fix/old')],[pr('fix/old')],{referencedBranches:['fix/old']})[0].reason,'referenced_by_tracked_file');
 assert.equal(plan([branch('fix/old')],[pr('fix/old'),pr('fix/old',{state:'open',merged_at:null})])[0].reason,'open_pull_request');
});
const item=plan([branch('fix/old')],[pr('fix/old')])[0];
function harness(){let tag=null,deleted=false,reads=0;const events=[];return {events,adapter:{getBranch:async()=>{reads++;return deleted?null:branch('fix/old');},getArchive:async()=>tag,createArchive:async(ref,hash)=>{events.push('archive');tag={object:{sha:hash,type:'commit'}};},hasOpenPR:async()=>false,hasActiveRun:async()=>false,deleteBranch:async()=>{events.push('delete');deleted=true;}},get reads(){return reads;}};}
test('archive is verified before deletion and deletion is checked',async()=>{const h=harness();const r=await archiveOne(item,h.adapter);assert.equal(r.result,'archived_and_removed');assert.deepEqual(h.events,['archive','delete']);assert.equal(h.reads,3);});
test('archive mismatch refuses deletion',async()=>{const h=harness();h.adapter.getArchive=async()=>({object:{sha:later,type:'commit'}});await assert.rejects(archiveOne(item,h.adapter),/archive_verification_failed/);assert.deepEqual(h.events,[]);});
test('new live work prevents deletion',async()=>{const h=harness();h.adapter.hasActiveRun=async()=>true;assert.equal((await archiveOne(item,h.adapter)).result,'skipped_live_work');assert.deepEqual(h.events,[]);});
test('head race after archive prevents deletion',async()=>{const h=harness();let n=0;h.adapter.getBranch=async()=>++n===1?branch('fix/old'):{name:'fix/old',commit:{sha:later}};assert.equal((await archiveOne(item,h.adapter)).result,'skipped_head_race');assert.deepEqual(h.events,['archive']);});
