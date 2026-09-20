import fs from 'node:fs';
import path from 'node:path';

const CANONICAL_EDITION=/^dab-edition-\d{4}-\d{2}-\d{2}$/;
const ATTEMPT_ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,160}$/;

function numberOrNull(value,label){
  if(value===undefined||value===null)return null;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error(`${label} must be a nonnegative number or null`);
  return value;
}

function timeOrNull(value,label){
  if(value===undefined||value===null)return null;
  if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw Error(`${label} must be an ISO timestamp or null`);
  return value;
}

export function usageIndexEntry(record,sourcePath){
  if(!record||!ATTEMPT_ID.test(record.attempt_id||''))throw Error(`Invalid attempt_id in ${sourcePath}`);
  if(!CANONICAL_EDITION.test(record.edition_id||''))return null;
  const imageDrafts=numberOrNull(record.measured_work?.image_drafts,'image_drafts');
  const imageRejects=numberOrNull(record.measured_work?.image_rejects,'image_rejects');
  const acceptedImages=numberOrNull(record.measured_work?.accepted_images,'accepted_images');
  const wallSeconds=numberOrNull(record.wall_seconds,'wall_seconds');
  const startedAt=timeOrNull(record.started_at,'started_at');
  const endedAt=timeOrNull(record.ended_at,'ended_at');
  const exactCredits=numberOrNull(record.usage?.exact_credits ?? record.usage?.exact_platform_credits,'exact_credits');
  return {
    source_path:sourcePath,
    attempt_id:record.attempt_id,
    edition_id:record.edition_id,
    started_at:startedAt,
    ended_at:endedAt,
    wall_seconds:wallSeconds,
    scope:typeof record.scope==='string'?record.scope:null,
    measured_work:{
      image_drafts:imageDrafts,
      image_rejects:imageRejects,
      accepted_images:acceptedImages
    },
    usage:{
      exact_credits:exactCredits,
      coverage:typeof record.usage?.coverage==='string'?record.usage.coverage:null
    },
    measurement_coverage:[wallSeconds,imageDrafts,imageRejects].every(v=>v!==null)?'complete':'partial'
  };
}

function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):entry.isFile()&&entry.name.endsWith('.json')?[full]:[];
  });
}

export function buildAttemptIndex(repoRoot='.'){
  const root=path.resolve(repoRoot);
  const attemptsRoot=path.join(root,'_records','attempts');
  const entries=[];
  const seen=new Map();
  for(const file of walk(attemptsRoot).sort()){
    const relative=path.relative(root,file).split(path.sep).join('/');
    const record=JSON.parse(fs.readFileSync(file,'utf8'));
    const entry=usageIndexEntry(record,relative);
    if(!entry)continue;
    const prior=seen.get(entry.attempt_id);
    if(prior)throw Error(`Duplicate attempt_id ${entry.attempt_id}: ${prior} and ${relative}`);
    seen.set(entry.attempt_id,relative);
    entries.push(entry);
  }
  entries.sort((a,b)=>a.edition_id.localeCompare(b.edition_id)||String(a.started_at||'').localeCompare(String(b.started_at||''))||a.attempt_id.localeCompare(b.attempt_id));
  return {
    schema_version:'1.0.0',
    source:'_records/attempts/**/*.json',
    dedupe_key:'attempt_id',
    records:entries
  };
}
