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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sha256} from '../lib/util.mjs';
import {collectNested} from '../lib/media-source-parsers.mjs';
import {parseSavedMediaSource} from '../../_tools/parse-media-source.mjs';

const itemOf = doc => doc.data[0].data.shelves[0].items[0];
for (const date of ['2026-09-29','2026-09-29T11:00:00','2026-02-30T11:00:00Z','not-a-date']) {
  test('Apple refuses ambiguous or impossible date: '+date,()=>{
    assert.throws(()=>extractApplePodcastEpisodes(appleDocument({playOverrides:{releaseDate:date}}),{showId}),/release_date/);
  });
}
for (const url of [`https://podcasts.apple.com/us/podcast/x/id999?i=${episodeId}`,
  `https://user:password@podcasts.apple.com/us/podcast/x/id${showId}?i=${episodeId}`,
  `https://podcasts.apple.com/us/podcast/x/id${showId}?i=${episodeId}&i=999`]) {
  test('Apple refuses mismatched or ambiguous episode URL '+url.split('?')[0],()=>{
    assert.throws(()=>extractApplePodcastEpisodes(appleDocument({playOverrides:{storeUrl:url}}),{showId}),/url_identity/);
  });
}
test('Apple conflicting complete duplicate cannot silently replace an episode',()=>{
  const doc=appleDocument(), next=structuredClone(itemOf(doc));
  next.duration++; next.playAction.episodeOffer.duration++;
  doc.data[0].data.shelves[0].items.push(next);
  assert.throws(()=>extractApplePodcastEpisodes(doc,{showId}),/duplicate_episode_conflict/);
});
test('Apple exact repeated complete episode is deduplicated',()=>{
  const doc=appleDocument();doc.data[0].data.shelves[0].items.push(structuredClone(itemOf(doc)));
  assert.equal(extractApplePodcastEpisodes(doc,{showId}).records.length,1);
});
test('YouTube conflicting same-video badge durations fail instead of choosing one',()=>{
  const doc=lockupData(), lockup=doc.contents[0].lockupViewModel;
  lockup.contentImage.extra={thumbnailBadgeViewModel:{text:'7:16',animationActivationTargetId:lockup.contentId}};
  assert.throws(()=>extractYouTubeCatalogVideos(doc,{expectedChannelId:channelId}),/duration_conflicting/);
});
test('YouTube channel identity must match independent expected identity',()=>{
  assert.throws(()=>extractYouTubeCatalogVideos(lockupData(),{expectedChannelId:'UC'+ 'x'.repeat(22)}),/channel_identity_mismatch/);
});
test('YouTube missing live runtime stays absent, never zero',()=>{
  assert.equal(extractYouTubeCatalogVideos(lockupData({badgeText:'LIVE'}),{expectedChannelId:channelId}).records.length,0);
});
test('Nested cyclic and unbounded input fails without recursion overflow',()=>{
  const circular={};circular.self=circular;
  assert.throws(()=>collectNested(circular,'x'),/repeated_object/);
  assert.throws(()=>collectNested(Array.from({length:100001},()=>({})),'x'),/node_limit/);
});
const parse=(kind,text,identity)=>parseSavedMediaSource(Buffer.from(text),{kind,identity,expectedSha256:sha256(text)});
test('Saved Apple HTML extracts the complete known JSON script without new acquisition',()=>{
  const text='<script id="unrelated" type="application/json">{}</script><script type="application/json" id="serialized-server-data">'+JSON.stringify(appleDocument())+'</script>';
  const output=parse('apple',text,showId);
  assert.equal(output.records[0].runtime_seconds,2099);
  assert.equal(output.metadata_only,true);assert.equal(output.editorial_review_complete,false);assert.equal(output.selection_complete,false);
});
test('Saved YouTube HTML parses escaped braces as data and never executes trailing JavaScript',()=>{
  const doc=lockupData();doc.contents[0].lockupViewModel.metadata.lockupMetadataViewModel.title.content='A "quoted" {brace} \\ title';
  const text='<script>var ytInitialData = '+JSON.stringify(doc)+';globalThis.mediaParserMustNotRun=true;</script>';
  assert.equal(parse('youtube',text,channelId).records.length,1);
  assert.equal(globalThis.mediaParserMustNotRun,undefined);
});
test('Direct JSON and window assignment use the same parser',()=>{
  const json=JSON.stringify(lockupData());
  assert.deepEqual(parse('youtube',json,channelId).records,parse('youtube','<script>window["ytInitialData"] = '+json+';</script>',channelId).records);
});
test('Source identity/hash, UTF-8 and structured-source validation fail closed',()=>{
  const text=JSON.stringify(appleDocument());
  assert.throws(()=>parseSavedMediaSource(Buffer.from(text),{kind:'apple',identity:showId,expectedSha256:'0'.repeat(64)}),/hash_mismatch/);
  assert.throws(()=>parse('apple',text,''),/identity_required/);
  assert.throws(()=>parse('apple','<html>No structured record</html>',showId),/source_missing/);
  const bad=Buffer.from([255]);assert.throws(()=>parseSavedMediaSource(bad,{kind:'apple',identity:showId,expectedSha256:sha256(bad)}));
});
test('Conflicting structured records and truncated JSON are refused',()=>{
  const one=JSON.stringify(lockupData()),two=JSON.stringify(lockupData({badgeText:'8:00'}));
  assert.throws(()=>parse('youtube',`<script>var ytInitialData=${one};</script><script>var ytInitialData=${two};</script>`,channelId),/source_conflict/);
  assert.throws(()=>parse('youtube','<script>var ytInitialData = {"x":1;</script>',channelId),/incomplete/);
});
test('Actual CLI preserves an existing output and source file; wrong hash creates no output',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'media-parser-'));
  try {
    const source=path.join(directory,'source.json'),out=path.join(directory,'parsed.json');
    const bytes=Buffer.from(JSON.stringify(appleDocument()));fs.writeFileSync(source,bytes);
    const args=['_tools/parse-media-source.mjs','--kind','apple','--file',source,'--identity',showId,'--sha256',sha256(bytes),'--out',out];
    const first=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(first.status,0,first.stderr);
    const saved=fs.readFileSync(out);assert.equal(JSON.parse(saved).records.length,1);
    const again=spawnSync(process.execPath,args,{encoding:'utf8'});assert.notEqual(again.status,0);assert.ok(fs.readFileSync(out).equals(saved));
    fs.unlinkSync(out);args[args.indexOf('--sha256')+1]='0'.repeat(64);
    assert.notEqual(spawnSync(process.execPath,args,{encoding:'utf8'}).status,0);assert.equal(fs.existsSync(out),false);
    assert.ok(fs.readFileSync(source).equals(bytes));
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
