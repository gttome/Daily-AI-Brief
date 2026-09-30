#!/usr/bin/env node
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const parseArgs=argv=>{const out={_:[]};for(let i=0;i<argv.length;i++){const v=argv[i];if(v.startsWith('--')){const k=v.slice(2),n=argv[i+1];if(n!==undefined&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;}else out._.push(v);}return out;};
const a=parseArgs(process.argv.slice(2)),config=JSON.parse(fs.readFileSync(new URL('../_generator/test-selection.json',import.meta.url),'utf8'));
let changed=String(a['changed-files']||'').split(';').filter(Boolean);
if(!changed.length&&a.base&&a.head)changed=execFileSync('git',['diff','--name-only',a.base,a.head],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const match=(pattern,file)=>{const escaped=pattern.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*');return new RegExp('^'+escaped+'$').test(file);};
const selected=[];for(const rule of config.rules)if(changed.some(file=>rule.patterns.some(pattern=>match(pattern,file))))selected.push(rule);
const tests=[...new Set(selected.flatMap(x=>x.tests))],tiers=[...new Set(selected.map(x=>x.tier))].sort();
console.log(JSON.stringify({schema_version:config.schema_version,changed_components:changed,selected_tiers:tiers,selected_tests:tests,selection_reason:selected.map(x=>({tier:x.tier,patterns:x.patterns.filter(p=>changed.some(f=>match(p,f))),tests:x.tests}))},null,2));
