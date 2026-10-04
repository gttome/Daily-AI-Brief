import fs from 'node:fs';
import path from 'node:path';
import {validateEdition} from './validate.mjs';
import {generatedFiles,renderDated,renderIndex,renderLatest} from './render.mjs';

export const READER_SEMANTIC_CLOSE_GATE_VERSION='reader-semantic-close-gate-v1';
export const READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE='2026-10-05';

const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'');
const uniq=values=>[...new Set(values)];
const count=(text,re)=>(String(text||'').match(re)||[]).length;
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));

function savedText(root,relative,fileOverrides){
  if(Object.prototype.hasOwnProperty.call(fileOverrides,relative))return fileOverrides[relative];
  const file=path.join(root,relative);
  return fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
}

function checkFileExact(root,relative,expected,errors,checks,label,fileOverrides){
  const actual=savedText(root,relative,fileOverrides);
  if(actual===null){errors.push(label+':missing:'+relative);checks[label]=false;return;}
  const ok=actual===expected;
  checks[label]=ok;
  if(!ok)errors.push(label+':canonical_mismatch:'+relative);
}

export function evaluateReaderSemanticCloseGate({root='.',editionDate,executionKey=null,observedAt=new Date().toISOString(),fileOverrides={}}={}){
  if(!date(editionDate))throw Error('reader_semantic_gate_valid_date_required');
  if(!fileOverrides||typeof fileOverrides!=='object'||Array.isArray(fileOverrides))throw Error('reader_semantic_gate_file_overrides_object_required');
  const repoRoot=path.resolve(root);
  const errors=[],checks={};
  const editionFile=path.join(repoRoot,'_data/editions',editionDate+'.json');
  const watchlistFile=path.join(repoRoot,'_data/watchlist.json');
  const booksFile=path.join(repoRoot,'_data/book-reading.json');
  if(!fs.existsSync(editionFile))errors.push('edition_json_missing');
  if(!fs.existsSync(watchlistFile))errors.push('watchlist_json_missing');
  if(!fs.existsSync(booksFile))errors.push('book_reading_json_missing');
  if(errors.length)return {schema_version:READER_SEMANTIC_CLOSE_GATE_VERSION,edition_date:editionDate,observed_at:observedAt,result:'FAIL',checks,errors};

  const edition=readJson(editionFile),watchlist=readJson(watchlistFile),books=readJson(booksFile);
  const editionErrors=validateEdition(edition);
  checks.edition_contract=editionErrors.length===0;
  errors.push(...editionErrors.map(error=>'edition:'+error));

  const stories=Array.isArray(edition.stories)?edition.stories:[];
  checks.six_articles=stories.length===6;
  if(!checks.six_articles)errors.push('exactly_six_articles_required');

  const focusOrder=stories.map(story=>story.focus);
  const expectedFocus=['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'];
  checks.ordered_2_2_2=JSON.stringify(focusOrder)===JSON.stringify(expectedFocus);
  if(!checks.ordered_2_2_2)errors.push('ordered_2_2_2_required');

  const selectionFile=executionKey?path.join(repoRoot,'_records','editorial',executionKey,'story-selection.json'):null;
  const selection=selectionFile&&fs.existsSync(selectionFile)?readJson(selectionFile):null;
  const selected=Array.isArray(selection?.selected)?selection.selected:[];
  const agentSkillsSelections=selected.filter(item=>item?.role==='agent_skills');
  const agentSkillsOk=selection?.edition_id===edition.edition_id&&selection?.selection_locked===true&&
    selection?.checks?.exact_one_reusable_agent_skills_story===true&&selected.length===6&&
    agentSkillsSelections.length===1&&selection?.agent_skills_candidate_id===agentSkillsSelections[0]?.candidate_id;
  checks.exactly_one_agent_skill_story=agentSkillsOk;
  if(!agentSkillsOk)errors.push('authoritative_exactly_one_agent_skills_story_required');

  const videos=Object.values(edition.worth_watching||{}).filter(item=>item?.status==='included');
  const podcasts=Array.isArray(edition.podcasts)?edition.podcasts.filter(item=>item?.status==='included'):(edition.podcast?.status==='included'?[edition.podcast]:[]);
  checks.two_videos=videos.length===2;
  checks.two_podcasts=podcasts.length===2;
  if(!checks.two_videos)errors.push('exactly_two_videos_required');
  if(!checks.two_podcasts)errors.push('exactly_two_podcasts_required');

  for(const [index,story] of stories.entries()){
    const prefix='story_'+String(index+1).padStart(2,'0');
    const reading=story.source?.reading_evidence;
    const readingOk=reading?.status==='verified'&&reading?.full_source_read===true&&Number(reading?.word_count)>0;
    checks[prefix+'_reading_evidence']=readingOk;
    if(!readingOk)errors.push(prefix+':verified_reading_evidence_required');

    const freshnessOk=['primary','fallback'].includes(story.freshness?.tier)&&typeof story.freshness?.source_published_at==='string';
    checks[prefix+'_freshness']=freshnessOk;
    if(!freshnessOk)errors.push(prefix+':freshness_context_required');

    const topicsOk=Array.isArray(story.topics)&&story.topics.length>0&&!story.topics.some(topic=>/^m\d{2}$/i.test(String(topic).trim()));
    checks[prefix+'_topics']=topicsOk;
    if(!topicsOk)errors.push(prefix+':reader_topics_required');

    const evidenceOk=Boolean(story.source?.evidence_type&&story.source?.availability_status&&story.source?.url&&story.source?.title);
    checks[prefix+'_evidence_availability']=evidenceOk;
    if(!evidenceOk)errors.push(prefix+':evidence_and_availability_required');

    const imageOk=Boolean(story.image?.path&&story.image?.public_url&&story.image?.alt&&fs.existsSync(path.join(repoRoot,story.image.path)));
    checks[prefix+'_accepted_image_metadata']=imageOk;
    if(!imageOk)errors.push(prefix+':accepted_image_or_metadata_missing');
  }

  const storyIds=new Set(stories.map(story=>story.story_id));
  const mappings=(books.editions?.[editionDate]||[]).filter(mapping=>storyIds.has(mapping.item_id));
  const mappedIds=new Set(mappings.map(mapping=>mapping.item_id));
  checks.book_bridge_mapping_count=mappedIds.size;
  if(mappedIds.size!==stories.length)errors.push('book_bridge_required_for_each_article');

  const watchlistOk=watchlist.edition_date===editionDate&&Array.isArray(watchlist.topics)&&watchlist.topics.length>0;
  checks.watchlist_daily_state=watchlistOk;
  if(!watchlistOk)errors.push('detailed_watchlist_daily_state_required');

  const expected=generatedFiles(edition,repoRoot,{watchlist});
  const dated=renderDated(edition,{watchlist});
  const latest=renderLatest(edition,{watchlist});
  const index=renderIndex(edition,{watchlist});
  checkFileExact(repoRoot,'briefs/'+editionDate+'.md',dated,errors,checks,'dated_brief_canonical',fileOverrides);
  checkFileExact(repoRoot,'latest.md',latest,errors,checks,'latest_canonical',fileOverrides);
  checkFileExact(repoRoot,'index.md',index,errors,checks,'homepage_canonical',fileOverrides);

  const overviewOk=/IN THIS EDITION · 6 ARTICLES \/ 2 VIDEOS \/ 2 PODCASTS/.test(dated);
  checks.edition_overview=overviewOk;
  if(!overviewOk)errors.push('edition_overview_missing');

  const ratingCount=count(dated,/class="story-feedback story-feedback-compact star-feedback"/g);
  checks.rating_control_count=ratingCount;
  if(ratingCount!==10)errors.push('ten_rating_controls_required');

  const bookBridgeCount=count(dated,/class="book-bridge"/g);
  checks.book_bridge_render_count=bookBridgeCount;
  if(bookBridgeCount<mappedIds.size)errors.push('required_book_bridge_not_rendered');

  const watchlistRenderOk=[
    'watchlist-daily-summary','New today:','Updated today:','Carried forward:','Archived / dropped recently:'
  ].every(token=>dated.includes(token));
  checks.watchlist_reader_detail=watchlistRenderOk;
  if(!watchlistRenderOk)errors.push('watchlist_daily_detail_not_rendered');

  const navigationOk=dated.includes('CONTINUE LEARNING')&&dated.includes('View Briefs Archive');
  checks.continue_learning_and_archive=navigationOk;
  if(!navigationOk)errors.push('continue_learning_or_archive_navigation_missing');

  const permanentPages=[];
  for(const story of stories){
    const relative='stories/'+editionDate+'/'+story.slug+'.md';
    const canonical=expected.get(relative);
    if(typeof canonical!=='string'){errors.push('canonical_permanent_story_missing:'+relative);continue;}
    checkFileExact(repoRoot,relative,canonical,errors,checks,'permanent_story_'+story.ordinal,fileOverrides);
    const actual=savedText(repoRoot,relative,fileOverrides)||'';
    const mapped=mappedIds.has(story.story_id);
    const semantic=
      actual.includes('class="reading-context"')&&
      actual.includes('class="story-feedback story-feedback-compact star-feedback"')&&
      actual.includes('**Evidence:**')&&actual.includes('**Availability:**')&&
      actual.includes(story.image.public_url)&&actual.includes(story.source.url)&&
      (!mapped||actual.includes('class="book-bridge"'));
    checks['permanent_story_'+story.ordinal+'_semantic']=semantic;
    if(!semantic)errors.push('permanent_story_semantic_incomplete:'+relative);
    permanentPages.push(relative);
  }
  checks.exactly_six_permanent_story_pages=permanentPages.length===6&&stories.length===6;
  if(!checks.exactly_six_permanent_story_pages)errors.push('exactly_six_permanent_story_pages_required');

  return {
    schema_version:READER_SEMANTIC_CLOSE_GATE_VERSION,
    effective_date:READER_SEMANTIC_CLOSE_GATE_EFFECTIVE_DATE,
    edition_date:editionDate,edition_id:edition.edition_id||null,observed_at:observedAt,
    result:errors.length?'FAIL':'PASS',checks,errors:uniq(errors),
    permanent_story_pages:permanentPages
  };
}
