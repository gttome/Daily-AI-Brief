import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildImageGenerationExecution,buildProductionImageGenerationExecution,validateImageGenerationExecution,validateImageExecutionReceipt,executeImageRequest,executeImageBatch} from '../lib/image-execution.mjs';
import {buildQualificationImageGenerationExecution} from '../lib/qualification-image-harness.mjs';
import {compileImageRenderSpec,validateImageRenderSpec} from '../lib/image-story-packet.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const usage=()=>({work_invocations:0,codex_invocations:0,paid_model_api_calls:0});
const packet=(id='m04')=>({story_id:'story-'+id,candidate_id:id,headline:'A supported single-story mechanism',source_url:'https://example.com/'+id,
  verified_visual_facts:['Verified source mechanism'],generic_conceptual_elements:['generic input','review checkpoint'],prohibited_specifics:['invented metrics'],
  visual_brief:'Detailed professional white-background 1200x630 editorial textbook illustration.',reference_policy:'Only source-supported specifics; generic explanatory concepts are explicitly conceptual.',
  acceptance_order:['subject','facts','structure','editorial'],wrong_subject_action:'Discard and generate a new request for this same story.',low_quality_fallback:false,
  allowed_image_text:['Input','Review'],composition_mode:'annotated_system',prohibited_composition_patterns:['generic sparse title card']});
