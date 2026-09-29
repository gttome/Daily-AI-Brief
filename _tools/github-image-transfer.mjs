#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {transferImageFile} from '../_generator/lib/github-image-transfer.mjs';
try {
  const {values: v} = parseArgs({options: {file:{type:'string'}, repo:{type:'string'}, branch:{type:'string'},
    destination:{type:'string'}, sha256:{type:'string'}, receipt:{type:'string'}, 'known-safety-block':{type:'boolean',default:false}}});
  if (!v.receipt) throw Error('RECEIPT_PATH_REQUIRED');
  const receipt = await transferImageFile({sourcePath:v.file, repository:v.repo, branch:v.branch,
    destination:v.destination, expectedSha256:v.sha256, token:process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    knownSafetyBlock:v['known-safety-block']});
  await fs.mkdir(path.dirname(v.receipt), {recursive:true});
  // Use a new operation receipt path; exclusive creation preserves prior evidence.
  await fs.writeFile(v.receipt, JSON.stringify(receipt,null,2)+'\n', {flag:'wx'});
  console.log(JSON.stringify(receipt));
} catch (error) {
  console.error(JSON.stringify({status:'TRANSFER_NOT_VERIFIED',code:error.code || error.message,
    commit_sha:error.commit_sha || null,path:error.path || null,cause_code:error.cause_code || null,
    http_status:error.http_status || null,manual_intervention_required:false}));
  process.exitCode = 1;
}
