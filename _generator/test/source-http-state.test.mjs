import test from 'node:test';
import assert from 'node:assert/strict';
import {classifySourceHttpState} from '../lib/source-http-state.mjs';

test('source HTTP state passes when all selected sources resolve',()=>{
  const r=classifySourceHttpState([{url:'https://example.test',status:200,ok:true}]);
  assert.equal(r.result,'pass');
  assert.equal(r.severity,'high');
});

test('source HTTP state warns on transient 429 without hiding it',()=>{
  const r=classifySourceHttpState([{url:'https://example.test',status:429,ok:false,resolved_url:'https://example.test/rate-limit'}]);
  assert.equal(r.result,'warn');
  assert.equal(r.severity,'medium');
  assert.match(r.evidence,/429/);
  assert.match(r.evidence,/nonblocking_postpublication_reachability_warning/);
});

test('source HTTP state still fails on a hard 404',()=>{
  const r=classifySourceHttpState([{url:'https://example.test/missing',status:404,ok:false}]);
  assert.equal(r.result,'fail');
  assert.equal(r.severity,'high');
  assert.match(r.evidence,/404/);
});

test('hard failures remain blocking even when a transient failure also exists',()=>{
  const r=classifySourceHttpState([
    {url:'https://example.test/rate',status:429,ok:false},
    {url:'https://example.test/missing',status:404,ok:false}
  ]);
  assert.equal(r.result,'fail');
  assert.match(r.evidence,/hard_failures/);
  assert.match(r.evidence,/transient_failures/);
});
