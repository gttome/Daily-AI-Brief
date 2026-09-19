import {sha256,normalizeUrl} from './util.mjs';
import {MULTI_PODCAST_EFFECTIVE_DATE} from './podcasts.mjs';

export const EDITORIAL_KERNEL_VERSION='1.0.0';
export const STORY_FOCUSES=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const SEMANTIC_TEXT_FIELDS=['candidate_id','headline','summary','why_it_matters','editorial_limitation'];
const ACTIONS=['test','monitor','update_policy','teach','adopt','evaluate','ignore_for_now'];
const str=(v,min=1)=>typeof v==='string'&&v.trim().length>=min;
const slug=value=>String(value||'story').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'')||'story';

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
  for(const field of SEMANTIC_TEXT_FIELDS)if(!str(story[field],field==='summary'||field==='why_it_matters'?20:1))errors.push(`missing_semantic_field:${index+1}:${field}`);
  if(!story.visual||typeof story.visual!=='object')errors.push(`missing_semantic_field:${index+1}:visual`);
  const action=story.what_to_do_now;
  if(!action||!ACTIONS.includes(action.action)||!str(action.label)||!str(action.rationale,20))errors.push(`valid_what_to_do_now_required:${index+1}`);
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
 return {...kernel,stories:kernel.stories.map(story=>({...story,source_url:normalizeUrl(story.source_url),topic_labels:[...story.topic_labels],what_to_do_now:{...story.what_to_do_now}})),changed_watchlist_topics:[...kernel.changed_watchlist_topics]};
}

export function kernelReceipt(kernel){
 const normalized=canonicalKernel(kernel),text=JSON.stringify(normalized);
 return {schema_version:'1.0.0',edition_id:normalized.edition_id,brief_date:normalized.brief_date,baseline_sha:normalized.baseline_sha,kernel_sha256:sha256(text),story_count:6,allocation:{technical_ai_engineering:2,applied_genai_knowledge_workers:2,agents_non_technical_people:2},agent_skill_stories:1,normal_model_passes:1,normal_post_editorial_model_passes:0,deterministic_handoff_ready:true};
}

