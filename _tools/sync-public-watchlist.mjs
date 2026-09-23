#!/usr/bin/env node
import fs from 'node:fs';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';
const canonical=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8'));
const generated=publicWatchlist(canonical),text=JSON.stringify(generated,null,2)+'\n';
fs.mkdirSync('data',{recursive:true});
const prior=fs.existsSync('data/watchlist.json')?fs.readFileSync('data/watchlist.json','utf8'):null;
if(prior!==text)fs.writeFileSync('data/watchlist.json',text);
const verify=JSON.parse(fs.readFileSync('data/watchlist.json','utf8'));
if(JSON.stringify(verify)!==JSON.stringify(generated))throw Error('public_watchlist_generation_parity_failed');
console.log(prior===text?'Public Watchlist already canonical.':'Public Watchlist regenerated from canonical state.');
