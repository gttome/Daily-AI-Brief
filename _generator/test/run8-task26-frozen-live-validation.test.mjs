import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('Run 8 frozen live validation reuses sealed images and runtime feedback without reader rework',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-run8-live-'));
  const completionPath=path.join(temp,'completion.json');
  const out=path.join(temp,'validation.json');
  try{
    const edition=JSON.parse(fs.readFileSync('_data/editions/2026-10-04.json','utf8'));
    const assets=edition.stories.map(story=>story.image.path);
    const completion={
      schema_version:'2.0.0',
      phase:'pages_verified',
      edition_id:edition.edition_id,
      commit_sha:'a'.repeat(40),
      production_sha:'a'.repeat(40),
      deployed_sha:'a'.repeat(40),
      file_set:{
        assets,
        derived_outputs:['briefs/2026-10-04.md','latest.md','index.md','archive.md','feed.xml','daily-feed.xml','feed.json']
      },
      pages:{run_id:1,conclusion:'success',verified_at:'2026-10-04T16:39:24Z',deployed_sha:'a'.repeat(40),deployment_url:'https://gttome.github.io/Daily-AI-Brief/'}
    };
    fs.writeFileSync(completionPath,JSON.stringify(completion,null,2)+'\n');
    execFileSync(process.execPath,['_tools/daily-validation.mjs','--date','2026-10-04','--offline','--completion',completionPath,'--out',out],{cwd:process.cwd(),stdio:'pipe'});
    const receipt=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(receipt.final_result,'pass');
    assert.equal(receipt.image_readiness.expected,6);
    assert.equal(receipt.image_readiness.accepted_locked,6);
    assert.equal(receipt.image_readiness.integrity_passed,6);
    assert.equal(receipt.image_readiness.canonical_hosted,6);
    assert.equal(receipt.image_readiness.status,'pass');
    assert.equal(receipt.checks.find(x=>x.check_id==='image_integrity_dimensions').result,'pass');
    assert.match(receipt.checks.find(x=>x.check_id==='image_integrity_dimensions').evidence,/sealed Task 19 byte identities/);
    assert.equal(receipt.checks.find(x=>x.check_id==='rating_share_generated_ids').result,'pass');
    assert.match(receipt.checks.find(x=>x.check_id==='rating_share_generated_ids').evidence,/feedback\.js restores stable five-star controls/);
  } finally {
    fs.rmSync(temp,{recursive:true,force:true});
  }
});

test('October 4 runtime feedback fallback is bounded and preserves stable item identities',()=>{
  const script=fs.readFileSync('assets/js/feedback.js','utf8');
  assert.match(script,/FROZEN_OCT4_RUNTIME_FEEDBACK/);
  assert.match(script,/briefDate!==['"]2026-10-04['"]/);
  assert.match(script,/dab-story-2026-10-04-/);
  assert.match(script,/dab-video-2026-10-04-general/);
  assert.match(script,/dab-video-2026-10-04-agent-skills/);
  assert.match(script,/dab-podcast-2026-10-04-1/);
  assert.match(script,/dab-podcast-2026-10-04-2/);
});
