import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';

export const DURABLE_OPERATION_VERSION = 'durable-operation-v1';
export const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
export function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableJson(value[k])).join(',') + '}';
  if (value === undefined || typeof value === 'function' || typeof value === 'bigint') throw Error('non_json_state');
  return JSON.stringify(value);
}
const hash = value => hashBytes(stableJson(value));
const validKey = key => typeof key === 'string' && /^[a-f0-9]{64}$/.test(key);
const stamp = value => typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
export class OperationBlocked extends Error {
  constructor(code, {retryAt = null, outcomeUnknown = false, recoverable = false} = {}) {
    super(code);
    this.code = code;
    this.retryAt = retryAt;
    this.outcomeUnknown = outcomeUnknown;
    this.recoverable = recoverable;
  }
}

/** Immutable versions + atomic hard-link publication: no mutable head or stale lock file.
 * Shared filesystem durability only. A remote backend must implement the SAME CAS and
 * immutable-object contract; copying a path into a connector argument is not a backend.
 */
export function fileOperationStore(root) {
  fs.mkdirSync(root, {recursive: true});
  const base = fs.realpathSync(root);
  const dir = key => {
    if (!validKey(key)) throw Error('invalid_operation_key');
    const result = path.join(base, key);
    if (fs.existsSync(result) && fs.lstatSync(result).isSymbolicLink()) throw Error('unsafe_store_path');
    fs.mkdirSync(result, {recursive: true}); return result;
  };
  function publish(file, bytes) {
    const temp = file + '.' + randomUUID() + '.tmp';
    const fd = fs.openSync(temp, 'wx', 0o600);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    try { fs.linkSync(temp, file); }
    finally { fs.unlinkSync(temp); }
    const directory = fs.openSync(path.dirname(file), 'r');
    try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
  }
  const load = async key => {
    const folder = dir(key);
    const versions = fs.readdirSync(folder).filter(n => /^\d{8}\.json$/.test(n)).sort();
    let previous = null;
    for (let i = 0; i < versions.length; i++) {
      if (versions[i] !== String(i).padStart(8, '0') + '.json') throw Error('journal_version_gap');
      const file = path.join(folder, versions[i]);
      if (fs.lstatSync(file).isSymbolicLink()) throw Error('unsafe_store_path');
      const record = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (record.version !== i || record.previous_digest !== (previous ? hash(previous) : null)) throw Error('journal_chain_mismatch');
      previous = record;
    }
    return previous;
  };
  return {
    durability: 'shared_filesystem', load,
    async cas(key, expectedVersion, value) {
      const prior = await load(key);
      if ((prior?.version ?? -1) !== expectedVersion) throw Error('CAS_CONFLICT');
      const record = {...structuredClone(value), version: expectedVersion + 1, previous_digest: prior ? hash(prior) : null};
      const file = path.join(dir(key), String(record.version).padStart(8, '0') + '.json');
      try { publish(file, Buffer.from(JSON.stringify(record) + '\n')); }
      catch (error) { if (error.code === 'EEXIST') throw Error('CAS_CONFLICT'); throw error; }
      return record;
    },
    async put(bytes) {
      if (!Buffer.isBuffer(bytes) || !bytes.length) throw Error('actual_bytes_required');
      const sha256 = hashBytes(bytes), file = path.join(dir('0'.repeat(64)), sha256 + '.bin');
      try { publish(file, bytes); } catch (error) { if (error.code !== 'EEXIST') throw error; }
      if (fs.lstatSync(file).isSymbolicLink() || !fs.readFileSync(file).equals(bytes)) throw Error('object_collision_or_corruption');
      return {sha256, bytes: bytes.length};
    },
    async read(ref) {
      if (!validKey(ref?.sha256) || !Number.isInteger(ref.bytes) || ref.bytes < 1) throw Error('invalid_object_reference');
      const file = path.join(dir('0'.repeat(64)), ref.sha256 + '.bin');
      if (fs.lstatSync(file).isSymbolicLink()) throw Error('unsafe_store_path');
      const bytes = fs.readFileSync(file);
      if (bytes.length !== ref.bytes || hashBytes(bytes) !== ref.sha256) throw Error('object_bytes_changed');
      return bytes;
    }
  };
}

