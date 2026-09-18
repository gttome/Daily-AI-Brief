#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {inspectPng} from '../_generator/lib/visual-output.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.kernel||!args.images)throw Error('Requires --kernel and --images');
const kernel=JSON.parse(fs.readFileSync(path.resolve(args.kernel),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.resolve(args.images),'utf8'));
const stories=kernel.stories||[];
if(stories.length!==6)throw Error('six_story_kernel_required');
const records=[];
for(const story of stories){
 const entry=manifest[story.candidate_id];
 const errors=[];
 if(!entry)errors.push('manifest_entry_missing');
 if(entry){
  if(entry.quality_accepted!==true)errors.push('quality_accepted_required');
  if(entry.generation_method!=='openai_image_generation')errors.push('openai_generation_required');
  if(typeof entry.path!=='string'||!entry.path.startsWith(`briefs/images/${kernel.brief_date}/`))errors.push('edition_image_path_required');
  if(!entry.path||!fs.existsSync(entry.path))errors.push('image_file_missing');
  else {
   const inspection=inspectPng(fs.readFileSync(entry.path),{minimumWidth:1200,minimumHeight:630});
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
const receipt={schema_version:'1.0.0',brief_date:kernel.brief_date,images_expected:6,images_valid:records.length-failures.length,binary_transport_required:'native_git_push',records};
console.log(JSON.stringify(receipt,null,2));
if(failures.length)process.exitCode=2;
