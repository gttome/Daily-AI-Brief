import test from 'node:test';
import assert from 'node:assert/strict';
import {publisherFeedUrl} from '../../_tools/publisher-feed-url.mjs';
import {extractCandidateMetadata,compactDiscoveryHtml} from '../../_tools/discovery-links.mjs';
const base='http://feeds.feedburner.com/GoogleAppsUpdates';
const source={discovery_endpoint:'https://workspaceupdates.googleblog.com/atom.xml',source_id:'google-workspace-feed',owner:'Google Workspace',format:'atom',evidence_class:'publisher_authored'};
const article='http://workspaceupdates.googleblog.com/2026/09/agent-workflows.html';
test('restores HTTPS article identity from redirected same-publisher feed',()=>{assert.equal(publisherFeedUrl(article,base,source).href,article.replace('http:','https:'));});
test('preserves existing HTTPS behavior',()=>{assert.equal(publisherFeedUrl('https://example.com/a',base,{}).href,'https://example.com/a');});
test('does not upgrade cross-host HTTP or lookalike domains',()=>{for(const raw of ['http://evil.example/a','http://workspaceupdates.googleblog.com.evil.example/a'])assert.equal(publisherFeedUrl(raw,base,source),null);});
test('does not accept credentials, nondefault ports or non-HTTPS registration',()=>{for(const raw of ['http://u:p@workspaceupdates.googleblog.com/a','http://workspaceupdates.googleblog.com:8080/a','https://u:p@workspaceupdates.googleblog.com/a'])assert.equal(publisherFeedUrl(raw,base,source),null);assert.equal(publisherFeedUrl(article,base,{discovery_endpoint:'http://workspaceupdates.googleblog.com/atom.xml'}),null);});
test('missing or unsafe source identity stays rejected',()=>{assert.equal(publisherFeedUrl(article,base,{}),null);assert.equal(publisherFeedUrl(article,base,{discovery_endpoint:'https://u:p@workspaceupdates.googleblog.com/atom.xml'}),null);});
test('rejects non-web schemes and malformed inputs',()=>{for(const raw of ['file:///tmp/a','javascript:alert(1)','ftp://workspaceupdates.googleblog.com/a','http://['])assert.equal(publisherFeedUrl(raw,base,source),null);});
const atom=`<feed><entry><title>Gemini agent workflows for knowledge workers</title><published>2026-09-28T12:00:00Z</published><link rel="alternate" type="text/html" href="${article}"/><summary>Publisher workflow update.</summary></entry></feed>`;
test('Atom recovery preserves publisher date and works after compaction',()=>{
 for(const body of [atom,compactDiscoveryHtml(atom)]){
  const items=extractCandidateMetadata(body,base,source);
  assert.equal(items.length,1);
  assert.equal(items[0].canonical_url,article.replace('http:','https:'));
  assert.equal(items[0].published_at,'2026-09-28T12:00:00.000Z');
  assert.equal(items[0].source_id,'google-workspace-feed');
 }
 assert.equal(extractCandidateMetadata(atom,base,{}).length,0);
});
test('RSS recovery preserves publication date without creating new facts',()=>{
 const rss=`<rss><channel><item><title>Gemini agent workflows for knowledge workers</title><link>${article}</link><pubDate>Mon, 28 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
 const items=extractCandidateMetadata(rss,base,{...source,format:'rss'});
 assert.equal(items.length,1);assert.equal(items[0].published_at,'2026-09-28T12:00:00.000Z');
});
test('feed parser still refuses unrelated insecure article origins',()=>{
 assert.equal(extractCandidateMetadata(atom.replace(article,'http://evil.example/story'),base,source).length,0);
});
