#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {commandCenterDeltaPacket} from '../_generator/lib/command-center-delta.mjs';

const args=parseArgs(process.argv.slice(2));
if(!args.status||!args.policy||!args.out)throw Error('Usage: command-center-delta.mjs --status <publication-status.json> --policy <json> --out <json> [--validation <json>] [--watchlist <json>] [--incident <json>] [--sync-state <json>]');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const optional=p=>p&&fs.existsSync(path.resolve(p))?read(p):null;
const packet=commandCenterDeltaPacket({
 canonicalStatus:read(args.status),
 validation:optional(args.validation)||{},
 watchlist:optional(args.watchlist)||{},
 policy:read(args.policy),
 incidentHistory:optional(args.incident),
 synchronizedState:optional(args['sync-state'])
});
const out=path.resolve(args.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify(packet,null,2));
