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


test('qualification images require a dedicated image-only worker context',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const w=c.image_worker_isolation;
  assert.equal(w.dedicated_worker_required,true);
  assert.equal(w.input_exactly_one_story_packet,true);
  assert.equal(w.operational_context_prohibited,true);
  assert.equal(w.worker_prompt_must_not_contain_run_id,true);
  assert.equal(w.worker_prompt_must_not_contain_q_number,true);
  assert.equal(w.wrong_subject_retry_requires_new_worker_context,true);
  assert.equal(w.same_worker_retry_prohibited_after_subject_mismatch,true);
  assert.equal(w.max_wrong_subject_attempts_per_story_before_run_fail,2);
});


test('qualification image packets require factual-support allowlists',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const x=c.image_factual_support;
  assert.equal(x.direct_source_support_required_for_specific_labels,true);
  assert.equal(x.source_phrase_allowlist_required,true);
  assert.equal(x.generic_conceptual_elements_allowed,true);
  assert.equal(x.generic_elements_must_not_imply_product_fact,true);
  assert.deepEqual(x.image_packet_required_fields,['verified_visual_facts','generic_conceptual_elements','prohibited_specifics']);
  assert.equal(x.max_factual_support_failures_per_story_before_run_fail,2);
});


test('qualification scheduling is sequential and future Q runs are not clock-prescheduled',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const s=c.schedule_separation;
  assert.equal(s.maximum_concurrent_nonterminal_q_runs,1);
  assert.equal(s.future_q_clock_prescheduling,false);
  assert.equal(s.next_q_requires_previous_terminal,true);
  assert.equal(s.next_q_requires_failure_repair_merged_when_applicable,true);
  assert.ok(s.reserve_slot_capacity_target>=20);
});

test('qualification source supply can continue beyond normal acquisition budget without exceeding absolute budget',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const s=c.qualification_source_supply_acquisition;
  assert.equal(s.qualification_only,true);
  assert.equal(s.production_normal_budget_behavior_unchanged,true);
  assert.equal(s.normal_budget_can_stop_qualification_when_supply_incomplete,false);
  assert.equal(s.absolute_retrieval_budget_remains_hard,true);
  assert.equal(s.source_scan_maximum_remains_hard,true);
  assert.equal(s.minimum_fresh_focus_candidates_before_sufficiency_stop,5);
});


test('Q9 agent source supply includes Microsoft Work IQ without weakening gates',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const p=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
  const s=p.sources.find(x=>x.source_id==='microsoft-work-iq-agents-sep25');
  assert.ok(s);
  assert.equal(s.status,'active');
  assert.equal(s.pinned_candidate,true);
  assert.equal(s.focus_hint,'agents_non_technical_people');
  assert.equal(s.known_publication_date,'2026-09-25T00:00:00Z');
  assert.match(s.candidate_title,/agents/i);
  assert.equal(c.qualification_agent_source_supply.classification_gate_unchanged,true);
  assert.equal(c.qualification_agent_source_supply.novelty_gate_unchanged,true);
  assert.equal(c.qualification_agent_source_supply.production_history_duplicate_before_edition,false);
});


test('qualification image artifact handoff is durable and exact-byte preserving',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const h=c.qualification_image_artifact_handoff;
  assert.equal(h.durable_surface,'personal_library');
  assert.equal(h.exact_source_snapshot_required,true);
  assert.equal(h.ephemeral_file_id_only_prohibited,true);
  assert.equal(h.reviewer_must_materialize_raw_file,true);
  assert.equal(h.reviewer_must_compute_sha256,true);
  assert.equal(h.reviewer_must_persist_exact_bytes_to_git_blob,true);
  assert.equal(h.lossy_reencoding_prohibited,true);
  assert.equal(h.reviewer_regeneration_prohibited,true);
  assert.equal(h.accepted_locked_requires_git_blob_exact_byte_match,true);
  assert.equal(h.production_mutation,false);
});


test('qualification image workers are serialized story by story after Q11',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const s=c.qualification_image_worker_serialization;
  assert.equal(s.maximum_concurrent_image_workers,1);
  assert.equal(s.next_story_start_requires_prior_story_terminal,true);
  assert.equal(s.generation_and_capture_same_worker_required,true);
  assert.equal(s.durable_library_capture_before_worker_exit,true);
  assert.equal(s.separate_reviewer_after_capture,true);
  assert.equal(s.exact_git_persist_before_next_story,true);
  assert.equal(s.cross_story_parallelism_prohibited,true);
  assert.equal(s.cross_story_batch_generation_prohibited,true);
  assert.equal(s.cross_story_artifact_pooling_prohibited,true);
  assert.equal(s.candidate_lineage_match_required_at_generation,true);
  assert.equal(s.candidate_lineage_match_required_at_library_capture,true);
  assert.equal(s.candidate_lineage_match_required_at_review,true);
  assert.equal(s.candidate_lineage_match_required_at_git_persist,true);
  assert.equal(s.production_mutation,false);
});


test('Q13 source-supply hardening adds bounded first-party Applied and Agents candidates without weakening gates',()=>{
  const c=JSON.parse(fs.readFileSync('docs/operations/continuous-qualification-contract.json','utf8'));
  const p=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
  const q=c.qualification_q13_source_supply;
  assert.equal(q.qualification_only,true);
  assert.deepEqual(q.q13_observed_coverage,{
    technical_ai_engineering:11,
    applied_genai_knowledge_workers:0,
    agents_non_technical_people:2
  });
  assert.equal(q.added_applied_candidates,3);
  assert.equal(q.added_agent_candidates,1);
  assert.equal(q.classification_gate_unchanged,true);
  assert.equal(q.novelty_gate_unchanged,true);
  assert.equal(q.minimum_focus_coverage_unchanged,3);
  assert.equal(q.agent_skills_gate_unchanged,true);
  for(const id of q.added_source_ids){
    const s=p.sources.find(x=>x.source_id===id);
    assert.ok(s, id);
    assert.equal(s.status,'active');
    assert.equal(s.pinned_candidate,true);
    assert.equal(s.evidence_class,'publisher_authored');
    assert.ok(/^2026-09-2[345]T00:00:00Z$/.test(s.known_publication_date), id);
  }
  const applied=q.added_source_ids.map(id=>p.sources.find(x=>x.source_id===id)).filter(x=>x.focus_hint==='applied_genai_knowledge_workers');
  const agents=q.added_source_ids.map(id=>p.sources.find(x=>x.source_id===id)).filter(x=>x.focus_hint==='agents_non_technical_people');
  assert.equal(applied.length,3);
  assert.equal(agents.length,1);
  assert.match(agents[0].candidate_title,/agents/i);
});
