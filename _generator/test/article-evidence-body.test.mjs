import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {extractArticleEvidenceText,articleEvidenceExcerpt,articleEvidenceSufficiency,evidenceWordCount,MIN_ARTICLE_SOURCE_WORDS,MIN_ARTICLE_EXCERPT_WORDS} from '../../_tools/article-evidence-text.mjs';
const url='https://example.com/blog/verified-agent-workflow',headline='Verified agent workflow';
// Synthetic content models the observed BlogPosting/description/mainEntityOfPage shape;
// publisher prose remains only in the bounded diagnostic artifact, not this fixture.
const sentence='The agent workflow requires a documented task, verified source context, bounded permissions, human review, and an explicit record of the result.';
const body=Array(7).fill(sentence).join(' ');
const article=(overrides={})=>({'@context':'https://schema.org','@type':'BlogPosting',mainEntityOfPage:{'@type':'WebPage','@id':url},headline,description:body,...overrides});
const html=value=>`<html><head><title>${headline}</title><script type="application/ld+json" data-next-head="">${JSON.stringify(value)}</script></head><body><div id="app"></div></body></html>`;
const options={canonicalUrl:url,headline};
const extract=x=>extractArticleEvidenceText(x,options);
const words=n=>Array(n).fill('evidence').join(' ');
test('observed publisher JSON-LD description yields a substantive identity-bound body',()=>{
 const r=extract(html(article()));assert.equal(r.method,'jsonld.description');assert.equal(r.text,body);
 const quality=articleEvidenceSufficiency({headline,source_word_count:evidenceWordCount(r.text),excerpt:articleEvidenceExcerpt(r.text,headline)});
 assert.equal(quality.sufficient,true);
});
test('articleBody is preferred to a description for the same verified article',()=>{
 const r=extract(html(article({articleBody:body+' '+sentence})));assert.equal(r.method,'jsonld.articleBody');
});
for(const [name,change] of [
 ['different canonical identity',{mainEntityOfPage:{'@id':'https://example.com/unrelated'}}],
 ['different headline',{headline:'Another unrelated article'}],
 ['organization rather than article',{'@type':'Organization'}],
 ['missing canonical identity',{mainEntityOfPage:null}],
 ['non-HTTPS canonical identity',{mainEntityOfPage:{'@id':'http://example.com/blog/verified-agent-workflow'}}]
])test(`structured ${name} cannot supply the source body`,()=>{
 const r=extract(html(article(change)));assert.equal(evidenceWordCount(r.text),0);
});
test('JSON-LD graphs are supported without evaluating executable JavaScript or malformed JSON',()=>{
 assert.equal(extract(html({'@graph':[{'@type':'Organization',description:body},article()]})).method,'jsonld.description');
 globalThis.q22ShouldNotExecute=false;
 const r=extract('<script>globalThis.q22ShouldNotExecute=true</script><script type="application/ld+json">{bad JSON}</script>');
 assert.equal(globalThis.q22ShouldNotExecute,false);assert.equal(evidenceWordCount(r.text),0);delete globalThis.q22ShouldNotExecute;
});
test('visible article body remains supported and navigation is not evidence',()=>{
 assert.equal(extract(`<nav>${body}</nav><article>${body}</article>`).method,'html.article');
 assert.equal(evidenceWordCount(extract(`<head><title>${headline}</title></head><nav>${body}</nav><footer>${body}</footer>`).text),0);
});
test('mechanical source and excerpt minima have explicit inclusive boundaries',()=>{
 assert.equal(MIN_ARTICLE_SOURCE_WORDS,80);assert.equal(MIN_ARTICLE_EXCERPT_WORDS,25);
 assert.equal(articleEvidenceSufficiency({headline,source_word_count:80,excerpt:words(25)}).sufficient,true);
 assert.equal(articleEvidenceSufficiency({headline,source_word_count:79,excerpt:words(25)}).sufficient,false);
 assert.equal(articleEvidenceSufficiency({headline,source_word_count:80,excerpt:words(24)}).sufficient,false);
});
test('title-only HTTP-success shells fail even with inflated source metadata',()=>{
 for(const source_word_count of [13,15,200])assert.equal(articleEvidenceSufficiency({headline,source_word_count,excerpt:headline+' | Publisher'}).sufficient,false);
});
const focuses=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
function runCollector(mode){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'q22-body-collector-'));
 try{
  const candidates=focuses.flatMap((focus,j)=>[0,1,2].map(i=>({candidate_id:`${j}-${i}`,focus_hint:focus,headline,canonical_url:`https://example.com/${j}-${i}`,published_at:'2026-09-28T12:00:00Z',agent_skill_story_ready:j===2&&i===0})));
  const gate={profile_id:'under80-v1',article_freshness_policy:'article-24-72-168-v1',coverage_ready:true,cutoff:'2026-09-28T17:45:40Z',candidates,preferred_agent_skill_candidate_id:'2-0'};
  fs.writeFileSync(path.join(dir,'input.json'),JSON.stringify(gate));
  const tool=pathToFileURL(path.resolve('_tools/under80-evidence-preflight.mjs')).href;
  const worker=`import fs from 'node:fs';let count=0;globalThis.fetch=async url=>{count++;const shell=${JSON.stringify(mode)}==='shell'&&/\\/1-[01]$/.test(url);const x=${JSON.stringify(article())};x.mainEntityOfPage['@id']=url;return new Response(shell?'<html><head><title>Verified agent workflow | Publisher</title></head></html>':'<script type="application/ld+json">'+JSON.stringify(x)+'</script>',{status:200,headers:{'content-type':'text/html'}})};await import(${JSON.stringify(tool)});fs.writeFileSync(${JSON.stringify(path.join(dir,'fetch-count.json'))},JSON.stringify(count));`;
  fs.writeFileSync(path.join(dir,'worker.mjs'),worker);
  const result=spawnSync(process.execPath,[path.join(dir,'worker.mjs'),'--input',path.join(dir,'input.json'),'--out',path.join(dir,'e.json'),'--receipt',path.join(dir,'r.json')],{encoding:'utf8'});
  assert.notEqual(result.status,null,result.stderr);assert.ok(fs.existsSync(path.join(dir,'r.json')),result.stderr);
  return {status:result.status,receipt:JSON.parse(fs.readFileSync(path.join(dir,'r.json'))),evidence:JSON.parse(fs.readFileSync(path.join(dir,'e.json'))),fetches:JSON.parse(fs.readFileSync(path.join(dir,'fetch-count.json')))};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('collector rejects two Applied title shells without refilling the frozen nine-review plan',()=>{
 const r=runCollector('shell');assert.equal(r.status,2);assert.equal(r.receipt.ready,false);assert.equal(r.receipt.retrieved,7);assert.equal(r.receipt.focus_counts.applied_genai_knowledge_workers,1);assert.equal(r.fetches,9);assert.equal(r.receipt.failures.length,2);
 assert.ok(r.receipt.failures.every(x=>x.reason.includes('article_evidence_insufficient')));
});
test('collector accepts nine identity-checked structured bodies within unchanged budgets',()=>{
 const r=runCollector('body');assert.equal(r.status,0);assert.equal(r.receipt.ready,true);assert.equal(r.fetches,9);assert.equal(r.evidence.model_visible.length,9);assert.ok(r.evidence.model_visible_chars<=12000);assert.equal(r.evidence.model_calls,0);assert.equal(r.evidence.evidence_text_version,'article-body-v1');
 assert.ok(r.receipt.extraction_methods.every(x=>x.method==='jsonld.description'));
});
test('current-policy semantic validation independently rejects title-only selected evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'q22-body-semantic-'));
 try{
  const selection=focuses.flatMap((focus,j)=>[0,1].map(i=>({candidate_id:`${j}-${i}`,focus,agent_skills_story:j===2&&i===0})));
  const semantic={semantic_pass_count:1,source_packet_frozen:true,discovery_rerun:false,article_evidence_rerun:false,selection};
  const evidence={article_freshness_policy:'article-24-72-168-v1',model_visible:selection.map(x=>({...x,headline,source_word_count:200,excerpt:body}))};
  const sp=path.join(dir,'s.json'),ep=path.join(dir,'e.json');fs.writeFileSync(sp,JSON.stringify(semantic));
  const run=()=>{fs.writeFileSync(ep,JSON.stringify(evidence));return spawnSync(process.execPath,['_tools/validate-qualification-semantic-receipt.mjs',sp,ep],{encoding:'utf8'});};
  assert.equal(run().status,0);evidence.model_visible[2].excerpt=headline;evidence.model_visible[2].source_word_count=13;
  const failed=run();assert.notEqual(failed.status,0);assert.match(failed.stderr,/qualification_semantic_evidence_insufficient:1-0/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
