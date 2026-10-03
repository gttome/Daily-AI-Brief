import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('full public rehearsal landing pages preserve the complete reader-facing Brief', () => {
  const root = path.resolve('rehearsals');
  if (!fs.existsSync(root)) return;

  const indexes = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(root, entry.name, 'index.md'))
    .filter(file => fs.existsSync(file));

  assert.ok(indexes.length > 0, 'expected at least one rehearsal landing page');

  for (const file of indexes) {
    const body = fs.readFileSync(file, 'utf8');
    const count = pattern => (body.match(pattern) || []).length;

    assert.match(body, /reader_release:\s*true/, `${file}: reader-release styling/behavior is required`);
    assert.ok(count(/\/images\//g) >= 6, `${file}: six story images must be visible on the landing Brief`);
    assert.ok(count(/\*\*Summary:\*\*/g) >= 6, `${file}: six story summaries must be visible`);
    assert.ok(count(/\*\*Why it matters:\*\*/g) >= 6, `${file}: six Why-it-matters sections must be visible`);
    assert.ok(count(/class="book-bridge"/g) >= 6, `${file}: every story needs a reader-facing book bridge`);
    assert.ok(count(/\/media\//g) >= 4, `${file}: all four media permanent pages must be linked`);

    for (const heading of ['### New today', '### Updated today', '### Carried forward', '### Archived / dropped recently']) {
      assert.ok(body.includes(heading), `${file}: Watchlist section missing ${heading}`);
    }
  }
});
