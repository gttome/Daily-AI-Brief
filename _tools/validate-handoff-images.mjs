#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {reviewedHandoffImages} from '../_generator/lib/image-gate.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.kernel||!args.images)throw Error('Requires --kernel and --images');
const mode=String(args.mode||'combined');
if(!['combined','structural'].includes(mode))throw Error('mode must be structural or combined');
const kernel=JSON.parse(fs.readFileSync(path.resolve(args.kernel),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.resolve(args.images),'utf8'));
const stories=kernel.stories||[];
if(stories.length!==6)throw Error('six_story_kernel_required');
const edition={
  brief_date:kernel.brief_date,
  edition_id:kernel.edition_id,
  stories:stories.map(story=>{
    const entry=manifest[story.candidate_id]||{};
    return {
      story_id:story.story_id,
      image:{
        path:entry.path,
        alt:story.visual?.alt_text||entry.alt,
        width:entry.width,
        height:entry.height
      }
    };
  })
};
const result=reviewedHandoffImages(edition,path.resolve('.'),String(args.images),{mode});
const receipt={
  schema_version:'2.0.0',
  brief_date:kernel.brief_date,
  mode,
  images_expected:6,
  images_valid:result.assets.length,
  structural_gate:result.structural_gate||{result:result.errors.length?'fail':'pass'},
  editorial_quality_gate:result.editorial_quality_gate||{result:mode==='structural'?'not_run':result.errors.length?'fail':'pass'},
  overall_gate:result.overall_gate||{result:result.errors.length?'fail':'pass'},
  quality_evidence_path:result.quality_evidence_path||null,
  quality_evidence_sha256:result.quality_evidence_sha256||null,
  binary_transport_required:'github_git_data_api',
  errors:result.errors
};
console.log(JSON.stringify(receipt,null,2));
if(result.errors.length)process.exitCode=2;
