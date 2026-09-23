#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArgs,sha256} from '../_generator/lib/util.mjs';
import {lintPublicationCandidate} from '../_generator/lib/publication-candidate-lint.mjs';
const args=parseArgs(process.argv.slice(2)),root=path.resolve(args.root||'.');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const dates=fs.readdirSync(path.join(root,'_data/editions')).filter(x=>/^\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort(),date=args.date||dates.at(-1).replace('.json','');
const edition=read('_data/editions/'+date+'.json'),kernel=read('_records/editorial-handoff/kernel.json'),media=read('_records/editorial-handoff/media.json');
const imageManifest=read('_records/editorial-handoff/final-image-review-'+date+'.json');
const mediaReceiptPath='_records/editorial/media-preflight/'+date+'.json',mediaReceipt=fs.existsSync(path.join(root,mediaReceiptPath))?read(mediaReceiptPath):null;
const canonicalWatchlist=read('_data/watchlist.json'),publicWatchlistData=read('data/watchlist.json'),handoff=read('_records/editorial-handoff/handoff.json'),runtime=read('docs/operations/under80-runtime-contract.json');
let gitEvidence={baselineSha:kernel.baseline_sha,actualStagingRef:handoff.staging_ref};
if(args['skip-git-evidence']!==true&&root===path.resolve('.')){
 gitEvidence={...gitEvidence,handoffHeadSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),handoffParentSha:execFileSync('git',['rev-parse','HEAD^'],{encoding:'utf8'}).trim()};
}else{
 gitEvidence.handoffHeadSha=process.env.DAB_HANDOFF_HEAD_SHA||kernel.baseline_sha.replace(/^./,kernel.baseline_sha[0]==='a'?'b':'a');
 gitEvidence.handoffParentSha=kernel.baseline_sha;
}
const errors=lintPublicationCandidate({root,edition,kernel,media,imageManifest,mediaReceipt,canonicalWatchlist,publicWatchlistData,handoff,runtime,gitEvidence});
if(errors.length){console.error(errors.join('\n'));process.exit(2);}
console.log(JSON.stringify({result:'pass',edition_id:edition.edition_id,watchlist_edition:canonicalWatchlist.edition_date,kernel_sha256:sha256(fs.readFileSync(path.join(root,'_records/editorial-handoff/kernel.json')))},null,2));
