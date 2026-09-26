import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sha256} from './util.mjs';
import {inspectPng,inspectWebp} from './visual-output.mjs';

export const EDITORIAL_IMAGE_QUALITY_VERSION='2.0.0';
export const EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE='2026-09-26';
export const IMAGE_BENCHMARK_PROFILE='sep09-sep10-premium3-v1';
export const IMAGE_BENCHMARK_PROFILE_PATH='_records/image-quality/benchmark-profile-v1.json';

const BENCHMARK_DIMENSIONS=Object.freeze(['professional_finish','meaningful_detail','explanatory_mechanism','annotation_richness','visual_depth','hierarchy','composition','story_specificity','differentiation']);
const STRUCTURAL_CHECKS=Object.freeze(['file_exists','file_integrity','format','dimensions','expected_path','clipping_corruption','byte_uniqueness','story_identity','accessibility','asset_hash','git_blob_identity','lock_state','replacement_identity']);
const safeRelative=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!p.split(/[\\/]+/).includes('..');
export const gitBlobSha1=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const candidateEntries=manifest=>Object.entries(manifest||{}).filter(([key,value])=>!key.startsWith('_')&&value&&typeof value==='object');
const pass=v=>String(v||'').toLowerCase()==='pass';
const text=(v,min=1)=>typeof v==='string'&&v.trim().length>=min;

