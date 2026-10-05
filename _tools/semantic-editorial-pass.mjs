#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {buildSemanticEditorialPassReceipt,validateSemanticEditorialPassReceipt} from '../_generator/lib/semantic-editorial-pass.mjs';

const {positionals,values}=parseArgs({allowPositionals:true,options:{
  kernel:{type:'string'},evidence:{type:'string',multiple:true},'execution-id':{type:'string'},out:{type:'string'},at:{type:'string'}
}});
if(positionals[0]!=='receipt')throw Error('Use receipt');
if(!values.kernel||!values.out||!values['execution-id'])throw Error('--kernel, --execution-id and --out required');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const kernel=read(values.kernel);
const evidence=(Array.isArray(values.evidence)?values.evidence:values.evidence?[values.evidence]:[]).map(p=>path.resolve(p)).sort();
if(!evidence.length||evidence.some(p=>!fs.existsSync(p)||!fs.statSync(p).isFile()))throw Error('semantic_editorial_evidence_files_required');
const h=createHash('sha256');
for(const file of evidence){h.update(path.basename(file));h.update('\0');h.update(fs.readFileSync(file));h.update('\0');}
const receipt=buildSemanticEditorialPassReceipt({
  execution_id:values['execution-id'],edition_id:kernel.edition_id,evidence_digest:'sha256:'+h.digest('hex'),
  kernel,performed_at:values.at||new Date().toISOString()
});
const errors=validateSemanticEditorialPassReceipt(receipt);
if(errors.length)throw Error(errors.join('; '));
fs.mkdirSync(path.dirname(path.resolve(values.out)),{recursive:true});
fs.writeFileSync(path.resolve(values.out),JSON.stringify(receipt,null,2)+'\n');
process.stdout.write(JSON.stringify(receipt,null,2)+'\n');
