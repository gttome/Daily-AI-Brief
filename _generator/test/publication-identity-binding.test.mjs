import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/daily-delta-validation.yml','utf8');

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
