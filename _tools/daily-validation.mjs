#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from '../_generator/lib/util.mjs';
import {classifyCommandCenterObservation,commandCenterAccessContract} from '../_generator/lib/command-center-access.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=parseArgs(process.argv.slice(2));
const date=args.date||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const base='https://gttome.github.io/Daily-AI-Brief';
const commandCenter='https://daily-ai-brief-command-center.gtome.chatgpt.site/';
const started=new Date().toISOString();
const checks=[];
const check=(id,result,severity,evidence)=>checks.push({check_id:id,class:'deterministic',result,severity,evidence});
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const exists=relative=>fs.existsSync(path.join(root,relative));

async function probe(url){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'user-agent':'DailyAIBriefValidation/1.0'}});
  return {url,status:response.status,ok:response.ok};
 }catch(error){return {url,status:null,ok:false,error:error.message};}
}

let completion,edition;
try{completion=readJson(`_records/publication/${date}/completion.json`);edition=readJson(`_data/editions/${date}.json`);}catch(error){
 check('publication_receipt','fail','critical',`Required current-edition evidence is missing: ${error.message}`);
}
if(completion&&edition){
 const receiptOk=completion.phase==='pages_verified'&&completion.pages?.conclusion==='success'&&completion.edition_id===edition.edition_id&&/^[a-f0-9]{40}$/.test(completion.commit_sha||'');
 check('publication_receipt',receiptOk?'pass':'fail','critical',receiptOk?`Verified completion receipt for ${completion.commit_sha}.`:'Completion receipt is incomplete or inconsistent with the canonical edition.');
 const required=[`briefs/${date}.md`,'latest.md','index.md','feed.xml','daily-feed.xml','feed.json',...(completion.file_set?.assets||[])];
 const missing=required.filter(x=>!exists(x));
 check('local_release_artifacts',missing.length?'fail':'pass','critical',missing.length?`Missing: ${missing.join(', ')}`:`${required.length} current release artifacts exist locally.`);
 const routes=[`${base}/`,`${base}/briefs/${date}/`,`${base}/briefs-archive/`,`${base}/emerging-ai-watchlist/`,`${base}/watchlist/`,...(edition.stories||[]).map(s=>base+s.permanent_url)];
 for(const video of Object.values(edition.worth_watching||{}))if(video?.status==='included'&&video.permanent_url)routes.push(base+video.permanent_url);
 if(edition.podcast?.status==='included'&&edition.podcast.permanent_url)routes.push(base+edition.podcast.permanent_url);
 const unique=[...new Set(routes)];
 const results=args.offline===true?[]:await Promise.all(unique.map(probe));
 if(args.offline===true)check('live_changed_routes','not_applicable','high','Offline deterministic test mode; live route probes intentionally skipped.');
 else {const failed=results.filter(x=>!x.ok);check('live_changed_routes',failed.length?'fail':'pass','critical',failed.length?JSON.stringify(failed):`${results.length} current-edition/public routes returned successful HTTP responses.`);}
}

const access=commandCenterAccessContract();
check('command_center_access_contract',access.dashboard_read_access==='link_accessible'&&access.viewer_mode==='read_only'?'pass':'fail','critical',JSON.stringify(access));
if(args.offline===true)check('command_center_public_read','not_applicable','medium','Offline deterministic test mode.');
else {
 const cc=await probe(commandCenter);check('command_center_public_read',cc.ok?'pass':'fail','high',cc.ok?`Signed-out link read returned HTTP ${cc.status}; this is expected.`:JSON.stringify(cc));
}
const protectedObservation=classifyCommandCenterObservation('signed_out_owner_operation_not_executed');
check('command_center_owner_operations',protectedObservation.result.toLowerCase(),'medium',protectedObservation.reason);

const failures=checks.filter(x=>x.result==='fail');
const ended=new Date().toISOString();
const record={schema_version:'1.0.0',date,mode:'deterministic_delta_validation',started_at:started,ended_at:ended,elapsed_seconds:(Date.parse(ended)-Date.parse(started))/1000,publication_sha:completion?.commit_sha||null,model_calls:0,input_tokens:null,output_tokens:null,owner_observed_credits:null,checks,final_result:failures.some(x=>x.severity==='critical'||x.severity==='high')?'fail':failures.length?'degraded':'pass',semantic_escalation_required:failures.length>0,semantic_escalation_packet:failures.length?failures.map(x=>({failed_rule:x.check_id,observed_value:x.evidence,repair_scope:'failed_item_only'})):[]};
const out=path.resolve(args.out||`/tmp/dab-validation-${date}.json`);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record,null,2));
if(record.final_result==='fail')process.exitCode=1;
