import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const IMAGE_CHUNK_BRIDGE_SCHEMA = 'image-base64-chunk-bridge-v1';
export const IMAGE_CHUNK_RESULT_SCHEMA = 'image-base64-chunk-bridge-result-v1';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CHUNKS = 96;
const MAX_CHUNK_CHARS = 65_536;

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBlobSha = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value);

function pngDimensions(bytes) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.length < 24 || !bytes.subarray(0,8).equals(signature) || bytes.toString('ascii',12,16) !== 'IHDR')
    throw Error('valid_png_required');
  const width=bytes.readUInt32BE(16), height=bytes.readUInt32BE(20);
  if (!width || !height || width > 10_000 || height > 10_000) throw Error('valid_png_dimensions_required');
  return {width,height};
}

function safeTarget(target, executionKey) {
  if (typeof target !== 'string' || target.includes('\\') || target.includes('..') || path.posix.isAbsolute(target))
    throw Error('safe_png_target_required');
  const date=executionKey.slice(0,10);
  const finalPrefix=`briefs/images/${date}/`;
  const attemptPrefix=`_records/image-attempts/${executionKey}/`;
  if (!(target.startsWith(finalPrefix) || target.startsWith(attemptPrefix)) || !target.endsWith('.png'))
    throw Error('approved_png_target_required');
  return target;
}

function validateManifest(manifest,{executionId,branch,writerGeneration}) {
  if (manifest?.schema_version !== IMAGE_CHUNK_BRIDGE_SCHEMA) throw Error('chunk_bridge_schema');
  if (manifest.execution_id !== executionId || manifest.branch !== branch) throw Error('chunk_bridge_identity');
  if (!/^\d{4}-\d{2}-\d{2}-run\d+$/.test(manifest.execution_key||'')) throw Error('chunk_bridge_execution_key');
  if (!safeId(manifest.request_id) || !/^1[1-6]$/.test(String(manifest.task_id||''))) throw Error('chunk_bridge_request_identity');
  if (!Number.isInteger(manifest.source_writer_generation) || manifest.source_writer_generation < 1 ||
      manifest.source_writer_generation > writerGeneration) throw Error('chunk_bridge_writer_generation');
  if (!Number.isInteger(manifest.bytes) || manifest.bytes < 24 || manifest.bytes > MAX_BYTES) throw Error('chunk_bridge_byte_count');
  if (!/^[0-9a-f]{64}$/.test(manifest.sha256||'') || !/^[0-9a-f]{40}$/.test(manifest.git_blob_sha||''))
    throw Error('chunk_bridge_content_identity');
  if (!Array.isArray(manifest.chunks) || !manifest.chunks.length || manifest.chunks.length > MAX_CHUNKS)
    throw Error('chunk_bridge_chunks');
  safeTarget(manifest.target_path,manifest.execution_key);
  return manifest;
}

function decodeChunks(requestDir,manifest) {
  let joined='';
  for (let index=0;index<manifest.chunks.length;index++) {
    const entry=manifest.chunks[index], expected=`chunk-${String(index).padStart(4,'0')}.b64`;
    if (!entry || entry.file!==expected || !/^[0-9a-f]{64}$/.test(entry.sha256||'')) throw Error('chunk_bridge_chunk_manifest');
    const text=fs.readFileSync(path.join(requestDir,entry.file),'utf8');
    if (!text.length || text.length>MAX_CHUNK_CHARS || !/^[A-Za-z0-9+/=]+$/.test(text) || sha256(Buffer.from(text,'utf8'))!==entry.sha256)
      throw Error('chunk_bridge_chunk_identity');
    joined+=text;
  }
  if (joined.length%4!==0) throw Error('chunk_bridge_base64_length');
  const bytes=Buffer.from(joined,'base64');
  if (bytes.toString('base64')!==joined) throw Error('chunk_bridge_noncanonical_base64');
  return bytes;
}

export function consumeImageChunkRequests({runRoot,executionId,branch,writerGeneration,now=()=>new Date().toISOString()}={}) {
  if (!runRoot || !safeId(executionId) || typeof branch!=='string' || !Number.isInteger(writerGeneration) || writerGeneration<1)
    throw Error('valid_chunk_bridge_consumer_required');
  const root=path.resolve(runRoot);
  const requestsRoot=path.join(root,'_records/edition-execution/image-transport-requests',executionId);
  const resultsRoot=path.join(root,'_records/edition-execution/image-transport-results',executionId);
  if (!fs.existsSync(requestsRoot)) return {result:'NO_REQUESTS',processed:0,failed:0,results:[]};
  const results=[];
  for (const name of fs.readdirSync(requestsRoot).sort()) {
    if (!safeId(name)) continue;
    const requestDir=path.join(requestsRoot,name), manifestFile=path.join(requestDir,'manifest.json');
    if (!fs.statSync(requestDir).isDirectory() || !fs.existsSync(manifestFile)) continue;
    const resultFile=path.join(resultsRoot,`${name}.json`);
    if (fs.existsSync(resultFile)) { results.push(JSON.parse(fs.readFileSync(resultFile,'utf8'))); continue; }
    fs.mkdirSync(resultsRoot,{recursive:true});
    try {
      const manifest=validateManifest(JSON.parse(fs.readFileSync(manifestFile,'utf8')),{executionId,branch,writerGeneration});
      if (manifest.request_id!==name) throw Error('chunk_bridge_directory_identity');
      const bytes=decodeChunks(requestDir,manifest);
      if (bytes.length!==manifest.bytes || sha256(bytes)!==manifest.sha256 || gitBlobSha(bytes)!==manifest.git_blob_sha)
        throw Error('chunk_bridge_payload_identity');
      const dimensions=pngDimensions(bytes), target=path.join(root,manifest.target_path);
      if (fs.existsSync(target) && !fs.readFileSync(target).equals(bytes)) throw Error('immutable_image_conflict');
      fs.mkdirSync(path.dirname(target),{recursive:true});
      if (!fs.existsSync(target)) fs.writeFileSync(target,bytes);
      const readback=fs.readFileSync(target);
      if (!readback.equals(bytes)) throw Error('chunk_bridge_readback_mismatch');
      const receipt={schema_version:IMAGE_CHUNK_RESULT_SCHEMA,status:'PASS',request_id:name,execution_id:executionId,
        task_id:String(manifest.task_id),target_path:manifest.target_path,source_writer_generation:manifest.source_writer_generation,
        consumer_writer_generation:writerGeneration,bytes:bytes.length,sha256:sha256(bytes),git_blob_sha:gitBlobSha(bytes),
        width:dimensions.width,height:dimensions.height,content_address_verified:true,read_back_verified:true,
        temporary_chunks_removed:true,consumed_at:now()};
      fs.writeFileSync(resultFile,JSON.stringify(receipt,null,2)+'\n');
      fs.rmSync(requestDir,{recursive:true,force:true});
      results.push(receipt);
    } catch(error) {
      const receipt={schema_version:IMAGE_CHUNK_RESULT_SCHEMA,status:'BLOCKED',request_id:name,execution_id:executionId,
        consumer_writer_generation:writerGeneration,reason:error.message,consumed_at:now()};
      fs.writeFileSync(resultFile,JSON.stringify(receipt,null,2)+'\n');
      results.push(receipt);
    }
  }
  const failed=results.filter(x=>x.status!=='PASS').length;
  return {result:failed?'PARTIAL':'PASS',processed:results.length-failed,failed,results};
}
