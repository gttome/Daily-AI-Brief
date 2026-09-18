import test from 'node:test';
import {execFileSync} from 'node:child_process';

test('under80 preflight scripts parse successfully',()=>{
 for(const file of ['_tools/enrich-metadata-dates.mjs','_tools/run-under80-preflight.mjs','_tools/discover-sources.mjs','_tools/under80-metadata-gate.mjs']){
  execFileSync(process.execPath,['--check',file],{cwd:process.cwd(),stdio:'pipe'});
 }
});
