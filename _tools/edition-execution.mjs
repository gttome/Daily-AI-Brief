#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {fileOperationStore, operationView} from '../_generator/lib/durable-operation.mjs';
import {canonicalExecutionStatus, renderExecutionCheckpoint, sealPublicationBundle, verifyPublicationBundle, promotionDecision, verifyAdmissionEvidence, verifyDirectCaptureAdmission, DIRECT_IMAGE_CAPTURE_ADMISSION, deriveImageProgress, applyDerivedImageProgress, summarizeImagePerformance} from '../_generator/lib/edition-execution.mjs';

const a=parseArgs(process.argv.slice(2)), command=a._[0], root=path.resolve(a.root||'.');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(root,p),'utf8'));
function emit(result) {
  const text=JSON.stringify(result,null,2)+'\n';
  if(a.out){const out=path.resolve(a.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text,{flag:'wx'});}
  console.log(text);
}

function scanImageEvidence(state) {
  const ids=state.completed?.editorial?.selected_candidate_ids;
  if(!Array.isArray(ids)||!ids.length)throw Error('editorial_image_order_required');
  const base=path.join(root,'_records','edition-execution','live',state.edition.edition_id,'images');
  const resultsByCandidate={},bindingsByCandidate={};
  for(const id of ids){
    resultsByCandidate[id]=[];bindingsByCandidate[id]=[];
    const dir=path.join(base,id);
    if(!fs.existsSync(dir))continue;
    for(const name of fs.readdirSync(dir).filter(n=>/^attempt-\d+$/.test(n)).sort()){
      const attemptDir=path.join(dir,name);
      const result=path.join(attemptDir,'result.json'),binding=path.join(attemptDir,'operation-binding.json');
      if(fs.existsSync(result))resultsByCandidate[id].push(read(path.relative(root,result)));
      if(fs.existsSync(binding))bindingsByCandidate[id].push(read(path.relative(root,binding)));
    }
  }
  return {ids,resultsByCandidate,bindingsByCandidate};
}
function writeJsonAtomic(file,value){
  const target=path.resolve(root,file),temp=target+'.tmp';
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');
  fs.renameSync(temp,target);
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
    if(a.mode===DIRECT_IMAGE_CAPTURE_ADMISSION){
      emit(verifyDirectCaptureAdmission({releaseSha:a.release}));
    } else {
      const proof=a.proof||'_records/execution-host/image-handoff-proof.json';
      if(!fs.existsSync(path.resolve(root,proof)))throw Error('CAPABILITY_BLOCKED_NATIVE_RESULT_HANDOFF');
      emit(verifyAdmissionEvidence(root,read(proof),{releaseSha:a.release}));
    }
  } else if(command==='seal') {
    emit(sealPublicationBundle(root,a.manifest,{releaseSha:a.release,cutoff:a.cutoff}));
  } else if(command==='verify') {
    emit(verifyPublicationBundle(root,read(a.bundle)));
  } else if(command==='promotion-plan') {
    const bundle=read(a.bundle);verifyPublicationBundle(root,bundle);
    emit(promotionDecision(bundle,{targetReleaseSha:a.release,qualification:read(a.qualification),productionIdentity:a.production}));
  } else if(command==='image-progress') {
    if(!a.state)throw Error('controller_state_path_required');
    const state=read(a.state),evidence=scanImageEvidence(state);
    const progress=deriveImageProgress({selectedCandidateIds:evidence.ids,
      resultsByCandidate:evidence.resultsByCandidate,bindingsByCandidate:evidence.bindingsByCandidate});
    const performance=summarizeImagePerformance(evidence.resultsByCandidate);
    let reconciled=false;
    if(a.write==='true'){
      const next=applyDerivedImageProgress(state,progress);
      const changed=JSON.stringify(next.task06)!==JSON.stringify(state.task06)||next.current_operation!==state.current_operation;
      if(changed){
        next.version=(Number.isInteger(state.version)?state.version:0)+1;
        next.updated_at=new Date().toISOString();
        writeJsonAtomic(a.state,next);
        reconciled=true;
      }
    }
    emit({progress,performance,state_reconciled:reconciled});
  } else throw Error('expected_status_admission_check_seal_verify_promotion_plan_or_image_progress');
} catch(error) {console.error(JSON.stringify({status:'blocked',code:error.message,public_closed:false}));process.exitCode=1;}
