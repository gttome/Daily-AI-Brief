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
