import {createHash} from 'node:crypto';
import {renderVisualSvg,visualQualityGate,VISUAL_CANVAS} from './visual-diagram.mjs';

const PNG_SIGNATURE='89504e470d0a1a0a';
let crcTable=null;
function table(){
 if(crcTable)return crcTable;crcTable=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}return crcTable;
}
function crc32(buffer){let c=0xffffffff;const t=table();for(const byte of buffer)c=t[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}

export function inspectPng(buffer,{minimumWidth=VISUAL_CANVAS.width,minimumHeight=VISUAL_CANVAS.height}={}){
 const errors=[];if(!Buffer.isBuffer(buffer))buffer=Buffer.from(buffer||[]);
 if(buffer.length<33||buffer.subarray(0,8).toString('hex')!==PNG_SIGNATURE)return {pass:false,errors:['invalid_png_signature_or_truncated'],width:null,height:null,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')};
 let offset=8,width=null,height=null,seenIHDR=false,seenIDAT=false,seenIEND=false,chunks=0;
 while(offset+12<=buffer.length){
  const length=buffer.readUInt32BE(offset),type=buffer.subarray(offset+4,offset+8).toString('ascii'),dataStart=offset+8,dataEnd=dataStart+length,crcOffset=dataEnd;
  if(crcOffset+4>buffer.length){errors.push(`truncated_chunk:${type||'unknown'}`);break;}
  const stored=buffer.readUInt32BE(crcOffset),actual=crc32(buffer.subarray(offset+4,dataEnd));if(stored!==actual)errors.push(`crc_mismatch:${type}`);
  chunks++;
  if(type==='IHDR'){if(seenIHDR||length!==13)errors.push('invalid_ihdr');else{seenIHDR=true;width=buffer.readUInt32BE(dataStart);height=buffer.readUInt32BE(dataStart+4);}}
  if(type==='IDAT')seenIDAT=true;
  if(type==='IEND'){seenIEND=true;offset=crcOffset+4;if(offset!==buffer.length)errors.push('bytes_after_iend');break;}
  offset=crcOffset+4;
 }
 if(!seenIHDR)errors.push('missing_ihdr');if(!seenIDAT)errors.push('missing_idat');if(!seenIEND)errors.push('missing_iend');
 if(Number.isInteger(width)&&width<minimumWidth)errors.push(`width_below_minimum:${width}<${minimumWidth}`);
 if(Number.isInteger(height)&&height<minimumHeight)errors.push(`height_below_minimum:${height}<${minimumHeight}`);
 return {pass:errors.length===0,errors,width,height,bytes:buffer.length,chunks,sha256:createHash('sha256').update(buffer).digest('hex')};
}


export function inspectWebp(buffer,{minimumWidth=VISUAL_CANVAS.width,minimumHeight=VISUAL_CANVAS.height}={}){
 const errors=[];if(!Buffer.isBuffer(buffer))buffer=Buffer.from(buffer||[]);
 const sha256=createHash('sha256').update(buffer).digest('hex');
 if(buffer.length<30||buffer.subarray(0,4).toString('ascii')!=='RIFF'||buffer.subarray(8,12).toString('ascii')!=='WEBP')return {pass:false,errors:['invalid_webp_signature_or_truncated'],width:null,height:null,bytes:buffer.length,sha256};
 const declared=buffer.readUInt32LE(4)+8;if(declared!==buffer.length)errors.push('webp_riff_size_mismatch');
 let offset=12,width=null,height=null,seenImage=false,chunks=0;
 while(offset+8<=buffer.length){
  const type=buffer.subarray(offset,offset+4).toString('ascii'),length=buffer.readUInt32LE(offset+4),dataStart=offset+8,dataEnd=dataStart+length,paddedEnd=dataEnd+(length&1);
  if(dataEnd>buffer.length){errors.push(\`truncated_chunk:\${type||'unknown'}\`);break;}
  chunks++;
  if(type==='VP8X'&&length>=10){width=1+buffer.readUIntLE(dataStart+4,3);height=1+buffer.readUIntLE(dataStart+7,3);}
  if(type==='VP8 '&&length>=10){
   if(buffer[dataStart+3]===0x9d&&buffer[dataStart+4]===0x01&&buffer[dataStart+5]===0x2a){width=buffer.readUInt16LE(dataStart+6)&0x3fff;height=buffer.readUInt16LE(dataStart+8)&0x3fff;seenImage=true;}
   else errors.push('invalid_vp8_frame_header');
  }
  if(type==='VP8L'&&length>=5){
   if(buffer[dataStart]===0x2f){const b1=buffer[dataStart+1],b2=buffer[dataStart+2],b3=buffer[dataStart+3],b4=buffer[dataStart+4];width=1+(((b2&0x3f)<<8)|b1);height=1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6));seenImage=true;}
   else errors.push('invalid_vp8l_frame_header');
  }
  offset=paddedEnd;
 }
 if(offset!==buffer.length)errors.push('bytes_after_webp_chunks');
 if(!seenImage&&!buffer.includes(Buffer.from('VP8 '))&&!buffer.includes(Buffer.from('VP8L')))errors.push('missing_webp_image_chunk');
 if(!width||!height)errors.push('missing_webp_dimensions');
 if(width&&width<minimumWidth)errors.push(\`width_below_\${minimumWidth}\`);
 if(height&&height<minimumHeight)errors.push(\`height_below_\${minimumHeight}\`);
 return {pass:errors.length===0,errors:[...new Set(errors)],width,height,bytes:buffer.length,sha256,chunks};
}

export function inspectSvg(spec,svg){
 const errors=[];const gate=visualQualityGate(spec);if(!gate.pass)errors.push(...gate.errors);
 if(typeof svg!=='string'||!svg.startsWith('<svg'))errors.push('svg_required');
 if(!svg.includes(`width="${VISUAL_CANVAS.width}"`)||!svg.includes(`height="${VISUAL_CANVAS.height}"`))errors.push('canvas_mismatch');
 if(!svg.includes('fill="#ffffff"'))errors.push('white_background_required');
 if(!svg.includes('aria-label='))errors.push('svg_accessible_label_required');
 const fontSizes=[...String(svg).matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map(x=>Number(x[1]));if(fontSizes.some(x=>x<12))errors.push('font_size_below_12px');
 if((String(svg).match(/<text\b/g)||[]).length<4)errors.push('insufficient_explanatory_text');
 return {pass:errors.length===0,errors:[...new Set(errors)],quality:gate,sha256:createHash('sha256').update(String(svg)).digest('hex'),bytes:Buffer.byteLength(String(svg),'utf8')};
}

export function buildDeterministicSvg(spec){const svg=renderVisualSvg(spec),inspection=inspectSvg(spec,svg);if(!inspection.pass)throw Error(`visual_svg_gate_failed:${inspection.errors.join(',')}`);return {svg,inspection};}

export function visualAssetDecision(spec,{sep17ParityApproved=false,pngRendererVerified=false,hasApprovedFallback=false}={}){
 const gate=visualQualityGate(spec);
 if(gate.pass&&sep17ParityApproved&&pngRendererVerified)return {path:'deterministic',reason:'quality_parity_and_png_gates_passed',gate};
 if(hasApprovedFallback)return {path:'generative_fallback',reason:!gate.pass?'deterministic_quality_gate_failed':!sep17ParityApproved?'sep17_visual_parity_not_approved':'png_renderer_not_verified',gate};
 return {path:'blocked',reason:!gate.pass?'deterministic_quality_gate_failed':!sep17ParityApproved?'sep17_visual_parity_not_approved':'png_renderer_not_verified',gate};
}
