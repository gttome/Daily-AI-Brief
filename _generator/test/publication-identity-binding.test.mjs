import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');
const promotionWorkflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');

test('completion persistence preserves the exact validated PR, candidate, merge and successful protected CI identities',()=>{
  assert.match(workflow,/read_publication_field pr_number/);
  assert.match(workflow,/read_publication_field candidate_sha/);
  assert.match(workflow,/read_publication_field publication_merge_sha/);
  assert.match(workflow,/read_publication_field ci_run_id/);
  assert.match(workflow,/actual_candidate_sha.*candidate_sha/);
  assert.match(workflow,/actual_merge_sha.*publication_merge_sha/);
  assert.match(workflow,/actual_ci_sha.*candidate_sha/);
  assert.doesNotMatch(workflow,/commits\/\$EXPECTED_SHA\/pulls/);
});

test('publication merge gate must read protected host READY and same-run publication_authorized at merge time',()=>{
  assert.equal((promotionWorkflow.match(/Merge-time publication authorization gate\./g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/pointer\.publication_authorized!==true/g)||[]).length,2);
});

test('both autonomous publication promotion paths require protected same-run publication_authorized and image_tasks_authorized immediately before merge',()=>{
  assert.equal((promotionWorkflow.match(/pointer\.publication_authorized!==true/g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/pointer\.image_tasks_authorized!==true/g)||[]).length,2);
});

test('both autonomous publication promotion paths require protected unattended host READY with bound qualification receipt',()=>{
  assert.equal((promotionWorkflow.match(/host\.status!=='READY'/g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/host\.qualification_receipt\?\.blob_sha/g)||[]).length,2);
});

test('publication promotion keeps pre-merge and post-merge manifests in distinct bindings',()=>{
  assert.match(promotionWorkflow,/const mergedManifest=JSON\.parse/);
  assert.match(promotionWorkflow,/date:mergedManifest\.edition_date/);
  assert.doesNotMatch(promotionWorkflow,/const manifest=JSON\.parse\(Buffer\.from\(manifestResponse/);
});
