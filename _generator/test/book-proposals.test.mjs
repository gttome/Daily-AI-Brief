import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBookChangeProposalBacklog,validateBookChangeProposalBacklog} from '../lib/book-proposals.mjs';

const base=JSON.parse(fs.readFileSync('_data/editions/2026-09-12.json'));
const implication={book_title:'Reliable Generative AI',proposed_change:'Add a verification example.',evidence_reason:'The selected item adds concrete evidence for tool-backed verification.',teaching_asset:'A short verification checklist.'};

function cleanEdition(){
 const edition=structuredClone(base);
 for(const story of edition.stories)delete story.series_implications;
 for(const slot of Object.values(edition.worth_watching || {}))delete slot.series_implications;
 if(edition.podcast)delete edition.podcast.series_implications;
 return edition;
}

test('book proposal backlog captures article, video and podcast proposals without reader presentation fields',()=>{
 const edition=cleanEdition();
 edition.stories[0].series_implications=[implication];
 edition.worth_watching.general.series_implications=[{...implication,proposed_change:'Add a video-based verification exercise.'}];
 edition.podcast.series_implications=[{...implication,proposed_change:'Add a podcast evidence-calibration example.'}];
 const record=buildBookChangeProposalBacklog(edition);
 assert.equal(record.proposal_count,3);
 assert.deepEqual(new Set(record.proposals.map(p=>p.item_type)),new Set(['article','video','podcast']));
 assert.ok(record.proposals.every(p=>p.workflow_state==='pending_review'&&p.dedupe_key&&p.proposal_id));
 assert.deepEqual(validateBookChangeProposalBacklog(edition,record),[]);
 assert.ok(record.proposals.every(p=>!('george_implication' in p)&&!('reader_copy' in p)));
});

test('book proposal backlog uses stable dedupe keys for the same proposed change',()=>{
 const edition=cleanEdition();
 edition.stories[0].series_implications=[implication];
 edition.stories[1].series_implications=[implication];
 const record=buildBookChangeProposalBacklog(edition);
 assert.equal(record.proposal_count,2);
 assert.equal(record.proposals[0].dedupe_key,record.proposals[1].dedupe_key);
 assert.notEqual(record.proposals[0].proposal_id,record.proposals[1].proposal_id);
});
