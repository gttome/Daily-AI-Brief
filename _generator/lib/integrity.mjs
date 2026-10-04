import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {reviewedHandoffImages,reviewedImages} from './image-gate.mjs';
import path from 'node:path';
import {auditEditionAccessibility} from './accessibility.mjs';
import {validateFeeds} from './reader.mjs';
import {generatedFiles} from './render.mjs';
import {validateEdition} from './validate.mjs';
import {validateEditorialLearning, validatePersonalFeedback} from './personal-learning.mjs';
import {editionPodcasts} from './podcasts.mjs';


const FROZEN_INTEGRATION_CUTOFF='2026-10-04';
const gitBlobSha1=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const safeRelative=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!p.split(/[\\/]+/).includes('..');

function frozenPublicationMigration(edition,repoRoot){
  if(!edition?.brief_date||edition.brief_date>FROZEN_INTEGRATION_CUTOFF)return null;
  const manifestPath=path.join(repoRoot,'_records','editorial-handoff','publication-manifest.json');
  if(!fs.existsSync(manifestPath))return null;
  try{
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    return manifest?.edition_date===edition.brief_date&&
      manifest?.edition_id===edition.edition_id&&
      manifest?.migration?.contract_transition==='pre-2026-10-05-frozen-contract-recovery'&&
      manifest?.migration?.preserve_accepted_locked_assets===true?manifest:null;
  }catch{return null;}
}

function findFrozenTask19Seal(edition,repoRoot){
  const editorialRoot=path.join(repoRoot,'_records','editorial');
  if(!fs.existsSync(editorialRoot))return null;
  const candidates=fs.readdirSync(editorialRoot,{withFileTypes:true})
    .filter(x=>x.isDirectory()&&x.name.startsWith(edition.brief_date+'-'))
    .map(x=>path.join(editorialRoot,x.name,'task19-bundle-seal.json'))
    .filter(file=>fs.existsSync(file))
    .map(file=>{try{return {file,data:JSON.parse(fs.readFileSync(file,'utf8'))};}catch{return null;}})
    .filter(x=>x?.data?.edition_id===edition.edition_id&&x.data?.result==='PASS');
  return candidates.length===1?candidates[0]:null;
}

function validateFrozenDigestRows(repoRoot,rows,{label,accept=()=>true}={}){
  const errors=[];
  for(const [relative,expected] of rows||[]){
    if(!accept(relative))continue;
    if(!safeRelative(relative)){errors.push(label+': unsafe sealed path '+String(relative));continue;}
    const full=path.join(repoRoot,relative);
    if(!fs.existsSync(full)){errors.push(label+': missing sealed artifact '+relative);continue;}
    const raw=fs.readFileSync(full),actual=gitBlobSha1(raw);
    if(actual!==expected)errors.push(label+': sealed artifact changed '+relative);
  }
  return errors;
}

export function validateFrozenTask19Bundle(edition,repoRoot){
  const errors=[],sealEntry=findFrozenTask19Seal(edition,repoRoot);
  if(!sealEntry)return ['Frozen Task 19 bundle seal missing or ambiguous'];
  const seal=sealEntry.data;
  if(seal.digest_scheme!=='git_blob_sha1'||seal?.preserved?.accepted_locked_images!==6)errors.push('Frozen Task 19 bundle seal contract mismatch');
  const shardData={};
  for(const shard of seal.shards||[]){
    if(!safeRelative(shard.path)){errors.push('Frozen Task 19 shard path is unsafe');continue;}
    const full=path.join(repoRoot,shard.path);
    if(!fs.existsSync(full)){errors.push('Frozen Task 19 shard missing: '+shard.path);continue;}
    const raw=fs.readFileSync(full);
    if(gitBlobSha1(raw)!==shard.git_blob_sha1)errors.push('Frozen Task 19 shard changed: '+shard.path);
    try{shardData[shard.path]=JSON.parse(raw.toString('utf8'));}catch{errors.push('Frozen Task 19 shard unreadable: '+shard.path);}
  }
  const reader=Object.entries(shardData).find(([p,x])=>x?.shard==='reader-pages')?.[1];
  const images=Object.entries(shardData).find(([p,x])=>x?.shard==='accepted-images')?.[1];
  if(!reader||!images)return [...errors,'Frozen Task 19 reader/image shards are required'];
  errors.push(...validateFrozenDigestRows(repoRoot,reader.digests,{label:'reader'}));
  errors.push(...validateFrozenDigestRows(repoRoot,images.digests,{label:'image',accept:p=>String(p).startsWith('briefs/images/'+edition.brief_date+'/')}));
  const imageRows=(images.digests||[]).filter(([p])=>String(p).startsWith('briefs/images/'+edition.brief_date+'/'));
  if(imageRows.length!==6)errors.push('Frozen Task 19 must bind exactly six accepted image byte streams');
  return errors;
}

