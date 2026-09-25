#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs,writeText} from '../_generator/lib/util.mjs';
import {validatePublicationManifest,PUBLICATION_MANIFEST_PATH} from '../_generator/lib/publication-manifest.mjs';

const args=parseArgs(process.argv.slice(2)),command=args._?.[0]||'validate',root=path.resolve(args.root||'.');
if(command!=='validate')throw Error('unknown_publication_manifest_command');
const manifestPath=args.manifest||PUBLICATION_MANIFEST_PATH;
const absolute=path.resolve(root,manifestPath);
if(!fs.existsSync(absolute))throw Error('publication_manifest_missing:'+manifestPath);
const manifest=JSON.parse(fs.readFileSync(absolute,'utf8'));
const result=validatePublicationManifest(root,manifest,{expectedBaseline:args.baseline||null,expectedEditionDate:args.date||null,expectedStagingRef:args['staging-ref']||null});
if(args.out)writeText(path.resolve(args.out),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,manifest_path:manifestPath},null,2));
if(result.result!=='PASS')process.exitCode=2;
