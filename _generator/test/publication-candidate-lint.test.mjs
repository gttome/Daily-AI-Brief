import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {lintPublicationCandidate} from '../lib/publication-candidate-lint.mjs';

const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const imageErrors=errors=>errors.filter(error=>error.startsWith('image_')||error==='six_distinct_image_hashes_required'||error==='exactly_6_image_manifest_entries_required');

function inputs(imageManifest){
 const edition=read('_data/editions/2026-09-25.json');
 const kernel=read('_records/editorial-handoff/kernel.json');
 const handoff=read('_records/editorial-handoff/handoff.json');
 return {
  root,
  edition,
  kernel,
  media:read('_records/editorial-handoff/media.json'),
  imageManifest,
  mediaReceipt:read('_records/editorial/media-preflight/2026-09-25.json'),
  canonicalWatchlist:read('_records/editorial-handoff/watchlist-2026-09-25.json'),
  publicWatchlistData:read('data/watchlist.json'),
  handoff,
  runtime:read('docs/operations/under80-runtime-contract.json'),
  gitEvidence:{
   baselineSha:kernel.baseline_sha,
   handoffHeadSha:'f'.repeat(40),
   handoffParentSha:kernel.baseline_sha,
   actualStagingRef:handoff.staging_ref
  }
 };
}

test('publication candidate lint accepts the real September 25 locked SVG image set',()=>{
 const manifest=read('_records/editorial-handoff/final-image-review-2026-09-25.json');
 const errors=lintPublicationCandidate(inputs(manifest));
 assert.deepEqual(imageErrors(errors),[]);
});

test('publication candidate lint detects tampered SVG Git blob identity',()=>{
 const manifest=structuredClone(read('_records/editorial-handoff/final-image-review-2026-09-25.json'));
 const edition=read('_data/editions/2026-09-25.json');
 const first=Object.values(manifest)[0];
 first.git_blob_sha='f'.repeat(40);
 const errors=lintPublicationCandidate(inputs(manifest));
 assert.ok(errors.includes('image_git_blob_mismatch:'+edition.stories[0].story_id));
});


function pointerFixture(t,briefDate){
 const fixtureRoot=fs.mkdtempSync(path.join(os.tmpdir(),'publication-pointer-'));
 t.after(()=>fs.rmSync(fixtureRoot,{recursive:true,force:true}));
 fs.mkdirSync(path.join(fixtureRoot,'data/operations'),{recursive:true});
 fs.writeFileSync(path.join(fixtureRoot,'data/operations/current-edition.json'),JSON.stringify({brief_date:briefDate}));
 return fixtureRoot;
}

test('publication candidate lint preserves a prior verified current-edition pointer before live closure',t=>{
 const manifest=read('_records/editorial-handoff/final-image-review-2026-09-25.json');
 const candidate=inputs(manifest);
 candidate.root=pointerFixture(t,'2026-09-25');
 candidate.edition={...candidate.edition,brief_date:'2026-09-26',edition_id:'dab-edition-2026-09-26'};
 const errors=lintPublicationCandidate(candidate);
 assert.deepEqual(errors.filter(error=>error.startsWith('current_edition_pointer_')),[]);
});

test('publication candidate lint rejects a current-edition pointer newer than the candidate',t=>{
 const manifest=read('_records/editorial-handoff/final-image-review-2026-09-25.json');
 const candidate=inputs(manifest);
 candidate.root=pointerFixture(t,'2026-09-25');
 candidate.edition={...candidate.edition,brief_date:'2026-09-24',edition_id:'dab-edition-2026-09-24'};
 const errors=lintPublicationCandidate(candidate);
 assert.deepEqual(errors.filter(error=>error.startsWith('current_edition_pointer_')),['current_edition_pointer_invalid_for_candidate']);
});