export function validateFrozenProjectionState(edition,repoRoot){
  const errors=[],date=edition.brief_date;
  const mustContain=[
    ['latest.md','# Daily Generative AI Brief —'],
    ['index.md',date],
    ['archive.md',`/briefs/${date}/`],
    ['README.md',`briefs/${date}.md`],
    ['daily-feed.xml',date]
  ];
  for(const [relative,needle] of mustContain){
    const full=path.join(repoRoot,relative);
    if(!fs.existsSync(full))errors.push(relative+': missing frozen publication projection');
    else if(!fs.readFileSync(full,'utf8').includes(needle))errors.push(relative+': missing current edition binding');
  }
  const ids=[
    ...(edition.stories||[]).map(x=>x.story_id),
    ...Object.entries(edition.worth_watching||{}).filter(([,x])=>x?.status==='included').map(([slot])=>`dab-video-${date}-${slot==='agents_non_technical_people'?'agent-skills':slot}`),
    ...editionPodcasts(edition).map(x=>x.item_id)
  ];
  try{
    const json=JSON.parse(fs.readFileSync(path.join(repoRoot,'feed.json'),'utf8')),seen=new Set((json.items||[]).map(x=>x.id));
    for(const id of ids)if(!seen.has(id))errors.push('feed.json: missing current edition item '+id);
  }catch{errors.push('feed.json: unreadable frozen projection');}
  try{
    const atom=fs.readFileSync(path.join(repoRoot,'feed.xml'),'utf8');
    for(const id of ids)if(!atom.includes('<id>'+id+'</id>'))errors.push('feed.xml: missing current edition item '+id);
  }catch{errors.push('feed.xml: unreadable frozen projection');}
  return errors;
}

function files(dir, pattern = /\.json$/) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => pattern.test(name)).sort().map(name => path.join(dir, name)) : [];
}

export function validateQaRecord(record) {
  const errors = [];
  if (!record.run_id?.startsWith('dab-qa-')) errors.push('QA run ID is invalid');
  if (!['pass', 'fail'].includes(record.initial_result) || !['pass', 'fail'].includes(record.final_result)) errors.push('QA results are invalid');
  if (record.final_result === 'pass' && record.checks?.some(check => check.result === 'fail' && ['critical', 'high'].includes(check.severity))) errors.push('Passing QA record contains a blocking failed check');
  if (record.final_result === 'pass' && record.defects?.some(defect => defect.status === 'open' && ['critical', 'high'].includes(defect.severity))) errors.push('QA record contains an unresolved Critical/High defect');
  return errors;
}

