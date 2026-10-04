import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {checkShell,checkWorkflow,scanWorkflows} from '../lib/workflow-static-guards.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const workflow=script=>'jobs:\n  test:\n    steps:\n      - run: |\n'+script.split('\n').map(l=>'          '+l).join('\n');
const valid="node - <<'NODE'\nconst x=1;\nNODE";
test('valid top-level and nested shell heredocs pass',()=>{
  assert.deepEqual(checkWorkflow(workflow(valid)),[]);
  assert.deepEqual(checkWorkflow(workflow("if true; then\n  "+valid+"\nfi")),[]);
  assert.deepEqual(checkShell("cat <<-EOF\n\ttext\n\tEOF"),[]);
});
for(const spaces of [2,4])test(`reject ${spaces}-space realized heredoc closer`,()=>{
  assert.ok(checkWorkflow(workflow(valid.replace('\nNODE','\n'+' '.repeat(spaces)+'NODE'))).some(x=>x.includes('indented_heredoc')));
});
test('missing and mismatched closers fail',()=>{
  for(const s of [valid.replace('\nNODE',''),valid.replace('\nNODE','\nWRONG')])assert.ok(checkShell(s).some(x=>x.includes('missing_heredoc')));
});
test('embedded CommonJS and ESM are syntax checked without executing',()=>{
  assert.deepEqual(checkShell(valid.replace('const x=1;','throw Error("must not execute");')),[]);
  assert.ok(checkShell(valid.replace('const x=1;','const = ;')).some(x=>x.includes('node_syntax')));
  assert.deepEqual(checkShell(valid.replace('node -','node --input-type=module -').replace('const x=1;','import fs from "node:fs";')),[]);
  assert.ok(checkShell(valid.replace('node -','node --input-type=module -').replace('const x=1;','export const = ;')).some(x=>x.includes('node_syntax')));
});
test('workflow dispatch requires intended explicit repository per command',()=>{
  for(const flag of ['--repo "$GITHUB_REPOSITORY"','-R "$GITHUB_REPOSITORY"','--repo=gttome/Daily-AI-Brief'])assert.deepEqual(checkShell('gh workflow run test.yml '+flag),[]);
  assert.deepEqual(checkShell('gh workflow run test.yml \\\n  --repo "$GITHUB_REPOSITORY"'),[]);
  for(const command of ['gh workflow run test.yml','gh workflow run test.yml --repo other/repo','gh workflow run a.yml; gh workflow run b.yml --repo "$GITHUB_REPOSITORY"'])assert.ok(checkShell(command).some(x=>x.includes('implicit_workflow_dispatch')));
});
test('direct repository dispatch is repository scoped',()=>{
  assert.deepEqual(checkShell('gh api --method POST "repos/${GITHUB_REPOSITORY}/dispatches"'),[]);
  assert.ok(checkShell('gh api --method POST "repos/{owner}/{repo}/dispatches"').some(x=>x.includes('implicit_repository_dispatch')));
  assert.ok(checkShell('curl -X POST https://api.github.com/repos/other/repo/dispatches').some(x=>x.includes('implicit_repository_dispatch')));
});
test('unsupported YAML run forms fail closed',()=>{
  assert.ok(checkWorkflow('run: >\n  gh workflow run a.yml').length);
});
test('historical defects independently reintroduced in real workflow fail',()=>{
  const actual=fs.readFileSync(root+'/.github/workflows/protected-repair-executor.yml','utf8');
  assert.deepEqual(checkWorkflow(actual),[]);
  for(const file of ['/tmp/repair-pr-comments.json','/tmp/merge-policy-comments.json']){
    const lines=actual.split('\n');
    const body=lines.findIndex(l=>l.includes('fs=require')&&l.includes(file));
    assert.ok(body>0);
    const closer=lines.findIndex((l,i)=>i>body&&l.trim()==='NODE');
    lines[closer]=' '.repeat(file.includes('merge-policy')?14:12)+'NODE';
    assert.ok(checkWorkflow(lines.join('\n')).some(x=>x.includes('indented_heredoc')));
  }
});
test('complete workflow corpus passes required CI',()=>{
  const rows=scanWorkflows(root);
  assert.ok(rows.length>=11);
  assert.deepEqual(rows.filter(x=>x.errors.length),[]);
});
