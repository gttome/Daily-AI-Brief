import fs from 'node:fs';
import path from 'node:path';
const base='https://gttome.github.io/Daily-AI-Brief';
const xml=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function editionFeed(root,currentDate){
 const dates=[...new Set([...fs.readdirSync(path.join(root,'briefs')).filter(n=>/^\d{4}-\d{2}-\d{2}\.md$/.test(n)).map(n=>n.slice(0,10)),currentDate])].filter(d=>d<=currentDate).sort().reverse();
 return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Daily AI Brief — Daily editions</title><link>${base}/</link>
<description>One entry per daily edition. Open a date to read its complete archived brief.</description><language>en-us</language>
<atom:link href="${base}/daily-feed.xml" rel="self" type="application/rss+xml"/>
${dates.map(d=>`<item><title>Daily AI Brief — ${d}</title><link>${base}/briefs/${d}/</link><guid isPermaLink="true">${base}/briefs/${d}/</guid><description>${xml(`<p>Your Daily AI Brief for ${d} is ready.</p><p><a href="${base}/briefs/${d}/">Read this complete edition</a> · <a href="${base}/">Latest brief</a> · <a href="${base}/briefs-archive/">Browse archive</a></p>`)}</description></item>`).join('\n')}
</channel></rss>\n`;
}
