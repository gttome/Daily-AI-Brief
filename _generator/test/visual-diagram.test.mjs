import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseVisualPath,renderVisualSvg,validateVisualSpec,visualQualityGate,VISUAL_CANVAS} from '../lib/visual-diagram.mjs';

const rich={
 layout:'process',title:'Evidence-grounded agent workflow with review controls',subtitle:'A story-specific mechanism rather than a decorative flowchart',
 alt_text:'A six-stage evidence-grounded agent workflow showing retrieval, verification, planning, tool execution, human approval, and feedback.',
 nodes:[
  {id:'a',label:'Retrieve evidence',detail:'Collect only bounded primary-source evidence.'},
  {id:'b',label:'Verify claims',detail:'Check source, date, novelty, and limitations.'},
  {id:'c',label:'Plan action',detail:'Translate verified facts into a constrained plan.'},
  {id:'d',label:'Use tools',detail:'Execute only authorized deterministic operations.'},
  {id:'e',label:'Human approval',detail:'Pause state-changing actions at the approval gate.'},
  {id:'f',label:'Learn from outcome',detail:'Record evidence and feed measured results forward.'}
 ],
 edges:[
  {from:'a',to:'b',label:'source evidence'},{from:'b',to:'c',label:'verified facts'},{from:'c',to:'d',label:'bounded plan'},{from:'d',to:'e',label:'proposed action'},{from:'e',to:'f',label:'approved result'}
 ],
 callouts:[{anchor:'b',text:'Unsupported claims stop here.'},{anchor:'e',text:'Administrative or state-changing work remains owner controlled.'}],
 feedback_loops:[{from:'f',to:'b'}],groups:[{label:'Governed execution',members:['c','d','e']}]
};

test('rich visual spec passes the September 17 explanatory-density gate',()=>{
 assert.deepEqual(validateVisualSpec(rich),[]);
 const gate=visualQualityGate(rich);assert.equal(gate.pass,true);assert.equal(gate.baseline,'2026-09-17');
});

test('renderer emits a white 1200x630 accessible SVG with story-specific labels',()=>{
 const svg=renderVisualSvg(rich);
 assert.equal(VISUAL_CANVAS.width,1200);assert.equal(VISUAL_CANVAS.height,630);
 assert.match(svg,/width="1200" height="630"/);assert.match(svg,/fill="#ffffff"/);assert.match(svg,/aria-label=/);assert.match(svg,/Human approval/);assert.match(svg,/Unsupported claims stop here/);
});

test('production path remains on high-quality generative fallback until parity and PNG gates are verified',()=>{
 assert.equal(chooseVisualPath(rich).path,'generative_fallback');
 assert.equal(chooseVisualPath(rich,{sep17ParityApproved:true}).reason,'png_renderer_not_verified');
 assert.equal(chooseVisualPath(rich,{sep17ParityApproved:true,pngRendererVerified:true}).path,'deterministic');
});

test('simplistic low-density diagrams fail rather than replacing September 17 quality',()=>{
 const thin={layout:'process',title:'Simple process diagram',alt_text:'A basic process diagram that intentionally lacks enough explanatory detail to pass the production quality gate.',nodes:[
  {id:'a',label:'One',detail:'Short detail'},{id:'b',label:'Two',detail:'Short detail'},{id:'c',label:'Three',detail:'Short detail'},{id:'d',label:'Four',detail:'Short detail'}
 ],edges:[{from:'a',to:'b'},{from:'b',to:'c'},{from:'c',to:'d'}]};
 assert.equal(visualQualityGate(thin).pass,false);
 assert.equal(chooseVisualPath(thin,{sep17ParityApproved:true,pngRendererVerified:true}).path,'generative_fallback');
});
