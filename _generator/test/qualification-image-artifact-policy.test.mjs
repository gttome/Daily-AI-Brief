import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('Q10 image artifact policy preserves isolation and fails closed',()=>{
 const p=JSON.parse(fs.readFileSync('docs/operations/qualification-image-artifact-handoff.json','utf8'));
 assert.equal(p.contract_id,'qualification-image-artifact-handoff-v1');
 assert.equal(p.generation.dedicated_image_only_worker_required,true);
 assert.equal(p.generation.exact_binary_capture_before_worker_context_exit,true);
 assert.equal(p.transport.accepted_promotion_must_reuse_same_git_blob_sha,true);
 assert.equal(p.review.separate_reviewer_required,true);
 assert.equal(p.review.six_unique_exact_binaries_required,true);
 assert.equal(p.failure.missing_or_mismatched_artifact,'fail_closed');
 assert.equal(p.safety.production_mutation,false);
 assert.equal(p.safety.work_usage,0);
 assert.equal(p.safety.codex_usage,0);
 assert.equal(p.safety.paid_api_usage,0);
});
