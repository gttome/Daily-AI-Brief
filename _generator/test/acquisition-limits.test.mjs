import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_RESPONSE_BYTES,MAX_NORMALIZED_BODY_CHARS,readBoundedText,retrieveSource,sanitizeRetrievedText} from '../../_tools/discovery-links.mjs';

test('acquisition limits are explicit and below the aggregate normal retrieval budget',()=>{
 assert.equal(MAX_RESPONSE_BYTES,1500000);
 assert.equal(MAX_NORMALIZED_BODY_CHARS,500000);
});

test('UTF-8 sanitation removes unsafe controls without changing useful Unicode text',()=>{
 assert.equal(sanitizeRetrievedText('AI\u0000 café\u0007 workflow'),'AI café workflow');
});

test('bounded reader rejects declared oversized responses before reading the body',async()=>{
 const response=new Response('small',{headers:{'content-length':String(MAX_RESPONSE_BYTES+1)}});
 await assert.rejects(readBoundedText(response),/response_too_large/);
});

test('bounded reader rejects streamed bytes beyond the hard response ceiling',async()=>{
 const bytes=new Uint8Array(64).fill(65);
 const response=new Response(new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}}));
 await assert.rejects(readBoundedText(response,{maxResponseBytes:32,maxNormalizedChars:100}),/response_too_large/);
});

test('bounded reader rejects normalized source bodies beyond the per-source character ceiling',async()=>{
 const response=new Response('abcdefghij');
 await assert.rejects(readBoundedText(response,{maxResponseBytes:100,maxNormalizedChars:5}),/normalized_body_too_large/);
});

test('retrieveSource records bounded acquisition measurements and does not retry deterministic size failures',async()=>{
 let calls=0;
 const result=await retrieveSource('https://example.org/feed',{fetcher:async()=>{calls++;return new Response('<rss><item>ok</item></rss>',{status:200,headers:{etag:'"v1"'}});}});
 assert.equal(calls,1);assert.equal(result.etag,'"v1"');assert.ok(result.response_bytes>0);assert.equal(result.normalized_chars,result.text.length);
 calls=0;
 await assert.rejects(retrieveSource('https://example.org/huge',{maxResponseBytes:5,fetcher:async()=>{calls++;return new Response('0123456789',{status:200});}}),/response_too_large/);
 assert.equal(calls,1);
});
