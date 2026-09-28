import {buildImageGenerationExecution,imageExecutionHash,IMAGE_EXECUTION_POLICY} from '../lib/image-execution.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
  deployedImageByteErrors,
  reviewedHandoffImages,
  reviewedImages,
  validateBenchmarkProfile
} from '../lib/image-gate.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBlobSha1=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const structuralChecks=()=>Object.fromEntries([
  'file_exists','file_integrity','format','dimensions','expected_path','clipping_corruption',
  'byte_uniqueness','story_identity','accessibility','asset_hash','git_blob_identity',
  'lock_state','replacement_identity'
].map(x=>[x,'pass']));
const benchmark=()=>Object.fromEntries([
  'professional_finish','meaningful_detail','explanatory_mechanism','annotation_richness',
  'visual_depth','hierarchy','composition','story_specificity','differentiation'
].map(x=>[x,'pass']));

function svg(label,{width=1200,height=630,accessible=true,closed=true}={}){
  const texts=Array.from({length:12},(_,i)=>'<text x="'+(20+i*10)+'" y="'+(30+i*20)+'">'+label+' '+i+'</text>').join('');
  return Buffer.from('<svg width="'+width+'" height="'+height+'" role="'+(accessible?'img':'presentation')+'" '+(accessible?'aria-label="'+label+'" ':'')+'xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#ffffff"/>'+texts+(closed?'</svg>':''));
}

function buildFixture({date='2026-09-26'}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-image-quality-'));
  const qualityPath='_records/image-quality/'+date+'-editorial.json',reviewPath='_records/editorial-handoff/final-image-review-'+date+'.json';
  const manifest={},stories=[],qualityImages=[];
  for(let i=0;i<6;i++){
    const storyId='story-'+(i+1),candidate='c'+(i+1),rel='briefs/images/'+date+'/0'+(i+1)+'-story.svg',alt='Detailed accessible story image '+(i+1)+' explaining a specific mechanism.';
    const bytes=svg('story '+(i+1)),hash=sha256(bytes),blob=gitBlobSha1(bytes);
    const requestPath='_records/image-context/'+date+'/'+candidate+'.json';
    const requestRaw=JSON.stringify({mode:'single_story',story_ids:[storyId],includes_edition_context:false,prompt:'Create a detailed textbook illustration for this one story only, with no edition or status artwork.'});
    fs.mkdirSync(path.dirname(path.join(root,requestPath)),{recursive:true});fs.writeFileSync(path.join(root,requestPath),requestRaw);
    fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),bytes);
    stories.push({story_id:storyId,image:{path:rel,alt,width:1200,height:630}});
    manifest[candidate]={
      path:rel,alt,width:1200,height:630,sha256:hash,git_blob_sha:blob,
      quality_accepted:true,generation_method:'openai_image_generation',visual_reviewed:true,
      accepted_locked:true,lock_status:'accepted_locked',story_id:storyId,
      cache_key:'cache-v1-'+(i+1),asset_version:'v1-'+(i+1),overall_gate:'pass',
      quality_evidence_path:qualityPath,quality_evidence_sha256:null
    };
    qualityImages.push({
      generation_context:{mode:'single_story',story_ids:[storyId],includes_edition_context:false,reviewed_subject_match:'pass',unrelated_status_artwork:false,request_path:requestPath,request_sha256:sha256(requestRaw)},
      story_id:storyId,asset_path:rel,asset_hash:hash,git_blob_sha:blob,
      cache_key:'cache-v1-'+(i+1),asset_version:'v1-'+(i+1),
      structural_gate:{result:'pass',checks:structuralChecks()},
      editorial_quality_gate:{
        result:'pass',benchmark_comparison:benchmark(),story_specificity:'pass',
        information_density:'pass',explanatory_mechanism:'pass',annotation_quality:'pass',
        depth_hierarchy:'pass',composition:'pass',generic_or_sparse:false,decorative_only:false,
        meaningful_components:Array.from({length:8},(_,n)=>'component-'+(i+1)+'-'+(n+1)),
        composition_signature:'composition-'+(i+1),
        layout_signature:'layout-'+(i%4),
        diagram_grammar:'grammar-'+(i%4),
        hierarchy_signature:'hierarchy-'+(i%4),
        annotation_pattern_signature:'annotation-'+(i%3),
        assessment:'Rendered benchmark comparison confirms professional finish, explanatory depth, annotations, hierarchy and story-specific information density.'
      },
      overall_gate:'pass',supersedes:null,deployment_verification_required:false
    });
  }
  const record={
    schema_version:'2.0.0',record_kind:'editorial_image_quality',edition_date:date,edition_id:'dab-edition-'+date,
    benchmark_profile:'sep09-sep10-premium3-v1',benchmark_profile_path:'_records/image-quality/benchmark-profile-v1.json',
    reviewed_at:'2026-09-26T12:00:00Z',review_method:'rendered visual benchmark comparison against locked September 9 and September 10 fixtures',
    review_status:'complete',
    set_review:{
      result:'pass',composition_differentiation:'pass',layout_differentiation:'pass',
      diagram_grammar_differentiation:'pass',information_hierarchy_differentiation:'pass',
      annotation_pattern_differentiation:'pass',
      assessment:'All six images use materially different compositions and explanatory structures while meeting the common textbook/editorial benchmark.'
    },
    images:qualityImages
  };
  const persist=()=>{
    fs.mkdirSync(path.dirname(path.join(root,qualityPath)),{recursive:true});
    const raw=JSON.stringify(record,null,2)+'\n';fs.writeFileSync(path.join(root,qualityPath),raw);
    const digest=sha256(Buffer.from(raw));for(const entry of Object.values(manifest))entry.quality_evidence_sha256=digest;
    fs.mkdirSync(path.dirname(path.join(root,reviewPath)),{recursive:true});fs.writeFileSync(path.join(root,reviewPath),JSON.stringify(manifest,null,2)+'\n');
  };
  persist();
  return {root,date,edition:{brief_date:date,edition_id:'dab-edition-'+date,stories},manifest,record,reviewPath,qualityPath,persist};
}

