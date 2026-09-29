import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha256, parseArgs} from '../_generator/lib/util.mjs';
import {extractApplePodcastEpisodes, extractYouTubeCatalogVideos} from '../_generator/lib/media-source-parsers.mjs';
import {MAX_RESPONSE_BYTES} from './discovery-links.mjs';

// Read JSON data, never execute publisher JavaScript. Braces inside JSON strings do not terminate it.
function jsonObjectAt(text, start) {
  let depth = 0, quoted = false, escaped = false;
  if (text[start] !== '{') throw Error('media_json_object_required');
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw Error('media_json_object_incomplete');
}

export function parseSavedMediaSource(bytes, {kind, identity, expectedSha256} = {}) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_RESPONSE_BYTES) throw Error('media_source_size_invalid');
  if (!/^[a-f0-9]{64}$/.test(expectedSha256 || '') || sha256(bytes) !== expectedSha256) throw Error('media_source_hash_mismatch');
  if (!['apple', 'youtube'].includes(kind)) throw Error('media_parser_kind_invalid');
  if (!(kind === 'apple' ? /^\d+$/ : /^UC[A-Za-z0-9_-]{22}$/).test(String(identity || ''))) throw Error('media_source_identity_required');
  const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes).trim();
  let document;
  if (text.startsWith('{')) document = JSON.parse(text);
  else {
    const documents = [];
    for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (kind === 'apple') {
        const id = match[1].match(/(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        if ((id?.[1] ?? id?.[2] ?? id?.[3]) === 'serialized-server-data') documents.push(JSON.parse(match[2]));
      } else {
        const expression = /(?:\b(?:var|let|const)\s+ytInitialData|window\[\s*["']ytInitialData["']\s*\])\s*=\s*/g;
        for (const binding of match[2].matchAll(expression)) documents.push(jsonObjectAt(match[2], binding.index + binding[0].length));
      }
    }
    if (!documents.length) throw Error('media_structured_source_missing');
    if (new Set(documents.map(x => JSON.stringify(x))).size !== 1) throw Error('media_structured_source_conflict');
    document = documents[0];
  }
  const result = kind === 'apple' ? extractApplePodcastEpisodes(document, {showId: identity}) : extractYouTubeCatalogVideos(document, {expectedChannelId: identity});
  return {schema_version: '1.0.0', parser_policy: 'saved-media-source-v1', kind, source_sha256: expectedSha256,
    source_bytes: bytes.length, metadata_only: true, editorial_review_complete: false, selection_complete: false, ...result};
}

export function runMediaSourceCli(argv) {
  const args = parseArgs(argv), allowed = new Set(['_', 'kind', 'file', 'sha256', 'identity', 'out']);
  if (args._.length || Object.keys(args).some(k => !allowed.has(k)) || !['kind', 'file', 'sha256', 'identity'].every(k => typeof args[k] === 'string') || ('out' in args && typeof args.out !== 'string'))
    throw Error('usage: --kind apple|youtube --file saved-source --sha256 expected-hash --identity show-or-channel-id [--out new-file]');
  const fd = fs.openSync(args.file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  let bytes;
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size < 1 || stat.size > MAX_RESPONSE_BYTES) throw Error('media_source_size_invalid');
    bytes = fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
  const output = JSON.stringify(parseSavedMediaSource(bytes, {kind: args.kind, identity: args.identity, expectedSha256: args.sha256}), null, 2) + '\n';
  if (args.out) fs.writeFileSync(args.out, output, {flag: 'wx'});
  else process.stdout.write(output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { runMediaSourceCli(process.argv.slice(2)); }
  catch (error) { console.error('MEDIA_SOURCE_PARSE_FAILED: ' + error.message); process.exitCode = 1; }
}
