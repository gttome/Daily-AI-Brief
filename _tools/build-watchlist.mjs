import fs from 'node:fs';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';
const data=publicWatchlist(JSON.parse(fs.readFileSync('_data/watchlist.json','utf8')));
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/watchlist.json',JSON.stringify(data,null,2)+'\n');
fs.copyFileSync('_data/watchlist-sources.json','data/watchlist-sources.json');
fs.copyFileSync('_data/early-signal-sources.json','data/early-signal-sources.json');
fs.mkdirSync('_records/watchlist',{recursive:true});
// Unique timestamped observations retain prior evaluations, including same-day revisions.
const file=`_records/watchlist/${data.edition_date}-${data.updated_at.replace(/[^0-9]/g,'')}.json`;
if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log(`Watchlist validated: ${data.topics.length} topics, ${data.edition_date}`);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=data.topics.map(t=>`<section><h2>${esc(t.name)}</h2><p>${esc(t.summary)}</p><p><strong>Why now:</strong> ${esc(t.why_now)}</p><p><strong>Potential value:</strong> ${esc(t.practical_value)}</p><p><strong>Limitations:</strong> ${esc(t.limitations)}</p><ul>${t.evidence.map(x=>`<li><a href="${esc(x.url)}">${esc(x.title)}</a> · ${esc(x.publication_date||'Date unverified')}</li>`).join('')}</ul></section>`).join('\n');
fs.mkdirSync('watchlist/research',{recursive:true});fs.writeFileSync('watchlist/research/index.md',`---\nlayout: default\ntitle: Watchlist research\npermalink: /watchlist/research/\n---\n\n[Back to the watchlist and voting]({{ '/watchlist/' | relative_url }})\n\nResearch updated ${data.updated_at}. ${data.baseline_note}\n\n${html}\n`);
