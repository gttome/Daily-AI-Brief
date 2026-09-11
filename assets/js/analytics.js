(() => {
 'use strict';
 const endpoint='https://daily-ai-brief-ratings.gtome.chatgpt.site/api/events';
 const send=(metric,id,date)=>{
  if(!/^dab-(story|video|podcast)-/.test(id||'')||!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return;
  const operation=crypto.randomUUID();
  const options={method:'POST',mode:'cors',credentials:'omit',cache:'no-store',keepalive:true,headers:{'content-type':'application/json','x-operation-id':operation},body:JSON.stringify({brief_date:date,item_id:id,metric})};
  fetch(endpoint,options).then(r=>{if(r.status>=500)return fetch(endpoint,options);}).catch(()=>fetch(endpoint,options).catch(()=>{}));
 };
 // Attribute historical links within their own heading-bounded section; never use
 // the first marker in main as a fallback. New output uses explicit attributes.
 let item=null;
 document.querySelectorAll('#content > *').forEach(el=>{
  if(/^H[1-3]$/.test(el.tagName))item=null;
  const marker=el.matches('.story-data,.podcast-data')?el:el.querySelector('.story-data,.podcast-data');
  if(marker)item={id:marker.dataset.storyId||marker.dataset.podcastId,date:document.body.dataset.briefDate};
  const feedback=el.matches('.story-feedback')?el:el.querySelector('.story-feedback');
  if(feedback && !item)item={id:feedback.dataset.feedbackStoryId,date:feedback.dataset.feedbackBriefDate};
  el.querySelectorAll('a[href]').forEach(a=>{
   if(a.dataset.itemId||!item)return;
   const text=a.textContent.trim();const source=el.querySelector('strong')?.textContent.trim();
   const action=/Open the permanent/.test(text)?'permanent_page_clicks':source==='Source:'||source==='Listen / watch:'?'source_clicks':null;
   if(action)Object.assign(a.dataset,{itemId:item.id,editionDate:item.date,action});
  });
 });
 const activate=event=>{
  if(event.type==='auxclick'&&event.button!==1)return;
  const a=event.target.closest?.('a[data-item-id][data-action]');if(!a)return;
  if(!['source_clicks','permanent_page_clicks'].includes(a.dataset.action))return;
  send(a.dataset.action,a.dataset.itemId,a.dataset.editionDate);
  if(a.dataset.action==='source_clicks'&&/^(www\.)?(youtube\.com|youtu\.be)$/.test(new URL(a.href).hostname))send('worth_watching_clicks',a.dataset.itemId,a.dataset.editionDate);
 };
 document.addEventListener('click',activate);document.addEventListener('auxclick',activate);
 const id=document.body.dataset.storyId,date=document.body.dataset.briefDate;
 const once=(key,fn)=>{try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{}fn();};
 if(id){once(`dab-view:${id}`,()=>send('views',id,date));setTimeout(()=>{if(!document.hidden)once(`dab-retention:${id}`,()=>send('retention_30s',id,date));},30000);}
})();
