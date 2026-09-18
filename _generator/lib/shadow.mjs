import fs from 'node:fs';
import path from 'node:path';
import {importLegacyFile, semanticEditionView} from './import-legacy.mjs';
import {deepEqualJson, sha256} from './util.mjs';
import {validateEdition} from './validate.mjs';
import {renderDated,renderLatest,renderIndex} from './render.mjs';

export function runShadowCheck(repoRoot, date, sourceCommit = null) {
  const checks = [];
  const errors = [];
  const locations = [
    {name: 'dated', path: path.join(repoRoot, 'briefs', `${date}.md`)},
    {name: 'latest', path: path.join(repoRoot, 'latest.md')},
    {name: 'homepage', path: path.join(repoRoot, 'index.md')}
  ];
  const editions = {};
  const canonicalPath=path.join(repoRoot,'_data','editions',`${date}.json`);
  const modern=date>='2026-09-18'&&fs.existsSync(canonicalPath)?JSON.parse(fs.readFileSync(canonicalPath,'utf8')):null;
  const renderers={dated:renderDated,latest:renderLatest,homepage:renderIndex};
  for (const location of locations) {
    if (!fs.existsSync(location.path)) {
      errors.push(`${location.name} file is missing`);
      checks.push({check_id: `${location.name}_present`, result: 'fail', evidence: location.path});
      continue;
    }
    try {
      // New reader order and podcast collections are native canonical formats.
      // Compare actual complete reader output, rather than adapting it as legacy.
      editions[location.name] = modern||importLegacyFile(location.path, repoRoot, sourceCommit);
      const validation = validateEdition(editions[location.name]);
      if(modern){
        const actual=fs.readFileSync(location.path,'utf8');
        const expected=renderers[location.name](modern);
        if(actual.trimEnd()!==expected.trimEnd())validation.push('reader output differs from canonical rendering');
      }
      checks.push({check_id: `${location.name}_canonical_import`, result: validation.length ? 'fail' : 'pass', evidence: validation.length ? validation.join('; ') : 'Imported and validated.'});
      errors.push(...validation.map(item => `${location.name}: ${item}`));
    } catch (error) {
      errors.push(`${location.name}: ${error.message}`);
      checks.push({check_id: `${location.name}_canonical_import`, result: 'fail', evidence: error.message});
    }
  }
  if (editions.dated) {
    for (const name of ['latest', 'homepage']) {
      if (!editions[name]) continue;
      const equal = deepEqualJson(semanticEditionView(editions.dated), semanticEditionView(editions[name]));
      checks.push({check_id: `${name}_semantic_parity`, result: equal ? 'pass' : 'fail', evidence: equal ? 'Canonical semantic views match.' : 'Canonical semantic views differ.'});
      if (!equal) errors.push(`${name} differs semantically from dated brief`);
    }
    for (const story of editions.dated.stories) {
      const exists = fs.existsSync(path.join(repoRoot, story.image.path));
      checks.push({check_id: `image_${story.ordinal}_present`, result: exists ? 'pass' : 'fail', evidence: story.image.path});
      if (!exists) errors.push(`missing image ${story.image.path}`);
    }
    const archive = fs.readFileSync(path.join(repoRoot, 'archive.md'), 'utf8');
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    for (const [name, present] of [['archive', archive.includes(`/briefs/${date}/`)], ['readme', readme.includes(`briefs/${date}.md`)]]) {
      checks.push({check_id: `${name}_entry`, result: present ? 'pass' : 'fail', evidence: present ? `${date} present once or more.` : `${date} missing.`});
      if (!present) errors.push(`${name} is missing ${date}`);
    }
  }
  const result = errors.length ? 'fail' : 'pass';
  return {
    schema_version: '1.0.0',
    shadow_program: 'iteration-1-publication-reliability',
    date,
    source_commit: sourceCommit,
    executed_at: new Date().toISOString(),
    result,
    checks,
    errors,
    semantic_digest: editions.dated ? `sha256:${sha256(JSON.stringify(semanticEditionView(editions.dated)))}` : null
  };
}
