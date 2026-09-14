import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {sha256} from '../lib/util.mjs';import {mediaIdentity,normalizeMediaEvidence,mergeMediaCatalog} from '../lib/media-evidence.mjs';import {visualPreflight,saveApprovedImages,imageRecovery} from '../lib/visual-recovery.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url));
const media=()=>({kind:'podcast',canonical_url:'https://publisher.test/episode',feed_url:'https://publisher.test/feed',episode_guid:'episode-1',aliases:['https://podcasts.test/episode-1'],aliases_reviewed:true,title:'Fixture',published_at:'2026-09-14T10:00:00Z',runtime_seconds:1800,source:{url:'https://publisher.test/episode',text:'The episode explains a reusable workflow.',checked_at:'2026-09-14T11:00:00Z'},review:{status:'reviewed',reviewer:'test fixture',reviewed_at:'2026-09-14T11:05:00Z',source_content_hash:sha256('The episode explains a reusable workflow.'),excerpts:['reusable workflow']}});
test('video aliases share identity and episode GUIDs are scoped to their feed',()=>{
 assert.equal(mediaIdentity({kind:'video',canonical_url:'https://youtu.be/abcdefghijk'}),mediaIdentity({kind:'video',canonical_url:'https://www.youtube.com/watch?v=abcdefghijk&utm_source=x'}));
 assert.notEqual(mediaIdentity(media()),mediaIdentity({...media(),feed_url:'https://another.test/feed'}));
});
test('same reviewed episode merges platforms once and retains unknown/conflicting metadata',()=>{
 const first=media(),second={...media(),canonical_url:'https://podcasts.test/episode-1',aliases:['https://publisher.test/episode']};
 const records=mergeMediaCatalog([], [first,second]);assert.equal(records.length,1);assert.equal(records[0].aliases.length,2);
 const conflict=mergeMediaCatalog(records,[{...second,runtime_seconds:1810}]);assert.equal(conflict[0].metadata_status,'unresolved');assert.equal(conflict[0].metadata_conflicts.length,1);
 assert.equal(normalizeMediaEvidence({...first,runtime_seconds:null}).metadata_status,'unresolved');assert.equal(normalizeMediaEvidence({...first,published_at:'2026-09-15T10:00:00Z'}).metadata_status,'unresolved');
 assert.throws(()=>normalizeMediaEvidence({...first,published_at:'2026-02-30T10:00:00Z'}));assert.throws(()=>normalizeMediaEvidence({...first,aliases_reviewed:false}));assert.throws(()=>normalizeMediaEvidence({...first,source:{...first.source,text:'Changed source'}}));
 assert.throws(()=>mergeMediaCatalog(records,[{...first,episode_guid:'different'}]),/conflict/);
});
const makePacket=story=>({candidate_id:story.story_id,canonical_url:story.source.url,verification_status:'reviewed',source_content_hash:sha256('fixture evidence'),verified_claims:[{claim:'Fixture mechanism remains planned.',evidence:'Fixture only: planned status.'}],limitations:['Fixture limitation'],availability:'planned'});
const spec=i=>({mechanism:'Fixture mechanism',composition:'Fixture composition '+i,labels:[{text:'Planned',claim_index:0}],relationships:[{from:'input',to:'output',status:'planned',claim_index:0}],prohibited_implications:['Do not depict planned functionality as shipped'],review:{status:'reviewed',reviewer:'test fixture',reviewed_at:'2026-09-14T12:00:00Z',checks:{mechanism:true,labels:true,availability:true,composition:true}}});
test('preflight preserves limitations and requires reviewed claim references and status',()=>{
 const packet=makePacket({story_id:'fixture',source:{url:'https://example.org'}}),brief=visualPreflight(packet,spec(0));assert.deepEqual(brief.limitations,packet.limitations);assert.equal(brief.availability,'planned');assert.equal(brief.image_approval,'not_granted_by_preflight');
 assert.throws(()=>visualPreflight(packet,{...spec(0),labels:[{text:'Unsupported metric',claim_index:3}]}));assert.throws(()=>visualPreflight(packet,{...spec(0),relationships:[{claim_index:0,status:'shipped'}]}));
});
test('approved September 14 images survive unrelated repairs; changed story evidence invalidates only its image',()=>{
 const edition=JSON.parse(fs.readFileSync(path.join(repo,'_data/editions/2026-09-14.json'))),root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-image-recovery-'));
 try{
 const preflights=edition.stories.map((story,i)=>{const packet=makePacket(story);return {story_id:story.story_id,packet,preflight:visualPreflight(packet,spec(i))};});
 assert.equal(saveApprovedImages({edition,repo,root,preflights}).length,6);
 for(let i=0;i<6;i++){const x=preflights[i];assert.equal(imageRecovery({edition,story:edition.stories[i],packet:x.packet,preflight:x.preflight,repo,root}).state,'reusable');}
 const first=preflights[0],changed={...first.packet,source_content_hash:sha256('new facts')};assert.equal(imageRecovery({edition,story:edition.stories[0],packet:changed,preflight:first.preflight,repo,root}).state,'requires_review');
 const restoredRepo=path.join(root,'restored');fs.mkdirSync(restoredRepo);for(const file of ['docs/images/publisher-policy.md','_generator/lib/visual-recovery.mjs','_generator/lib/image-gate.mjs']){fs.mkdirSync(path.dirname(path.join(restoredRepo,file)),{recursive:true});fs.copyFileSync(path.join(repo,file),path.join(restoredRepo,file));}const restored=imageRecovery({edition,story:edition.stories[0],packet:first.packet,preflight:first.preflight,repo:restoredRepo,root,restore:true});assert.equal(restored.state,'reusable');assert.equal(restored.restored,true);assert.equal(sha256(fs.readFileSync(path.join(restoredRepo,edition.stories[0].image.path))),sha256(fs.readFileSync(path.join(repo,edition.stories[0].image.path))));
 assert.equal(imageRecovery({edition,story:edition.stories[0],packet:first.packet,preflight:first.preflight,repo:restoredRepo,root,restore:true}).restored,false);
 fs.writeFileSync(path.join(restoredRepo,edition.stories[0].image.path),'changed');assert.equal(imageRecovery({edition,story:edition.stories[0],packet:first.packet,preflight:first.preflight,repo:restoredRepo,root,restore:true}).state,'requires_review');
 }finally{assert.ok(fs.realpathSync(root).startsWith(fs.realpathSync(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});}
});
