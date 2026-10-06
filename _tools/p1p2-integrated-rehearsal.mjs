#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {runP1P2IntegratedRehearsal} from '../_generator/lib/p1p2-integrated-rehearsal.mjs';

const argv=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i++){const key=argv[i].replace(/^--/,'');args[key]=argv[i+1];i++;}
if(!args['main-sha']||!args['main-ci-run-id']||!args.out)throw Error('main_sha_main_ci_run_id_and_out_required');
const receipt=await runP1P2IntegratedRehearsal({
  repo_root:path.resolve(args['repo-root']||'.'),
  protected_main_sha:args['main-sha'],
  protected_main_ci_run_id:Number(args['main-ci-run-id']),
  protected_main_ci_conclusion:args['main-ci-conclusion']||'success',
  rehearsal_run_id:args['rehearsal-run-id']||process.env.GITHUB_RUN_ID||null,
  observed_at:args['observed-at']||new Date().toISOString()
});
const out=path.resolve(args.out);fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
process.stdout.write(JSON.stringify({result:receipt.result,rehearsal_id:receipt.rehearsal_id,evidence_digest:receipt.evidence_digest,out},null,2)+'\n');
if(receipt.result!=='PASS')process.exitCode=1;
