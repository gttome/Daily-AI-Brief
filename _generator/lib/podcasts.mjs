export const MULTI_PODCAST_EFFECTIVE_DATE='2026-09-18';
export const EMPTY_PODCAST_COPY='No podcast met today’s editorial quality standards.';
export const RESTRICTED_DAILY_SHOW='The AI Daily Brief';

export function editionPodcasts(edition){
 if(edition?.brief_date>=MULTI_PODCAST_EFFECTIVE_DATE&&Array.isArray(edition.podcasts))return edition.podcasts.filter(item=>item?.status==='included');
 return edition?.podcast?.status==='included'?[edition.podcast]:[];
}

export function podcastCollectionState(edition){
 const included=editionPodcasts(edition);
 const explicitCollection=edition?.brief_date>=MULTI_PODCAST_EFFECTIVE_DATE&&Array.isArray(edition?.podcasts);
 const empty=explicitCollection?edition.podcasts.length===0:edition?.podcast?.status==='empty';
 return {included,empty,explicit_collection:explicitCollection,count:included.length};
}

export function validatePodcastDiversity(edition){
 const items=editionPodcasts(edition),errors=[];
 if(items.length>2)errors.push('podcasts may include at most two episodes');
 const shows=items.map(item=>item.show).filter(Boolean);
 if(new Set(shows).size!==shows.length)errors.push('published podcasts must come from different shows/sources');
 if(items.filter(item=>item.show===RESTRICTED_DAILY_SHOW).length>1)errors.push(`no more than one ${RESTRICTED_DAILY_SHOW} episode may be published per edition`);
 const ids=items.map(item=>item.item_id).filter(Boolean),urls=items.map(item=>item.url).filter(Boolean);
 if(new Set(ids).size!==ids.length)errors.push('podcast item IDs must be unique');
 if(new Set(urls).size!==urls.length)errors.push('podcast source URLs must be unique');
 return errors;
}
