import {sha256} from './util.mjs';

function normalized(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function addImplications(proposals, edition, item, meta) {
  for (const implication of item?.series_implications || []) {
    const bookTitle = normalized(implication.book_title);
    const proposedChange = normalized(implication.proposed_change);
    const evidenceReason = normalized(implication.evidence_reason);
    const teachingAsset = normalized(implication.teaching_asset);
    if (!bookTitle || !proposedChange || !evidenceReason || !teachingAsset) continue;
    const dedupeKey = sha256(`${bookTitle.toLowerCase()}|${proposedChange.toLowerCase()}`).slice(0, 16);
    const proposalId = `dab-book-proposal-${edition.brief_date}-${sha256(`${meta.item_id}|${dedupeKey}`).slice(0, 12)}`;
    proposals.push({
      proposal_id: proposalId,
      dedupe_key: dedupeKey,
      workflow_state: 'pending_review',
      item_id: meta.item_id,
      item_type: meta.item_type,
      item_title: normalized(meta.item_title),
      item_url: meta.item_url,
      source_url: meta.source_url,
      book_title: bookTitle,
      proposed_change: proposedChange,
      evidence_reason: evidenceReason,
      teaching_asset: teachingAsset
    });
  }
}

export function buildBookChangeProposalBacklog(edition) {
  const proposals = [];
  for (const story of edition.stories || []) {
    addImplications(proposals, edition, story, {
      item_id: story.story_id,
      item_type: 'article',
      item_title: story.headline,
      item_url: story.permanent_url,
      source_url: story.source?.url || null
    });
  }
  for (const [key, suffix] of [['general', 'general'], ['agents_non_technical_people', 'agent-skills']]) {
    const slot = edition.worth_watching?.[key];
    if (slot?.status !== 'included') continue;
    addImplications(proposals, edition, slot, {
      item_id: `dab-video-${edition.brief_date}-${suffix}`,
      item_type: 'video',
      item_title: slot.title,
      item_url: `/videos/${edition.brief_date}/${suffix}/`,
      source_url: slot.url || null
    });
  }
  if (edition.podcast?.status === 'included') {
    addImplications(proposals, edition, edition.podcast, {
      item_id: edition.podcast.item_id,
      item_type: 'podcast',
      item_title: edition.podcast.title,
      item_url: edition.podcast.permanent_url,
      source_url: edition.podcast.url || null
    });
  }
  return {
    schema_version: '1.0.0',
    brief_date: edition.brief_date,
    edition_id: edition.edition_id,
    generated_at: edition.published_at,
    source: 'canonical_series_implications',
    proposal_count: proposals.length,
    proposals
  };
}

export function validateBookChangeProposalBacklog(edition, record) {
  const errors = [];
  if (record.schema_version !== '1.0.0') errors.push('book proposal backlog schema_version must be 1.0.0');
  if (record.brief_date !== edition.brief_date || record.edition_id !== edition.edition_id) errors.push('book proposal backlog must match its edition');
  if (record.source !== 'canonical_series_implications') errors.push('book proposal backlog source is invalid');
  if (record.proposal_count !== record.proposals?.length) errors.push('book proposal backlog count mismatch');
  const ids = new Set();
  for (const proposal of record.proposals || []) {
    if (!proposal.proposal_id?.startsWith(`dab-book-proposal-${edition.brief_date}-`)) errors.push('book proposal ID must match brief date');
    if (ids.has(proposal.proposal_id)) errors.push('book proposal IDs must be unique');
    ids.add(proposal.proposal_id);
    if (!['article', 'video', 'podcast'].includes(proposal.item_type)) errors.push('book proposal item_type is invalid');
    if (proposal.workflow_state !== 'pending_review') errors.push('new book proposals must enter pending_review');
    for (const field of ['item_id', 'item_title', 'item_url', 'book_title', 'proposed_change', 'evidence_reason', 'teaching_asset', 'dedupe_key']) {
      if (!normalized(proposal[field])) errors.push(`book proposal requires ${field}`);
    }
  }
  return errors;
}
