import test from 'node:test';
import assert from 'node:assert/strict';
import {readerOrderedStories} from '../lib/render.mjs';
import {evidenceViews,RESEARCH_CAPSULE_CHAR_BUDGET,WORK_CONTEXT_CHAR_BUDGET} from '../lib/production-run.mjs';

const canonical=[
 {ordinal:1,focus:'technical_ai_engineering',headline:'T1'},
 {ordinal:2,focus:'technical_ai_engineering',headline:'T2'},
 {ordinal:3,focus:'applied_genai_knowledge_workers',headline:'K1'},
 {ordinal:4,focus:'applied_genai_knowledge_workers',headline:'K2'},
 {ordinal:5,focus:'agents_non_technical_people',headline:'N1'},
 {ordinal:6,focus:'agents_non_technical_people',headline:'N2'}
];

test('September 17 historical presentation is unchanged',()=>{
 const result=readerOrderedStories(canonical,'2026-09-17');
 assert.equal(result,canonical);
 assert.deepEqual(result.map(x=>x.headline),['T1','T2','K1','K2','N1','N2']);
});

test('new editions present nontechnical then knowledge-worker then technical stories without mutating canonical order',()=>{
 const snapshot=structuredClone(canonical);
 const result=readerOrderedStories(canonical,'2026-09-18');
 assert.deepEqual(result.map(x=>x.headline),['N1','N2','K1','K2','T1','T2']);
 assert.deepEqual(canonical,snapshot);
 assert.deepEqual(canonical.map(x=>x.ordinal),[1,2,3,4,5,6]);
});

test('normal Work context omits exact source excerpts and enforces compact budgets',()=>{
 const packets=Array.from({length:9},(_,i)=>({
  candidate_id:'c'+i,headline:'Candidate '+i,publisher:'Publisher',canonical_url:'https://example.org/'+i,
  source_content_hash:'hash'+i,verification_status:'reviewed',category:canonical[i%6].focus,published_at:'2026-09-17T10:00:00Z',
  source_reliability:'publisher_authored',freshness_tier:'primary',freshness_age_hours:2,novelty_status:'pass',confidence:'high',agent_skill_relevance:i===0,
  verified_claims:[{claim:'Verified compact fact '+i,evidence:'Long exact source excerpt '+i+' that stays out of normal Work context.'}],
  limitations:['One limitation'],availability:'available',why_it_matters:'Material operational implication.'
 }));
 const {views,telemetry}=evidenceViews(packets);
 const work=JSON.stringify(views.editorial),capsule=JSON.stringify(views.research_capsule);
 assert.ok(telemetry.research_capsule_chars<=RESEARCH_CAPSULE_CHAR_BUDGET);
 assert.ok(telemetry.work_context_chars<=WORK_CONTEXT_CHAR_BUDGET);
 assert.ok(capsule.includes('Verified compact fact 0'));
 assert.ok(!work.includes('Long exact source excerpt'));
 assert.ok(JSON.stringify(views.editorial_qa).includes('Long exact source excerpt 0'));
});
