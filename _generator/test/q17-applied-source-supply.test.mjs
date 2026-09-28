import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('Q17 recurring Applied source is first-party, active, and does not weaken qualification gates',()=>{
  const p=JSON.parse(fs.readFileSync('_data/preflight-source-plan.json','utf8'));
  const s=p.sources.find(x=>x.source_id==='microsoft-copilot-studio-feature-releases-applied');
  assert.ok(s);
  assert.equal(s.status,'active');
  assert.equal(s.evidence_class,'publisher_authored');
  assert.equal(s.focus_hint,'applied_genai_knowledge_workers');
  assert.equal(s.q17_hardening,true);
  assert.equal(s.pinned_candidate,undefined);
  assert.equal(s.discovery_endpoint,'https://www.microsoft.com/en-us/copilot/blog/copilot-studio/content-type/feature-releases/');
});
