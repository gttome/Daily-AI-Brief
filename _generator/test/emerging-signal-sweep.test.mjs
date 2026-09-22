import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEmergingSignalSweep,REQUIRED_EMERGING_SURFACES} from '../lib/emerging-signal-sweep.mjs';

const policy=JSON.parse(fs.readFileSync('_data/emerging-signal-policy.json','utf8'));
const watchlist=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8'));

function surface(id,status='complete'){return {id,status,queries:['daily '+id+' emerging AI'],candidates_found:1,...(status==='degraded'?{reason:'temporary source limitation'}:{})};}
function candidate(name='Example'){return {name,concept_class:'model_family_or_architecture',disposition:'rejected',rationale:'Reviewed original evidence; not yet distinct or durable enough for a Watchlist topic.',evidence_urls:['https://example.com/evidence']};}

test('emerging-signal policy requires broad web and YouTube creator discovery',()=>{
 assert.equal(policy.effective_date,'2026-09-23');
 assert.ok(policy.required_surfaces.some(x=>x.id==='broad_web'));
 assert.ok(policy.required_surfaces.some(x=>x.id==='youtube_creator_ecosystem'));
 assert.equal(policy.rules.zero_new_requires_14_day_missed_signal_check,true);
});

test('valid sweep with a new topic passes',()=>{
 const receipt={schema_version:'1.0.0',edition_date:'2026-09-23',primary_lookback_days:7,missed_signal_check:{completed:true,lookback_days:14},surfaces:REQUIRED_EMERGING_SURFACES.map(id=>surface(id)),concept_classes_reviewed:policy.concept_classes.slice(0,6),candidates_reviewed:[{...candidate('New decision model'),disposition:'new_topic'}],new_topic_ids:['dab-topic-example'],updated_topic_ids:[],zero_new_certified:false,zero_new_justification:null};
 assert.deepEqual(validateEmergingSignalSweep(receipt,{editionDate:'2026-09-23'}),[]);
});

test('zero-new state fails when YouTube or broad web was not completed',()=>{
 const surfaces=REQUIRED_EMERGING_SURFACES.map(id=>surface(id));
 surfaces.find(x=>x.id==='youtube_creator_ecosystem').status='degraded';
 surfaces.find(x=>x.id==='youtube_creator_ecosystem').reason='search unavailable';
 const receipt={schema_version:'1.0.0',edition_date:'2026-09-23',primary_lookback_days:7,missed_signal_check:{completed:true,lookback_days:14},surfaces,concept_classes_reviewed:policy.concept_classes.slice(0,6),candidates_reviewed:[candidate('A'),candidate('B'),candidate('C')],new_topic_ids:[],updated_topic_ids:[],zero_new_certified:true,zero_new_justification:'No candidate cleared the new-topic threshold after broad source review, creator review, and a fourteen-day missed-signal lookback across multiple concept classes.'};
 assert.ok(validateEmergingSignalSweep(receipt,{editionDate:'2026-09-23'}).some(e=>e.includes('every required surface complete')));
});

test('future publication requires a daily emerging-signal receipt matching Watchlist deltas',()=>{
 if(watchlist.edition_date<policy.effective_date)return;
 const path='_records/watchlist-sweeps/'+watchlist.edition_date+'.json';
 assert.ok(fs.existsSync(path),'Daily emerging-signal receipt required for '+watchlist.edition_date);
 const receipt=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.deepEqual(validateEmergingSignalSweep(receipt,{editionDate:watchlist.edition_date}),[]);
 const active=(watchlist.topics||[]).filter(t=>t.status!=='archived');
 const newIds=active.filter(t=>String(t.first_detected||'').slice(0,10)===watchlist.edition_date).map(t=>t.topic_id).sort();
 const updatedIds=active.filter(t=>String(t.first_detected||'').slice(0,10)!==watchlist.edition_date&&String(t.updated_at||'').slice(0,10)===watchlist.edition_date).map(t=>t.topic_id).sort();
 assert.deepEqual([...receipt.new_topic_ids].sort(),newIds);
 assert.deepEqual([...receipt.updated_topic_ids].sort(),updatedIds);
});
