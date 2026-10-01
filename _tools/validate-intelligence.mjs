#!/usr/bin/env node
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {validateBookCatalog,bookCoverageMetrics,selectBookReferences} from '../_generator/lib/book-selection.mjs';
import {validateBookReading} from '../_generator/lib/book-reading.mjs';
import {validateEmergingSignalSweep} from '../_generator/lib/emerging-signal-sweep.mjs';
import {watchlistDailyState} from '../_generator/lib/watchlist.mjs';
const data=JSON.parse(fs.readFileSync('_data/book-reading.json','utf8'));
assert.deepEqual(validateBookCatalog(data),[]);
const base=process.env.PR_BASE||process.env.EVENT_BEFORE;
if(base&&!/^0+$/.test(base)){
 const prior=JSON.parse(execFileSync('git',['show',`${base}:_data/book-reading.json`],{encoding:'utf8'}));
 for(const [date,rows] of Object.entries(prior.editions))assert.deepEqual(data.editions[date],rows,`Historical mappings changed: ${date}`);
 for(const id of new Set(Object.values(prior.editions).flat().map(s=>s.reference_id)))assert.deepEqual(data.references[id],prior.references[id],`Historical anchor changed: ${id}`);
}
for(const file of fs.readdirSync('_data/editions').filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f))){
 const edition=JSON.parse(fs.readFileSync('_data/editions/'+file,'utf8'));
 if(data.editions[edition.brief_date]||edition.brief_date>='2026-09-30')validateBookReading(edition,data);
 if(edition.brief_date>='2026-09-30')console.log(JSON.stringify({edition_date:edition.brief_date,books:selectBookReferences(edition,data,data.selection_reviews?.[edition.brief_date]).metrics}));
}
const watch=JSON.parse(fs.readFileSync('_data/watchlist.json','utf8'));
if(watch.edition_date>='2026-09-23'){
 const receipt=JSON.parse(fs.readFileSync(`_records/watchlist-sweeps/${watch.edition_date}.json`,'utf8'));
 assert.deepEqual(validateEmergingSignalSweep(receipt,{editionDate:watch.edition_date,topics:watch.topics}),[]);
 for(const [state,key] of [['new_today','new_topic_ids'],['updated_today','updated_topic_ids']])assert.deepEqual(watch.topics.filter(t=>t.status!=='archived'&&watchlistDailyState(t,watch.edition_date)===state).map(t=>t.topic_id).sort(),[...receipt[key]].sort());
 if(receipt.telemetry)console.log(JSON.stringify({watchlist:receipt.telemetry}));
}
const latest=Object.keys(data.editions).sort().at(-1);
console.log(JSON.stringify({catalog:bookCoverageMetrics(data,latest,data.editions[latest]),note:'Historical mappings are audited, not reselected. Considered counts are zero without a semantic review.'},null,2));
