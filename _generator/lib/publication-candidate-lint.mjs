import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './util.mjs';
import {inspectPng,inspectWebp} from './visual-output.mjs';
import {publicWatchlist,watchlistDailyState,watchlistDailySummary} from './watchlist.mjs';
import {validateHandoffCheckpoint} from './run-state.mjs';

const exists=(root,p)=>typeof p==='string'&&fs.existsSync(path.join(root,p));
const included=x=>['included','selected'].includes(x?.status);
const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'');}catch{return null;}};

export function expectedWatchlistSurface(data){
 const counts=watchlistDailySummary(data),changed=(data.topics||[]).filter(t=>t.status!=='archived'&&['new_today','updated_today'].includes(watchlistDailyState(t,data.edition_date))).map(t=>({topic_id:t.topic_id,name:t.name,state:watchlistDailyState(t,data.edition_date)}));
 return {counts,changed_topics:changed};
}
export function lintPublicationCandidate({root,edition,kernel,media,imageManifest,mediaReceipt,canonicalWatchlist,publicWatchlistData,handoff,runtime,gitEvidence={}}){
 const errors=[],date=edition?.brief_date;
 if(!edition||!kernel||!media||!handoff||!runtime) return ['candidate_inputs_missing'];
 if((edition.stories||[]).length!==6)errors.push('exactly_6_stories_required');
 const focus=edition.stories?.map(s=>s.focus)||[];
 const expected=['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'];
 if(JSON.stringify(focus)!==JSON.stringify(expected))errors.push('exact_2_2_2_order_required');
 if((kernel.stories||[]).filter(s=>s.agent_skill===true).length!==1)errors.push('exactly_1_agent_skills_story_required');
 if(runtime.output?.display_focus_labels?.agents_non_technical_people!=='Agents for Everyone')errors.push('agents_for_everyone_display_label_required');

 const entries=Object.values(imageManifest||{}),hashes=new Set();
 if(entries.length!==6)errors.push('exactly_6_image_manifest_entries_required');
 for(const story of edition.stories||[]){
  const entry=entries.find(x=>x?.path===story.image?.path);
  if(!entry){errors.push('image_manifest_missing:'+story.story_id);continue;}
  if(entry.accepted_locked!==true||entry.lock_status!=='accepted_locked')errors.push('image_lock_required:'+story.story_id);
  const file=path.join(root,entry.path||'');
  if(!fs.existsSync(file)){errors.push('image_file_missing:'+story.story_id);continue;}
  const bytes=fs.readFileSync(file),ext=path.extname(file).toLowerCase(),inspection=ext==='.webp'?inspectWebp(bytes,{minimumWidth:1200,minimumHeight:630}):ext==='.png'?inspectPng(bytes,{minimumWidth:1200,minimumHeight:630}):{pass:false,width:0,height:0,errors:['unsupported']};
  const hash=sha256(bytes);hashes.add(hash);
  if(!inspection.pass||inspection.width!==1200||inspection.height!==630)errors.push('image_canvas_invalid:'+story.story_id);
  if(entry.sha256!==hash)errors.push('image_hash_mismatch:'+story.story_id);
  if(date>='2026-09-24'){
   if(entry.story_id!==story.story_id)errors.push('image_story_id_required:'+story.story_id);
   if(entry.locked!==true)errors.push('image_locked_true_required:'+story.story_id);
   if(entry.inspection_result!=='pass')errors.push('image_inspection_pass_required:'+story.story_id);
   if(!/^[a-f0-9]{40,64}$/.test(entry.git_blob_sha||''))errors.push('image_git_blob_identity_required:'+story.story_id);
  }
 }
 if(hashes.size!==6)errors.push('six_distinct_image_hashes_required');

 const videos=Object.values(media.worth_watching||{}).filter(included),podcasts=(media.podcasts||[]).filter(included);
 if(videos.length!==2)errors.push('exactly_2_videos_required');
 if(podcasts.length!==2)errors.push('exactly_2_podcasts_required');
 if(new Set(podcasts.map(p=>host(p.url)||p.show||p.source)).size!==2)errors.push('podcast_source_diversity_required');
 if(date>='2026-09-24'){
  if(!mediaReceipt||mediaReceipt.edition_id!==edition.edition_id)errors.push('current_day_media_receipt_required');
  else{
   if(!/^[a-f0-9]{64}$/.test(mediaReceipt.editorial_kernel_sha256||''))errors.push('media_kernel_hash_required');
   if(!mediaReceipt.verification_timestamp)errors.push('media_verification_timestamp_required');
   if(mediaReceipt.podcast_source_diversity?.pass!==true)errors.push('media_source_diversity_receipt_required');
   if((mediaReceipt.items||[]).length!==4||(mediaReceipt.items||[]).some(x=>!x.verification_evidence))errors.push('media_verification_evidence_required');
  }
 }

 if(canonicalWatchlist?.edition_date!==date)errors.push('current_watchlist_edition_date_required');
 try{if(JSON.stringify(publicWatchlist(canonicalWatchlist))!==JSON.stringify(publicWatchlistData))errors.push('public_watchlist_must_be_generated_from_canonical');}catch{errors.push('canonical_watchlist_invalid');}
 const surface=expectedWatchlistSurface(canonicalWatchlist||{edition_date:date,topics:[]});
 const countsText=surface.counts.new_today+' new today · '+surface.counts.updated_today+' updated · '+surface.counts.carried_forward+' carried forward.';
 for(const p of ['index.md','latest.md','briefs/'+date+'.md']){
  if(!exists(root,p)){errors.push('required_teaser_surface_missing:'+p);continue;}
  const page=fs.readFileSync(path.join(root,p),'utf8');
  if(!page.includes(countsText))errors.push('watchlist_teaser_count_mismatch:'+p);
  for(const topic of surface.changed_topics)if(!page.includes(topic.name))errors.push('watchlist_teaser_changed_topic_missing:'+p+':'+topic.topic_id);
 }
 const pointerPath=path.join(root,'data/operations/current-edition.json');
 if(!fs.existsSync(pointerPath))errors.push('current_edition_pointer_missing');
 else {const pointer=JSON.parse(fs.readFileSync(pointerPath,'utf8'));if(pointer.brief_date!==date||pointer.edition_id!==edition.edition_id)errors.push('current_edition_pointer_mismatch');}
 const required=['_data/editions/'+date+'.json','briefs/'+date+'.md','latest.md','index.md','archive.md','feed.json','feed.xml',
  ...edition.stories.map(s=>'stories/'+date+'/'+s.slug+'.md')];
 for(const p of required)if(!exists(root,p))errors.push('required_derived_file_missing:'+p);

 const handoffErrors=validateHandoffCheckpoint({
  baselineSha:gitEvidence.baselineSha,branchHeadSha:gitEvidence.handoffHeadSha,parentSha:gitEvidence.handoffParentSha,
  actualStagingRef:gitEvidence.actualStagingRef,manifest:handoff,requiredFileExists:p=>exists(root,p),imageEntries:entries,
  candidateHeadSha:gitEvidence.candidateHeadSha,prHeadSha:gitEvidence.prHeadSha
 });
 errors.push(...handoffErrors);
 return [...new Set(errors)];
}