test('benchmark profile locks the accepted September 9 and September 10 fixture sets',()=>{
  const result=validateBenchmarkProfile(process.cwd());
  assert.equal(result.result,'pass');
  assert.deepEqual(result.errors,[]);
});

test('benchmark-quality image and differentiated six-image set pass both gates',()=>{
  const x=buildFixture(),result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.structural_gate.result,'pass');
  assert.equal(result.editorial_quality_gate.result,'pass');
  assert.equal(result.overall_gate.result,'pass');
});

test('structurally valid low-detail image fails editorial quality',()=>{
  const x=buildFixture();x.record.images[0].editorial_quality_gate.meaningful_components=['one','two','three'];x.persist();
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.equal(result.structural_gate.result,'pass');
  assert.equal(result.editorial_quality_gate.result,'fail');
  assert.ok(result.errors.some(e=>e.includes('information_density_below_benchmark')));
  assert.equal(result.overall_gate.result,'fail');
});

test('a cross-story generation context fails even when structural and visual scores pass',()=>{
  const x=buildFixture();x.record.images[0].generation_context.story_ids.push('other-story');x.persist();
  assert.ok(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors.some(e=>e.includes('image_context_not_isolated')));
});

test('unrelated status artwork fails the accepted story subject gate',()=>{
  const x=buildFixture();x.record.images[0].generation_context.unrelated_status_artwork=true;x.persist();
  assert.ok(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors.some(e=>e.includes('image_subject_mismatch')));
});

test('generic image with correct dimensions fails editorial quality',()=>{
  const x=buildFixture();x.record.images[0].editorial_quality_gate.generic_or_sparse=true;x.persist();
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.some(e=>e.includes('generic_or_sparse')));
  assert.equal(result.overall_gate.result,'fail');
});

test('same-template composition reuse across the six-image set fails',()=>{
  const x=buildFixture();for(const item of x.record.images)item.editorial_quality_gate.composition_signature='same-template';x.persist();
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.includes('quality_evidence_duplicate_composition_signature'));
});

test('wrong dimensions fail the structural gate',()=>{
  const x=buildFixture(),entry=x.manifest.c1;fs.writeFileSync(path.join(x.root,entry.path),svg('wrong dimensions',{width:1199}));
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.equal(result.structural_gate.result,'fail');
  assert.ok(result.errors.some(e=>e.includes('Invalid accepted handoff image canvas')));
});

test('clipped or corrupt image fails the structural gate',()=>{
  const x=buildFixture(),entry=x.manifest.c1;fs.writeFileSync(path.join(x.root,entry.path),svg('clipped',{closed:false}));
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.equal(result.structural_gate.result,'fail');
});

