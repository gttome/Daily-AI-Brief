
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {filterCandidates,createEvidencePacket,researchSufficiency,RetrievalCache,runSelectiveResearch} from '../_generator/lib/research.mjs';
import {retrieveSource,cleanText} from './discovery-links.mjs';
const [command,...rest]=process.argv.slice(2),args=parseArgs(rest);
const input=args.file?JSON.parse(fs.readFileSync(path.resolve(args.file),'utf8')):null;
const fetcher=async url=>{const result=await retrieveSource(url);return {...result,text:cleanText(result.text)};};
let output;
if(command==='fetch'){
 if(!args.url||!args.cache)throw Error('fetch requires --url and --cache (private local directory)');
 const cache=new RetrievalCache({directory:path.resolve(args.cache)});
 output=await cache.retrieve(args.url,fetcher,{kind:'fulltext',force:args.force===true||args.force==='true'});
}else{
 if(!input)throw Error('Requires --file input.json');
 if(command==='plan') output=filterCandidates(input.candidates,{now:args.now,maxAgeHours:Number(args['max-age-hours']||120),coveredEvents:input.covered_events||[]});
 else if(command==='packet') output=createEvidencePacket(input.candidate,input.source,input.review);
 else if(command==='sufficiency') output=researchSufficiency(input.packets,{now:args.now,maxAgeHours:Number(args['max-age-hours']||120)});
 else if(command==='run'){
   if(!args.cache)throw Error('run requires --cache (private local directory)');
   output=await runSelectiveResearch(input.candidates,{now:args.now,maxAgeHours:Number(args['max-age-hours']||120),
     cache:new RetrievalCache({directory:path.resolve(args.cache)}),fetcher,
     reviewer:async candidate=>input.reviews?.[candidate.candidate_id]||null});
 }else throw Error('Expected plan, fetch, packet, sufficiency or run');
}
const body=JSON.stringify(output,null,2)+'\n';
if(args.out){fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});fs.writeFileSync(path.resolve(args.out),body,{flag:'wx'});}
else process.stdout.write(body);
