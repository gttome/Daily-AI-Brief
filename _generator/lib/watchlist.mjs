import fs from 'node:fs';
export const WEIGHTS={novelty:20,evidence:25,independence:15,momentum:15,relevance:15,durability:10};
export function scoreTopic(t){return Math.round(Object.entries(WEIGHTS).reduce((n,[k,w])=>n+w*(t.rubric[k].score??0)/5,0));}
export function validateWatchlist(data){
 const errors=[],ids=new Set();
 if(data.schema_version!=='1.0.0'||!/^\d{4}-\d{2}-\d{2}$/.test(data.edition_date))errors.push('Invalid watchlist version/date');
 if(!Array.isArray(data.topics)||!data.topics.length)return [...errors,'No researched topics'];
 for(const t of data.topics){
 if(!/^dab-topic-[a-z0-9-]{3,90}$/.test(t.topic_id)||ids.has(t.topic_id))errors.push('Invalid/duplicate topic');ids.add(t.topic_id);
 for(const k of ['name','summary','why_now','practical_value','limitations','next_action','first_detected','updated_at'])if(!t[k])errors.push(`${t.topic_id}: missing ${k}`);
 if(!['early_signal','gaining_evidence','under_research','trial_coverage','established','archived'].includes(t.status))errors.push('Invalid status');
 if(!t.evidence?.length||!t.evidence.some(e=>e.kind==='primary'))errors.push('Original evidence required');
 for(const e of t.evidence||[]){if(!/^https:\/\//.test(e.url)||!e.title||!e.development_id||!e.publisher||!e.checked_at)errors.push('Incomplete evidence');}
 for(const key of Object.keys(WEIGHTS)){const v=t.rubric?.[key];if(!v||!(v.score===null||Number.isInteger(v.score)&&v.score>=0&&v.score<=5)||!v.reason)errors.push('Invalid rubric');}
 if(t.momentum?.classification!=='baseline'&&!t.momentum?.observations?.length)errors.push('Momentum requires observations');
 if(['gaining_evidence','trial_coverage'].includes(t.status)&&new Set(t.evidence.map(e=>e.development_id)).size<2)errors.push('Advancement requires independent developments');
 }
 if(JSON.stringify(data).match(/"(?:ballot_hash|ballot|owner_notes|private_token|email)"\s*:/))errors.push('Private data in public watchlist');
 return errors;
}
export function publicWatchlist(data){const errors=validateWatchlist(data);if(errors.length)throw Error(errors.join('\n'));return {...data,topics:data.topics.map(t=>({...t,research_score:scoreTopic(t)}))};}
export function watchlistPreview(date){if(date<'2026-09-12')return '';return `\n\n<section class="watchlist-preview" aria-labelledby="watchlist-preview-heading"><h2 id="watchlist-preview-heading">Emerging AI Watchlist</h2><p>Help choose what we investigate next. Explore emerging ideas and tell us which interest you.</p><div data-watchlist-preview></div><p><a href="{{ '/watchlist/' | relative_url }}">Explore the watchlist and vote →</a></p></section>\n\n`;}