test('missing accessibility metadata fails the structural gate',()=>{
  const x=buildFixture(),entry=x.manifest.c1;fs.writeFileSync(path.join(x.root,entry.path),svg('no accessibility',{accessible:false}));
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.equal(result.structural_gate.result,'fail');
  assert.ok(result.errors.some(e=>e.includes('Invalid accepted handoff image canvas')));
});

test('missing editorial-quality evidence fails closed',()=>{
  const x=buildFixture();fs.unlinkSync(path.join(x.root,x.qualityPath));
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.includes('quality_evidence_missing_or_unreadable'));
  assert.equal(result.overall_gate.result,'fail');
});

test('unavailable editorial review fails closed',()=>{
  const x=buildFixture();x.record.review_status='unavailable';x.persist();
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.includes('quality_evidence_editorial_review_unavailable'));
});

test('replacement without new version hash and cache identity fails',()=>{
  const x=buildFixture(),item=x.record.images[0];
  item.supersedes={asset_path:item.asset_path,asset_hash:item.asset_hash,cache_key:item.cache_key,asset_version:item.asset_version};
  item.deployment_verification_required=false;x.persist();
  const result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.some(e=>e.includes('replacement_hash_must_change')));
  assert.ok(result.errors.some(e=>e.includes('replacement_cache_key_must_change')));
  assert.ok(result.errors.some(e=>e.includes('replacement_version_must_change')));
  assert.ok(result.errors.some(e=>e.includes('replacement_deployment_verification_required')));
});

test('deployed byte verification rejects stale or mismatched replacement bytes',()=>{
  const expected=[{url:'https://example.test/a',path:'a',sha256:'aaa'}];
  assert.deepEqual(deployedImageByteErrors(expected,[{url:'https://example.test/a',ok:true,sha256:'aaa'}]),[]);
  assert.deepEqual(deployedImageByteErrors(expected,[{url:'https://example.test/a',ok:true,sha256:'bbb'}]),['deployed_image_byte_mismatch:a']);
});

test('September 25 accepted historical image fixture remains valid without regeneration',()=>{
  const root=process.cwd(),edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-25.json','utf8'));
  const result=reviewedHandoffImages(edition,root,'_records/editorial-handoff/final-image-review-2026-09-25.json');
  assert.deepEqual(result.errors,[]);
  assert.equal(result.overall_gate.result,'pass');
});


test('production wiring preserves fail-closed policy and two-stage validation',()=>{
  const policy=JSON.parse(fs.readFileSync('_data/visual-renderer-policy.json','utf8'));
  assert.equal(policy.low_detail_fallback_allowed,false);
  assert.equal(policy.deterministic_png_enabled,false);
  assert.equal(policy.fallback,'professional_asset_only_fail_closed');
  const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
  assert.match(workflow,/--mode structural/);
  assert.match(workflow,/--mode combined/);
  const manifestLib=fs.readFileSync('_generator/lib/publication-manifest.mjs','utf8');
  assert.match(manifestLib,/image_quality_evidence/);
  assert.match(manifestLib,/publication_manifest_image_quality_dependency_missing/);
  const daily=fs.readFileSync('_tools/daily-validation.mjs','utf8');
  assert.match(daily,/live_image_bytes/);
  assert.match(daily,/deployedImageByteErrors/);
});


test('actual September 10 premium3 benchmark set remains accepted without regeneration',()=>{
  const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-10.json','utf8'));
  const result=reviewedImages(edition,process.cwd());
  assert.deepEqual(result.errors,[]);
  assert.equal(result.assets.length,6);
});

