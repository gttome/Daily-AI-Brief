import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const registry=JSON.parse(fs.readFileSync('_data/early-signal-sources.json','utf8'));

test('early-signal registry has ten ranked channels for both products',()=>{
  assert.equal(registry.channels.length,10);
  assert.deepEqual(registry.channels.map(channel=>channel.rank),[1,2,3,4,5,6,7,8,9,10]);
  for(const channel of registry.channels){
    assert.ok(channel.targets.includes('brief'),channel.channel_id);
    assert.ok(channel.targets.includes('watchlist'),channel.channel_id);
    assert.match(channel.entry_url,/^https:\/\//);
  }
});

test('source identifiers and endpoint URLs are unique and public',()=>{
  const channelIds=registry.channels.map(channel=>channel.channel_id);
  const endpoints=registry.channels.flatMap(channel=>channel.endpoints);
  assert.equal(new Set(channelIds).size,channelIds.length);
  assert.equal(new Set(endpoints.map(endpoint=>endpoint.source_id)).size,endpoints.length);
  for(const endpoint of endpoints)assert.match(endpoint.url,/^https:\/\//);
});

test('restricted communities stay assisted-review discovery signals',()=>{
  for(const id of ['x-research-feeds','specialized-discords']){
    const channel=registry.channels.find(item=>item.channel_id===id);
    assert.equal(channel.automation_mode,'assisted_review');
    assert.match(channel.evidence_treatment,/Discovery signal only/i);
  }
});

test('public source directory and watchlist explain primary-source precedence',()=>{
  assert.deepEqual(JSON.parse(fs.readFileSync('data/early-signal-sources.json','utf8')),registry);
  const page=fs.readFileSync('sources.md','utf8');
  const watchlist=fs.readFileSync('watchlist/index.md','utf8');
  assert.match(page,/Daily AI Brief and Emerging AI Watch prioritize primary-origin sources/);
  assert.match(page,/1\. arXiv/);
  assert.match(page,/10\. AI conference sites and OpenReview/);
  assert.match(watchlist,/ranked primary-origin and early-signal sources/);
});
