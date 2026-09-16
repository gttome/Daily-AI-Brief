import fs from 'node:fs';import path from 'node:path';
import {sha256} from './util.mjs';
export const RUN_VERSION='efficiency-production-v2';
export function assertRunManifest(m){
 if(m?.schema_version!=='1.0.0'||m.pipeline_version!==RUN_VERSION||!/^dab-attempt-[\w.-]+$/.test(m.attempt_id))throw Error('Valid versioned attempt required');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(m.edition_date)||!Number.isFinite(Date.parse(m.edition_date))||new Date(m.edition_date).toISOString().slice(0,10)!==m.edition_date||!/(?:Z|[+-]\d{2}:\d{2})$/.test(m.cutoff)||!Number.isFinite(Date.parse(m.cutoff))||m.timezone!=='America/Chicago')throw Error('Explicit edition date, cutoff and timezone required');
 if(!Number.isFinite(m.article_window_hours)||m.article_window_hours<=0||(m.article_window_hours>24&&!m.window_reason))throw Error('Expanded article window requires an explicit reason');
 if(!/^[a-f0-9]{40}$/.test(m.baseline_sha)||!m.private_root)throw Error('Baseline and private evidence root required');
 return m;
}
export function evidenceViews(packets){
 if(packets.some(p=>p.verification_status!=='reviewed'||!p.source_content_hash||!p.verified_claims?.length))throw Error('Reviewed evidence packets required');
 const views={selection:[],writing:[],images:[],editorial_qa:[]};
 for(const p of packets){
  const identity={candidate_id:p.candidate_id,headline:p.headline,canonical_url:p.canonical_url,source_content_hash:p.source_content_hash};
  const facts=p.verified_claims.map(x=>({claim:x.claim,evidence:x.evidence}));
  views.selection.push({...identity,category:p.category,published_at:p.published_at,novelty_status:p.novelty_status,confidence:p.confidence,agent_skill_relevance:p.agent_skill_relevance,claims:facts});
  views.writing.push({...identity,published_at:p.published_at,why_it_matters:p.why_it_matters,claims:facts,limitations:p.limitations||[],availability:p.availability||null});
  views.images.push({...identity,verified_relationships:facts.map(x=>x.claim),limitations:p.limitations||[],availability:p.availability||null,required_preflight:['verified mechanism and labels','current versus planned status','distinct composition','no invented settings or measurements'],review_status:'pending_visual_brief_review'});
  views.editorial_qa.push({...identity,claims:facts,limitations:p.limitations||[],availability:p.availability||null,novelty_status:p.novelty_status});
 }
 return {views,telemetry:{archive_chars:JSON.stringify(packets).length,stage_chars:Object.fromEntries(Object.entries(views).map(([k,v])=>[k,JSON.stringify(v).length])),actual_model_input_chars:null,note:'Artifact sizes only; record actual stage input separately. No evidence was truncated.'}};
}
export function saveJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const text=JSON.stringify(value,null,2)+'\n',temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,text);fs.renameSync(temp,file);return sha256(text);}
export function completionDecision({editionDate,completion,lastProcessed=null}){
 const expected='dab-edition-'+editionDate;
 if(completion?.edition_id===expected&&/^[a-f0-9]{40}$/.test(completion.commit_sha||'')&&completion.phase!=='pages_verified'){
  return {state:'published_qa_pending',label:'Published — final QA in progress',research:false,publish:false,collect:false};
 }
 if(completion?.edition_id!==expected||completion.phase!=='pages_verified'||completion.pages?.conclusion!=='success'||!/^[a-f0-9]{40}$/.test(completion.commit_sha||''))return {state:'pending',label:'Publication in progress',research:false,publish:false,collect:false};
 const key=editionDate+':'+completion.commit_sha;
 return {state:key===lastProcessed?'unchanged':'completed',label:'Published — final QA complete',key,research:false,publish:false,collect:key!==lastProcessed};
}

export function assertPrivateRoot(repo,privateRoot,manifestPath){
 const resolved=p=>{let cursor=path.resolve(p),tail=[];while(!fs.existsSync(cursor)){tail.unshift(path.basename(cursor));const parent=path.dirname(cursor);if(parent===cursor)throw Error('Cannot resolve private path');cursor=parent;}return path.join(fs.realpathSync(cursor),...tail);};
 const base=resolved(repo),root=resolved(privateRoot),manifest=resolved(manifestPath);
 const inside=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel));};
 if(inside(base,root)||inside(root,base)||inside(base,manifest)||!inside(root,manifest)||root===manifest)throw Error('Evidence root must remain outside public Git and contain its manifest');
 return root;
}
