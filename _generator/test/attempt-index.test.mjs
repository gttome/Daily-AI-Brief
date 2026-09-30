import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildAttemptIndex,usageIndexEntry} from '../lib/attempt-index.mjs';

test('usage index preserves measured zero and missing metrics independently',()=>{
  const entry=usageIndexEntry({
    attempt_id:'a-1',
    edition_id:'dab-edition-2026-09-18',
    wall_seconds:439,
    scope:'publication_generation',
    measured_work:{image_drafts:0,accepted_images:0},
    usage:{exact_credits:null,coverage:'partial'}
  },'_records/attempts/2026-09-18/a.json');
  assert.equal(entry.wall_seconds,439);
  assert.equal(entry.measured_work.image_drafts,0);
  assert.equal(entry.measured_work.image_rejects,null);
  assert.equal(entry.measurement_coverage,'partial');
  assert.equal(entry.usage.exact_credits,null);
});

test('usage index rejects invalid metrics individually',()=>{
  assert.throws(()=>usageIndexEntry({attempt_id:'a-1',edition_id:'dab-edition-2026-09-18',wall_seconds:-1},'x'));
  assert.throws(()=>usageIndexEntry({attempt_id:'a-1',edition_id:'dab-edition-2026-09-18',measured_work:{image_rejects:'0'}},'x'));
});

test('attempt index deduplicates by stable attempt_id by rejecting duplicate public records',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-attempt-index-'));
  const dir=path.join(root,'_records','attempts','2026-09-18');
  fs.mkdirSync(dir,{recursive:true});
  const base={attempt_id:'same',edition_id:'dab-edition-2026-09-18',wall_seconds:1};
  fs.writeFileSync(path.join(dir,'a.json'),JSON.stringify(base));
  fs.writeFileSync(path.join(dir,'b.json'),JSON.stringify(base));
  assert.throws(()=>buildAttemptIndex(root),/Duplicate attempt_id/);
  fs.rmSync(root,{recursive:true});
});

test('committed public attempt index matches authoritative attempt records',()=>{
  const expected=buildAttemptIndex(process.cwd());
  const actual=JSON.parse(fs.readFileSync('data/attempts/index.json','utf8'));
  assert.deepEqual(actual,expected);
});
