import test from 'node:test';
import assert from 'node:assert/strict';
import {requiresNativeImageExecutionReceipt} from '../lib/image-gate.mjs';

const lockedDiagram={
  generation_method:'professional_editorial_diagram',renderer_verified:true,visual_reviewed:true,
  accepted_locked:true,lock_status:'accepted_locked'
};

test('verified locked professional editorial diagrams do not require native generation receipts',()=>{
  assert.equal(requiresNativeImageExecutionReceipt('2026-09-29',lockedDiagram),false);
});

test('native receipt remains required when professional diagram verification is incomplete',()=>{
  for(const key of ['renderer_verified','visual_reviewed','accepted_locked']){
    const entry={...lockedDiagram,[key]:false};
    assert.equal(requiresNativeImageExecutionReceipt('2026-09-29',entry),true);
  }
  assert.equal(requiresNativeImageExecutionReceipt('2026-09-29',{...lockedDiagram,lock_status:'pending'}),true);
});

test('native image generation remains receipt-bound for modern editions',()=>{
  assert.equal(requiresNativeImageExecutionReceipt('2026-09-29',{generation_method:'openai_image_generation'}),true);
});
