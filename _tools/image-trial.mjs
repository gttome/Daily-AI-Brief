#!/usr/bin/env node
// A file/receipt harness for the existing capture -> review -> exact-persistence path.
// It cannot generate images, review pixels, or certify unattended production itself.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {inspectHandoffAsset} from '../_generator/lib/image-gate.mjs';
import {visualReviewErrors,visualReviewAccepted} from '../_generator/lib/image-review-evidence.mjs';
const [command,...rest]=process.argv.slice(2),a=Object.fromEntries(rest.reduce((v,k,i)=>i%2?v:[...v,[k.replace(/^--/,''),rest[i+1]]],[]));
const root=path.resolve(a.root||'_records/image-trials/2026-10-02-six-image');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const now=()=>new Date().toISOString(),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function immutable(p,x){const t=JSON.stringify(x,null,2)+'\n';fs.mkdirSync(path.dirname(p),{recursive:true});if(fs.existsSync(p)){if(fs.readFileSync(p,'utf8')!==t)throw Error('immutable_record_conflict:'+p);return;}fs.writeFileSync(p,t,{flag:'wx'});}
try {
 if(command==='capture'){
  if(!/^m\d\d$/.test(a.candidate))throw Error('candidate_required');
  const dir=path.join(root,a.candidate);fs.mkdirSync(dir,{recursive:true});
  if(fs.existsSync(path.join(dir,'capture.json')))throw Error('already_captured_resume_existing_files');
  const raw=fs.readFileSync(a.raw),final=fs.readFileSync(a.final),inspection=inspectHandoffAsset(final,'.png');
  if(!inspection.pass||inspection.width!==1200||inspection.height!==630)throw Error('canvas_invalid');
  const started=Date.parse(a.started),ended=Date.parse(a.ended);
  if(!Number.isFinite(started)||!Number.isFinite(ended)||ended<started)throw Error('actual_generation_times_required');
  for(const [file,b] of [['raw.png',raw],['final.png',final]])fs.writeFileSync(path.join(dir,file),b,{flag:'wx'});
  immutable(path.join(dir,'capture.json'),{schema_version:'image-trial-capture-v1',candidate_id:a.candidate,execution_mode:'development_trial',trigger:'active_chat',tool:'built-in image_gen',source_artifact:a.artifact,request_sha256:hash(fs.readFileSync(a.prompt)),generation_started_at:a.started,generation_finished_at:a.ended,generation_seconds:(ended-started)/1000,captured_at:now(),raw:{sha256:hash(raw),git_blob_sha:blob(raw),bytes:raw.length},final:{sha256:hash(final),git_blob_sha:blob(final),bytes:final.length,width:1200,height:630},account_billing_observed:false,work_or_codex_session_used:true,paid_api_adapter_used:false});
  console.log(JSON.stringify(read(path.join(dir,'capture.json'))));
 } else if(command==='review'){
  const dir=path.join(root,a.candidate),c=read(path.join(dir,'capture.json')),r=read(a.evidence),bytes=fs.readFileSync(path.join(dir,'final.png'));
  const errors=visualReviewErrors(r,hash(bytes));if(c.final.sha256!==hash(bytes))errors.push('captured_bytes_changed');
  if(Date.parse(r.reviewed_at)<Date.parse(c.captured_at))errors.push('review_before_saved_capture');
  if(errors.length)throw Error(errors.join(';'));immutable(path.join(dir,'review.json'),r);
  console.log(JSON.stringify({quality:visualReviewAccepted(r,c.final.sha256)?'ACCEPT':'REJECT',candidate:a.candidate}));
 } else if(command==='verify'){
  const dir=path.join(root,a.candidate),c=read(path.join(dir,'capture.json')),r=read(path.join(dir,'review.json')),p=read(a.persistence);
  for(const k of ['raw','final']){const b=fs.readFileSync(path.join(dir,k+'.png'));if(hash(b)!==c[k].sha256||blob(b)!==p[k+'_git_blob_sha'])throw Error('exact_byte_identity_failed:'+k);}
  if(!visualReviewAccepted(r,c.final.sha256))throw Error('quality_not_accepted');
  if(!/^[a-f0-9]{40}$/.test(p.commit_sha)||p.tree_binding_verified!==true)throw Error('committed_tree_binding_required');
  immutable(path.join(dir,'persistence.json'),p);
  console.log(JSON.stringify({candidate:a.candidate,status:'TRIAL_ACCEPTED',production_authorized:false}));
 } else if(command==='summary'){
  const rows=fs.readdirSync(root).filter(x=>/^m\d\d$/.test(x)).sort().map(id=>{const dir=path.join(root,id),c=read(path.join(dir,'capture.json')),r=read(path.join(dir,'review.json')),p=read(path.join(dir,'persistence.json'));for(const kind of ['raw','final']){const b=fs.readFileSync(path.join(dir,kind+'.png'));if(hash(b)!==c[kind].sha256||blob(b)!==p[kind+'_git_blob_sha'])throw Error('saved_trial_bytes_changed:'+id+':'+kind);}
    if(hash(fs.readFileSync(path.join(root,id+'-prompt.txt')))!==c.request_sha256)throw Error('trial_prompt_changed:'+id);
    if(!visualReviewAccepted(r,c.final.sha256))throw Error('quality_not_accepted');return {candidate_id:id,generation_seconds:c.generation_seconds,capture_delay_seconds:(Date.parse(c.captured_at)-Date.parse(c.generation_finished_at))/1000,review_wait_seconds:(Date.parse(r.reviewed_at)-Date.parse(c.captured_at))/1000,transfer_wait_seconds:(Date.parse(p.verified_at)-Date.parse(r.reviewed_at))/1000,total_seconds:(Date.parse(p.verified_at)-Date.parse(c.generation_started_at))/1000,attempts:1+fs.readdirSync(root).filter(x=>x.startsWith(id+'-attempt')).length,prior_generation_seconds:fs.readdirSync(root).filter(x=>x.startsWith(id+'-attempt')).reduce((n,x)=>n+read(path.join(root,x,'capture.json')).generation_seconds,0),sha256:c.final.sha256,commit_sha:p.commit_sha};});
  if(rows.length!==6||new Set(rows.map(r=>r.sha256)).size!==6)throw Error('six_unique_images_required');
  for(const row of rows){const id=row.candidate_id,dir=path.join(root,id),c=read(path.join(dir,'capture.json')),p=read(path.join(dir,'persistence.json'));const captures=[c,...fs.readdirSync(root).filter(x=>x.startsWith(id+'-attempt')).map(x=>read(path.join(root,x,'capture.json')))];row.first_generation_started_at=captures.map(x=>x.generation_started_at).sort()[0];row.saved_at=p.verified_at;row.accepted_attempt_seconds=row.total_seconds;row.total_seconds=(Date.parse(p.verified_at)-Date.parse(row.first_generation_started_at))/1000;row.all_generation_seconds=captures.reduce((n,x)=>n+x.generation_seconds,0);}
  const started=rows.map(r=>r.first_generation_started_at).sort()[0],finished=rows.map(r=>r.saved_at).sort().at(-1);
  const result={started_at:started,finished_at:finished,wall_seconds:(Date.parse(finished)-Date.parse(started))/1000,total_generation_seconds:rows.reduce((n,r)=>n+r.all_generation_seconds,0),generation_calls:rows.reduce((n,r)=>n+r.attempts,0),quality_rejections:rows.reduce((n,r)=>n+r.attempts-1,0),schema_version:'six-image-trial-v1',result:'SIX_IMAGES_ACCEPTED',execution_mode:'development_trial',production_authorized:false,unattended_generation_proven:false,zero_work_cost_proven:false,rows};
  immutable(path.join(root,'summary.json'),result);console.log(JSON.stringify(result,null,2));
 } else throw Error('Use capture, review, verify or summary');
}catch(e){console.error(e.message);process.exitCode=1;}
