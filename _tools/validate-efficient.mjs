
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {parseArgs} from '../_generator/lib/util.mjs';
import {CheckpointStore,boundedTasks} from '../_generator/lib/checkpoints.mjs';
const args=parseArgs(process.argv.slice(2)),root=process.cwd();
if(!args.attempt)throw Error('Requires --attempt <stable-attempt-id>; reuse it to resume');
const store=new CheckpointStore({root,directory:path.join(root,'.cache/qa-checkpoints'),attemptId:args.attempt,pipelineVersion:'efficiency-v1',
 dependencies:{tests:[],contracts:[],repository:['tests','contracts'],integration:['repository']}});
const outDir=path.relative(root,path.dirname(store.stagePath('tests')));
fs.mkdirSync(outDir,{recursive:true});
const inputs=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).filter(f=>!f.startsWith('.cache/')&&!f.startsWith('_architecture/efficiency-refactor/'));
async function command(stage,argv){
 return store.run(stage,{inputs,execute:async()=>{
   const result=await new Promise((resolve,reject)=>{
     const child=spawn(process.execPath,argv,{cwd:root,stdio:['ignore','pipe','pipe']});let output='';
     child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
     child.on('error',reject);child.on('close',code=>resolve({code,output}));
   });
   const file=path.join(outDir,stage+'-result.json');
   fs.writeFileSync(file,JSON.stringify({stage,...result,observed_at:new Date().toISOString()},null,2)+'\n');
   if(result.code!==0){const failed=path.join(outDir,stage+'-failure-'+Date.now()+'.json');fs.copyFileSync(file,failed);throw Error(stage+' failed; see '+failed);}
   return [file];
 }});
}
const started=Date.now();
try{
 const testFiles=fs.readdirSync('_generator/test').filter(f=>f.endsWith('.test.mjs')).map(f=>'_generator/test/'+f);
 const independent=await boundedTasks([()=>command('tests',['--test',...testFiles]),()=>command('contracts',['_tools/validate-contracts.mjs'])],2);
 if(independent.some(r=>r.status==='rejected'))throw Error(independent.filter(r=>r.status==='rejected').map(r=>r.reason).join('; '));
 await command('repository',['_generator/cli.mjs','validate-repo']);
 await command('integration',['_generator/cli.mjs','integration-check']);
 const summary={result:'PASS',scope:'local_deterministic_qa_only',wall_seconds:(Date.now()-started)/1000,...store.metrics,
  publication_authorized:false,note:'Required candidate Jekyll CI, atomic publisher, Pages and live verification remain mandatory.'};
 fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
