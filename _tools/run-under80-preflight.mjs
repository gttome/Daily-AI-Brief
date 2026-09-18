#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {parseArgs} from '../_generator/lib/util.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.request)throw Error('Requires --request <json>');
const requestPath=path.resolve(args.request);
const request=JSON.parse(fs.readFileSync(requestPath,'utf8'));
if(request.schema_version!=='1.0.0')throw Error('preflight_request_schema_invalid');
if(!/^\d{4}-\d{2}-\d{2}$/.test(request.edition_date||''))throw Error('preflight_request_date_invalid');
const cutoff=Date.parse(request.cutoff);
if(!Number.isFinite(cutoff))throw Error('preflight_request_cutoff_invalid');
const chicagoDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date(cutoff));
if(chicagoDate!==request.edition_date)throw Error('preflight_request_cutoff_date_mismatch');
const mode=request.execution_mode||'qualification_nonproduction';
if(!['qualification_nonproduction','production'].includes(mode))throw Error('preflight_request_mode_invalid');

const outDir=path.resolve(request.output_dir||`_records/preflight/${request.edition_date}`);
fs.mkdirSync(outDir,{recursive:true});
const metadataPath=path.join(outDir,'metadata-candidates.json');
const receiptPath=path.join(outDir,'receipt.json');
const discoveryPath=path.resolve('_records/discovery',request.edition_date+'.json');
const env={...process.env,
 DAB_RESEARCH_CUTOFF:new Date(cutoff).toISOString(),
 DAB_DISCOVERY_FRESH:'1',
 DAB_RETRIEVAL_CACHE:process.env.DAB_RETRIEVAL_CACHE||path.join(os.tmpdir(),'dab-preflight-cache')
};
const startedAt=new Date().toISOString();
let discoveryStdout='',gateStdout='',error=null;
try{
 discoveryStdout=execFileSync(process.execPath,['_tools/discover-sources.mjs'],{cwd:process.cwd(),env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 gateStdout=execFileSync(process.execPath,[
  '_tools/under80-metadata-gate.mjs',
  '--input','_data/media-candidate-queue.json',
  '--out',metadataPath,
  '--limit',String(request.metadata_candidate_limit||20),
  '--cutoff',new Date(cutoff).toISOString(),
  '--ordinary-max-age-hours',String(request.ordinary_max_age_hours||72),
  '--skill-max-age-hours',String(request.agent_skills_max_age_hours||168)
 ],{cwd:process.cwd(),env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}catch(e){
 error={message:e.message,stderr:String(e.stderr||'').slice(0,4000),stdout:String(e.stdout||'').slice(0,4000)};
}
const gate=fs.existsSync(metadataPath)?JSON.parse(fs.readFileSync(metadataPath,'utf8')):null;
const discovery=fs.existsSync(discoveryPath)?JSON.parse(fs.readFileSync(discoveryPath,'utf8')):null;
const receipt={
 schema_version:'1.0.0',
 profile_id:'under80-v1',
 stage:'deterministic_prework_metadata_preflight',
 execution_mode:mode,
 edition_date:request.edition_date,
 cutoff:new Date(cutoff).toISOString(),
 started_at:startedAt,
 completed_at:new Date().toISOString(),
 model_calls:0,
 work_credits_expected:0,
 fresh_discovery:true,
 raw_queue_model_visible:false,
 metadata_candidates_path:path.relative(process.cwd(),metadataPath).replaceAll('\\','/'),
 discovery_receipt_path:fs.existsSync(discoveryPath)?path.relative(process.cwd(),discoveryPath).replaceAll('\\','/'):null,
 discovery:{
  sources_scanned:discovery?.efficiency?.sources_scanned??null,
  fresh_metadata_candidates:discovery?.efficiency?.fresh_metadata_candidates??null,
  stop_reason:discovery?.efficiency?.stop_reason??null,
  source_text_chars_retrieved:discovery?.efficiency?.source_text_chars_retrieved??null,
  preferred_feed_sources:discovery?.efficiency?.preferred_feed_sources??null,
  required_topic_sources:discovery?.efficiency?.required_topic_sources??null
 },
 gate:gate?{
  retained_metadata_candidates:gate.retained_metadata_candidates,
  coverage_counts:gate.coverage_counts,
  agent_skill_signals:gate.agent_skill_signals,
  coverage_ready:gate.coverage_ready,
  rejected:gate.rejected
 }:null,
 ready:gate?.coverage_ready===true&&!error,
 error,
 stdout:{discovery:discoveryStdout.slice(-2000),gate:gateStdout.slice(-2000)},
 invariant:'This deterministic preflight runs outside the daily Work semantic task. Work may read only the committed metadata-candidates.json and receipt.json, never the raw discovery queue.'
};
fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({ready:receipt.ready,metadata_candidates:gate?.retained_metadata_candidates??0,coverage_counts:gate?.coverage_counts??null,agent_skill_signals:gate?.agent_skill_signals??0,receipt:path.relative(process.cwd(),receiptPath)}));
