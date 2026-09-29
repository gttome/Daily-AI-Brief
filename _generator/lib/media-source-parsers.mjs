import {explicitMediaTimestamp} from './media-freshness.mjs';

// Extraction only. Existing source review, freshness and selection gates still apply.
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const channelIdPattern = /^UC[A-Za-z0-9_-]{22}$/;
const durationPattern = /^(?:\d+:)?\d{1,2}:\d{2}$/;

export function collectNested(root, key) {
  const out = [], stack = [root], seen = new WeakSet();
  let visited = 0;
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (++visited > 100000) throw Error('media_document_node_limit');
    if (seen.has(value)) throw Error('media_document_repeated_object');
    seen.add(value);
    if (Object.prototype.hasOwnProperty.call(value, key)) out.push(value[key]);
    const children = Array.isArray(value) ? value : Object.values(value);
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  return out;
}

function durationSeconds(text) {
  if (!durationPattern.test(String(text || ''))) throw Error('invalid_duration_text');
  const parts = String(text).split(':').map(Number);
  if (parts.slice(1).some(x => x >= 60)) throw Error('invalid_duration_text');
  const seconds = parts.reduce((n, part) => n * 60 + part, 0);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) throw Error('invalid_duration_text');
  return seconds;
}

function assertAppleEpisodeItem(item, offer, showId) {
  const episodeId = String(offer?.contentId || '');
  if (!/^\d+$/.test(episodeId)) throw Error('apple_episode_id_required');
  if (String(item?.adamId || '') !== episodeId) throw Error('apple_episode_item_identity_mismatch');
  if (String(item?.showAdamId || '') !== showId) throw Error('apple_episode_show_identity_mismatch');
  if (String(offer?.showOffer?.adamId || '') !== showId) throw Error('apple_offer_show_identity_mismatch');
  if (!nonempty(offer.title) || item.title !== offer.title) throw Error('apple_episode_title_mismatch');
  if (item.releaseDate !== offer.releaseDate || !Number.isFinite(explicitMediaTimestamp(offer.releaseDate)))
    throw Error('apple_episode_release_date_mismatch');
  if (!Number.isSafeInteger(offer.duration) || offer.duration <= 0 || item.duration !== offer.duration)
    throw Error('apple_episode_duration_mismatch');
  if (!nonempty(offer.storeUrl)) throw Error('apple_episode_url_required');
  const url = new URL(offer.storeUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'podcasts.apple.com' || url.username || url.password || url.port ||
      !url.pathname.endsWith('/id' + showId) || url.searchParams.getAll('i').length !== 1 || url.searchParams.get('i') !== episodeId)
    throw Error('apple_episode_url_identity_mismatch');
  if (!nonempty(item.summary)) throw Error('apple_episode_summary_required');
}

export function extractApplePodcastEpisodes(document, {showId} = {}) {
  if (!/^\d+$/.test(String(showId || ''))) throw Error('apple_show_id_required');
  showId = String(showId);
  const shelves = document?.data?.[0]?.data?.shelves;
  if (!Array.isArray(shelves)) throw Error('apple_catalog_shelves_required');
  const seen = new Map();
  let partialContextMenuRecordsNotUsed = 0;
  for (const shelf of shelves) {
    if (!Array.isArray(shelf?.items)) continue;
    for (const item of shelf.items) {
      const offer = item?.playAction?.episodeOffer;
      if (!offer || String(offer?.showOffer?.adamId || '') !== showId) continue;
      assertAppleEpisodeItem(item, offer, showId);
      const menu = item?.contextAction?.episodeOffer;
      if (menu && (!('releaseDate' in menu) || !('duration' in menu))) partialContextMenuRecordsNotUsed++;
      const episodeId = String(offer.contentId);
      const row = {
        episode_id: episodeId, show_id: showId, canonical_url: offer.storeUrl,
        title: offer.title, show: offer.showOffer.title || null,
        episode_guid: offer.guid || null, feed_url: offer.showOffer.feedUrl || null,
        published_at: offer.releaseDate, runtime_seconds: offer.duration, source_text: item.summary
      };
      const previous = seen.get(episodeId);
      if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error('apple_duplicate_episode_conflict');
      seen.set(episodeId, row);
    }
  }
  return {records: [...seen.values()], partial_context_menu_records_not_used: partialContextMenuRecordsNotUsed};
}

function rendererTitle(renderer) {
  const title = renderer?.title;
  return nonempty(title?.simpleText) ? title.simpleText : Array.isArray(title?.runs) ? title.runs.map(x => x?.text || '').join('') : '';
}

function rendererDuration(renderer) {
  const length = renderer?.lengthText;
  return durationSeconds(length?.simpleText || (Array.isArray(length?.runs) ? length.runs.map(x => x?.text || '').join('') : ''));
}

function lockupDuration(lockup) {
  const videoId = lockup.contentId, values = [];
  for (const badge of collectNested(lockup.contentImage, 'thumbnailBadgeViewModel')) {
    if (!durationPattern.test(String(badge?.text || ''))) continue;
    if (badge.animationActivationTargetId !== videoId) throw Error('youtube_duration_badge_owner_mismatch');
    values.push(durationSeconds(badge.text));
  }
  if (!values.length) throw Error('youtube_duration_missing');
  if (new Set(values).size !== 1) throw Error('youtube_duration_conflicting');
  return values[0];
}

export function extractYouTubeCatalogVideos(initialData, {expectedChannelId = null} = {}) {
  const meta = initialData?.metadata?.channelMetadataRenderer;
  const channelId = meta?.externalId;
  if (!channelIdPattern.test(String(channelId || ''))) throw Error('youtube_channel_identity_required');
  if (expectedChannelId && channelId !== expectedChannelId) throw Error('youtube_channel_identity_mismatch');
  const seen = new Map(), modes = new Set();
  const add = (videoId, title, seconds, mode) => {
    if (!nonempty(title)) return;
    const row = {video_id: videoId, title, runtime_seconds: seconds};
    const previous = seen.get(videoId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error('youtube_duplicate_video_conflict');
    seen.set(videoId, row); modes.add(mode);
  };
  for (const renderer of collectNested(initialData, 'videoRenderer')) {
    if (!videoIdPattern.test(String(renderer?.videoId || ''))) continue;
    let seconds;
    try { seconds = rendererDuration(renderer); } catch { continue; }
    add(renderer.videoId, rendererTitle(renderer), seconds, 'videoRenderer');
  }
  for (const lockup of collectNested(initialData, 'lockupViewModel')) {
    if (!videoIdPattern.test(String(lockup?.contentId || ''))) continue;
    let seconds;
    try { seconds = lockupDuration(lockup); } catch (error) {
      if (error.message !== 'youtube_duration_missing' && error.message !== 'invalid_duration_text') throw error;
      continue;
    }
    add(lockup.contentId, lockup.metadata?.lockupMetadataViewModel?.title?.content, seconds, 'lockupViewModel');
  }
  return {channel_id: channelId, channel_name: meta.title || null, parser_modes_used: [...modes].sort(), records: [...seen.values()]};
}