export function validateOperationalRecords(repoRoot) {
  const errors = [];
  for (const file of files(path.join(repoRoot, '_records', 'qa'))) {
    try { errors.push(...validateQaRecord(JSON.parse(fs.readFileSync(file, 'utf8'))).map(item => `${path.relative(repoRoot, file)}: ${item}`)); }
    catch (error) { errors.push(`${path.relative(repoRoot, file)}: invalid JSON: ${error.message}`); }
  }
  for (const file of files(path.join(repoRoot, '_records', 'accessibility'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.automated_result !== 'PASS' || record.disposition === 'block') errors.push(`${path.relative(repoRoot, file)}: accessibility is blocking`);
    if (record.editorial_alt_review?.length !== 6 || record.editorial_alt_review.some(item => item.result !== 'pass')) errors.push(`${path.relative(repoRoot, file)}: editorial alt review is incomplete`);
  }
  for (const file of files(path.join(repoRoot, '_records', 'analytics'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.privacy?.contains_personal_identifiers !== false) errors.push(`${path.relative(repoRoot, file)}: analytics privacy contract failed`);
    if (!['complete', 'partial', 'unavailable'].includes(record.collection_status)) errors.push(`${path.relative(repoRoot, file)}: analytics status is unsupported`);
  }
  for (const file of files(path.join(repoRoot, '_records', 'trends'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const trend of record.trends || []) {
      if (trend.supporting_story_ids.length !== trend.supporting_stories.length) errors.push(`${path.relative(repoRoot, file)}: trend evidence count mismatch`);
      if (trend.supporting_stories.some(story => story.brief_date < record.evidence_window.start_date || story.brief_date > record.evidence_window.end_date || !/^\/(stories|podcasts|videos)\//.test(story.url))) errors.push(`${path.relative(repoRoot, file)}: trend has evidence outside its window or without a stable URL`);
    }
  }
  for (const file of files(path.join(repoRoot, '_records', 'editorial-feedback'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    const guardrails = record.guardrails || {};
    if (!guardrails.popularity_only_selection_prohibited || !guardrails.hard_gates_override_weights || !guardrails.category_balance_preserved || !guardrails.human_approval_required) errors.push(`${path.relative(repoRoot, file)}: editorial guardrails are incomplete`);
  }
  const feedbackDates = new Set();
  for (const file of files(path.join(repoRoot, '_records', 'personal-feedback'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    errors.push(...validatePersonalFeedback(record).map(item => path.relative(repoRoot, file) + ': ' + item));
    if (feedbackDates.has(record.brief_date)) errors.push(path.relative(repoRoot, file) + ': duplicate primary-reader feedback for ' + record.brief_date);
    feedbackDates.add(record.brief_date);
  }
  for (const file of files(path.join(repoRoot, '_records', 'editorial-learning'))) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    errors.push(...validateEditorialLearning(record).map(item => path.relative(repoRoot, file) + ': ' + item));
  }
  return errors;
}

export function validateUrlContract(repoRoot) {
  const contract = JSON.parse(fs.readFileSync(path.join(repoRoot, '_architecture', 'iteration-0', 'url-contract.json'), 'utf8'));
  const errors = [];
  for (const item of contract.must_preserve) {
    if (!item.producer.includes('<') && !item.producer.includes('YYYY-MM-DD') && !fs.existsSync(path.join(repoRoot, item.producer))) errors.push(`Missing URL producer ${item.producer}`);
  }
  for (const route of contract.frozen_dated_briefs) {
    const date = route.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!fs.existsSync(path.join(repoRoot, 'briefs', `${date}.md`))) errors.push(`Missing frozen brief ${route}`);
  }
  for (const route of contract.frozen_qa_reports) {
    const date = route.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!fs.existsSync(path.join(repoRoot, 'qa', `${date}.md`))) errors.push(`Missing frozen QA route ${route}`);
  }
  return errors;
}

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

function firstDerivedDiff(actual,expected){
  const a=String(actual).split('\n'),e=String(expected).split('\n');
  const max=Math.max(a.length,e.length);
  for(let i=0;i<max;i++)if(a[i]!==e[i])return `line ${i+1}: actual=${JSON.stringify(a[i]??null)} expected=${JSON.stringify(e[i]??null)}`;
  return 'byte difference with no line-level mismatch';
}

export function validateDerivedParity(edition, repoRoot) {
  const watchlist=sameEditionWatchlist(repoRoot,edition.brief_date);
  const expected = generatedFiles(edition, repoRoot,{watchlist});
  const errors = [];
  for (const [name, content] of expected) {
    const file = path.join(repoRoot, name);
    const normalized = content.endsWith('\n') ? content : `${content}\n`;
    if (!fs.existsSync(file)) errors.push(`${name}: missing derived output`);
    else { const actual=fs.readFileSync(file,'utf8'); if(actual!==normalized) errors.push(`${name}: derived output does not match canonical generation (${firstDerivedDiff(actual,normalized)})`); }
  }
  return errors;
}

export function validateIntegratedRepository(edition, repoRoot, {imageReviewPath=null}={}) {
  const frozen=frozenPublicationMigration(edition,repoRoot);
  const imageErrors=frozen?validateFrozenTask19Bundle(edition,repoRoot):(imageReviewPath?reviewedHandoffImages(edition,repoRoot,imageReviewPath):reviewedImages(edition,repoRoot)).errors;
  const derivedErrors=frozen?validateFrozenProjectionState(edition,repoRoot):validateDerivedParity(edition, repoRoot);
  const errors = [...imageErrors, ...validateEdition(edition), ...validateUrlContract(repoRoot), ...validateOperationalRecords(repoRoot), ...derivedErrors, ...auditEditionAccessibility(edition, repoRoot).findings.filter(item => ['critical', 'high'].includes(item.severity)).map(item => `${item.code}: ${item.message}`)];
  const atom = fs.existsSync(path.join(repoRoot, 'feed.xml')) ? fs.readFileSync(path.join(repoRoot, 'feed.xml'), 'utf8') : '';
  const json = fs.existsSync(path.join(repoRoot, 'feed.json')) ? fs.readFileSync(path.join(repoRoot, 'feed.json'), 'utf8') : '';
  errors.push(...validateFeeds(atom, json));
  return errors;
}

export function validatePublicationFreshness(edition, expectedDate) {
  return edition.brief_date === expectedDate ? [] : [`stale edition: expected ${expectedDate}, found ${edition.brief_date}`];
}

export function publicationOutcome({expectedBaseline, observedBaseline, stagedValid, pagesConclusion}) {
  if (expectedBaseline !== observedBaseline) return 'aborted_concurrent_update';
  if (!stagedValid) return 'rejected_before_commit';
  if (pagesConclusion !== 'success') return 'degraded_pages_failure';
  return 'published';
}

export function rollbackOutcome({targetExists, restoredTreeValid, pagesConclusion}) {
  if (!targetExists) return 'rollback_failed_missing_target';
  if (!restoredTreeValid) return 'rollback_failed_validation';
  if (pagesConclusion !== 'success') return 'rollback_degraded_pages_failure';
  return 'rolled_back';
}
