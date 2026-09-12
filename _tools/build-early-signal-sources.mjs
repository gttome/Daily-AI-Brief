import fs from 'node:fs';

const sourcePath = '_data/early-signal-sources.json';
const registry = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const ranks = registry.channels.map(channel => channel.rank);
if (registry.channels.length !== 10 || ranks.some((rank, index) => rank !== index + 1)) {
  throw new Error('Early-signal source registry must contain exactly ten channels ranked 1–10.');
}
const ids = registry.channels.flatMap(channel => [channel.channel_id, ...channel.endpoints.map(endpoint => endpoint.source_id)]);
if (new Set(ids).size !== ids.length) throw new Error('Early-signal channel and endpoint IDs must be unique.');
for (const channel of registry.channels) {
  if (!channel.targets.includes('brief') || !channel.targets.includes('watchlist')) throw new Error(`${channel.channel_id} must serve both discovery targets.`);
  if (!channel.entry_url.startsWith('https://')) throw new Error(`${channel.channel_id} requires a public HTTPS entry URL.`);
  for (const endpoint of channel.endpoints) if (!endpoint.url.startsWith('https://')) throw new Error(`${endpoint.source_id} requires HTTPS.`);
}

fs.mkdirSync('data', {recursive: true});
fs.copyFileSync(sourcePath, 'data/early-signal-sources.json');

const esc = value => String(value).replace(/[&<>]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[character]));
const channels = registry.channels.map(channel => {
  const access = channel.automation_mode === 'public_retrieval' ? 'Public monitoring' : channel.automation_mode === 'assisted_review' ? 'Assisted review' : 'Public monitoring plus assisted review';
  const links = channel.endpoints.length
    ? channel.endpoints.map(endpoint => `<li><a href="${endpoint.url}" target="_blank" rel="noopener noreferrer">${esc(endpoint.name)}</a>${endpoint.automated ? '' : ' · assisted review'}</li>`).join('')
    : `<li><a href="${channel.entry_url}" target="_blank" rel="noopener noreferrer">${esc(channel.name)}</a> · assisted review</li>`;
  return `<section class="source-channel"><h2>${channel.rank}. ${esc(channel.name)}</h2><p><strong>Monitoring:</strong> ${access}</p><p>${esc(channel.why_monitored)}</p><p><strong>Evidence treatment:</strong> ${esc(channel.evidence_treatment)}</p><ul>${links}</ul></section>`;
}).join('\n');

fs.writeFileSync('sources.md', `---
layout: default
title: Sources and early-signal monitoring
description: Where the Daily AI Brief and Emerging AI Watch look first.
permalink: /sources/
---

The Daily AI Brief and Emerging AI Watch prioritize primary-origin sources that can reveal papers, models, code, releases, and emerging practices early. Newsletters and aggregators remain useful for discovery and catching up, but they do not replace original evidence.

Every candidate still passes freshness, authority, evidence-quality, novelty, relevance, and duplication checks. Community discussion can identify a lead or a limitation; consequential claims must be traced to an original paper, model card, repository, official release, system card, or other authoritative evidence. Preprints and vendor-reported results are labeled for what they are.

${channels}

## How the two products use these sources

- **Daily AI Brief:** sources expand the candidate pool for six articles, two videos, and one podcast. Selection is never automatic merely because an item appears in a monitored channel.
- **Emerging AI Watch:** sources help identify unfamiliar concepts before they become established topics. Reader interest can trigger deeper research but cannot bypass evidence requirements.
- **Restricted channels:** X and specialized Discord communities use assisted review. Private material, inaccessible posts, engagement counts, rumors, and screenshots are not treated as verified evidence.

[Read today’s brief]({{ '/' | relative_url }}) · [Explore Emerging AI Watch]({{ '/watchlist/' | relative_url }})
`);

console.log(`Early-signal sources validated: ${registry.channels.length} ranked channels.`);
