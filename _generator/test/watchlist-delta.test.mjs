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

test('Watchlist topics cannot disappear without a reader-visible archive reason',()=>{
 const named={...structuredClone(base),name:'Topic A'};
 assert.throws(()=>watchlistDeltaPlan([named],[]),/watchlist_removed_without_archive_reason:topic-a/);
 const archived={...named,archive_reason:'Merged into a broader mechanism after review.'};
 const plan=watchlistDeltaPlan([archived],[]);
 assert.deepEqual(plan.removed_topics,['topic-a']);
 assert.deepEqual(plan.removed_topic_details,[{topic_id:'topic-a',name:'Topic A',reason:'Merged into a broader mechanism after review.'}]);
});
