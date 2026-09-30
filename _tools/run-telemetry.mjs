import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parseArgs} from '../_generator/lib/util.mjs';
import {RunTelemetry,openTelemetry} from '../_generator/lib/run-telemetry.mjs';
const [action,...rest]=process.argv.slice(2),a=parseArgs(rest);
if(!a.file)throw Error('--file private append-only journal required');
const t=action==='init'?new RunTelemetry(a.file,{editionId:'dab-edition-'+a.date,attemptId:a.attempt,baselineSha:a.sha}):openTelemetry(a.file);
let result;
if(action==='init'){t.lifecycle('started');result={initialized:true};}
else if(action==='begin')result={span_id:t.begin(a.stage)};
else if(action==='end'){t.end(a.id,a.status||'completed');result={recorded:true};}
else if(action==='observe'){t.observe(a.field,JSON.parse(a.value),a.evidence);result={recorded:true};}
else if(action==='reuse'){t.reuse(a.stage,a.checkpoint);result={recorded:true};}
else if(action==='lifecycle'){t.lifecycle(a.phase);result={recorded:true};}
else if(action==='run'){const i=rest.indexOf('--');if(i<0)throw Error('Use -- followed by executable and arguments');const argv=rest.slice(i+1);const id=t.begin(a.stage);const r=spawnSync(argv[0],argv.slice(1),{stdio:'inherit',env:process.env});t.end(id,r.status===0?'completed':'failed');if(r.status!==0)process.exitCode=r.status||1;result={recorded:true};}
else if(action==='export'){if(!a.out)throw Error('--out required');result=t.snapshot();fs.writeFileSync(a.out,JSON.stringify(result,null,2)+'\n');}
else throw Error('Unknown telemetry action');
console.log(JSON.stringify(result));
