import test from 'node:test';
import assert from 'node:assert/strict';
import {commandCenterDeltaPacket} from '../lib/command-center-delta.mjs';

test('Command Center delta packet is allowlisted and excludes private/arbitrary input fields',()=>{
 const packet=commandCenterDeltaPacket({
  validation:{date:'2026-09-18',publication_sha:'a'.repeat(40),final_result:'pass',model_calls:0,semantic_escalation_required:false,automatic_ai_recovery_runs:0,coverage:{articles:6,videos:0,podcasts:2,included_items:8,potential_positions:10},image_readiness:{expected:6,accepted_locked:6,integrity_passed:6,canonical_hosted:6,status:'pass'},domain_states:{publication:'verified',coverage:'degraded'},private_reader_data:{ratings:[1,2,3]},checks:[{check_id:'routes',result:'pass',severity:'critical',evidence:'do not copy detailed evidence',owner_email:'private@example.com'}]},
  watchlist:{changed_topics:['topic-a'],carried_topics:['topic-b'],removed_topics:[],normal_semantic_input_topic_ids:['topic-a'],model_calls:0,private_reviews:{notes:'secret'}},
  policy:{profile_id:'under80-v1',daily_system_credit_target_lt:80,metadata_candidate_limit:20,normal_deep_review_limit:9,image:{quality_protected:true},reason:'internal prose not allowlisted',secret:'never copy'},
  generatedAt:'2026-09-18T14:00:00Z'
 });
 assert.equal(packet.mode,'public_safe_command_center_delta_handoff');
 assert.equal(packet.validation.final_result,'pass');
 assert.equal(packet.validation.coverage.included_items,8);assert.equal(packet.validation.image_readiness.accepted_locked,6);assert.equal(packet.validation.image_readiness.status,'pass');assert.equal(packet.validation.domain_states.coverage,'degraded');assert.equal(packet.validation.automatic_ai_recovery_runs,0);
 assert.deepEqual(packet.validation.checks,[{check_id:'routes',result:'pass',severity:'critical'}]);
 assert.deepEqual(packet.watchlist.changed_topics,['topic-a']);
 assert.equal(packet.presentation.focus_labels.agents_non_technical_people,'Agents for Everyone');
 assert.equal(packet.presentation.github_startup_gate.required,true);
 assert.equal(packet.presentation.book_series.mapping_source,'_data/book-reading.json');
 assert.equal(packet.operating_policy.metadata_candidate_limit,20);
 assert.equal(packet.operating_policy.normal_deep_review_limit,9);assert.equal(packet.operating_policy.profile_id,'under80-v1');assert.equal(packet.operating_policy.daily_system_credit_target_lt,80);assert.equal(packet.operating_policy.image.quality_protected,true);
 assert.equal(packet.privacy.private_reader_records_included,false);
 assert.equal(packet.transport.live_command_center_owner_state_mutation,'not_configured');
 const text=JSON.stringify(packet);
 for(const forbidden of ['private@example.com','secret','private_reader_data','private_reviews','detailed evidence'])assert.equal(text.includes(forbidden),false);
});
