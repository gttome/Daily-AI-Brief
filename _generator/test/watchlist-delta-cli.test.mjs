import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=path.resolve(new URL('../..',import.meta.url).pathname);

test('Watchlist delta CLI emits carried-only receipt for identical evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dab-watchlist-delta-'));
 const prior=path.join(dir,'prior.json'),next=path.join(dir,'next.json'),out=path.join(dir,'out.json');
 const watchlist={schema_version:'1.0.0',edition_date:'2026-09-18',topics:[{topic_id:'topic-a',summary:'Keep this semantic text',evidence:[{title:'Primary evidence',url:'https://example.org/a',publisher:'Example',kind:'primary',publication_date:'2026-09-18',checked_at:'2026-09-18T12:00:00Z'}]}]};
 fs.writeFileSync(prior,JSON.stringify(watchlist));
 const nextWatchlist=structuredClone(watchlist);nextWatchlist.topics[0].evidence[0].checked_at='2026-09-18T13:00:00Z';
 fs.writeFileSync(next,JSON.stringify(nextWatchlist));
 const result=spawnSync(process.execPath,['_tools/watchlist-delta-plan.mjs','--prior',prior,'--next',next,'--out',out],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const receipt=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.deepEqual(receipt.carried_topics,['topic-a']);
 assert.deepEqual(receipt.changed_topics,[]);
 assert.deepEqual(receipt.normal_semantic_input_topic_ids,[]);
 assert.equal(receipt.model_calls,0);
});
