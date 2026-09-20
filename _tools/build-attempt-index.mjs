import fs from 'node:fs';
import path from 'node:path';
import {buildAttemptIndex} from '../_generator/lib/attempt-index.mjs';

const out=process.argv[2]||'data/attempts/index.json';
const result=buildAttemptIndex(process.cwd());
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({out,records:result.records.length}));
