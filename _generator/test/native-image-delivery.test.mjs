import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildImageGenerationExecution,imageExecutionHash} from '../lib/image-execution.mjs';
import {buildQualificationImageGenerationExecution} from '../lib/qualification-image-harness.mjs';
import {buildNativeImageDelivery,validateNativeImageDelivery,assertNativeImageTaskPrompt,planNativeImageContinuation,validateNativeImageResultHandoffCapability,DIRECT_IMAGE_CAPTURE_POLICY} from '../lib/native-image-delivery.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
const packet = () => ({story_id:'story-m04',candidate_id:'m04',headline:'Claude Sonnet 5.5 on AWS',source_url:'https://example.com/frozen',verified_visual_facts:['Model availability on Amazon Bedrock and Claude Platform on AWS.'],generic_conceptual_elements:['Suggested comparison of coding and knowledge-work tasks.'],prohibited_specifics:['No fabricated results or product interfaces.'],visual_brief:'White-background, detailed model-evaluation textbook illustration with empty scales for quality, latency and cost.',reference_policy:'No ambient context.',acceptance_order:['subject_identity','factual_support','structural_quality','editorial_quality'],wrong_subject_action:'Discard; supervisor retries at most four times.',low_quality_fallback:false,allowed_image_text:['Claude Sonnet 5.5','Amazon Bedrock','Claude Platform on AWS','Coding tasks','Knowledge work','Quality','Latency','Cost'],composition_mode:'comparison',prohibited_composition_patterns:['sparse generic boxes']});
const execution = () => buildImageGenerationExecution(packet());
const capability = () => ({schema_version:'1.0.0',task_invocation_observable:true,native_result_recoverable:true,output_bytes_recoverable:true,verified_at:'2026-09-29T13:45:00Z',evidence:'fixture proves task result identity and exact output bytes are recoverable by the supervising execution context'});
const rejected = (e,attempt=1) => ({attempt,request_sha256:imageExecutionHash(e),disposition:'rejected',generation:{artifact_id:'fixture-artifact-'+attempt,call_id:'fixture-call-'+attempt,raw_sha256:hash('fixture-'+attempt)},git_capture:{read_back_verified:true,sha256:hash('fixture-'+attempt),git_blob_sha:'a'.repeat(40)},review:{rejection_record_path:'fixture-review-'+attempt,raw_sha256:hash('fixture-'+attempt)}});
test('both modes produce identical visual-only task text without mutating frozen requests',()=>{const e=execution(),before=JSON.stringify(e),d=buildNativeImageDelivery(e);assert.deepEqual(d,buildNativeImageDelivery(buildQualificationImageGenerationExecution(packet())));assert.equal(JSON.stringify(e),before);assert.deepEqual(validateNativeImageDelivery(d,e),[]);});
test('contains only the shared sealed render instruction with factual scope and every required label',()=>{const e=execution(),d=buildNativeImageDelivery(e);assert.equal(d.task_prompt,e.generation_instruction);for(const value of [e.sealed_story_packet.visual_brief,...e.sealed_story_packet.verified_visual_facts,...e.sealed_story_packet.allowed_image_text])assert.ok(d.task_prompt.includes(value));assert.equal(d.task_prompt.includes(e.sealed_story_packet.story_id),false);});
test('excludes envelope IDs, storage/retry instructions and acceptance metadata',()=>{const d=buildNativeImageDelivery(execution());for(const value of ['story-m04','candidate_id','request_sha256','acceptance_order','supervisor retries','GENERATION_REQUESTED','CAPABILITY_BLOCKED'])assert.equal(d.task_prompt.includes(value),false);});
test('native tool argument prompt remains null, new-image invocation has no references',()=>{const d=buildNativeImageDelivery(execution());assert.equal(d.native_tool_arguments.prompt,null);assert.equal(d.native_tool_arguments.n,1);assert.equal(d.native_tool_arguments.referenced_image_ids,null);});
test('actual submitted task prompt is checked, not merely the saved envelope',()=>{const e=execution(),d=buildNativeImageDelivery(e);assert.equal(assertNativeImageTaskPrompt(d.task_prompt,d,e).native_image_generation_started,false);assert.throws(()=>assertNativeImageTaskPrompt('Continue Q24 operations.\n'+d.task_prompt,d,e),/must_equal/);});
for(const field of ['task_prompt','request_sha256','runtime_context_isolation','hidden_platform_context_isolation','generator_visible_context'])test('reject tampered delivery '+field,()=>{const e=execution(),d=buildNativeImageDelivery(e);d[field]='changed';assert.ok(validateNativeImageDelivery(d,e).length);});
test('reject copied prompt with self-consistent but incorrect hash',()=>{const e=execution(),d=buildNativeImageDelivery(e);d.task_prompt='Create an operations dashboard';d.task_prompt_sha256=hash(d.task_prompt);assert.ok(validateNativeImageDelivery(d,e).length);});
test('empty history blocks task allocation until result handoff is proven',()=>{const r=planNativeImageContinuation(execution(),[]);assert.equal(r.attempt,1);assert.equal(r.next_action,'CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');assert.equal(r.image_generation_started,false);assert.ok(r.capability_errors.includes('native_image_result_handoff_capability_required'));});
test('direct-capture mode permits one same-invocation generation without claiming native recovery',()=>{const r=planNativeImageContinuation(execution(),[],null,{handoffMode:DIRECT_IMAGE_CAPTURE_POLICY});assert.equal(r.attempt,1);assert.equal(r.next_action,'GENERATE_CAPTURE_REVIEW_SAME_INVOCATION');assert.equal(r.native_recovery_capability_claimed,false);assert.equal(r.must_persist_returned_bytes_before_yield,true);});
test('verified result handoff permits first task preparation',()=>{const r=planNativeImageContinuation(execution(),[],capability());assert.equal(r.attempt,1);assert.equal(r.next_action,'PREPARE_IMAGE_ONLY_TASK');assert.equal(r.image_generation_started,false);assert.deepEqual(validateNativeImageResultHandoffCapability(capability()),[]);});
test('partial result handoff capability fails closed',()=>{const c=capability();c.output_bytes_recoverable=false;const r=planNativeImageContinuation(execution(),[],c);assert.equal(r.next_action,'CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');assert.ok(r.capability_errors.includes('output_bytes_recoverable_required'));});
test('pending attempt cannot allocate a duplicate generation',()=>{const e=execution(),a=rejected(e);delete a.generation;a.disposition='pending';assert.equal(planNativeImageContinuation(e,[a]).next_action,'RECOVER_OR_RECONCILE_EXISTING_ATTEMPT');});
test('observed invocation with exhausted supported recovery can close as unrecoverable and advance',()=>{const e=execution(),a={attempt:1,request_sha256:imageExecutionHash(e),disposition:'unrecoverable',recovery:{reason_code:'TASK_RESULT_UNRECOVERABLE',task_invocation_observed:true,exhaustive_supported_search:true,outcome_observable:false,checked_at:'2026-09-29T12:00:00Z'}};const r=planNativeImageContinuation(e,[a],capability());assert.equal(r.next_action,'PREPARE_IMAGE_ONLY_TASK');assert.equal(r.attempt,2);});
test('direct-capture mode advances after a durably unrecoverable attempt within the same four-attempt budget',()=>{const e=execution(),a={attempt:1,request_sha256:imageExecutionHash(e),disposition:'unrecoverable',recovery:{reason_code:'TASK_RESULT_UNRECOVERABLE',task_invocation_observed:true,exhaustive_supported_search:true,outcome_observable:false,checked_at:'2026-09-29T12:00:00Z'}};const r=planNativeImageContinuation(e,[a],null,{handoffMode:DIRECT_IMAGE_CAPTURE_POLICY});assert.equal(r.next_action,'GENERATE_CAPTURE_REVIEW_SAME_INVOCATION');assert.equal(r.attempt,2);assert.equal(r.native_recovery_capability_claimed,false);});
test('unrecoverable disposition fails closed without complete recovery evidence',()=>{const e=execution(),a={attempt:1,request_sha256:imageExecutionHash(e),disposition:'unrecoverable',recovery:{reason_code:'TASK_RESULT_UNRECOVERABLE',task_invocation_observed:true,exhaustive_supported_search:false,outcome_observable:false,checked_at:'2026-09-29T12:00:00Z'}};assert.throws(()=>planNativeImageContinuation(e,[a]),/unrecoverable_attempt_evidence_invalid/);});
test('Library capture does not replace Git preservation for second output',()=>{const e=execution(),a=rejected(e,2);delete a.git_capture;a.library_read_back_verified=true;const r=planNativeImageContinuation(e,[rejected(e),a]);assert.equal(r.next_action,'CAPTURE_EXISTING_RAW');assert.equal(r.attempt,2);});
test('mismatched raw readback is not accepted',()=>{const e=execution(),a=rejected(e);a.git_capture.sha256='0'.repeat(64);assert.equal(planNativeImageContinuation(e,[a]).next_action,'CAPTURE_EXISTING_RAW');});
test('missing rejection review is completed before retry',()=>{const e=execution(),a=rejected(e);delete a.review;assert.equal(planNativeImageContinuation(e,[a]).next_action,'REVIEW_EXISTING_RAW');});
test('after two preserved rejections only attempt three may be prepared',()=>{const e=execution(),r=planNativeImageContinuation(e,[rejected(e,1),rejected(e,2)],capability());assert.equal(r.next_action,'PREPARE_IMAGE_ONLY_TASK');assert.equal(r.attempt,3);});
test('four failures exhaust budget without fifth attempt or owner action',()=>{const e=execution(),r=planNativeImageContinuation(e,[1,2,3,4].map(a=>rejected(e,a)));assert.equal(r.next_action,'ATTEMPT_LIMIT_EXHAUSTED');assert.equal(r.manual_intervention_required,false);});
test('four unrecoverable observed invocations also exhaust the same bounded budget',()=>{const e=execution(),r=planNativeImageContinuation(e,[1,2,3,4].map(attempt=>({attempt,request_sha256:imageExecutionHash(e),disposition:'unrecoverable',recovery:{reason_code:'TASK_RESULT_UNRECOVERABLE',task_invocation_observed:true,exhaustive_supported_search:true,outcome_observable:false,checked_at:'2026-09-29T12:00:00Z'}})));assert.equal(r.next_action,'ATTEMPT_LIMIT_EXHAUSTED');});
test('accepted status requires separate actual receipt and byte validation',()=>{const e=execution(),a=rejected(e);a.disposition='accepted_locked';const r=planNativeImageContinuation(e,[a]);assert.equal(r.next_action,'VERIFY_ACCEPTED_CHECKPOINT');assert.equal(r.accepted_locked,false);});
test('changed request, missing predecessor and later attempt before rejection fail closed',()=>{const e=execution(),a=rejected(e);a.request_sha256='0'.repeat(64);assert.throws(()=>planNativeImageContinuation(e,[a]),/binding_invalid/);assert.throws(()=>planNativeImageContinuation(e,[rejected(e,2)]),/binding_invalid/);const b=rejected(e);b.disposition='pending';assert.throws(()=>planNativeImageContinuation(e,[b,rejected(e,2)]),/before_prior_terminal_failure/);});

