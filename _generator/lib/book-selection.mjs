import {createHash} from 'node:crypto';
import {editionPodcasts} from './podcasts.mjs';

export const BOOK_COVERAGE_DATE='2026-09-30';
export const SERIES_BOOKS=Object.freeze(['Reliable Generative AI','Reliable Generative AI Context Engineering','Generative AI Professional Prompt Engineering Guide','Generative AI Prompt Engineering Learning Ecosystem']);
export const MATCH_DIMENSIONS=Object.freeze({mechanism:3,topic:2,practical_lesson:3,audience:1,section_relevance:3,reader_value:3});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const chapter=r=>`${r.book} / ${r.locator.split(',')[0]}`;
const count=values=>values.reduce((out,key)=>(out[key]=(out[key]||0)+1,out),{});

export function bookItems(edition){
 const items=(edition.stories||[]).map(s=>({...s,item_id:s.story_id,kind:'article'}));
 for(const [key,suffix] of [['general','general'],['agents_non_technical_people','agent-skills']]){
  const slot=edition.worth_watching?.[key];
  if(slot?.status==='included')items.push({...slot,item_id:`dab-video-${edition.brief_date}-${suffix}`,kind:'video'});
 }
 return [...items,...editionPodcasts(edition).map(p=>({...p,kind:'podcast'}))];
}
export function eligibleBookAnchors(data,date='9999-12-31'){
 return Object.values(data.references).filter(r=>r.eligible!==false&&SERIES_BOOKS.includes(r.book)&&r.verified_date<=date);
}
export function validateBookCatalog(data){
 const errors=[];
 for(const [id,r] of Object.entries(data.references||{})){
  if(r.id!==id||!r.book||!r.locator||!r.section_title||!/^\d{4}-\d{2}-\d{2}$/.test(r.verified_date||''))errors.push(`Incomplete book anchor: ${id}`);
  if(!['public table of contents','public sample','user-provided book structure'].includes(r.evidence_level))errors.push(`Unverified anchor: ${id}`);
  try{if(new URL(r.url).origin!=='https://leanpub.com')throw Error();}catch{errors.push(`Invalid book URL: ${id}`);}
  if(r.verified_date>=BOOK_COVERAGE_DATE&&(!r.verification?.source_url||!r.verification?.heading||!r.verification?.source_location))errors.push(`Missing locator provenance: ${id}`);
 }
 for(const book of SERIES_BOOKS)if(eligibleBookAnchors(data).filter(r=>r.book===book).length<2)errors.push(`Multiple verified anchors required: ${book}`);
 return errors;
}
export function recentBookUse(data,date,window=7){
 const dates=Object.keys(data.editions||{}).filter(d=>d<date).sort().slice(-window);
 const uses=dates.flatMap(d=>data.editions[d]).map(s=>data.references[s.reference_id]).filter(Boolean);
 return {editions:dates,mapped_items:uses.length,books:count(uses.map(r=>r.book)),chapters:count(uses.map(chapter)),anchors:count(uses.map(r=>r.id))};
}
export function bookSelectionPlan(edition,data){
 const anchors=eligibleBookAnchors(data,edition.brief_date);
 return {schema_version:'1.0.0',edition_date:edition.brief_date,catalog_digest:digest(anchors),items_digest:digest(bookItems(edition)),items:bookItems(edition),anchors,dimensions:MATCH_DIMENSIONS,recent_use:recentBookUse(data,edition.brief_date),instruction:'In the existing editorial semantic pass, score EVERY item × anchor on each dimension from 0 (no connection) to 4 (direct match). Supply an item-specific rationale. For any plausible selected match, the rationale must be one short reader-facing sentence explaining how the book section helps the reader understand or apply this Brief item; never mention runs, review mechanics, selection, scoring, or reader-value matching. Judge mechanism and learning value from verified section titles; do not claim full-text review. No quota. Return one row per item with all anchor scores, including zero scores.'};
}
// Semantic judgments come from the editorial pass; code enforces full-catalog coverage,
// relevance-first ranking and reproducible tie-breaking. No keyword proxy or paid API.
export function selectBookReferences(edition,data,review){
 const errors=validateBookCatalog(data);if(errors.length)throw Error(errors.join('\n'));
 const plan=bookSelectionPlan(edition,data),anchors=plan.anchors;
 if(review?.edition_date!==edition.brief_date||review.catalog_digest!==plan.catalog_digest||review.items_digest!==plan.items_digest)throw Error('Book review must match current edition items and catalog');
 if(!Array.isArray(review.items)||review.items.length!==plan.items.length||new Set(review.items.map(x=>x.item_id)).size!==plan.items.length)throw Error('Review every Brief item exactly once');
 const selections=[],rankings=[];
 for(const item of [...plan.items].sort((a,b)=>a.item_id.localeCompare(b.item_id))){
  const row=review.items.find(x=>x.item_id===item.item_id);
  if(!row||!Array.isArray(row.scores)||row.scores.length!==anchors.length||new Set(row.scores.map(x=>x.reference_id)).size!==anchors.length)throw Error('Score every eligible anchor exactly once: '+item.item_id);
  const ranked=row.scores.map(s=>{
   const r=anchors.find(a=>a.id===s.reference_id);
   if(!r||!s.rationale?.trim()||Object.keys(MATCH_DIMENSIONS).some(k=>!Number.isInteger(s[k])||s[k]<0||s[k]>4))throw Error('Invalid semantic book score: '+item.item_id);
   const score=Object.entries(MATCH_DIMENSIONS).reduce((n,[k,w])=>n+s[k]*w,0);
   const used=[...selections.map(x=>data.references[x.reference_id])];
   const reuse=(plan.recent_use.anchors[r.id]||0)+used.filter(x=>x.id===r.id).length;
   const chapterUse=(plan.recent_use.chapters[chapter(r)]||0)+used.filter(x=>chapter(x)===chapter(r)).length;
   const bookUse=(plan.recent_use.books[r.book]||0)+used.filter(x=>x.book===r.book).length;
   return {...s,score,reuse,chapter_use:chapterUse,book_use:bookUse};
  }).sort((a,b)=>b.score-a.score||a.reuse-b.reuse||a.chapter_use-b.chapter_use||a.book_use-b.book_use||a.reference_id.localeCompare(b.reference_id));
  const best=ranked.find(s=>s.reader_value>=3&&s.section_relevance>=3&&s.score>=36);
  if(edition.brief_date>='2026-10-02'&&best&&(/\b(?:run\s*\d+|all-four-book review|selected this verified section|reader-value match)\b/i.test(best.rationale)||best.rationale.length>280))throw Error('Selected book rationale must be a short reader-facing connection: '+item.item_id);
  if(best)selections.push({item_id:item.item_id,reference_id:best.reference_id,label:'READ DEEPER',why:best.rationale});
  rankings.push({item_id:item.item_id,selected_reference_id:best?.reference_id||null,anchors:ranked});
 }
 return {selections,rankings,metrics:bookCoverageMetrics(data,edition.brief_date,selections,{items:plan.items.length,anchors:anchors.length})};
}
export function bookCoverageMetrics(data,date,selections,{items=0,anchors=0}={}){
 const eligible=eligibleBookAnchors(data,date),available=[...new Set(eligible.map(r=>r.book))],recent=recentBookUse(data,date);
 const current=selections.map(s=>data.references[s.reference_id]);
 const warnings=[];
 for(const [kind,counts] of Object.entries({book:count(current.map(r=>r.book)),chapter:count(current.map(chapter))}))for(const [key,n] of Object.entries(counts))if(current.length>=3&&n/current.length>=0.6)warnings.push({window:'today',kind,key,uses:n,total:current.length});
 for(const [kind,counts] of Object.entries({book:recent.books,chapter:recent.chapters}))for(const [key,n] of Object.entries(counts))if(recent.mapped_items>=5&&n/recent.mapped_items>=0.6)warnings.push({window:'prior_7_editions',kind,key,uses:n,total:recent.mapped_items});
 return {books_available:available.length,books_expected:4,verified_anchors_available:eligible.length,missing_books:SERIES_BOOKS.filter(b=>!available.includes(b)),catalog_incomplete:available.length!==4,books_considered:items&&anchors===eligible.length?available.length:0,anchors_considered:anchors,item_anchor_pairs_considered:items*anchors,items_reviewed:items,mapped_items:selections.length,books_selected_count:new Set(current.map(r=>r.book)).size,books_selected:[...new Set(current.map(r=>r.book))],repeated_anchors:selections.filter(s=>recent.anchors[s.reference_id]).length,repeated_anchor_ids:[...new Set(selections.filter(s=>recent.anchors[s.reference_id]).map(s=>s.reference_id))],recent_use:recent,concentration_warning_count:warnings.length,concentration_warnings:warnings};
}
