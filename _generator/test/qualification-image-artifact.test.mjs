import assert from 'node:assert/strict';
import test from 'node:test';
import {gitBlobSha,sha256Hex,validateQualificationImageArtifactManifest} from '../lib/qualification-image-artifact.mjs';

const runId='2026-09-26-Q11';
const base=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB','base64');

function fixture(){
  const files=new Map();
  const artifacts=[];
  for(let i=0;i<6;i++){
    const candidate_id='m0'+(i+1);
    const path='_records/qualification/'+runId+'/images/'+candidate_id+'.png';
    const bytes=Buffer.concat([base,Buffer.from(String(i))]);
    files.set(path,bytes);
    artifacts.push({candidate_id,story_id:'story-'+candidate_id,path,sha256:sha256Hex(bytes),git_blob_sha:gitBlobSha(bytes),width:1,height:1,format:'png',transport_method:'same_worker_exact_binary_capture',subject_identity:'pass',factual_support:'pass',structural_quality:'pass',editorial_quality:'pass',accepted_locked:true,fallback:false});
  }
  return {manifest:{schema_version:'1.0.0',run_id:runId,execution_mode:'qualification_nonproduction',artifacts},readFile:(p)=>files.get(p)};
}

test('exact qualification image artifacts validate',()=>{
  const f=fixture();
  assert.equal(validateQualificationImageArtifactManifest(f.manifest,{runId,readFile:f.readFile}).accepted_locked,6);
});

test('byte drift fails closed',()=>{
  const f=fixture();
  f.manifest.artifacts[0].sha256='0'.repeat(64);
  assert.throws(()=>validateQualificationImageArtifactManifest(f.manifest,{runId,readFile:f.readFile}),/sha256_mismatch/);
});

test('unlocked artifact fails closed',()=>{
  const f=fixture();
  f.manifest.artifacts[0].accepted_locked=false;
  assert.throws(()=>validateQualificationImageArtifactManifest(f.manifest,{runId,readFile:f.readFile}),/not_locked/);
});
