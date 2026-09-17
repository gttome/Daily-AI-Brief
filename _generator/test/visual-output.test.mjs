import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {inspectPng,visualAssetDecision} from '../lib/visual-output.mjs';

let table=null;function crc32(buffer){if(!table){table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}}let c=0xffffffff;for(const byte of buffer)c=table[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out;}
function png(width=1200,height=630){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=0;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
 const row=Buffer.alloc(width+1,255);row[0]=0;const raw=Buffer.concat(Array.from({length:height},()=>row));
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const rich={layout:'process',title:'Evidence-grounded workflow with approval and feedback',alt_text:'A detailed process diagram showing evidence retrieval, verification, planning, controlled execution, approval, and feedback.',nodes:[{id:'a',label:'Retrieve',detail:'Collect bounded primary evidence.'},{id:'b',label:'Verify',detail:'Check source, date, novelty, and limitations.'},{id:'c',label:'Plan',detail:'Create a constrained evidence-based plan.'},{id:'d',label:'Execute',detail:'Use only authorized tools and operations.'},{id:'e',label:'Approve',detail:'Require human approval for protected actions.'},{id:'f',label:'Measure',detail:'Record outcomes and feed evidence forward.'}],edges:[{from:'a',to:'b'},{from:'b',to:'c'},{from:'c',to:'d'},{from:'d',to:'e'},{from:'e',to:'f'}],callouts:[{anchor:'b',text:'Unsupported claims stop here.'}],feedback_loops:[{from:'f',to:'b'}],groups:[{label:'Controlled execution',members:['c','d','e']}]};

test('PNG integrity gate validates dimensions, chunk CRCs, IEND and hash',()=>{
 const result=inspectPng(png());assert.equal(result.pass,true);assert.equal(result.width,1200);assert.equal(result.height,630);assert.match(result.sha256,/^[a-f0-9]{64}$/);
});
test('PNG integrity gate rejects small, truncated, or corrupted output',()=>{
 assert.equal(inspectPng(png(600,315)).pass,false);
 const valid=png();assert.equal(inspectPng(valid.subarray(0,valid.length-8)).pass,false);
 const corrupt=Buffer.from(valid);corrupt[40]^=1;assert.equal(inspectPng(corrupt).pass,false);
});
test('visual path is deterministic only after parity plus PNG verification and otherwise selects approved fallback',()=>{
 assert.equal(visualAssetDecision(rich,{sep17ParityApproved:true,pngRendererVerified:true}).path,'deterministic');
 assert.equal(visualAssetDecision(rich,{hasApprovedFallback:true}).path,'generative_fallback');
 assert.equal(visualAssetDecision(rich).path,'blocked');
});
