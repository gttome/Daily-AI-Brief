import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {expandEditorialKernel} from '../lib/editorial-kernel.mjs';
import {validateEdition} from '../lib/validate.mjs';

const baseline='1df531897edb50406b1d4bf2cf8089f69a797a92';
const focuses=['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'];
const kernel={
  schema_version:'1.0.0',
  brief_date:'2026-09-18',
  edition_id:'dab-edition-2026-09-18',
  baseline_sha:baseline,
  normal_model_passes:1,
  normal_post_editorial_model_passes:0,
  editorial_takeaway:'Synthetic contract fixture proving that a correctly prepared approved-kernel shape can hand off to deterministic expansion without fabricating editorial approval.',
  stories:focuses.map((focus,i)=>({
    canonical_ordinal:i+1,
    story_id:`semantic-story-${i+1}`,
    candidate_id:`prospective-candidate-${i+1}`,
    focus,
    headline:`Synthetic prospective contract story ${i+1}${i===4?' Agent Skills':''}`,
    summary:'Synthetic contract-only summary long enough to exercise deterministic expansion and structural validation without asserting a real development.',
    why_it_matters:'Synthetic contract-only rationale used to verify matching supporting-record bindings and deterministic publication identities.',
    what_to_do_now:{action:'test',label:'Verify the deterministic handoff',rationale:'Use synthetic records only to test the contract boundary; do not treat this fixture as research, approval, or publishable evidence.'},
    topic_labels:i===4?['Agent Skills','contract-test']:['contract-test'],
    editorial_limitation:'Synthetic contract fixture only; not approved editorial content, research evidence, media evidence, or an image approval.',
    source_url:`https://example.org/prospective-${i+1}`,
    agent_skill:i===4,
    visual:{layout:'contract-test',mechanism:'Synthetic placeholder semantics only; no image approval is asserted.'}
  })),
  media_decisions:{videos:{target:2},podcasts:{target:2}},
  changed_watchlist_topics:[]
};

function supportingRecords(){
  const candidateFacts={},imageAssets={};
  for(let i=0;i<6;i++){
    const id=`prospective-candidate-${i+1}`;
    candidateFacts[id]={
      event_date:'2026-09-18',
      companies:[],
      source:{title:`Synthetic source ${i+1}`,organization:'Synthetic contract fixture',url:`https://example.org/prospective-${i+1}`,publication_date:'2026-09-18',evidence_type:'official_documentation',availability_status:'general_availability'},
      freshness:{tier:'primary',source_published_at:'2026-09-18T10:00:00Z'},
      novelty:{disposition:'new',prior_story_ids:[],what_changed:null},
      candidate_score:{significance:1,freshness:1,authority:1,evidence_quality:1,novelty:1,practical_value:1,category_fit:1,total:7,selection_rationale:'Synthetic contract score only.'},
      selection_rationale:'Synthetic contract fixture selected only to exercise deterministic binding.'
    };
    imageAssets[id]={path:`briefs/images/2026-09-18/0${i+1}-synthetic-contract.png`,alt:`Synthetic contract-only image manifest entry ${i+1}; no image approval is asserted.`,width:1200,height:630,kind:'editorial_explainer',cache_key:'synthetic-contract'};
  }
  return {candidateFacts,imageAssets};
}

const media={
  worth_watching:{
    general:{status:'empty',exception:'No video met today’s editorial quality standards.'},
    agents_non_technical_people:{status:'empty',exception:'No video met today’s editorial quality standards.'}
  },
  podcasts:[]
};

test('prospective synthetic kernel expands with correctly matching supporting records up to the approval-gated publication boundary',()=>{
  const {candidateFacts,imageAssets}=supportingRecords();
  const edition=expandEditorialKernel(kernel,{candidateFacts,imageAssets,media,publishedAt:'2026-09-18T12:00:00Z',coveragePeriod:'Rolling 24-hour primary window ending September 18, 2026 at 07:00 America/Chicago.'});
  assert.deepEqual(validateEdition(edition),[]);
  assert.equal(edition.provenance.source_commit,baseline);
  assert.equal(edition.stories.length,6);
  for(let i=0;i<6;i++){
    assert.match(edition.stories[i].story_id,/^dab-story-2026-09-18-[0-9a-f]{8}$/);
    assert.equal(edition.stories[i].source.normalized_url,`https://example.org/prospective-${i+1}`);
    assert.equal(edition.stories[i].image.path,`briefs/images/2026-09-18/0${i+1}-synthetic-contract.png`);
  }
  // Intentionally do not call buildPublicationStage: real image approval and fresh media/preflight evidence are required there.
});

test('prospective deterministic expansion rejects mismatched or missing supporting records',()=>{
  const {candidateFacts,imageAssets}=supportingRecords();
  const mismatched=structuredClone(candidateFacts);
  mismatched['prospective-candidate-2'].source.url='https://example.org/wrong-source';
  assert.throws(()=>expandEditorialKernel(kernel,{candidateFacts:mismatched,imageAssets,media,publishedAt:'2026-09-18T12:00:00Z',coveragePeriod:'Rolling 24-hour primary window ending September 18, 2026 at 07:00 America/Chicago.'}),/Kernel source does not match reviewed candidate evidence: prospective-candidate-2/);
  const missing=structuredClone(candidateFacts);
  delete missing['prospective-candidate-3'];
  assert.throws(()=>expandEditorialKernel(kernel,{candidateFacts:missing,imageAssets,media,publishedAt:'2026-09-18T12:00:00Z',coveragePeriod:'Rolling 24-hour primary window ending September 18, 2026 at 07:00 America/Chicago.'}),/Missing deterministic evidence or image asset for prospective-candidate-3/);
});

test('post-editorial workflow binds the kernel baseline to freshly resolved origin/main before expansion',()=>{
  const workflow=fs.readFileSync('.github/workflows/post-editorial-kernel.yml','utf8');
  assert.match(workflow,/git fetch --no-tags origin main/);
  assert.match(workflow,/baseline="\$\(git rev-parse origin\/main\)"/);
  assert.match(workflow,/kernel_baseline=.*baseline_sha/);
  assert.match(workflow,/if \[ "\$kernel_baseline" != "\$baseline" \]; then/);
  assert.match(workflow,/Editorial kernel baseline does not match trusted origin\/main\./);
});
