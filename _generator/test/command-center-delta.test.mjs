import test from 'node:test';
import assert from 'node:assert/strict';
import {commandCenterDeltaPacket} from '../lib/command-center-delta.mjs';

test('Command Center delta packet is allowlisted and excludes private/arbitrary input fields',()=>{
 const packet=commandCenterDeltaPacket({
  validation:{date:'2026-09-18',publication_sha:'a'.repeat(40),final_result:'pass',model_calls:0,semantic_escalation_required:false,private_reader_data:{ratings:[1,2,3]},checks:[{check_id:'routes',result:'pass',severity:'critical',evidence:'do not copy detailed evidence',owner_email:'private@example.com'}]},
  watchlist:{changed_topics:['topic-a'],carried_topics:['topic-b'],removed_topics:[],normal_semantic_input_topic_ids:['topic-a'],model_calls:0,private_reviews:{notes:'secret'}},
  policy:{metadata_candidate_limit:20,normal_deep_review_limit:9,reason:'internal prose not allowlisted',secret:'never copy'},
  generatedAt:'2026-09-18T14:00:00Z'
 });
 assert.equal(packet.mode,'public_safe_command_center_delta_handoff');
 assert.equal(packet.validation.final_result,'pass');
 assert.deepEqual(packet.validation.checks,[{check_id:'routes',result:'pass',severity:'critical'}]);
 assert.deepEqual(packet.watchlist.changed_topics,['topic-a']);
 assert.equal(packet.operating_policy.metadata_candidate_limit,20);
 assert.equal(packet.operating_policy.normal_deep_review_limit,9);
 assert.equal(packet.privacy.private_reader_records_included,false);
 assert.equal(packet.transport.live_command_center_owner_state_mutation,'not_configured');
 const text=JSON.stringify(packet);
 for(const forbidden of ['private@example.com','secret','private_reader_data','private_reviews','detailed evidence'])assert.equal(text.includes(forbidden),false);
});
