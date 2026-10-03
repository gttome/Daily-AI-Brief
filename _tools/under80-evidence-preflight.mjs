#!/usr/bin/env node
import fs from 'node:fs';
import {balancedArticleEvidencePlan} from '../_generator/lib/article-freshness.mjs';
import path from 'node:path';
import {parseArgs,sha256} from '../_generator/lib/util.mjs';
import {retrieveSource} from './discovery-links.mjs';
import {ARTICLE_EVIDENCE_TEXT_VERSION,extractArticleEvidenceText,articleEvidenceExcerpt,articleEvidenceSufficiency,evidenceWordCount} from './article-evidence-text.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.input||!args.out||!args.receipt)throw Error('Requires --input, --out, and --receipt');
const gate=JSON.parse(fs.readFileSync(path.resolve(args.input),'utf8'));
if(gate.profile_id!=='under80-v1'||gate.coverage_ready!==true)throw Error('coverage_ready_metadata_gate_required');
if(!Array.isArray(gate.candidates)||gate.candidates.length>20)throw Error('bounded_metadata_candidates_required');
const focuses=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const preferred=gate.preferred_agent_skill_candidate_id||gate.candidates.find(x=>x.agent_skill_story_ready)?.candidate_id||null;
if(!preferred)throw Error('preferred_agent_skill_candidate_required');

const plan=balancedArticleEvidencePlan(gate);

const fetchedAt=new Date().toISOString(),records=[];
for(const candidate of plan){
 try{
  const result=await retrieveSource(candidate.canonical_url,{maxResponseBytes:1800000,maxNormalizedChars:1500000});
  const body=extractArticleEvidenceText(result.text,{canonicalUrl:candidate.canonical_url,headline:candidate.headline}),plain=body.text;
  const wordCount=evidenceWordCount(plain),excerpt=articleEvidenceExcerpt(plain,candidate.headline);
  const quality=articleEvidenceSufficiency({headline:candidate.headline,source_word_count:wordCount,excerpt});
  records.push({
   candidate_id:candidate.candidate_id,focus:candidate.focus_hint,headline:candidate.headline,
   canonical_url:candidate.canonical_url,publisher:candidate.publisher||null,published_at:candidate.published_at,
   source_reliability:candidate.source_reliability||null,agent_skill_story_ready:candidate.agent_skill_story_ready===true,
   source_word_count:wordCount,excerpt,source_content_sha256:sha256(plain),extraction_method:body.method,
   retrieval_status:quality.sufficient?'retrieved':'insufficient',...(quality.sufficient?{}:{reason:'article_evidence_insufficient:'+quality.reasons.join(',')}),fetched_at:fetchedAt
  });
 }catch(error){
  records.push({candidate_id:candidate.candidate_id,focus:candidate.focus_hint,headline:candidate.headline,canonical_url:candidate.canonical_url,retrieval_status:'unavailable',reason:String(error.message||error),fetched_at:fetchedAt});
 }
}
const retrieved=records.filter(x=>x.retrieval_status==='retrieved');
const focusCounts=Object.fromEntries(focuses.map(f=>[f,retrieved.filter(x=>x.focus===f).length]));
let modelVisible=retrieved.map(x=>({candidate_id:x.candidate_id,focus:x.focus,headline:x.headline,canonical_url:x.canonical_url,publisher:x.publisher,published_at:x.published_at,source_reliability:x.source_reliability,agent_skill_story_ready:x.agent_skill_story_ready,source_word_count:x.source_word_count,excerpt:x.excerpt}));
let chars=JSON.stringify(modelVisible).length;
if(chars>11000){
 const cap=Math.max(300,Math.floor(650*11000/chars));
 modelVisible=modelVisible.map(x=>({...x,excerpt:x.excerpt.length>cap?x.excerpt.slice(0,cap).replace(/\s+\S*$/,'').trim()+'…':x.excerpt}));
 chars=JSON.stringify(modelVisible).length;
}
const ready=modelVisible.every(article=>articleEvidenceSufficiency(article).sufficient)&&retrieved.length===9&&focuses.every(f=>focusCounts[f]===3)&&retrieved.some(x=>x.candidate_id===preferred&&x.agent_skill_story_ready===true)&&chars<=12000;
const evidence={schema_version:'1.0.0',evidence_text_version:ARTICLE_EVIDENCE_TEXT_VERSION,article_freshness_policy:gate.article_freshness_policy||null,profile_id:'under80-v1',execution_owner:'github_actions',model_calls:0,review_plan_count:plan.length,preferred_agent_skill_candidate_id:preferred,model_visible_chars:chars,model_visible:modelVisible};
const receipt={schema_version:'1.0.0',evidence_text_version:ARTICLE_EVIDENCE_TEXT_VERSION,profile_id:'under80-v1',stage:'deterministic_article_evidence_preflight',execution_owner:'github_actions',model_calls:0,network_retrievals:plan.length,retrieved:retrieved.length,focus_counts:focusCounts,preferred_agent_skill_candidate_id:preferred,model_visible_chars:chars,evidence_sha256:sha256(JSON.stringify(evidence)),ready,failures:records.filter(x=>x.retrieval_status!=='retrieved').map(x=>({candidate_id:x.candidate_id,reason:x.reason})),extraction_methods:records.filter(x=>x.extraction_method).map(x=>({candidate_id:x.candidate_id,method:x.extraction_method,source_word_count:x.source_word_count}))};
fs.mkdirSync(path.dirname(path.resolve(args.out)),{recursive:true});
fs.writeFileSync(path.resolve(args.out),JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(path.resolve(args.receipt),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
if(!ready)process.exitCode=2;
