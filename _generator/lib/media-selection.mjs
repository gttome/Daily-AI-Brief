// Candidates are editorial evidence records, not inferred metadata.
export function selectVideo(candidates,slot,date){
 const eligible=candidates.filter(c=>c.slot===slot && c.verified===true && c.editorial_pass===true && c.duplicate!==true && Number.isInteger(c.runtime_seconds) && c.runtime_seconds>0 && c.runtime_seconds<=1200 && c.upload_date && (Date.parse(date)-Date.parse(c.upload_date))/86400000>=0 && (Date.parse(date)-Date.parse(c.upload_date))/86400000<=30);
 const short=eligible.filter(c=>c.runtime_seconds<=600).sort((a,b)=>(b.score||0)-(a.score||0));
 const long=eligible.filter(c=>c.runtime_seconds>600).sort((a,b)=>(b.score||0)-(a.score||0));
 return short.length?{candidate:short[0],tier:'short'}:long.length?{candidate:long[0],tier:'fallback',short_search_evidence:candidates.filter(c=>c.slot===slot).map(c=>`${c.url}: ${c.rejection_reason || (c.runtime_seconds>600?'exceeds short tier':'not eligible')}`)}:{candidate:null,tier:'empty'};
}
