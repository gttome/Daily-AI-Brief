import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 PUBLICATION_MANIFEST_PATH,publicationManifestErrors,validatePublicationManifest
} from '../lib/publication-manifest.mjs';

const root=process.cwd();
const load=()=>JSON.parse(fs.readFileSync(PUBLICATION_MANIFEST_PATH,'utf8'));

test('September 25 migration manifest binds completed artifacts without rework',()=>{
 const manifest=load();
 const result=validatePublicationManifest(root,manifest,{expectedBaseline:manifest.baseline_sha,expectedEditionDate:'2026-09-25',expectedStagingRef:'editorial-handoff/production/2026-09-25-recovery'});
 assert.deepEqual(result.errors,[]);
 assert.equal(result.result,'PASS');
 assert.deepEqual(manifest.freeze.watchlist.counts,{new_today:0,updated_today:3,carried_forward:13});
 assert.equal(manifest.freeze.media.repair_allowed_downstream,false);
 assert.equal(manifest.freeze.watchlist.repair_allowed_downstream,false);
 assert.equal(manifest.freeze.images.path_resolution,'manifest_only');
});

test('publication manifest rejects unsupported schema version',()=>{
 const manifest=load();manifest.schema_version='9.9.9';
 assert.ok(publicationManifestErrors(root,manifest).includes('publication_manifest_schema_version_unsupported'));
});

test('publication manifest rejects missing artifact before downstream work',()=>{
 const manifest=load();manifest.artifacts.facts.path='_records/editorial-handoff/not-present.json';
 assert.ok(publicationManifestErrors(root,manifest).includes('publication_manifest_artifact_missing:facts'));
});

test('publication manifest rejects stale baseline',()=>{
 const manifest=load();
 assert.ok(publicationManifestErrors(root,manifest,{expectedBaseline:'f'.repeat(40)}).includes('publication_manifest_stale_baseline'));
});

test('publication manifest rejects mismatched edition date',()=>{
 const manifest=load();
 assert.ok(publicationManifestErrors(root,manifest,{expectedEditionDate:'2026-09-26'}).includes('publication_manifest_expected_date_mismatch'));
});

test('publication manifest rejects invalid content digest',()=>{
 const manifest=load();manifest.artifacts.media.digest='git_blob_sha1:'+'0'.repeat(40);
 assert.ok(publicationManifestErrors(root,manifest).includes('publication_manifest_digest_mismatch:media'));
});

test('publication manifest rejects implicit or unsupported legacy adapter',()=>{
 const manifest=load();manifest.artifacts.media.adapter='implicit-latest-media';
 assert.ok(publicationManifestErrors(root,manifest).includes('publication_manifest_explicit_adapter_required:media'));
});

test('publication manifest rejects Watchlist projection drift',()=>{
 const manifest=load();manifest.freeze.watchlist.public_projection_digest='git_blob_sha1:'+'0'.repeat(40);
 const errors=publicationManifestErrors(root,manifest);
 assert.ok(errors.includes('publication_manifest_watchlist_projection_digest_mismatch'));
 assert.ok(errors.includes('publication_manifest_watchlist_public_projection_mismatch'));
});

test('handoff workflow validates manifest before expensive publication and contains no late Watchlist repair',()=>{
 const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
 assert.match(workflow,/Validate and freeze versioned publication manifest/);
 assert.match(workflow,/--publication-manifest/);
 assert.match(workflow,/Reuse accepted image checkpoint from manifest-bound review/);
 assert.doesNotMatch(workflow,/Regenerate public Watchlist from canonical state/);
 assert.doesNotMatch(workflow,/render-visual-assets\.mjs/);
 assert.doesNotMatch(workflow,/node --test _generator\/test\/\*\.test\.mjs/);
});

test('future publication generation requires manifest-bound control-plane inputs',()=>{
 const cli=fs.readFileSync('_generator/cli.mjs','utf8');
 const publication=fs.readFileSync('_generator/lib/publication.mjs','utf8');
 assert.match(cli,/generate requires --publication-manifest for frozen-contract editions/);
 assert.match(publication,/Manifest-bound media preflight is required/);
 assert.match(publication,/Manifest-bound Watchlist is required/);
 assert.match(publication,/Manifest-bound image review is required/);
});
