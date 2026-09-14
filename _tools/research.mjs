import {sha256} from '../_generator/lib/util.mjs';

import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {filterCandidates,createEvidencePacket,researchSufficiency,RetrievalCache,runSelectiveResearch} from '../_generator/lib/research.mjs';
import {retrieveSource,extractMainText,extractCandidateMetadata} from './discovery-links.mjs';
const [command,...rest]=process.argv.slice(2),args=parseArgs(rest);
if(['plan','run','sufficiency'].includes(command)&&!args['max-age-hours'])throw Error('Explicit --max-age-hours required; use the approved edition window');
const input=args.file?JSON.parse(fs.readFileSync(path.resolve(args.file),'utf8')):null;
const fetcher=async url=>{const result=await retrieveSource(url);const extracted=extractMainText(result.text);const rawHash=sha256(result.text);if(args.cache){const rawDir=path.join(path.resolve(args.cache),'raw');fs.mkdirSync(rawDir,{recursive:true});const rawFile=path.join(rawDir,rawHash+'.html');if(!fs.existsSync(rawFile))fs.writeFileSync(rawFile,result.text,{flag:'wx'});}return {...result,...extracted,metadata:{raw_content_hash:sha256(result.text),extraction_method:extracted.extraction_method,main_text_verified:false,word_count:extracted.word_count}};};
let output;
if(command==='metadata'){
 if(!input?.candidates||!args.cache||!Number.isInteger(Number(args.limit))||Number(args.limit)<1)throw Error('metadata requires --file candidates.json --cache private-directory --limit positive-count');
 const cache=new RetrievalCache({directory:path.resolve(args.cache)}),results=[];
 for(const candidate of input.candidates.slice(0,Number(args.limit))){
  const url=candidate.canonical_url||candidate.url;try{const source=await cache.retrieve(url,retrieveSource,{kind:'metadata'});const records=extractCandidateMetadata(source.text,source.resolved_url);const metadata=records.find(x=>x.canonical_url===url||x.canonical_url===source.resolved_url)||null;results.push({candidate_id:candidate.candidate_id,canonical_url:url,metadata,source_content_hash:source.content_hash,checked_at:source.fetched_at,status:metadata?.published_at?'metadata_found_requires_review':'metadata_unresolved'});}catch(e){results.push({candidate_id:candidate.candidate_id,canonical_url:url,status:'unavailable',reason:e.message});}
 }
 output={results,deferred:input.candidates.slice(Number(args.limit)).map(x=>x.candidate_id),metrics:cache.metrics};
}else if(command==='fetch'){
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
