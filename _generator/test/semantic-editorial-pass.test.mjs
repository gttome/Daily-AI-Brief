import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeAdditionalSemanticPass,buildSemanticEditorialPassReceipt,markSemanticResultReused,
  semanticEditorialReuseDecision,validateSemanticEditorialPassReceipt
} from '../lib/semantic-editorial-pass.mjs';

const focuses=['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'];
const kernel={
  schema_version:'1.0.0',brief_date:'2099-01-01',edition_id:'dab-edition-2099-01-01',
  baseline_sha:'1'.repeat(40),normal_model_passes:1,normal_post_editorial_model_passes:0,
  editorial_takeaway:'Use one bounded semantic editorial pass and reuse it through deterministic downstream repair.',
  stories:focuses.map((focus,i)=>({
    canonical_ordinal:i+1,story_id:'semantic-story-'+(i+1),candidate_id:'candidate-'+(i+1),focus,
    headline:'Substantive verified headline '+(i+1),
    summary:'A sufficiently detailed summary of the verified development and the mechanism that matters to readers.',
    why_it_matters:'This explains the practical consequence for knowledge work, implementation, reliability, or adoption decisions.',
    what_to_do_now:{action:'test',label:'Test the bounded workflow',rationale:'Apply the evidence to a bounded workflow and verify the operational result before expanding the change.'},
    topic_labels:['agents','evidence'],editorial_limitation:'Evidence supports the stated mechanism within the verified scope.',
    source_url:'https://example.org/story-'+(i+1),agent_skill:i===4,
    visual:{layout:'process',mechanism:'Evidence moves through verification and controlled execution.'}
  })),
  media_decisions:{videos:{target:2},podcasts:{target:2}},changed_watchlist_topics:['topic-a']
};
const firstDigest='sha256:'+'a'.repeat(64);

test('normal editorial path records exactly one semantic pass and zero post-editorial semantic validators',()=>{
  const r=buildSemanticEditorialPassReceipt({
    execution_id:'reliable-edition-20990101-run1',edition_id:kernel.edition_id,
    evidence_digest:firstDigest,kernel,performed_at:'2099-01-01T01:00:00Z'
  });
  assert.deepEqual(validateSemanticEditorialPassReceipt(r),[]);
  assert.equal(r.editorial_semantic_passes,1);
  assert.equal(r.post_editorial_semantic_validation_passes,0);
  assert.equal(r.additional_semantic_pass_reason,null);
});

test('downstream deterministic repair reuses unchanged semantic result without another pass',()=>{
  const r=buildSemanticEditorialPassReceipt({
    execution_id:'reliable-edition-20990101-run1',edition_id:kernel.edition_id,
    evidence_digest:firstDigest,kernel,performed_at:'2099-01-01T01:00:00Z'
  });
  const decision=semanticEditorialReuseDecision(r,{evidence_digest:firstDigest});
  assert.equal(decision.reuse,true);
  const reused=markSemanticResultReused(r,{evidence_digest:firstDigest});
  assert.equal(reused.editorial_semantic_passes,1);
  assert.equal(reused.later_repair_reused_semantic_result,true);
});

test('a second semantic pass is illegal unless the semantic input digest actually changed and the reason is durable',()=>{
  const r=buildSemanticEditorialPassReceipt({
    execution_id:'reliable-edition-20990101-run1',edition_id:kernel.edition_id,
    evidence_digest:firstDigest,kernel,performed_at:'2099-01-01T01:00:00Z'
  });
  assert.throws(()=>authorizeAdditionalSemanticPass(r,{new_evidence_digest:firstDigest,reason:'retry'}),/changed_evidence_digest/);
  const changed=authorizeAdditionalSemanticPass(r,{
    new_evidence_digest:'sha256:'+'b'.repeat(64),
    reason:'Authoritative evidence changed and invalidated the prior semantic input.',
    performed_at:'2099-01-01T02:00:00Z'
  });
  assert.equal(changed.editorial_semantic_passes,2);
  assert.equal(changed.semantic_input_invalidated,true);
  assert.deepEqual(validateSemanticEditorialPassReceipt(changed),[]);
});
