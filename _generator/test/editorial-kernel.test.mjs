import test from 'node:test';
import assert from 'node:assert/strict';
import {assertEditorialKernel,deterministicOwnership,expandEditorialKernel,kernelReceipt,validateEditorialKernel} from '../lib/editorial-kernel.mjs';

const focuses=['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'];
const kernel={schema_version:'1.0.0',brief_date:'2026-09-18',edition_id:'dab-edition-2026-09-18',baseline_sha:'1'.repeat(40),normal_model_passes:1,normal_post_editorial_model_passes:0,editorial_takeaway:'Use verified evidence and deterministic execution so expensive reasoning is reserved for editorial judgment.',stories:focuses.map((focus,i)=>({canonical_ordinal:i+1,story_id:`semantic-story-${i+1}`,candidate_id:`candidate-${i+1}`,focus,headline:`A substantive verified headline ${i+1}`,summary:'A sufficiently detailed summary of the verified development and the mechanism that matters to readers.',why_it_matters:'This explains the practical consequence for knowledge work, implementation, reliability, or adoption decisions.',what_to_do_now:{action:'test',label:'Test the bounded workflow',rationale:'Apply the evidence to a bounded workflow and verify the operational result before expanding the change.'},topic_labels:['agents','evidence'],editorial_limitation:'Current evidence supports the stated mechanism but should not be generalized beyond the verified scope.',source_url:`https://example.org/story-${i+1}`,agent_skill:i===4,visual:{layout:'process',mechanism:'Evidence moves through verification and controlled execution.'}})),media_decisions:{videos:{target:2},podcasts:{target:2}},changed_watchlist_topics:['topic-a']};

test('canonical editorial kernel enforces one semantic pass, six stories, 2/2/2 and one Agent Skills story',()=>{
 assert.deepEqual(validateEditorialKernel(kernel),[]);assert.equal(assertEditorialKernel(kernel),kernel);
 const receipt=kernelReceipt(kernel);assert.equal(receipt.story_count,6);assert.equal(receipt.agent_skill_stories,1);assert.equal(receipt.normal_model_passes,1);assert.equal(receipt.normal_post_editorial_model_passes,0);assert.equal(receipt.deterministic_handoff_ready,true);assert.match(receipt.kernel_sha256,/^[a-f0-9]{64}$/);
});

test('kernel rejects a second whole-edition model pass and allocation drift',()=>{
 const bad=structuredClone(kernel);bad.normal_post_editorial_model_passes=1;bad.stories[1].focus='agents_non_technical_people';
 const errors=validateEditorialKernel(bad);assert.ok(errors.includes('normal_post_editorial_model_passes_must_equal_zero'));assert.ok(errors.some(x=>x.startsWith('allocation_must_be_two:')));
});

test('kernel rejects duplicate candidate selection and missing exact Agent Skills requirement',()=>{
 const bad=structuredClone(kernel);bad.stories[1].candidate_id=bad.stories[0].candidate_id;bad.stories[4].agent_skill=false;
 const errors=validateEditorialKernel(bad);assert.ok(errors.includes('unique_candidate_id_required:2'));assert.ok(errors.includes('exactly_one_agent_skill_story_required'));
});

test('deterministic expansion owns ids slugs URLs source metadata image metadata and social derivatives',()=>{
 const candidateFacts={},imageAssets={};
 for(let i=0;i<6;i++){
  candidateFacts[`candidate-${i+1}`]={event_date:'2026-09-17',companies:['Example AI'],source:{title:`Source ${i+1}`,organization:'Example AI',url:`https://example.org/story-${i+1}`,publication_date:'2026-09-17',evidence_type:'official_announcement',availability_status:'general_availability'},novelty:{disposition:'new',prior_story_ids:[],what_changed:null},selection_rationale:'Highest qualifying candidate in its approved category.'};
  imageAssets[`candidate-${i+1}`]={path:`briefs/images/2026-09-18/0${i+1}-story.png`,alt:`Detailed textbook diagram for story ${i+1} showing the verified mechanism and its controls.`,width:1200,height:630,kind:'editorial_explainer',cache_key:'20260918'};
 }
 const edition=expandEditorialKernel(kernel,{candidateFacts,imageAssets,publishedAt:'2026-09-18T12:00:00Z',coveragePeriod:'Rolling 24-hour primary window ending September 18, 2026 at 07:00 America/Chicago.'});
 assert.equal(edition.status,'staged');assert.equal(edition.stories.length,6);assert.match(edition.stories[0].story_id,/^dab-story-2026-09-18-[0-9a-f]{8}$/);assert.equal(edition.stories[0].ordinal,1);assert.equal(edition.stories[0].permanent_url,'/stories/2026-09-18/a-substantive-verified-headline-1/');assert.equal(edition.stories[0].source.organization,'Example AI');assert.match(edition.stories[0].image.public_url,/0[1]-story\.png\?v=20260918$/);assert.equal(edition.stories[0].social.title,kernel.stories[0].headline);assert.equal(edition.worth_watching.general.status,'empty');
});

test('deterministic ownership keeps editorial semantics in the kernel and derived publication mechanics in code',()=>{
 const ownership=deterministicOwnership();assert.ok(ownership.owned_by_code.includes('archive_and_feed_derivatives'));assert.ok(ownership.owned_by_code.includes('completion_receipt'));assert.ok(ownership.owned_by_editorial_kernel.includes('story_selection'));assert.match(ownership.rule,/normal Work processing ends/);
});
