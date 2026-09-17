import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {generatedFiles} from '../_generator/lib/render.mjs';
import {buildPublicationStage} from '../_generator/lib/publication.mjs';
import {expandEditorialKernel,kernelReceipt} from '../_generator/lib/editorial-kernel.mjs';
import {validateEdition} from '../_generator/lib/validate.mjs';
import {validateMediaPreflight} from '../_generator/lib/production-guardrails.mjs';
const [baselineRoot,out]=process.argv.slice(2);
if(!baselineRoot||!out||path.resolve(out).startsWith(process.cwd()+path.sep))throw Error('External baseline and output directories required');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const baseline='1df531897edb50406b1d4bf2cf8089f69a797a92';
const source=git('rev-parse','HEAD'),before=git('status','--porcelain');
fs.mkdirSync(out,{recursive:true});
const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
const edition=JSON.parse(fs.readFileSync('_data/editions/2026-09-17.json'));
const report={executed_at:new Date().toISOString(),source_sha:source,baseline_sha:baseline,mode:'isolated historical replay; source observations retain September 17 timestamps; no live-source revalidation',production_writes:false,production_deployment:false,checks:{}};
const run=(name,fn)=>{try{report.checks[name]={result:'PASS',details:fn()};}catch(e){report.checks[name]={result:'FAIL',error:e.message};}};
run('historical_tree_unchanged',()=>{
 const changed=git('diff','--name-only',baseline,source).split('\n').filter(p=>/^(?:_data\/editions\/|_records\/|briefs\/|stories\/|videos\/|podcasts\/)/.test(p)&&/2026-09-17/.test(p));
 if(changed.length)throw Error(changed.join('\n'));
 return 'No dated September 17 files changed relative to baseline';
});
run('canonical_generation',()=>{
 const stage=buildPublicationStage(edition,process.cwd(),path.join(out,'canonical-stage'),{baselineSha:baseline,observedAt:edition.published_at,runId:'pr117-shadow-'+source.slice(0,12)});
 if(stage.event.rollback_target_sha!==baseline)throw Error('Rollback target mismatch');
 write('canonical-stage-manifest.json',stage);
 return {file_count:stage.files.length,digest:stage.digest,rollback_target:stage.event.rollback_target_sha};
});
const {generatedFiles:baselineGenerated}=await import(pathToFileURL(path.join(baselineRoot,'_generator/lib/render.mjs')));
run('reader_render_parity',()=>{
 const a=baselineGenerated(edition,baselineRoot),b=generatedFiles(edition,process.cwd());
 const publicFile=p=>!p.startsWith('_records/');
 const changed=[...new Set([...a.keys(),...b.keys()])].filter(publicFile).filter(p=>a.get(p)!==b.get(p));
 write('public-output-parity.json',{files:[...b.keys()].filter(publicFile),changed});
 if(changed.length)throw Error(changed.join('\n'));
 return {public_outputs:[...b.keys()].filter(publicFile).length,changed:0};
});
run('expected_routes',()=>{
 const files=generatedFiles(edition,process.cwd());
 const expected=['index.md','latest.md','briefs/2026-09-17.md','archive.md','feed.xml','feed.json',...edition.stories.map(s=>s.permanent_url.slice(1,-1)+'.md')];
 const absent=expected.filter(p=>!files.has(p));
 if(absent.length)throw Error(absent.join('\n'));return expected;
});
const kernel={schema_version:'1.0.0',brief_date:edition.brief_date,edition_id:edition.edition_id,baseline_sha:baseline,normal_model_passes:1,normal_post_editorial_model_passes:0,editorial_takeaway:edition.editorial_takeaway,stories:edition.stories.map(s=>({canonical_ordinal:s.ordinal,story_id:s.story_id,candidate_id:s.story_id,focus:s.focus,headline:s.headline,summary:s.summary,why_it_matters:s.why_it_matters,what_to_do_now:s.what_to_do_now,topic_labels:s.topics,editorial_limitation:'Historical diagnostic reconstruction; no new editorial approval asserted.',source_url:s.source.normalized_url,agent_skill:/agent skill/i.test(s.headline),visual:{description:s.image.alt}})),media_decisions:{replay:true},changed_watchlist_topics:[]};
write('diagnostic-kernel.json',kernel);
run('kernel_to_stage_replay',()=>{
 const expanded=expandEditorialKernel(kernel,{candidateFacts:Object.fromEntries(edition.stories.map(s=>[s.story_id,s])),imageAssets:Object.fromEntries(edition.stories.map(s=>[s.story_id,s.image])),media:{worth_watching:edition.worth_watching,podcast:edition.podcast},publishedAt:edition.published_at,coveragePeriod:edition.coverage_period});
 write('kernel-receipt.json',kernelReceipt(kernel));write('expanded-edition.json',expanded);
 write('identity-comparison.json',edition.stories.map((s,i)=>({old_id:s.story_id,new_id:expanded.stories[i].story_id,old_route:s.permanent_url,new_route:expanded.stories[i].permanent_url})));
 const errors=validateEdition(expanded);if(errors.length)throw Error(errors.join('\n'));
 return buildPublicationStage(expanded,process.cwd(),path.join(out,'kernel-stage'),{baselineSha:baseline,observedAt:edition.published_at,runId:'pr117-kernel-shadow-'+source.slice(0,12)});
});
report.current_media_preflight_errors=validateMediaPreflight(edition,JSON.parse(fs.readFileSync('_records/editorial/media-preflight/2026-09-17.json')),{observedAt:report.executed_at});
run('checkout_unchanged',()=>{if(git('status','--porcelain')!==before)throw Error('Checkout changed');return 'All generated files are outside checkout';});
run('restoration_target_available',()=>{git('cat-file','-e',baseline+'^{commit}');return {target:baseline,method:'Reviewed restoration commit; no reset or force push',live_restore_executed:false};});
report.live_anonymous_probes=[];
const origin='https://daily-ai-brief-command-center.gtome.chatgpt.site';
for(const [method,route] of [['GET','/api/access'],['GET','/api/comments?retain=false'],['GET','/api/usage'],['GET','/api/snapshot'],['GET','/api/audience'],['GET','/api/book-updates'],['POST','/api/usage/record'],['POST','/api/snapshot/record'],['POST','/api/watchlist/review'],['POST','/api/comments/review']]){
 try{
  const response=await fetch(origin+route,{method,redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
  let data;try{data=await response.json();}catch{}
  // Never persist private response content. Invalid empty mutation bodies cannot create valid records.
  const expected=route==='/api/access'?response.status===200&&data?.owner===false:response.status===403&&data?.error==='owner_identity_required';
  report.live_anonymous_probes.push({method,route,status:response.status,expected_owner_denial:data?.error==='owner_identity_required',signed_out:data?.owner===false,result:expected?'PASS':'FAIL'});
 }catch(e){report.live_anonymous_probes.push({method,route,result:'FAIL',error:e.name});}
}
report.checks.live_anonymous_access={result:report.live_anonymous_probes.every(p=>p.result==='PASS')?'PASS':'FAIL',details:'No cookies, bearer tokens, or identity headers used. Private response bodies not retained.'};
report.result=Object.values(report.checks).every(x=>x.result==='PASS')?'PASS':'FAIL';
write('report.json',report);console.log(JSON.stringify(report,null,2));
if(report.result!=='PASS')process.exitCode=1;