export function reviewedImages(edition, root) {
  if (edition.brief_date < '2026-09-10') return {legacy:true, assets:[], errors:[]};
  const dir=path.join(root,'_records/image-quality');
  const records=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>{
    try {return {record:JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')),path:`_records/image-quality/${n}`};} catch{return null;}
  }).filter(x=>x?.record.edition_id===edition.edition_id).sort((a,b)=>String(b.record.reviewed_at).localeCompare(String(a.record.reviewed_at))):[];
  const selected=records[0];
  if(!selected)return {assets:[],errors:['Missing mandatory final image review']};
  const r=selected.record, errors=[],assets=[];
  if(r.image_gate!=='pass'||!r.review_method||!r.reviewed_at)errors.push('Final image set has not passed documented visual review');
  if(edition.brief_date>='2026-09-19'&&r.asset_policy!=='accepted_locked_reuse_only')errors.push('Final image set must use accepted_locked_reuse_only policy beginning 2026-09-19');
  if(edition.brief_date>='2026-09-19'&&!/OpenAI/i.test(String(r.generation_method||'')))errors.push('Final image set must document professional OpenAI image generation beginning 2026-09-19');
  if(r.images?.length!==6)errors.push('Image review must cover exactly six final story images');
  const compositions=new Set(),hashes=new Set();
  for(const story of edition.stories){
    const i=r.images?.find(x=>x.story_id===story.story_id);
    if(!i||i.asset!==story.image.path||i.result!=='pass'||!i.assessment||!i.composition){errors.push(`Missing or mismatched visual approval: ${story.story_id}`);continue;}
    compositions.add(i.composition.trim().toLowerCase());
    const filename=path.resolve(root,i.asset);
    if(!filename.startsWith(path.resolve(root)+path.sep)||!i.asset.startsWith(`briefs/images/${edition.brief_date}/`)){errors.push('Unsafe or cross-edition asset path');continue;}
    try{
      const bytes=fs.readFileSync(filename),hash=sha256(bytes),ext=path.extname(i.asset).toLowerCase();
      const inspection=ext==='.webp'?inspectWebp(bytes,{minimumWidth:1200,minimumHeight:630}):inspectPng(bytes,{minimumWidth:1200,minimumHeight:630});
      const width=inspection.width||0,height=inspection.height||0;
      if(!['.png','.webp'].includes(ext)||!inspection.pass||width!==1200||height!==630)errors.push(`Invalid final image canvas: ${i.asset}`);
      if(hash!==i.replacement_sha256)errors.push(`Reviewed image bytes changed: ${i.asset}`);
      hashes.add(hash);assets.push({path:i.asset,sha256:hash,bytes:bytes.length,width,height,format:ext.slice(1)});
    }catch{errors.push(`Missing or unreadable image: ${i.asset}`);}
  }
  if(compositions.size!==6||hashes.size!==6)errors.push('Repeated image or repeated composition evidence requires renewed visual review');
  return {review_path:selected.path,review_sha256:sha256(fs.readFileSync(path.join(root,selected.path))),assets,errors};
}

export function inspectHandoffAsset(bytes,ext){
  if(ext==='.webp')return inspectWebp(bytes,{minimumWidth:1200,minimumHeight:630});
  if(ext==='.png')return inspectPng(bytes,{minimumWidth:1200,minimumHeight:630});
  if(ext==='.svg'){
    const svg=bytes.toString('utf8'),errors=[],rootTag=svg.match(/^<svg\b[^>]*>/)?.[0]||'';
    const width=Number(rootTag.match(/\bwidth="(\d+)"/)?.[1]||0),height=Number(rootTag.match(/\bheight="(\d+)"/)?.[1]||0);
    if(!rootTag||!svg.includes('</svg>')||width!==1200||height!==630)errors.push('invalid_svg_canvas');
    if(!/\brole="img"/.test(rootTag)||!/\baria-label=/.test(rootTag))errors.push('svg_accessibility_required');
    if(!svg.includes('fill="#ffffff"'))errors.push('svg_white_background_required');
    if((svg.match(/<text\b/g)||[]).length<12)errors.push('svg_explanatory_density_too_low');
    return {pass:errors.length===0,errors,width,height,bytes:bytes.length};
  }
  return {pass:false,errors:['unsupported_image_format'],width:null,height:null,bytes:bytes.length};
}

export function validateBenchmarkProfile(root,profilePath=IMAGE_BENCHMARK_PROFILE_PATH){
  const errors=[];
  if(!safeRelative(profilePath))return {result:'fail',errors:['benchmark_profile_path_invalid']};
  const full=path.join(root,profilePath);
  let profile;
  try{profile=JSON.parse(fs.readFileSync(full,'utf8'));}catch{return {result:'fail',errors:['benchmark_profile_missing_or_invalid']};}
  if(profile.schema_version!=='1.0.0'||profile.profile_id!==IMAGE_BENCHMARK_PROFILE)errors.push('benchmark_profile_identity_invalid');
  const sets=profile.accepted_sets||[];
  if(sets.length!==2||!sets.some(x=>x.edition_date==='2026-09-09')||!sets.some(x=>x.edition_date==='2026-09-10'))errors.push('benchmark_profile_required_sets_missing');
  for(const set of sets){
    if(!Array.isArray(set.assets)||set.assets.length!==6)errors.push('benchmark_profile_asset_count_invalid:'+String(set.edition_date));
    for(const asset of set.assets||[]){
      if(!safeRelative(asset.path)){errors.push('benchmark_profile_asset_path_invalid:'+String(asset.path));continue;}
      const file=path.join(root,asset.path);
      if(!fs.existsSync(file)){errors.push('benchmark_profile_asset_missing:'+asset.path);continue;}
      const bytes=fs.readFileSync(file);
      if(asset.git_blob_sha!==gitBlobSha1(bytes))errors.push('benchmark_profile_git_blob_mismatch:'+asset.path);
    }
  }
  return {result:errors.length?'fail':'pass',profile,errors};
}

function structuralEvidenceErrors(item){
  const errors=[];
  if(!pass(item?.structural_gate?.result))errors.push('quality_evidence_structural_gate_not_pass');
  const checks=item?.structural_gate?.checks||{};
  for(const check of STRUCTURAL_CHECKS)if(!pass(checks[check]))errors.push('quality_evidence_structural_check_not_pass:'+check);
  return errors;
}

function replacementErrors(item){
  const errors=[];
  if(!text(item.asset_version)||!text(item.cache_key))errors.push('quality_evidence_asset_version_and_cache_key_required');
  const old=item.supersedes;
  if(old!==null&&old!==undefined){
    if(!text(old.asset_path)||!text(old.asset_hash)||!text(old.cache_key)||!text(old.asset_version))errors.push('quality_evidence_supersedes_identity_incomplete');
    if(old.asset_hash===item.asset_hash)errors.push('quality_evidence_replacement_hash_must_change');
    if(old.cache_key===item.cache_key)errors.push('quality_evidence_replacement_cache_key_must_change');
    if(old.asset_version===item.asset_version)errors.push('quality_evidence_replacement_version_must_change');
    if(item.deployment_verification_required!==true)errors.push('quality_evidence_replacement_deployment_verification_required');
  }
  return errors;
}

function editorialEvidenceErrors(item){
  const errors=[],gate=item?.editorial_quality_gate||{};
  if(!pass(gate.result))errors.push('quality_evidence_editorial_gate_not_pass');
  for(const dimension of BENCHMARK_DIMENSIONS)if(!pass(gate?.benchmark_comparison?.[dimension]))errors.push('quality_evidence_benchmark_dimension_not_pass:'+dimension);
  for(const field of ['story_specificity','information_density','explanatory_mechanism','annotation_quality','depth_hierarchy','composition'])if(!pass(gate[field]))errors.push('quality_evidence_editorial_dimension_not_pass:'+field);
  if(gate.generic_or_sparse!==false)errors.push('quality_evidence_generic_or_sparse');
  if(gate.decorative_only!==false)errors.push('quality_evidence_decorative_only');
  if(!Array.isArray(gate.meaningful_components)||gate.meaningful_components.length<8)errors.push('quality_evidence_information_density_below_benchmark');
  for(const field of ['composition_signature','layout_signature','diagram_grammar','hierarchy_signature','annotation_pattern_signature'])if(!text(gate[field],3))errors.push('quality_evidence_signature_required:'+field);
  if(!text(gate.assessment,40))errors.push('quality_evidence_assessment_required');
  if(item?.overall_gate!=='pass')errors.push('quality_evidence_overall_gate_not_pass');
  return errors;
}

function qualityRecordErrors(edition,record,manifestEntries,assets){
  const errors=[];
  if(record?.schema_version!==EDITORIAL_IMAGE_QUALITY_VERSION||record?.record_kind!=='editorial_image_quality')errors.push('quality_evidence_schema_invalid');
  if(record?.edition_date!==edition.brief_date||record?.edition_id!==edition.edition_id)errors.push('quality_evidence_edition_identity_mismatch');
  if(record?.benchmark_profile!==IMAGE_BENCHMARK_PROFILE||record?.benchmark_profile_path!==IMAGE_BENCHMARK_PROFILE_PATH)errors.push('quality_evidence_benchmark_profile_invalid');
  if(record?.review_status!=='complete'||!text(record?.review_method,10)||!Number.isFinite(Date.parse(record?.reviewed_at||'')))errors.push('quality_evidence_editorial_review_unavailable');
  const images=record?.images||[];
  if(!Array.isArray(images)||images.length!==6)errors.push('quality_evidence_exactly_six_images_required');
  const assetByPath=new Map(assets.map(x=>[x.path,x])),reviewEntries=manifestEntries.map(([,v])=>v);
  const composition=[],layouts=[],grammars=[],hierarchies=[],annotations=[];
  for(const entry of reviewEntries){
    const item=images.find(x=>x.story_id===entry.story_id&&x.asset_path===entry.path);
    if(!item){errors.push('quality_evidence_image_missing:'+String(entry.story_id||entry.path));continue;}
    const actual=assetByPath.get(entry.path);
    if(!actual){errors.push('quality_evidence_structural_asset_missing:'+entry.path);continue;}
    if(item.asset_hash!==actual.sha256||(entry.sha256&&entry.sha256!==actual.sha256))errors.push('quality_evidence_asset_hash_mismatch:'+entry.path);
    if(item.git_blob_sha!==actual.git_blob_sha||entry.git_blob_sha!==actual.git_blob_sha)errors.push('quality_evidence_git_blob_mismatch:'+entry.path);
    if(item.cache_key!==entry.cache_key)errors.push('quality_evidence_cache_key_mismatch:'+entry.path);
    if(item.asset_version!==entry.asset_version)errors.push('quality_evidence_asset_version_mismatch:'+entry.path);
    if(JSON.stringify(item.supersedes??null)!==JSON.stringify(entry.supersedes??null))errors.push('quality_evidence_supersedes_mismatch:'+entry.path);
    if(Boolean(item.deployment_verification_required)!==Boolean(entry.deployment_verification_required))errors.push('quality_evidence_deployment_verification_flag_mismatch:'+entry.path);
    errors.push(...structuralEvidenceErrors(item).map(x=>x+':'+entry.path));
    errors.push(...editorialEvidenceErrors(item).map(x=>x+':'+entry.path));
    errors.push(...replacementErrors(item).map(x=>x+':'+entry.path));
    const gate=item.editorial_quality_gate||{};
    composition.push(gate.composition_signature);layouts.push(gate.layout_signature);grammars.push(gate.diagram_grammar);hierarchies.push(gate.hierarchy_signature);annotations.push(gate.annotation_pattern_signature);
  }
  const set=record?.set_review||{};
  if(!pass(set.result))errors.push('quality_evidence_set_review_not_pass');
  for(const field of ['composition_differentiation','layout_differentiation','diagram_grammar_differentiation','information_hierarchy_differentiation','annotation_pattern_differentiation'])if(!pass(set[field]))errors.push('quality_evidence_set_dimension_not_pass:'+field);
  if(!text(set.assessment,40))errors.push('quality_evidence_set_assessment_required');
  if(new Set(composition).size!==6)errors.push('quality_evidence_duplicate_composition_signature');
  if(new Set(layouts).size<4)errors.push('quality_evidence_layout_reuse_excessive');
  if(new Set(grammars).size<4)errors.push('quality_evidence_diagram_grammar_reuse_excessive');
  if(new Set(hierarchies).size<4)errors.push('quality_evidence_hierarchy_reuse_excessive');
  if(new Set(annotations).size<3)errors.push('quality_evidence_annotation_pattern_reuse_excessive');
  return errors;
}

export function reviewedHandoffImages(edition, root, manifestPath, {mode='combined'}={}) {
  const errors=[],assets=[],hashes=new Set();
  if(!['combined','structural'].includes(mode))return {assets,errors:['Invalid handoff image validation mode']};
  if(!manifestPath||typeof manifestPath!=='string'||path.isAbsolute(manifestPath)||manifestPath.includes('..'))return {assets,errors:['Invalid handoff image review path']};
  const base=path.resolve(root),full=path.resolve(root,manifestPath);
  if(!full.startsWith(base+path.sep))return {assets,errors:['Unsafe handoff image review path']};
  let raw,manifest;
  try{raw=fs.readFileSync(full);manifest=JSON.parse(raw.toString('utf8'));}catch{return {assets,errors:['Missing or unreadable handoff image review manifest']};}
  const entries=candidateEntries(manifest);
  if(entries.length!==6)errors.push('Handoff image review must contain exactly six accepted images');
  for(const story of edition.stories||[]){
    const matches=entries.filter(([,x])=>x?.path===story.image?.path);
    if(matches.length!==1){errors.push('Missing or ambiguous handoff visual approval: '+story.story_id);continue;}
    const [,i]=matches[0],strictLock=edition.brief_date>='2026-09-19';
    if(strictLock&&(i.accepted_locked!==true||i.lock_status!=='accepted_locked'))errors.push('Handoff visual must be accepted and locked: '+story.story_id);
    if(i.alt!==story.image?.alt)errors.push('Handoff visual alt text mismatch: '+story.story_id);
    if(edition.brief_date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE&&i.story_id!==story.story_id)errors.push('Handoff visual story identity mismatch: '+story.story_id);
    const filename=path.resolve(root,i.path||'');
    if(!filename.startsWith(base+path.sep)||!String(i.path||'').startsWith('briefs/images/'+edition.brief_date+'/')){errors.push('Unsafe or cross-edition handoff asset path');continue;}
    try{
      const bytes=fs.readFileSync(filename),hash=sha256(bytes),blob=gitBlobSha1(bytes),ext=path.extname(i.path).toLowerCase(),inspection=inspectHandoffAsset(bytes,ext);
      const width=inspection.width||0,height=inspection.height||0,ratio=height?width/height:0,target=1200/630;
      if(!['.png','.webp','.svg'].includes(ext)||!inspection.pass||width!==1200||height!==630||Math.abs(ratio-target)>0.001)errors.push('Invalid accepted handoff image canvas: '+i.path);
      if(i.sha256&&i.sha256!==hash)errors.push('Accepted handoff image bytes changed: '+i.path);
      if(edition.brief_date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE){
        if(i.git_blob_sha!==blob)errors.push('Accepted handoff image Git blob identity changed: '+i.path);
        if(!text(i.asset_version)||!text(i.cache_key))errors.push('Accepted handoff image version/cache identity missing: '+i.path);
        const old=i.supersedes;
        if(old!==null&&old!==undefined){
          if(!text(old.asset_path)||!text(old.asset_hash)||!text(old.cache_key)||!text(old.asset_version))errors.push('Accepted handoff image supersession identity incomplete: '+i.path);
          if(old.asset_hash===hash)errors.push('Accepted handoff replacement hash did not change: '+i.path);
          if(old.cache_key===i.cache_key)errors.push('Accepted handoff replacement cache key did not change: '+i.path);
          if(old.asset_version===i.asset_version)errors.push('Accepted handoff replacement version did not change: '+i.path);
          if(i.deployment_verification_required!==true)errors.push('Accepted handoff replacement must require deployed-byte verification: '+i.path);
        }
      }
      if(Number.isInteger(story.image?.width)&&story.image.width!==width)errors.push('Edition image width mismatch: '+i.path);
      if(Number.isInteger(story.image?.height)&&story.image.height!==height)errors.push('Edition image height mismatch: '+i.path);
      hashes.add(hash);assets.push({path:i.path,sha256:hash,git_blob_sha:blob,bytes:bytes.length,width,height,format:ext.slice(1),cache_key:i.cache_key||null,asset_version:i.asset_version||null});
    }catch{errors.push('Missing or unreadable handoff image: '+i.path);}
  }
  if(hashes.size!==6)errors.push('Accepted handoff image set must contain six distinct image byte streams');
  const structuralErrors=[...errors],structuralGate={result:structuralErrors.length?'fail':'pass',errors:structuralErrors};
  let qualityEvidencePath=null,qualityEvidenceSha256=null,editorialErrors=[];
  if(mode==='combined'){
    for(const [,entry] of entries){
      const strictLock=edition.brief_date>='2026-09-19',professionalOnly=edition.brief_date>='2026-09-20';
      const deterministicApproved=!professionalOnly&&entry.generation_method==='deterministic_editorial_diagram'&&entry.renderer_verified===true;
      const professionalEditorial=entry.generation_method==='professional_editorial_diagram'&&entry.visual_reviewed===true&&entry.accepted_locked===true&&entry.lock_status==='accepted_locked';
      const approvedMethod=professionalOnly?(entry.generation_method==='openai_image_generation'||professionalEditorial):strictLock?(entry.generation_method==='openai_image_generation'||deterministicApproved||professionalEditorial):['openai_image_generation','deterministic_editorial_diagram'].includes(entry.generation_method);
      if(!approvedMethod)editorialErrors.push('quality_evidence_unapproved_generation_method:'+String(entry.story_id||entry.path));
    }
    if(edition.brief_date>=EDITORIAL_IMAGE_QUALITY_EFFECTIVE_DATE){
      const paths=new Set(entries.map(([,x])=>x.quality_evidence_path).filter(Boolean)),expectedDigests=new Set(entries.map(([,x])=>x.quality_evidence_sha256).filter(Boolean));
      if(paths.size!==1||expectedDigests.size!==1)editorialErrors.push('quality_evidence_reference_missing_or_ambiguous');
      else{
        qualityEvidencePath=[...paths][0];
        if(!safeRelative(qualityEvidencePath))editorialErrors.push('quality_evidence_path_invalid');
        else{
          try{
            const qualityRaw=fs.readFileSync(path.join(root,qualityEvidencePath));qualityEvidenceSha256=sha256(qualityRaw);
            if(qualityEvidenceSha256!==[...expectedDigests][0])editorialErrors.push('quality_evidence_digest_mismatch');
            editorialErrors.push(...qualityRecordErrors(edition,JSON.parse(qualityRaw.toString('utf8')),entries,assets));
          }catch{editorialErrors.push('quality_evidence_missing_or_unreadable');}
        }
      }
      for(const [,entry] of entries)if(entry.overall_gate!=='pass')editorialErrors.push('quality_evidence_manifest_overall_gate_not_pass:'+String(entry.story_id||entry.path));
    }else{
      for(const [,entry] of entries)if(entry.quality_accepted!==true||entry.visual_reviewed===false)editorialErrors.push('legacy_editorial_quality_not_accepted:'+String(entry.story_id||entry.path));
    }
  }
  errors.push(...editorialErrors);
  const editorialGate={result:mode==='structural'?'not_run':editorialErrors.length?'fail':'pass',errors:editorialErrors},overallGate={result:mode==='structural'?'not_run':errors.length?'fail':'pass'};
  return {review_path:manifestPath,review_sha256:sha256(raw||Buffer.alloc(0)),quality_evidence_path:qualityEvidencePath,quality_evidence_sha256:qualityEvidenceSha256,assets,structural_gate:structuralGate,editorial_quality_gate:editorialGate,overall_gate:overallGate,errors:[...new Set(errors)]};
}

export function deployedImageByteErrors(expected,observed){
  const errors=[],observedByUrl=new Map((observed||[]).map(x=>[x.url,x]));
  for(const item of expected||[]){
    const live=observedByUrl.get(item.url);
    if(!live||live.ok!==true)errors.push('deployed_image_unreachable:'+String(item.path||item.url));
    else if(live.sha256!==item.sha256)errors.push('deployed_image_byte_mismatch:'+String(item.path||item.url));
  }
  return errors;
}
