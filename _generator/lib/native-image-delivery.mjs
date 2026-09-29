import {createHash} from 'node:crypto';
import {imageExecutionHash, validateImageGenerationExecution} from './image-execution.mjs';

export const NATIVE_IMAGE_DELIVERY_POLICY = 'visual-only-task-delivery-v1';
const sha = value => createHash('sha256').update(value).digest('hex');
const validHash = value => /^[a-f0-9]{64}$/.test(value || '');
const validBlob = value => /^[a-f0-9]{40}$/.test(value || '');
function assertExecution(execution) {
  const errors = validateImageGenerationExecution(execution);
  if (errors.length) throw Error(errors.join('; '));
}

/** The supervisor keeps this envelope. Only task_prompt becomes the image task's
 * user instruction. No claim is made about hidden platform context or execution.
 * The original frozen request is never rewritten by this delivery projection.
 */
export function buildNativeImageDelivery(execution) {
  assertExecution(execution);
  const p = execution.sealed_story_packet;
  const taskPrompt = [
    'Create exactly one NEW professional textbook illustration of this subject:',
    p.headline,
    '', 'Visual composition:', p.visual_brief,
    '', 'Verified factual scope:', ...p.verified_visual_facts,
    '', 'Conceptual explanatory elements:', ...p.generic_conceptual_elements,
    '', 'Essential readable labels; include every label verbatim:',
    ...p.allowed_image_text.map(label => `- ${label}`),
    '', 'Factual and visual restrictions:', ...p.prohibited_specifics,
    '', 'Use only the subject, facts, concepts and restrictions above as image content.',
    'Create the illustration itself, not a scene about producing or reviewing illustrations.',
    'Return only the single finished illustration.'
  ].join('\n');
  return {
    schema_version: '1.0.0', policy_id: NATIVE_IMAGE_DELIVERY_POLICY,
    request_sha256: imageExecutionHash(execution),
    story_id: p.story_id, candidate_id: p.candidate_id,
    task_prompt: taskPrompt, task_prompt_sha256: sha(taskPrompt),
    runtime_context_isolation: 'not_asserted', manual_intervention_allowed: false,
    // This is the native tool's actual interface, NOT a text prompt carrier.
    native_tool_arguments: {prompt: null, size: '1536x1024', n: 1,
      transparent_background: false, is_style_transfer: false,
      referenced_image_ids: null}
  };
}

export function validateNativeImageDelivery(delivery, execution) {
  let expected;
  try { expected = buildNativeImageDelivery(execution); }
  catch (error) { return ['invalid_frozen_execution:' + error.message]; }
  if (!delivery || typeof delivery !== 'object' || Array.isArray(delivery))
    return ['native_image_delivery_required'];
  const errors = [];
  for (const key of Object.keys(delivery))
    if (!(key in expected)) errors.push('unexpected_delivery_field:' + key);
  for (const [key, value] of Object.entries(expected))
    if (JSON.stringify(delivery[key]) !== JSON.stringify(value))
      errors.push('delivery_binding_mismatch:' + key);
  return errors;
}

/** Validate the actual task instruction, not just an earlier saved JSON file.
 * This is necessary but not sufficient evidence of correct native generation.
 */
export function assertNativeImageTaskPrompt(submittedPrompt, delivery, execution) {
  const errors = validateNativeImageDelivery(delivery, execution);
  if (errors.length) throw Error(errors.join('; '));
  if (submittedPrompt !== delivery.task_prompt)
    throw Error('image_task_prompt_must_equal_visual_only_projection');
  return {policy_id: NATIVE_IMAGE_DELIVERY_POLICY,
    request_sha256: delivery.request_sha256,
    task_prompt_sha256: sha(submittedPrompt),
    native_image_generation_started: false,
    scope: 'task_instruction_binding_only_not_generation_or_acceptance'};
}

/** Fail-closed plan for the supervisor. A pending call is never silently replaced;
 * a Library copy is never promoted to a Git capture; a status word cannot approve
 * an image. Existing accepted receipts must be revalidated by the V2 byte gate.
 * Input entries are a small normalized projection of durable attempt records.
 */
export function planNativeImageContinuation(execution, attempts) {
  assertExecution(execution);
  if (!Array.isArray(attempts)) throw Error('durable_attempt_array_required');
  const requestHash = imageExecutionHash(execution);
  const base = {request_sha256: requestHash, manual_intervention_required: false,
    image_generation_started: false, accepted_locked: false};
  if (attempts.length > 4) throw Error('image_attempt_budget_exceeded');
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    if (a?.attempt !== i + 1 || a.request_sha256 !== requestHash)
      throw Error('attempt_sequence_or_request_binding_invalid');
    if (i < attempts.length - 1 && !['rejected','unrecoverable'].includes(a.disposition))
      throw Error('later_attempt_before_prior_terminal_failure');
  }
  if (!attempts.length) return {...base, next_action: 'PREPARE_IMAGE_ONLY_TASK', attempt: 1};
  // Inspect every prior attempt, not only the latest narrative record.
  for (const a of attempts) {
    if (a.disposition === 'accepted_locked')
      return {...base, next_action: 'VERIFY_ACCEPTED_CHECKPOINT', attempt: a.attempt};
    if (a.disposition === 'unrecoverable') {
      const r = a.recovery;
      if (!r || r.reason_code !== 'TASK_RESULT_UNRECOVERABLE' ||
          r.task_invocation_observed !== true ||
          r.exhaustive_supported_search !== true ||
          r.outcome_observable !== false ||
          !r.checked_at || Number.isNaN(Date.parse(r.checked_at)))
        throw Error('unrecoverable_attempt_evidence_invalid');
      continue;
    }
    if (!a.generation?.artifact_id || !a.generation?.call_id || !validHash(a.generation?.raw_sha256))
      return {...base, next_action: 'RECOVER_OR_RECONCILE_EXISTING_ATTEMPT', attempt: a.attempt};
    const capture = a.git_capture;
    if (!capture || capture.read_back_verified !== true ||
        capture.sha256 !== a.generation.raw_sha256 || !validBlob(capture.git_blob_sha))
      return {...base, next_action: 'CAPTURE_EXISTING_RAW', attempt: a.attempt};
    if (a.disposition !== 'rejected' || !a.review?.rejection_record_path ||
        a.review.raw_sha256 !== a.generation.raw_sha256)
      return {...base, next_action: 'REVIEW_EXISTING_RAW', attempt: a.attempt};
  }
  if (attempts.length === 4) return {...base, next_action: 'ATTEMPT_LIMIT_EXHAUSTED', attempt: 4};
  return {...base, next_action: 'PREPARE_IMAGE_ONLY_TASK', attempt: attempts.length + 1};
}
