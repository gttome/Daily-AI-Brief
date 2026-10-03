#!/usr/bin/env node
import fs from 'node:fs';
import {emergingDiscoveryPlan,emergingDiscoveryTelemetry} from '../_generator/lib/emerging-discovery.mjs';
import {validateEmergingSignalSweep} from '../_generator/lib/emerging-signal-sweep.mjs';
const [command,input,topicFile]=process.argv.slice(2);
if(command==='plan'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input||''))throw Error('plan requires YYYY-MM-DD');
 console.log(JSON.stringify(emergingDiscoveryPlan(input),null,2));
}else if(command==='validate'){
 const receipt=JSON.parse(fs.readFileSync(input,'utf8'));
 const topics=JSON.parse(fs.readFileSync(topicFile||'_data/watchlist.json','utf8')).topics;
 const errors=validateEmergingSignalSweep(receipt,{topics});
 console.log(JSON.stringify({result:errors.length?'FAIL':'PASS',errors,telemetry:emergingDiscoveryTelemetry(receipt)},null,2));
 if(errors.length)process.exitCode=1;
}else throw Error('Usage: emerging-discovery.mjs plan <date> | validate <receipt.json> [watchlist.json]');
