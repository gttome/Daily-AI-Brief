#!/usr/bin/env node
import {consumeTask17} from '../_generator/lib/repository-task-consumer.mjs';
const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1]]:null).filter(Boolean));
try{
  const r=consumeTask17({runRoot:args['run-root']||'.',requestPath:args.request});
  process.stdout.write(JSON.stringify(r,null,2)+'\n');
}catch(e){
  console.error(e?.stack||String(e));
  process.exit(2);
}
