import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');
const promotionWorkflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');

test('completion persistence preserves exact validated publication identity',()=>{
  assert.match(workflow,/read_publication_field pr_number/);
  assert.match(workflow,/read_publication_field candidate_sha/);
  assert.match(workflow,/read_publication_field publication_merge_sha/);
  assert.match(workflow,/read_publication_field ci_run_id/);
  assert.match(workflow,/actual_candidate_sha.*candidate_sha/);
  assert.match(workflow,/actual_merge_sha.*publication_merge_sha/);
  assert.match(workflow,/actual_ci_sha.*candidate_sha/);
  assert.doesNotMatch(workflow,/commits\/\$EXPECTED_SHA\/pulls/);
});

test('both autonomous promotion paths fail closed on protected run and host authorization',()=>{
  assert.equal((promotionWorkflow.match(/Merge-time publication authorization gate\./g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/pointer\.publication_authorized!==true/g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/pointer\.image_tasks_authorized!==true/g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/host\.status!=='READY'/g)||[]).length,2);
  assert.equal((promotionWorkflow.match(/host\.qualification_receipt\?\.blob_sha/g)||[]).length,2);
});
