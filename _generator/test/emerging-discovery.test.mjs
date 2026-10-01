import test from 'node:test';
import assert from 'node:assert/strict';
import {emergingDiscoveryPlan,decideEmergingCandidate,emergingDiscoveryTelemetry,validateEmergingDiscovery} from '../lib/emerging-discovery.mjs';
import {validateEmergingSignalSweep} from '../lib/emerging-signal-sweep.mjs';
import {renderDailyTopicGroups} from '../../assets/js/watchlist-daily.js';
const evidence={kind:'primary',credible:true,title:'Original research',publisher:'Research lab',checked_at:'2026-09-30T12:00:00Z',review_depth:'technical documentation',url:'https://example.com/research',development_id:'new-mechanism'};
const candidate={candidate_id:'c1',name:'Distinct scientific model',mechanism:'A specialized novel inference mechanism',materially_new:true,relevant:true,evidence:[evidence],limitations:'One primary announcement; no replication yet.',topic_id:'dab-topic-new-mechanism',status:'early_signal',confidence:'limited',disposition:'new_topic'};
function receipt(){
 const plan=emergingDiscoveryPlan('2026-09-30');
 const r={schema_version:'2.0.0',edition_date:plan.edition_date,discovery_scope:'independent_watchlist',domain_checks:plan.domains.map(d=>({id:d.id,checks:d.checks.map((c,i)=>({...c,method:'web_search',status:'complete',checked_at:'2026-09-30T12:00:00Z',candidate_ids:i===0?['c1']:[],result_summary:'Reviewed results; original source retained.'}))})),candidates_reviewed:[structuredClone(candidate)],new_topic_ids:[candidate.topic_id],updated_topic_ids:[]};
 r.telemetry=emergingDiscoveryTelemetry(r);return r;
}
test('independent discovery plans seven domains and fourteen focused checks without selected stories',()=>{
 const p=emergingDiscoveryPlan('2026-09-30');assert.equal(p.domains.length,7);assert.equal(p.domains.flatMap(d=>d.checks).length,14);assert.equal(p.independent_of_selected_stories,true);
});
test('one reviewed strong primary source admits limited early signal without corroboration or mature durability',()=>{
 const decision=decideEmergingCandidate(candidate,[]);assert.equal(decision.disposition,'new_topic');assert.equal(decision.status,'early_signal');assert.equal(decision.confidence,'limited');
 assert.equal(decideEmergingCandidate({...candidate,promotional_only:true}).disposition,'rejected');
 assert.equal(decideEmergingCandidate({...candidate,evidence:[]}).disposition,'needs_research');
});
test('broad thematic overlap stays distinct; same-mechanism evidence updates and exact duplicates merge',()=>{
 const topics=[{topic_id:'dab-topic-old',evidence:[{...evidence,development_id:'old'}]}];
 assert.equal(decideEmergingCandidate({...candidate,same_mechanism_topic_id:'dab-topic-old'},topics).disposition,'new_topic');
 const c={...candidate,same_mechanism_topic_id:'dab-topic-old',mechanism_comparison:'Same mechanism with a new technical implementation',meaningful_new_evidence:true};
 assert.equal(decideEmergingCandidate(c,topics).disposition,'update_existing');
 topics[0].evidence=[evidence];assert.equal(decideEmergingCandidate(c,topics).disposition,'duplicate');
});
test('complete ledgers and derived telemetry pass; omitted candidates and invented coverage fail',()=>{
 const r=receipt();assert.deepEqual(validateEmergingDiscovery(r),[]);
 r.domain_checks[0].checks[0].candidate_ids.push('missing');assert.ok(validateEmergingDiscovery(r).some(e=>e.includes('Complete candidate')));
 const incomplete=receipt();incomplete.domain_checks.pop();assert.ok(validateEmergingDiscovery(incomplete).some(e=>e.includes('Two distinct')));
 const fake=receipt();fake.telemetry.new_topics_admitted=3;assert.ok(validateEmergingDiscovery(fake).some(e=>e.includes('telemetry')));
});
test('zero-new days require every candidate disposition and all checks completed',()=>{
 const r=receipt();r.candidates_reviewed[0]={...candidate,promotional_only:true,disposition:'rejected'};r.new_topic_ids=[];r.telemetry=emergingDiscoveryTelemetry(r);assert.deepEqual(validateEmergingDiscovery(r),[]);
 r.domain_checks[0].checks[0].status='degraded';r.domain_checks[0].checks[0].reason='Unavailable';r.telemetry=emergingDiscoveryTelemetry(r);assert.ok(validateEmergingDiscovery(r).some(e=>e.includes('all seven')));
 r.candidates_reviewed=[];assert.ok(validateEmergingDiscovery(r).some(e=>e.includes('ledger')));
});
test('new policy cannot be bypassed by submitting a legacy receipt; historical receipts remain accepted',()=>{
 assert.ok(validateEmergingSignalSweep({schema_version:'1.0.0',edition_date:'2026-09-30'}).some(e=>e.includes('Independent Watchlist')));
});
test('daily counts and complete lists include carried topics and escape names',()=>{
 const date='2026-09-30',html=renderDailyTopicGroups({edition_date:date,topics:[{name:'<New>',first_detected:date},{name:'Updated',updated_at:date},{name:'Carried'}]});
 for(const text of ['1 New today','1 Updated today','1 Carried forward','&lt;New&gt;','<li>Updated</li>','<li>Carried</li>'])assert.ok(html.includes(text));
});
test('an update validates against its prior inventory after new evidence is projected',()=>{
 const r=receipt(),topic={topic_id:'dab-topic-existing',evidence:[{...evidence,development_id:'old'},evidence]};
 r.candidates_reviewed[0]={...candidate,topic_id:topic.topic_id,same_mechanism_topic_id:topic.topic_id,mechanism_comparison:'The same mechanism now has a distinct primary implementation.',prior_development_ids:['old'],meaningful_new_evidence:true,disposition:'update_existing'};
 r.new_topic_ids=[];r.updated_topic_ids=[topic.topic_id];r.telemetry=emergingDiscoveryTelemetry(r);
 assert.deepEqual(validateEmergingDiscovery(r,{topics:[topic]}),[]);
 delete r.candidates_reviewed[0].prior_development_ids;
 assert.ok(validateEmergingDiscovery(r,{topics:[topic]}).some(e=>e.includes('prior development')));
});
