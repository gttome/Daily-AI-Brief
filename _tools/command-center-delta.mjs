#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {commandCenterDeltaPacket} from '../_generator/lib/command-center-delta.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.validation||!args.watchlist||!args.policy||!args.out)throw Error('Usage: command-center-delta.mjs --validation <json> --watchlist <json> --policy <json> --out <json>');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const packet=commandCenterDeltaPacket({validation:read(args.validation),watchlist:read(args.watchlist),policy:read(args.policy)});
const out=path.resolve(args.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify(packet,null,2));
