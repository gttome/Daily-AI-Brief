import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('live validator accepts the dated editorial image manifest before legacy aliases',()=>{
  const source=fs.readFileSync('_tools/daily-validation.mjs','utf8');
  assert.match(source,/images-\$\{date\}\.json/);
  const dated=source.indexOf("images-${date}.json");
  const legacy=source.indexOf("images.json");
  assert.ok(dated>=0&&legacy>dated);
});

test('Run 4 finalizer reads and validates the same run working tree after durable projections',()=>{
  const workflow=fs.readFileSync('.github/workflows/run4-finalizer.yml','utf8');
  const finalizer=fs.readFileSync('_tools/run4-finalizer.mjs','utf8');
  assert.match(workflow,/node run\/_tools\/run4-finalizer\.mjs run/);
  assert.doesNotMatch(finalizer,/^import \{generatedFiles\}/m);
  assert.doesNotMatch(finalizer,/^import \{validateIntegratedRepository\}/m);
  const books=finalizer.indexOf("write('_data/book-reading.json',books)");
  const renderer=finalizer.indexOf("await import('../_generator/lib/render.mjs')");
  const integrity=finalizer.indexOf("await import('../_generator/lib/integrity.mjs')");
  assert.ok(books>=0&&renderer>books&&integrity>books);
});

test('Run 4 closeout preserves the original production SHA and forbids content rework',()=>{
  const source=fs.readFileSync('_tools/run4-closeout.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/run4-closeout.yml','utf8');
  assert.match(source,/ce3dac9d75949f381821dfd34163048bf08c65d6/);
  assert.match(source,/ca3702a4b3e276456402257305fe39c3ec82b002/);
  assert.match(source,/state:'PUBLIC_CLOSED'/);
  assert.match(source,/next_run_ready:true/);
  assert.match(workflow,/Prohibit content or asset rework during closeout/);
  assert.match(workflow,/daily-validation\.mjs/);
  assert.match(workflow,/createWorkflowDispatch/);
  assert.match(workflow,/Protected finalization CI/);
  assert.doesNotMatch(source,/renderDated\(|generatedFiles\(|image_gen|text2im/);
});

test('closeout records Command Center reconciliation as repository projection without inventing owner mutation',()=>{
  const source=fs.readFileSync('_tools/run4-closeout.mjs','utf8');
  assert.match(source,/repository_authoritative_projection/);
  assert.match(source,/live_owner_state_mutation:'not_configured'/);
  assert.match(source,/mutation_permitted:false/);
});

test('Run 4 closeout executable passes Node syntax validation',()=>{
  execFileSync(process.execPath,['--check','_tools/run4-closeout.mjs'],{stdio:'pipe'});
});
