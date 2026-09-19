import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {expandEditorialKernel} from '../lib/editorial-kernel.mjs';
import {WATCHLIST_MINIMUM_FRESH_OBSERVATIONS,WATCHLIST_MAX_FALLBACK_CHECKS} from '../lib/incremental-watchlist.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('September 19+ expansion requires exactly two videos and two podcasts and serves Brief-owned image URLs',()=>{
  const kernel=read('_records/editorial-handoff/kernel.json');
  const facts=read('_records/editorial-handoff/facts.json');
  const images=read('_records/editorial-handoff/images.json');
  const metadata=read('_records/editorial-handoff/metadata-candidates.json');
  const media=read('_records/editorial-handoff/media.json');
  assert.equal(kernel.brief_date,'2026-09-19');
  assert.throws(()=>expandEditorialKernel(kernel,{candidateFacts:facts,imageAssets:images,metadataCandidates:metadata,media:{worth_watching:{general:{status:'empty'},agents_non_technical_people:{status:'empty'}},podcasts:[]},publishedAt:'2026-09-19T18:00:00Z',coveragePeriod:'Verified September 19 qualification coverage period.'}),/exactly two included videos/);
  const edition=expandEditorialKernel(kernel,{candidateFacts:facts,imageAssets:images,metadataCandidates:metadata,media,publishedAt:'2026-09-19T18:00:00Z',coveragePeriod:'Verified September 19 qualification coverage period.'});
  assert.equal(Object.values(edition.worth_watching).filter(x=>x.status==='included').length,2);
  assert.equal(edition.podcasts.length,2);
  for(const story of edition.stories){
    assert.match(story.image.public_url,/^https:\/\/gttome\.github\.io\/Daily-AI-Brief\/briefs\/images\/2026-09-19\//);
    assert.doesNotMatch(story.image.public_url,/raw\.githubusercontent\.com/);
  }
});

test('accepted locked September 19 image set is reused without rendering or regeneration',()=>{
  const manifest=read('_records/editorial-handoff/images.json');
  assert.equal(Object.keys(manifest).length,6);
  for(const entry of Object.values(manifest)){
    assert.equal(entry.quality_accepted,true);
    assert.equal(entry.accepted_locked,true);
    assert.equal(entry.lock_status,'accepted_locked');
    assert.ok(fs.existsSync(entry.path));
  }
  const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'dab-locked-')),'images.json');
  const receipt=path.join(path.dirname(out),'receipt.json');
  execFileSync(process.execPath,['_tools/render-visual-assets.mjs','--kernel','_records/editorial-handoff/kernel.json','--policy','_data/visual-renderer-policy.json','--fallback','_records/editorial-handoff/images.json','--out',out,'--receipt',receipt],{stdio:'pipe'});
  const result=read(receipt);
  assert.equal(result.locked_reuse,6);
  assert.equal(result.deterministic,0);
  assert.equal(result.generative_fallback,0);
  assert.equal(result.blocked,0);
});

test('Watchlist recovery coverage floor is substantial and bounded',()=>{
  assert.equal(WATCHLIST_MINIMUM_FRESH_OBSERVATIONS,12);
  assert.equal(WATCHLIST_MAX_FALLBACK_CHECKS,20);
  assert.ok(WATCHLIST_MAX_FALLBACK_CHECKS>=WATCHLIST_MINIMUM_FRESH_OBSERVATIONS);
});

test('September 19 operating contracts prohibit degraded media and define the image lock',()=>{
  const runtime=read('docs/operations/under80-runtime-contract.json');
  const policy=read('docs/operations/efficiency-operating-policy.json');
  assert.equal(runtime.output.videos_required,2);
  assert.equal(runtime.output.podcasts_required,2);
  assert.equal(runtime.media.bounded_omission_allowed,false);
  assert.equal(runtime.images.accepted_asset_lock.required,true);
  assert.equal(runtime.images.accepted_asset_lock.command_center_role,'viewer_and_status_only_not_authoritative_host');
  assert.equal(policy.video.required_count,2);
  assert.equal(policy.podcast.required_count,2);
  assert.equal(policy.image.accepted_asset_lock,true);
  assert.equal(policy.watchlist.minimum_fresh_observations,12);
});
