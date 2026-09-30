import {readFileSync} from 'node:fs';import {parseArgs} from '../_generator/lib/util.mjs';import {completionDecision,saveJson} from '../_generator/lib/production-run.mjs';
const a=parseArgs(process.argv.slice(2));if(!a.date||!a.completion)throw Error('Requires --date and --completion');
let prior=null,completion=null;try{prior=JSON.parse(readFileSync(a.state)).key;}catch{}try{completion=JSON.parse(readFileSync(a.completion));}catch{}
const decision=completionDecision({editionDate:a.date,completion,lastProcessed:prior});
// Acknowledge only after the separate collection operation succeeded.
if(a.acknowledge===true){if(!a.state||!['completed','unchanged'].includes(decision.state))throw Error('Only a completed unprocessed release can be acknowledged');if(decision.state==='completed')saveJson(a.state,{key:decision.key,acknowledged_at:new Date().toISOString()});}
console.log(JSON.stringify(decision,null,2));
