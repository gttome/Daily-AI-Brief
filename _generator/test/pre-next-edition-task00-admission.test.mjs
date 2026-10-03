import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateRunReadiness} from '../lib/run-readiness.mjs';
import {parseLearningJsonl,reconcileImprovementKanban} from '../lib/improvement-kanban.mjs';

const receipt=JSON.parse(fs.readFileSync('_records/hardening/pre-next-edition-task00-admission-2026-10-03.json','utf8'));

test('non-production admission proof is bound to protected main and performs no early allocation',()=>{
  assert.match(receipt.protected_main_sha,/^[a-f0-9]{40}$/);
  assert.notEqual(receipt.protected_main_sha,'0'.repeat(40));
  assert.equal(receipt.mode,'NON_PRODUCTION_ADMISSION_PROOF');
  assert.equal(receipt.production_allocation_performed,false);
  const active=JSON.parse(fs.readFileSync('data/operations/active-production-run.json','utf8'));
  assert.equal(active.active,false);
  assert.equal(active.terminal,true);
});

test('actual Task 00 readiness input passes full-production admission',()=>{
  const result=validateRunReadiness(receipt.readiness_input);
  assert.equal(result.result,'PASS');
  assert.equal(result.start_authorized,true);
  assert.equal(result.start_scope,'full_production');
  assert.equal(result.image_tasks_authorized,true);
  assert.equal(result.publication_authorized,true);
  assert.deepEqual(result.errors,[]);
});

test('learning ledger has no unresolved problem missing from Improvement Kanban',()=>{
  const events=parseLearningJsonl(fs.readFileSync('data/operations/production-continuous-improvement-ledger.jsonl','utf8'));
  const board=JSON.parse(fs.readFileSync('data/operations/improvement-kanban.json','utf8'));
  const reconciled=reconcileImprovementKanban(board,events);
  assert.equal(reconciled.reconciliation.missing_problem_count,0);
});

test('current startup is generic and the observed controller starts the next edition at 19:00 CT',()=>{
  const startup=fs.readFileSync('docs/operations/DAILY-UNATTENDED-STARTUP.md','utf8');
  assert.doesNotMatch(startup,/\bRun\s+\d+\b|\brun\d+\b|reliable-edition-\d/i);
  assert.ok(startup.includes('19:00 America/Chicago'));
  assert.ok(startup.includes('next America/Chicago calendar day'));
  const controller=receipt.scheduler_observation.controller;
  assert.equal(controller.enabled,true);
  assert.equal(controller.generic_instruction_verified,true);
  assert.equal(controller.targets_next_local_calendar_day,true);
  assert.match(controller.schedule,/BYHOUR=19;BYMINUTE=0;BYSECOND=0/);
  assert.equal(receipt.authorization.early_allocation_prohibited,true);
});

test('historical admission proof remains valid while current image consumer is the equivalent Watchdog pool',()=>{
  const host=JSON.parse(fs.readFileSync('docs/operations/unattended-image-host.json','utf8'));
  assert.equal(host.status,'READY');
  assert.equal(host.reusable_consumer_pool.enabled,true);
  assert.equal(host.reusable_consumer_pool.scheduler_kind,'chatgpt_watchdog_ring');
  assert.equal(host.reusable_consumer_pool.all_slots_equivalent,true);
  assert.deepEqual(host.reusable_consumer_pool.slot_ids,['A','B','C','D','E','F']);
  assert.equal(host.reusable_consumer_pool.automation_ids.length,6);
  assert.ok(host.reusable_consumer_pool.automation_ids.includes(receipt.scheduler_observation.recovery.automation_id));
  assert.equal(receipt.scheduler_observation.recovery.enabled,true);
  assert.equal(receipt.scheduler_observation.recovery.generic_instruction_verified,true);
});
