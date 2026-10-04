import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  migrationEnabled,
  verifiedVideoMigration,
  lockedCanvasMigrationAllowed,
  aggregateWatchlistMigrationErrors
} from '../lib/frozen-contract-migration.mjs';

const migration={
  contract_transition:'pre-2026-10-05-frozen-contract-recovery',
  allow_verified_video_exception:true,
  preserve_accepted_locked_assets:true
};

test('bounded migration expires after the frozen-contract cutoff',()=>{
  assert.equal(migrationEnabled('2026-10-04',migration),true);
  assert.equal(migrationEnabled('2026-10-05',migration),false);
  assert.equal(migrationEnabled('2026-10-04',{}),false);
});

test('video migration requires explicit verified exception evidence',()=>{
  const days=(a,b)=>(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
  assert.equal(verifiedVideoMigration({
    upload_date:'2026-07-21',official_source_verified:true,
    freshness_exception_reason:'Task evidence verified the official source and bounded search found no equally relevant fresh item.'
  },'2026-10-04',migration,days),true);
  assert.equal(verifiedVideoMigration({
    upload_date:null,official_source_verified:true,
    date_unavailable_reason:'Task evidence verified the official source and runtime; reliable upload date was unavailable.'
  },'2026-10-04',migration,days),true);
  assert.equal(verifiedVideoMigration({upload_date:null,official_source_verified:true},'2026-10-04',migration,days),false);
});

test('locked canvas migration never permits an unreviewed or unlocked asset',()=>{
  const ctx={manifest:{seal:{immutable_artifact_digests:true}},imageReview:{
    m01:{path:'briefs/images/2026-10-04/x.png',accepted_locked:true,lock_status:'accepted_locked',visual_reviewed:true,quality_accepted:true,overall_gate:'pass'}
  }};
  const gated={assets:[{path:'briefs/images/2026-10-04/x.png',width:1199,height:630,sha256:'a'.repeat(64),git_blob_sha:'b'.repeat(40)}]};
  const error='Invalid accepted handoff image canvas: briefs/images/2026-10-04/x.png';
  assert.equal(lockedCanvasMigrationAllowed(ctx,gated,error,'2026-10-04',migration),true);
  ctx.imageReview.m01.accepted_locked=false;
  assert.equal(lockedCanvasMigrationAllowed(ctx,gated,error,'2026-10-04',migration),false);
});

test('aggregate Task 08 migration requires sealed worker, refresh and candidate source evidence',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-watchlist-migration-'));
  fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
  const worker={schema_version:'run-worker-result-v1',task_id:'08',status:'passed',task_outcome:'Done',result:'PASS',edition_id:'dab-edition-2026-10-04',evidence:{domains_checked:7,focused_checks:14}};
  const refs=['a','b','c','d'].map(x=>'evidence/'+x+'.json');
  const refresh={edition_id:'dab-edition-2026-10-04',result:'PASS',discovery_domains_checked:7,checks_completed:14,zero_new_certified:true,new_topics:[],updated_topic_ids:['t1','t2','t3'],zero_new_justification:'All required discovery surfaces and fourteen focused checks completed; four concepts were dispositioned and no distinct new mechanism met admission.',source_evidence:refs};
  fs.writeFileSync(path.join(root,'worker.json'),JSON.stringify(worker));
  fs.writeFileSync(path.join(root,'refresh.json'),JSON.stringify(refresh));
  const rows=[
    {candidate_id:'a',source_url:'https://example.com/a',checked_at:'2026-10-04T03:38:35Z',disposition:'update_existing',topic_id:'t1'},
    {candidate_id:'b',source_url:'https://example.com/b',checked_at:'2026-10-04T03:38:35Z',disposition:'update_existing',topic_id:'t2'},
    {candidate_id:'c',source_url:'https://example.com/c',checked_at:'2026-10-04T03:38:35Z',disposition:'update_existing',topic_id:'t3'},
    {candidate_id:'d',source_url:'https://example.com/d',checked_at:'2026-10-04T03:38:35Z',disposition:'hold_for_research'}
  ];
  rows.forEach((row,i)=>fs.writeFileSync(path.join(root,refs[i]),JSON.stringify(row)));
  const ctx={manifest:{edition_id:'dab-edition-2026-10-04'},watchlistEvidence:{required_surfaces_complete:6,focused_checks_executed:14,candidates_reviewed_count:4,zero_new_certified:true,new_topic_ids:[],updated_topic_ids:['t1','t2','t3']}};
  const m={...migration,aggregate_watchlist_task08:{enabled:true,worker_result_path:'worker.json',watchlist_refresh_path:'refresh.json'}};
  assert.deepEqual(aggregateWatchlistMigrationErrors(root,ctx,'2026-10-04',m),[]);
  fs.rmSync(root,{recursive:true,force:true});
});
