import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExactPublicationPreflightReceipt,classifyPublicationPreflightError,
  validateExactPublicationPreflightReceipt
} from '../lib/exact-publication-preflight.mjs';

const base={
  edition_id:'dab-edition-2099-01-01',edition_date:'2099-01-01',
  candidate_content_digest:'sha256:'+'a'.repeat(64),
  expected_deployment_routes:[
    '/','/latest/','/briefs/2099-01-01/','/archive/','/feed.json','/feed.xml',
    '/stories/2099-01-01/a/','/stories/2099-01-01/b/','/stories/2099-01-01/c/',
    '/stories/2099-01-01/d/','/stories/2099-01-01/e/','/stories/2099-01-01/f/'
  ],
  checked_at:'2099-01-01T03:00:00Z'
};
const readerPass={result:'PASS',errors:[]};

test('passing exact candidate preflight is deterministic, pre-PR and uses zero model calls',()=>{
  const r=buildExactPublicationPreflightReceipt({...base,manifest_errors:[],candidate_errors:[],reader_result:readerPass});
  assert.equal(r.result,'PASS');
  assert.equal(r.model_calls,0);
  assert.equal(r.publication_pr_opened,false);
  assert.deepEqual(validateExactPublicationPreflightReceipt(r),[]);
});

const regressions=[
  ['publication manifest compatibility','publication_manifest_media_receipt_invalid','publication_manifest_compatibility'],
  ['reader projection contract','reader:dated:canonical_mismatch:briefs/2099-01-01.md','reader_projection_contract'],
  ['integrated locked image canvas','image_canvas_invalid:dab-story','locked_image_canvas_integration'],
  ['frozen contract migration boundary','publication_manifest_frozen_migration_boundary_invalid','publication_manifest_compatibility'],
  ['historical edition independence','current_edition_pointer_invalid_for_candidate','historical_edition_independence'],
  ['complete deterministic projection set','required_derived_file_missing:feed.xml','deterministic_projection_set']
];

for(const [label,error,expectedClass] of regressions){
  test('October 5 Task 23 regression fixture stops pre-PR: '+label,()=>{
    assert.equal(classifyPublicationPreflightError(error),expectedClass);
    const r=buildExactPublicationPreflightReceipt({
      ...base,manifest_errors:error.startsWith('publication_manifest_')?[error]:[],
      candidate_errors:error.startsWith('publication_manifest_')?[]:[error],
      reader_result:readerPass
    });
    assert.equal(r.result,'FAIL');
    assert.ok(r.failure_classes.includes(expectedClass));
    assert.equal(r.publication_pr_opened,false);
    assert.equal(r.model_calls,0);
  });
}
