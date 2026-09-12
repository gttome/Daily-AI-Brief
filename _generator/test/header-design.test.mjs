import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const layout=fs.readFileSync('_layouts/default.html','utf8');
const css=fs.readFileSync('assets/css/header.css','utf8');

test('Research Ledger header replaces the basic button masthead',()=>{
  assert.match(layout,/page-header research-ledger-header/);
  assert.match(layout,/class="ledger-navigation"/);
  assert.match(layout,/class="ledger-title-block"/);
  assert.match(layout,/class="ledger-edition"/);
  assert.match(layout,/Independent curation · Primary-source evidence/);
  assert.doesNotMatch(layout,/<header[^>]*>[\s\S]*?class="btn"[\s\S]*?<\/header>/);
});

test('Research Ledger preserves all seven navigation destinations',()=>{
  const header=layout.match(/<header class="page-header research-ledger-header"[\s\S]*?<\/header>/)?.[0]||'';
  for(const label of ['Home','Briefs Archive','Subscribe','Emerging AI Watchlist','Sources','About This Brief'])assert.match(header,new RegExp(`>${label}<`));
  assert.match(header,/>{{ site\.series_name }}<\/a>/);
  assert.match(header,/target="_blank" rel="noopener noreferrer"/);
});

test('Research Ledger remains responsive and keyboard visible',()=>{
  assert.match(css,/@media screen and \(max-width: 48rem\)/);
  assert.match(css,/\.ledger-primary-nav a:focus-visible/);
  assert.match(css,/grid-template-columns: 1fr/);
  assert.match(css,/font-family: Georgia/);
});
