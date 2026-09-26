import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('continuous qualification contract preserves production and requires zero paid execution',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const p=JSON.parse(fs.readFileSync('docs/operations/efficiency-operating-policy.json','utf8'));
  const r=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
  assert.equal(c.contract_id,'continuous-qualification-v1');
  assert.ok(c.cadence.max_full_semantic_qualification_runs_per_chicago_day>=20);
  assert.equal(c.cadence.target_consecutive_full_passes,5);
  assert.ok(c.cadence.minimum_distinct_fresh_evidence_cutoffs_in_streak>=3);
  assert.equal(c.cost_boundary.work_usage_required,0);
  assert.equal(c.cost_boundary.codex_usage_required,0);
  assert.equal(c.cost_boundary.paid_api_usage_required,0);
  assert.equal(c.production_invariants.production_main_mutation,false);
  assert.equal(c.production_invariants.production_publication_pr,false);
  assert.equal(c.production_invariants.production_pages_deployment,false);
  assert.equal(c.pass_criteria.owner_manual_github_ui_actions,0);
  assert.equal(c.book_series_diversity.minimum_distinct_books_in_reference_catalog,4);
  assert.equal(c.book_series_diversity.forced_daily_rotation,false);
  assert.equal(p.continuous_qualification.contract_path,'docs/operations/continuous-qualification-contract.json');
  assert.equal(p.continuous_qualification.work_usage_allowed,false);
  assert.equal(p.continuous_qualification.codex_usage_allowed,false);
  assert.equal(p.continuous_qualification.paid_api_usage_allowed,false);
  assert.equal(r.qualification_stabilization.semantic_executor,'ordinary_chatgpt');
  assert.equal(r.qualification_stabilization.production_mutation,false);
});


test('qualification novelty baseline excludes same-day production and Q-run history',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const n=c.qualification_novelty_baseline;
  assert.equal(n.production_history_cutoff,'strictly_before_edition_date');
  assert.equal(n.exclude_real_same_day_production,true);
  assert.equal(n.exclude_all_qualification_runs,true);
  assert.equal(n.production_history_mutation,false);
});


test('qualification image execution is isolated before generation',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const i=c.image_execution_isolation;
  assert.equal(i.packet_per_story,true);
  assert.equal(i.exactly_one_story_id_per_packet,true);
  assert.equal(i.exactly_one_candidate_id_per_packet,true);
  assert.equal(i.exclude_other_story_prompts,true);
  assert.equal(i.exclude_edition_status_art,true);
  assert.equal(i.rejected_wrong_subject_must_start_fresh_request,true);
  assert.equal(i.rejected_wrong_subject_must_not_be_edited_or_reused,true);
  assert.equal(i.receipt_required_per_story,true);
  assert.equal(i.low_quality_fallback,false);
});


test('qualification run identity supports scalable independently pausable slots',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  assert.equal(c.run_identity.minimum_supported_slots_per_day,20);
  assert.equal(c.run_identity.maximum_supported_slot_number,40);
  assert.equal(c.schedule_separation.independently_pauseable,true);
  assert.equal(c.schedule_separation.dynamic_slot_addition_allowed,true);
});
