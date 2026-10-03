import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('current unattended production instructions are generic and prior-evening scheduled',()=>{
  const startup=fs.readFileSync('docs/operations/DAILY-UNATTENDED-STARTUP.md','utf8');
  assert.doesNotMatch(startup,/\bRun\s+\d+\b|\brun\d+\b|reliable-edition-\d/i);
  assert.match(startup,/19:00 America\/Chicago/);
  assert.match(startup,/next America\/Chicago calendar day/);
  assert.match(startup,/never reopen a prior terminal execution/i);
  assert.match(startup,/observability only/i);
});

test('current instruction entry points reject Work and Codex as production modes',()=>{
  const startup=fs.readFileSync('docs/operations/DAILY-UNATTENDED-STARTUP.md','utf8');
  const watchlist=fs.readFileSync('docs/operations/watchlist-runbook.md','utf8');
  assert.match(startup,/no ChatGPT Work, no Codex/i);
  assert.match(watchlist,/Do not use ChatGPT Work, Codex/i);
  assert.doesNotMatch(watchlist,/Plus Work\/Codex allowance/i);
});
