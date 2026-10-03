import test from 'node:test';
import assert from 'node:assert/strict';
import {newEfficiency,METRICS} from '../lib/efficiency.mjs';
import {productionTelemetryHealth,applyProductionTelemetryHealth,validateMediaPreflight,validateWatchlistFreshness} from '../lib/production-guardrails.mjs';
import {incrementalCoverage,watchlistFallbackPlan} from '../lib/incremental-watchlist.mjs';
import {DEFAULT_DEEP_CANDIDATE_TARGET} from '../lib/research.mjs';
import {completionDecision} from '../lib/production-run.mjs';
import {validateAtomicChangedPaths} from '../lib/publication.mjs';

function completeEfficiency(){
 const r=newEfficiency({editionId:'dab-edition-2026-09-17',attemptId:'dab-attempt-test',baselineSha:'a'.repeat(40),pipelineVersion:'efficiency-production-v2'});
 for(const field of METRICS.stages)r.stages[field]=1;
 r.research.cache_hits=2;r.research.cache_misses=3;r.research.early_stop_triggered=true;
 r.context.model_calls_observable=4;r.context.input_tokens_observable=100;r.context.output_tokens_observable=20;
 return r;
}

test('missing production telemetry is explicitly DEGRADED instead of silently optimized',()=>{
 const empty=newEfficiency({editionId:'dab-edition-2026-09-17',attemptId:'dab-attempt-empty',baselineSha:'a'.repeat(40)});
 const missing=productionTelemetryHealth(empty);
 assert.equal(missing.status,'DEGRADED');
 assert.ok(missing.missing_required.includes('context.input_tokens_observable'));
 assert.ok(missing.missing_required.includes('research.cache_hits'));
 assert.ok(missing.missing_required.includes('stages.discovery_seconds'));
 const complete=applyProductionTelemetryHealth(completeEfficiency());
 assert.equal(complete.telemetry_health.status,'PASS');
 assert.equal(complete.quality.overall_run_status,'PASS');
});

test('Watchlist uses a bounded high-value fallback when fresh daily coverage is starved',()=>{
 const sources=Array.from({length:49},(_,i)=>({source_id:'s'+i,endpoint:'https://example.org/'+i,check_cadence:i<20?'daily':'weekly',automated:true}));
 const checks=sources.map((s,i)=>({source_id:s.source_id,status:i<3?'unavailable':i<5?'assisted_review_required':'not_due',previous_status:i<5?'retrieved':'retrieved'}));
 const coverage=incrementalCoverage(checks);
 assert.equal(coverage.fresh_successful_observations,0);
 assert.equal(coverage.coverage_floor_met,false);
 assert.equal(coverage.coverage_status,'degraded');
 const fallback=watchlistFallbackPlan(sources,checks);
 assert.equal(fallback.needed,true);
 assert.ok(fallback.sources.length>0&&fallback.sources.length<=5);
 assert.ok(fallback.sources.every(x=>x.force===true));
 const recovered=checks.map((c,i)=>i>=5&&i<8?{...c,status:'retrieved'}:c);
 assert.equal(incrementalCoverage(recovered).coverage_floor_met,true);
 assert.equal(watchlistFallbackPlan(sources,recovered).sources.length,0);
});

test('selected video and podcast URL date and runtime must match fresh prepublication evidence',()=>{
 const edition={brief_date:'2026-09-17',edition_id:'dab-edition-2026-09-17',worth_watching:{general:{status:'included',url:'https://www.youtube.com/watch?v=abcdefghijk',upload_date:'2026-09-17',runtime_seconds:300},agents_non_technical_people:{status:'empty'}},podcast:{status:'included',item_id:'dab-podcast-2026-09-17-test',url:'https://example.org/podcast',publication_date:'2026-09-17',runtime_seconds:1800}};
 const record={schema_version:'1.0.0',edition_id:edition.edition_id,checked_at:'2026-09-17T11:55:00Z',items:[
  {item_id:'dab-video-2026-09-17-general',kind:'video',url:edition.worth_watching.general.url,reachable:true,http_status:200,observed_date:'2026-09-17T00:00:00Z',observed_runtime_seconds:300},
  {item_id:edition.podcast.item_id,kind:'podcast',url:edition.podcast.url,reachable:true,http_status:200,observed_date:'2026-09-17T00:00:00Z',observed_runtime_seconds:1800}
 ]};
 assert.deepEqual(validateMediaPreflight(edition,record,{observedAt:'2026-09-17T12:00:00Z'}),[]);
 const bad=structuredClone(record);bad.items[1].http_status=404;bad.items[1].observed_runtime_seconds=1700;
 const errors=validateMediaPreflight(edition,bad,{observedAt:'2026-09-17T12:00:00Z'});
 assert.ok(errors.some(x=>x.includes('not successfully reached')));
 assert.ok(errors.some(x=>x.includes('runtime was not independently matched')));
});

test('deep research defaults to two finalists plus one reserve per focus and expands only when needed',()=>{
 assert.equal(DEFAULT_DEEP_CANDIDATE_TARGET,9);
});

test('published edition is distinct from final QA completion',()=>{
 const pending={edition_id:'dab-edition-2026-09-17',phase:'committed',commit_sha:'b'.repeat(40),pages:{conclusion:'not_run'}};
 const state=completionDecision({editionDate:'2026-09-17',completion:pending});
 assert.equal(state.state,'published_qa_pending');
 assert.equal(state.label,'Published — final QA in progress');
 const complete={...pending,phase:'pages_verified',pages:{conclusion:'success'}};
 assert.equal(completionDecision({editionDate:'2026-09-17',completion:complete}).state,'completed');
});

test('September 17 atomic publication requires persisted media preflight evidence',()=>{
 const paths=['_data/editions/2026-09-17.json','briefs/2026-09-17.md','latest.md','index.md','archive.md','README.md'];
 assert.ok(validateAtomicChangedPaths(paths,'2026-09-17').includes('_records/editorial/media-preflight/2026-09-17.json'));
});


test('September 19 publication blocks stale or evidence-free Watchlist state',()=>{
 const edition={brief_date:'2026-09-19',edition_id:'dab-edition-2026-09-19'};
 const good={edition_date:'2026-09-19',updated_at:'2026-09-19T17:09:07Z',topics:[{topic_id:'topic-a',name:'Agent skills observability',status:'early_signal',confidence:'moderate',evidence:[{url:'https://example.org'}]}]};
 assert.deepEqual(validateWatchlistFreshness(edition,good),[]);
 const stale={...good,edition_date:'2026-09-18',updated_at:'2026-09-18T17:09:07Z'};
 assert.ok(validateWatchlistFreshness(edition,stale).some(x=>x.includes('edition_date')));
 const noEvidence=structuredClone(good);noEvidence.topics[0].evidence=[];
 assert.ok(validateWatchlistFreshness(edition,noEvidence).some(x=>x.includes('lacks evidence')));
});