export function expandEditorialKernel(kernel,{candidateFacts,imageAssets,metadataCandidates,media,publishedAt,coveragePeriod,createdBy='deterministic-kernel-expander'}={}){
 const normalized=canonicalKernel(kernel);
 if(!candidateFacts||typeof candidateFacts!=='object'||!imageAssets||typeof imageAssets!=='object')throw Error('candidateFacts and imageAssets are required deterministic inputs');
 if(!Number.isFinite(Date.parse(publishedAt||''))||!str(coveragePeriod,20))throw Error('Measured publication timestamp and coverage period required');
 if(!metadataCandidates||typeof metadataCandidates!=='object'||!Array.isArray(metadataCandidates.candidates)){
  metadataCandidates={cutoff:publishedAt,candidates:Object.entries(candidateFacts).map(([candidate_id,fact])=>({candidate_id,canonical_url:fact?.source?.url,published_at:fact?.source?.publication_date?`${fact.source.publication_date}T00:00:00Z`:fact?.event_date?`${fact.event_date}T00:00:00Z`:null}))};
 }
 const researchCutoffAt=metadataCandidates.cutoff;
 if(!Number.isFinite(Date.parse(researchCutoffAt||''))||!String(researchCutoffAt).startsWith(normalized.brief_date))throw Error('Verified same-date research cutoff required from metadata gate');
 const metadataById=new Map(metadataCandidates.candidates.map(item=>[item.candidate_id,item]));
 let fallbackUsed=false;
 const stories=normalized.stories.map(story=>{
  const fact=candidateFacts[story.candidate_id],image=imageAssets[story.candidate_id],metadata=metadataById.get(story.candidate_id);
  if(!fact||!image)throw Error(`Missing deterministic evidence or image asset for ${story.candidate_id}`);
  if(!metadata)throw Error(`Missing bounded metadata candidate for ${story.candidate_id}`);
  if(normalizeUrl(fact.source?.url)!==story.source_url)throw Error(`Kernel source does not match reviewed candidate evidence: ${story.candidate_id}`);
  if(normalizeUrl(metadata.canonical_url)!==story.source_url)throw Error(`Kernel source does not match bounded metadata candidate: ${story.candidate_id}`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fact.event_date||''))throw Error(`Verified event date required: ${story.candidate_id}`);
  const sourcePublishedAt=metadata.published_at||metadata.metadata_event_at;
  const publishedMs=Date.parse(sourcePublishedAt||''),cutoffMs=Date.parse(researchCutoffAt);
  if(!Number.isFinite(publishedMs)||publishedMs>cutoffMs)throw Error(`Verified pre-cutoff source timestamp required: ${story.candidate_id}`);
  const ageHours=(cutoffMs-publishedMs)/3600000;
  const freshnessTier=ageHours<=24?'primary':'fallback';
  if(freshnessTier==='fallback')fallbackUsed=true;
  const freshness=freshnessTier==='primary'
   ?{tier:'primary',source_published_at:sourcePublishedAt}
   :{tier:'fallback',source_published_at:sourcePublishedAt,fallback_reason:story.agent_skill===true&&ageHours>72
      ?'Outside the 24-hour primary window; included under the documented Agent Skills recency exception after bounded review.'
      :'Outside the 24-hour primary window; included under the documented recency fallback after bounded review.'};
  const storySlug=slug(story.headline),idSuffix=sha256(`${normalized.brief_date}|${story.candidate_id}`).slice(0,8);
  const publicImage=`https://gttome.github.io/Daily-AI-Brief/${image.path}${image.cache_key?`?v=${encodeURIComponent(image.cache_key)}`:''}`;
  const sourceWordCount=Number.isInteger(fact.source_word_count)&&fact.source_word_count>0?fact.source_word_count:Number.isInteger(fact.source?.word_count)&&fact.source.word_count>0?fact.source.word_count:null;
  const sourceReading=sourceWordCount?{status:'verified',word_count:sourceWordCount,verified_at:fact.source_fetched_at||fact.source?.word_count_verified_at||publishedAt,method:fact.source_word_count_method||fact.source?.word_count_method||'retrieved_source_text_word_count',words_per_minute:200}:null;
  const selectionRationale=fact.selection_rationale||fact.score?.rationale||story.why_it_matters;
  const candidateScore=fact.candidate_score?{...fact.candidate_score,selection_rationale:fact.candidate_score.selection_rationale||selectionRationale}:undefined;
  return {story_id:`dab-story-${normalized.brief_date}-${idSuffix}`,ordinal:story.canonical_ordinal,slug:storySlug,permanent_url:`/stories/${normalized.brief_date}/${storySlug}/`,focus:story.focus,headline:story.headline,event_date:fact.event_date,topics:[...story.topic_labels],companies:[...(fact.companies||[])],image:{path:image.path,public_url:publicImage,alt:image.alt,width:image.width||1200,height:image.height||630,kind:image.kind||'editorial_explainer',...(image.cache_key?{cache_key:image.cache_key}:{})},summary:story.summary,why_it_matters:story.why_it_matters,source:{title:fact.source.title,organization:fact.source.organization,url:story.source_url,normalized_url:story.source_url,publication_date:fact.source.publication_date??sourcePublishedAt.slice(0,10),evidence_type:fact.source.evidence_type,availability_status:fact.source.availability_status,...(sourceReading?{reading_evidence:sourceReading}:{})},freshness,selection_rationale:selectionRationale,novelty:fact.novelty?{...fact.novelty}:{disposition:'new',prior_story_ids:[],what_changed:null},candidate_score:candidateScore,what_to_do_now:{...story.what_to_do_now},social_description:story.why_it_matters.slice(0,180),social:{title:story.headline,description:story.why_it_matters.slice(0,180),image_url:publicImage}};
 });
 const canonicalCoverage=`24-hour primary window ending at ${researchCutoffAt}${fallbackUsed?'; recency fallback used for reviewed items outside the primary window.':'.'}`;
 const base={schema_version:'1.0.0',policy_profile:'under80-v1',edition_id:normalized.edition_id,brief_date:normalized.brief_date,timezone:'America/Chicago',title:`Daily Generative AI Brief — ${new Date(`${normalized.brief_date}T12:00:00Z`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}`,published_at:publishedAt,research_cutoff_at:researchCutoffAt,coverage_period:canonicalCoverage,status:'staged',stories,worth_watching:media?.worth_watching||{general:{status:'empty',exception:'No video met today’s editorial quality standards.'},agents_non_technical_people:{status:'empty',exception:'No video met today’s editorial quality standards.'}},editorial_takeaway:normalized.editorial_takeaway,provenance:{created_by:createdBy,created_at:publishedAt,source_commit:normalized.baseline_sha}};
 if(normalized.brief_date>=MULTI_PODCAST_EFFECTIVE_DATE){
  const publishablePodcasts=Array.isArray(media?.podcasts)?media.podcasts.filter(item=>item?.status==='included'):[];
  return {...base,podcasts:publishablePodcasts};
 }
 return {...base,...(media?.podcast?.status==='included'?{podcast:media.podcast}:{})};
}

export function deterministicOwnership(){
 return {owned_by_code:['story_ids','slugs','dates','reader_order','permanent_urls','social_metadata','archive_and_feed_derivatives','analytics_skeleton','rating_share_ids','release_manifest','route_lists','completion_receipt','lifecycle_status'],owned_by_editorial_kernel:['story_selection','headline','summary','why_it_matters','what_to_do_now','topic_labels','editorial_limitation','visual_semantics','edition_takeaway','media_editorial_decisions','changed_watchlist_semantics'],rule:'After a valid canonical kernel is persisted, normal Work processing ends. Deterministic code owns derivation, build, tests, deployment verification, receipts, and unchanged-state handling.'};
}
