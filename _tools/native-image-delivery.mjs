#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {buildNativeImageDelivery,assertNativeImageTaskPrompt,planNativeImageContinuation} from '../_generator/lib/native-image-delivery.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function writeExact(file, text) {
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file, 'utf8') !== text) throw Error('refuse_changed_delivery_overwrite');
    return;
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, text, {flag: 'wx'});
}
try {
  const {positionals,values:v} = parseArgs({allowPositionals:true,options:{execution:{type:'string'},out:{type:'string'},delivery:{type:'string'},prompt:{type:'string'},attempts:{type:'string'},capability:{type:'string'}}});
  if (!v.execution) throw Error('--execution required');
  const e = read(v.execution);
  if (positionals[0] === 'prepare') {
    if (!v.out) throw Error('--out required');
    const d = buildNativeImageDelivery(e);
    writeExact(v.out, JSON.stringify(d, null, 2)+'\n');
    console.log(JSON.stringify({status:'DELIVERY_PREPARED',path:v.out,task_prompt_sha256:d.task_prompt_sha256,image_generation_started:false}));
  } else if (positionals[0] === 'validate-task') {
    if (!v.delivery || !v.prompt) throw Error('--delivery and --prompt required');
    console.log(JSON.stringify(assertNativeImageTaskPrompt(fs.readFileSync(v.prompt,'utf8'),read(v.delivery),e)));
  } else if (positionals[0] === 'plan') {
    if (!v.attempts) throw Error('--attempts required');
    console.log(JSON.stringify(planNativeImageContinuation(e,read(v.attempts),v.capability?read(v.capability):null)));
  } else throw Error('Use prepare, validate-task or plan');
} catch (error) { console.error(error.message); process.exitCode=1; }
