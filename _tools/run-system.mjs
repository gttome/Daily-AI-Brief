import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {reviewedImages} from '../_generator/lib/image-gate.mjs';import {buildPublicationStage} from '../_generator/lib/publication.mjs';
const started=new Date(),date=process.argv[2]||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(started);
if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid date');
const root=process.cwd(),edition=JSON.parse(fs.readFileSync(`_data/editions/${date}.json`));
const id=`dab-attempt-${date}-validation-${started.toISOString().replace(/[^0-9]/g,'')}`;
const result={schema_version:'1.0.0',attempt_id:id,edition_id:edition.edition_id,started_at:started.toISOString(),scope:'same-day full validation of retained editorial selection and approved images',checks:[],outcome:'failed'};
try{
 for(const command of [['npm',['test']],['node',['_generator/cli.mjs','validate-repo']],['node',['_generator/cli.mjs','integration-check']]]){execFileSync(command[0],command[1],{stdio:'pipe'});result.checks.push({name:command[1].join(' '),result:'pass'});}
 const review=reviewedImages(edition,root);if(review.errors.length)throw Error(review.errors.join(';'));
 const urls=[...edition.stories.map(s=>s.source.url),...['general','agents_non_technical_people'].map(k=>edition.worth_watching?.[k]).filter(s=>s?.status==='included').map(s=>s.url),...(edition.podcast?.status==='included'?[edition.podcast.url]:[])];
 for(const url of urls){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});result.checks.push({name:'source availability',url,status:r.status,result:r.ok?'pass':'fail'});await r.body?.cancel();if(!r.ok)throw Error('Source availability failed');}
 const baseline=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const out=fs.mkdtempSync('/tmp/dab-release-');
 const stage=buildPublicationStage(edition,root,out,{baselineSha:baseline,observedAt:new Date().toISOString()});
 fs.mkdirSync('_records/releases',{recursive:true});fs.copyFileSync(path.join(out,`_records/releases/${date}.json`),`_records/releases/${date}.json`);
 result.release_digest=stage.digest;result.image_hashes=review.assets;result.outcome='validated';
}catch(error){result.error=error.message;process.exitCode=1;}
result.ended_at=new Date().toISOString();result.wall_seconds=Math.round((Date.now()-started.valueOf())/1000);
fs.mkdirSync(`_records/attempts/${date}`,{recursive:true});fs.writeFileSync(`_records/attempts/${date}/${id}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
