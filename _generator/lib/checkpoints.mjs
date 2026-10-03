import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './util.mjs';
export const STAGE_DEPENDENCIES=Object.freeze({
 metadata:[],filtering:['metadata'],evidence:['filtering'],selection:['evidence'],
 canonical:['selection'],images:['selection'],video:['selection'],podcast:['selection'],
 watchlist:['metadata'],generation:['canonical','images','video','podcast','watchlist'],
 deterministic_qa:['generation'],publication:['deterministic_qa'],live_qa:['publication']
});
const safe=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,160}$/.test(value);
export class CheckpointStore{
 constructor({directory,root,attemptId,pipelineVersion,dependencies=STAGE_DEPENDENCIES}){
   if(!directory||!root||!safe(attemptId)||!safe(pipelineVersion))throw Error('Valid checkpoint directory, root, attempt and version required');
   this.directory=path.resolve(directory);this.root=path.resolve(root);this.attemptId=attemptId;this.pipelineVersion=pipelineVersion;this.dependencies=dependencies;
   this.metrics={checkpoint_hits:0,resumed_stages:[],invalidated_stages:[],executed_stages:[]};
 }
 stagePath(stage){if(!safe(stage)||!Object.hasOwn(this.dependencies,stage))throw Error('Unknown stage');return path.join(this.directory,this.attemptId,stage+'.json');}
 hashes(files){
   if(!Array.isArray(files)||files.some(f=>typeof f!=='string'))throw Error('File path array required');
   return Object.fromEntries([...new Set(files)].sort().map(file=>{
     const absolute=path.resolve(this.root,file),relative=path.relative(this.root,absolute);
     if(relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Checkpoint artifact must stay within repository');
     if(!fs.statSync(absolute).isFile())throw Error('Checkpoint artifact must be a file');
     return [relative.split(path.sep).join('/'),sha256(fs.readFileSync(absolute))];
   }));
 }
 read(stage){try{return JSON.parse(fs.readFileSync(this.stagePath(stage),'utf8'));}catch{return null;}}
 valid(stage,{inputs=null,seen=new Set()}={}){
   if(seen.has(stage))throw Error('Cyclic checkpoint dependencies');
   seen=new Set(seen).add(stage);
   const record=this.read(stage);
   if(!record||record.status!=='complete'||record.attempt_id!==this.attemptId||record.pipeline_version!==this.pipelineVersion)return null;
   const {record_hash,...body}=record;
   if(record_hash!==sha256(JSON.stringify(body)))return null;
   try{
     if(JSON.stringify(this.hashes(inputs||Object.keys(record.inputs)))!==JSON.stringify(record.inputs)||
        JSON.stringify(this.hashes(Object.keys(record.outputs)))!==JSON.stringify(record.outputs))return null;
     const dependencies=this.dependencies[stage]||[];
     if(Object.keys(record.dependencies).length!==dependencies.length)return null;
     for(const dependency of dependencies){
       const parent=this.valid(dependency,{seen});
       if(!parent||record.dependencies[dependency]!==parent.record_hash)return null;
     }
   }catch{return null;}
   return record;
 }
 save(stage,{inputs=[],outputs=[],status='complete'}={}){
   if(!outputs.length||status!=='complete')throw Error('Only completed stages with artifact outputs can checkpoint');
   const dependencies={};
   for(const name of this.dependencies[stage]||[]){
     const parent=this.valid(name);if(!parent)throw Error('Missing or invalid dependency '+name);
     dependencies[name]=parent.record_hash;
   }
   const record={schema_version:'1.0.0',attempt_id:this.attemptId,pipeline_version:this.pipelineVersion,stage,status,
     inputs:this.hashes(inputs),outputs:this.hashes(outputs),dependencies,recorded_at:new Date().toISOString(),
     invalidation_rule:'Any input/output/dependency hash or pipeline-version change invalidates this stage and its descendants.'};
   record.record_hash=sha256(JSON.stringify(record));
   const file=this.stagePath(stage);fs.mkdirSync(path.dirname(file),{recursive:true});
   const prior=this.read(stage);
   if(prior){const archive=path.join(path.dirname(file),'history');fs.mkdirSync(archive,{recursive:true});const old=path.join(archive,stage+'-'+sha256(JSON.stringify(prior))+'.json');if(!fs.existsSync(old))fs.writeFileSync(old,JSON.stringify(prior,null,2)+'\n',{flag:'wx'});}
   const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(record,null,2)+'\n');fs.renameSync(temp,file);
   return record;
 }
 async run(stage,{inputs,execute,alwaysRun=false}){
   const prior=!alwaysRun&&this.valid(stage,{inputs});
   if(prior){this.metrics.checkpoint_hits++;this.metrics.resumed_stages.push(stage);return {record:prior,reused:true};}
   if(this.read(stage))this.metrics.invalidated_stages.push(stage);
   const started=performance.now(),outputs=await execute();
   const record=this.save(stage,{inputs,outputs});
   this.metrics.executed_stages.push(stage);
   return {record,reused:false,wall_seconds:(performance.now()-started)/1000};
 }
}
export function affectedStages(changed,dependencies=STAGE_DEPENDENCIES){
 const affected=new Set(changed);
 if(changed.some(stage=>!Object.hasOwn(dependencies,stage)))throw Error('Unknown invalidation stage');
 let added=true;while(added){added=false;for(const [stage,parents]of Object.entries(dependencies))if(!affected.has(stage)&&parents.some(p=>affected.has(p))){affected.add(stage);added=true;}}
 return [...affected];
}
export async function boundedTasks(tasks,limit=3){
 if(!Number.isInteger(limit)||limit<1||limit>8)throw Error('Concurrency must be 1–8');
 let next=0;const results=new Array(tasks.length);
 await Promise.all(Array.from({length:Math.min(limit,tasks.length)},async()=>{
   while(next<tasks.length){const index=next++,started=performance.now();
     try{results[index]={status:'fulfilled',value:await tasks[index](),wall_seconds:(performance.now()-started)/1000};}
     catch(error){results[index]={status:'rejected',reason:error.message,wall_seconds:(performance.now()-started)/1000};}
   }
 }));
 return results;
}
export function repairPlan(kind){
 const initial={rating_javascript:['deterministic_qa'],image:['images'],podcast_link:['podcast'],feed_rendering:['generation'],factual_story:['evidence'],test_fixture:['deterministic_qa'],transient_probe:['live_qa']}[kind];
 if(!initial)throw Error('Unknown repair type');
 return {kind,invalidated_stages:affectedStages(initial),research_reused:!initial.includes('evidence'),
   mandatory_gates:['required_candidate_build','atomic_publication','pages_deployment','live_smoke'],
   note:'Targeted local repair does not waive full candidate CI, factual verification or production deployment checks.'};
}
