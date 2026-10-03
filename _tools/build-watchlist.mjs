import fs from 'node:fs';
import {renderDailyTopicGroups} from '../assets/js/watchlist-daily.js';
import {validateEmergingSignalSweep} from '../_generator/lib/emerging-signal-sweep.mjs';
import {renderWatchlistEvidence} from '../assets/js/watchlist-evidence.js';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';
const data=publicWatchlist(JSON.parse(fs.readFileSync('_data/watchlist.json','utf8')));
if(data.edition_date>='2026-09-30'){
 const receipt=JSON.parse(fs.readFileSync(`_records/watchlist-sweeps/${data.edition_date}.json`,'utf8'));
 const errors=validateEmergingSignalSweep(receipt,{editionDate:data.edition_date,topics:data.topics});
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({discovery:receipt.telemetry}));
}
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/watchlist.json',JSON.stringify(data,null,2)+'\n');
fs.copyFileSync('_data/watchlist-sources.json','data/watchlist-sources.json');
fs.copyFileSync('_data/early-signal-sources.json','data/early-signal-sources.json');
fs.mkdirSync('_records/watchlist',{recursive:true});
// Unique timestamped observations retain prior evaluations, including same-day revisions.
const file=`_records/watchlist/${data.edition_date}-${data.updated_at.replace(/[^0-9]/g,'')}.json`;
if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log(`Watchlist validated: ${data.topics.length} topics, ${data.edition_date}`);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=data.topics.map(t=>`<section class="wl-card" id="${esc(t.topic_id)}"><h2>${esc(t.name)}</h2><p>${esc(t.summary)}</p><p><strong>Why now:</strong> ${esc(t.why_now)}</p><p><strong>Potential value:</strong> ${esc(t.practical_value)}</p>${renderWatchlistEvidence(t)}</section>`).join('\n');
fs.mkdirSync('watchlist/research',{recursive:true});fs.writeFileSync('watchlist/research/index.md',`---\nlayout: default\ntitle: Watchlist research\npermalink: /watchlist/research/\n---\n\n[Back to the watchlist and voting]({{ '/watchlist/' | relative_url }})\n\nResearch updated ${data.updated_at}. ${data.baseline_note}\n\n${data.edition_date>='2026-09-30'?renderDailyTopicGroups(data):''}\n${html}\n`);
