import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('under80 handoff uses authenticated Git Data API rather than native git or Contents API for binary images',()=>{
 const runtime=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
 const policy=JSON.parse(fs.readFileSync('docs/operations/efficiency-operating-policy.json','utf8'));
 const template=JSON.parse(fs.readFileSync('docs/operations/editorial-handoff-template.json','utf8'));
 const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
 assert.equal(runtime.images.binary_transport.method,'github_git_data_api');
 assert.equal(runtime.images.binary_transport.github_contents_api_for_binary_images_prohibited,true);
 assert.equal(runtime.images.binary_transport.native_git_credentials_required,false);
 assert.deepEqual(runtime.images.binary_transport.connector_tools,['create_blob','create_tree','create_commit','update_ref']);
 assert.equal(runtime.handoff.required_values.image_transport_method,'github_git_data_api');
 assert.equal(policy.image.binary_transport,'github_git_data_api');
 assert.equal(policy.no_new_credentials,true);
 assert.equal(template.handoff_manifest_shape.image_transport_method,'github_git_data_api');
 assert.equal(template.qualification_handoff_manifest_shape.image_transport_method,'github_git_data_api');
 assert.equal(runtime.handoff.publication_manifest_path,'_records/editorial-handoff/publication-manifest.json');
 assert.equal(policy.handoff_publication_manifest_required,true);
 assert.equal(template.handoff_manifest_shape.publication_manifest_path,'_records/editorial-handoff/publication-manifest.json');
 assert.equal(template.qualification_handoff_manifest_shape.publication_manifest_path,'_records/editorial-handoff/publication-manifest.json');
 assert.match(workflow,/Validate and freeze versioned publication manifest/);
 assert.doesNotMatch(workflow,/Regenerate public Watchlist from canonical state/);
 assert.equal(template.images_shape.c01.quality_accepted,true);
 assert.equal(template.images_shape.c01.generation_method,'openai_image_generation');
 assert.match(workflow,/github_git_data_api/);
 assert.match(workflow,/echo \"FINAL_IMAGE_REVIEW_PATH=\$IMAGE_REVIEW_PATH\" >> \"\$GITHUB_ENV\"/);
 assert.match(workflow,/args=\(expand --kernel \"\$KERNEL_PATH\" --facts \"\$FACTS_PATH\" --metadata \"\$METADATA_CANDIDATES_PATH\" --images \"\$FINAL_IMAGE_REVIEW_PATH\"/);
 assert.doesNotMatch(workflow,/handoff_manifest_native_git_image_transport_required/);
});

test('Git Data handoff recipe is atomic and isolated',()=>{
 const runtime=JSON.parse(fs.readFileSync('docs/operations/under80-runtime-contract.json','utf8'));
 const recipe=runtime.handoff.git_data_transport;
 assert.equal(recipe.image_blob_creation,'create_blob with encoding=base64 using the complete accepted PNG or WebP bytes');
 assert.equal(recipe.text_blob_creation,'create_blob with encoding=utf-8');
 assert.equal(recipe.finalize,'update_ref on the isolated handoff branch only; force=false');
 assert.equal(recipe.no_contents_api_for_binary,true);
 assert.equal(recipe.no_native_git_credentials,true);
});
