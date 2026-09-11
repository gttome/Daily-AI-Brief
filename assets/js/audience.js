(()=>{
 'use strict';
 const base='/Daily-AI-Brief/',endpoint='https://daily-ai-brief-ratings.gtome.chatgpt.site/api/audience';
 const path=location.pathname;if(!path.startsWith(base))return;
 const page=/^\/Daily-AI-Brief\/[a-zA-Z0-9_/-]*(?:\.html)?$/.test(path)?path:base;
 const type=page===base?'home':/\/briefs\//.test(page)?'edition':/\/(stories|videos|podcasts)\//.test(page)?'item':/briefs-archive/.test(page)?'archive':/\/calendar\//.test(page)?'calendar':/\/subscribe\//.test(page)?'subscribe':/\/about\//.test(page)?'about':'other';
 const ua=navigator.userAgent;const os=/Android/i.test(ua)?'android':/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'ios':/Windows/.test(ua)?'windows':/Mac/.test(ua)?'macos':/Linux/.test(ua)?'linux':'other';
 const browser=/Edg/.test(ua)?'edge':/Firefox|FxiOS/.test(ua)?'firefox':/Chrome|CriOS/.test(ua)?'chrome':/Safari/.test(ua)?'safari':'other';
 const device=/iPad|Tablet/.test(ua)||(os==='ios'&&!/iPhone|iPod/.test(ua))||(os==='android'&&!/Mobile/.test(ua))?'tablet':/Mobile|iPhone/.test(ua)?'phone':'desktop';
 let referral='direct_unknown';const source=new URLSearchParams(location.search).get('dab_source');
 if(['calendar_personal','calendar_shared','rss'].includes(source))referral=source;
 else if(document.referrer){try{const h=new URL(document.referrer).hostname;referral=h===location.hostname?'internal':/google\.|bing\.|duckduckgo\.|yahoo\./.test(h)?'search':'external';}catch{}}
 // Store only a channel label for up to 30 minutes in this tab, never a reader ID.
 try{const previous=JSON.parse(sessionStorage.getItem('dab-channel')||'null');if(['calendar_personal','calendar_shared','rss'].includes(referral))sessionStorage.setItem('dab-channel',JSON.stringify({source:referral,at:Date.now()}));else if(referral==='internal'&&previous&&Date.now()-previous.at<1800000&&['calendar_personal','calendar_shared','rss'].includes(previous.source))referral=previous.source;}catch{}
 const qa=new URLSearchParams(location.search).get('dab_qa')==='1';
 const common={traffic:qa?'qa':'reader',page,page_type:type,device,os,browser,referral,viewport:innerWidth<400?'small_phone':innerWidth<600?'large_phone':innerWidth<1000?'tablet':'desktop'};
 const language=(navigator.language||'').split('-')[0].toLowerCase();if(/^[a-z]{2,3}$/.test(language))common.language=language;
 try{common.zone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{}
 let queue=[],timer,help=false,setups=0,helpOutcomeSent=false;
 function flush(){clearTimeout(timer);if(!queue.length)return;const batch=queue.splice(0,20);const options={method:'POST',credentials:'omit',keepalive:true,headers:{'content-type':'application/json'},body:JSON.stringify(batch)};fetch(endpoint,options).then(r=>{if(r.status>=500)return fetch(endpoint,options);}).catch(()=>fetch(endpoint,options).catch(()=>{}));if(queue.length)timer=setTimeout(flush,100);}
 const timeDetails=()=>{const time=document.querySelector('#calendar-time')?.value;return /^([01]\d|2[0-3]):[0-5]\d$/.test(time||'')?{time,choice:time==='09:00'?'default':'custom'}:{};};
 const track=(event,details={})=>{if(queue.length>=100)return;const dimensions={...common,hour:String(new Date().getHours()),...details};Object.keys(dimensions).forEach(k=>{if(dimensions[k]===undefined||dimensions[k]==='')delete dimensions[k];});queue.push({event,dimensions,operation:crypto.randomUUID()});if(queue.length>=10)flush();else{clearTimeout(timer);timer=setTimeout(flush,400);}};
 window.dabTrack=track;
 const markHelp=()=>{if(!help)track('subscription_help_session');help=true;};
 const place=el=>el?.closest('dialog')?'dialog':el?.closest('header')?'header':el?.closest('footer')?'footer':el?.closest('.subscription-card')?'subscription':'body';
 const context=el=>{let node=el;let id=document.body.dataset.storyId,date=document.body.dataset.briefDate;const direct=el?.closest('[data-item-id],[data-feedback-story-id],[data-share-counter-key]');if(direct){id=direct.dataset.itemId||direct.dataset.feedbackStoryId||direct.dataset.shareCounterKey;date=direct.dataset.editionDate||direct.dataset.feedbackBriefDate||date;}
 while(!id&&node&&node!==document.querySelector('main')){const marker=node.querySelector?.('[data-story-id],[data-podcast-id]');if(marker)id=marker.dataset.storyId||marker.dataset.podcastId;node=node.previousElementSibling||node.parentElement;}
 return {...(/^dab-(story|video|podcast)-[a-zA-Z0-9_-]{1,120}$/.test(id||'')?{item:id}:{}),...(/^\d{4}-\d{2}-\d{2}$/.test(date||'')?{edition:date}:{})};};
 function setup(event,details){const extra={...details,after_help:help?'yes':'no',repeat:setups?'yes':'no'};track(event,extra);if(setups)track('subscription_setup_repeat',details);if(help&&setups===0)track('subscription_setup_after_help',details);setups++;}
 document.addEventListener('click',activate,true);document.addEventListener('auxclick',activate,true);
 function activate(e){if(e.type==='auxclick'&&e.button!==1)return;const el=e.target.closest?.('a,button,input[type=time],input[readonly]');if(!el)return;const d={placement:place(el),...context(el),activation:e.type==='auxclick'?'middle':e.detail===0?'keyboard':'primary'};const text=el.textContent.trim();
 if(el.matches('#calendar-time'))return track('calendar_time_picker_open',{...d,...timeDetails(),method:'personal_calendar'});
 if(el.matches('.calendar-google'))return setup('calendar_google_click',{...d,...timeDetails(),method:'personal_calendar',calendar:'google'});
 if(el.matches('.calendar-download'))return setup('calendar_download_click',{...d,...timeDetails(),method:'personal_calendar',calendar:el.dataset.calendar||'unknown'});
 if(el.matches('.rss-copy')){setup('rss_copy_click',{...d,method:'rss'});return;}
 if(el.matches('.rss-help-open,.rss-follow')){markHelp();return track('rss_help_open',{...d,method:'rss'});}
 if(el.matches('.rss-address'))return track(el.value?.endsWith('calendar.ics')?'calendar_address_select':'rss_address_select',{...d,method:el.value?.endsWith('calendar.ics')?'shared_calendar':'rss'});
 if(el.matches('.comment-open'))return track('comment_open',d);
 if(el.matches('.brief-share-button'))return track('item_share_detail',d);
 if(el.matches('[data-feedback-rating]')&&!el.disabled)return track('item_rating_detail',{...d,value:el.dataset.feedbackRating});
 if(el.matches('.brief-share-copy'))return track('share_copy_click',{...d,channel:'copy'});
 if(el.matches('.brief-share-option')){const channel=text.toLowerCase();return track('share_channel_click',{...d,channel:['email','whatsapp','linkedin','facebook','x'].includes(channel)?channel:'none'});}
 if(el.tagName!=='A')return;
 let url;try{url=new URL(el.href);}catch{return;}const p=url.pathname;
 if(url.protocol==='webcal:')return setup('calendar_subscription_click',{...d,method:'shared_calendar',calendar:'apple',time:'09:00',choice:'default'});
 if(el.dataset.action){return track('item_link_detail',{...d,target:text.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,80)||'link',link_kind:/transcript/i.test(text)?'transcript':/episode|listen/i.test(text)?'episode':el.dataset.action==='source_clicks'?'source':'item'});}
 if(url.hash==='#subscribe')return track('subscribe_navigation_click',d);
 if(/\/calendar\//.test(p)&&url.hostname===location.hostname)return track('calendar_setup_click',d);
 if(/\/subscribe\//.test(p)&&url.hostname===location.hostname)return track('subscription_help_page_click',d);
 if(/(?:daily-feed|feed)\.(xml|json)$/.test(p)){setup('rss_feed_open_click',{...d,method:'rss',link_kind:p.endsWith('daily-feed.xml')?'rss_daily':'rss_legacy'});return;}
 if(/support\.(google|microsoft)\.com/.test(url.hostname))return track('calendar_support_click',{...d,link_kind:url.hostname.includes('google')?'support_google':'support_microsoft'});
 if(/leanpub\.com/.test(url.hostname))return track('book_series_click',d);
 if(url.hostname===location.hostname){if(p===base&&!url.hash)return track('home_navigation_click',d);if(p.includes('briefs-archive'))return track('archive_navigation_click',d);if(p.includes('/about/'))return track('about_navigation_click',d);const date=p.match(/\/briefs\/(\d{4}-\d{2}-\d{2})/);if(date)return track('archive_edition_click',{...d,edition:date[1]});if(url.hash)return track('section_navigation_click',{...d,target:url.hash.slice(1).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'content'});}
 track('other_link_click',{...d,link_kind:'other',target:el.dataset.trackTarget||text.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,80)||'unclassified'});
 }
 document.addEventListener('change',e=>{if(e.target.matches('#calendar-time'))track('calendar_time_changed',{...timeDetails(),method:'personal_calendar'});});
 document.addEventListener('copy',e=>{const input=e.target.closest?.('input[readonly]');if(!input||!input.classList.contains('rss-address'))return;const cal=input.value.endsWith('calendar.ics');track(cal?'calendar_address_copy':'rss_address_copy',{placement:place(input),method:cal?'shared_calendar':'rss'});});
 document.addEventListener('toggle',e=>{const el=e.target;if(el.tagName!=='DETAILS')return;if(el.classList.contains('rating-guide'))return track(el.open?'rating_help_open':'rating_help_close',context(el));if(type==='calendar'){const s=el.querySelector('summary')?.textContent||'';const h=/Android/.test(s)?'android':/iPhone/.test(s)?'iphone':/Windows/.test(s)?'windows':'other';if(el.open)markHelp();track(el.open?'calendar_device_help_open':'calendar_device_help_close',{help:h});}},true);
 document.addEventListener('close',e=>{const el=e.target;if(el.classList?.contains('rss-dialog'))track('rss_help_close',{result:el.dataset.closeReason||'closed'});if(el.classList?.contains('brief-share-dialog')&&!el.dataset.shareAction)track('share_dialog_cancel',{result:el.dataset.closeReason||'closed'});},true);
 document.addEventListener('click',e=>{if(e.target.closest?.('.rss-done'))e.target.closest('dialog').dataset.closeReason='done';if(e.target.closest?.('.brief-share-copy,.brief-share-option'))e.target.closest('dialog').dataset.shareAction='yes';},true);
 document.addEventListener('cancel',e=>{if(e.target.tagName==='DIALOG')e.target.dataset.closeReason='escape';},true);
 track('page_view');if(type==='calendar'){track('calendar_setup_view');markHelp();}if(type==='subscribe'){track('subscription_help_view');markHelp();}
 if(source==='rss')track('rss_return');if(['calendar_personal','calendar_shared'].includes(source))track('calendar_reminder_return');
 const section=document.querySelector('#subscribe');if(section&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){track('subscription_section_view');observer.disconnect();}},{threshold:0.1});observer.observe(section);}
 addEventListener('pagehide',()=>{if(help&&!setups&&!helpOutcomeSent){track('subscription_help_without_setup');helpOutcomeSent=true;}flush();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
})();
