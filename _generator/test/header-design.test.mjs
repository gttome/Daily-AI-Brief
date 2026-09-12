import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const layout=fs.readFileSync('_layouts/default.html','utf8');
const css=fs.readFileSync('assets/css/header.css','utf8');
const about=fs.readFileSync('about.md','utf8');

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

test('Research Ledger replaces Cayman green headings with Editorial Rust',()=>{
  assert.match(css,/\.main-content h1,[\s\S]*?\.main-content h6 \{\s*color: #8b432d;/);
});

test('About page uses the complete Daily Generative AI Brief name',()=>{
  assert.match(about,/^title: About the Daily Generative AI Brief$/m);
  assert.match(about,/The Daily Generative AI Brief helps knowledge workers/);
  assert.match(about,/The Daily Generative AI Brief is designed to improve gradually over time/);
  assert.doesNotMatch(about,/The Daily AI Brief/);
});
