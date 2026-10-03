#!/usr/bin/env node
// The observer hands off without committing to the frozen candidate.
import {execFileSync} from 'node:child_process';
const {RUN_BRANCH:branch,GITHUB_REPOSITORY:repo}=process.env;
if(!branch || branch==='main' || !/^[\w.-]+\/[\w.-]+$/.test(repo||'')) throw Error('publication_identity_required');
const gh=args=>execFileSync('gh',args,{encoding:'utf8'});
const prs=JSON.parse(gh(['api',`repos/${repo}/pulls?state=closed&head=${repo.split('/')[0]}:${branch}&base=main&per_page=100`]));
const merged=prs.find(p=>p.merged_at);
if(merged) {
  const p=JSON.parse(Buffer.from(JSON.parse(gh(['api',`repos/${repo}/contents/data/operations/active-production-run.json?ref=main`])).content,'base64').toString());
  if(p.active && !p.terminal && p.branch===branch) {
    const active=JSON.parse(gh(['api',`repos/${repo}/actions/workflows/daily-delta-validation.yml/runs?per_page=30`])).workflow_runs.some(r=>['queued','in_progress','waiting','requested','pending'].includes(r.status));
    if(!active) gh(['workflow','run','daily-delta-validation.yml','-R',repo,'--ref','main','-f',`date=${p.edition_id.replace('dab-edition-','')}`,'-f',`expected_sha=${merged.merge_commit_sha}`]);
    console.log(JSON.stringify({status:'EXISTING_MERGE_CLOSURE_OWNED_BY_DELTA_VALIDATION',production_sha:merged.merge_commit_sha}));
  }
  process.exit(0);
}
const candidateSha=JSON.parse(gh(['api',`repos/${repo}/git/ref/heads/${branch}`])).object.sha;
const title='Publish candidate '+branch+' '+candidateSha;
const runs=JSON.parse(gh(['api',`repos/${repo}/actions/workflows/publish-candidate.yml/runs?per_page=100`])).workflow_runs;
if(runs.some(r=>r.display_title===title && ['queued','in_progress','waiting','requested','pending'].includes(r.status))) {
  console.log(JSON.stringify({status:'PUBLICATION_EXECUTOR_ALREADY_ACTIVE',branch}));
} else if(runs.filter(r=>r.display_title===title && r.status==='completed' && r.conclusion!=='success').length>=3) {
  console.log(JSON.stringify({status:'PUBLICATION_HANDOFF_RETRY_BUDGET_EXHAUSTED',branch,run_branch_written:false}));
} else {
  gh(['workflow','run','publish-candidate.yml','-R',repo,'--ref','main','-f',`staging_ref=${branch}`,'-f','dry_run=false','-f','autonomous_run=true','-f',`expected_sha=${candidateSha}`]);
  console.log(JSON.stringify({status:'PUBLICATION_HANDOFF_DISPATCHED',branch,run_branch_written:false}));
}
