import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const post=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
const delta=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');

test('both post-editorial promotion paths require a durable validated-publication bridge',()=>{
  assert.equal(post.split('Durable validated-publication event is required on the exact candidate before protected promotion.').length-1,2);
  assert.match(post,/baseline_main_sha===manifest\.baseline_sha/);
});

test('delta recovery reconstructs a missing bridge only from exact protected identities',()=>{
  for(const proof of ['exact_publication_pr_not_found','exact_candidate_ci_pass_not_found','publication_merge_sha:process.env.EXPECTED_SHA','recovery_basis:\'exact_pr_candidate_ci_merge_manifest_and_frozen_bundle_evidence\'']){
    assert.ok(delta.includes(proof),`missing protected recovery proof: ${proof}`);
  }
  assert.match(delta,/GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(delta,/merge-base','--is-ancestor',expectedSha,mainSha/);
  assert.match(delta,/Current main changed reader publication paths/);
  assert.match(delta,/manifest\.staging_ref/);
  assert.match(delta,/expectedSha=merged\?\.merge_commit_sha\|\|context\.payload\.workflow_run\.head_sha/);
  assert.match(delta,/pointer\.active!==true\|\|pointer\.terminal===true/);
  assert.match(delta,/_records\/editorial\/\$\{pointer\.execution_key\}\/task19-bundle-seal\.json/);
});