// Synthetic live-schema evidence exercises the production validator only. These
// fixture IDs/bytes are never saved to a real edition or claimed as native output.
function automatedFixture(){
  const x=buildFixture({date:'2026-09-28'}),receipts=[];
  const usage=()=>({work_invocations:0,codex_invocations:0,paid_model_api_calls:0});
  for(const [i,item] of x.record.images.entries()){
    const candidate='c'+(i+1),context=item.generation_context;
    const execution=buildImageGenerationExecution({story_id:item.story_id,candidate_id:candidate,headline:'Synthetic supported mechanism '+candidate,source_url:'https://example.com/'+candidate,
      verified_visual_facts:['Supported mechanism'],generic_conceptual_elements:['generic input'],prohibited_specifics:['invented benchmark'],visual_brief:'Professional white-background detailed single-story textbook diagram.',reference_policy:'Use source-supported specifics only.',acceptance_order:['subject','facts','structure','editorial'],wrong_subject_action:'Discard; generate a fresh request for the same story.',low_quality_fallback:false,allowed_image_text:['Input'],composition_mode:'annotated_system',prohibited_composition_patterns:['generic sparse title card']});
    const raw=JSON.stringify(execution,null,2)+'\n';fs.writeFileSync(path.join(x.root,context.request_path),raw);context.request_sha256=sha256(Buffer.from(raw));context.execution_policy=IMAGE_EXECUTION_POLICY;
    const receipt={schema_version:'2.0.0',policy_id:IMAGE_EXECUTION_POLICY,request_sha256:imageExecutionHash(execution),story_id:item.story_id,candidate_id:candidate,
      execution_mode:'production',evidence_type:'live',trigger:'scheduled',owner_interventions:[],runtime_context_isolation:'not_asserted',attempt:1,
      fallback_used:false,...usage(),account_billing_observed:false,status:'accepted_locked',
      generation:{executor:'native_chatgpt_image_generation',call_id:'SYNTHETIC-call-'+candidate,artifact_id:'SYNTHETIC-artifact-'+candidate,generated_at:'2026-09-28T21:00:00Z',raw_sha256:item.asset_hash,raw_capture:{path:'_records/image-attempts/synthetic/'+candidate+'.png',sha256:item.asset_hash,git_blob_sha:item.git_blob_sha,read_back_verified:true},evidence_type:'live',usage:usage(),owner_interventions:[]},
      review:{mode:'automated',phase:'after_generation',call_id:'SYNTHETIC-review-'+candidate,reviewed_at:'2026-09-28T21:01:00Z',asset_sha256:item.asset_hash,subject_match:'pass',factual_support:'pass',structural_quality:'pass',editorial_quality:'pass',usage:usage(),owner_interventions:[]},
      persistence:{path:item.asset_path,sha256:item.asset_hash,git_blob_sha:item.git_blob_sha,persisted_at:'2026-09-28T21:02:00Z',read_back_verified:true}};
    context.execution_receipt_path='_records/image-execution/'+candidate+'.json';receipts.push(receipt);
  }
  const persistReceipts=()=>{
    for(const [i,item] of x.record.images.entries()){
      const raw=JSON.stringify(receipts[i],null,2)+'\n',p=path.join(x.root,item.generation_context.execution_receipt_path);
      fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,raw);item.generation_context.execution_receipt_sha256=sha256(Buffer.from(raw));
    }x.persist();
  };
  persistReceipts();return {...x,receipts,persistReceipts};
}
test('new-edition production gate requires actual-execution schema in addition to image quality',()=>{
  const x=automatedFixture();assert.deepEqual(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors,[]);
});
test('new-edition gate cannot downgrade to legacy request by omitting policy',()=>{
  const x=buildFixture({date:'2026-09-28'}),result=reviewedHandoffImages(x.edition,x.root,x.reviewPath);
  assert.ok(result.errors.some(e=>e.includes('automated_image_execution_receipt_required')));assert.equal(result.overall_gate.result,'fail');
});
test('manual image upload fails the actual production combined gate',()=>{
  const x=automatedFixture();x.receipts[0].owner_interventions=['upload image'];x.persistReceipts();assert.ok(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors.some(e=>e.includes('manual_image_intervention_prohibited')));
});
test('fixture receipts cannot pass the actual production image gate',()=>{
  const x=automatedFixture();Object.assign(x.receipts[0],{evidence_type:'fixture',trigger:'fixture',status:'fixture_pass'});x.persistReceipts();assert.ok(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors.some(e=>e.includes('live_image_execution_evidence_required')));
});
test('changed execution receipt bytes fail even if image bytes remain valid',()=>{
  const x=automatedFixture(),context=x.record.images[0].generation_context;fs.appendFileSync(path.join(x.root,context.execution_receipt_path),' ');assert.ok(reviewedHandoffImages(x.edition,x.root,x.reviewPath).errors.some(e=>e.includes('automated_image_receipt_digest_mismatch')));
});
test('automated receipt does not bypass professional editorial quality review',()=>{
  const x=automatedFixture();x.record.images[0].editorial_quality_gate.generic_or_sparse=true;x.persist();assert.equal(reviewedHandoffImages(x.edition,x.root,x.reviewPath).overall_gate.result,'fail');
});
