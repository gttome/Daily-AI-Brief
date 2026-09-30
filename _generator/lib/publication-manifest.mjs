import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sha256} from './util.mjs';
import {publicWatchlist,validateWatchlist,watchlistDailyState,watchlistDailySummary} from './watchlist.mjs';
import {EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE,reviewedHandoffImages} from './image-gate.mjs';

export const PUBLICATION_MANIFEST_VERSION='1.0.0';
export const CONTRACT_FREEZE_DATE='2026-09-26';
export const PUBLICATION_MANIFEST_PATH='_records/editorial-handoff/publication-manifest.json';

const REQUIRED_ARTIFACTS=Object.freeze({
 kernel:{versions:['1.0.0']},
 facts:{adapter:'candidate-facts-map-v1'},
 metadata_candidates:{versions:['1.1.0']},
 article_evidence:{versions:['1.0.0']},
 media:{adapter:'selected-media-v1'},
 media_receipt:{versions:['1.0.0']},
 image_manifest:{adapter:'accepted-images-map-v1'},
 image_review:{adapter:'accepted-images-map-v1'},
 watchlist:{versions:['1.0.0']},
 watchlist_evidence:{versions:['1.0.0']},
 book_mappings:{versions:['1.0.0']}
});
export const SUPPORTED_PUBLICATION_MANIFEST_ADAPTERS=Object.freeze([
 'candidate-facts-map-v1','selected-media-v1','accepted-images-map-v1'
]);
const FUTURE_IMAGE_QUALITY_ARTIFACTS=Object.freeze({
 image_quality_evidence:{versions:['2.0.0']}
});

const safeRelative=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!p.split(/[\\/]+/).includes('..');
const jsonDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
const included=x=>['included','selected'].includes(x?.status);
const sameSet=(a,b)=>a.length===b.length&&[...a].sort().every((v,i)=>v===[...b].sort()[i]);
const daysBetween=(editionDate,itemDate)=>(Date.parse(editionDate+'T12:00:00Z')-Date.parse(itemDate+'T12:00:00Z'))/86400000;