function fixture({reject=0,readbackBad=false}={}){
  const calls=[],events=[],stored=new Map();let count=0;
  const adapter={
    async generate(e,{attempt}){calls.push('generate:'+e.sealed_story_packet.candidate_id);count++;
      return {bytes:Buffer.from('fixture-only-not-a-publishable-image:'+e.sealed_story_packet.candidate_id+':'+attempt),executor:'native_chatgpt_image_generation',evidence_type:'fixture',call_id:'fixture-generation-'+count,artifact_id:'fixture-output-'+count,generated_at:'2026-09-28T22:40:00Z',owner_interventions:[],usage:usage()};},
    async capture(bytes,meta){calls.push('capture:'+meta.candidate_id);const path='_records/image-attempts/'+meta.request_sha256+'/'+meta.attempt+'.png';stored.set(path,Buffer.from(bytes));return {path,owner_interventions:[]};},
    async review(bytes,e,{sha256}){calls.push('review:'+e.sealed_story_packet.candidate_id);return {mode:'automated',phase:'after_generation',call_id:'fixture-review-'+count,reviewed_at:'2026-09-28T22:41:00Z',asset_sha256:sha256,subject_match:count<=reject?'fail':'pass',factual_support:'pass',structural_quality:'pass',editorial_quality:'pass',owner_interventions:[],usage:usage()};},
    async persist(bytes,meta){calls.push('persist:'+meta.candidate_id);const path='briefs/images/2026-09-28/'+meta.candidate_id+'.png';stored.set(path,Buffer.from(bytes));return {path,persisted_at:'2026-09-28T22:42:00Z',owner_interventions:[]};},
    async read(path){calls.push('read:'+path);return readbackBad?Buffer.from('changed'):stored.get(path);}
  };
  return {adapter,eventSink:async e=>events.push(e),executionMode:'qualification_nonproduction',trigger:'fixture',evidenceType:'fixture',calls,events,stored};
}
test('production and qualification share the exact function and request bytes',()=>{
 assert.equal(buildQualificationImageGenerationExecution,buildProductionImageGenerationExecution);
 const e=buildQualificationImageGenerationExecution(packet());assert.deepEqual(e,buildProductionImageGenerationExecution(packet()));
 assert.equal(e.requires_fresh_conversation,false);assert.equal(e.manual_intervention_allowed,false);assert.equal(e.runtime_context_isolation,'not_asserted');assert.equal(e.review_phase,'after_generation');
 assert.deepEqual(validateImageGenerationExecution(e),[]);
});
test('request allowlist strips orchestration without claiming hidden platform isolation',()=>{
 const e=buildImageGenerationExecution({...packet(),q_id:'Q24',parent_conversation:'unrelated status',other_story_context:'wrong story'});
 assert.doesNotMatch(e.prompt,/Q24|unrelated status|wrong story/);assert.equal(e.includes_edition_context,false);assert.equal(e.request_scope,'sealed_story_payload_only');
});
test('request is a deep copy of the frozen source packet',()=>{const p=packet(),e=buildImageGenerationExecution(p);p.allowed_image_text.push('changed');assert.deepEqual(e.sealed_story_packet.allowed_image_text,['Input','Review']);});
test('strict render spec excludes headline source and orchestration text from generation prompt',()=>{
 const p=packet(),e=buildImageGenerationExecution(p);
 assert.doesNotMatch(e.prompt,/A supported single-story mechanism|example\.com|story-m04|candidate_id|source_url|headline:/);
 assert.match(e.prompt,/VISIBLE TEXT ALLOWLIST — EXACT: Input \| Review/);
 assert.match(e.prompt,/render NO other visible words/);
 assert.doesNotMatch(e.prompt,/Useful duplicates are permitted|generic non-factual headings/);
});
test('strict render spec prohibits people and inherited story motifs',()=>{
 const e=buildImageGenerationExecution(packet());
 assert.match(e.prompt,/People, faces, bodies, avatars, group\/person icons, humanoids/);
 assert.match(e.prompt,/Cross-story carryover is a failure/);
 assert.match(e.prompt,/Ignore and do not reuse any prior story, image, visual motif/);
});
test('render-spec compiler is deterministic and exact-text constrained',()=>{
 const spec=compileImageRenderSpec(packet());
 assert.equal(spec.policy_id,'strict-image-render-spec-v1');
 assert.equal(spec.visible_text_policy,'exact_allowlist_only');
 assert.equal(spec.people_policy,'prohibited');
 assert.deepEqual(spec.visible_text_allowlist,['Input','Review']);
 assert.deepEqual(validateImageRenderSpec(spec),[]);
});
test('pre-generation render lint rejects positive use of prohibited specifics',()=>{
 const p=packet();p.prohibited_specifics=['GitHub'];p.visual_brief='Detailed GitHub workflow diagram.';
 assert.throws(()=>buildImageGenerationExecution(p),/render_spec_positive_prohibited_conflict:GitHub/);
});
for(const [key,value] of [['requires_fresh_conversation',true],['manual_intervention_allowed',true],['runtime_context_isolation','guaranteed'],['output_count',6],['review_phase','before_generation'],['prompt','make a status dashboard']]){
 test('reject invalid request '+key,()=>{const e=buildImageGenerationExecution(packet());e[key]=value;assert.ok(validateImageGenerationExecution(e).length);});
}
test('reject unknown ambient fields and changed single-story membership',()=>{const e=buildImageGenerationExecution(packet());e.prior_messages=['inherited'];e.story_ids.push('other');assert.ok(validateImageGenerationExecution(e).length>=2);});
test('unavailable execution host is capability-blocked, never handed to the owner',async()=>{const events=[];const r=await executeImageRequest(buildImageGenerationExecution(packet()),{eventSink:async e=>events.push(e),executionMode:'production'});assert.equal(r.status,'CAPABILITY_BLOCKED');assert.equal(r.manual_intervention_required,false);assert.equal(events.length,1);});
test('fixture exercises automatic generation review persistence and exact readback',async()=>{const f=fixture(),e=buildImageGenerationExecution(packet()),r=await executeImageRequest(e,f);assert.equal(r.status,'fixture_pass');assert.deepEqual(r.owner_interventions,[]);assert.equal(f.calls.length,6);assert.deepEqual(validateImageExecutionReceipt(r,e,{allowFixture:true}),[]);assert.ok(validateImageExecutionReceipt(r,e).includes('live_image_execution_evidence_required'));assert.equal(r.persistence.git_blob_sha,createHash('sha1').update(Buffer.from('blob '+f.stored.get(r.persistence.path).length+'\0')).update(f.stored.get(r.persistence.path)).digest('hex'));});
test('wrong-subject rejection automatically regenerates only that story and preserves failed evidence',async()=>{const f=fixture({reject:1});const r=await executeImageRequest(buildImageGenerationExecution(packet()),f);assert.equal(r.attempt,2);assert.equal(f.calls.filter(x=>x==='generate:m04').length,2);assert.equal(f.events.filter(x=>x.status==='ATTEMPT_REJECTED').length,1);assert.equal(f.calls.filter(x=>x==='persist:m04').length,1);});
test('four rejected attempts exhaust the budget without an owner-upload fallback',async()=>{const f=fixture({reject:9}),r=await executeImageRequest(buildImageGenerationExecution(packet()),f);assert.equal(r.status,'ATTEMPT_LIMIT_EXHAUSTED');assert.equal(r.failures.length,4);assert.equal(r.manual_intervention_required,false);assert.equal(f.calls.some(x=>x.startsWith('persist:')),false);});
test('generation exception is retained and retried automatically',async()=>{const f=fixture(),generate=f.adapter.generate;let n=0;f.adapter.generate=async(...a)=>{if(!n++)throw Error('temporary native generation error');return generate(...a);};const r=await executeImageRequest(buildImageGenerationExecution(packet()),f);assert.equal(r.attempt,2);assert.equal(f.events.some(x=>x.status==='ATTEMPT_FAILED'),true);});
test('changed bytes after persistence fail closed',async()=>{await assert.rejects(executeImageRequest(buildImageGenerationExecution(packet()),fixture({readbackBad:true})),/readback_mismatch/);});
test('same-edition accepted checkpoint is verified and reused without generation or review',async()=>{const f=fixture(),e=buildImageGenerationExecution(packet()),r=await executeImageRequest(e,f);f.calls.length=0;const reused=await executeImageRequest(e,{...f,resume:r});assert.equal(reused.reused,true);assert.equal(f.calls.length,1);assert.match(f.calls[0],/^read:/);});
test('resume rejects changed request and changed bytes',async()=>{const f=fixture(),e=buildImageGenerationExecution(packet()),r=await executeImageRequest(e,f);await assert.rejects(executeImageRequest(buildImageGenerationExecution(packet('m03')),{...f,resume:r}),/binding_mismatch/);f.stored.set(r.persistence.path,Buffer.from('tampered'));await assert.rejects(executeImageRequest(e,{...f,resume:r}),/resume_bytes_changed/);});
test('six-story fixture runs serially through the shared path and cannot prove unattended production',async()=>{const f=fixture(),es=['m04','m03','m05','m06','m01','m09'].map(id=>buildImageGenerationExecution(packet(id))),r=await executeImageBatch(es,f);assert.equal(r.results.length,6);assert.equal(r.status,'fixture_pass');assert.equal(r.unattended_image_stage_evidence_complete,false);assert.equal(f.calls[6],'generate:m03');});
test('batch fails on missing or duplicate story requests',async()=>{const f=fixture(),e=buildImageGenerationExecution(packet());await assert.rejects(executeImageBatch([e],f),/six_image/);await assert.rejects(executeImageBatch(Array(6).fill(e),f),/unique_image/);});
test('generation cannot be relabeled as native or zero-cost from an incompatible adapter',async()=>{const f=fixture(),generate=f.adapter.generate;f.adapter.generate=async(...a)=>({...await generate(...a),executor:'paid_external_image_api'});await assert.rejects(executeImageRequest(buildImageGenerationExecution(packet()),f),/provenance_or_cost/);});
for(const [name,mutate] of [
 ['owner action',r=>r.owner_interventions.push('upload image')],['claimed isolation',r=>r.runtime_context_isolation='fresh'],
 ['pre-generation review',r=>r.review.reviewed_at='2026-09-28T22:39:00Z'],['wrong bytes',r=>r.review.asset_sha256='a'.repeat(64)],
 ['paid invocation',r=>r.paid_model_api_calls=1],['missing native call',r=>delete r.generation.call_id],
 ['wrong subject',r=>r.review.subject_match='fail'],['manual review',r=>r.review.mode='owner'],
 ['fixture promoted',r=>{r.status='accepted_locked';r.evidence_type='live';}],['missing exact readback',r=>r.persistence.read_back_verified=false]
])test('receipt rejects '+name,async()=>{const f=fixture(),e=buildImageGenerationExecution(packet()),r=await executeImageRequest(e,f);mutate(r);assert.ok(validateImageExecutionReceipt(r,e,{allowFixture:true}).length);});

test('raw capture capability is required and no transient-output shortcut is accepted',async()=>{const f=fixture();delete f.adapter.capture;const r=await executeImageRequest(buildImageGenerationExecution(packet()),f);assert.equal(r.status,'CAPABILITY_BLOCKED');assert.equal(f.calls.length,0);});
test('corrupted raw capture is recorded and rejected before review',async()=>{const f=fixture({readbackBad:true});await assert.rejects(executeImageRequest(buildImageGenerationExecution(packet()),f),/raw_image_capture_readback_mismatch/);assert.equal(f.calls.some(x=>x.startsWith('review:')),false);assert.equal(f.events.at(-1).status,'EXECUTION_FAILED');});
