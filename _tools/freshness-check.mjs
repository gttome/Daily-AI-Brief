import fs from 'node:fs';
const now=new Date();const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const response=await fetch('https://gttome.github.io/Daily-AI-Brief/feed.json');
if(!response.ok)throw Error(`Live feed unavailable: ${response.status}`);
const feed=await response.json();const latest=(feed.items||[]).map(x=>(x.date_published||'').slice(0,10)).sort().at(-1);
const result={schema_version:'1.0.0',observed_at:now.toISOString(),expected_date:date,latest_live_date:latest||null,status:latest===date?'current':'missing_current_edition',recovery:'Keep the prior live edition. Resume the approved Work publisher when Plus allowance is available; never lower quality.'};
console.log(JSON.stringify(result,null,2));if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Daily Brief freshness\n\nExpected ${date}; observed ${latest||'unavailable'}. Status: ${result.status}.\n`);
if(result.status!=='current')process.exitCode=1;
