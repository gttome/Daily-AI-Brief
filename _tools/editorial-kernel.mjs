#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {canonicalKernel,deterministicOwnership,expandEditorialKernel,kernelReceipt} from '../_generator/lib/editorial-kernel.mjs';

const [command,...rest]=process.argv.slice(2),args=parseArgs(rest);
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const write=(file,value)=>{const out=path.resolve(file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(value,null,2)+'\n');return out;};
if(!args.kernel)throw Error('Requires --kernel <editorial-kernel.json>');
const kernel=canonicalKernel(read(args.kernel));

if(command==='validate'){
 const receipt=kernelReceipt(kernel);if(args.out)write(args.out,receipt);console.log(JSON.stringify({...receipt,ownership:deterministicOwnership()},null,2));
}else if(command==='expand'){
 for(const required of ['facts','images','metadata','published-at','coverage'])if(!args[required])throw Error(`Requires --${required}`);
 const candidateFacts=read(args.facts),imageAssets=read(args.images),metadataCandidates=read(args.metadata),media=args.media?read(args.media):null;
 const edition=expandEditorialKernel(kernel,{candidateFacts,imageAssets,metadataCandidates,media,publishedAt:args['published-at'],coveragePeriod:args.coverage});
 const out=write(args.out||`/tmp/${kernel.edition_id}.staged.json`,edition),receipt=kernelReceipt(kernel);
 console.log(JSON.stringify({edition_id:kernel.edition_id,staged_edition:out,kernel_receipt:receipt,model_calls_after_kernel:0,production_merge_authorized:false,note:'Expansion is deterministic. Existing repository contracts and publication gates still control promotion.'},null,2));
}else throw Error('Expected validate or expand');
