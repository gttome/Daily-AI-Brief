import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function stableSuffix(value) {
  return sha256(value).slice(0, 8);
}

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'story';
}

export function normalizeUrl(value) {
  const url = new URL(value);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  const tracking = /^(utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i;
  const entries = [...url.searchParams.entries()].filter(([key]) => !tracking.test(key)).sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
  url.search = '';
  for (const [key, item] of entries) url.searchParams.append(key, item);
  if (!url.pathname) url.pathname = '/';
  return url.toString();
}

export function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
}

export function writeText(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function listBriefDates(repoRoot) {
  return fs.readdirSync(path.join(repoRoot, 'briefs'))
    .map(name => name.match(/^(\d{4}-\d{2}-\d{2})\.md$/)?.[1])
    .filter(Boolean)
    .sort()
    .reverse();
}

export function latestBriefDate(repoRoot) {
  return listBriefDates(repoRoot)[0] || null;
}

export function parseArgs(argv) {
  const result = {_: []};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) result._.push(value);
    else {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        index += 1;
      } else result[key] = true;
    }
  }
  return result;
}

export function deepEqualJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
