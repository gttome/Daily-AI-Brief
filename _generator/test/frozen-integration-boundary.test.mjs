import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateFrozenTask19Bundle,validateFrozenProjectionState} from '../lib/integrity.mjs';

const blob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\\0')).update(bytes).digest('hex');
const write=(root,relative,content)=>{const full=path.join(root,relative);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content);return blob(Buffer.from(content));};

test('frozen integration validates sealed reader/image bytes instead of newer generator rules',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-frozen-int-'));
  const edition={brief_date:'2026-10-04',edition_id:'dab-edition-2026-10-04',stories:[{story_id:'s1'}],worth_watching:{},podcasts:[]};
  const readerPath='briefs/2026-10-04.md', imagePath='briefs/images/2026-10-04/a.png';
  const readerDigest=write(root,readerPath,'sealed reader\\n'),imageDigest=write(root,imagePath,'sealed image bytes');
  const readerShard={shard:'reader-pages',digests:[[readerPath,readerDigest]]};
  const imageShard={shard:'accepted-images',digests:[[imagePath,imageDigest]]};
  const rPath='_records/editorial/2026-10-04-run8/task19-digests-reader.json';
  const iPath='_records/editorial/2026-10-04-run8/task19-digests-images.json';
  const rSha=write(root,rPath,JSON.stringify(readerShard)),iSha=write(root,iPath,JSON.stringify(imageShard));
  const seal={edition_id:edition.edition_id,result:'PASS',digest_scheme:'git_blob_sha1',preserved:{accepted_locked_images:6},shards:[{path:rPath,git_blob_sha1:rSha},{path:iPath,git_blob_sha1:iSha}]};
  write(root,'_records/editorial/2026-10-04-run8/task19-bundle-seal.json',JSON.stringify(seal));
  assert.deepEqual(validateFrozenTask19Bundle(edition,root),['Frozen Task 19 must bind exactly six accepted image byte streams']);
  const rows=Array.from({length:6},(_,i)=>{const p=`briefs/images/2026-10-04/${i}.png`;return [p,write(root,p,'img-'+i)];});
  write(root,iPath,JSON.stringify({shard:'accepted-images',digests:rows}));
  const nextISha=blob(fs.readFileSync(path.join(root,iPath)));
  seal.shards[1].git_blob_sha1=nextISha;
  write(root,'_records/editorial/2026-10-04-run8/task19-bundle-seal.json',JSON.stringify(seal));
  assert.deepEqual(validateFrozenTask19Bundle(edition,root),[]);
  fs.appendFileSync(path.join(root,rows[0][0]),'tamper');
  assert.ok(validateFrozenTask19Bundle(edition,root).some(x=>x.includes('sealed artifact changed')));
});

test('frozen projection validation requires current edition in core projections and feeds',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dab-frozen-proj-'));
  const edition={brief_date:'2026-10-04',edition_id:'dab-edition-2026-10-04',stories:[{story_id:'dab-story-2026-10-04-a'}],worth_watching:{general:{status:'included'},agents_non_technical_people:{status:'included'}},podcasts:[{status:'included',item_id:'dab-podcast-2026-10-04-1'}]};
  write(root,'latest.md','# Daily Generative AI Brief — October 4, 2026');
  write(root,'index.md','2026-10-04');
  write(root,'archive.md','/briefs/2026-10-04/');
  write(root,'README.md','briefs/2026-10-04.md');
  write(root,'daily-feed.xml','2026-10-04');
  const ids=['dab-story-2026-10-04-a','dab-video-2026-10-04-general','dab-video-2026-10-04-agent-skills','dab-podcast-2026-10-04-1'];
  write(root,'feed.json',JSON.stringify({items:ids.map(id=>({id}))}));
  write(root,'feed.xml','<?xml version="1.0"?><feed>'+ids.map(id=>'<id>'+id+'</id>').join('')+'</feed>');
  assert.deepEqual(validateFrozenProjectionState(edition,root),[]);
});
