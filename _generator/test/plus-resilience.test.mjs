import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {reviewedImages} from '../lib/image-gate.mjs';import {validateQaRecord} from '../lib/integrity.mjs';import {loadQaRecords} from '../lib/quality.mjs';
const root=path.resolve(import.meta.dirname,'../..');const edition=JSON.parse(fs.readFileSync(path.join(root,'_data/editions/2026-09-10.json')));
test('final image gate accepts exact reviewed bytes and blocks tampering and repeated composition evidence',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-images-'));
 fs.cpSync(path.join(root,'_records/image-quality'),path.join(temp,'_records/image-quality'),{recursive:true});fs.cpSync(path.join(root,'briefs/images/2026-09-10'),path.join(temp,'briefs/images/2026-09-10'),{recursive:true});
 assert.deepEqual(reviewedImages(edition,temp).errors,[]);
 const asset=path.join(temp,edition.stories[0].image.path);fs.appendFileSync(asset,'changed');assert.match(reviewedImages(edition,temp).errors.join(','),/bytes changed/);
 fs.copyFileSync(path.join(root,edition.stories[0].image.path),asset);
 const f=path.join(temp,'_records/image-quality/2026-09-10-premium3.json'),r=JSON.parse(fs.readFileSync(f));r.images[1].composition=r.images[0].composition;fs.writeFileSync(f,JSON.stringify(r));assert.match(reviewedImages(edition,temp).errors.join(','),/Repeated/);
 fs.rmSync(temp,{recursive:true});
});
test('failed QA evidence remains valid while passing QA cannot hide an open critical defect',()=>{
 const r={run_id:'dab-qa-fixture',initial_result:'fail',final_result:'fail',checks:[],defects:[{status:'open',severity:'critical'}]};assert.deepEqual(validateQaRecord(r),[]);assert.ok(validateQaRecord({...r,final_result:'pass'}).length);
});
test('30-day QA window uses calendar dates, not thirty files',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dab-window-'));fs.mkdirSync(path.join(temp,'_records/qa'),{recursive:true});for(const date of ['2026-08-01','2026-09-09'])fs.writeFileSync(path.join(temp,'_records/qa',date+'.json'),JSON.stringify({date}));assert.equal(loadQaRecords(temp,30,'2026-09-10').length,1);fs.rmSync(temp,{recursive:true});
});
