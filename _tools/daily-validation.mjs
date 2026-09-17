#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs,normalizeUrl} from '../_generator/lib/util.mjs';
import {classifyCommandCenterObservation,commandCenterAccessContract} from '../_generator/lib/command-center-access.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=parseArgs(process.argv.slice(2));
const date=args.date||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const base='https://gttome.github.io/Daily-AI-Brief';
const commandCenter='https://daily-ai-brief-command-center.gtome.chatgpt.site/';
const started=new Date().toISOString();
const checks=[];
const check=(id,result,severity,evidence,affected_item=null)=>checks.push({check_id:id,class:'deterministic',result,severity,evidence,...(affected_item?{affected_item}:{})});
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const exists=relative=>fs.existsSync(path.join(root,relative));
const hashFile=relative=>createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');

function pngDimensions(relative){
 const buffer=fs.readFileSync(path.join(root,relative));
 if(buffer.length<24||buffer.toString('ascii',1,4)!=='PNG')return null;
 return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),sha256:createHash('sha256').update(buffer).digest('hex'),bytes:buffer.length};
}
async function probe(url){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'follow',headers:{'user-agent':'DailyAIBriefValidation/2.0'}});
  return {url,status:response.status,ok:response.ok,resolved_url:response.url};
 }catch(error){return {url,status:null,ok:false,error:error.message};}
}
function includedMedia(edition){
 const videos=Object.values(edition.worth_watching||{}).filter(x=>x?.status==='included');
 const podcasts=Array.isArray(edition.podcasts)?edition.podcasts.filter(x=>x?.status!=='empty'):(edition.podcast?.status==='included'?[edition.podcast]:[]);
 return {videos,podcasts};
}
function semanticPacket(failures){return failures.map(x=>({artifact_id:x.affected_item||date,failed_rule:x.check_id,affected_item:x.affected_item||null,expected_value:'deterministic contract pass',observed_value:x.evidence,minimal_evidence:x.evidence,repair_scope:'failed_item_only'}));}

