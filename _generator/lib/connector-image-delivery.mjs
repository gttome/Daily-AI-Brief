import {createHash} from 'node:crypto';
import {OperationBlocked} from './durable-operation.mjs';
const blob = bytes => createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const validSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const safePath = value => typeof value === 'string' && !value.startsWith('/') && !value.includes('\\') &&
  !value.split('/').some(x => !x || x === '.' || x === '..') &&
  (value.startsWith('_records/image-attempts/') || value.startsWith('briefs/images/')) && /\.(png|webp)$/.test(value);

/** Executable complete-byte Git Data path. The host supplies authorized connector
 * functions and a real binary reader. No local token, opaque file-in-text argument,
 * public relay, alternate API or model-visible Base64 is used by this operation.
 */
export function connectorImageDelivery({api, repository, branch, readBytes, now = () => new Date().toISOString()}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !/^editorial-handoff\/(qualification|production)\/[\w.-]+$/.test(branch || '')) throw Error('isolated_handoff_branch_required');
  if (!api || ['fetch','create_blob','create_tree','create_commit','update_ref'].some(k => typeof api[k] !== 'function')) throw Error('complete_connector_required');
  function unwrap(value) {
    if (value?.is_error || value?.error || value?.error_code || Number(value?.error_http_status_code) >= 400) {
      throw new OperationBlocked('CONNECTOR_ACTION_FAILED_OR_DENIED', {outcomeUnknown: true});
    }
    const result = value?.result ?? value;
    if (result?.content && typeof result.content === 'string') return JSON.parse(result.content);
    return result;
  }
  const get = async suffix => unwrap(await api.fetch({url: `https://api.github.com/repos/${repository}/${suffix}`}));
  async function head() {
    const ref = await get('git/ref/heads/' + branch);
    if (!validSha(ref?.object?.sha)) throw Error('invalid_live_ref');
    const commit = await get('git/commits/' + ref.object.sha);
    if (!validSha(commit?.tree?.sha)) throw Error('invalid_live_tree');
    return {sha: ref.object.sha, tree: commit.tree.sha};
  }
  async function find(tree, file) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length; i++) {
      const data = await get('git/trees/' + tree);
      if (data.truncated || !Array.isArray(data.tree)) throw Error('incomplete_git_tree');
      const entry = data.tree.find(e => e.path === parts[i]);
      if (!entry) return null;
      if (!validSha(entry.sha)) throw Error('invalid_tree_entry');
      if (i === parts.length - 1) {
        if (entry.type !== 'blob' || entry.mode !== '100644') throw Error('unsafe_existing_asset');
        return entry.sha;
      }
      if (entry.type !== 'tree') throw Error('unsafe_asset_parent');
      tree = entry.sha;
    }
  }
  const read = async (file, commit) => {
    if (typeof readBytes !== 'function') throw Error('binary_reader_unavailable');
    if (!safePath(file) || !validSha(commit)) throw Error('immutable_safe_read_required');
    const bytes = await readBytes({repository, path: file, commit});
    if (!Buffer.isBuffer(bytes)) throw Error('binary_reader_must_return_exact_bytes');
    return bytes;
  };
  return {read,
    async ensure(file, bytes, {key} = {}) {
      if (!safePath(file) || !Buffer.isBuffer(bytes) || !bytes.length || !/^[a-f0-9]{64}$/.test(key || '')) throw Error('real_image_bytes_and_operation_key_required');
      const expected = blob(bytes), before = await head(), existing = await find(before.tree, file);
      if (existing && existing !== expected) throw Error('immutable_image_conflict');
      let commit = before.sha, reused = Boolean(existing);
      if (!existing) {
        const b = unwrap(await api.create_blob({repository_full_name: repository, content: bytes.toString('base64'), encoding: 'base64'}));
        if (b?.sha !== expected) throw Error('complete_binary_payload_mismatch');
        const t = unwrap(await api.create_tree({repository_full_name: repository, base_tree_sha: before.tree,
          tree_elements: [{path: file, mode: '100644', type: 'blob', sha: expected}]}));
        if (!validSha(t?.sha)) throw Error('invalid_created_tree');
        const c = unwrap(await api.create_commit({repository_full_name: repository, tree_sha: t.sha,
          parent_sha: before.sha, message: 'Persist exact image [' + key + ']'}));
        if (!validSha(c?.sha)) throw Error('invalid_created_commit');
        // Non-force update rejects a competing descendant. Recovery reads the current
        // branch before any new write; an uncertain acknowledgement is never forced.
        const update = unwrap(await api.update_ref({repository_full_name: repository, branch_name: branch, sha: c.sha, force: false}));
        if (update?.success !== true) throw new OperationBlocked('BRANCH_UPDATE_UNCONFIRMED', {outcomeUnknown: true});
        commit = c.sha;
      }
      // Git is content-addressed. Matching the locally computed blob identity to the
      // blob accepted by GitHub and bound into the committed tree is sufficient exact-byte
      // verification. A raw re-read strengthens the receipt when the host exposes a binary
      // reader, but its absence must not block otherwise verified image persistence.
      let readBackVerified = false;
      if (typeof readBytes === 'function') {
        const back = await read(file, commit);
        if (!back.equals(bytes) || blob(back) !== expected) throw Error('committed_image_readback_mismatch');
        readBackVerified = true;
      }
      return {path: file, commit_sha: commit, git_blob_sha: expected, sha256: sha256(bytes), persisted_at: now(),
        persisted_at_scope: 'content_address_verification_time', content_address_verified: true,
        read_back_verified: readBackVerified, verification_mode: readBackVerified ? 'git_content_address_plus_raw_readback' : 'git_content_address',
        reused, owner_interventions: [], transport: 'github_git_data_api'};
    }
  };
}