export function gitBlobSha1(value){
 const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
}
export function publicationArtifactPath(manifest,name){
 const p=manifest?.artifacts?.[name]?.path;
 if(!safeRelative(p))throw Error('invalid_publication_manifest_artifact_path:'+name);
 return p;
}
export function publicationManifestContext(root,manifest){
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,publicationArtifactPath(manifest,name)),'utf8'));
 return {
  manifest,
  kernel:read('kernel'),
  facts:read('facts'),
  metadataCandidates:read('metadata_candidates'),
  articleEvidence:read('article_evidence'),
  media:read('media'),
  mediaReceipt:read('media_receipt'),
  imageManifest:read('image_manifest'),
  imageReview:read('image_review'),
  imageQualityEvidence:manifest?.artifacts?.image_quality_evidence?read('image_quality_evidence'):null,
  watchlist:read('watchlist'),
  watchlistEvidence:read('watchlist_evidence'),
  bookMappings:read('book_mappings')
 };
}
function artifactErrors(root,name,spec,rule){
 const errors=[];
 if(!spec||typeof spec!=='object')return ['publication_manifest_missing_artifact:'+name];
 if(!safeRelative(spec.path))return ['publication_manifest_invalid_artifact_path:'+name];
 const file=path.join(root,spec.path);
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return ['publication_manifest_artifact_missing:'+name];
 if(typeof spec.digest!=='string'||!/^git_blob_sha1:[a-f0-9]{40}$/.test(spec.digest))errors.push('publication_manifest_digest_required:'+name);
 else if(spec.digest!=='git_blob_sha1:'+gitBlobSha1(fs.readFileSync(file)))errors.push('publication_manifest_digest_mismatch:'+name);
 let data=null;
 try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch{errors.push('publication_manifest_artifact_json_invalid:'+name);return errors;}
 if(rule.adapter){
  if(spec.adapter!==rule.adapter||!SUPPORTED_PUBLICATION_MANIFEST_ADAPTERS.includes(spec.adapter))errors.push('publication_manifest_explicit_adapter_required:'+name);
  if(spec.schema_version!=='legacy-unversioned')errors.push('publication_manifest_legacy_schema_marker_required:'+name);
 }else{
  if(spec.adapter!==undefined&&spec.adapter!==null)errors.push('publication_manifest_unexpected_adapter:'+name);
  if(!rule.versions.includes(spec.schema_version)||data.schema_version!==spec.schema_version)errors.push('publication_manifest_schema_version_unsupported:'+name);
 }
 return errors;
}
function selectedMedia(media,date){
 const videoSlots=Object.entries(media?.worth_watching||{}).filter(([,item])=>included(item));
 const videos=videoSlots.map(([slot,item])=>({...item,_slot:slot,_receipt_id:'dab-video-'+date+'-'+(slot==='agents_non_technical_people'?'agent-skills':slot)}));
 const podcasts=(media?.podcasts||[]).filter(included);
 return {videos,podcasts};
}
function mediaErrors(ctx,date,{allowLegacyKernelHash=false}={}){
 const errors=[],{videos,podcasts}=selectedMedia(ctx.media,date),receipt=ctx.mediaReceipt;
 if(videos.length!==2)errors.push('publication_manifest_media_video_count_invalid');
 if(new Set(videos.map(x=>x._slot)).size!==2||!videos.some(x=>x._slot==='general')||!videos.some(x=>x._slot==='agents_non_technical_people'))errors.push('publication_manifest_media_focus_coverage_invalid');
 if(podcasts.length!==2)errors.push('publication_manifest_media_podcast_count_invalid');
 for(const item of videos){
  if(!/^https:\/\//.test(item.url||''))errors.push('publication_manifest_media_url_invalid:'+item._receipt_id);
  if(!jsonDate(item.upload_date)||!Number.isInteger(item.runtime_seconds)||item.runtime_seconds<=0||item.runtime_seconds>1200)errors.push('publication_manifest_video_metadata_incomplete:'+item._receipt_id);
  const age=daysBetween(date,item.upload_date);if(!Number.isFinite(age)||age<0||age>3)errors.push('publication_manifest_video_freshness_invalid:'+item._receipt_id);
 }
 for(const item of podcasts){
  if(!/^https:\/\//.test(item.url||'')||!jsonDate(item.publication_date))errors.push('publication_manifest_podcast_metadata_incomplete:'+String(item.item_id||item.title));
  const age=daysBetween(date,item.publication_date);
  if(!Number.isFinite(age)||age<0||age>30)errors.push('publication_manifest_podcast_freshness_invalid:'+String(item.item_id||item.title));
  if(age>2&&!String(item.freshness_exception_reason||'').trim())errors.push('publication_manifest_podcast_freshness_exception_required:'+String(item.item_id||item.title));
  if(item.runtime_seconds!==null&&item.runtime_seconds!==undefined&&(!Number.isInteger(item.runtime_seconds)||item.runtime_seconds<=0))errors.push('publication_manifest_podcast_runtime_invalid:'+String(item.item_id||item.title));
 }
 if(receipt?.edition_id!=='dab-edition-'+date||!Array.isArray(receipt?.items)||receipt.items.length!==4)errors.push('publication_manifest_media_receipt_invalid');
 const expected=[...videos.map(x=>({id:x._receipt_id,url:x.url,date:x.upload_date,runtime:x.runtime_seconds})),...podcasts.map(x=>({id:x.item_id,url:x.url,date:x.publication_date,runtime:x.runtime_seconds??null}))];
 for(const item of expected){
  const observed=(receipt?.items||[]).find(x=>x.item_id===item.id);
  if(!observed||observed.url!==item.url||observed.observed_date!==item.date||observed.observed_runtime_seconds!==(item.runtime??null)||observed.reachable!==true||observed.http_status!==200||!observed.verification_evidence||!observed.verification_timestamp)errors.push('publication_manifest_media_receipt_mismatch:'+String(item.id));
 }
 const kernelBytes=fs.readFileSync(path.join(ctx.root,publicationArtifactPath(ctx.manifest,'kernel')));
 if(receipt?.editorial_kernel_sha256!==sha256(kernelBytes)&&!allowLegacyKernelHash)errors.push('publication_manifest_media_kernel_digest_mismatch');
 if(receipt?.podcast_source_diversity?.pass!==true)errors.push('publication_manifest_media_source_diversity_invalid');
 return errors;
}
function imageErrors(root,ctx,{allowLegacyStoryIdentity=false}={}){
 const errors=[],ids=(ctx.kernel.stories||[]).map(x=>x.candidate_id),storyById=new Map((ctx.kernel.stories||[]).map(x=>[x.candidate_id,x]));
 for(const [label,data] of [['image_manifest',ctx.imageManifest],['image_review',ctx.imageReview]]){
  if(!sameSet(Object.keys(data||{}),ids))errors.push('publication_manifest_'+label+'_candidate_set_mismatch');
  for(const id of ids){
   const entry=data?.[id],story=storyById.get(id);
   if(!entry||entry.accepted_locked!==true||entry.lock_status!=='accepted_locked')errors.push('publication_manifest_'+label+'_not_locked:'+id);
   if(label==='image_review'){
    if(entry?.story_id!==story?.story_id&&!allowLegacyStoryIdentity)errors.push('publication_manifest_image_review_story_mismatch:'+id);
    if(!safeRelative(entry?.path)||!fs.existsSync(path.join(root,entry.path)))errors.push('publication_manifest_image_review_asset_missing:'+id);
   }
  }
 }
 if(ctx.manifest.edition_date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE){
  const edition={
   brief_date:ctx.manifest.edition_date,
   edition_id:ctx.manifest.edition_id,
   stories:(ctx.kernel.stories||[]).map(story=>{
    const entry=ctx.imageReview?.[story.candidate_id]||{};
    return {story_id:story.story_id,image:{path:entry.path,alt:story.visual?.alt_text||entry.alt,width:entry.width,height:entry.height}};
   })
  };
  const gated=reviewedHandoffImages(edition,root,publicationArtifactPath(ctx.manifest,'image_review'),{mode:'combined'});
  for(const error of gated.errors)errors.push('publication_manifest_image_quality:'+error);
  const evidencePath=publicationArtifactPath(ctx.manifest,'image_quality_evidence');
  if(gated.quality_evidence_path!==evidencePath)errors.push('publication_manifest_image_quality_evidence_path_mismatch');
 }
 return errors;
}
function watchlistErrors(root,ctx,date,freeze){
 const errors=[],watch=ctx.watchlist,sweep=ctx.watchlistEvidence;
 for(const e of validateWatchlist(watch))errors.push('publication_manifest_watchlist_invalid:'+e);
 if(watch?.edition_date!==date||sweep?.edition_date!==date)errors.push('publication_manifest_watchlist_date_mismatch');
 const counts=watchlistDailySummary(watch||{topics:[],edition_date:date});
 if(JSON.stringify(counts)!==JSON.stringify(freeze?.counts||{}))errors.push('publication_manifest_watchlist_counts_mismatch');
 const active=(watch?.topics||[]).filter(t=>t.status!=='archived');
 const newIds=active.filter(t=>watchlistDailyState(t,date)==='new_today').map(t=>t.topic_id);
 const updatedIds=active.filter(t=>watchlistDailyState(t,date)==='updated_today').map(t=>t.topic_id);
 if(!sameSet(newIds,sweep?.new_topic_ids||[])||!sameSet(updatedIds,sweep?.updated_topic_ids||[]))errors.push('publication_manifest_watchlist_evidence_state_mismatch');
 if(!safeRelative(freeze?.public_projection_path)||typeof freeze?.public_projection_digest!=='string')errors.push('publication_manifest_watchlist_projection_contract_missing');
 else {
  const projectionText=JSON.stringify(publicWatchlist(watch),null,2)+'\n';
  const expected='git_blob_sha1:'+gitBlobSha1(Buffer.from(projectionText));
  if(freeze.public_projection_digest!==expected)errors.push('publication_manifest_watchlist_projection_digest_mismatch');
  if(date<CONTRACT_FREEZE_DATE){
   const publicFile=path.join(root,freeze.public_projection_path);
   if(!fs.existsSync(publicFile)||'git_blob_sha1:'+gitBlobSha1(fs.readFileSync(publicFile))!==freeze.public_projection_digest)errors.push('publication_manifest_watchlist_public_projection_mismatch');
  }
 }
 return errors;
}

export function publicationManifestErrors(root,manifest,{expectedBaseline=null,expectedEditionDate=null,expectedStagingRef=null}={}){
 const errors=[];
 if(manifest?.schema_version!==PUBLICATION_MANIFEST_VERSION)errors.push('publication_manifest_schema_version_unsupported');
 if(manifest?.manifest_kind!=='daily_ai_brief_publication')errors.push('publication_manifest_kind_invalid');
 const date=manifest?.edition_date;
 if(!jsonDate(date)||manifest?.edition_id!=='dab-edition-'+date)errors.push('publication_manifest_edition_identity_invalid');
 if(expectedEditionDate&&date!==expectedEditionDate)errors.push('publication_manifest_expected_date_mismatch');
 if(!/^[a-f0-9]{40}$/.test(manifest?.baseline_sha||''))errors.push('publication_manifest_baseline_invalid');
 if(expectedBaseline&&manifest?.baseline_sha!==expectedBaseline)errors.push('publication_manifest_stale_baseline');
 if(manifest?.policy_profile!=='under80-v1')errors.push('publication_manifest_policy_profile_invalid');
 if(expectedStagingRef&&manifest?.staging_ref!==expectedStagingRef)errors.push('publication_manifest_staging_ref_mismatch');
 for(const [name,rule] of Object.entries(REQUIRED_ARTIFACTS))errors.push(...artifactErrors(root,name,manifest?.artifacts?.[name],rule));
 if(date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE)for(const [name,rule] of Object.entries(FUTURE_IMAGE_QUALITY_ARTIFACTS))errors.push(...artifactErrors(root,name,manifest?.artifacts?.[name],rule));
 if(errors.some(x=>x.includes('artifact_missing')||x.includes('artifact_json_invalid')))return [...new Set(errors)];
 let ctx;
 try{ctx={root,...publicationManifestContext(root,manifest)};}catch{errors.push('publication_manifest_context_unreadable');return [...new Set(errors)];}
 if(ctx.kernel?.brief_date!==date||ctx.kernel?.edition_id!==manifest.edition_id)errors.push('publication_manifest_kernel_date_mismatch');
 if(ctx.kernel?.baseline_sha!==manifest.baseline_sha)errors.push('publication_manifest_kernel_baseline_mismatch');
 if((ctx.kernel?.stories||[]).length!==6)errors.push('publication_manifest_kernel_story_count_invalid');
 const selected=(ctx.kernel?.stories||[]).map(x=>x.candidate_id);
 if(!selected.every(id=>ctx.facts?.[id]))errors.push('publication_manifest_facts_selection_mismatch');
 if(ctx.metadataCandidates?.profile_id!==manifest.policy_profile||!selected.every(id=>(ctx.metadataCandidates?.candidates||[]).some(x=>x.candidate_id===id)))errors.push('publication_manifest_metadata_selection_mismatch');
 if(ctx.articleEvidence?.profile_id!==manifest.policy_profile||!selected.every(id=>(ctx.articleEvidence?.model_visible||[]).some(x=>x.candidate_id===id)))errors.push('publication_manifest_article_evidence_selection_mismatch');
 const legacyDate=date<CONTRACT_FREEZE_DATE;
 const allowLegacyKernelHash=legacyDate&&manifest?.migration?.allow_legacy_media_kernel_hash_semantics===true;
 const allowLegacyStoryIdentity=legacyDate&&manifest?.migration?.allow_legacy_image_story_identity===true;
 errors.push(...mediaErrors(ctx,date,{allowLegacyKernelHash}),...imageErrors(root,ctx,{allowLegacyStoryIdentity}),...watchlistErrors(root,ctx,date,manifest?.freeze?.watchlist));
 if(!Array.isArray(ctx.bookMappings?.editions?.[date]))errors.push('publication_manifest_book_mapping_date_missing');
 const deps=manifest?.lifecycle_dependencies||{};
 for(const stage of ['MEDIA_READY','IMAGES_READY','WATCHLIST_READY','HANDOFF_COMMITTED'])if(!Array.isArray(deps[stage])||!deps[stage].length)errors.push('publication_manifest_lifecycle_dependency_missing:'+stage);
 const handoffDeps=deps.HANDOFF_COMMITTED||[];
 const requiredDependencyArtifacts=[...Object.keys(REQUIRED_ARTIFACTS),...(date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE?Object.keys(FUTURE_IMAGE_QUALITY_ARTIFACTS):[])];
 for(const name of requiredDependencyArtifacts)if(!handoffDeps.includes(name))errors.push('publication_manifest_handoff_dependency_missing:'+name);
 if(date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE&&!(deps.IMAGES_READY||[]).includes('image_quality_evidence'))errors.push('publication_manifest_image_quality_dependency_missing');
 return [...new Set(errors)];
}
export function validatePublicationManifest(root,manifest,options={}){
 const errors=publicationManifestErrors(root,manifest,options);
 return {result:errors.length?'FAIL':'PASS',schema_version:manifest?.schema_version||null,edition_date:manifest?.edition_date||null,baseline_sha:manifest?.baseline_sha||null,errors};
}
