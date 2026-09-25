#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {inspectPng,inspectWebp} from '../_generator/lib/visual-output.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.kernel||!args.images)throw Error('Requires --kernel and --images');
const kernel=JSON.parse(fs.readFileSync(path.resolve(args.kernel),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.resolve(args.images),'utf8'));
const rendererPolicy=JSON.parse(fs.readFileSync(path.resolve('_data/visual-renderer-policy.json'),'utf8'));
const stories=kernel.stories||[];
if(stories.length!==6)throw Error('six_story_kernel_required');
const records=[];
for(const story of stories){
 const entry=manifest[story.candidate_id];
 const errors=[];
 if(!entry)errors.push('manifest_entry_missing');
 if(entry){
  if(entry.quality_accepted!==true)errors.push('quality_accepted_required');
  const strictLock=kernel.brief_date>='2026-09-19';
  const deterministicApproved=entry.generation_method==='deterministic_editorial_diagram'&&entry.renderer_verified===true&&rendererPolicy.sep17_parity_approved===true;
  const emergencyApproved=rendererPolicy.emergency_recovery?.edition_date===kernel.brief_date&&entry.generation_method===rendererPolicy.emergency_recovery.allowed_generation_method&&entry.visual_reviewed===true;
  const approvedMethod=strictLock?(entry.generation_method==='openai_image_generation'||deterministicApproved||emergencyApproved):['openai_image_generation','deterministic_editorial_diagram'].includes(entry.generation_method);
  if(!approvedMethod)errors.push('approved_generation_method_required');
  if(strictLock&&(entry.accepted_locked!==true||entry.lock_status!=='accepted_locked'))errors.push('accepted_locked_required');
  if(strictLock&&entry.generation_method==='deterministic_editorial_diagram'&&entry.renderer_verified!==true)errors.push('renderer_verified_required');
  const emergencySource=emergencyApproved&&typeof entry.path==='string'&&entry.path.startsWith('_records/editorial-handoff/recovery-images/')&&path.extname(entry.path).toLowerCase()==='.svg';
  if(typeof entry.path!=='string'||(!entry.path.startsWith(`briefs/images/${kernel.brief_date}/`)&&!emergencySource))errors.push('edition_image_path_required');
  if(!entry.path||!fs.existsSync(entry.path))errors.push('image_file_missing');
  else {
   const buffer=fs.readFileSync(entry.path),ext=path.extname(entry.path).toLowerCase();
   if(emergencySource){
    if(buffer.length<1000)errors.push('emergency_svg_too_small');
    records.push({candidate_id:story.candidate_id,path:entry.path,bytes:buffer.length,width:1200,height:630,sha256:null,errors});
    continue;
   }
   const inspection=ext==='.webp'?inspectWebp(buffer,{minimumWidth:1200,minimumHeight:630}):inspectPng(buffer,{minimumWidth:1200,minimumHeight:630});
   if(!['.png','.webp'].includes(ext))errors.push('unsupported_image_format');
   if(!inspection.pass)errors.push(...inspection.errors);
   if(entry.sha256&&entry.sha256!==inspection.sha256)errors.push('manifest_sha256_mismatch');
   if(entry.width&&entry.width!==inspection.width)errors.push('manifest_width_mismatch');
   if(entry.height&&entry.height!==inspection.height)errors.push('manifest_height_mismatch');
   records.push({candidate_id:story.candidate_id,path:entry.path,bytes:inspection.bytes,width:inspection.width,height:inspection.height,sha256:inspection.sha256,errors});
   continue;
  }
 }
 records.push({candidate_id:story.candidate_id,path:entry?.path||null,errors});
}
const failures=records.filter(x=>x.errors.length);
const receipt={schema_version:'1.0.0',brief_date:kernel.brief_date,images_expected:6,images_valid:records.length-failures.length,binary_transport_required:'github_git_data_api',records};
console.log(JSON.stringify(receipt,null,2));
if(failures.length)process.exitCode=2;
