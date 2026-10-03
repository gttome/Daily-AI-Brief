export const WEIGHTS = {novelty:20,evidence:25,independence:15,momentum:15,relevance:15,durability:10};
const labels={novelty:'Novelty',evidence:'Evidence',independence:'Independent developments',momentum:'Momentum',relevance:'Reader relevance',durability:'Lasting value'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?escape(String(s).slice(0,10)):'Not recorded';
const url=s=>{try{const u=new URL(s);return u.protocol==='https:'?escape(u.href):'#';}catch{return '#';}};
export function renderWatchlistEvidence(t){
 return `<div class="wl-evidence-strip"><span><strong>Evidence confidence</strong>${escape(t.confidence)}</span><span><strong>First recorded</strong>${date(t.first_detected)}</span><span><strong>Source checks recorded</strong>${[...new Set(t.evidence.map(x=>date(x.checked_at)))].join('; ')}</span></div>
<h3>Sources behind this signal</h3><ul class="wl-evidence-links">${t.evidence.map(x=>`<li><a target="_blank" rel="noopener noreferrer" href="${url(x.url)}">${escape(x.title)}</a><p>${escape(x.publisher)} · ${x.kind==='primary'?'Original source':'Community discussion'} · Published: ${x.publication_date?date(x.publication_date):'Date not verified'}</p><p>Review scope: ${escape(x.review_depth||'Not recorded')}. Checked: ${date(x.checked_at)}.</p></li>`).join('')}</ul>
<div class="wl-evidence-limit"><strong>What this evidence does not establish</strong><p>${escape(t.limitations)}</p></div>
<details class="wl-score-details"><summary>How the research score works · ${escape(t.research_score)}/100</summary><p>A provisional editorial assessment, not a probability, popularity measure, or recommendation to adopt the technology. Reader votes do not change this score.</p>
${Object.entries(t.rubric).map(([k,v])=>`<div class="wl-score-row"><div><strong>${escape(labels[k]||k)}</strong><span>${v.score===null?'Unknown':escape(v.score)+'/5'} · Weight ${WEIGHTS[k]}%</span></div><p>${escape(v.reason)}</p></div>`).join('')}
<p><strong>Calculation:</strong> add each criterion’s score ÷ 5 × its weight, then round to a whole number. Unknown criteria contribute no points in the existing method; “unknown” does not mean evidence of no momentum.</p><p><strong>Momentum:</strong> ${escape(t.momentum?.reason||'Not recorded')}</p></details>
<p><strong>Next research step:</strong> ${escape(t.next_action)}</p>${t.external_attention?.length?`<p class="wl-note">Outside attention, recorded at the time: ${t.external_attention.map(a=>`${escape(a.value)} ${escape(a.metric)} on ${escape(a.platform)} (${date(a.observed_at)})`).join('; ')}. This is not independent validation or Brief reader interest.</p>`:''}`;
}