export const operationKey = binding => hash({version: DURABLE_OPERATION_VERSION, binding});
export function operationTimingSummary(state) {
  const summary = {completed_ms_by_operation: {}, blocked_ms_by_operation: {}, total_completed_ms: 0, total_blocked_ms: 0};
  for (const event of state?.events || []) {
    if (!Number.isFinite(event?.duration_ms) || event.duration_ms < 0 || !event.operation) continue;
    if (event.type === 'completed') {
      summary.completed_ms_by_operation[event.operation] = (summary.completed_ms_by_operation[event.operation] || 0) + event.duration_ms;
      summary.total_completed_ms += event.duration_ms;
    } else if (event.type === 'blocked') {
      summary.blocked_ms_by_operation[event.operation] = (summary.blocked_ms_by_operation[event.operation] || 0) + event.duration_ms;
      summary.total_blocked_ms += event.duration_ms;
    }
  }
  return summary;
}
export function operationView(state) {
  if (!state) return {status: 'not_started', next_operation: null};
  return {status: state.status, next_operation: state.steps[state.cursor] ?? null,
    current_operation: state.current?.id ?? null, revision: state.version,
    retry_at: state.blocker?.retry_at ?? null, blocker: state.blocker?.code ?? null,
    last_progress_at: state.last_progress_at, completed_operations: Object.keys(state.results),
    timing: operationTimingSummary(state),
    complete: state.status === 'complete', publication_complete: state.binding.evidence_type === 'live' && state.results.public_closed?.verified === true};
}

/** One controller drains every eligible dependent step. Persist intent BEFORE effect.
 * Uncertain outcomes are recovered by logical key, never blindly executed again.
 * Save the completion AND next cursor in the same CAS record.
 */
