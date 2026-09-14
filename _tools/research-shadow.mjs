
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RetrievalCache,createEvidencePacket,researchTelemetry} from '../_generator/lib/research.mjs';
import {sha256} from '../_generator/lib/util.mjs';
import {validateIntegratedRepository} from '../_generator/lib/integrity.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const edition=JSON.parse(fs.readFileSync(path.join(root,'_data/editions/2026-09-14.json'),'utf8'));
const startedAt=new Date().toISOString(),cache=new RetrievalCache(),packets=[];
let unoptimizedChars=0,loads=0;
for(const story of edition.stories){
 const body=JSON.stringify(story);
 unoptimizedChars+=body.length*3;
 const retriever=async()=>{loads++;return{text:body};};
 const retrieved=await cache.retrieve(story.source.url,retriever);
 await cache.retrieve(story.source.url,retriever);
 await cache.retrieve(story.source.url,retriever);
 const excerpt=story.headline;
 packets.push(createEvidencePacket({candidate_id:story.story_id,headline:story.headline,publisher:story.source.organization,canonical_url:story.source.url,published_at:story.source.publication_date,focus:story.focus,source_reliability:story.source.evidence_type},
 {...retrieved,evidence_kind:'archived_canonical_record'},
 {status:'reviewed',reviewer:'archive-replay: retained September 14 QA; no new primary verification',reviewed_at:edition.published_at,source_content_hash:sha256(body),claims:[{claim:story.headline,excerpt}],
 why_it_matters:story.why_it_matters,novelty_status:'pass',confidence:'high',
 agent_skill_relevance:story.topics.some(x=>/agent skills/i.test(x))}));
}
const packetChars=packets.reduce((n,p)=>n+JSON.stringify(p).length,0);
const errors=validateIntegratedRepository(edition,root);
const telemetry=researchTelemetry({startedAt,endedAt:new Date().toISOString(),cache,packets,scope:'archived_canonical_reuse_shadow'});
const result={schema_version:'1.0.0',scope:telemetry.scope,provenance:'_data/editions/2026-09-14.json',
 counterfactual:'Each of six archived canonical story records is requested by three downstream consumers. This is an explicit replay workload, not evidence that the historical workflow repeated these requests.',
 source_loads_without_cache:18,source_loads_with_cache:loads,cache_hits:cache.metrics.cache_hits,
 source_load_reduction_percent:(18-loads)/18*100,
 downstream_context_without_packets_chars:unoptimizedChars,downstream_context_with_packets_chars:packetChars*3,
 downstream_context_reduction_percent:(unoptimizedChars-packetChars*3)/unoptimizedChars*100,
 primary_source_network_fetches:0,publication_reruns:0,canonical_story_count:edition.stories.length,
 allocation:edition.stories.map(s=>s.focus),reader_parity:errors.length?'FAIL':'PASS',errors,
 telemetry,limitations:['Archive replay demonstrates reuse mechanics and packet context size only.','No production runtime, source full-text savings, exact tokens or allowance improvement is established.','Packet excerpts refer to retained canonical evidence, not newly retrieved publisher text.','A representative live research run and full Phase 1 operational integration remain necessary.']};
const dir=path.join(root,'_architecture/efficiency-refactor');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'phase-1-shadow.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;

