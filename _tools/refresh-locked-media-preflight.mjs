#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {gitBlobSha1,validatePublicationManifest,publicationArtifactPath} from '../_generator/lib/publication-manifest.mjs';

const arg=(name,def=null)=>{
  const i=process.argv.indexOf(name);
  return i>=0&&process.argv[i+1]?process.argv[i+1]:def;
};
const manifestPath=arg('--manifest','_records/editorial-handoff/publication-manifest.json');
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,manifestPath),'utf8'));
const receiptPath=publicationArtifactPath(manifest,'media_receipt');
const receiptAbs=path.join(root,receiptPath);
const receipt=JSON.parse(fs.readFileSync(receiptAbs,'utf8'));

if(!Array.isArray(receipt.items)||receipt.items.length!==4)throw new Error('locked_media_receipt_requires_exactly_four_items');
const priorCheckedAt=receipt.checked_at;
const now=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
const runId=process.env.GITHUB_RUN_ID||'local';

async function verify(item){
  const url=new URL(item.url);
  if(url.protocol!=='https:')throw new Error('media_url_must_be_https:'+item.item_id);
  const response=await fetch(url,{
    redirect:'follow',
    signal:AbortSignal.timeout(20000),
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; Daily-AI-Brief-Publisher/1.0; +https://gttome.github.io/Daily-AI-Brief/)',
      'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  const status=response.status;
  try{await response.body?.cancel();}catch{}
  if(status!==200)throw new Error('media_live_reachability_failed:'+item.item_id+':http_'+status);
  return {...item,
    reachable:true,
    http_status:200,
    verification_timestamp:now,
    http_observed_at:now,
    reachability_provenance:'Fresh prepublication HTTP GET of the locked URL in GitHub Actions run '+runId,
    verification_evidence:String(item.verification_evidence||'')+' Live reachability revalidated before publication; locked date/runtime metadata retained from the qualified receipt.'
  };
}

receipt.items=await Promise.all(receipt.items.map(verify));
receipt.checked_at=now;
receipt.verification_timestamp=now;
receipt.basis='Fresh prepublication reachability revalidation of the four already-locked media URLs; no media rediscovery or editorial reselection. Publication/upload dates and runtimes remain the qualified immutable observations.';
receipt.revalidation={
  mode:'locked_media_live_reachability_only',
  prior_checked_at:priorCheckedAt,
  checked_at:now,
  github_run_id:runId,
  selection_changed:false,
  static_metadata_changed:false
};

const receiptText=JSON.stringify(receipt,null,2)+'\n';
fs.writeFileSync(receiptAbs,receiptText);
manifest.artifacts.media_receipt.digest='git_blob_sha1:'+gitBlobSha1(Buffer.from(receiptText));
manifest.migration={...(manifest.migration||{}),
  media_preflight_refresh:{
    mode:'locked_media_live_reachability_only',
    checked_at:now,
    selection_changed:false,
    static_metadata_changed:false
  }
};
fs.writeFileSync(path.join(root,manifestPath),JSON.stringify(manifest,null,2)+'\n');

const validation=validatePublicationManifest(root,manifest);
if(validation.result!=='PASS')throw new Error('refreshed_publication_manifest_invalid:'+validation.errors.join(';'));
console.log(JSON.stringify({
  result:'PASS',
  edition_id:receipt.edition_id,
  checked_at:now,
  items:receipt.items.map(x=>({item_id:x.item_id,http_status:x.http_status,reachable:x.reachable})),
  selection_changed:false,
  static_metadata_changed:false
},null,2));
