import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {consumeImageChunkRequests,IMAGE_CHUNK_BRIDGE_SCHEMA} from '../lib/image-chunk-bridge.mjs';

const hash=(algorithm,bytes)=>createHash(algorithm).update(bytes).digest('hex');
const blob=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
function png(){const b=Buffer.alloc(32);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(13,8);b.write('IHDR',12,'ascii');b.writeUInt32BE(1200,16);b.writeUInt32BE(630,20);return b;}
function fixture(t,{target='briefs/images/2026-10-02/m01.png',payload=png()}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-chunk-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const executionId='reliable-edition-20261002-run5',requestId='m01-attempt-2-final';
  const dir=path.join(root,'_records/edition-execution/image-transport-requests',executionId,requestId);
  fs.mkdirSync(dir,{recursive:true});
  const base64=payload.toString('base64'),parts=[base64.slice(0,20),base64.slice(20)];
  const chunks=parts.map((text,index)=>{const file=`chunk-${String(index).padStart(4,'0')}.b64`;fs.writeFileSync(path.join(dir,file),text);return {file,sha256:hash('sha256',Buffer.from(text))};});
  const manifest={schema_version:IMAGE_CHUNK_BRIDGE_SCHEMA,request_id:requestId,execution_id:executionId,
    execution_key:'2026-10-02-run5',branch:'reliable-edition/dab-edition-2026-10-02-run5',task_id:'11',candidate_id:'m01',
    source_writer_generation:7,target_path:target,bytes:payload.length,sha256:hash('sha256',payload),git_blob_sha:blob(payload),chunks};
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
  return {root,executionId,requestId,dir,target,payload,manifest};
}

test('bounded Base64 chunks reconstruct exact PNG bytes and remove temporary transport files',t=>{
  const f=fixture(t),result=consumeImageChunkRequests({runRoot:f.root,executionId:f.executionId,
    branch:f.manifest.branch,writerGeneration:8,now:()=> '2026-10-02T14:30:00Z'});
  assert.equal(result.result,'PASS');assert.equal(result.processed,1);assert.equal(result.failed,0);
  assert.ok(fs.readFileSync(path.join(f.root,f.target)).equals(f.payload));assert.equal(fs.existsSync(f.dir),false);
  const receipt=JSON.parse(fs.readFileSync(path.join(f.root,'_records/edition-execution/image-transport-results',f.executionId,f.requestId+'.json')));
  assert.equal(receipt.content_address_verified,true);assert.equal(receipt.read_back_verified,true);
  assert.equal(receipt.width,1200);assert.equal(receipt.height,630);assert.equal(receipt.temporary_chunks_removed,true);
});

test('payload mismatch fails closed and preserves chunks for evidence',t=>{
  const f=fixture(t);f.manifest.sha256='0'.repeat(64);fs.writeFileSync(path.join(f.dir,'manifest.json'),JSON.stringify(f.manifest));
  const result=consumeImageChunkRequests({runRoot:f.root,executionId:f.executionId,branch:f.manifest.branch,writerGeneration:8});
  assert.equal(result.result,'PARTIAL');assert.equal(result.failed,1);assert.equal(fs.existsSync(f.dir),true);
  assert.equal(fs.existsSync(path.join(f.root,f.target)),false);assert.match(result.results[0].reason,/payload_identity/);
});

test('unsafe target and future writer generation are rejected',t=>{
  const unsafe=fixture(t,{target:'../main.png'});
  let result=consumeImageChunkRequests({runRoot:unsafe.root,executionId:unsafe.executionId,branch:unsafe.manifest.branch,writerGeneration:8});
  assert.equal(result.failed,1);assert.match(result.results[0].reason,/safe_png_target/);
  const future=fixture(t);future.manifest.source_writer_generation=9;fs.writeFileSync(path.join(future.dir,'manifest.json'),JSON.stringify(future.manifest));
  result=consumeImageChunkRequests({runRoot:future.root,executionId:future.executionId,branch:future.manifest.branch,writerGeneration:8});
  assert.equal(result.failed,1);assert.match(result.results[0].reason,/writer_generation/);
});
