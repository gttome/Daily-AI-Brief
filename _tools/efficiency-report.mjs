
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {assertEfficiency,efficiencyPath,readEfficiencyRecords,summarizeEfficiency,comparison} from '../_generator/lib/efficiency.mjs';
const [command,...rest]=process.argv.slice(2),args=parseArgs(rest),root=process.cwd();
function historical(){return JSON.parse(fs.readFileSync('_architecture/efficiency-refactor/historical-baselines.json','utf8')).records.map(r=>({date:r.date,wall_seconds:r.record.wall_seconds,source_record:r.provenance,metrics:r.record.measured_work,role:r.comparison_role}));}
if(command==='record'){
 if(!args.file)throw Error('Requires completed telemetry --file');
 const record=assertEfficiency(JSON.parse(fs.readFileSync(path.resolve(args.file),'utf8')));
 // Account-level allowance snapshots are kept on the private operational surface.
 if(record.usage.weekly_usage_percent_remaining_before!==null||record.usage.weekly_usage_percent_remaining_after!==null)throw Error('Raw account allowance readings must remain in private usage storage, not this public repository');
 const file=path.join(root,efficiencyPath(record));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 const records=readEfficiencyRecords(root);
 fs.mkdirSync('data/efficiency',{recursive:true});fs.writeFileSync('data/efficiency/index.json',JSON.stringify({schema_version:'1.0.0',records,historical:historical()},null,2)+'\n');
 console.log(JSON.stringify({saved:file,records:records.length}));
}else if(command==='report'){
 const from=args.from||'0000-01-01',to=args.to||'9999-12-31';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)throw Error('Invalid date range');
 const records=readEfficiencyRecords(root).filter(r=>r.edition_id.slice(-10)>=from&&r.edition_id.slice(-10)<=to),summary=summarizeEfficiency(records),baselines=historical();
 const display=v=>v===null||v===undefined?'Unavailable':typeof v==='number'?Number(v.toFixed(2)):String(v).replaceAll('|','/');
 const lines=['# Daily AI Brief efficiency comparison','',from+' to '+to,'',
 'Optimized editions with completed boundaries and final public QA: '+summary.optimized_editions+'.',
 'Archive replay and generation-only records are excluded from production averages. Missing data stays unavailable.','',
 '| Baseline | Recorded seconds | Optimized mean | Improvement |','|---|---:|---:|---:|'];
 for(const b of [...baselines,{date:'September 12–13 mean',wall_seconds:3181.5}])lines.push('| '+b.date+' | '+b.wall_seconds+' | '+display(summary.averages.wall_seconds.mean)+' | '+display(comparison(b.wall_seconds,summary.averages.wall_seconds.mean).improvement_percent)+' |');
 lines.push('','September 14 repository timing ends at final QA (3101 seconds). Its private usage snapshot ends earlier (2851 seconds); these boundaries are not interchangeable. Historical “retrieved” discovery counts are not full-text counts.','',
 '| Metric | Optimized mean | Observations / editions |','|---|---:|---:|');
 for(const [key,value]of Object.entries(summary.averages))lines.push('| '+key+' | '+display(value.mean)+' | '+value.observations+' / '+value.total_runs+' |');
 lines.push('','| Edition / attempt | Pipeline | Scope | Public QA | Overall | Watchlist | Private operations | Delivery |','|---|---|---|---|---|---|---|---|');
 for(const r of records)lines.push('| '+r.edition_id+' / '+r.attempt_id+' | '+display(r.pipeline_version)+' | '+r.scope+' | '+display(r.quality.final_public_qa)+' | '+display(r.quality.overall_run_status)+' | '+display(r.quality.watchlist)+' | '+display(r.quality.private_operations)+' | '+display(r.quality.subscriber_delivery)+' |');
 lines.push('','Weekly allowance consumed per valid run: '+display(summary.weekly_allowance_consumed.mean)+' ('+summary.weekly_allowance_consumed.valid_observations+' valid observations). Exact tokens and credits are unavailable unless recorded directly.','',
 'No production performance improvement can be concluded until comparable optimized editions are recorded. Targets are not measurements.');
 const output=lines.join('\n')+'\n';
 if(args.out)fs.writeFileSync(path.resolve(args.out),output);else process.stdout.write(output);
 if(args.json)fs.writeFileSync(path.resolve(args.json),JSON.stringify({from,to,baselines,summary,records},null,2)+'\n');
}else throw Error('Expected record or report');
