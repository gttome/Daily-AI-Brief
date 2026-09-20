#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {parseArgs} from '../_generator/lib/util.mjs';
import {buildDeterministicSvg,inspectPng,inspectWebp,visualAssetDecision} from '../_generator/lib/visual-output.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.kernel||!args.out)throw Error('Requires --kernel and --out');
const kernel=JSON.parse(fs.readFileSync(path.resolve(args.kernel),'utf8'));
const policy=JSON.parse(fs.readFileSync(path.resolve(args.policy||'_data/visual-renderer-policy.json'),'utf8'));
const fallback=args.fallback&&fs.existsSync(path.resolve(args.fallback))?JSON.parse(fs.readFileSync(path.resolve(args.fallback),'utf8')):{};
const receiptPath=path.resolve(args.receipt||'/tmp/visual-rendering-receipt.json');
const outputManifest={},records=[];
const slug=value=>String(value||'story').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72).replace(/-$/,'')||'story';
const commandAvailable=name=>{try{execFileSync('sh',['-lc',`command -v ${name}`],{stdio:'ignore'});return true;}catch{return false;}};
const pngRendererVerified=policy.deterministic_png_enabled===true&&commandAvailable('rsvg-convert');
const fallbackValid=(entry,date)=>{
 if(!entry?.path||!entry.alt||!entry.path.startsWith(`briefs/images/${date}/`)||!fs.existsSync(entry.path))return null;
 if(policy.professional_generative_assets_required===true){
  if(entry.generation_method!==policy.required_generation_method||entry.quality_accepted!==true||entry.accepted_locked!==true||entry.lock_status!==policy.required_lock_status)return null;
 }
 const bytes=fs.readFileSync(entry.path),ext=path.extname(entry.path).toLowerCase();
 const inspection=ext==='.webp'
   ? inspectWebp(bytes,{minimumWidth:policy.minimum_width||1200,minimumHeight:policy.minimum_height||630})
   : inspectPng(bytes,{minimumWidth:policy.minimum_width||1200,minimumHeight:policy.minimum_height||630});
 return ['.png','.webp'].includes(ext)&&inspection.pass?inspection:null;
};

for(const story of kernel.stories||[]){
 const candidateId=story.candidate_id,fb=fallback[candidateId],fbInspection=fallbackValid(fb,kernel.brief_date);
 const decision=visualAssetDecision(story.visual,{sep17ParityApproved:policy.sep17_parity_approved===true,pngRendererVerified,hasApprovedFallback:!!fbInspection});
 if(decision.path==='generative_fallback'){
  outputManifest[candidateId]={...fb,width:fbInspection.width,height:fbInspection.height,sha256:fbInspection.sha256,kind:fb.kind||'editorial_explainer',cache_key:fb.cache_key||fbInspection.sha256.slice(0,16)};
  records.push({candidate_id:candidateId,story_id:story.story_id,path:'generative_fallback',reason:decision.reason,asset:fb.path,inspection:fbInspection});continue;
 }
 if(decision.path==='blocked'){
  records.push({candidate_id:candidateId,story_id:story.story_id,path:'blocked',reason:decision.reason,errors:decision.gate?.errors||[],required_action:'Provide one accepted_locked professional generative asset for this story. Low-detail deterministic publication fallback is prohibited.'});continue;
 }
 try{
  const built=buildDeterministicSvg(story.visual),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-visual-')),svgPath=path.join(tmp,'visual.svg'),pngPath=path.join(tmp,'visual.png');
  fs.writeFileSync(svgPath,built.svg,'utf8');
  execFileSync('rsvg-convert',['--width','1200','--height','630','--format','png','--output',pngPath,svgPath],{stdio:'pipe'});
  const bytes=fs.readFileSync(pngPath),inspection=inspectPng(bytes,{minimumWidth:policy.minimum_width||1200,minimumHeight:policy.minimum_height||630});
  if(!inspection.pass)throw Error(`png_integrity_gate_failed:${inspection.errors.join(',')}`);
  const filename=`${String(story.canonical_ordinal).padStart(2,'0')}-${slug(story.headline)}.png`,relative=`briefs/images/${kernel.brief_date}/${filename}`,svgRelative=relative.replace(/\.png$/,'.svg');
  fs.mkdirSync(path.dirname(relative),{recursive:true});fs.writeFileSync(relative,bytes);fs.writeFileSync(svgRelative,built.svg,'utf8');
  outputManifest[candidateId]={path:relative,alt:story.visual.alt_text,width:inspection.width,height:inspection.height,kind:'editorial_explainer',cache_key:inspection.sha256.slice(0,16),sha256:inspection.sha256,svg_source:svgRelative,generation_method:'deterministic_editorial_diagram',renderer_verified:true,quality_accepted:true,accepted_locked:true,lock_status:'accepted_locked'};
  records.push({candidate_id:candidateId,story_id:story.story_id,path:'deterministic',reason:decision.reason,asset:relative,svg_source:svgRelative,svg_inspection:built.inspection,png_inspection:inspection});
  fs.rmSync(tmp,{recursive:true,force:true});
 }catch(error){
  if(fbInspection){
   outputManifest[candidateId]={...fb,width:fbInspection.width,height:fbInspection.height,sha256:fbInspection.sha256,kind:fb.kind||'editorial_explainer',cache_key:fb.cache_key||fbInspection.sha256.slice(0,16)};
   records.push({candidate_id:candidateId,story_id:story.story_id,path:'generative_fallback',reason:'deterministic_render_failed',error:error.message,asset:fb.path,inspection:fbInspection});
  }else records.push({candidate_id:candidateId,story_id:story.story_id,path:'blocked',reason:'deterministic_render_failed_without_fallback',error:error.message,required_action:'Targeted story-scoped generative visual fallback required.'});
 }
}
const blocked=records.filter(x=>x.path==='blocked');
const receipt={schema_version:'1.0.0',brief_date:kernel.brief_date,minimum_baseline:policy.minimum_baseline||'2026-09-17',sep17_parity_approved:policy.sep17_parity_approved===true,png_renderer_verified:pngRendererVerified,deterministic:records.filter(x=>x.path==='deterministic').length,generative_fallback:records.filter(x=>x.path==='generative_fallback').length,blocked:blocked.length,records};
fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});fs.writeFileSync(path.resolve(args.out),JSON.stringify(outputManifest,null,2)+'\n');fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
if(blocked.length)process.exitCode=2;
