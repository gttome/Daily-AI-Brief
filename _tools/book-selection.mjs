#!/usr/bin/env node
import fs from 'node:fs';
import {bookSelectionPlan,selectBookReferences} from '../_generator/lib/book-selection.mjs';
const [command,editionFile,reviewFile]=process.argv.slice(2);
if(!['plan','select'].includes(command)||!editionFile)throw Error('Usage: node _tools/book-selection.mjs plan|select <edition.json> [semantic-review.json]');
const data=JSON.parse(fs.readFileSync('_data/book-reading.json','utf8')),edition=JSON.parse(fs.readFileSync(editionFile,'utf8'));
if(command==='plan')console.log(JSON.stringify(bookSelectionPlan(edition,data),null,2));
else{
 const review=JSON.parse(fs.readFileSync(reviewFile,'utf8'));
 const result=selectBookReferences(edition,data,review);
 // Deliberately emits a proposal. The publisher commits reviewed selections and
 // the matching review together; historical mappings are never overwritten here.
 console.log(JSON.stringify({...result,review},null,2));
}
