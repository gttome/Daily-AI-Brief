import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './util.mjs';
import {inspectPng,inspectWebp} from './visual-output.mjs';

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

function inspectHandoffAsset(bytes,ext){
  if(ext==='.webp')return inspectWebp(bytes,{minimumWidth:1200,minimumHeight:630});
  if(ext==='.png')return inspectPng(bytes,{minimumWidth:1200,minimumHeight:630});
  if(ext==='.svg'){
    const svg=bytes.toString('utf8'),errors=[];
    if(!svg.startsWith('<svg')||!svg.includes('width="1200"')||!svg.includes('height="630"'))errors.push('invalid_svg_canvas');
    if(!svg.includes('role="img"')||!svg.includes('aria-label='))errors.push('svg_accessibility_required');
    if(!svg.includes('fill="#ffffff"'))errors.push('svg_white_background_required');
    if((svg.match(/<text\b/g)||[]).length<12)errors.push('svg_explanatory_density_too_low');
    return {pass:errors.length===0,errors,width:1200,height:630,bytes:bytes.length};
  }
  return {pass:false,errors:['unsupported_image_format'],width:null,height:null,bytes:bytes.length};
}

export function reviewedHandoffImages(edition, root, manifestPath) {
  const errors=[],assets=[],hashes=new Set();
  if(!manifestPath||typeof manifestPath!=='string'||path.isAbsolute(manifestPath)||manifestPath.includes('..'))return {assets,errors:['Invalid handoff image review path']};
  const base=path.resolve(root),full=path.resolve(root,manifestPath);
  if(!full.startsWith(base+path.sep))return {assets,errors:['Unsafe handoff image review path']};
  let raw,manifest;
  try{raw=fs.readFileSync(full);manifest=JSON.parse(raw.toString('utf8'));}catch{return {assets,errors:['Missing or unreadable handoff image review manifest']};}
  const entries=Object.values(manifest||{});
  if(entries.length!==6)errors.push('Handoff image review must contain exactly six accepted images');
  for(const story of edition.stories||[]){
    const matches=entries.filter(x=>x?.path===story.image?.path);
    if(matches.length!==1){errors.push(`Missing or ambiguous handoff visual approval: ${story.story_id}`);continue;}
    const i=matches[0];
    const strictLock=edition.brief_date>='2026-09-19';
    const deterministicApproved=i.generation_method==='deterministic_editorial_diagram'&&i.renderer_verified===true;
    const approvedMethod=strictLock?(i.generation_method==='openai_image_generation'||deterministicApproved):['openai_image_generation','deterministic_editorial_diagram'].includes(i.generation_method);
    if(i.quality_accepted!==true||!approvedMethod)errors.push(`Handoff visual uses an unapproved generation method: ${story.story_id}`);
    if(strictLock&&(i.accepted_locked!==true||i.lock_status!=='accepted_locked'))errors.push(`Handoff visual must be accepted and locked: ${story.story_id}`);
    if(i.alt!==story.image?.alt)errors.push(`Handoff visual alt text mismatch: ${story.story_id}`);
    const filename=path.resolve(root,i.path||'');
    if(!filename.startsWith(base+path.sep)||!String(i.path||'').startsWith(`briefs/images/${edition.brief_date}/`)){errors.push('Unsafe or cross-edition handoff asset path');continue;}
    try{
      const bytes=fs.readFileSync(filename),hash=sha256(bytes),ext=path.extname(i.path).toLowerCase();
      const inspection=inspectHandoffAsset(bytes,ext);
      const width=inspection.width||0,height=inspection.height||0,ratio=height?width/height:0,target=1200/630;
      if(!['.png','.webp','.svg'].includes(ext)||!inspection.pass||Math.abs(ratio-target)>0.05)errors.push(`Invalid accepted handoff image canvas: ${i.path}`);
      if(i.sha256&&i.sha256!==hash)errors.push(`Accepted handoff image bytes changed: ${i.path}`);
      if(Number.isInteger(story.image?.width)&&story.image.width!==width)errors.push(`Edition image width mismatch: ${i.path}`);
      if(Number.isInteger(story.image?.height)&&story.image.height!==height)errors.push(`Edition image height mismatch: ${i.path}`);
      hashes.add(hash);assets.push({path:i.path,sha256:hash,bytes:bytes.length});
    }catch{errors.push(`Missing or unreadable handoff image: ${i.path}`);}
  }
  if(hashes.size!==6)errors.push('Accepted handoff image set must contain six distinct image byte streams');
  return {review_path:manifestPath,review_sha256:sha256(raw||Buffer.alloc(0)),assets,errors};
}
