import fs from 'node:fs';
import {ARTICLE_FRESHNESS_POLICY,articleFallbackLabel} from './article-freshness.mjs';
import {readerAddition} from './book-reading.mjs';
import {editionPodcasts} from './podcasts.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../_data/reading-support.json',import.meta.url),'utf8'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function publicationDateLabel(value){
 // Preserve the publisher's calendar date instead of converting time zones.
 const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
 if(!match)return '';
 const [,year,month,day]=match;
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return months[Number(month)-1]?`${day} ${months[Number(month)-1]} ${year}`:'';
}
export function readingMinutes(evidence){
 if(evidence?.status!=='verified'||!Number.isInteger(evidence.word_count)||evidence.word_count<1||!evidence.source_url||!evidence.verified_at||!evidence.method)return null;
 return Math.max(1,Math.ceil(evidence.word_count/200));
}
export function sourceReadingMinutes(item,id=item.story_id,data=catalog){
 const sourceUrl=item.source?.url||item.source_url;
 const embedded=item.source?.reading_evidence;
 if(embedded?.status==='verified'&&sourceUrl)return readingMinutes({...embedded,source_url:sourceUrl});
 const evidence=data.source_reading?.[id];
 return evidence?.source_url===sourceUrl?readingMinutes(evidence):null;
}
export function validateReadingSupport(edition,data=catalog){
 const stories=new Map(edition.stories.map(x=>[x.story_id,x]));
 // Recovery handoffs must carry the same full-source counts as normal research.
 // A short editorial evidence capsule is never an article-length estimate.
 if(edition.brief_date>='2026-09-30')for(const story of stories.values()){
  if(sourceReadingMinutes(story,story.story_id,data)===null)throw Error(`${story.story_id}: verified full-source reading evidence required`);
 }
 const ids=new Set(stories.keys());
 for(const [key,suffix] of [['general','general'],['agents_non_technical_people','agent-skills']])if(edition.worth_watching?.[key]?.status==='included')ids.add(`dab-video-${edition.brief_date}-${suffix}`);
 for(const podcast of editionPodcasts(edition))ids.add(podcast.item_id);
 const seen=new Set();
 for(const x of data.editions[edition.brief_date]||[]){
  if(!ids.has(x.item_id)){
   if(data===catalog&&process.env.DAB_QUALIFICATION_NONPRODUCTION==='1')continue;
   throw Error('Reading support has unknown or duplicate item');
  }
  if(seen.has(x.item_id))throw Error('Reading support has unknown or duplicate item');seen.add(x.item_id);
  if(!['New development','Update','Background','Recency fallback','Extended recency fallback'].includes(x.coverage_label)||!x.label_reason||!x.learning_outcome?.trim()||!x.context_term||!x.context)throw Error('Reading support requires reviewed labels, learning outcomes and context');
  const story=stories.get(x.item_id);
  if(edition.brief_date>='2026-09-16'&&story?.freshness?.tier==='fallback'&&x.coverage_label!==(edition.article_freshness_policy===ARTICLE_FRESHNESS_POLICY?articleFallbackLabel(story.freshness):'Recency fallback'))throw Error(`${x.item_id}: fallback stories must use the Recency fallback label matching their actual freshness band`);
  if(edition.brief_date>='2026-09-16'&&story?.freshness?.tier==='primary'&&/recency fallback/i.test(x.coverage_label))throw Error(`${x.item_id}: primary-window stories cannot use the Recency fallback label`);
  if(x.related&&(!x.related.title||!x.related.connection||!x.related.brief_date||x.related.brief_date>=edition.brief_date||!/^https:\/\/gttome.github.io\/Daily-AI-Brief\/(stories|videos|podcasts)\//.test(x.related.url)))throw Error('Related coverage must identify an earlier Brief item and explain its connection');
 }
}
export function renderReadingSupport(item,id,date,kind='Article'){
 if(date<'2026-09-12')return '';
 const x=(catalog.editions[date]||[]).find(x=>x.item_id===id);
 const r=x?.related;
 const contextBlock=x?`<p><strong>${esc(x.context_term)}:</strong> ${esc(x.context)}</p><div class="learning-outcome"><strong>What you’ll learn</strong><p>${esc(x.learning_outcome)}</p></div>`:'';
 const relatedBlock=r?`<div class="related-coverage"><strong>${esc(r.label||'Earlier Brief')}</strong><p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></p><p>${esc(r.brief_date)} · ${esc(r.connection)}</p></div>`:'';
 if(kind!=='Article'){
  if(!x&&!r)return '';
  const coverageLabel=x?.coverage_label;
  return readerAddition(`<aside class="reading-context" aria-label="Reading context">${coverageLabel?`<div class="reading-meta"><span class="coverage-label">${esc(coverageLabel)}</span></div>`:''}${contextBlock}${relatedBlock}</aside>`);
 }
 const minutes=sourceReadingMinutes(item,id);
 const duration=minutes?`Source article · about ${minutes} min read`:'Source reading time unavailable';
 const fallback=item.freshness?.tier==='fallback'&&item.freshness.fallback_band?item.freshness:null;
 const coverageLabel=fallback?articleFallbackLabel(fallback):x?.coverage_label;
 const published=publicationDateLabel(item.source?.publication_date||item.freshness?.source_published_at);
 const disclosure=published?`<p class="recency-disclosure"><strong>Originally published:</strong> ${published}</p>`:'';
 return readerAddition(`<aside class="reading-context" aria-label="Reading context"><div class="reading-meta">${coverageLabel?`<span class="coverage-label">${esc(coverageLabel)}</span>`:''}<span title="Estimated from the linked source’s main text at 200 words per minute. Navigation and unrelated promotional material are excluded. Unavailable means a reliable source-text estimate has not been verified.">${esc(duration)}</span></div>${disclosure}${contextBlock}${relatedBlock}</aside>`);
}