export async function drainOperations({store, binding, steps, owner = randomUUID(), now = () => new Date().toISOString(),
  leaseMs = 120000, maxSteps = 64, maxBlockRecoveries = 2, signal = null, afterSave = null}) {
  if (!store || ['load','cas','put','read'].some(k => typeof store[k] !== 'function')) throw Error('durable_store_required');
  if (!binding || !Array.isArray(steps) || !steps.length || steps.some(s => !/^[a-z][a-z0-9_-]*$/.test(s.id)) || new Set(steps.map(s => s.id)).size !== steps.length) throw Error('unique_operations_required');
  if (!Number.isInteger(leaseMs) || leaseMs < 1 || !Number.isInteger(maxSteps) || maxSteps < 1 ||
      !Number.isInteger(maxBlockRecoveries) || maxBlockRecoveries < 0) throw Error('invalid_execution_bounds');
  const key = operationKey(binding), ids = steps.map(s => s.id), signalHash = hash(signal);
  let state = await store.load(key), executed = 0;
  const blockRecoveryCounts = {};
  async function save(next) {
    state = await store.cas(key, state?.version ?? -1, next);
    if (afterSave) await afterSave(operationView(state));
  }
  const time = () => { const value = now(); if (!stamp(value)) throw Error('timezone_timestamp_required'); return value; };
  if (!state) await save({schema_version: DURABLE_OPERATION_VERSION, binding, steps: ids, cursor: 0,
    status: 'ready', current: null, blocker: null, results: {}, attempts: {}, last_progress_at: time(), events: []});
  if (stableJson(state.binding) !== stableJson(binding) || stableJson(state.steps) !== stableJson(ids)) throw Error('pinned_execution_changed');
  if (state.status === 'complete') return {key, state, executed, ...operationView(state)};
  if (state.status === 'blocked' && state.blocker.signal_digest === signalHash &&
      (!state.blocker.retry_at || Date.parse(state.blocker.retry_at) > Date.parse(time()))) return {key, state, executed, ...operationView(state)};
  while (state.cursor < steps.length && executed < maxSteps) {
    const step = steps[state.cursor], start = time();
    if (state.current?.lease && Date.parse(state.current.lease.expires_at) > Date.parse(start)) return {key, state, executed, ...operationView(state)};
    const recovering = state.current !== null;
    const logicalKey = hash({job: key, step: step.id});
    const handler = recovering ? (step.recover || (step.replaySafe ? step.run : null)) : step.run;
    if (typeof handler !== 'function') {
      await save({...state, status: 'blocked', blocker: {code: recovering ? 'OUTCOME_RECONCILIATION_REQUIRED' : 'EXECUTION_ADAPTER_REQUIRED',
        signal_digest: signalHash, retry_at: null}, current: state.current ? {...state.current, lease: null} : null});
      return {key, state, executed, ...operationView(state)};
    }
    const fence = (state.current?.fence || 0) + 1;
    await save({...state, status: 'running', blocker: null,
      current: {id: step.id, logical_key: logicalKey, fence, lease: {owner, expires_at: new Date(Date.parse(start) + leaseMs).toISOString()}},
      attempts: {...state.attempts, [step.id]: (state.attempts[step.id] || 0) + 1},
      events: [...state.events, {at: start, operation: step.id, type: recovering ? 'recovery_requested' : 'requested', key: logicalKey}]});
    let result;
    try {
      result = await handler({key: logicalKey, binding: structuredClone(binding), results: structuredClone(state.results),
        put: bytes => store.put(bytes), read: ref => store.read(ref), recovering});
      stableJson(result);
      if (step.validate) await step.validate(result, {results: state.results, binding});
    } catch (error) {
      const live = await store.load(key);
      if (live.current?.lease?.owner !== owner || live.current?.fence !== fence) throw Error('STALE_EXECUTOR');
      state = live;
      const retryAt = error instanceof OperationBlocked ? error.retryAt : null;
      if (retryAt !== null && !stamp(retryAt)) throw Error('invalid_retry_timestamp');
      const blockedAt = time();
      const durationMs = Math.max(0, Date.parse(blockedAt) - Date.parse(start));
      await save({...state, status: 'blocked', current: {...state.current, lease: null},
        blocker: {code: error.code || error.message, outcome_unknown: !(error instanceof OperationBlocked) || error.outcomeUnknown,
          retry_at: retryAt, signal_digest: signalHash, recoverable: error instanceof OperationBlocked && error.recoverable === true},
        events: [...state.events, {at: blockedAt, operation: step.id, type: 'blocked', reason: error.code || error.message, duration_ms: durationMs}]});
      const recoveries = blockRecoveryCounts[step.id] || 0;
      if (error instanceof OperationBlocked && error.recoverable === true && typeof step.resolveBlock === 'function' &&
          recoveries < maxBlockRecoveries && (!retryAt || Date.parse(retryAt) <= Date.parse(time()))) {
        blockRecoveryCounts[step.id] = recoveries + 1;
        let resolution = null;
        try {
          resolution = await step.resolveBlock({code: error.code, outcomeUnknown: error.outcomeUnknown,
            key: logicalKey, binding: structuredClone(binding), results: structuredClone(state.results),
            put: bytes => store.put(bytes), read: ref => store.read(ref), recovery_attempt: blockRecoveryCounts[step.id]});
          stableJson(resolution);
        } catch {
          resolution = null;
        }
        if (resolution?.resolved === true) {
          const action = resolution.action || 'recover';
          if (action === 'retry' && (error.outcomeUnknown || step.retrySafe !== true))
            throw Error('unsafe_block_retry_requested');
          if (action === 'recover' && typeof step.recover !== 'function' && step.replaySafe !== true)
            throw Error('block_recovery_adapter_required');
          const clearedAt = time();
          await save({...state, status: 'ready', blocker: null,
            current: action === 'retry' ? null : {...state.current, lease: null},
            events: [...state.events, {at: clearedAt, operation: step.id, type: 'blocker_cleared',
              reason: error.code, action, recovery_attempt: blockRecoveryCounts[step.id]}]});
          continue;
        }
      }
      return {key, state, executed, ...operationView(state)};
    }
    const live = await store.load(key);
    if (live.current?.lease?.owner !== owner || live.current?.fence !== fence) throw Error('STALE_EXECUTOR');
    state = live;
    const completedAt = time();
    const durationMs = Math.max(0, Date.parse(completedAt) - Date.parse(start));
    await save({...state, cursor: state.cursor + 1, status: state.cursor + 1 === steps.length ? 'complete' : 'ready',
      current: null, blocker: null, results: {...state.results, [step.id]: result}, last_progress_at: completedAt,
      events: [...state.events, {at: completedAt, operation: step.id, type: 'completed', key: logicalKey, duration_ms: durationMs}]});
    executed++;
  }
  return {key, state, executed, ...operationView(state)};
}
