const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const durationPattern = /^(?:\d+:)?\d{1,2}:\d{2}$/;

export function collectNested(root, key) {
  const out = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(value, key)) out.push(value[key]);
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
    } else {
      for (const item of Object.values(value)) visit(item);
    }
  };
  visit(root);
  return out;
}

function durationSeconds(text) {
  if (!durationPattern.test(String(text || ''))) throw Error('invalid_duration_text');
  const parts = String(text).split(':').map(Number);
  if (parts.slice(1).some(x => x < 0 || x >= 60)) throw Error('invalid_duration_text');
  let seconds = 0;
  for (const part of parts) seconds = seconds * 60 + part;
  if (seconds <= 0) throw Error('invalid_duration_text');
  return seconds;
}

function assertAppleEpisodeItem(item, offer, showId) {
  if (!offer || typeof offer !== 'object') throw Error('apple_playback_offer_required');
  const episodeId = String(offer.contentId || '');
  if (!episodeId) throw Error('apple_episode_id_required');
  if (String(item?.adamId || '') !== episodeId) throw Error('apple_episode_item_identity_mismatch');
  if (String(item?.showAdamId || '') !== String(showId)) throw Error('apple_episode_show_identity_mismatch');
  if (String(offer?.showOffer?.adamId || '') !== String(showId)) throw Error('apple_offer_show_identity_mismatch');
  if (!nonempty(offer.title) || item?.title !== offer.title) throw Error('apple_episode_title_mismatch');
  if (!nonempty(offer.releaseDate) || item?.releaseDate !== offer.releaseDate || Number.isNaN(Date.parse(offer.releaseDate)))
    throw Error('apple_episode_release_date_mismatch');
  if (!Number.isInteger(offer.duration) || offer.duration <= 0 || item?.duration !== offer.duration)
    throw Error('apple_episode_duration_mismatch');
  if (!nonempty(offer.storeUrl)) throw Error('apple_episode_url_required');
  const url = new URL(offer.storeUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'podcasts.apple.com' || url.searchParams.get('i') !== episodeId)
    throw Error('apple_episode_url_identity_mismatch');
  if (!nonempty(item?.summary)) throw Error('apple_episode_summary_required');
}

export function extractApplePodcastEpisodes(document, {showId} = {}) {
  if (!showId) throw Error('apple_show_id_required');
  const shelves = document?.data?.[0]?.data?.shelves;
  if (!Array.isArray(shelves)) throw Error('apple_catalog_shelves_required');
  const seen = new Map();
  let partialContextMenuRecordsNotUsed = 0;
  for (const shelf of shelves) {
    for (const item of shelf?.items || []) {
      const offer = item?.playAction?.episodeOffer;
      if (!offer || String(offer?.showOffer?.adamId || '') !== String(showId)) continue;
      assertAppleEpisodeItem(item, offer, String(showId));
      const menu = item?.contextAction?.episodeOffer;
      if (menu && (!('releaseDate' in menu) || !('duration' in menu))) partialContextMenuRecordsNotUsed += 1;
      const episodeId = String(offer.contentId);
      const row = {
        episode_id: episodeId,
        show_id: String(showId),
        canonical_url: offer.storeUrl,
        title: offer.title,
        show: offer.showOffer.title || null,
        episode_guid: offer.guid || null,
        feed_url: offer.showOffer.feedUrl || null,
        published_at: offer.releaseDate,
        runtime_seconds: offer.duration,
        source_text: item.summary
      };
      const previous = seen.get(episodeId);
      if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error('apple_duplicate_episode_conflict');
      seen.set(episodeId, row);
    }
  }
  return {
    records: [...seen.values()],
    partial_context_menu_records_not_used: partialContextMenuRecordsNotUsed
  };
}

function rendererTitle(renderer) {
  const title = renderer?.title;
  if (nonempty(title?.simpleText)) return title.simpleText;
  const runs = Array.isArray(title?.runs) ? title.runs.map(x => x?.text || '').join('') : '';
  return runs;
}

function rendererDuration(renderer) {
  const length = renderer?.lengthText;
  const text = length?.simpleText || (Array.isArray(length?.runs) ? length.runs.map(x => x?.text || '').join('') : '');
  return durationSeconds(text);
}

function lockupDuration(lockup) {
  const videoId = lockup?.contentId;
  if (!videoIdPattern.test(String(videoId || ''))) throw Error('youtube_video_id_invalid');
  const values = [];
  for (const badge of collectNested(lockup?.contentImage, 'thumbnailBadgeViewModel')) {
    const text = badge?.text;
    if (!durationPattern.test(String(text || ''))) continue;
    if (badge?.animationActivationTargetId !== videoId) throw Error('youtube_duration_badge_owner_mismatch');
    values.push(durationSeconds(text));
  }
  if (!values.length || new Set(values).size !== 1) throw Error('youtube_duration_missing_or_conflicting');
  return values[0];
}

export function extractYouTubeCatalogVideos(initialData, {expectedChannelId = null} = {}) {
  const meta = initialData?.metadata?.channelMetadataRenderer;
  if (!meta || !videoIdPattern.test(String(meta.externalId || '').replace(/^UC/, 'AA'))) {
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(String(meta?.externalId || ''))) throw Error('youtube_channel_identity_required');
  }
  const channelId = meta.externalId;
  if (!/^UC[A-Za-z0-9_-]{22}$/.test(String(channelId || ''))) throw Error('youtube_channel_identity_required');
  if (expectedChannelId && channelId !== expectedChannelId) throw Error('youtube_channel_identity_mismatch');
  const seen = new Map();
  const modes = new Set();

  for (const renderer of collectNested(initialData, 'videoRenderer')) {
    const videoId = renderer?.videoId;
    if (!videoIdPattern.test(String(videoId || ''))) continue;
    let seconds;
    try { seconds = rendererDuration(renderer); } catch { continue; }
    const title = rendererTitle(renderer);
    if (!nonempty(title)) continue;
    const row = {video_id: videoId, title, runtime_seconds: seconds};
    const previous = seen.get(videoId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error('youtube_duplicate_video_conflict');
    seen.set(videoId, row);
    modes.add('videoRenderer');
  }

  for (const lockup of collectNested(initialData, 'lockupViewModel')) {
    const videoId = lockup?.contentId;
    if (!videoIdPattern.test(String(videoId || ''))) continue;
    let seconds;
    try { seconds = lockupDuration(lockup); } catch (error) {
      if (String(error.message) === 'youtube_duration_badge_owner_mismatch') throw error;
      continue;
    }
    const title = lockup?.metadata?.lockupMetadataViewModel?.title?.content;
    if (!nonempty(title)) continue;
    const row = {video_id: videoId, title, runtime_seconds: seconds};
    const previous = seen.get(videoId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw Error('youtube_duplicate_video_conflict');
    seen.set(videoId, row);
    modes.add('lockupViewModel');
  }

  return {
    channel_id: channelId,
    channel_name: meta.title || null,
    parser_modes_used: [...modes].sort(),
    records: [...seen.values()]
  };
}
