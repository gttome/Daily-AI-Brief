#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArgs,sha256} from '../_generator/lib/util.mjs';
import {lintPublicationCandidate} from '../_generator/lib/publication-candidate-lint.mjs';
import {CONTRACT_FREEZE_DATE,PUBLICATION_MANIFEST_PATH,publicationArtifactPath,publicationManifestErrors} from '../_generator/lib/publication-manifest.mjs';
import {evaluateReaderSemanticCloseGate} from '../_generator/lib/reader-semantic-close-gate.mjs';
import {buildExactPublicationPreflightReceipt,validateExactPublicationPreflightReceipt} from '../_generator/lib/exact-publication-preflight.mjs';

const args=parseArgs(process.argv.slice(2)),root=path.resolve(args.root||'.');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=p=>fs.existsSync(path.join(root,p));
const dates=fs.readdirSync(path.join(root,'_data/editions')).filter(x=>/^\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort();
const date=args.date||dates.at(-1)?.replace('.json','');
if(!date)throw Error('edition_date_required');

const edition=read('_data/editions/'+date+'.json');
const kernel=read('_records/editorial-handoff/kernel.json');
const handoff=read('_records/editorial-handoff/handoff.json');
const runtime=read('docs/operations/under80-runtime-contract.json');
const manifestPath=args.manifest||handoff.publication_manifest_path||PUBLICATION_MANIFEST_PATH;
const hasManifest=exists(manifestPath);
const manifest=(date>=CONTRACT_FREEZE_DATE&&!hasManifest)?null:(hasManifest?read(manifestPath):null);
const manifestErrors=manifest
  ?publicationManifestErrors(root,manifest,{expectedBaseline:kernel.baseline_sha,expectedEditionDate:date,expectedStagingRef:handoff.staging_ref})
  :(date>=CONTRACT_FREEZE_DATE?['publication_manifest_required_for_candidate_lint']:[]);

let candidateErrors=[],readerResult={result:'FAIL',errors:['preflight_not_run_due_to_manifest_failure']};
if(manifestErrors.length===0){
  const artifact=name=>manifest?publicationArtifactPath(manifest,name):null;
  const media=manifest?read(artifact('media')):read('_records/editorial-handoff/media.json');
  const imageManifest=manifest?read(artifact('image_review')):read('_records/editorial-handoff/final-image-review-'+date+'.json');
  const mediaReceipt=manifest?read(artifact('media_receipt')):(exists('_records/editorial/media-preflight/'+date+'.json')?read('_records/editorial/media-preflight/'+date+'.json'):null);
  const canonicalWatchlist=manifest?read(artifact('watchlist')):read('_data/watchlist.json');
  const publicWatchlistData=read('data/watchlist.json');
  let gitEvidence={baselineSha:kernel.baseline_sha,actualStagingRef:handoff.staging_ref};
  if(args['skip-git-evidence']!==true&&root===path.resolve('.')){
    let baselineIsAncestor=false;
    try{
      execFileSync('git',['merge-base','--is-ancestor',kernel.baseline_sha,'HEAD']);
      baselineIsAncestor=true;
    }catch{}
    gitEvidence={
      ...gitEvidence,
      handoffHeadSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
      handoffParentSha:execFileSync('git',['rev-parse','HEAD^'],{encoding:'utf8'}).trim(),
      baselineIsAncestor
    };
  }else{
    gitEvidence.handoffHeadSha=process.env.DAB_HANDOFF_HEAD_SHA||kernel.baseline_sha.replace(/^./,kernel.baseline_sha[0]==='a'?'b':'a');
    gitEvidence.handoffParentSha=kernel.baseline_sha;
  }
  candidateErrors=lintPublicationCandidate({
    root,edition,kernel,media,imageManifest,mediaReceipt,canonicalWatchlist,publicWatchlistData,handoff,runtime,publicationManifest:manifest,gitEvidence
  });

  let executionKey=args['execution-key']||null;
  const pointerPath='data/operations/active-production-run.json';
  if(!executionKey&&exists(pointerPath)){
    const pointer=read(pointerPath);
    if(pointer.edition_id===edition.edition_id)executionKey=pointer.execution_key||null;
  }
  if(!executionKey){
    const editorialRoot=path.join(root,'_records','editorial');
    if(fs.existsSync(editorialRoot)){
      for(const name of fs.readdirSync(editorialRoot).sort().reverse()){
        const selection=path.join(editorialRoot,name,'story-selection.json');
        if(!fs.existsSync(selection))continue;
        try{
          const value=JSON.parse(fs.readFileSync(selection,'utf8'));
          if(value.edition_id===edition.edition_id){executionKey=name;break;}
        }catch{}
      }
    }
  }
  readerResult=evaluateReaderSemanticCloseGate({
    root,editionDate:date,executionKey,
    observedAt:args['observed-at']||new Date().toISOString()
  });
}

const expectedPaths=[
  'index.md','latest.md','briefs/'+date+'.md','archive.md','feed.json','feed.xml',
  ...((edition.stories||[]).map(story=>'stories/'+date+'/'+story.slug+'.md'))
];
const hashEntries=[];
for(const relative of expectedPaths){
  const file=path.join(root,relative);
  if(fs.existsSync(file)&&fs.statSync(file).isFile())hashEntries.push([relative,sha256(fs.readFileSync(file))]);
}
if(manifest&&fs.existsSync(path.join(root,manifestPath)))hashEntries.push([manifestPath,sha256(fs.readFileSync(path.join(root,manifestPath)))]);
const candidateContentDigest='sha256:'+sha256(Buffer.from(JSON.stringify(hashEntries.sort((a,b)=>a[0].localeCompare(b[0])))));
const expectedRoutes=[
  '/', '/latest/', '/briefs/'+date+'/', '/archive/', '/feed.json', '/feed.xml',
  ...((edition.stories||[]).map(story=>'/stories/'+date+'/'+story.slug+'/'))
];

const receipt=buildExactPublicationPreflightReceipt({
  edition_id:edition.edition_id,edition_date:date,candidate_content_digest:candidateContentDigest,
  manifest_errors:manifestErrors,candidate_errors:candidateErrors,reader_result:readerResult,
  expected_deployment_routes:expectedRoutes,checked_at:args['observed-at']||new Date().toISOString()
});
const receiptErrors=validateExactPublicationPreflightReceipt(receipt);
if(receiptErrors.length)throw Error(receiptErrors.join('; '));
if(args.out){
  const target=path.resolve(args.out);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');
}
process.stdout.write(JSON.stringify(receipt,null,2)+'\n');
if(receipt.result!=='PASS')process.exitCode=2;
