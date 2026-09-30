import test from 'node:test';
import assert from 'node:assert/strict';
import {watchlistDeltaPlan,topicEvidenceHashes} from '../lib/watchlist-delta.mjs';

const base={topic_id:'topic-a',summary:'Prior semantic summary',evidence:[{title:'Evidence',url:'https://example.org/item?utm_source=x',publisher:'Example',kind:'primary',publication_date:'2026-09-17',checked_at:'2026-09-17T10:00:00Z',review_depth:'full'}]};

test('observation timestamp changes do not trigger semantic Watchlist refresh',()=>{
 const next=structuredClone(base);next.evidence[0].checked_at='2026-09-18T10:00:00Z';
 const plan=watchlistDeltaPlan([base],[next]);
 assert.deepEqual(plan.carried_topics,['topic-a']);assert.deepEqual(plan.changed_topics,[]);assert.deepEqual(plan.normal_semantic_input_topic_ids,[]);
 assert.equal(topicEvidenceHashes(base).evidence_hash,topicEvidenceHashes(next).evidence_hash);
});

test('material evidence/source change scopes semantic refresh to changed topic only',()=>{
 const unchanged=structuredClone(base);const changed={...structuredClone(base),topic_id:'topic-b',evidence:[...base.evidence,{title:'New independent evidence',url:'https://other.example/new',publisher:'Other',kind:'primary',publication_date:'2026-09-18'}]};
 const priorB={...structuredClone(base),topic_id:'topic-b'};
 const plan=watchlistDeltaPlan([base,priorB],[unchanged,changed]);
 assert.deepEqual(plan.carried_topics,['topic-a']);assert.deepEqual(plan.changed_topics,['topic-b']);assert.deepEqual(plan.normal_semantic_input_topic_ids,['topic-b']);
});
