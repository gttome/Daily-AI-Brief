import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('continuous qualification contract preserves production and requires zero paid execution',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const p=JSON.parse(fs.readFileSync('docs/operations/efficiency-operating-policy.json','utf8'));
  const r=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
  assert.equal(c.contract_id,'continuous-qualification-v1');
  assert.equal(c.cadence.max_full_semantic_qualification_runs_per_chicago_day,4);
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
