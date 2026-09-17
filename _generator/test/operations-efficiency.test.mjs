import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyCommandCenterObservation,commandCenterAccessContract} from '../lib/command-center-access.mjs';
import {selectVideo,videoDiscoveryReceipt,selectPodcasts,videoDurationTier} from '../lib/media-selection.mjs';

const date='2026-09-18';
const baseVideo={verified:true,editorial_pass:true,duplicate:false,upload_date:'2026-09-17',score:10};

test('Command Center link-readable state is expected while mutation and private data remain protected',()=>{
 const c=commandCenterAccessContract();
 assert.equal(c.dashboard_read_access,'link_accessible');assert.equal(c.viewer_mode,'read_only');
 assert.equal(classifyCommandCenterObservation('signed_out_dashboard_read').result,'PASS');
 assert.equal(classifyCommandCenterObservation('signed_out_owner_operation_owner_identity_required').result,'PASS');
 assert.equal(classifyCommandCenterObservation('signed_out_owner_operation_not_executed').result,'NOT_APPLICABLE');
 assert.equal(classifyCommandCenterObservation('signed_out_state_mutation').result,'FAIL');
 assert.equal(classifyCommandCenterObservation('signed_out_private_record_read').result,'FAIL');
 assert.equal(classifyCommandCenterObservation('owner_operation_owner_identity_required',{ownerAuthenticated:true}).result,'FAIL');
});

test('video duration ladder prefers <=10m, then 10-15m, then 15-20m',()=>{
 assert.equal(videoDurationTier(600),'preferred');assert.equal(videoDurationTier(601),'fallback');assert.equal(videoDurationTier(900),'fallback');assert.equal(videoDurationTier(901),'last_resort');assert.equal(videoDurationTier(1200),'last_resort');
 const candidates=[
  {...baseVideo,slot:'general',url:'https://video.test/long',runtime_seconds:1000,score:50},
  {...baseVideo,slot:'general',url:'https://video.test/fallback',runtime_seconds:800,score:40},
  {...baseVideo,slot:'general',url:'https://video.test/short',runtime_seconds:500,score:1}
 ];
 assert.equal(selectVideo(candidates,'general',date).candidate.url,'https://video.test/short');
});

test('zero-video completion requires bounded evidence-backed coverage',()=>{
 const candidates=Array.from({length:16},(_,i)=>({...baseVideo,slot:i%2?'general':'agents_non_technical_people',source_id:'source-'+(i%8),url:'https://video.test/'+i,runtime_seconds:i%3===0?700:500}));
 let receipt=videoDiscoveryReceipt(candidates,{deepReviewedIds:['0','1','2']});
 assert.equal(receipt.complete,true);assert.equal(receipt.bounded,true);assert.equal(receipt.zero_video_allowed,true);
 receipt=videoDiscoveryReceipt(candidates.slice(0,10),{deepReviewedIds:['0','1','2']});assert.equal(receipt.zero_video_allowed,false);
});

test('podcast target is two with show diversity and at most one AI Daily Brief episode',()=>{
 const podcasts=[
  {verified:true,editorial_pass:true,show:'The AI Daily Brief',url:'https://pod.test/a',score:50},
  {verified:true,editorial_pass:true,show:'The AI Daily Brief',url:'https://pod.test/b',score:49},
  {verified:true,editorial_pass:true,show:'Practical AI',url:'https://pod.test/c',score:45}
 ];
 const result=selectPodcasts(podcasts);
 assert.deepEqual(result.selected.map(x=>x.url),['https://pod.test/a','https://pod.test/c']);
 assert.equal(result.restricted_show_count,1);assert.equal(result.source_diverse,true);
});
