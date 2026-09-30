import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {transferImageFile, createGitHubImageClient, MAX_IMAGE_BYTES} from '../lib/github-image-transfer.mjs';

const dir = await fs.mkdtemp(path.join(os.tmpdir(),'image-transfer-test-'));
after(() => fs.rm(dir,{recursive:true,force:true}));
const digest = x => createHash('sha256').update(x).digest('hex');
const blob = x => createHash('sha1').update(`blob ${x.length}\0`).update(x).digest('hex');
function chunk(type,data) {
  const payload=Buffer.concat([Buffer.from(type),data]); let crc=0xffffffff;
  for(const byte of payload){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc&1)?0xedb88320^(crc>>>1):crc>>>1;}
  const head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([head,payload,tail]);
}
function png(extra=0){const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),
 ...(extra?[chunk('tEXt',Buffer.concat([Buffer.from('Fixture\0'),Buffer.alloc(extra,65)]))]:[]),
 chunk('IDAT',deflateSync(Buffer.from([0,100,150,200]))),chunk('IEND',Buffer.alloc(0))]);}
const small=png(),large=png(1200000),input=path.join(dir,'fixture.png'),big=path.join(dir,'large-fixture.png');
await fs.writeFile(input,small);await fs.writeFile(big,large);
const repo='gttome/Daily-AI-Brief',branch='image-transfer-proof/unit',destination='_records/image-transfer-proof/unit/raw.png';
const base='a'.repeat(40),commit='b'.repeat(40);
const opts=(overrides={})=>({sourcePath:input,repository:repo,branch,destination,expectedSha256:digest(small),token:'fixture-token',...overrides});
function mock(settings={}){
 const calls=[];let stored=settings.existing || null,head=base;
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 const fetchImpl=async(url,init)=>{
  calls.push({url,init});assert.ok(url.startsWith('https://api.github.com/repos/'+repo+'/'));
  assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer fixture-token');
  if(settings.denied)return json({message:'fixture denial'},403);
  if(url.includes('/branches/'))return json({name:settings.branchName || branch,protected:settings.protected ?? false,commit:{sha:head}});
  if(init.method==='PUT'){
   if(settings.conflict)return json({message:'conflict'},409);
   stored=Buffer.from(JSON.parse(init.body).content,'base64');head=commit;
   if(settings.lostWriteResponse)throw Error('private error including fixture-token');
   return json({commit:{sha:commit},content:{path:destination,sha:settings.badBlob || blob(stored)}},201);
  }
  if(init.headers.Accept==='application/vnd.github.raw+json'){
   if(settings.rawFailure)return json({},503);
   assert.ok(url.endsWith('?ref='+head));
   return new Response(settings.wrongReadback?Buffer.from('not the image'):stored);
  }
  if(!stored)return json({},404);
  return json({type:settings.type || 'file',sha:blob(stored),size:stored.length,content:'',encoding:'none'});
 };
 return {fetchImpl,calls,get stored(){return stored;}};
}

test('file bytes -> one Contents PUT -> raw read-back at exact commit',async()=>{
 const m=mock(),r=await transferImageFile(opts(m));assert.equal(r.status,'TRANSFER_VERIFIED');assert.equal(r.commit_sha,commit);
 assert.equal(r.read_back_verified,true);assert.equal(r.image_acceptance_asserted,false);assert.equal(r.sha256,digest(small));assert.deepEqual(m.stored,small);
 assert.deepEqual(r.api_calls,{requests:4,write_requests:1,raw_reads:1});assert.equal(JSON.parse(m.calls[2].init.body).sha,undefined);
});
test('greater-than-1MiB binary works with empty object content and raw media',async()=>{
 const m=mock({existing:large}),r=await transferImageFile(opts({...m,sourcePath:big,expectedSha256:digest(large)}));
 assert.equal(r.reused,true);assert.equal(r.bytes,large.length);assert.equal(r.api_calls.write_requests,0);assert.equal(r.api_calls.raw_reads,1);
});
test('idempotent repeated upload produces no second commit',async()=>{
 const m=mock();await transferImageFile(opts(m));const r=await transferImageFile(opts(m));
 assert.equal(r.reused,true);assert.equal(r.commit_sha,commit);assert.equal(m.calls.filter(c=>c.init.method==='PUT').length,1);
});
test('different existing bytes are never overwritten',async()=>{
 const m=mock({existing:large});await assert.rejects(()=>transferImageFile(opts(m)),/IMMUTABLE_IMAGE_PATH_CONFLICT/);
 assert.equal(m.calls.some(c=>c.init.method==='PUT'),false);
});
test('source hash mismatch fails before any request',async()=>{
 const m=mock();await assert.rejects(()=>transferImageFile(opts({...m,expectedSha256:'0'.repeat(64)})),/SOURCE_HASH_MISMATCH/);assert.equal(m.calls.length,0);
});
test('missing authentication is a capability failure, not an owner upload instruction',async()=>{
 await assert.rejects(()=>transferImageFile(opts({token:undefined})),/CAPABILITY_BLOCKED_AUTHENTICATED_FILE_HOST_REQUIRED/);
});
for(const b of ['main','master','refs/heads/main','repair/random','editorial-handoff/qualification/../main','image-transfer-proof/a.lock','image-transfer-proof/a?x=1'])
 test('reject unsafe or non-image branch '+b,async()=>{await assert.rejects(()=>transferImageFile(opts({branch:b})),/BRANCH/);});
