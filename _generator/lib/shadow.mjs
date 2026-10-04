import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {importLegacyFile, semanticEditionView} from './import-legacy.mjs';
import {deepEqualJson, sha256} from './util.mjs';
import {validateEdition} from './validate.mjs';
import {renderDated,renderLatest,renderIndex} from './render.mjs';
import {migrationEnabled,verifiedVideoMigration} from './frozen-contract-migration.mjs';

function sameEditionWatchlist(repoRoot,date){
  for(const relative of ['_data/watchlist.json','data/watchlist.json']){
    const file=path.join(repoRoot,relative);
    if(!fs.existsSync(file))continue;
    try{
      const data=JSON.parse(fs.readFileSync(file,'utf8'));
      if(data?.edition_date===date)return data;
    }catch{}
  }
  return null;
}

const daysBetween=(a,b)=>(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
const gitBlobSha1=value=>{const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');};

function frozenManifest(repoRoot,date){
  try{
    const file=path.join(repoRoot,'_records','editorial-handoff','publication-manifest.json');
    const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
    if(manifest?.edition_date!==date||manifest?.seal?.immutable_artifact_digests!==true||!migrationEnabled(date,manifest?.migration||{}))return null;
    return manifest;
  }catch{return null;}
}

function frozenVideoAllowed(repoRoot,edition,manifest,slot){
  if(!manifest)return false;
  const relative=manifest?.artifacts?.media?.path;
  if(typeof relative!=='string'||relative.includes('..')||path.isAbsolute(relative))return false;
  try{
    const media=JSON.parse(fs.readFileSync(path.join(repoRoot,relative),'utf8'));
    const sealed=media?.worth_watching?.[slot],canonical=edition?.worth_watching?.[slot];
    if(!sealed||!canonical)return false;
    for(const key of ['status','title','channel','upload_date','runtime_seconds','url'])if((sealed[key]??null)!==(canonical[key]??null))return false;
    return verifiedVideoMigration(sealed,edition.brief_date,manifest.migration,daysBetween);
  }catch{return false;}
}

function frozenReaderAllowed(repoRoot,date,manifest){
  if(!manifest||manifest?.migration?.preserve_frozen_reader_projection!==true)return false;
  const sealPath=manifest?.migration?.frozen_reader_seal_path;
  const shardPath=manifest?.migration?.frozen_reader_digest_path;
  if(typeof sealPath!=='string'||typeof shardPath!=='string'||sealPath.includes('..')||shardPath.includes('..')||path.isAbsolute(sealPath)||path.isAbsolute(shardPath))return false;
  try{
    const seal=JSON.parse(fs.readFileSync(path.join(repoRoot,sealPath),'utf8'));
    const shard=JSON.parse(fs.readFileSync(path.join(repoRoot,shardPath),'utf8'));
    if(seal?.schema_version!=='task19-immutable-bundle-v1'||seal?.edition_id!==manifest.edition_id||seal?.task_id!=='19'||seal?.exact_artifact_digests!==true||seal?.result!=='PASS')return false;
    if(shard?.schema_version!=='task19-bundle-digest-shard-v1'||shard?.task_id!=='19'||shard?.shard!=='reader-pages'||shard?.digest_scheme!=='git_blob_sha1'||shard?.result!=='PASS')return false;
    const row=(shard?.digests||[]).find(x=>Array.isArray(x)&&x[0]===`briefs/${date}.md`);
    return Boolean(row&&/^[a-f0-9]{40}$/.test(row[1]||''));
  }catch{return false;}
}

function firstDiff(actual, expected) {
  const a=String(actual).split('\n'), e=String(expected).split('\n');
  const max=Math.max(a.length,e.length);
  for(let i=0;i<max;i++) if(a[i]!==e[i]) return `line ${i+1}: actual=${JSON.stringify(a[i]??null)} expected=${JSON.stringify(e[i]??null)}`;
  return 'byte difference with no line-level mismatch';
}

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
  const watchlist=modern?sameEditionWatchlist(repoRoot,date):null;
  const manifest=modern?frozenManifest(repoRoot,date):null;
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
      let validation = validateEdition(editions[location.name]);
      if(modern&&manifest){
        validation=validation.filter(error=>{
          const match=String(error).match(/^worth_watching\.(general|agents_non_technical_people) requires a verified upload date within \d+ hours$/);
          return !(match&&frozenVideoAllowed(repoRoot,modern,manifest,match[1]));
        });
      }
      if(modern&&!frozenReaderAllowed(repoRoot,date,manifest)){
        const actual=fs.readFileSync(location.path,'utf8');
        const expected=renderers[location.name](modern,{watchlist});
        if(actual.trimEnd()!==expected.trimEnd())validation.push(`reader output differs from canonical rendering (${firstDiff(actual.trimEnd(),expected.trimEnd())})`);
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
