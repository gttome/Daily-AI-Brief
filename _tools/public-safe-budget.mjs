#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {applyPublicSafeBudgetDelta,newPublicSafeBudget,setPublicSafeRunWallSeconds,validatePublicSafeBudget} from '../_generator/lib/public-safe-budget.mjs';

const {positionals,values}=parseArgs({allowPositionals:true,options:{
  file:{type:'string'},out:{type:'string'},'execution-id':{type:'string'},'edition-id':{type:'string'},'execution-key':{type:'string'},
  counter:{type:'string',multiple:true},delta:{type:'string',multiple:true},'wall-seconds':{type:'string'},at:{type:'string'}
}});
const command=positionals[0],target=values.out||values.file;
const write=(file,value)=>{fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});fs.writeFileSync(path.resolve(file),JSON.stringify(value,null,2)+'\n');};
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
let record;
if(command==='init'){
  if(!target)throw Error('--out required');
  record=newPublicSafeBudget({
    execution_id:values['execution-id'],edition_id:values['edition-id'],execution_key:values['execution-key'],
    started_at:values.at||new Date().toISOString()
  });
}else if(command==='add'){
  if(!values.file)throw Error('--file required');
  const counters=Array.isArray(values.counter)?values.counter:values.counter?[values.counter]:[];
  const deltas=Array.isArray(values.delta)?values.delta:values.delta?[values.delta]:[];
  if(!counters.length||counters.length!==deltas.length)throw Error('matching --counter and --delta values required');
  const changes={};
  for(let i=0;i<counters.length;i++)changes[counters[i]]=(changes[counters[i]]||0)+Number(deltas[i]);
  record=applyPublicSafeBudgetDelta(read(values.file),changes,values.at||new Date().toISOString());
}else if(command==='wall'){
  if(!values.file||values['wall-seconds']===undefined)throw Error('--file and --wall-seconds required');
  record=setPublicSafeRunWallSeconds(read(values.file),Number(values['wall-seconds']),values.at||new Date().toISOString());
}else if(command==='validate'){
  if(!values.file)throw Error('--file required');
  record=read(values.file);
  const errors=validatePublicSafeBudget(record);
  if(errors.length){console.error(errors.join('\n'));process.exit(2);}
}else throw Error('Use init, add, wall, or validate');
if(command!=='validate'&&target)write(target,record);
process.stdout.write(JSON.stringify(record,null,2)+'\n');
