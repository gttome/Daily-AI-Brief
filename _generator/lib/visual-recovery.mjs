import fs from 'node:fs';import path from 'node:path';import {normalizeUrl,sha256} from './util.mjs';import {saveJson} from './production-run.mjs';import {reviewedImages} from './image-gate.mjs';
const policyHash=repo=>sha256(['docs/images/publisher-policy.md','_generator/lib/visual-recovery.mjs','_generator/lib/image-gate.mjs'].map(p=>fs.readFileSync(path.join(repo,p),'utf8')).join('\n'));
export function visualPreflight(packet,spec){
 if(packet?.verification_status!=='reviewed'||!packet.source_content_hash||!packet.verified_claims?.length)throw Error('Reviewed story packet required');
 const review=spec?.review;
 if(!review||review.status!=='reviewed'||!review.reviewer||!Number.isFinite(Date.parse(review.reviewed_at))||!['mechanism','labels','availability','composition'].every(k=>review.checks?.[k]===true))throw Error('Explicit mechanism, label, availability and composition review required');
 if(!spec.mechanism?.trim()||!spec.composition?.trim()||!Array.isArray(spec.labels)||!spec.labels.length||!Array.isArray(spec.relationships)||!spec.relationships.length||!Array.isArray(spec.prohibited_implications)||!spec.prohibited_implications.length)throw Error('Complete visual brief required');
 for(const x of [...spec.labels,...spec.relationships])if(!Number.isInteger(x.claim_index)||!packet.verified_claims[x.claim_index])throw Error('Labels and relationships must reference reviewed claims');
 if(spec.relationships.some(x=>!['current','planned','unknown'].includes(x.status)))throw Error('Explicit current/planned status required');
 return {schema_version:'1.0.0',candidate_id:packet.candidate_id,packet_hash:sha256(JSON.stringify(packet)),source_content_hash:packet.source_content_hash,mechanism:spec.mechanism,composition:spec.composition,labels:spec.labels,relationships:spec.relationships,prohibited_implications:spec.prohibited_implications,limitations:packet.limitations||[],availability:packet.availability||null,claims:packet.verified_claims,review,image_approval:'not_granted_by_preflight'};
}
export function saveApprovedImages({edition,repo,root,preflights}){
 const gate=reviewedImages(edition,repo);if(gate.errors.length)throw Error(gate.errors.join('; '));
 if(preflights.length!==6||new Set(preflights.map(x=>x.story_id)).size!==6||new Set(preflights.map(x=>x.preflight.composition.trim().toLowerCase())).size!==6)throw Error('Six distinct story preflights required');
 const saved=[];
 for(const story of edition.stories){const item=preflights.find(x=>x.story_id===story.story_id);if(!item||normalizeUrl(item.packet.canonical_url)!==normalizeUrl(story.source.url)||item.preflight.packet_hash!==sha256(JSON.stringify(item.packet))||JSON.stringify(visualPreflight(item.packet,item.preflight))!==JSON.stringify(item.preflight))throw Error('Preflight does not match current story evidence');
  const key=sha256(edition.edition_id+'|'+story.story_id),dir=path.join(root,'approved-images',key);fs.mkdirSync(dir,{recursive:true});
  if(fs.existsSync(path.join(dir,'record.json'))){const old=fs.readFileSync(path.join(dir,'record.json')),history=path.join(dir,'history',sha256(old));if(!fs.existsSync(history)){fs.mkdirSync(history,{recursive:true});for(const name of ['record.json','review.json','image.png'])fs.copyFileSync(path.join(dir,name),path.join(history,name));}}
  const asset=gate.assets.find(x=>x.path===story.image.path);fs.copyFileSync(path.join(repo,asset.path),path.join(dir,'image.png'));fs.copyFileSync(path.join(repo,gate.review_path),path.join(dir,'review.json'));
  const record={policy_hash:policyHash(repo),edition_id:edition.edition_id,story_id:story.story_id,story_hash:sha256(JSON.stringify(story)),packet_hash:sha256(JSON.stringify(item.packet)),preflight_hash:sha256(JSON.stringify(item.preflight)),asset_hash:asset.sha256,review_hash:gate.review_sha256,review_path:gate.review_path,asset_path:asset.path};
  saveJson(path.join(dir,'record.json'),{...record,record_hash:sha256(JSON.stringify(record))});saved.push({story_id:story.story_id,checkpoint:key});
 }return saved;
}
export function imageRecovery({edition,story,packet,preflight,repo,root,restore=false}){
 const dir=path.join(root,'approved-images',sha256(edition.edition_id+'|'+story.story_id));
 try{const {record_hash,...r}=JSON.parse(fs.readFileSync(path.join(dir,'record.json'))),bytes=fs.readFileSync(path.join(dir,'image.png'));
  if(r.policy_hash!==policyHash(repo)||record_hash!==sha256(JSON.stringify(r))||r.edition_id!==edition.edition_id||r.story_id!==story.story_id||r.story_hash!==sha256(JSON.stringify(story))||r.packet_hash!==sha256(JSON.stringify(packet))||r.preflight_hash!==sha256(JSON.stringify(preflight))||preflight.packet_hash!==r.packet_hash||r.asset_path!==story.image.path||sha256(bytes)!==r.asset_hash||sha256(fs.readFileSync(path.join(dir,'review.json')))!==r.review_hash)return {state:'requires_review',reason:'evidence_or_approved_artifact_changed'};
  const latest=reviewedImages(edition,repo);if(latest.review_sha256&&latest.review_sha256!==r.review_hash)return {state:'requires_review',reason:'visual_approval_changed'};
  const target=path.resolve(repo,r.asset_path);if(!target.startsWith(path.resolve(repo)+path.sep)||!r.asset_path.startsWith('briefs/images/'+edition.brief_date+'/'))throw Error('Unsafe asset path');
  if(fs.existsSync(target)&&sha256(fs.readFileSync(target))!==r.asset_hash)return {state:'requires_review',reason:'working_image_differs'};
  const missing=!fs.existsSync(target);
  if(restore&&missing){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}
  return {state:'reusable',asset:r.asset_path,restored:restore&&missing,requires_final_publication_gate:true};
 }catch{return {state:'requires_review',reason:'missing_or_invalid_checkpoint'};}
}
