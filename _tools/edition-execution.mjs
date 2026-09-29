#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {fileOperationStore, operationView} from '../_generator/lib/durable-operation.mjs';
import {canonicalExecutionStatus, renderExecutionCheckpoint, sealPublicationBundle, verifyPublicationBundle, promotionDecision, verifyAdmissionEvidence} from '../_generator/lib/edition-execution.mjs';

const a=parseArgs(process.argv.slice(2)), command=a._[0], root=path.resolve(a.root||'.');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(root,p),'utf8'));
function emit(result) {
  const text=JSON.stringify(result,null,2)+'\n';
  if(a.out){const out=path.resolve(a.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text,{flag:'wx'});}
  console.log(text);
}
try {
  if(command==='status') {
    if(a.qualification) {
      if(!/^\d{4}-\d{2}-\d{2}-Q\d+$/.test(a.qualification))throw Error('qualification_identity_required');
      const dir=path.join(root,'_records/qualification',a.qualification),terminal=path.join(dir,'result.json'),checkpoint=path.join(dir,'CONTINUATION-CHECKPOINT.md');
      const status=canonicalExecutionStatus({terminalResult:fs.existsSync(terminal)?read(terminal):null,
        checkpointText:fs.existsSync(checkpoint)?fs.readFileSync(checkpoint,'utf8'):''});
      emit(status);
      if(a.markdown)fs.writeFileSync(path.resolve(a.markdown),renderExecutionCheckpoint(status),{flag:'wx'});
    } else {
      const store=fileOperationStore(path.resolve(root,a.store||'_records/edition-execution'));
      emit(operationView(await store.load(a.key)));
    }
  } else if(command==='admission-check') {
    const proof=a.proof||'_records/execution-host/image-handoff-proof.json';
    if(!fs.existsSync(path.resolve(root,proof)))throw Error('CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');
    emit(verifyAdmissionEvidence(root,read(proof),{releaseSha:a.release}));
  } else if(command==='seal') {
    emit(sealPublicationBundle(root,a.manifest,{releaseSha:a.release,cutoff:a.cutoff}));
  } else if(command==='verify') {
    emit(verifyPublicationBundle(root,read(a.bundle)));
  } else if(command==='promotion-plan') {
    const bundle=read(a.bundle);verifyPublicationBundle(root,bundle);
    emit(promotionDecision(bundle,{targetReleaseSha:a.release,qualification:read(a.qualification),productionIdentity:a.production}));
  } else throw Error('expected_status_admission_check_seal_verify_or_promotion_plan');
} catch(error) {console.error(JSON.stringify({status:'blocked',code:error.message,public_closed:false}));process.exitCode=1;}
