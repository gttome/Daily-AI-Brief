import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir=new URL('./',import.meta.url).pathname;
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read('bundle-manifest.json'),candidate=read('candidate-pool.json'),evidence=read('evidence-package.json'),edition=read('edition.json');
const stageEdition=JSON.parse(fs.readFileSync(dir+'stage/_data/editions/2026-09-18.json','utf8'));
const failures=[];
const check=(ok,name,detail)=>{if(!ok)failures.push(name);return {name,result:ok?'PASS':'FAIL',detail};};
const counts=Object.fromEntries(['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'].map(x=>[x,edition.stories.filter(s=>s.focus===x).length]));
const checks=[
 check(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim()===manifest.baseline_sha,'production_baseline','origin/main remains the verified baseline'),
 check(candidate.candidates.length<=20,'candidate_ceiling',`${candidate.candidates.length} metadata candidates`),
 check(evidence.deep_reviews.length<=9,'deep_review_ceiling',`${evidence.deep_reviews.length} reviewed candidates`),
 check(edition.stories.length===6&&Object.values(counts).every(n=>n===2),'story_allocation',JSON.stringify(counts)),
 check(evidence.agent_skills.count===1,'agent_skills_exactly_one','one reusable Agent Skills story'),
 check(manifest.images.length===6&&manifest.images.every(x=>sha(x.path)===x.sha256),'image_hashes','six fixed 1200x630 image hashes'),
 check(evidence.media.podcasts.selected===2&&new Set(evidence.media.podcasts.items.map(x=>x.show)).size===2,'podcast_coverage','two source-diverse podcasts'),
 check(evidence.media.videos.decision==='bounded omission','video_decision','bounded omission evidence retained'),
 check(manifest.editorial_model_passes===1&&manifest.post_editorial_model_passes===0&&manifest.deterministic_validation_model_calls===0,'model_pass_limits','1 editorial / 0 post-editorial / 0 deterministic'),
 check(JSON.stringify(stageEdition)===JSON.stringify(edition),'staged_canonical_parity','staged canonical edition matches accepted bundle'),
 check(manifest.production_changes===0,'production_unchanged','no production merge or publication')
];
const result={schema_version:'1.0.0',mode:'nonproduction_deterministic_delta_validation',canary_id:manifest.canary_id,baseline_sha:manifest.baseline_sha,checked_at:new Date().toISOString(),model_calls:0,input_tokens:null,output_tokens:null,checks,final_result:failures.length?'FAIL':'PASS',failures};
fs.writeFileSync(dir+'delta-validation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