for(const d of ['_data/editions/2026-09-28.json','../raw.png','_records/image-transfer-proof//raw.png','.github/workflows/x.yml','briefs/images/2026-09-28/file.svg'])
 test('reject unsafe destination '+d,async()=>{await assert.rejects(()=>transferImageFile(opts({destination:d})),/PATH/);});
test('known tool safety block cannot be retried through this transport',async()=>{
 const m=mock();await assert.rejects(()=>transferImageFile(opts({...m,knownSafetyBlock:true})),/SAFETY_BLOCK_REQUIRES_RESOLUTION/);assert.equal(m.calls.length,0);
});
test('protected branch fails closed',async()=>{const m=mock({protected:true});await assert.rejects(()=>transferImageFile(opts(m)),/UNPROTECTED/);assert.equal(m.calls.length,1);});
test('branch response identity must match target',async()=>{await assert.rejects(()=>transferImageFile(opts(mock({branchName:'main'}))),/UNPROTECTED/);});
test('symlink metadata is not accepted as a file',async()=>{await assert.rejects(()=>transferImageFile(opts(mock({existing:small,type:'symlink'}))),/IMMUTABLE/);});
test('local symlink source is rejected',async()=>{const link=path.join(dir,'link.png');await fs.symlink(input,link);await assert.rejects(()=>transferImageFile(opts({sourcePath:link})));});
test('403 denial has no alternate endpoint or retry',async()=>{const m=mock({denied:true});await assert.rejects(()=>transferImageFile(opts(m)),e=>e.code==='TRANSFER_DENIED'&&e.http_status===403);assert.equal(m.calls.length,1);});
test('409 conflict does not blindly retry write',async()=>{const m=mock({conflict:true});await assert.rejects(()=>transferImageFile(opts(m)),/TRANSFER_CONFLICT/);assert.equal(m.calls.filter(x=>x.init.method==='PUT').length,1);});
test('lost write response is reconciled through normal idempotent lookup',async()=>{
 const m=mock({lostWriteResponse:true});await assert.rejects(()=>transferImageFile(opts(m)),/WRITE_OUTCOME_UNCERTAIN/);
 const r=await transferImageFile(opts(m));assert.equal(r.reused,true);assert.equal(m.calls.filter(x=>x.init.method==='PUT').length,1);
});
test('read-back failure exposes commit for recovery without success',async()=>{
 await assert.rejects(()=>transferImageFile(opts(mock({rawFailure:true}))),e=>e.code==='COMMITTED_IMAGE_READBACK_PENDING'&&e.commit_sha===commit);
});
test('changed returned bytes never certify transfer',async()=>{await assert.rejects(()=>transferImageFile(opts(mock({wrongReadback:true}))),/READBACK_MISMATCH/);});
test('wrong GitHub returned blob fails',async()=>{await assert.rejects(()=>transferImageFile(opts(mock({badBlob:'0'.repeat(40)}))),/WRITE_RESPONSE_IDENTITY_MISMATCH/);});
test('invalid PNG bytes fail before network',async()=>{const bad=path.join(dir,'bad.png');await fs.writeFile(bad,'not PNG');const m=mock();await assert.rejects(()=>transferImageFile(opts({...m,sourcePath:bad,expectedSha256:digest('not PNG')})),/STRUCTURE/);assert.equal(m.calls.length,0);});
test('oversized source fails before network',async()=>{const too=path.join(dir,'too.png');const f=await fs.open(too,'w');await f.truncate(MAX_IMAGE_BYTES+1);await f.close();await assert.rejects(()=>transferImageFile(opts({sourcePath:too})),/SIZE/);});
test('transport errors never leak credential or underlying secret-bearing error',async()=>{
 const client=createGitHubImageClient({token:'fixture-token',fetchImpl:async()=>{throw Error('secret fixture-token');}});
 await assert.rejects(()=>client.branch(repo,branch),e=>e.code==='TRANSFER_READ_FAILED'&&!e.message.includes('fixture-token'));
});
