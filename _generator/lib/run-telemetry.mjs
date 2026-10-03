import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {METRICS,newEfficiency} from './efficiency-core.mjs';
import {applyProductionTelemetryHealth} from './production-guardrails.mjs';
const stageNames=new Set(METRICS.stages.map(x=>x.replace(/_seconds$/,'')));
const metrics=new Set([...Object.entries(METRICS).flatMap(([g,keys])=>keys.map(k=>g+'.'+k)),'research.early_stop_triggered']);
export class RunTelemetry {
 constructor(file,identity){this.file=file;this.identity=identity;if(!fs.existsSync(file)){fs.mkdirSync(path.dirname(file),{recursive:true});this.append({type:'init',identity});}else{const first=this.events()[0];if(first.type!=='init'||JSON.stringify(first.identity)!==JSON.stringify(identity))throw Error('Telemetry identity mismatch');}}
 events(){return fs.readFileSync(this.file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);}
 append(event){fs.appendFileSync(this.file,JSON.stringify({...event,observed_at:new Date().toISOString()})+'\n',{mode:0o600});}
 begin(stage){if(!stageNames.has(stage))throw Error('Unknown stage');const id=crypto.randomUUID();this.append({type:'start',stage,id});return id;}
 end(id,status='completed'){const events=this.events(),start=events.find(x=>x.id===id&&x.type==='start');if(!start||events.some(x=>x.id===id&&x.type==='end'))throw Error('Unknown or completed span');if(!['completed','failed'].includes(status))throw Error('Invalid span status');this.append({type:'end',stage:start.stage,id,status,seconds:(Date.now()-Date.parse(start.observed_at))/1000});}
 observe(field,value,evidence){if(!metrics.has(field)||field.startsWith('stages.')||!evidence||typeof evidence!=='string')throw Error('Observation requires a supported field and evidence');if(field==='research.early_stop_triggered'?typeof value!=='boolean':!(typeof value==='number'&&Number.isFinite(value)&&value>=0))throw Error('Invalid observed value');this.append({type:'metric',field,value,evidence});}
 reuse(stage,checkpoint){if(!stageNames.has(stage)||!checkpoint)throw Error('Reuse requires stage and original checkpoint');this.append({type:'reuse',stage,checkpoint});}
 async measure(stage,work){const id=this.begin(stage);try{const result=await work();this.end(id);return result;}catch(e){this.end(id,'failed');throw e;}}
 snapshot(){const r=newEfficiency(this.identity),events=this.events();r.measurement_evidence=[];r.stage_spans=events.filter(x=>['start','end','reuse'].includes(x.type));
  for(const stage of stageNames){const starts=events.filter(x=>x.type==='start'&&x.stage===stage),ends=events.filter(x=>x.type==='end'&&x.stage===stage);if(starts.length&&starts.every(x=>ends.some(y=>y.id===x.id)))r.stages[stage+'_seconds']=ends.reduce((n,x)=>n+x.seconds,0);}
  for(const x of events.filter(x=>x.type==='metric')){const [g,k]=x.field.split('.');r[g][k]=x.value;r.measurement_evidence.push(x);}
  const life={};for(const x of events.filter(x=>x.type==='lifecycle'))life[x.phase]=x.observed_at;r.lifecycle={...life,initial_publication_seconds:life.started&&life.published?(Date.parse(life.published)-Date.parse(life.started))/1000:null,post_publication_qa_seconds:life.published&&life.qa_complete?(Date.parse(life.qa_complete)-Date.parse(life.published))/1000:null};
  return applyProductionTelemetryHealth(r);
 }
 lifecycle(phase){if(!['started','published','qa_complete'].includes(phase))throw Error('Invalid lifecycle');const prior=this.events().filter(x=>x.type==='lifecycle');if(prior.some(x=>x.phase===phase))throw Error('Boundary already recorded');if(phase==='published'&&!prior.some(x=>x.phase==='started')||phase==='qa_complete'&&!prior.some(x=>x.phase==='published'))throw Error('Missing earlier boundary');this.append({type:'lifecycle',phase});}
}
export function openTelemetry(file){const first=JSON.parse(fs.readFileSync(file,'utf8').split('\n')[0]);return new RunTelemetry(file,first.identity);}
