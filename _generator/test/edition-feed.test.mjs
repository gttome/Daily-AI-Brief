import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {editionFeed} from '../lib/edition-feed.mjs';
test('daily RSS keeps one permanent identity per edition and includes the next staged edition',()=>{
 const root=new URL('../../',import.meta.url).pathname;
 const existing=fs.readdirSync(root+'briefs').filter(n=>/^\d{4}-\d{2}-\d{2}\.md$/.test(n));
 const output=editionFeed(root,'2026-09-12');
 const ids=[...output.matchAll(/<guid isPermaLink="true">([^<]+)<\/guid>/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set([...existing.map(n=>n.slice(0,10)),'2026-09-12']).size);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal(ids[0],'https://gttome.github.io/Daily-AI-Brief/briefs/2026-09-12/');
 assert.ok(output.includes('Latest brief'));assert.ok(output.includes('Browse archive'));
});
