import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {evaluateShadowGate} from '../lib/shadow-gate.mjs';

function record(root, date, result = 'pass', suffix = '1') {
  const directory = path.join(root, date);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, `${suffix}.json`), JSON.stringify({date, result, executed_at: `${date}T12:40:00Z`}), 'utf8');
}

test('shadow gate requires seven consecutive passing dates', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dab-shadow-'));
  for (let day = 1; day <= 7; day += 1) record(root, `2026-09-${String(day).padStart(2, '0')}`);
  const gate = evaluateShadowGate(root, 7);
  assert.equal(gate.result, 'PASS');
  assert.equal(gate.consecutive_passes, 7);
});

test('failed date breaks the consecutive sequence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dab-shadow-'));
  for (let day = 1; day <= 7; day += 1) record(root, `2026-09-${String(day).padStart(2, '0')}`, day === 4 ? 'fail' : 'pass');
  const gate = evaluateShadowGate(root, 7);
  assert.equal(gate.result, 'PENDING');
  assert.equal(gate.consecutive_passes, 3);
});
