#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {createGitHubImageClient} from '../_generator/lib/github-image-transfer.mjs';

// An existing rejected PNG tests TRANSPORT only; no generation or acceptance is performed.
// Never write Q24 or replay its earlier blocked attempt-2 branch operation.
const repository = 'gttome/Daily-AI-Brief';
const sourceRef = 'cbd595d7fb432ae5ab56cc300878ce5fa7067499';
const sourcePath = '_records/image-attempts/2026-09-28-Q24/m04/attempt-1/raw.png';
const expected = '7e51fd9afff52d2be13471c141e5114f03be2cf02a7564b0f6a4ef771dc4d7f2';
const run = process.env.GITHUB_RUN_ID, attempt = process.env.GITHUB_RUN_ATTEMPT || '1';
if (!/^\d+$/.test(run || '') || !/^\d+$/.test(attempt) || process.env.GITHUB_REPOSITORY !== repository)
  throw Error('Proof requires this repository GitHub Actions context');
const token = process.env.GITHUB_TOKEN;
if (!token) throw Error('Existing repository token required');
const root = path.resolve(process.env.RUNNER_TEMP || '/tmp', `image-transfer-proof-${run}-${attempt}`);
await fs.mkdir(root, {recursive:true});
const client = createGitHubImageClient({token});
const baselineMain = await client.branch(repository, 'main');
const q24Branch = 'editorial-handoff/qualification/2026-09-28-Q24';
const baselineQ24 = await client.branch(repository, q24Branch);
const source = await client.raw(repository, sourcePath, sourceRef);
assert.equal(source.length, 2098317);
assert.equal(createHash('sha256').update(source).digest('hex'), expected);
const file = path.join(root, 'original.png');
await fs.writeFile(file, source, {flag:'wx'});
const proofBranch = `image-transfer-proof/${run}-${attempt}`;
const destination = `_records/image-transfer-proof/${run}-${attempt}/raw.png`;
const codeCommit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(codeCommit,/^[a-f0-9]{40}$/);
const branchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs`, {
  method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),
  headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
  body:JSON.stringify({ref:`refs/heads/${proofBranch}`,sha:codeCommit})
});
if (!branchResponse.ok) throw Error(`Independent proof branch creation denied: HTTP ${branchResponse.status}; no retry`);
const createdBranch = await branchResponse.json();
assert.equal(createdBranch.object.sha,codeCommit);
function invoke(name) {
  const receiptPath=path.join(root,`${name}.json`),started=performance.now();
  const output=execFileSync(process.execPath,['_tools/github-image-transfer.mjs','--file',file,'--repo',repository,
    '--branch',proofBranch,'--destination',destination,'--sha256',expected,'--receipt',receiptPath],
    {encoding:'utf8',timeout:120000,env:{...process.env,GH_TOKEN:token},maxBuffer:1024*1024});
  return {output,receiptPath,elapsed_ms:Math.round(performance.now()-started)};
}
const first=invoke('first'), second=invoke('repeat');
const r1=JSON.parse(await fs.readFile(first.receiptPath,'utf8')),r2=JSON.parse(await fs.readFile(second.receiptPath,'utf8'));
assert.equal(r1.status,'TRANSFER_VERIFIED');assert.equal(r1.read_back_verified,true);assert.equal(r1.reused,false);
assert.equal(r1.api_calls.write_requests,1);assert.equal(r1.api_calls.requests,4);
assert.equal(r2.status,'TRANSFER_VERIFIED');assert.equal(r2.reused,true);assert.equal(r2.api_calls.write_requests,0);
assert.equal(r2.commit_sha,r1.commit_sha);assert.equal(r2.sha256,expected);
assert.equal((await client.branch(repository,'main')).commit.sha,baselineMain.commit.sha);
assert.equal((await client.branch(repository,q24Branch)).commit.sha,baselineQ24.commit.sha);
const proof={schema_version:'1.0.0',result:'pass',scope:'live_image_transfer_only_not_image_generation_or_qualification',
 workflow_run_id:run,code_commit:codeCommit,proof_branch:proofBranch,source_commit:sourceRef,source_path:sourcePath,
 source_bytes:source.length,sha256:expected,first_upload_elapsed_ms:first.elapsed_ms,repeat_elapsed_ms:second.elapsed_ms,
 first:r1,repeat:r2,main_unchanged:true,q24_unchanged:true,source_image_rejected:true,image_accepted:false,
 q24_blocked_write_replayed:false,new_image_generation:false,owner_interventions:[],
 work_invocations:0,codex_invocations:0,paid_model_api_calls:0,account_billing_observed:false};
await fs.writeFile(path.join(root,'proof.json'),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof,null,2));
console.log(`Proof artifacts: ${root}`);
