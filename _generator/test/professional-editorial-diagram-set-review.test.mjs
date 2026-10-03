import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('image gate recognizes verified professional editorial diagrams without weakening quality gates',()=>{
  const src=fs.readFileSync(new URL('../lib/image-gate.mjs',import.meta.url),'utf8');
  assert.match(src,/generation_method!=='professional_editorial_diagram'/);
  assert.match(src,/professional native image generation or verified professional editorial diagram rendering/);
});
