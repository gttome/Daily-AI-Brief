const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dailyTopicGroups(data){
 const groups={new_today:[],updated_today:[],carried_forward:[]};
 for(const t of data.topics||[])if(t.status!=='archived'){
  const key=String(t.first_detected||'').slice(0,10)===data.edition_date?'new_today':String(t.updated_at||'').slice(0,10)===data.edition_date?'updated_today':'carried_forward';
  groups[key].push({topic_id:t.topic_id,name:t.name});
 }
 return groups;
}
export function renderDailyTopicGroups(data){
 const groups=dailyTopicGroups(data),labels={new_today:'New today',updated_today:'Updated today',carried_forward:'Carried forward'};
 const counts=`${groups.new_today.length} new today · ${groups.updated_today.length} updated · ${groups.carried_forward.length} carried forward.`;
 const accessibleCounts=Object.entries(groups).map(([key,items])=>`${items.length} ${labels[key]}`).join(' · ');
 return `<div class="watchlist-daily-summary"><p class="watchlist-daily-counts" aria-label="${accessibleCounts}"><strong>${counts}</strong></p>${Object.entries(groups).map(([key,items])=>`<p><strong>${labels[key]}:</strong> ${items.length?'':'None'}</p>${items.length?`<ul class="watchlist-daily-items">${items.map(t=>`<li>${escape(t.name)}</li>`).join('')}</ul>`:''}`).join('')}</div>`;
}
