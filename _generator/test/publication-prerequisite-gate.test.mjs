import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPublicationPrerequisiteGate,validatePublicationPrerequisiteGate,publicationPrDecision,PUBLICATION_PREREQUISITE_CHECKS} from '../lib/publication-prerequisite-gate.mjs';

const routes=['/','/latest/','/briefs/2099-01-01/','/archive/','/feed.json','/feed.xml',
  ...['a','b','c','d','e','f'].map(x=>'/stories/2099-01-01/'+x+'/')];
const base=()=>{
  const checks=Object.fromEntries(PUBLICATION_PREREQUISITE_CHECKS.map(x=>[x,true]));
  return {edition_id:'dab-edition-2099-01-01',execution_id:'run-2099',branch:'reliable-edition/dab-edition-2099-01-01-run1',
    candidate_sha:'a'.repeat(40),candidate_content_digest:'sha256:'+'b'.repeat(64),baseline_main_sha:'c'.repeat(40),
    checks,errors_by_check:{},expected_deployment_routes:routes,checked_at:'2099-01-01T03:00:00Z'};
};

test('clean exact candidate passes pre-PR with zero model/Work/API calls',()=>{
  const r=buildPublicationPrerequisiteGate(base());
  assert.equal(r.result,'PASS');assert.equal(r.publication_pr_opened,false);assert.equal(r.candidate_frozen,true);
  assert.equal(r.model_calls,0);assert.equal(r.work_invocations,0);assert.equal(r.codex_invocations,0);assert.equal(r.paid_model_api_calls,0);
  assert.deepEqual(validatePublicationPrerequisiteGate(r),[]);
  assert.equal(publicationPrDecision(r,[]).action,'OPEN_EXACTLY_ONE_PROTECTED_PUBLICATION_PR');
});

const injected=[
 ['wrong Watchlist projection','watchlist_projection','watchlist_public_projection_mismatch'],
 ['missing learning event','operational_learning_input','learning_required_event_missing'],
 ['ledger schema mismatch','operational_learning_input','learning_ledger_schema_mismatch'],
 ['stale protected-main ancestry','protected_main_ancestry','stale_protected_main_ancestry'],
 ['changed accepted image','accepted_image_immutability','accepted_image_sha_changed:m01'],
 ['missing route','archive_feed_routes','required_route_missing:feed.xml'],
 ['manifest digest mismatch','sealed_artifact_digests','manifest_artifact_digest_mismatch:kernel'],
 ['reader semantic mismatch','reader_projection','reader_semantic_mismatch'],
 ['archive/feed mismatch','archive_feed_routes','archive_feed_mismatch'],
 ['candidate identity mismatch','candidate_identity','candidate_manifest_identity_mismatch']
];
for(const [label,check,error] of injected)test(label+' prevents publication PR creation',()=>{
  const x=base();x.checks[check]=false;x.errors_by_check[check]=[error];
  if(check==='candidate_frozen')x.checks.candidate_frozen=false;
  else {x.checks.candidate_frozen=false;x.errors_by_check.candidate_frozen=['candidate_not_freezable'];}
  const r=buildPublicationPrerequisiteGate(x),decision=publicationPrDecision(r,[]);
  assert.equal(r.result,'FAIL');assert.equal(r.publication_pr_opened,false);
  assert.equal(decision.allowed,false);assert.equal(decision.action,'DO_NOT_OPEN_PUBLICATION_PR');
  assert.ok(r.errors.includes(error));
});

test('duplicate invocation reuses one exact candidate PR and rejects duplicates',()=>{
  const r=buildPublicationPrerequisiteGate(base());
  assert.equal(publicationPrDecision(r,[{number:7,candidate_sha:r.candidate_sha}]).action,'REUSE_EXACT_PUBLICATION_PR');
  assert.equal(publicationPrDecision(r,[{number:7,candidate_sha:r.candidate_sha},{number:8,candidate_sha:r.candidate_sha}]).action,'FAIL_CLOSED');
});

test('workflow orders prerequisite gate before PR creation',()=>{
  const y=fs.readFileSync('.github/workflows/publish-candidate.yml','utf8');
  const gate=y.indexOf('Bind all Task 23 prerequisites before publication PR');
  const open=y.indexOf('Open one reviewable publication PR');
  assert.ok(gate>0&&open>gate);
  assert.match(y,/publication-prerequisite-gate\.mjs _candidate_site/);
});
