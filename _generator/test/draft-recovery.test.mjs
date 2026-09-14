import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {saveDraft,recoverDraft,privateDraftPath} from '../lib/draft-recovery.mjs';
import {RUN_VERSION} from '../lib/production-run.mjs';
import {sha256} from '../lib/util.mjs';
const sourceRepo=fileURLToPath(new URL('../../',import.meta.url));
function fixture(t,kind='writing'){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-private-draft-')),repo=path.join(tmp,'repo'),privateRoot=path.join(tmp,'private');
 t.after(()=>{assert.ok(fs.realpathSync(tmp).startsWith(fs.realpathSync(os.tmpdir())+path.sep));fs.rmSync(tmp,{recursive:true,force:true});});
 for(const file of ['docs/operations/publisher-runbook.md','docs/images/publisher-policy.md','_generator/lib/draft-recovery.mjs','_generator/lib/production-run.mjs','_generator/lib/visual-recovery.mjs','_generator/lib/image-gate.mjs','_tools/production-run.mjs','_data/editions/2026-09-14.json']){fs.mkdirSync(path.dirname(path.join(repo,file)),{recursive:true});fs.copyFileSync(path.join(sourceRepo,file),path.join(repo,file));}
 fs.mkdirSync(privateRoot);
 const edition=JSON.parse(fs.readFileSync(path.join(repo,'_data/editions/2026-09-14.json'))),story=edition.stories[0];
 const manifest={schema_version:'1.0.0',pipeline_version:RUN_VERSION,attempt_id:'dab-attempt-draft-test',edition_date:'2026-09-14',cutoff:'2026-09-14T12:00:00Z',timezone:'America/Chicago',article_window_hours:24,baseline_sha:'a'.repeat(40),private_root:privateRoot};
 const artifact_path=path.join(privateRoot,'working',kind==='writing'?'draft.md':'draft.png');fs.mkdirSync(path.dirname(artifact_path));fs.writeFileSync(artifact_path,kind==='writing'?'Unfinished fixture prose.':Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]));
 const packet={candidate_id:story.story_id,canonical_url:story.source.url,verification_status:'reviewed',source_content_hash:sha256('Fixture evidence'),verified_claims:[{claim:'Planned mechanism',evidence:'Fixture only'}],limitations:['Unverified for real publication'],availability:'planned'};
 const spec={mechanism:'Fixture mechanism',composition:'Fixture composition',labels:[{text:'Planned',claim_index:0}],relationships:[{from:'Input',to:'Output',status:'planned',claim_index:0}],prohibited_implications:['Do not claim shipped'],review:{status:'reviewed',reviewer:'test fixture',reviewed_at:'2026-09-14T12:00:00Z',checks:{mechanism:true,labels:true,availability:true,composition:true}}};
 const draft={kind,draft_id:'draft-1',story_id:story.story_id,artifact_path,packet,spec:kind==='image'?spec:undefined,generation_instructions:'Fixture only: explain the planned mechanism.',review:{status:'needs_revision',notes:'Needs another editorial review.'}};
 return {repo,manifest,draft,tmp,edition};
}
test('unfinished writing survives interruption privately and cannot overwrite changed work',t=>{
 const f=fixture(t),saved=saveDraft(f);assert.equal(saved.approval,'not_granted');const original=fs.readFileSync(f.draft.artifact_path);
 fs.unlinkSync(f.draft.artifact_path);assert.equal(recoverDraft({...f,checkpoint:saved.checkpoint}).restored,false);assert.equal(fs.existsSync(f.draft.artifact_path),false);
 const result=recoverDraft({...f,checkpoint:saved.checkpoint,restore:true});assert.equal(result.state,'recoverable_draft');assert.equal(result.review_status,'needs_revision');assert.equal(result.requires_final_gates,true);assert.deepEqual(fs.readFileSync(f.draft.artifact_path),original);
 const evidence=JSON.parse(fs.readFileSync(result.evidence_file));assert.equal(evidence.review.notes,f.draft.review.notes);assert.deepEqual(evidence.packet,f.draft.packet);
 fs.writeFileSync(f.draft.artifact_path,'Newer work');assert.equal(recoverDraft({...f,checkpoint:saved.checkpoint,restore:true}).reason,'working_draft_differs');assert.equal(fs.readFileSync(f.draft.artifact_path,'utf8'),'Newer work');
});
test('image drafts retain rejected status and never become approved images',t=>{
 const f=fixture(t,'image');f.draft.review.status='rejected';const saved=saveDraft(f),result=recoverDraft({...f,checkpoint:saved.checkpoint});
 assert.equal(result.state,'recoverable_draft');assert.equal(result.review_status,'rejected');assert.equal(result.approval,'not_granted');assert.equal(fs.existsSync(path.join(f.manifest.private_root,f.manifest.attempt_id,'approved-images')),false);
 assert.throws(()=>saveDraft({...f,draft:{...f.draft,review:{status:'approved',notes:'Not allowed'}}}),/no approval/);
});
test('changed source, instructions, selected story, policy or attempt requires review',t=>{
 const f=fixture(t),saved=saveDraft(f),options={...f,checkpoint:saved.checkpoint};
 for(const changed of [{...f.draft,packet:{...f.draft.packet,source_content_hash:sha256('Changed')}},{...f.draft,generation_instructions:'Different instructions'}])assert.equal(recoverDraft({...options,draft:changed}).state,'requires_review');
 assert.equal(recoverDraft({...options,manifest:{...f.manifest,cutoff:'2026-09-14T13:00:00Z'}}).state,'requires_review');
 assert.equal(recoverDraft({...options,manifest:{...f.manifest,attempt_id:'dab-attempt-other'}}).state,'requires_review');
 const editionFile=path.join(f.repo,'_data/editions/2026-09-14.json');const original=fs.readFileSync(editionFile);f.edition.stories[0].headline='Changed story';fs.writeFileSync(editionFile,JSON.stringify(f.edition));assert.equal(recoverDraft(options).state,'requires_review');fs.writeFileSync(editionFile,original);
 fs.appendFileSync(path.join(f.repo,'docs/operations/publisher-runbook.md'),'Changed policy');assert.equal(recoverDraft(options).state,'requires_review');
});
test('corruption is rejected and previous immutable draft versions remain readable',t=>{
 const f=fixture(t),first=saveDraft(f);fs.writeFileSync(f.draft.artifact_path,'Second draft');const second=saveDraft(f);assert.notEqual(first.checkpoint,second.checkpoint);
 const archive=path.join(f.manifest.private_root,f.manifest.attempt_id,'draft-archive');assert.ok(fs.existsSync(path.join(archive,first.checkpoint,'record.json')));
 fs.unlinkSync(f.draft.artifact_path);assert.equal(recoverDraft({...f,checkpoint:first.checkpoint,restore:true}).state,'recoverable_draft');
 fs.writeFileSync(path.join(archive,first.checkpoint,'evidence.json'),'{}');assert.equal(recoverDraft({...f,checkpoint:first.checkpoint}).state,'requires_review');
 fs.writeFileSync(path.join(archive,second.checkpoint,'artifact'),'Corrupt');assert.equal(recoverDraft({...f,checkpoint:second.checkpoint}).state,'requires_review');
});
test('public paths, traversal, linked escapes and archive overwrite targets are rejected',t=>{
 const f=fixture(t),saved=saveDraft(f);
 assert.throws(()=>privateDraftPath({...f,file:path.join(f.repo,'private.md')}),/private evidence root/);
 assert.throws(()=>saveDraft({...f,draft:{...f.draft,artifact_path:path.join(f.manifest.private_root,'..','outside.md')}}));
 const link=path.join(f.manifest.private_root,'escape');fs.symlinkSync(f.repo,link,'junction');assert.throws(()=>privateDraftPath({...f,file:path.join(link,'leak.md')}),/private evidence root/);
 const target=path.join(f.manifest.private_root,f.manifest.attempt_id,'draft-archive',saved.checkpoint,'artifact');assert.equal(recoverDraft({...f,checkpoint:saved.checkpoint,draft:{...f.draft,artifact_path:target},restore:true}).state,'requires_review');
 assert.equal(recoverDraft({...f,checkpoint:'../escape'}).state,'requires_review');
});
test('real preparation CLI saves and recovers a private draft with no generation',t=>{
 const f=fixture(t);f.repo=sourceRepo;const descriptor=path.join(f.manifest.private_root,'draft-input.json'),manifest=path.join(f.manifest.private_root,'manifest.json');
 fs.writeFileSync(descriptor,JSON.stringify(f.draft));fs.writeFileSync(manifest,JSON.stringify(f.manifest));
 const run=(...args)=>JSON.parse(execFileSync(process.execPath,['_tools/production-run.mjs',...args,'--manifest',manifest,'--file',descriptor],{cwd:sourceRepo,encoding:'utf8'}));
 const saved=run('save-draft');fs.unlinkSync(f.draft.artifact_path);const result=run('recover-draft','--checkpoint',saved.checkpoint,'--restore');
 assert.equal(result.state,'recoverable_draft');assert.equal(result.restored,true);assert.equal(result.image_generation_calls,0);assert.equal(result.publication,false);assert.equal(result.approval,'not_granted');
});
