import {EXPECTED_FOCUS_ORDER, TIMEZONE} from './constants.mjs';

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
  const ids = new Set();
  const slugs = new Set();
  const sourceUrls = new Set();
  const editorialProfiles = new Set(['editorial_intelligence_v1', 'reader_foundation_v1', 'measurement_accessibility_v1', 'full_v1']);
  (edition.stories || []).forEach((story, index) => {
    const label = `stories[${index}]`;
    if (story.ordinal !== index + 1) errors.push(`${label}.ordinal must equal ${index + 1}`);
    if (story.focus !== EXPECTED_FOCUS_ORDER[index]) errors.push(`${label}.focus violates ordered 2/2/2 allocation`);
    for (const field of ['story_id', 'slug', 'permanent_url', 'headline', 'event_date', 'summary', 'why_it_matters', 'george_implication']) requireText(story[field], `${label}.${field}`);
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
    if (edition.policy_profile === 'full_v1') {
      if (!story.what_to_do_now) errors.push(`${label}.what_to_do_now is required by full_v1`);
    }
  });
  for (const slot of ['general', 'agents_non_technical_people']) {
    const video = edition.worth_watching?.[slot];
    if (!video) errors.push(`worth_watching.${slot} is required`);
    else if (video.status === 'empty') requireText(video.exception, `worth_watching.${slot}.exception`);
    else if (video.status === 'included' && (!Number.isInteger(video.runtime_seconds) || video.runtime_seconds < 1 || video.runtime_seconds > 1200)) errors.push(`worth_watching.${slot}.runtime_seconds must be 1-1200`);
    else if (video.status==='included' && edition.brief_date>='2026-09-11') {
      const age=(Date.parse(edition.brief_date)-Date.parse(video.upload_date))/86400000;
      if(!Number.isFinite(age)||age<0||age>30)errors.push(`worth_watching.${slot} requires a verified upload date within 30 days`);
      if(video.runtime_seconds>600 && (!video.short_search_evidence?.length || video.duration_tier!=='fallback' || !video.fallback_reason?.trim()))errors.push(`worth_watching.${slot} requires documented short-video search and fallback reason`);
    }
    else if (!['empty', 'included'].includes(video.status)) errors.push(`worth_watching.${slot}.status is invalid`);
  }
  const podcast = edition.podcast;
  if (edition.policy_profile === 'full_v1' && edition.brief_date >= '2026-09-10' && !podcast) errors.push('podcast slot 9 is required');
  if (podcast?.status === 'included') {
    for (const field of ['item_id','title','show','host','publication_date','summary','why_useful','connection','george_implication','selection_rationale','verification_note','coverage_note']) requireText(podcast[field], `podcast.${field}`);
    if (!podcast.item_id?.startsWith(`dab-podcast-${edition.brief_date}-`)) errors.push('podcast.item_id must match brief_date');
    if (podcast.ordinal !== 9) errors.push('podcast.ordinal must be 9');
    if (!podcast.permanent_url?.startsWith(`/podcasts/${edition.brief_date}/`)) errors.push('podcast.permanent_url must match brief_date');
    if (!EXPECTED_FOCUS_ORDER.includes(podcast.focus)) errors.push('podcast.focus is invalid');
    if (podcast.runtime_seconds !== null && (!Number.isInteger(podcast.runtime_seconds) || podcast.runtime_seconds < 1)) errors.push('podcast runtime must be positive or unknown; no maximum');
    if (!podcast.platforms?.length || !podcast.topics?.length) errors.push('podcast platforms and topics are required');
    for (const url of [podcast.url, ...(podcast.platforms || []).map(p => p.url)]) {
      try { if (new URL(url).protocol !== 'https:') throw Error(); } catch { errors.push('podcast URL must be HTTPS'); }
    }
    const otherUrls = [...sourceUrls, ...Object.values(edition.worth_watching || {}).map(v => v.url)];
    if ([podcast.url,...(podcast.platforms || []).map(p => p.url)].some(url => otherUrls.includes(url))) errors.push('podcast duplicates another edition item');
  } else if (podcast?.status === 'empty') requireText(podcast.exception, 'podcast.exception');
  else if (podcast) errors.push('podcast.status is invalid');
  return errors;
}

export function assertValidEdition(edition) {
  const errors = validateEdition(edition);
  if (errors.length) throw new Error(`Edition validation failed:\n- ${errors.join('\n- ')}`);
}
