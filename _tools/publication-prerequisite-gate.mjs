#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateIntegratedRepository} from '../_generator/lib/integrity.mjs';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';
import {parseOperationalLearningLedger,validateOperationalLearningReadiness} from '../_generator/lib/operational-learning.mjs';
import {productionCandidateSeparationErrors} from '../_generator/lib/branch-separation.mjs';
import {buildPublicationPrerequisiteGate,validatePublicationPrerequisiteGate} from '../_generator/lib/publication-prerequisite-gate.mjs';

const root=path.resolve(process.argv[2]||'_candidate_site');
const branch=process.env.STAGING_REF;
const executionId=process.env.EXECUTION_ID||JSON.parse(fs.readFileSync('data/operations/active-production-run.json','utf8')).execution_id;
if(!branch||!executionId||!fs.existsSync(root))throw Error('publication_prerequisite_gate_runtime_identity_required');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const exists=rel=>fs.existsSync(path.join(root,rel));
const blob=bytes=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
const h256=value=>'sha256:'+crypto.createHash('sha256').update(value).digest('hex');
const git=(cwd,args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8'}).trim();

const dates=fs.readdirSync(path.join(root,'_data/editions')).filter(x=>/^\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort();
const date=dates.at(-1).replace('.json',''),edition=read('_data/editions/'+date+'.json'),manifest=read('_records/editorial-handoff/publication-manifest.json');
const candidateSha=git(root,['rev-parse','HEAD']),mainSha=git('.', ['rev-parse','HEAD']);
const treeText=git(root,['ls-tree','-r','--full-tree','HEAD']);
const candidateDigest=h256(treeText+'\n');
let ancestry=true;try{execFileSync('git',['merge-base','--is-ancestor',mainSha,candidateSha],{stdio:'ignore'});}catch{ancestry=false;}
const changed=execFileSync('git',['diff','--name-only',mainSha,candidateSha],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const separation=productionCandidateSeparationErrors({branch,changed_paths:changed,baseline_main_sha:mainSha,current_main_sha:mainSha});

const errorsBy={},checks={};
errorsBy.candidate_identity=[];
if(edition.edition_id!==manifest.edition_id||manifest.edition_date!==date||manifest.staging_ref!==branch)errorsBy.candidate_identity.push('candidate_manifest_identity_mismatch');
checks.candidate_identity=errorsBy.candidate_identity.length===0;
checks.protected_main_ancestry=ancestry;errorsBy.protected_main_ancestry=ancestry?[]:['stale_protected_main_ancestry'];
checks.production_candidate_branch_separation=separation.length===0;errorsBy.production_candidate_branch_separation=separation;

errorsBy.publication_manifest=[];
if(manifest.schema_version!=='1.0.0'||manifest.manifest_kind!=='daily_ai_brief_publication'||manifest.seal?.immutable_artifact_digests!==true)errorsBy.publication_manifest.push('publication_manifest_contract_invalid');
checks.publication_manifest=errorsBy.publication_manifest.length===0;

errorsBy.sealed_artifact_digests=[];
for(const [name,a] of Object.entries(manifest.artifacts||{})){
  if(!a?.path||!exists(a.path)){errorsBy.sealed_artifact_digests.push('manifest_artifact_missing:'+name);continue;}
  if(/^git_blob_sha1:[a-f0-9]{40}$/.test(a.digest||'')){
    const actual=blob(fs.readFileSync(path.join(root,a.path)));
    if(a.digest!=='git_blob_sha1:'+actual)errorsBy.sealed_artifact_digests.push('manifest_artifact_digest_mismatch:'+name);
  } else errorsBy.sealed_artifact_digests.push('manifest_artifact_digest_invalid:'+name);
}
checks.sealed_artifact_digests=errorsBy.sealed_artifact_digests.length===0;

const imagePath=manifest.artifacts?.image_manifest?.path;
const images=imagePath&&exists(imagePath)?read(imagePath):{};
const entries=Object.values(images||{});
errorsBy.accepted_image_immutability=[];
if(entries.length!==6)errorsBy.accepted_image_immutability.push('six_accepted_images_required');
for(const entry of entries){
  if(entry?.accepted_locked!==true||entry?.lock_status!=='accepted_locked'||!entry?.path||!exists(entry.path))errorsBy.accepted_image_immutability.push('accepted_image_lock_invalid');
  else {
    const bytes=fs.readFileSync(path.join(root,entry.path)),sha=crypto.createHash('sha256').update(bytes).digest('hex'),b=blob(bytes);
    if(entry.sha256&&entry.sha256!==sha)errorsBy.accepted_image_immutability.push('accepted_image_sha_changed:'+entry.path);
    if(entry.git_blob_sha&&entry.git_blob_sha!==b)errorsBy.accepted_image_immutability.push('accepted_image_blob_changed:'+entry.path);
  }
}
checks.accepted_image_immutability=errorsBy.accepted_image_immutability.length===0;

errorsBy.watchlist_projection=[];
try{
  const canonical=read('_data/watchlist.json'),publicData=read('data/watchlist.json');
  if(JSON.stringify(publicWatchlist(canonical))!==JSON.stringify(publicData))errorsBy.watchlist_projection.push('watchlist_public_projection_mismatch');
  if(manifest.freeze?.watchlist?.public_projection_path!=='data/watchlist.json')errorsBy.watchlist_projection.push('watchlist_projection_path_unbound');
}catch(error){errorsBy.watchlist_projection.push('watchlist_projection_invalid:'+error.message);}
checks.watchlist_projection=errorsBy.watchlist_projection.length===0;

errorsBy.book_mappings=[];
const book=manifest.artifacts?.book_mappings?.path;
if(!book||!exists(book))errorsBy.book_mappings.push('book_mappings_missing');
checks.book_mappings=errorsBy.book_mappings.length===0;

errorsBy.operational_learning_input=[];
try{
  const ledger=fs.readFileSync(path.join(root,'data/operations/production-continuous-improvement-ledger.jsonl'),'utf8');
  parseOperationalLearningLedger(ledger);
  const ready=validateOperationalLearningReadiness({ledgerText:ledger,pathExists:p=>exists(p)});
  if(ready.result!=='PASS')errorsBy.operational_learning_input.push(...ready.errors.map(x=>'learning:'+x));
  const deltaRel='_records/run-learning/incidents/'+executionId+'.jsonl';
  if(exists(deltaRel)){
    const delta=parseOperationalLearningLedger(fs.readFileSync(path.join(root,deltaRel),'utf8'));
    if(delta.some(e=>e.run_id!==executionId))errorsBy.operational_learning_input.push('learning_delta_run_identity_mismatch');
  }
}catch(error){errorsBy.operational_learning_input.push('learning_input_invalid:'+error.message);}
checks.operational_learning_input=errorsBy.operational_learning_input.length===0;

const integrated=validateIntegratedRepository(edition,root);
errorsBy.reader_projection=integrated.filter(x=>!/accessib/i.test(x));checks.reader_projection=errorsBy.reader_projection.length===0;
errorsBy.accessibility=integrated.filter(x=>/accessib|alt text|broken_image/i.test(x));checks.accessibility=errorsBy.accessibility.length===0;

const routes=['/','/latest/','/briefs/'+date+'/','/archive/','/feed.json','/feed.xml',
  ...(edition.stories||[]).map(s=>'/stories/'+date+'/'+s.slug+'/')];
const routeFiles=['index.md','latest.md','briefs/'+date+'.md','archive.md','feed.json','feed.xml',
  ...(edition.stories||[]).map(s=>'stories/'+date+'/'+s.slug+'.md')];
errorsBy.archive_feed_routes=routeFiles.filter(p=>!exists(p)).map(p=>'required_route_missing:'+p);
checks.archive_feed_routes=errorsBy.archive_feed_routes.length===0&&routes.length>=12;
checks.candidate_frozen=Object.values(checks).every(Boolean);errorsBy.candidate_frozen=checks.candidate_frozen?[]:['candidate_not_freezable'];

const receipt=buildPublicationPrerequisiteGate({
  edition_id:edition.edition_id,execution_id:executionId,branch,candidate_sha:candidateSha,candidate_content_digest:candidateDigest,
  baseline_main_sha:mainSha,checks,errors_by_check:errorsBy,expected_deployment_routes:routes
});
const validation=validatePublicationPrerequisiteGate(receipt);
if(validation.length)throw Error('publication_prerequisite_receipt_invalid:'+validation.join(','));
fs.writeFileSync('/tmp/publication-prerequisite-gate.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
if(receipt.result!=='PASS')process.exitCode=1;
