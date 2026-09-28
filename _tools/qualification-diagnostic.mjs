#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const FOCI=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
export function instrumentGate(source){
 const marker='const selected=[],selectedUrls=new Set();';
 if(source.split(marker).length!==2)throw Error('diagnostic_gate_marker_mismatch');
 const probe=`const diagCount=list=>Object.fromEntries(['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'].map(f=>[f,list.filter(x=>x.focus_hint===f).length]));
const diagNovel=eligible.filter(x=>x.production_novelty_eligible!==false);
const diagBySource=Object.fromEntries([...new Set(eligible.map(x=>x.source_id||'unknown'))].sort().map(s=>[s,{before_novelty:diagCount(eligible.filter(x=>(x.source_id||'unknown')===s)),after_novelty:diagCount(diagNovel.filter(x=>(x.source_id||'unknown')===s))}]));
fs.writeFileSync(process.env.DAB_DIAGNOSTIC_POOL_PATH,JSON.stringify({before_novelty:diagCount(eligible),after_novelty:diagCount(diagNovel),by_source:diagBySource},null,2)+'\\n');
`;
 const rejectProbe="const diagRejected={}; const diagReject=(item,reason)=>{const s=item.source_id||'unknown';diagRejected[s]??={};diagRejected[s][reason]=(diagRejected[s][reason]||0)+1;};\n";
 const instrumented=source.replace('const byUrl=new Map();',rejectProbe+'const byUrl=new Map();').replace(/rejected\.([a-z_]+)\+\+/g,(_,r)=>`(diagReject(item,'${r}'),rejected.${r}++)`);
 return instrumented.replace(marker,probe.replace('by_source:diagBySource','by_source:diagBySource,rejections_by_source:typeof diagRejected===\'undefined\'?{}:diagRejected')+marker);
}
export function classifyCoverage(pool,gate){
 if(!pool||!gate)return 'diagnostic_incomplete';
 if(FOCI.some(f=>!Number.isInteger(pool.after_novelty?.[f])||!Number.isInteger(gate.coverage_counts?.[f])))return 'diagnostic_incomplete';
 if(FOCI.some(f=>pool.after_novelty[f]<3))return 'eligible_source_supply_shortfall';
 if(FOCI.some(f=>gate.coverage_counts[f]<3))return 'shortlist_selection_starvation';
 if((gate.agent_skill_story_ready_signals_after_novelty??0)<1)return 'agent_skills_unavailable';
 return gate.coverage_ready===true?'preflight_coverage_ready':'readiness_inconsistent';
}
export function runDiagnostic(requestPath){
 const req=JSON.parse(fs.readFileSync(requestPath,'utf8'));
 if(!/^\d{4}-\d{2}-\d{2}-D\d+$/.test(req.diagnostic_id||''))throw Error('diagnostic_identity_invalid');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(req.edition_date||'')||!Number.isFinite(Date.parse(req.cutoff)))throw Error('diagnostic_date_invalid');
 if(Date.parse(req.cutoff)>Date.now()+60000)throw Error('future_diagnostic_cutoff_prohibited');
 if(req.source_scan_max!==48||req.production_mutation!==false||req.execution_mode!=='qualification_diagnostic_nonproduction')throw Error('diagnostic_bounds_invalid');
 const dir=path.resolve('_records/qualification-diagnostics',req.diagnostic_id);
 if(fs.existsSync(path.join(dir,'report.json')))throw Error('diagnostic_identity_already_terminal');
 fs.mkdirSync(dir,{recursive:true});
 const report={schema_version:'1.0.0',diagnostic_id:req.diagnostic_id,diagnostic_only:true,qualification_pass:false,request:req,started_at:new Date().toISOString(),workflow_run_id:process.env.GITHUB_RUN_ID||null,source_scan_max:48,metadata_limit:20,article_evidence_started:false,semantic_pass_started:false,production_mutation:false,model_calls:0,account_billing_observed:false,steps:[]};
 const run=(name,file,args=[],extra={})=>{
  const start=new Date().toISOString();
  try{const stdout=execFileSync(process.execPath,[file,...args],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:300000,env:{...process.env,...extra}});report.steps.push({name,start,completed_at:new Date().toISOString(),result:'pass',stdout:stdout.slice(-6000)});}
  catch(e){report.steps.push({name,start,completed_at:new Date().toISOString(),result:'fail',exit_status:e.status??null,error:String(e.stderr||e.message).slice(-4000)});throw e;}
 };
 const temp='_tools/.qualification-diagnostic-gate.mjs';
 try{
  run('discovery','_tools/discover-sources.mjs',[],{DAB_RESEARCH_CUTOFF:req.cutoff,DAB_DISCOVERY_FRESH:'1',DAB_DISCOVERY_PURPOSE:'continuous_qualification',DAB_SOURCE_SCAN_MIN:'12',DAB_SOURCE_SCAN_MAX:'48',DAB_FRESH_METADATA_TARGET:'24'});
  run('date_enrichment','_tools/enrich-metadata-dates.mjs',['--input','_data/media-candidate-queue.json','--receipt',path.join(dir,'date-enrichment.json'),'--limit','48','--cutoff',req.cutoff]);
  const gate=fs.readFileSync('_tools/under80-metadata-gate.mjs');
  const blob=createHash('sha1').update(Buffer.from('blob '+gate.length+'\0')).update(gate).digest('hex');
  if(blob!==req.expected_gate_blob_sha)throw Error('diagnostic_gate_version_mismatch');
  report.gate_blob_sha=blob;report.method='original_gate_with_read_only_aggregate_probe';
  fs.writeFileSync(temp,instrumentGate(gate.toString('utf8')));
  run('metadata_gate',temp,['--input','_data/media-candidate-queue.json','--out',path.join(dir,'metadata-candidates.json'),'--limit','20','--cutoff',req.cutoff,'--qualification-edition-date',req.edition_date],{DAB_DIAGNOSTIC_POOL_PATH:path.join(dir,'eligible-pool-counts.json')});
  const pool=JSON.parse(fs.readFileSync(path.join(dir,'eligible-pool-counts.json'))),shortlist=JSON.parse(fs.readFileSync(path.join(dir,'metadata-candidates.json')));
  report.pool_coverage_before_novelty=pool.before_novelty;report.pool_coverage_after_novelty=pool.after_novelty;report.shortlist_coverage=shortlist.coverage_counts;report.rejections=shortlist.rejected;
  report.classification=classifyCoverage(pool,shortlist);report.coverage_ready=shortlist.coverage_ready;
  const discovery=JSON.parse(fs.readFileSync(`_records/discovery/${req.edition_date}.json`));
  report.sources=discovery.sources.map(x=>({source_id:x.source_id,status:x.status,candidate_links:x.candidate_links??0,reason:x.reason||null}));
  report.discovery_efficiency=discovery.efficiency;
  report.result='diagnostic_complete';
 }catch(e){report.result='diagnostic_failed';report.error=String(e.message).slice(0,1500);process.exitCode=1;}
 finally{fs.rmSync(temp,{force:true});report.completed_at=new Date().toISOString();fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)runDiagnostic(process.argv[2]||'_records/qualification-diagnostics/request.json');