test('generator-visible context is the sealed story render spec only',()=>{
  const e=execution(),d=buildNativeImageDelivery(e);
  assert.equal(d.runtime_context_isolation,'generator_visible_story_only_projection_v1');
  assert.equal(d.hidden_platform_context_isolation,'not_asserted');
  assert.equal(d.generator_visible_context.schema_version,'story-only-generator-context-v1');
  assert.equal(d.generator_visible_context.render_spec.inherited_context_policy,'prohibited');
  assert.equal(d.generator_visible_context.render_spec.visible_text_policy,'exact_allowlist_only');
  for(const forbidden of ['Watchdog','Supervisor','Kanban','recovery lease','production dashboard'])
    assert.equal(d.task_prompt.includes(forbidden),false);
});

test('synthetic orchestration contamination on the outer packet cannot enter generator-visible context',()=>{
  const p=packet();
  p.watchdog_context='Watchdog status dashboard with recovery lease and Kanban';
  p.supervisor_history='Supervisor incident timeline';
  const e=buildImageGenerationExecution(p);
  const d=buildNativeImageDelivery(e);
  assert.equal(d.task_prompt.includes('Watchdog status dashboard'),false);
  assert.equal(d.task_prompt.includes('Supervisor incident timeline'),false);
  assert.equal(JSON.stringify(d.generator_visible_context).includes('Watchdog status dashboard'),false);
});

test('first context-contamination rejection exits ordinary retry and requires engineering repair',()=>{
  const e=execution(),a=rejected(e,1);
  a.review.rejection_code='CONTEXT_CONTAMINATION';
  a.review.rejection_reason='Watchdog dashboard replaced the story mechanism';
  let r=planNativeImageContinuation(e,[a],capability());
  assert.equal(r.next_action,'ENGINEERING_REPAIR_REQUIRED');
  assert.equal(r.same_context_retry_allowed,false);
  assert.equal(r.required_next_context,'fresh_story_only_generator_visible_context');
  r=planNativeImageContinuation(e,[a],capability(),{engineeringRepairReady:true});
  assert.equal(r.next_action,'PREPARE_IMAGE_ONLY_TASK');
  assert.equal(r.attempt,2);
});

test('wrong-subject rejection follows the same engineering-repair boundary',()=>{
  const e=execution(),a=rejected(e,1);
  a.review.rejection_code='WRONG_SUBJECT';
  const r=planNativeImageContinuation(e,[a],capability());
  assert.equal(r.next_action,'ENGINEERING_REPAIR_REQUIRED');
});

