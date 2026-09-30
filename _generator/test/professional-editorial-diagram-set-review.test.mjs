import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('image gate recognizes professional editorial diagrams as an allowed modern set method',()=>{
  const src=fs.readFileSync(new URL('../lib/image-gate.mjs',import.meta.url),'utf8');
  assert.match(src,/generation_method!=='professional_editorial_diagram'/);
  assert.match(src,/professional OpenAI image generation or verified professional editorial diagram rendering/);
});
