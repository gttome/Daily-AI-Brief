import {sha256,normalizeUrl} from './util.mjs';

export const EDITORIAL_KERNEL_VERSION='1.0.0';
export const STORY_FOCUSES=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const SEMANTIC_STORY_FIELDS=['candidate_id','headline','summary','why_it_matters','what_to_do_now','editorial_limitation','visual'];
const str=(v,min=1)=>typeof v==='string'&&v.trim().length>=min;

export function validateEditorialKernel(kernel){
 const errors=[];
 if(kernel?.schema_version!==EDITORIAL_KERNEL_VERSION)errors.push('unsupported_kernel_schema');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(kernel?.brief_date||''))errors.push('valid_brief_date_required');
 if(!/^dab-edition-\d{4}-\d{2}-\d{2}$/.test(kernel?.edition_id||''))errors.push('valid_edition_id_required');
 if(kernel?.edition_id!==`dab-edition-${kernel?.brief_date||''}`)errors.push('edition_date_identity_mismatch');
 if(!/^[a-f0-9]{40}$/.test(kernel?.baseline_sha||''))errors.push('baseline_sha_required');
 if(kernel?.normal_model_passes!==1)errors.push('normal_model_passes_must_equal_one');
 if(kernel?.normal_post_editorial_model_passes!==0)errors.push('normal_post_editorial_model_passes_must_equal_zero');
 if(!Array.isArray(kernel?.stories)||kernel.stories.length!==6)errors.push('exactly_six_stories_required');
 const ids=new Set(),candidates=new Set(),focusCounts=Object.fromEntries(STORY_FOCUSES.map(x=>[x,0]));
 let agentSkill=0;
 for(const [index,story] of (kernel?.stories||[]).entries()){
  if(!STORY_FOCUSES.includes(story.focus))errors.push(`invalid_focus:${index+1}`);else focusCounts[story.focus]++;
  if(!Number.isInteger(story.canonical_ordinal)||story.canonical_ordinal!==index+1)errors.push(`canonical_ordinal_mismatch:${index+1}`);
  for(const field of SEMANTIC_STORY_FIELDS)if(field==='visual'?(!story.visual||typeof story.visual!=='object'):!str(story[field],field==='summary'||field==='why_it_matters'||field==='what_to_do_now'?20:1))errors.push(`missing_semantic_field:${index+1}:${field}`);
  if(!str(story.story_id)||ids.has(story.story_id))errors.push(`unique_story_id_required:${index+1}`);else ids.add(story.story_id);
  if(!str(story.candidate_id)||candidates.has(story.candidate_id))errors.push(`unique_candidate_id_required:${index+1}`);else candidates.add(story.candidate_id);
  if(story.agent_skill===true)agentSkill++;
  if(!Array.isArray(story.topic_labels)||story.topic_labels.length<1)errors.push(`topic_labels_required:${index+1}`);
  if(!str(story.source_url))errors.push(`source_url_required:${index+1}`);else{try{normalizeUrl(story.source_url);}catch{errors.push(`valid_source_url_required:${index+1}`);}}
 }
 for(const focus of STORY_FOCUSES)if(focusCounts[focus]!==2)errors.push(`allocation_must_be_two:${focus}`);
 if(agentSkill!==1)errors.push('exactly_one_agent_skill_story_required');
 if(!str(kernel?.editorial_takeaway,20))errors.push('editorial_takeaway_required');
 if(!kernel?.media_decisions||typeof kernel.media_decisions!=='object')errors.push('media_decisions_required');
 if(!Array.isArray(kernel?.changed_watchlist_topics))errors.push('changed_watchlist_topics_required');
 return [...new Set(errors)];
}

export function assertEditorialKernel(kernel){const errors=validateEditorialKernel(kernel);if(errors.length)throw Error(errors.join('; '));return kernel;}

export function canonicalKernel(kernel){
 assertEditorialKernel(kernel);
 const normalized={...kernel,stories:kernel.stories.map(story=>({...story,source_url:normalizeUrl(story.source_url),topic_labels:[...story.topic_labels]})),changed_watchlist_topics:[...kernel.changed_watchlist_topics]};
 return normalized;
}

export function kernelReceipt(kernel){
 const normalized=canonicalKernel(kernel),text=JSON.stringify(normalized);
 return {schema_version:'1.0.0',edition_id:normalized.edition_id,brief_date:normalized.brief_date,baseline_sha:normalized.baseline_sha,kernel_sha256:sha256(text),story_count:6,allocation:{technical_ai_engineering:2,applied_genai_knowledge_workers:2,agents_non_technical_people:2},agent_skill_stories:1,normal_model_passes:1,normal_post_editorial_model_passes:0,deterministic_handoff_ready:true};
}

export function deterministicOwnership(){
 return {owned_by_code:['story_ids','slugs','dates','reader_order','permanent_urls','social_metadata','archive_and_feed_derivatives','analytics_skeleton','rating_share_ids','release_manifest','route_lists','completion_receipt','lifecycle_status'],owned_by_editorial_kernel:['story_selection','headline','summary','why_it_matters','what_to_do_now','topic_labels','editorial_limitation','visual_semantics','edition_takeaway','media_editorial_decisions','changed_watchlist_semantics'],rule:'After a valid canonical kernel is persisted, normal Work processing ends. Deterministic code owns derivation, build, tests, deployment verification, receipts, and unchanged-state handling.'};
}
