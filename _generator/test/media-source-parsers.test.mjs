import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractApplePodcastEpisodes,
  extractYouTubeCatalogVideos
} from '../lib/media-source-parsers.mjs';

const showId='1683401861';
const episodeId='1000792187154';
const channelId='UCKWaEZ-_VweaEx1j62do_vQ';

function appleDocument({menuOverrides={},playOverrides={}}={}){
  const offer={
    contentId:episodeId,
    title:'Episode title',
    releaseDate:'2026-09-29T11:00:00Z',
    duration:2099,
    storeUrl:`https://podcasts.apple.com/us/podcast/x/id${showId}?i=${episodeId}`,
    guid:'episode-guid',
    showOffer:{adamId:showId,title:'Everyday AI',feedUrl:'https://example.test/feed.xml'},
    ...playOverrides
  };
  return {data:[{data:{shelves:[{items:[{
    adamId:episodeId,
    showAdamId:showId,
    title:offer.title,
    releaseDate:offer.releaseDate,
    duration:offer.duration,
    summary:'Complete publisher episode summary',
    playAction:{episodeOffer:offer},
    contextAction:{episodeOffer:{contentId:episodeId,title:offer.title,showOffer:{adamId:showId},...menuOverrides}}
  }]}]}}]};
}

test('Apple parser preserves complete playback record over partial context-menu record',()=>{
  const out=extractApplePodcastEpisodes(appleDocument(),{showId});
  assert.equal(out.records.length,1);
  assert.equal(out.partial_context_menu_records_not_used,1);
  assert.equal(out.records[0].published_at,'2026-09-29T11:00:00Z');
  assert.equal(out.records[0].runtime_seconds,2099);
  assert.equal(out.records[0].episode_id,episodeId);
});

test('Apple parser rejects playback identity mismatch instead of trusting partial menu identity',()=>{
  const doc=appleDocument({playOverrides:{contentId:'1000792187999'}});
  assert.throws(()=>extractApplePodcastEpisodes(doc,{showId}),/apple_episode_item_identity_mismatch/);
});

function lockupData({badgeOwner='bs1qPy_CWkM',badgeText='7:15'}={}){
  return {
    metadata:{channelMetadataRenderer:{externalId:channelId,title:'IBM Technology'}},
    contents:[{
      lockupViewModel:{
        contentId:'bs1qPy_CWkM',
        metadata:{lockupMetadataViewModel:{title:{content:'Prompt to Production'}}},
        contentImage:{collectionThumbnailViewModel:{primaryThumbnail:{thumbnailViewModel:{
          overlays:[{thumbnailOverlayBadgeViewModel:{thumbnailBadges:[{
            thumbnailBadgeViewModel:{text:badgeText,animationActivationTargetId:badgeOwner}
          }]}}]
        }}}}
      }
    }]
  };
}

test('YouTube parser reads modern lockupViewModel duration owned by the same video',()=>{
  const out=extractYouTubeCatalogVideos(lockupData(),{expectedChannelId:channelId});
  assert.deepEqual(out.parser_modes_used,['lockupViewModel']);
  assert.deepEqual(out.records,[{
    video_id:'bs1qPy_CWkM',
    title:'Prompt to Production',
    runtime_seconds:435
  }]);
});

test('YouTube parser rejects a lockup duration badge owned by a different contentId',()=>{
  assert.throws(
    ()=>extractYouTubeCatalogVideos(lockupData({badgeOwner:'KJ8Y2Nb9y9o'}),{expectedChannelId:channelId}),
    /youtube_duration_badge_owner_mismatch/
  );
});

test('YouTube parser retains legacy videoRenderer support',()=>{
  const data={
    metadata:{channelMetadataRenderer:{externalId:channelId,title:'IBM Technology'}},
    contents:[{videoRenderer:{
      videoId:'KJ8Y2Nb9y9o',
      title:{runs:[{text:'Legacy renderer title'}]},
      lengthText:{simpleText:'7:51'}
    }}]
  };
  const out=extractYouTubeCatalogVideos(data,{expectedChannelId:channelId});
  assert.deepEqual(out.parser_modes_used,['videoRenderer']);
  assert.equal(out.records[0].runtime_seconds,471);
});
