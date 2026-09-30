import fs from 'node:fs';
import path from 'node:path';
import {assertEfficiency} from './efficiency-core.mjs';
export * from './efficiency-core.mjs';

const RUN_RECORD_FILE=/^dab-efficiency-\d{4}-\d{2}-\d{2}-.+-(publication_generation|publication_complete|research_shadow|historical)\.json$/;

export function readEfficiencyRecords(root){
 const base=path.join(root,'_records/efficiency'),records=[];
 if(!fs.existsSync(base))return records;
 for(const date of fs.readdirSync(base).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))for(const file of fs.readdirSync(path.join(base,date)).filter(x=>RUN_RECORD_FILE.test(x))){
  const r=JSON.parse(fs.readFileSync(path.join(base,date,file),'utf8'));assertEfficiency(r);records.push(r);
 }
 return records;
}
