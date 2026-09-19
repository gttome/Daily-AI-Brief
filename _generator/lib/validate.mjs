import {EXPECTED_FOCUS_ORDER, TIMEZONE} from './constants.mjs';
import {PRIMARY_FRESHNESS_HOURS, DEFAULT_FALLBACK_HOURS, AGENT_SKILLS_FALLBACK_HOURS} from './research.mjs';
import {editionPodcasts,MULTI_PODCAST_EFFECTIVE_DATE,validatePodcastDiversity} from './podcasts.mjs';
import {VIDEO_MAX_AGE_HOURS,PODCAST_PRIMARY_AGE_DAYS,PODCAST_FALLBACK_AGE_DAYS,PODCAST_EXCEPTION_AGE_DAYS} from './media-selection.mjs';

const time=value=>typeof value==='string'&&value.trim()?Date.parse(value):NaN;
const agentSkillsStory=story=>/agent skills?/i.test([story.headline,...(story.topics||[])].join(' '));

export function validateEdition(edition) {
  const errors = [];
  const requireText = (value, field) => {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${field} is required`);
  };
  requireText(edition.schema_version, 'schema_version');
  requireText(edition.edition_id, 'edition_id');
  requireText(edition.brief_date, 'brief_date');
  requireText(edition.title, 'title');
  requireText(edition.coverage_period, 'coverage_period');
  requireText(edition.editorial_takeaway, 'editorial_takeaway');
  if (edition.timezone !== TIMEZONE) errors.push(`timezone must be ${TIMEZONE}`);
  if (edition.edition_id !== `dab-edition-${edition.brief_date}`) errors.push('edition_id must match brief_date');
  if (!Array.isArray(edition.stories) || edition.stories.length !== 6) errors.push('edition must contain exactly six stories');
  const freshnessRequired=edition.brief_date>='2026-09-16';
  const cutoff=time(edition.research_cutoff_at);
  if(freshnessRequired){
    requireText(edition.research_cutoff_at,'research_cutoff_at');
    if(!Number.isFinite(cutoff)||!edition.research_cutoff_at.startsWith(edition.brief_date))errors.push('research_cutoff_at must be a valid same-edition-date timestamp');
    if(!/24-hour primary window/i.test(edition.coverage_period||''))errors.push('coverage_period must state the 24-hour primary window');
  }
  const ids = new Set();
  const slugs = new Set();
  const sourceUrls = new Set();
  const editorialProfiles = new Set(['editorial_intelligence_v1', 'reader_foundation_v1', 'measurement_accessibility_v1', 'full_v1']);
  let fallbackCount=0;
  (edition.stories || []).forEach((story, index) => {
    const label = `stories[${index}]`;
    if (story.ordinal !== index + 1) errors.push(`${label}.ordinal must equal ${index + 1}`);
    if (story.focus !== EXPECTED_FOCUS_ORDER[index]) errors.push(`${label}.focus violates ordered 2/2/2 allocation`);
    const storyFields=['story_id', 'slug', 'permanent_url', 'headline', 'event_date', 'summary', 'why_it_matters'];
    if(!freshnessRequired)storyFields.push('george_implication');
    for (const field of storyFields) requireText(story[field], `${label}.${field}`);
    if (!story.story_id?.startsWith(`dab-story-${edition.brief_date}-`)) errors.push(`${label}.story_id must match brief_date`);
    if (story.permanent_url !== `/stories/${edition.brief_date}/${story.slug}/`) errors.push(`${label}.permanent_url must match date and slug`);
    if (ids.has(story.story_id)) errors.push(`${label}.story_id is duplicated`);
    if (slugs.has(story.slug)) errors.push(`${label}.slug is duplicated`);
    ids.add(story.story_id);
    slugs.add(story.slug);
    if (!Array.isArray(story.topics) || !story.topics.length) errors.push(`${label}.topics is required`);
    if (!story.image || !story.image.path?.startsWith(`briefs/images/${edition.brief_date}/`)) errors.push(`${label}.image path must match brief_date`);
    requireText(story.image?.alt, `${label}.image.alt`);
    try { new URL(story.image?.public_url); } catch { errors.push(`${label}.image.public_url is invalid`); }
    if (!story.source) errors.push(`${label}.source is required`);
    else {
      requireText(story.source.title, `${label}.source.title`);
      try { new URL(story.source.url); } catch { errors.push(`${label}.source.url is invalid`); }
      try { new URL(story.source.normalized_url); } catch { errors.push(`${label}.source.normalized_url is invalid`); }
      if (sourceUrls.has(story.source.normalized_url)) errors.push(`${label}.source.normalized_url is duplicated`);
      sourceUrls.add(story.source.normalized_url);
    }
    if(freshnessRequired){
      const f=story.freshness;
      if(!f||!['primary','fallback'].includes(f.tier))errors.push(`${label}.freshness.tier must be primary or fallback`);
      const published=time(f?.source_published_at);
      if(!Number.isFinite(published))errors.push(`${label}.freshness.source_published_at must be a verified timestamp`);
      else if(Number.isFinite(cutoff)){
        const ageHours=(cutoff-published)/3600000;
        if(ageHours<0)errors.push(`${label}.freshness source timestamp is after the research cutoff`);
        if(f?.tier==='primary'&&ageHours>PRIMARY_FRESHNESS_HOURS)errors.push(`${label}.freshness primary story exceeds ${PRIMARY_FRESHNESS_HOURS} hours`);
        if(f?.tier==='fallback'){
          fallbackCount++;
          requireText(f.fallback_reason,`${label}.freshness.fallback_reason`);
          if(ageHours<=PRIMARY_FRESHNESS_HOURS)errors.push(`${label}.freshness fallback is still inside the primary window`);
          const maxHours=agentSkillsStory(story)?AGENT_SKILLS_FALLBACK_HOURS:DEFAULT_FALLBACK_HOURS;
          if(ageHours>maxHours)errors.push(`${label}.freshness fallback exceeds ${maxHours} hours`);
        }
      }
    }
    if (story.candidate_score) {
      const dimensions = ['significance', 'freshness', 'authority', 'evidence_quality', 'novelty', 'practical_value', 'category_fit'];
      const sum = dimensions.reduce((total, key) => total + story.candidate_score[key], 0);
      if (sum !== story.candidate_score.total) errors.push(`${label}.candidate_score.total is incorrect`);
      requireText(story.candidate_score.selection_rationale, `${label}.candidate_score.selection_rationale`);
    }
    if (story.novelty?.disposition === 'new' && (story.novelty.prior_story_ids?.length || story.novelty.what_changed !== null)) errors.push(`${label}.novelty new stories cannot cite prior coverage`);
    if (story.novelty && story.novelty.disposition !== 'new' && (!story.novelty.prior_story_ids?.length || !story.novelty.what_changed?.trim())) errors.push(`${label}.novelty repeated coverage requires lineage and what_changed`);
    if (editorialProfiles.has(edition.policy_profile)) {
      for (const field of ['novelty', 'candidate_score']) if (!story[field]) errors.push(`${label}.${field} is required by ${edition.policy_profile}`);
      for (const field of ['evidence_type', 'availability_status']) if (!story.source?.[field]) errors.push(`${label}.source.${field} is required by ${edition.policy_profile}`);
    }
    if (edition.policy_profile === 'full_v1' && !story.what_to_do_now) errors.push(`${label}.what_to_do_now is required by full_v1`);
  });
  if(freshnessRequired&&fallbackCount>0&&!/recency fallback/i.test(edition.coverage_period||''))errors.push('coverage_period must disclose recency fallback use');

  const completeMediaRequired=edition.brief_date>='2026-09-19';
  for (const slot of ['general', 'agents_non_technical_people']) {
    const video = edition.worth_watching?.[slot];
    if (!video) errors.push(`worth_watching.${slot} is required`);
    else if (video.status === 'empty') requireText(video.exception, `worth_watching.${slot}.exception`);
    else if (video.status === 'included' && (!Number.isInteger(video.runtime_seconds) || video.runtime_seconds < 1 || video.runtime_seconds > 1200)) errors.push(`worth_watching.${slot}.runtime_seconds must be 1-1200`);
    else if (video.status==='included' && edition.brief_date>='2026-09-11') {
      const ageHours=(Date.parse(edition.brief_date)-Date.parse(video.upload_date))/3600000;
      const maxAge=edition.brief_date>=MULTI_PODCAST_EFFECTIVE_DATE?VIDEO_MAX_AGE_HOURS:30*24;
      if(!Number.isFinite(ageHours)||ageHours<0||ageHours>maxAge)errors.push(`worth_watching.${slot} requires a verified upload date within ${maxAge} hours`);
      if(video.runtime_seconds>600 && (!video.short_search_evidence?.length || !['fallback','last_resort'].includes(video.duration_tier)||!video.fallback_reason?.trim()))errors.push(`worth_watching.${slot} requires documented short-video search and fallback reason`);
      if(video.runtime_seconds>900 && video.duration_tier!=='last_resort')errors.push(`worth_watching.${slot} requires last_resort duration tier above 15 minutes`);
    }
    else if (!['empty', 'included'].includes(video.status)) errors.push(`worth_watching.${slot}.status is invalid`);
  }
  if(completeMediaRequired){
    const includedVideos=Object.values(edition.worth_watching||{}).filter(item=>item?.status==='included').length;
    if(includedVideos!==2)errors.push('edition must contain exactly two included videos beginning 2026-09-19');
  }

  const multiPodcast=edition.brief_date>=MULTI_PODCAST_EFFECTIVE_DATE;
  if(multiPodcast&&edition.podcasts!==undefined&&!Array.isArray(edition.podcasts))errors.push('podcasts must be an array for new editions');
  if(multiPodcast&&edition.policy_profile==='full_v1'&&!Array.isArray(edition.podcasts))errors.push('podcasts collection is required for full_v1 editions beginning 2026-09-18');
  const podcasts=editionPodcasts(edition);
  if(completeMediaRequired&&podcasts.length!==2)errors.push('edition must contain exactly two included podcasts beginning 2026-09-19');
  errors.push(...validatePodcastDiversity(edition));
  if(multiPodcast&&podcasts.length!==edition.podcasts?.length)errors.push('podcasts collection may contain only included podcast items');
  if(!multiPodcast&&edition.policy_profile==='full_v1'&&edition.brief_date>='2026-09-10'&&!edition.podcast)errors.push('podcast slot 9 is required');

  const validatePodcast=(podcast,index)=>{
    const label=multiPodcast?`podcasts[${index}]`:'podcast';
    const podcastFields=['item_id','title','show','host','publication_date','summary','why_useful','connection','selection_rationale','verification_note','coverage_note'];
    if(!freshnessRequired)podcastFields.push('george_implication');
    for (const field of podcastFields) requireText(podcast[field], `${label}.${field}`);
    if (!podcast.item_id?.startsWith(`dab-podcast-${edition.brief_date}-`)) errors.push(`${label}.item_id must match brief_date`);
    const expectedOrdinal=multiPodcast?9+index:9;
    if (podcast.ordinal !== expectedOrdinal) errors.push(`${label}.ordinal must be ${expectedOrdinal}`);
    if (!podcast.permanent_url?.startsWith(`/podcasts/${edition.brief_date}/`)) errors.push(`${label}.permanent_url must match brief_date`);
    if (!EXPECTED_FOCUS_ORDER.includes(podcast.focus)) errors.push(`${label}.focus is invalid`);
    if (podcast.runtime_seconds !== null && (!Number.isInteger(podcast.runtime_seconds) || podcast.runtime_seconds < 1)) errors.push(`${label} runtime must be positive or unknown; no maximum`);
    if (!podcast.platforms?.length || !podcast.topics?.length) errors.push(`${label} platforms and topics are required`);
    for (const url of [podcast.url, ...(podcast.platforms || []).map(p => p.url)]) {
      try { if (new URL(url).protocol !== 'https:') throw Error(); } catch { errors.push(`${label} URL must be HTTPS`); }
    }
    const otherUrls=[...sourceUrls,...Object.values(edition.worth_watching||{}).map(v=>v.url),...podcasts.filter((_,i)=>i!==index).flatMap(p=>[p.url,...(p.platforms||[]).map(x=>x.url)])];
    if ([podcast.url,...(podcast.platforms || []).map(p => p.url)].some(url => otherUrls.includes(url))) errors.push(`${label} duplicates another edition item`);
    if(multiPodcast){
      const age=(Date.parse(edition.brief_date)-Date.parse(podcast.publication_date))/86400000;
      if(!Number.isFinite(age)||age<0||age>PODCAST_EXCEPTION_AGE_DAYS)errors.push(`${label} exceeds the ${PODCAST_EXCEPTION_AGE_DAYS}-day absolute freshness ceiling`);
      else if(age>PODCAST_PRIMARY_AGE_DAYS){
        requireText(podcast.freshness_exception_reason,`${label}.freshness_exception_reason`);
        const expectedTier=age<=PODCAST_FALLBACK_AGE_DAYS?'fallback_7d':'exception_30d';
        if(podcast.freshness_tier!==expectedTier)errors.push(`${label}.freshness_tier must be ${expectedTier}`);
      }else if(podcast.freshness_tier&&podcast.freshness_tier!=='primary_48h')errors.push(`${label}.freshness_tier must be primary_48h inside the primary window`);
    }
  };
  podcasts.forEach(validatePodcast);
  if(!multiPodcast&&edition.podcast?.status==='empty')requireText(edition.podcast.exception,'podcast.exception');
  else if(!multiPodcast&&edition.podcast&&!['empty','included'].includes(edition.podcast.status))errors.push('podcast.status is invalid');
  return errors;
}

export function assertValidEdition(edition) {
  const errors = validateEdition(edition);
  if (errors.length) throw new Error(`Edition validation failed:\n- ${errors.join('\n- ')}`);
}
