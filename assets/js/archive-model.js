export const inDateRange=(date,filters)=>(!filters.from||date>=filters.from)&&(!filters.to||date<=filters.to);
export const invalidDateRange=filters=>Boolean(filters.from&&filters.to&&filters.from>filters.to);
export function filterArchiveItems(items,filters={}){
 if(invalidDateRange(filters))return [];
 const q=(filters.query||'').trim().toLowerCase();
 return items.filter(item=>inDateRange(item.brief_date,filters)&&(!filters.type||(item.content_type||'Article')===filters.type)&&(!q||[item.headline,item.summary,...(item.topics||[]),...(item.companies||[])].join(' ').toLowerCase().includes(q))&&(!filters.focus||item.focus===filters.focus)&&(!filters.evidence||item.evidence_type===filters.evidence)&&(!filters.status||item.availability_status===filters.status)&&(!filters.trend||(item.trends||[]).includes(filters.trend)));
}
