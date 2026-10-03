import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('_tools/dispatch-frozen-publication.mjs','utf8');

test('frozen publication workflow dispatches are repository-explicit',()=>{
  for(const workflow of ['publish-candidate.yml','daily-delta-validation.yml']){
    const marker=`gh(['workflow','run','${workflow}','-R',repo`;
    assert.ok(
      source.includes(marker),
      `${workflow} dispatch must pass -R repo because the Supervisor runs from a non-repository workspace root`
    );
  }
});
