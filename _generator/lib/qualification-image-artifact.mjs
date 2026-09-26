import crypto from 'node:crypto';
import fs from 'node:fs';

export const QUALIFICATION_IMAGE_ARTIFACT_COUNT=6;
export const QUALIFICATION_IMAGE_FORMATS=new Set(['png','webp']);

export function sha256Hex(bytes){
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function gitBlobSha(bytes){
  const header=Buffer.from(`blob ${bytes.length}\0`);
  return crypto.createHash('sha1').update(Buffer.concat([header,bytes])).digest('hex');
}

function readUInt24LE(bytes,offset){
  return bytes[offset] | (bytes[offset+1]<<8) | (bytes[offset+2]<<16);
}

export function imageDimensions(bytes){
  if(!Buffer.isBuffer(bytes)) bytes=Buffer.from(bytes);
  const pngSig='89504e470d0a1a0a';
  if(bytes.length>=24&&bytes.subarray(0,8).toString('hex')===pngSig){
    return {format:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  }
  if(bytes.length>=30&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP'){
    const chunk=bytes.subarray(12,16).toString('ascii');
    if(chunk==='VP8X'&&bytes.length>=30){
      return {format:'webp',width:1+readUInt24LE(bytes,24),height:1+readUInt24LE(bytes,27)};
    }
    if(chunk==='VP8L'&&bytes.length>=25&&bytes[20]===0x2f){
      const bits=bytes.readUInt32LE(21);
      return {format:'webp',width:1+(bits&0x3fff),height:1+((bits>>>14)&0x3fff)};
    }
    if(chunk==='VP8 '&&bytes.length>=30){
      return {format:'webp',width:bytes.readUInt16LE(26)&0x3fff,height:bytes.readUInt16LE(28)&0x3fff};
    }
  }
  throw new Error('qualification_image_format_or_dimensions_unsupported');
}

export function validateQualificationImageArtifactManifest(manifest,{runId,readFile=(p)=>fs.readFileSync(p)}={}){
  if(!runId||!/^\d{4}-\d{2}-\d{2}-Q(?:[1-9]|[12]\d|3\d|40)$/.test(runId))throw new Error('qualification_image_run_id_invalid');
  if(!manifest||manifest.schema_version!=='1.0.0')throw new Error('qualification_image_artifact_manifest_schema_invalid');
  if(manifest.run_id!==runId)throw new Error('qualification_image_artifact_manifest_run_mismatch');
  if(manifest.execution_mode!=='qualification_nonproduction')throw new Error('qualification_image_artifact_execution_mode_invalid');
  if(!Array.isArray(manifest.artifacts)||manifest.artifacts.length!==QUALIFICATION_IMAGE_ARTIFACT_COUNT)throw new Error('qualification_image_artifact_count_invalid');
  const candidates=new Set(),hashes=new Set(),blobs=new Set();
  for(const a of manifest.artifacts){
    if(!a||typeof a.candidate_id!=='string'||typeof a.story_id!=='string')throw new Error('qualification_image_artifact_lineage_missing');
    if(candidates.has(a.candidate_id))throw new Error('qualification_image_artifact_candidate_duplicate:'+a.candidate_id);
    candidates.add(a.candidate_id);
    if(a.accepted_locked!==true)throw new Error('qualification_image_artifact_not_locked:'+a.candidate_id);
    if(a.fallback!==false)throw new Error('qualification_image_artifact_fallback_forbidden:'+a.candidate_id);
    for(const gate of ['subject_identity','factual_support','structural_quality','editorial_quality'])if(a[gate]!=='pass')throw new Error('qualification_image_artifact_gate_failed:'+a.candidate_id+':'+gate);
    if(a.transport_method!=='same_worker_exact_binary_capture')throw new Error('qualification_image_artifact_transport_invalid:'+a.candidate_id);
    const prefix=`_records/qualification/${runId}/images/`;
    if(typeof a.path!=='string'||!a.path.startsWith(prefix))throw new Error('qualification_image_artifact_path_invalid:'+a.candidate_id);
    if(!/^[a-f0-9]{64}$/.test(a.sha256||''))throw new Error('qualification_image_artifact_sha256_invalid:'+a.candidate_id);
    if(!/^[a-f0-9]{40}$/.test(a.git_blob_sha||''))throw new Error('qualification_image_artifact_blob_sha_invalid:'+a.candidate_id);
    const bytes=Buffer.from(readFile(a.path));
    const sha=sha256Hex(bytes),blob=gitBlobSha(bytes),dims=imageDimensions(bytes);
    if(sha!==a.sha256)throw new Error('qualification_image_artifact_sha256_mismatch:'+a.candidate_id);
    if(blob!==a.git_blob_sha)throw new Error('qualification_image_artifact_blob_sha_mismatch:'+a.candidate_id);
    if(dims.width!==a.width||dims.height!==a.height||dims.format!==a.format)throw new Error('qualification_image_artifact_dimensions_mismatch:'+a.candidate_id);
    if(!QUALIFICATION_IMAGE_FORMATS.has(a.format))throw new Error('qualification_image_artifact_format_invalid:'+a.candidate_id);
    if(hashes.has(sha)||blobs.has(blob))throw new Error('qualification_image_artifact_bytes_not_unique:'+a.candidate_id);
    hashes.add(sha);blobs.add(blob);
  }
  return {valid:true,run_id:runId,accepted_locked:manifest.artifacts.length,candidate_ids:[...candidates].sort()};
}
