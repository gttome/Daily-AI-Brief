#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {evaluateStartupSentinel} from '../_generator/lib/startup-sentinel.mjs';

const argv=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--'))continue;
  const key=argv[i].slice(2),next=argv[i+1];
  if(next!==undefined&&!next.startsWith('--')){args[key]=next;i++;}else args[key]=true;
}
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const write=(file,value)=>{
  const target=path.resolve(file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');
};
function jsonFiles(dir){
  if(!dir||!fs.existsSync(dir))return [];
  const values=[];
  for(const name of fs.readdirSync(dir).sort()){
    if(!name.endsWith('.json'))continue;
    try{values.push(read(path.join(dir,name)));}catch{}
  }
  return values;
}
if(!args.pointer)throw Error('pointer_required');
const pointer=read(args.pointer);
const runRoot=args['run-root']?path.resolve(args['run-root']):null;
const executionKey=pointer.execution_key||null;
const executionId=pointer.execution_id||null;
const events=runRoot&&executionKey
  ? jsonFiles(path.join(runRoot,'_records/edition-execution/events',executionKey))
  : [];
const workerResults=runRoot&&executionId
  ? jsonFiles(path.join(runRoot,'_records/edition-execution/worker-results',executionId))
  : [];
const result=evaluateStartupSentinel({
  pointer,events,workerResults,
  now:args.now||new Date().toISOString(),
  timeZone:args.timezone||'America/Chicago',
  scheduledHour:Number(args['scheduled-hour']||19),
  minimumMinute:Number(args['minimum-minute']||3)
});
if(args.output)write(args.output,result);
process.stdout.write(JSON.stringify(result,null,2)+'\n');
