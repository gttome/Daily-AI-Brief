import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './util.mjs';

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
  if(r.images?.length!==6)errors.push('Image review must cover exactly six final story images');
  const compositions=new Set(),hashes=new Set();
  for(const story of edition.stories){
    const i=r.images?.find(x=>x.story_id===story.story_id);
    if(!i||i.asset!==story.image.path||i.result!=='pass'||!i.assessment||!i.composition){errors.push(`Missing or mismatched visual approval: ${story.story_id}`);continue;}
    compositions.add(i.composition.trim().toLowerCase());
    const filename=path.resolve(root,i.asset);
    if(!filename.startsWith(path.resolve(root)+path.sep)||!i.asset.startsWith(`briefs/images/${edition.brief_date}/`)){errors.push('Unsafe or cross-edition asset path');continue;}
    try{
      const bytes=fs.readFileSync(filename),hash=sha256(bytes);
      if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==1200||bytes.readUInt32BE(20)!==630)errors.push(`Invalid final PNG canvas: ${i.asset}`);
      if(hash!==i.replacement_sha256)errors.push(`Reviewed image bytes changed: ${i.asset}`);
      hashes.add(hash);assets.push({path:i.asset,sha256:hash,bytes:bytes.length});
    }catch{errors.push(`Missing or unreadable image: ${i.asset}`);}
  }
  if(compositions.size!==6||hashes.size!==6)errors.push('Repeated image or repeated composition evidence requires renewed visual review');
  return {review_path:selected.path,review_sha256:sha256(fs.readFileSync(path.join(root,selected.path))),assets,errors};
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
    if(i.quality_accepted!==true||!['openai_image_generation','deterministic_editorial_diagram'].includes(i.generation_method))errors.push(`Handoff visual uses an unapproved generation method: ${story.story_id}`);
    if(i.alt!==story.image?.alt)errors.push(`Handoff visual alt text mismatch: ${story.story_id}`);
    const filename=path.resolve(root,i.path||'');
    if(!filename.startsWith(base+path.sep)||!String(i.path||'').startsWith(`briefs/images/${edition.brief_date}/`)){errors.push('Unsafe or cross-edition handoff asset path');continue;}
    try{
      const bytes=fs.readFileSync(filename),hash=sha256(bytes);
      const png=bytes.length>=24&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a';
      const width=png?bytes.readUInt32BE(16):0,height=png?bytes.readUInt32BE(20):0;
      const ratio=height?width/height:0,target=1200/630;
      if(!png||width<1200||height<630||Math.abs(ratio-target)>0.05)errors.push(`Invalid accepted handoff PNG canvas: ${i.path}`);
      if(i.sha256!==hash)errors.push(`Accepted handoff image bytes changed: ${i.path}`);
      if(Number.isInteger(story.image?.width)&&story.image.width!==width)errors.push(`Edition image width mismatch: ${i.path}`);
      if(Number.isInteger(story.image?.height)&&story.image.height!==height)errors.push(`Edition image height mismatch: ${i.path}`);
      hashes.add(hash);assets.push({path:i.path,sha256:hash,bytes:bytes.length});
    }catch{errors.push(`Missing or unreadable handoff image: ${i.path}`);}
  }
  if(hashes.size!==6)errors.push('Accepted handoff image set must contain six distinct image byte streams');
  return {review_path:manifestPath,review_sha256:sha256(raw||Buffer.alloc(0)),assets,errors};
}
