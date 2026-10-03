#!/usr/bin/env node
// Reversible branch housekeeping. No edition, image, failure-record or main writes.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const REPOSITORY='gttome/Daily-AI-Brief';
const DAY=86400000;
const qPattern=/(?:^|\/)(?:Q\d+|IH\d+)|-Q\d+$|-IH\d+$/i;
const allowPattern=/^(?:fix|repair|feature|feat|refactor|docs|ops|policy|improve|chore|hardening)\//;
const keepPattern=/(?:qualification|image-harness|pr117|(?:^|\/)q\d+|(?:^|\/)ih\d+)/i;
const refPath=s=>s.split('/').map(encodeURIComponent).join('/');
export function validateRequest(r,now=Date.now()){
  if(r?.schema_version!=='1.0.0'||r.repository!==REPOSITORY||!['audit','apply'].includes(r.mode))throw Error('invalid_maintenance_request');
  if(!/^[a-z0-9][a-z0-9-]{5,63}$/.test(r.maintenance_id||''))throw Error('invalid_maintenance_id');
  if(!/^[a-f0-9]{40}$/.test(r.expected_main_sha||''))throw Error('expected_main_sha_required');
  if(!Number.isInteger(r.max_branches)||r.max_branches<1||r.max_branches>200)throw Error('invalid_cleanup_bound');
  if(!Number.isFinite(Date.parse(r.merged_before))||Date.parse(r.merged_before)>now-DAY)throw Error('minimum_24h_cooling_period');
  return r;
}
export function buildPlan({branches,pulls,activeBranches,referencedBranches,protected117,request}){
  const active=new Set(activeBranches),references=new Set(referencedBranches);
  const open=new Set(pulls.filter(p=>p.state==='open').map(p=>p.head.ref));
  return branches.map(b=>{
    const name=b.name,sha=b.commit.sha;
    let reason=null;
    if(name==='main'||b.protected||name===protected117)reason='protected';
    else if(!allowPattern.test(name)||keepPattern.test(name)||qPattern.test(name))reason='retained_namespace';
    else if(open.has(name))reason='open_pull_request';
    else if(active.has(name))reason='active_workflow';
    else if(references.has(name))reason='referenced_by_tracked_file';
    const p=pulls.find(p=>p.merged_at&&p.base.ref==='main'&&p.head.ref===name&&p.head.sha===sha&&p.head.repo?.full_name===REPOSITORY);
    if(!reason&&!p)reason='no_exact_merged_head';
    if(!reason&&Date.parse(p.merged_at)>=Date.parse(request.merged_before))reason='cooling_period';
    return {branch:name,sha,decision:reason?'retain':'archive_candidate',reason:reason||'exact_merged_head',pull_request:p?.number??null,merged_at:p?.merged_at??null,archive_ref:reason?null:`tags/archive/${request.maintenance_id}/${name}`};
  });
}
export async function archiveOne(item,{getBranch,getArchive,createArchive,hasOpenPR,hasActiveRun,deleteBranch}){
  if(item.decision!=='archive_candidate')throw Error('not_archive_candidate');
  let b=await getBranch(item.branch);
  if(!b||b.protected||b.commit.sha!==item.sha)return {branch:item.branch,result:'skipped_changed_or_protected'};
  if(await hasOpenPR(item.branch)||await hasActiveRun(item.branch))return {branch:item.branch,result:'skipped_live_work'};
  let tag=await getArchive(item.archive_ref);
  if(!tag){await createArchive(item.archive_ref,item.sha);tag=await getArchive(item.archive_ref);}
  if(tag?.object?.sha!==item.sha||tag?.object?.type!=='commit')throw Error('archive_verification_failed:'+item.branch);
  b=await getBranch(item.branch);
  if(!b||b.protected||b.commit.sha!==item.sha)return {branch:item.branch,result:'skipped_head_race',archive_ref:item.archive_ref};
  await deleteBranch(item.branch);
  const after=await getBranch(item.branch);
  if(after)return {branch:item.branch,result:'not_removed_or_recreated',archive_ref:item.archive_ref};
  return {branch:item.branch,sha:item.sha,result:'archived_and_removed',archive_ref:item.archive_ref};
}
function trackedText(){
  const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),texts=[];
  for(const file of files){
    if(!/\.(?:md|json|mjs|js|yml|yaml|txt|html|xml|sh|py)$/.test(file))continue;
    const bytes=fs.readFileSync(file);if(bytes.includes(0))continue;
    texts.push(bytes.toString('utf8'));
  }
  return {files,texts};
}
export async function main(){
  if(process.env.GITHUB_REPOSITORY!==REPOSITORY||process.env.GITHUB_ACTOR!=='gttome')throw Error('repository_owner_guard');
  if(!process.env.GITHUB_REF_NAME?.startsWith('maintenance-request/'))throw Error('request_branch_required');
  if(!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('request_commit_required');
  const token=process.env.GITHUB_TOKEN;if(!token)throw Error('github_token_required');
  const prefix=`https://api.github.com/repos/${REPOSITORY}`;
  const api=async(route,{method='GET',body=null,optional=false}={})=>{
    if(!route.startsWith('/')||route.includes('..'))throw Error('unsafe_api_route');
    const response=await fetch(prefix+route,{method,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
    if(optional&&response.status===404)return null;
    if(!response.ok)throw Error(`github_${response.status}:${method}:${route.split('?')[0]}`);
    return response.status===204?null:response.json();
  };
  const all=async(route,key=null)=>{
    const data=[];for(let page=1;page<=20;page++){
      const r=await api(`${route}${route.includes('?')?'&':'?'}per_page=100&page=${page}`),items=key?r[key]:r;
      if(!Array.isArray(items))throw Error('invalid_collection');data.push(...items);if(items.length<100)return data;
    }throw Error('incomplete_pagination_refuse_cleanup');
  };
  const raw=await api(`/contents/_records/maintenance/request.json?ref=${process.env.GITHUB_SHA}`);
  const request=validateRequest(JSON.parse(Buffer.from(raw.content,'base64').toString('utf8')));
  const mainRef=await api('/git/ref/heads/main');
  if(mainRef.object.sha!==request.expected_main_sha)throw Error('main_changed_reaudit_required');
  const checkout=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(checkout!==request.expected_main_sha)throw Error('trusted_checkout_mismatch');
  const [branches,pulls,protectedPR]=await Promise.all([all('/branches'),all('/pulls?state=all'),api('/pulls/117')]);
  const active=[];
  for(const status of ['in_progress','queued','waiting','pending','requested'])active.push(...await all(`/actions/runs?status=${status}`,'workflow_runs'));
  const {files,texts}=trackedText();
  const referencedBranches=branches.filter(b=>texts.some(t=>t.includes(b.name))).map(b=>b.name);
  const plan=buildPlan({branches,pulls,activeBranches:active.map(r=>r.head_branch),referencedBranches,protected117:protectedPR.head.ref,request});
  const selected=plan.filter(x=>x.decision==='archive_candidate').slice(0,request.max_branches);
  const qBranches=branches.filter(b=>/discovery-preflight\/qualification\/.*-Q\d+$/.test(b.name)).sort((a,b)=>Number(b.name.match(/-Q(\d+)$/)[1])-Number(a.name.match(/-Q(\d+)$/)[1]));
  const sourcePlan=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
  const oldPins=sourcePlan.sources.filter(s=>s.pinned_candidate&&Number.isFinite(Date.parse(s.known_publication_date))&&Date.now()-Date.parse(s.known_publication_date)>4*DAY);
  const report={schema_version:'1.0.0',maintenance_id:request.maintenance_id,observed_at:new Date().toISOString(),baseline_sha:checkout,request_commit:process.env.GITHUB_SHA,request,summary:{branches_before:branches.length,eligible_for_archive:plan.filter(p=>p.decision==='archive_candidate').length,selected:selected.length,open_pull_requests:pulls.filter(p=>p.state==='open').map(p=>({number:p.number,title:p.title,branch:p.head.ref})),tracked_files:files.length,operations_documents:files.filter(f=>f.startsWith('docs/operations/')&&f.endsWith('.md')).length,pinned_sources:sourcePlan.sources.filter(s=>s.pinned_candidate).length,pins_older_than_96h:oldPins.length,latest_qualification_branch:qBranches[0]?.name??null},protected_pr117:{number:117,head:protectedPR.head.ref,sha:protectedPR.head.sha},plan,results:[],status:'planned'};
  const resultBranch=`maintenance-results/${request.maintenance_id}`;
  const exists=await api(`/git/ref/heads/${refPath(resultBranch)}`,{optional:true});
  if(exists)throw Error('maintenance_identity_already_exists_no_replay');
  await api('/git/refs',{method:'POST',body:{ref:`refs/heads/${resultBranch}`,sha:checkout}});
  const reportPath='_records/maintenance/cleanup-report.json';let reportSha=null;
  const save=async()=>{
    report.updated_at=new Date().toISOString();
    const body={message:`Maintenance ${request.maintenance_id}: ${report.status}`,content:Buffer.from(JSON.stringify(report,null,2)+'\n').toString('base64'),branch:resultBranch,...(reportSha?{sha:reportSha}:{})};
    const result=await api(`/contents/${reportPath}`,{method:'PUT',body});reportSha=result.content.sha;
  };
  // Durable restore index exists before the first branch can be removed.
  await save();
  try{
    if(request.mode==='apply'){
      for(const item of selected){
        const result=await archiveOne(item,{
          getBranch:name=>api(`/branches/${encodeURIComponent(name)}`,{optional:true}),
          getArchive:ref=>api(`/git/ref/${refPath(ref)}`,{optional:true}),
          createArchive:(ref,sha)=>api('/git/refs',{method:'POST',body:{ref:`refs/${ref}`,sha}}),
          hasOpenPR:async name=>(await api(`/pulls?state=open&head=${encodeURIComponent('gttome:'+name)}&per_page=1`)).length>0,
          hasActiveRun:async name=>{const runs=await api(`/actions/runs?branch=${encodeURIComponent(name)}&per_page=10`);return runs.workflow_runs.some(r=>r.status!=='completed');},
          deleteBranch:name=>api(`/git/refs/heads/${refPath(name)}`,{method:'DELETE'})
        });
        report.results.push(result);report.status='applying';
        if(report.results.length%10===0)await save();
        await new Promise(resolve=>setTimeout(resolve,200));
      }
    }
    const after=await all('/branches');
    report.summary.branches_after=after.length;
    report.summary.archived_and_removed=report.results.filter(r=>r.result==='archived_and_removed').length;
    report.summary.skipped_at_execution=report.results.length-report.summary.archived_and_removed;
    report.summary.main_unchanged=(await api('/git/ref/heads/main')).object.sha===checkout;
    report.status=request.mode==='apply'?'complete':'audit_complete';await save();
  }catch(error){report.status='stopped_safely';report.error=error.message;await save();throw error;}
  console.log(JSON.stringify({status:report.status,result_branch:resultBranch,...report.summary},null,2));
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Reversible cleanup\n\n${report.status}\n\nArchived and removed: ${report.summary.archived_and_removed??0}\n\nReport branch: ${resultBranch}\n\nNo edition, image, terminal-Q or main content was deleted.\n`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
