import fs from 'node:fs';import path from 'node:path';
import {sha256} from './util.mjs';
// Keep the existing manifest version so in-progress private attempts remain resumable.
// Behavioral efficiency changes are guarded by code hashes/checkpoints rather than invalidating manifests.
export const RUN_VERSION='efficiency-production-v2';
export const RESEARCH_CAPSULE_CHAR_BUDGET=9000;
export const WORK_CONTEXT_CHAR_BUDGET=6500;
const compact=(value,max)=>typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,max):value;
export function assertRunManifest(m){
 if(m?.schema_version!=='1.0.0'||m.pipeline_version!==RUN_VERSION||!/^dab-attempt-[\w.-]+$/.test(m.attempt_id))throw Error('Valid versioned attempt required');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(m.edition_date)||!Number.isFinite(Date.parse(m.edition_date))||new Date(m.edition_date).toISOString().slice(0,10)!==m.edition_date||!/(?:Z|[+-]\d{2}:\d{2})$/.test(m.cutoff)||!Number.isFinite(Date.parse(m.cutoff))||m.timezone!=='America/Chicago')throw Error('Explicit edition date, cutoff and timezone required');
 if(!Number.isFinite(m.article_window_hours)||m.article_window_hours<=0||(m.article_window_hours>24&&!m.window_reason))throw Error('Expanded article window requires an explicit reason');
 if(!/^[a-f0-9]{40}$/.test(m.baseline_sha)||!m.private_root)throw Error('Baseline and private evidence root required');
 return m;
}
function compactPacket(p){
 return {candidate_id:p.candidate_id,headline:compact(p.headline,180),publisher:compact(p.publisher,100)||null,canonical_url:p.canonical_url,category:p.category,published_at:p.published_at,source_reliability:p.source_reliability,freshness_tier:p.freshness_tier,freshness_age_hours:p.freshness_age_hours,novelty_status:p.novelty_status,confidence:p.confidence,agent_skill_relevance:p.agent_skill_relevance===true,evidence:(p.verified_claims||[]).slice(0,4).map(x=>compact(x.claim,300)),source_word_count:Number.isInteger(p.source_word_count)&&p.source_word_count>0?p.source_word_count:null,source_reading_minutes:Number.isInteger(p.source_reading_minutes)&&p.source_reading_minutes>0?p.source_reading_minutes:null,limitation:(p.limitations||[]).slice(0,1).map(x=>compact(x,240))[0]||null,availability:compact(p.availability,120)||null,why_candidate_matters:compact(p.why_it_matters,320)||null};
}
export function evidenceViews(packets){
 if(packets.some(p=>p.verification_status!=='reviewed'||!p.source_content_hash||!p.verified_claims?.length))throw Error('Reviewed evidence packets required');
 const views={research_capsule:[],editorial:[],selection:[],writing:[],images:[],editorial_qa:[]};
 for(const p of packets){
  const identity={candidate_id:p.candidate_id,headline:p.headline,canonical_url:p.canonical_url,source_content_hash:p.source_content_hash};
  const facts=p.verified_claims.map(x=>({claim:x.claim,evidence:x.evidence}));
  const capsule=compactPacket(p);views.research_capsule.push(capsule);
  views.editorial.push({candidate_id:capsule.candidate_id,headline:capsule.headline,canonical_url:capsule.canonical_url,category:capsule.category,published_at:capsule.published_at,source_reliability:capsule.source_reliability,freshness_tier:capsule.freshness_tier,novelty_status:capsule.novelty_status,confidence:capsule.confidence,agent_skill_relevance:capsule.agent_skill_relevance,evidence:capsule.evidence,source_word_count:capsule.source_word_count,source_reading_minutes:capsule.source_reading_minutes,limitation:capsule.limitation,availability:capsule.availability,why_candidate_matters:capsule.why_candidate_matters});
  // The following views remain as traceable compatibility artifacts, not normal Work inputs.
  views.selection.push({...identity,category:p.category,published_at:p.published_at,novelty_status:p.novelty_status,confidence:p.confidence,agent_skill_relevance:p.agent_skill_relevance,claims:facts});
  views.writing.push({...identity,published_at:p.published_at,why_it_matters:p.why_it_matters,claims:facts,limitations:p.limitations||[],availability:p.availability||null});
  views.images.push({...identity,verified_relationships:facts.map(x=>x.claim),limitations:p.limitations||[],availability:p.availability||null,required_preflight:['verified mechanism and labels','current versus planned status','distinct composition','no invented settings or measurements'],review_status:'pending_visual_brief_review'});
  views.editorial_qa.push({...identity,claims:facts,limitations:p.limitations||[],availability:p.availability||null,novelty_status:p.novelty_status});
 }
 const researchCapsuleChars=JSON.stringify(views.research_capsule).length,workContextChars=JSON.stringify(views.editorial).length;
 if(researchCapsuleChars>RESEARCH_CAPSULE_CHAR_BUDGET)throw Error(`research_capsule_budget_exceeded:${researchCapsuleChars}>${RESEARCH_CAPSULE_CHAR_BUDGET}`);
 if(workContextChars>WORK_CONTEXT_CHAR_BUDGET)throw Error(`work_context_budget_exceeded:${workContextChars}>${WORK_CONTEXT_CHAR_BUDGET}`);
 return {views,telemetry:{archive_chars:JSON.stringify(packets).length,research_capsule_chars:researchCapsuleChars,work_context_chars:workContextChars,stage_chars:Object.fromEntries(Object.entries(views).map(([k,v])=>[k,JSON.stringify(v).length])),actual_model_input_chars:null,note:'Full reviewed excerpts remain in the private packet archive. The normal Work path consumes only research_capsule/editorial views; compatibility views are not normal model inputs.'}};
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
