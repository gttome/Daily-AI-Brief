#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {watchlistDeltaPlan} from '../_generator/lib/watchlist-delta.mjs';
import {parseArgs} from '../_generator/lib/util.mjs';

const args=parseArgs(process.argv.slice(2));
const priorPath=args.prior;
const nextPath=args.next;
const outPath=args.out;
if(!nextPath||!outPath)throw Error('Usage: watchlist-delta-plan.mjs --next <watchlist.json> --out <receipt.json> [--prior <prior-watchlist.json>]');

const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const next=read(nextPath);
const prior=priorPath&&fs.existsSync(path.resolve(priorPath))?read(priorPath):{topics:[]};
if(!Array.isArray(next?.topics))throw Error('Current Watchlist must contain topics[]');
if(!Array.isArray(prior?.topics))throw Error('Prior Watchlist must contain topics[]');

const plan=watchlistDeltaPlan(prior.topics,next.topics);
const receipt={
 schema_version:'1.0.0',
 mode:'deterministic_watchlist_delta',
 prior_edition_date:prior.edition_date||null,
 next_edition_date:next.edition_date||null,
 prior_topic_count:prior.topics.length,
 next_topic_count:next.topics.length,
 ...plan,
 model_calls:0,
 rule:'Only changed/new topic evidence is eligible for semantic refresh. Carried topics preserve prior semantic text; observation timestamp changes alone do not trigger refresh.'
};
fs.mkdirSync(path.dirname(path.resolve(outPath)),{recursive:true});
fs.writeFileSync(path.resolve(outPath),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
