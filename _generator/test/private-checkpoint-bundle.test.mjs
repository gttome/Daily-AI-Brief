import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {pack,unpack,digest} from '../../_tools/private-checkpoint-bundle.mjs';
function setup(t){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'dab-transport-')),repo=path.join(base,'repo'),root=path.join(base,'private'),bundle=path.join(base,'snapshot.gz');
 fs.mkdirSync(repo);fs.mkdirSync(root,{mode:0o700});fs.writeFileSync(path.join(root,'draft.txt'),'Rejected draft: revise labels');
 t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const receipt=pack({repo,root,output:bundle});return {base,repo,root,bundle,expectedHash:receipt.sha256};
}
test('transport preserves bytes and review state and never grants approval',t=>{
 const s=setup(t);assert.equal(unpack(s).state,'transport_verified');
 fs.unlinkSync(path.join(s.root,'draft.txt'));
 assert.equal(unpack({...s,restore:true}).restored,1);
 assert.equal(fs.readFileSync(path.join(s.root,'draft.txt'),'utf8'),'Rejected draft: revise labels');
 assert.equal(unpack({...s,restore:true}).restored,0);
 assert.equal(unpack(s).approval,'not_granted');
 assert.equal(unpack(s).scheduled_recovery_verified,false);
});
test('different working bytes block all restoration',t=>{
 const s=setup(t);fs.writeFileSync(path.join(s.root,'draft.txt'),'new useful work');
 assert.throws(()=>unpack({...s,restore:true}),/no overwrite/);
 assert.equal(fs.readFileSync(path.join(s.root,'draft.txt'),'utf8'),'new useful work');
});
test('independent receipt detects bundle tampering',t=>{
 const s=setup(t);fs.appendFileSync(s.bundle,'corrupt');
 assert.throws(()=>unpack(s),/hash mismatch/);
});
test('rejects traversal, duplicates and internal corruption before writes',t=>{
 const s=setup(t),original=JSON.parse(gunzipSync(fs.readFileSync(s.bundle)));
 for(const mutate of [
 b=>b.files[0].name='../escape',
 b=>b.files.push({...b.files[0]}),
 b=>b.files[0].sha256='0'.repeat(64),
 b=>b.files[0].name='.env',
 b=>b.root=s.root+'-other',
 ]){
  const b=structuredClone(original);mutate(b);const bytes=gzipSync(Buffer.from(JSON.stringify(b)));fs.writeFileSync(s.bundle,bytes);
  assert.throws(()=>unpack({...s,expectedHash:digest(bytes),restore:true}));
 }
 assert.equal(fs.existsSync(path.join(s.base,'escape')),false);
});
test('refuses symlinks, hardlinks, public roots and permissive root',t=>{
 const s=setup(t),link=path.join(s.root,'escape');fs.symlinkSync(s.repo,link);
 assert.throws(()=>pack({...s,output:path.join(s.base,'other.gz')}),/Unsafe/);fs.unlinkSync(link);
 fs.linkSync(path.join(s.root,'draft.txt'),link);
 assert.throws(()=>unpack(s),/no overwrite/);fs.unlinkSync(link);
 assert.throws(()=>pack({...s,root:s.repo,output:path.join(s.base,'other.gz')}),/outside repository/);
 fs.chmodSync(s.root,0o755);assert.throws(()=>unpack(s),/owner-only/);
});
test('restore refuses a symlink ancestor and file-directory collision',t=>{
 const s=setup(t);fs.renameSync(s.root,s.root+'-saved');fs.symlinkSync(s.root+'-saved',s.root);
 assert.throws(()=>unpack({...s,restore:true}),/Symbolic/);
 fs.unlinkSync(s.root);fs.renameSync(s.root+'-saved',s.root);
 const b=JSON.parse(gunzipSync(fs.readFileSync(s.bundle)));b.files.push({...b.files[0],name:'draft.txt/child'});
 const bytes=gzipSync(Buffer.from(JSON.stringify(b)));fs.writeFileSync(s.bundle,bytes);
 assert.throws(()=>unpack({...s,expectedHash:digest(bytes),restore:true}),/collision/);
});
