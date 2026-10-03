#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from '../_generator/lib/util.mjs';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';

const args=parseArgs(process.argv.slice(2)),root=path.resolve(args.root||'.');
const source=args.source||'_data/watchlist.json',target=args.target||'data/watchlist.json';
if(path.isAbsolute(source)||source.split(/[\\/]+/).includes('..'))throw Error('Unsafe Watchlist source path');
const canonical=JSON.parse(fs.readFileSync(path.join(root,source),'utf8'));
const generated=publicWatchlist(canonical),text=JSON.stringify(generated,null,2)+'\n';
const gitBlobSha1=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
if(args['expected-digest']){
 const actual='git_blob_sha1:'+gitBlobSha1(Buffer.from(text));
 if(actual!==args['expected-digest'])throw Error('frozen_watchlist_projection_digest_mismatch');
}
const targetPath=path.join(root,target),prior=fs.existsSync(targetPath)?fs.readFileSync(targetPath,'utf8'):null;
fs.mkdirSync(path.dirname(targetPath),{recursive:true});
if(prior!==text)fs.writeFileSync(targetPath,text);
const verify=JSON.parse(fs.readFileSync(targetPath,'utf8'));
if(JSON.stringify(verify)!==JSON.stringify(generated))throw Error('public_watchlist_generation_parity_failed');
console.log(JSON.stringify({result:'pass',source,target,changed:prior!==text,edition_date:canonical.edition_date},null,2));
