#!/usr/bin/env node
import {consumeImageChunkRequests} from '../_generator/lib/image-chunk-bridge.mjs';

const argv=process.argv.slice(2),command=argv.shift(),args={};
for(let i=0;i<argv.length;i++){
  if(!argv[i].startsWith('--')) continue;
  const key=argv[i].slice(2),next=argv[i+1];
  if(next!==undefined&&!next.startsWith('--')){args[key]=next;i++;}else args[key]=true;
}
try{
  if(command!=='consume') throw Error('expected_consume');
  const value=consumeImageChunkRequests({runRoot:args['run-root']||'.',executionId:args['execution-id'],branch:args.branch,
    writerGeneration:Number(args['writer-generation'])});
  process.stdout.write(JSON.stringify(value,null,2)+'\n');
}catch(error){
  process.stderr.write(JSON.stringify({result:'FAIL',error:error.message})+'\n');
  process.exitCode=1;
}
