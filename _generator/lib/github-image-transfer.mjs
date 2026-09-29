import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectPng, inspectWebp} from './visual-output.mjs';

export const IMAGE_TRANSFER_POLICY = 'github-image-file-transfer-v1';
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const blobSha = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const hex = (value, n) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${n}}$`).test(value);
const encodePath = value => value.split('/').map(encodeURIComponent).join('/');
const err = (code, details = {}) => Object.assign(new Error(code), {code, ...details});

function validateTarget(repository, branch, destination, expectedSha256) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '')) throw err('INVALID_REPOSITORY');
  if (typeof branch !== 'string' || /[\s~^:?*\[\\\x00-\x1f]/.test(branch) ||
      branch.includes('..') || branch.includes('@{') || branch.endsWith('/') ||
      branch.split('/').some(x => !x || x.startsWith('.') || x.endsWith('.') || x.endsWith('.lock')))
    throw err('INVALID_BRANCH');
  const proof = branch.startsWith('image-transfer-proof/');
  if (!proof && !/^editorial-handoff\/(qualification|production)\/[A-Za-z0-9_.-]+$/.test(branch))
    throw err('BRANCH_NOT_ALLOWED');
  if (typeof destination !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(destination) ||
      destination.split('/').some(x => !x || x === '.' || x === '..')) throw err('INVALID_IMAGE_PATH');
  const raw = /^_records\/image-attempts\/[A-Za-z0-9_-]+\/m\d{2}\/attempt-[1-4]\/raw\.(png|webp)$/;
  const final = /^briefs\/images\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9_-]+\.(png|webp)$/;
  const test = /^_records\/image-transfer-proof\/[A-Za-z0-9_-]+\/raw\.(png|webp)$/;
  if (proof ? !test.test(destination) : !(raw.test(destination) || final.test(destination)))
    throw err('IMAGE_PATH_NOT_ALLOWED');
  if (!hex(expectedSha256, 64)) throw err('EXPECTED_IMAGE_SHA256_REQUIRED');
}

/** Bytes never pass through model-visible Base64 or text-file wrappers. */
async function readLocalImage(sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath) throw err('LOCAL_IMAGE_PATH_REQUIRED');
  const file = await fs.open(sourcePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > MAX_IMAGE_BYTES) throw err('INVALID_IMAGE_SIZE');
    const bytes = await file.readFile();
    if (bytes.length !== stat.size) throw err('SOURCE_CHANGED_DURING_READ');
    return bytes;
  } finally { await file.close(); }
}

/** Fixed-origin authenticated transport; no redirects, secret logging or fallback endpoints.
 * HTTP denials and write uncertainty are never automatically retried.
 */
export function createGitHubImageClient({token, fetchImpl = globalThis.fetch, timeoutMs = 30000} = {}) {
  if (typeof token !== 'string' || !token.trim()) throw err('CAPABILITY_BLOCKED_AUTHENTICATED_FILE_HOST_REQUIRED');
  if (typeof fetchImpl !== 'function') throw err('CAPABILITY_BLOCKED_HTTP_TRANSPORT_REQUIRED');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw err('INVALID_TIMEOUT');
  const metrics = {requests: 0, write_requests: 0, raw_reads: 0};
  async function request(method, route, {raw = false, body, allow404 = false} = {}) {
    if (!route.startsWith('/repos/') || route.includes('..') || /[\r\n]/.test(route)) throw err('INVALID_API_ROUTE');
    metrics.requests++; if (method === 'PUT') metrics.write_requests++; if (raw) metrics.raw_reads++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status = null;
    try {
      const response = await fetchImpl('https://api.github.com' + route, {
        method, redirect: 'error', signal: controller.signal,
        headers: {Authorization: `Bearer ${token}`, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github.object+json',
          'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'User-Agent': 'Daily-AI-Brief-image-transfer'},
        ...(body ? {body: JSON.stringify(body)} : {})
      });
      status = response.status;
      if (status === 404 && allow404) { await response.body?.cancel(); return null; }
      if (!response.ok) {
        await response.body?.cancel();
        throw err(status === 401 || status === 403 ? 'TRANSFER_DENIED' : status === 409 || status === 422 ? 'TRANSFER_CONFLICT' : 'GITHUB_HTTP_ERROR', {http_status: status});
      }
      const limit = raw ? MAX_IMAGE_BYTES : 1024 * 1024;
      if (Number(response.headers.get('content-length') || 0) > limit) throw err('RESPONSE_TOO_LARGE');
      const parts = []; let size = 0;
      for await (const part of response.body || []) {
        size += part.length; if (size > limit) throw err('RESPONSE_TOO_LARGE');
        parts.push(Buffer.from(part));
      }
      const bytes = Buffer.concat(parts);
      return raw ? bytes : JSON.parse(bytes.toString('utf8'));
    } catch (error) {
      if (error.code && ['TRANSFER_DENIED','TRANSFER_CONFLICT','GITHUB_HTTP_ERROR'].includes(error.code)) throw error;
      // A successful remote commit with a lost response must be reconciled, not repeated blindly.
      throw err(method === 'PUT' ? 'WRITE_OUTCOME_UNCERTAIN_RECONCILE_BEFORE_RETRY' : 'TRANSFER_READ_FAILED', {http_status: status});
    } finally { clearTimeout(timer); }
  }
  return {
    metrics,
    branch: (repo, branch) => request('GET', `/repos/${repo}/branches/${encodeURIComponent(branch)}`),
    metadata: (repo, destination, ref) => request('GET', `/repos/${repo}/contents/${encodePath(destination)}?ref=${encodeURIComponent(ref)}`, {allow404: true}),
    create: (repo, destination, body) => request('PUT', `/repos/${repo}/contents/${encodePath(destination)}`, {body}),
    raw: (repo, destination, ref) => request('GET', `/repos/${repo}/contents/${encodePath(destination)}?ref=${encodeURIComponent(ref)}`, {raw: true})
  };
}

/** One reusable immutable upload: file -> one Contents PUT -> raw bytes at returned commit.
 * Same-path identical bytes are read and reused. Different bytes are NEVER overwritten.
 * This records transport success, not editorial acceptance or publication.
 */
export async function transferImageFile({sourcePath, repository, branch, destination, expectedSha256,
  token, fetchImpl, timeoutMs, client, knownSafetyBlock = false} = {}) {
  if (knownSafetyBlock) throw err('SAFETY_BLOCK_REQUIRES_RESOLUTION_NO_ALTERNATE_TRANSPORT');
  validateTarget(repository, branch, destination, expectedSha256);
  const bytes = await readLocalImage(sourcePath);
  if (sha256(bytes) !== expectedSha256) throw err('SOURCE_HASH_MISMATCH');
  const inspection = destination.endsWith('.png') ? inspectPng(bytes, {minimumWidth: 1, minimumHeight: 1}) : inspectWebp(bytes, {minimumWidth: 1, minimumHeight: 1});
  if (!inspection.pass) throw err('IMAGE_STRUCTURE_INVALID');
  const expectedBlob = blobSha(bytes);
  const api = client || createGitHubImageClient({token, fetchImpl, timeoutMs});
  const before = {...api.metrics};
  const target = await api.branch(repository, branch);
  if (target?.name !== branch || target?.protected !== false || !hex(target?.commit?.sha, 40)) throw err('UNPROTECTED_EXPLICIT_BRANCH_REQUIRED');
  const baseline = target.commit.sha;
  const old = await api.metadata(repository, destination, baseline);
  let commit = baseline, reused = false;
  if (old !== null) {
    if (old.type !== 'file' || old.sha !== expectedBlob || old.size !== bytes.length) throw err('IMMUTABLE_IMAGE_PATH_CONFLICT');
    // For >1 MiB images content may be empty. Identity is metadata; verification is RAW.
    reused = true;
  } else {
    const created = await api.create(repository, destination, {
      message: `Store image ${destination} (${expectedSha256.slice(0, 12)})`,
      branch, content: bytes.toString('base64')
    });
    if (!hex(created?.commit?.sha, 40) || created?.content?.sha !== expectedBlob || created?.content?.path !== destination)
      throw err('WRITE_RESPONSE_IDENTITY_MISMATCH');
    commit = created.commit.sha;
  }
  let observed;
  try { observed = await api.raw(repository, destination, commit); }
  catch (error) { throw err('COMMITTED_IMAGE_READBACK_PENDING', {commit_sha: commit, path: destination, cause_code: error.code}); }
  if (!Buffer.isBuffer(observed) || !observed.equals(bytes) || sha256(observed) !== expectedSha256 || blobSha(observed) !== expectedBlob)
    throw err('COMMITTED_IMAGE_READBACK_MISMATCH', {commit_sha: commit, path: destination});
  const counts = Object.fromEntries(Object.entries(api.metrics).map(([k,v]) => [k, v - (before[k] || 0)]));
  return {schema_version: '1.0.0', policy_id: IMAGE_TRANSFER_POLICY, status: 'TRANSFER_VERIFIED',
    repository, branch, path: destination, commit_sha: commit, baseline_sha: baseline,
    sha256: expectedSha256, git_blob_sha: expectedBlob, bytes: bytes.length,
    width: inspection.width, height: inspection.height, format: destination.endsWith('.png') ? 'png' : 'webp',
    reused, read_back_verified: true, verification_ref: commit, verified_at: new Date().toISOString(),
    api_calls: counts, owner_interventions: [], image_acceptance_asserted: false};
}
