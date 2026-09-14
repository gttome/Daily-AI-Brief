import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {normalizeUrl,sha256} from './util.mjs';
import {assertPrivateRoot,assertRunManifest} from './production-run.mjs';
import {visualPreflight} from './visual-recovery.mjs';

const VERSION='private-drafts-v1';
const inside=(parent,child)=>{const r=path.relative(parent,child);return r!==''&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r);};
function resolved(file){
 let cursor=path.resolve(file),tail=[];
 while(!fs.existsSync(cursor)){
  // A dangling link must not be treated as a missing ordinary path.
  try{if(fs.lstatSync(cursor).isSymbolicLink())throw Error('Dangling link');}catch(e){if(e.code!=='ENOENT')throw e;}
  tail.unshift(path.basename(cursor));const parent=path.dirname(cursor);if(parent===cursor)throw Error('Unresolvable path');cursor=parent;
 }
 return path.join(fs.realpathSync(cursor),...tail);
}
export function privateDraftPath({repo,manifest,file}){
 assertRunManifest(manifest);
 const root=assertPrivateRoot(repo,manifest.private_root,path.join(manifest.private_root,'manifest-boundary.json'));
 if(typeof file!=='string'||!path.isAbsolute(file))throw Error('Absolute private artifact path required');
 const target=resolved(file);
 if(!inside(root,target))throw Error('Draft artifacts must remain inside the private evidence root');
 return target;
}
function context({repo,manifest,draft}){
 assertRunManifest(manifest);
 if(!draft||!['writing','image'].includes(draft.kind)||typeof draft.draft_id!=='string'||!draft.draft_id.trim()||draft.draft_id.length>160||typeof draft.generation_instructions!=='string'||!draft.generation_instructions.trim())throw Error('Draft kind, identity and exact generation instructions required');
 const edition=JSON.parse(fs.readFileSync(path.join(repo,'_data/editions',manifest.edition_date+'.json'),'utf8'));
 const story=edition.stories.find(s=>s.story_id===draft.story_id),packet=draft.packet;
 if(edition.brief_date!==manifest.edition_date||!story||packet?.verification_status!=='reviewed'||!packet.source_content_hash||!packet.verified_claims?.length||normalizeUrl(packet.canonical_url)!==normalizeUrl(story.source.url))throw Error('Draft must match the selected story and reviewed source evidence');
 const policies=['docs/operations/publisher-runbook.md','_generator/lib/draft-recovery.mjs','_generator/lib/production-run.mjs','_tools/production-run.mjs'];
 if(draft.kind==='image')policies.push('docs/images/publisher-policy.md','_generator/lib/image-gate.mjs','_generator/lib/visual-recovery.mjs');
 const preflight=draft.kind==='image'?visualPreflight(packet,draft.spec):null;
 return {version:VERSION,attempt_id:manifest.attempt_id,edition_id:edition.edition_id,edition_date:manifest.edition_date,cutoff:manifest.cutoff,article_window_hours:manifest.article_window_hours,window_reason:manifest.window_reason||null,kind:draft.kind,draft_id:draft.draft_id,story_id:story.story_id,story_hash:sha256(JSON.stringify(story)),packet_hash:sha256(JSON.stringify(packet)),instructions_hash:sha256(draft.generation_instructions),preflight_hash:preflight?sha256(JSON.stringify(preflight)):null,policy_hash:sha256(policies.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n'))};
}
function storage(args){
 const dir=privateDraftPath({...args,file:path.join(args.manifest.private_root,args.manifest.attempt_id,'draft-archive')});
 return dir;
}
function artifact(args){
 const file=privateDraftPath({...args,file:args.draft.artifact_path}),archive=storage(args);
 if(file===archive||inside(archive,file))throw Error('Working draft must stay outside the immutable archive');
 return file;
}
function readArtifact(file,kind){
 const stat=fs.lstatSync(file);if(!stat.isFile()||stat.size===0||stat.size>25*1024*1024)throw Error('Nonempty bounded draft file required');
 const bytes=fs.readFileSync(file);
 if(kind==='image'&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Image drafts must be PNG files');
 if(kind==='writing')new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 return bytes;
}
export function saveDraft(args){
 const binding=context(args),file=artifact(args),bytes=readArtifact(file,args.draft.kind),review=args.draft.review;
 if(!review||!['pending','needs_revision','rejected'].includes(review.status)||typeof review.notes!=='string')throw Error('Explicit unfinished review state and notes required; draft storage grants no approval');
 const evidence={packet:args.draft.packet,generation_instructions:args.draft.generation_instructions,spec:args.draft.spec||null,review};
 const evidenceBytes=Buffer.from(JSON.stringify(evidence,null,2)+'\n');
 const body={...binding,artifact_hash:sha256(bytes),evidence_hash:sha256(evidenceBytes),review_status:review.status,saved_at:new Date().toISOString(),approval:'not_granted',requires_final_gates:true};
 const checkpoint=sha256(JSON.stringify(body)),dir=storage(args);
 fs.mkdirSync(dir,{recursive:true});
 const temp=path.join(dir,'.pending-'+randomUUID()),final=path.join(dir,checkpoint);
 if(fs.existsSync(final)){
  if(recoverDraft({...args,checkpoint}).state!=='recoverable_draft')throw Error('Existing immutable checkpoint is invalid');
  return {checkpoint,state:'saved_draft',review_status:review.status,approval:'not_granted',requires_final_gates:true};
 }
 fs.mkdirSync(temp);fs.writeFileSync(path.join(temp,'artifact'),bytes,{flag:'wx'});fs.writeFileSync(path.join(temp,'evidence.json'),evidenceBytes,{flag:'wx'});fs.writeFileSync(path.join(temp,'record.json'),JSON.stringify({...body,record_hash:checkpoint},null,2)+'\n',{flag:'wx'});
 fs.renameSync(temp,final);
 return {checkpoint,state:'saved_draft',review_status:review.status,approval:'not_granted',requires_final_gates:true};
}
export function recoverDraft(args){
 try{
  if(!/^[a-f0-9]{64}$/.test(args.checkpoint||''))throw Error('Invalid checkpoint');
  const binding=context(args),archive=storage(args),dir=path.join(archive,args.checkpoint);
  if(fs.lstatSync(dir).isSymbolicLink())throw Error('Linked checkpoint');
  for(const name of ['record.json','artifact','evidence.json']){
   const f=path.join(dir,name);if(fs.lstatSync(f).isSymbolicLink()||privateDraftPath({...args,file:f})!==path.resolve(f))throw Error('Linked checkpoint artifact');
  }
  const {record_hash,...r}=JSON.parse(fs.readFileSync(path.join(dir,'record.json'),'utf8'));
  if(record_hash!==args.checkpoint||record_hash!==sha256(JSON.stringify(r)))throw Error('Record integrity failure');
  if(Object.entries(binding).some(([key,value])=>r[key]!==value))return {state:'requires_review',reason:'story_evidence_instructions_or_policy_changed',approval:'not_granted'};
  const bytes=readArtifact(path.join(dir,'artifact'),args.draft.kind),evidenceBytes=fs.readFileSync(path.join(dir,'evidence.json'));
  if(sha256(bytes)!==r.artifact_hash||sha256(evidenceBytes)!==r.evidence_hash||r.approval!=='not_granted'||r.requires_final_gates!==true)throw Error('Artifact integrity failure');
  const evidence=JSON.parse(evidenceBytes);
  if(!['pending','needs_revision','rejected'].includes(r.review_status)||evidence.review.status!==r.review_status)throw Error('Invalid review state');
  const target=artifact(args);
  if(fs.existsSync(target)&&sha256(fs.readFileSync(target))!==r.artifact_hash)return {state:'requires_review',reason:'working_draft_differs',approval:'not_granted'};
  let restored=false;
  if(args.restore&&!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});restored=true;}
  return {state:'recoverable_draft',review_status:r.review_status,restored,approval:'not_granted',requires_final_gates:true,evidence_file:path.join(dir,'evidence.json'),freshness:'must_be_rechecked_before_publication'};
 }catch{return {state:'requires_review',reason:'missing_invalid_or_unsafe_checkpoint',approval:'not_granted'};}
}
