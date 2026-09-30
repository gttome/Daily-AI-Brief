
import test from 'node:test';
import assert from 'node:assert/strict';
import {newEfficiency,validateEfficiency,summarizeEfficiency,comparison} from '../lib/efficiency.mjs';
const make=()=>newEfficiency({editionId:'dab-edition-2026-09-14',attemptId:'a',baselineSha:'a'.repeat(40)});
test('efficiency schema rejects missing observations as zero substitutions or invalid values',()=>{
 const r=make();assert.deepEqual(validateEfficiency(r),[]);assert.equal(r.context.input_tokens_observable,null);
 r.research.cache_hits=-1;assert.ok(validateEfficiency(r).length);
 r.research.cache_hits=null;r.quality.final_public_qa='PASS';assert.ok(validateEfficiency(r).length);
 r.quality.critical_high_defects=0;assert.deepEqual(validateEfficiency(r),[]);
});
test('generation and historical records cannot masquerade as optimized editions',()=>{
 const r=make();assert.equal(summarizeEfficiency([r]).optimized_editions,0);
 Object.assign(r,{scope:'publication_complete',start_time:'2026-09-14T12:00:00Z',end_time:'2026-09-14T12:10:00Z',wall_seconds:600});
 Object.assign(r.quality,{final_public_qa:'PASS',critical_high_defects:0,overall_run_status:'DEGRADED',watchlist:'DEGRADED',private_operations:'PASS'});
 assert.deepEqual(validateEfficiency(r),[]);
 const s=summarizeEfficiency([r,{...r,attempt_id:'b'}]);assert.equal(s.optimized_editions,1);assert.equal(s.averages.wall_seconds.mean,600);
 assert.equal(s.averages['context.downstream_context_chars'].observations,0);
 assert.equal(comparison(0,3).improvement_percent,null);assert.equal(comparison(null,3).absolute_change,null);
});
test('allowance readings require valid control boundaries and equal readings are below resolution',()=>{
 const r=make();Object.assign(r,{start_time:'2026-09-14T12:00:00Z',end_time:'2026-09-14T12:10:00Z',wall_seconds:600});
 Object.assign(r.usage,{weekly_usage_percent_remaining_before:37,weekly_usage_percent_remaining_after:34,weekly_usage_percentage_points_consumed:3,
 weekly_usage_before_captured_at:r.start_time,weekly_usage_after_captured_at:r.end_time,weekly_reset_at:'2026-09-15T12:00:00Z',concurrent_work_codex_activity:false,allowance_changing_event:false,weekly_usage_measurement_status:'valid'});
 assert.deepEqual(validateEfficiency(r),[]);
 r.usage.concurrent_work_codex_activity=true;assert.ok(validateEfficiency(r).length);r.usage.concurrent_work_codex_activity=false;
 r.usage.weekly_usage_percent_remaining_after=37;r.usage.weekly_usage_measurement_status='below_display_resolution';r.usage.weekly_usage_percentage_points_consumed=null;
 assert.deepEqual(validateEfficiency(r),[]);
});