let completion,edition,routeCount=0;
try{completion=readJson(`_records/publication/${date}/completion.json`);edition=readJson(`_data/editions/${date}.json`);}catch(error){
 check('publication_receipt','fail','critical',`Required current-edition evidence is missing: ${error.message}`);
}
if(completion&&edition){
 const receiptOk=completion.phase==='pages_verified'&&completion.pages?.conclusion==='success'&&completion.edition_id===edition.edition_id&&/^[a-f0-9]{40}$/.test(completion.commit_sha||'');
 check('publication_receipt',receiptOk?'pass':'fail','critical',receiptOk?`Verified completion receipt for ${completion.commit_sha}.`:'Completion receipt is incomplete or inconsistent with the canonical edition.');
 const stories=edition.stories||[],counts={technical_ai_engineering:0,applied_genai_knowledge_workers:0,agents_non_technical_people:0};
 for(const story of stories)if(Object.hasOwn(counts,story.focus))counts[story.focus]++;
 const editionOk=stories.length===6&&Object.values(counts).every(n=>n===2)&&new Set(stories.map(x=>x.story_id)).size===6&&new Set(stories.map(x=>x.permanent_url)).size===6;
 check('canonical_edition_contract',editionOk?'pass':'fail','critical',editionOk?`Six unique stories with 2/2/2 allocation: ${JSON.stringify(counts)}.`:`Canonical edition contract mismatch: stories=${stories.length}, allocation=${JSON.stringify(counts)}.`);
 const media=includedMedia(edition);
 if(date>='2026-09-18')check('podcast_collection_contract',media.podcasts.length<=2&&new Set(media.podcasts.map(x=>x.show||x.source?.organization||x.source?.title)).size===media.podcasts.length?'pass':'fail','high',`Included podcasts=${media.podcasts.length}; distinct sources=${new Set(media.podcasts.map(x=>x.show||x.source?.organization||x.source?.title)).size}.`);
 const required=[`briefs/${date}.md`,'latest.md','index.md','archive.md','feed.xml','daily-feed.xml','feed.json',...(completion.file_set?.assets||[]),...(completion.file_set?.derived_outputs||[])];
 const missing=[...new Set(required)].filter(x=>!exists(x));
 check('local_release_artifacts',missing.length?'fail':'pass','critical',missing.length?`Missing: ${missing.join(', ')}`:`${new Set(required).size} current release artifacts exist locally.`);
 const images=stories.map(s=>s.image?.path).filter(Boolean),imageProblems=[];
 for(const image of images){if(!exists(image)){imageProblems.push(`${image}:missing`);continue;}const info=pngDimensions(image);if(!info||info.width<1200||info.height<630)imageProblems.push(`${image}:${info?`${info.width}x${info.height}`:'not_png'}`);}
 check('image_integrity_dimensions',images.length===6&&!imageProblems.length?'pass':'fail','high',images.length!==6?`Expected six story images; found ${images.length}.`:imageProblems.length?imageProblems.join('; '):`Six PNG assets exist at >=1200x630; hashes computed deterministically (${images.map(hashFile).join(',')}).`);
 const routes=[`${base}/`,`${base}/briefs/${date}/`,`${base}/briefs-archive/`,`${base}/watchlist/`,`${base}/watchlist/research/`,`${base}/feed.xml`,`${base}/daily-feed.xml`,`${base}/feed.json`,...stories.map(s=>base+s.permanent_url),...media.videos.filter(x=>x.permanent_url).map(x=>base+x.permanent_url),...media.podcasts.filter(x=>x.permanent_url).map(x=>base+x.permanent_url)];
 const unique=[...new Set(routes)];routeCount=unique.length;
 const sourceUrls=[...new Set(stories.map(s=>s.source?.url).filter(Boolean).map(url=>{try{return normalizeUrl(url);}catch{return url;}}))];
 if(args.offline===true){
  check('live_changed_routes','not_applicable','high','Offline deterministic test mode; live route probes intentionally skipped.');
  check('source_http_state','not_applicable','medium','Offline deterministic test mode; source probes intentionally skipped.');
 }else{
  const results=await Promise.all(unique.map(probe)),failed=results.filter(x=>!x.ok);
  check('live_changed_routes',failed.length?'fail':'pass','critical',failed.length?JSON.stringify(failed):`${results.length} homepage/edition/archive/watchlist/feed/story/media routes returned successful HTTP responses.`);
  const sources=await Promise.all(sourceUrls.map(probe)),failedSources=sources.filter(x=>!x.ok);
  check('source_http_state',failedSources.length?'fail':'pass','high',failedSources.length?JSON.stringify(failedSources):`${sources.length} selected source URLs returned successful HTTP responses.`);
 }
 const rendered=exists(`briefs/${date}.md`)?fs.readFileSync(path.join(root,`briefs/${date}.md`),'utf8'):'';
 const layout=exists('_layouts/default.html')?fs.readFileSync(path.join(root,'_layouts/default.html'),'utf8'):'';
 const ratingIdsOk=stories.every(s=>rendered.includes(s.story_id))&&((rendered.match(/class="[^"]*star-feedback/g)||[]).length>=6||(rendered.match(/data-feedback-story-id=/g)||[]).length>=6);
 const shareFoundationOk=exists('assets/js/share.js')&&exists('assets/css/share.css')&&layout.includes('/assets/js/share.js')&&layout.includes('/assets/css/share.css')&&stories.every(s=>s.permanent_url?.startsWith(`/stories/${date}/`));
 const controlsOk=ratingIdsOk&&shareFoundationOk;
 check('rating_share_generated_ids',controlsOk?'pass':'fail','high',controlsOk?'Six story identities/rating controls are generated and the canonical share JS/CSS foundation is wired through the default layout.':`Reader interaction contract mismatch: rating_ids=${ratingIdsOk}, share_foundation=${shareFoundationOk}.`);
 const accessibilityOk=stories.every(s=>typeof s.image?.alt==='string'&&s.image.alt.trim().length>=20);
 check('accessibility_assertions',accessibilityOk?'pass':'fail','high',accessibilityOk?'All six story images have substantive alt text.':'One or more story images lack substantive alt text.');
 const canonicalOk=stories.every(s=>s.permanent_url?.startsWith(`/stories/${date}/`)&&s.source?.url);
 check('canonical_url_parity',canonicalOk?'pass':'fail','high',canonicalOk?'Story routes/date and canonical source URLs are present.':'Story route/date or source canonical URL mismatch.');
 check('pages_deployment',completion.pages?.conclusion==='success'?'pass':'fail','critical',JSON.stringify(completion.pages||{}));
}

const access=commandCenterAccessContract();
check('command_center_access_contract',access.dashboard_read_access==='link_accessible'&&access.viewer_mode==='read_only'?'pass':'fail','critical',JSON.stringify(access));
if(args.offline===true)check('command_center_public_read','not_applicable','medium','Offline deterministic test mode.');
else {const cc=await probe(commandCenter);check('command_center_public_read',cc.ok?'pass':'fail','high',cc.ok?`Signed-out link read returned HTTP ${cc.status}; expected read-only access.`:JSON.stringify(cc));}
const protectedObservation=classifyCommandCenterObservation('signed_out_owner_operation_not_executed');
check('command_center_owner_operations',protectedObservation.result.toLowerCase(),'medium',protectedObservation.reason);

const failures=checks.filter(x=>x.result==='fail'),ended=new Date().toISOString();
const record={schema_version:'1.1.0',date,mode:'deterministic_delta_validation',started_at:started,ended_at:ended,elapsed_seconds:(Date.parse(ended)-Date.parse(started))/1000,publication_sha:completion?.commit_sha||null,route_count:routeCount,model_calls:0,input_tokens:null,output_tokens:null,owner_observed_credits:null,checks,final_result:failures.some(x=>['critical','high'].includes(x.severity))?'fail':failures.length?'degraded':'pass',semantic_escalation_required:failures.length>0,semantic_escalation_packet:semanticPacket(failures)};
const out=path.resolve(args.out||`/tmp/dab-validation-${date}.json`);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record,null,2));
if(record.final_result==='fail')process.exitCode=1;
