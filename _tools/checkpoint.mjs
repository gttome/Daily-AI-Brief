import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {CheckpointStore,repairPlan} from '../_generator/lib/checkpoints.mjs';
const [command,...rest]=process.argv.slice(2),args=parseArgs(rest);
let result;
if(command==='repair-plan')result=repairPlan(args.kind);
else{
 if(!args.file)throw Error('Requires --file manifest.json');
 const m=JSON.parse(fs.readFileSync(path.resolve(args.file),'utf8'));
 const store=new CheckpointStore({directory:m.directory,root:m.root||process.cwd(),attemptId:m.attempt_id,pipelineVersion:m.pipeline_version});
 if(command==='save')result=store.save(m.stage,{inputs:m.inputs,outputs:m.outputs});
 else if(command==='inspect'){result={stage:m.stage,valid:!!store.valid(m.stage,{inputs:m.inputs})};if(!result.valid)process.exitCode=1;}
 else throw Error('Expected save, inspect or repair-plan');
}
console.log(JSON.stringify(result,null,2));
