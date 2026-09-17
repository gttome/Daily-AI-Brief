#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {parseArgs,sha256} from '../_generator/lib/util.mjs';
import {RUN_VERSION,assertRunManifest,assertPrivateRoot,evidenceViews,saveJson} from '../_generator/lib/production-run.mjs';
import {CheckpointStore} from '../_generator/lib/checkpoints.mjs';
import {compactMemory} from '../_generator/lib/compact-memory.mjs';
import {createEvidencePacket} from '../_generator/lib/research.mjs';
import {mergeMediaCatalog} from '../_generator/lib/media-evidence.mjs';
import {visualPreflight,saveApprovedImages,imageRecovery} from '../_generator/lib/visual-recovery.mjs';
import {privateDraftPath,saveDraft,recoverDraft} from '../_generator/lib/draft-recovery.mjs';
const [command,...rest]=process.argv.slice(2),args=parseArgs(rest),repo=process.cwd();
const manifestPath=path.resolve(args.manifest||'');
if(!args.manifest)throw Error('Requires --manifest <private attempt manifest path>');
if(command==='init'){
 if(fs.existsSync(manifestPath))throw Error('Manifest exists; resume it');
 if(!args['private-root'])throw Error('Requires durable --private-root outside the Git repository');
 const privateRoot=assertPrivateRoot(repo,args['private-root'],manifestPath);
 const m=assertRunManifest({schema_version:'1.0.0',pipeline_version:RUN_VERSION,attempt_id:args.attempt,edition_date:args.date,cutoff:args.cutoff,timezone:'America/Chicago',article_window_hours:Number(args['max-age-hours']),window_reason:args['window-reason']||null,baseline_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),private_root:privateRoot,created_at:new Date().toISOString(),scope:'publication_preparation',scheduled_environment_access:'not_yet_verified',exact_tokens:null,exact_credits:null});
 saveJson(manifestPath,m);console.log(JSON.stringify({manifest:manifestPath,attempt_id:m.attempt_id,next:'discover',scheduled_environment_access:m.scheduled_environment_access}));
}else{
 const m=assertRunManifest(JSON.parse(fs.readFileSync(manifestPath))),root=path.join(m.private_root,m.attempt_id);
 assertPrivateRoot(repo,m.private_root,manifestPath);
 fs.mkdirSync(root,{recursive:true});
 const inputs=['_tools/production-run.mjs','_tools/discover-sources.mjs','_tools/discover-watchlist.mjs','_tools/discovery-context.mjs','_tools/discovery-links.mjs','_generator/lib/research.mjs','_generator/lib/incremental-watchlist.mjs','_generator/lib/discovery-queue.mjs','_generator/lib/production-run.mjs','_generator/lib/media-evidence.mjs','_generator/lib/media-selection.mjs','_generator/lib/visual-recovery.mjs','_generator/lib/image-gate.mjs','docs/images/publisher-policy.md','docs/podcasts/publisher-policy.md','docs/operations/efficiency-operating-policy-2026-09-17.md','_data/efficiency-operating-policy.json','_data/command-center-access-policy.json','_generator/lib/compact-memory.mjs','_generator/lib/historical.mjs','_generator/lib/checkpoints.mjs','_generator/lib/util.mjs','_data/watchlist-sources.json','docs/operations/publisher-runbook.md','_data/source-registry.json','_data/early-signal-sources.json'];
 for(const dir of ['_data/editions','briefs'])for(const entry of fs.readdirSync(path.join(repo,dir)).sort())if(/\.(json|md)$/.test(entry))inputs.push(dir+'/'+entry);
 const runtime={manifest:sha256(JSON.stringify(m)),code:Object.fromEntries(inputs.map(p=>[p,sha256(p==='_data/watchlist-sources.json'?JSON.stringify(JSON.parse(fs.readFileSync(p)),(k,v)=>['last_check','last_checked_at','last_success_at','next_check_at','updated_at'].includes(k)?undefined:v):fs.readFileSync(p))]))};
 const priorRuntime=path.join(root,'inputs/runtime.json');saveJson(priorRuntime,runtime);
 const checkpoints=new CheckpointStore({directory:path.join(root,'checkpoints'),root,attemptId:m.attempt_id,pipelineVersion:RUN_VERSION,dependencies:{discovery:[],evidence:['discovery']}});
 if(command==='discover'){
  const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
  if(localDate!==m.edition_date)throw Error('Fresh discovery requires current Chicago edition date; use frozen fixtures for replay');
  process.env.DAB_RETRIEVAL_CACHE=path.join(m.private_root,'retrieval-cache');
  const existing=checkpoints.read('discovery'),expired=!existing||Date.now()-Date.parse(existing.recorded_at)>=3600000;
  const result=await checkpoints.run('discovery',{inputs:['inputs/runtime.json'],alwaysRun:expired||['media-candidate-queue','watchlist-discoveries','watchlist-source-state'].some(name=>{const live=path.join(repo,'_data',name+'.json'),saved=path.join(root,'outputs',name+'.json');return fs.existsSync(live)&&fs.existsSync(saved)&&sha256(fs.readFileSync(live))!==sha256(fs.readFileSync(saved));}),execute:async()=>{
   // Run the bounded Brief catalog pass first. Watchlist discovery then reuses the same acquisition cache
   // and only checks due sources; do not launch two broad source sweeps in parallel.
   await import('./discover-sources.mjs');
   await import('./discover-watchlist.mjs');
   const memory=compactMemory(repo,new Date(Date.parse(m.edition_date+'T00:00:00Z')-86400000).toISOString().slice(0,10),{cacheFile:path.join(m.private_root,'novelty-index.json')});
   saveJson(path.join(root,'outputs/novelty.json'),memory);
   for(const name of ['media-candidate-queue','watchlist-discoveries','watchlist-source-state']){fs.mkdirSync(path.join(root,'outputs'),{recursive:true});fs.copyFileSync(path.join(repo,'_data',name+'.json'),path.join(root,'outputs',name+'.json'));}
   const {acquisition}=await import('./discovery-context.mjs');saveJson(path.join(root,'outputs/retrieval-metrics.json'),{...acquisition.cache.metrics,observed_at:new Date().toISOString()});
   return ['outputs/novelty.json','outputs/media-candidate-queue.json','outputs/watchlist-discoveries.json','outputs/watchlist-source-state.json','outputs/retrieval-metrics.json'];
  }});
  if(result.reused)for(const name of ['media-candidate-queue','watchlist-discoveries','watchlist-source-state'])fs.copyFileSync(path.join(root,'outputs',name+'.json'),path.join(repo,'_data',name+'.json'));
  console.log(JSON.stringify({attempt_id:m.attempt_id,reused:result.reused,private_artifacts:root,next:'Review only unresolved metadata, retain at most 20 editorial metadata candidates, and deep-review 9 normally (+3 only for a named insufficiency). Supply reviewed packet inputs with packets --file.'}));
 }else if(command==='packets'){
  if(!args.file)throw Error('Requires --file reviewed evidence inputs');
  const input=JSON.parse(fs.readFileSync(path.resolve(args.file)));
  saveJson(path.join(root,'inputs/reviewed-evidence.json'),input);
  const result=await checkpoints.run('evidence',{inputs:['inputs/runtime.json','inputs/reviewed-evidence.json'],execute:async()=>{
   const packets=input.map(x=>createEvidencePacket(x.candidate,x.source,x.review));
   saveJson(path.join(root,'outputs/evidence-packets.json'),packets);
   const {views,telemetry}=evidenceViews(packets);for(const [stage,view]of Object.entries(views))saveJson(path.join(root,'outputs',stage+'.json'),view);
   const editorialContract={schema_version:'1.0.0',normal_model_passes:1,normal_post_editorial_model_passes:0,normal_work_inputs:['outputs/research_capsule.json','outputs/editorial.json'],traceability_only_not_normal_work_inputs:['outputs/evidence-packets.json','outputs/selection.json','outputs/writing.json','outputs/images.json','outputs/editorial_qa.json'],derived_fields_owned_by_code:true,rule:'One compact editorial pass produces all semantic decisions. Do not resend the whole edition for deterministic derivation, build, deployment, route checks or unchanged Watchlist state.'};
   saveJson(path.join(root,'outputs/editorial-contract.json'),editorialContract);
   saveJson(path.join(root,'outputs/context-metrics.json'),telemetry);
   return ['outputs/evidence-packets.json',...Object.keys(views).map(x=>'outputs/'+x+'.json'),'outputs/editorial-contract.json','outputs/context-metrics.json'];
  }});console.log(JSON.stringify({reused:result.reused,private_artifacts:root,normal_work_inputs:['outputs/research_capsule.json','outputs/editorial.json'],normal_model_passes:1,normal_post_editorial_model_passes:0,selection_status:'use_single_editorial_pass_then_hand_off_deterministic_work'}));
 }else if(command==='media'){
  if(!args.file)throw Error('Requires --file reviewed media evidence');
  const input=JSON.parse(fs.readFileSync(path.resolve(args.file))),file=path.join(m.private_root,'media-catalog.json');let records=[];
  if(fs.existsSync(file)){const old=JSON.parse(fs.readFileSync(file));if(old.records_hash!==sha256(JSON.stringify(old.records)))throw Error('Media catalog integrity failed');records=old.records;}
  saveJson(path.join(m.private_root,'media-evidence',sha256(JSON.stringify(input))+'.json'),input);
  const updated=mergeMediaCatalog(records,input);saveJson(file,{schema_version:'1.0.0',records:updated,records_hash:sha256(JSON.stringify(updated))});
  console.log(JSON.stringify({records:updated.length,unresolved:updated.filter(x=>x.metadata_status!=='reviewed').length,selection:'Apply the bounded video coverage receipt, duration ladder, two-podcast source-diversity rule, and existing editorial gates; catalog presence is not selection.'}));
 }else if(['save-draft','recover-draft'].includes(command)){
  if(!args.file)throw Error('Private draft descriptor required');
  const file=privateDraftPath({repo,manifest:m,file:path.resolve(args.file)}),draft=JSON.parse(fs.readFileSync(file,'utf8'));
  const options={repo,manifest:m,draft,checkpoint:args.checkpoint,restore:args.restore===true};
  const result=command==='save-draft'?saveDraft(options):recoverDraft(options);
  console.log(JSON.stringify({...result,image_generation_calls:0,publication:false}));
  if(result.state==='requires_review')process.exitCode=1;
 }else if(['preflight','save-images','recover-images'].includes(command)){
  if(!args.file)throw Error('Requires --file story packet and visual-brief inputs');
  const input=JSON.parse(fs.readFileSync(path.resolve(args.file)));
  const preflights=input.map(x=>({story_id:x.story_id,packet:x.packet,preflight:visualPreflight(x.packet,x.spec)}));
  const edition=JSON.parse(fs.readFileSync(path.join(repo,'_data/editions',m.edition_date+'.json')));
  if(preflights.length!==6||new Set(preflights.map(x=>x.story_id)).size!==6||edition.stories.some(s=>!preflights.some(x=>x.story_id===s.story_id)))throw Error('Exactly six matching story preflights required');
  saveJson(path.join(root,'outputs/visual-preflights.json'),preflights);
  if(command==='save-images')console.log(JSON.stringify({saved:saveApprovedImages({edition,repo,root,preflights}),image_generation_calls:0}));
  else if(command==='recover-images'){
   const results=preflights.map(x=>({story_id:x.story_id,...imageRecovery({edition,story:edition.stories.find(s=>s.story_id===x.story_id),packet:x.packet,preflight:x.preflight,repo,root,restore:args.restore===true})}));
   console.log(JSON.stringify({results,image_generation_calls:0,publication_gates:'Still required'}));if(results.some(x=>x.state!=='reusable'))process.exitCode=1;
  }else console.log(JSON.stringify({preflights:preflights.length,image_approval:'not_granted_by_preflight',next:'Render high-detail diagrams under the September 17 quality lock. Use a high-quality generative fallback for any story whose deterministic visual cannot meet the baseline, then save-images with the same reviewed input.'}));
 }else throw Error('Expected init, discover, packets, media, save-draft, recover-draft, preflight, save-images or recover-images');
}
