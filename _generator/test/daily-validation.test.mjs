import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('deterministic daily validation can validate September 17 offline without a model',()=>{
 const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'dab-validation-')),'receipt.json');
 try{
  execFileSync(process.execPath,['_tools/daily-validation.mjs','--date','2026-09-17','--offline','--out',out],{cwd:process.cwd(),stdio:'pipe'});
  const receipt=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(receipt.date,'2026-09-17');assert.equal(receipt.model_calls,0);assert.equal(receipt.final_result,'pass');
  assert.equal(receipt.checks.find(x=>x.check_id==='publication_receipt').result,'pass');
  assert.equal(receipt.checks.find(x=>x.check_id==='command_center_access_contract').result,'pass');
  assert.equal(receipt.checks.find(x=>x.check_id==='command_center_owner_operations').result,'not_applicable');
  assert.equal(receipt.input_tokens,null);assert.equal(receipt.owner_observed_credits,null);
 }finally{fs.rmSync(path.dirname(out),{recursive:true,force:true});}
});


test('deterministic validation projects September 18 dynamic coverage without an AI repair pass',()=>{
 const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'dab-validation-')),'receipt.json');
 try{
  execFileSync(process.execPath,['_tools/daily-validation.mjs','--date','2026-09-18','--offline','--out',out],{cwd:process.cwd(),stdio:'pipe'});
  const receipt=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(receipt.model_calls,0);assert.equal(receipt.semantic_escalation_required,false);assert.equal(receipt.automatic_ai_recovery_runs,0);
  assert.equal(receipt.coverage.articles,6);assert.equal(receipt.coverage.podcasts,2);assert.equal(receipt.coverage.videos,0);assert.equal(receipt.coverage.included_items,8);assert.equal(receipt.coverage.potential_positions,10);
  assert.equal(receipt.domain_states.publication,'verified');assert.equal(receipt.domain_states.coverage,'degraded');assert.equal(receipt.domain_states.measurements,'credit_target_unverified');
 }finally{fs.rmSync(path.dirname(out),{recursive:true,force:true});}
});
