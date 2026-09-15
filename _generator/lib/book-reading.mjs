import {sourceReadingMinutes} from './reading-support.mjs';
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync(new URL('../../_data/book-reading.json', import.meta.url), 'utf8'));
const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SERIES_SEPARATION_DATE='2026-09-16';
export const readerRelease = date => date >= '2026-09-12';
export const readerAddition = content => content ? `<!-- reader-release:start -->\n${content}\n<!-- reader-release:end -->` : '';
export function validateBookReading(edition, data = catalog) {
  const selections=data.editions[edition.brief_date] || [];
  const ids=new Set(edition.stories.map(s=>s.story_id));
  for(const [key,suffix] of [['general','general'],['agents_non_technical_people','agent-skills']])if(edition.worth_watching?.[key]?.status==='included')ids.add(`dab-video-${edition.brief_date}-${suffix}`);
  if(edition.podcast?.status==='included')ids.add(edition.podcast.item_id);
  const maxReferences=edition.brief_date>=SERIES_SEPARATION_DATE?9:3;
  if(selections.length>maxReferences)throw Error(edition.brief_date>=SERIES_SEPARATION_DATE?'Use at most one book reference per Brief item':'Use at most three book references per edition');
  const seen=new Set();
  for(const s of selections){
    const r=data.references[s.reference_id];
    if(!ids.has(s.item_id)||seen.has(s.item_id))throw Error('Book reference has an unknown or duplicate item');
    seen.add(s.item_id);
    if(edition.brief_date>=SERIES_SEPARATION_DATE&&!['READ DEEPER','PUT IT INTO PRACTICE'].includes(s.label))throw Error('Book reference label must be READ DEEPER or PUT IT INTO PRACTICE');
    if(!r?.book||!r.locator||!r.section_title||!r.verified_date||r.evidence_level!=='public table of contents'||!s.why)throw Error('Book reference requires verified source, exact locator, and reader benefit');
    if(new URL(r.url).origin!=='https://leanpub.com')throw Error('Book reference destination must be the verified Leanpub page');
    if(s.practice&&!r.practice_title)throw Error('Practice recommendation requires a verified exercise or checklist');
  }
}
export function renderBookReading(itemId,date){
  if(!readerRelease(date))return '';
  const s=(catalog.editions[date]||[]).find(x=>x.item_id===itemId);
  if(!s)return '';
  const r=catalog.references[s.reference_id];
  if(!r)throw Error(`Unknown book reference: ${s.reference_id}`);
  if(date<SERIES_SEPARATION_DATE)return readerAddition(`<aside class="book-bridge"><p class="book-kicker">${html(s.label)} · GENERATIVE AI PROFESSIONAL SERIES</p><h3>${html(r.book)}</h3><p class="chapter">${html(r.locator)} — ${html(r.section_title)}</p><p>${html(s.why)}</p>${s.practice?`<p class="practice"><strong>Put it into practice:</strong> ${html(s.practice)}</p>`:''}<p><a class="book-cta" href="${html(r.url)}" target="_blank" rel="noopener noreferrer">Get the book and explore contents ↗</a></p><p class="small-note">By George Tome, curator of this brief. The link opens the Leanpub.com book webpage; chapter access requires the book.</p></aside>`);
  return readerAddition(`<aside class="book-bridge"><p class="book-kicker">${html(s.label)} · GENERATIVE AI PROFESSIONAL SERIES</p><h3>${html(r.book)}</h3><p class="chapter">${html(r.locator)} — ${html(r.section_title)}</p><p>${html(s.why)}</p>${s.practice?`<p class="practice"><strong>Put it into practice:</strong> ${html(s.practice)}</p>`:''}<p><a class="book-cta" href="${html(r.url)}" target="_blank" rel="noopener noreferrer">Explore contents &amp; buy the book ↗</a></p><p class="small-note">The link opens the Leanpub book page; chapter access requires the book.</p></aside>`);
}
export function renderSeriesInvitation(date){
  if(!readerRelease(date))return '';
  if(date<SERIES_SEPARATION_DATE)return readerAddition(`<aside class="series-invitation" id="explore-series"><p class="book-kicker">CONTINUE LEARNING</p><h2>Explore the Generative AI Professional Series</h2><p>Take the next step from today’s developments to deeper professional learning. Explore George Tome’s books on prompting, context, and reliable AI.</p><p><a class="book-cta" href="https://leanpub.com/u/george-tome" target="_blank" rel="noopener noreferrer">Explore the books ↗</a></p><p class="small-note">Written by the curator of this brief. Buying a book supports his work.</p></aside>`);
  return readerAddition(`<aside class="series-invitation" id="explore-series"><p class="book-kicker">CONTINUE LEARNING</p><h2>Explore the Generative AI Professional Series</h2><p>Take the next step from today’s developments to deeper professional learning with books on prompting, context, and reliable AI.</p><p><a class="book-cta" href="https://leanpub.com/u/george-tome" target="_blank" rel="noopener noreferrer">Explore the books ↗</a></p><p class="small-note">Purchasing a book supports continued development of the series and the Daily Generative AI Brief.</p></aside>`);
}
export function renderEditionOverview(edition){
  if(!readerRelease(edition.brief_date))return '';
  const short=['Copilot: verification inside code review','GitHub: measure agent activity separately','Gemini: AI beside your desktop work','Workplace AI: find missing context','Mastra: shared skills and permissions','No-code agents: test the whole workflow'];
  const items=edition.stories.map((s,i)=>({anchor:`reading-${s.story_id}`,title:edition.brief_date==='2026-09-12'?short[i]:s.headline,kind:sourceReadingMinutes(s)?`Article · about ${sourceReadingMinutes(s)} min source read`:'Article · Source reading time unavailable'}));
  for(const [key,anchor,name] of [['general','general','General video'],['agents_non_technical_people','agents-for-non-technical-people','Agent Skills video']]){
    const slot=edition.worth_watching[key];const duration=slot.status==='included'?`${Math.floor(slot.runtime_seconds/60)}:${String(slot.runtime_seconds%60).padStart(2,'0')}`:'No qualifying selection';
    items.push({anchor,title:slot.status==='included'?(edition.brief_date==='2026-09-12'?(key==='general'?'5 Minute AI News':'Agent Skills: structure and progressive disclosure'):slot.title):name,kind:`Video · ${duration}`});
  }
  if(edition.podcast)items.push({anchor:'worth-listening--podcast',title:edition.podcast.status==='included'?(edition.brief_date==='2026-09-12'?'AI risk claims and evidence quality':edition.podcast.title):'Podcast',kind:edition.podcast.status==='included'?'Podcast':'Podcast · No qualifying selection'});
  const videos=Object.values(edition.worth_watching).filter(x=>x.status==='included').length;
  const podcasts=edition.podcast?.status==='included'?1:0;
  return readerAddition(`<section class="edition-overview" id="edition-overview"><p class="book-kicker">IN THIS EDITION · ${edition.stories.length} ARTICLES / ${videos} VIDEOS / ${podcasts} PODCAST</p><h2>Choose what matters to your work</h2><ol>${items.map(x=>`<li><a href="#${html(x.anchor)}">${html(x.title)}</a><span>${html(x.kind)}</span></li>`).join('')}</ol></section>`);
}
