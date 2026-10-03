import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {extractCandidateMetadata,publicationDatePrecision,publicationTimestamp} from '../../_tools/discovery-links.mjs';

test('publication metadata preserves day versus instant precision',()=>{
  assert.equal(publicationDatePrecision('2026-09-25'),'day');
  assert.equal(publicationTimestamp('2026-09-25'),'2026-09-25T00:00:00.000Z');
  assert.equal(publicationDatePrecision('2026-09-25T14:30:00-07:00'),'instant');
  assert.equal(publicationTimestamp('2026-09-25T14:30:00-07:00'),'2026-09-25T21:30:00.000Z');
});

test('candidate extraction carries publication precision forward',()=>{
  const day=extractCandidateMetadata(
    '<script type="application/ld+json">'+JSON.stringify({
      '@type':'NewsArticle',url:'https://example.com/day',headline:'Enterprise AI productivity release for knowledge workers',datePublished:'2026-09-25'
    })+'</script>',
    'https://example.com/'
  )[0];
  const instant=extractCandidateMetadata(
    '<script type="application/ld+json">'+JSON.stringify({
      '@type':'NewsArticle',url:'https://example.com/instant',headline:'Enterprise AI productivity release for knowledge workers',datePublished:'2026-09-25T14:30:00-07:00'
    })+'</script>',
    'https://example.com/'
  )[0];
  assert.equal(day.publication_date_precision,'day');
  assert.equal(instant.publication_date_precision,'instant');
  assert.equal(instant.published_at,'2026-09-25T21:30:00.000Z');
});

test('Q14 hardening keeps the ordinary freshness gate at exactly 72 hours',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-q14-freshness-'));
  const input=path.join(dir,'in.json'),out=path.join(dir,'out.json');
  fs.writeFileSync(input,JSON.stringify({candidates:[
    {source_id:'boundary',headline:'Enterprise workplace AI productivity update for knowledge workers',canonical_url:'https://example.com/boundary',published_at:'2026-09-25T03:00:00Z',source_reliability:'publisher_authored',content_type:'article',focus_hint:'applied_genai_knowledge_workers'},
    {source_id:'stale',headline:'Enterprise workplace AI productivity release for business users',canonical_url:'https://example.com/stale',published_at:'2026-09-25T02:59:59Z',source_reliability:'publisher_authored',content_type:'article',focus_hint:'applied_genai_knowledge_workers'}
  ]}));
  execFileSync(process.execPath,['_tools/under80-metadata-gate.mjs','--input',input,'--out',out,'--limit','20','--cutoff','2026-09-28T03:00:00Z','--article-freshness-policy','article-24-72-skills168-v1','--ordinary-max-age-hours','72'],{cwd:process.cwd()});
  const result=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(result.candidates.some(x=>x.canonical_url==='https://example.com/boundary'),true);
  assert.equal(result.candidates.some(x=>x.canonical_url==='https://example.com/stale'),false);
  assert.equal(result.rejected.outside_window,1);
});

test('Q14 hardening adds recurring first-party Copilot catalogs instead of only dated pins',()=>{
  const p=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
  for(const id of ['microsoft-copilot-product-catalog','microsoft-copilot-agentic-ai-catalog']){
    const s=p.sources.find(x=>x.source_id===id);
    assert.ok(s,id);
    assert.equal(s.status,'active');
    assert.equal(s.evidence_class,'publisher_authored');
    assert.equal(s.q14_hardening,true);
    assert.ok(/^https:\/\/www\.microsoft\.com\/en-us\/copilot\/blog\//.test(s.discovery_endpoint));
    assert.equal(s.pinned_candidate,undefined);
  }
});
