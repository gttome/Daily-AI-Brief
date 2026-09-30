import {filterArchiveItems,inDateRange,invalidDateRange} from './archive-model.js';
(() => {
  'use strict';
  const results = document.querySelector('#archive-results');
  if (!results) return;
  const base = document.body.dataset.baseurl || '';
  const controls = Object.fromEntries(['query','from','to','type','focus','evidence','status','trend'].map(key=>[key,document.querySelector('#archive-'+key)]));
  const pretty = value => ({technical_ai_engineering:'Technical AI Engineering',applied_genai_knowledge_workers:'Applied Generative AI for Knowledge Workers',agents_non_technical_people:'Agents for Non-Technical People',historical_unspecified:'Earlier edition'}[value] || String(value||'Unspecified').split('_').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' '));
  const option = (select, value, text = pretty(value)) => { const el = document.createElement('option'); el.value = value; el.textContent = text; select.appendChild(el); };
  const unique = (stories, key) => [...new Set(stories.flatMap(story => story[key] || []))].sort();
  fetch(`${base}/data/archive-index.json`, {credentials: 'omit'})
    .then(response => { if (!response.ok) throw new Error(`archive index ${response.status}`); return response.json(); })
    .then(index => {
      const stories = index.stories || [];
      unique(stories, 'focus').forEach(value => option(controls.focus, value));
      unique(stories, 'evidence_type').forEach(value => option(controls.evidence, value));
      unique(stories, 'availability_status').forEach(value => option(controls.status, value));
      unique(stories, 'trends').forEach(value => option(controls.trend, value, value));
      const editionCards=[...document.querySelectorAll('[data-archive-edition]')];
      const itemPanel=document.querySelector('#archive-items-panel'),editionPanel=document.querySelector('#archive-editions-panel');
      const tabs=[document.querySelector('#archive-items-tab'),document.querySelector('#archive-editions-tab')];
      let view=location.hash==='#editions'?'editions':'items',searchTimer;
      const range=n=>n===0?'0':n<=5?'1-5':n<=20?'6-20':'21+';
      const values=()=>Object.fromEntries(Object.entries(controls).map(([key,control])=>[key,control.value]));
      const setView=next=>{view=next;itemPanel.hidden=view!=='items';editionPanel.hidden=view!=='editions';tabs.forEach((tab,i)=>{const active=i===(view==='items'?0:1);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});};
      const render = () => {
        const filters=values(),invalid=invalidDateRange(filters),filtered=filterArchiveItems(stories,filters);
        document.querySelector('#archive-date-error').hidden=!invalid;
        results.replaceChildren(...filtered.map(story => {
          const article=document.createElement('article');article.className='archive-story';
          const meta=document.createElement('p');meta.className='archive-story-meta';
          const badge=document.createElement('span');badge.className='archive-type';badge.textContent=story.content_type||'Article';meta.append(badge,` ${story.brief_date} · ${pretty(story.focus)}`);
          const heading=document.createElement('h2'),link=document.createElement('a');link.href=/^https:\/\//.test(story.url)?story.url:`${base}${story.url}`;Object.assign(link.dataset,{itemId:story.story_id,editionDate:story.brief_date,action:'permanent_page_clicks'});link.textContent=story.headline;heading.appendChild(link);
          const summary=document.createElement('p');summary.textContent=story.summary;
          const edition=document.createElement('a');edition.className='archive-edition-link';edition.href=`${base}/briefs/${story.brief_date}/`;edition.textContent=`Read the complete ${story.brief_date} edition →`;
          article.append(meta,heading,summary,edition);return article;
        }));
        results.dataset.count=String(filtered.length);
        const counts=['Article','Video','Podcast'].map(type=>{const n=filtered.filter(x=>(x.content_type||'Article')===type).length;return `${n} ${type.toLowerCase()}${n===1?'':'s'}`;});
        document.querySelector('#archive-result-count').textContent=`${filtered.length} ${filtered.length===1?'item':'items'} · ${counts.join(' · ')}`;
        document.querySelector('#archive-empty').hidden=invalid||filtered.length>0;
        let editionCount=0;editionCards.forEach(card=>{card.hidden=invalid||!inDateRange(card.dataset.archiveEdition,filters);if(!card.hidden)editionCount++;});
        document.querySelector('#archive-edition-count').textContent=`${editionCount} complete ${editionCount===1?'edition':'editions'}`;
        document.querySelector('#archive-editions-empty').hidden=invalid||editionCount>0;
        document.querySelector('#archive-advanced-active').textContent=['focus','evidence','status','trend'].some(key=>filters[key])?' · active':'';
      };
      const reset=()=>{clearTimeout(searchTimer);Object.values(controls).forEach(control=>{control.value='';});render();};
      Object.values(controls).forEach(control=>control.addEventListener(control.type==='search'||control.type==='date'?'input':'change',render));
      Object.entries(controls).forEach(([key,control])=>control.addEventListener(key==='query'?'input':'change',()=>{if(key==='query'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{window.dabTrack?.('archive_search_used',{range:range(Number(results.dataset.count))});if(results.dataset.count==='0')window.dabTrack?.('archive_zero_results');},700);}else{window.dabTrack?.('archive_filter_changed',{filter:key,value:control.value.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'all',range:range(Number(results.dataset.count))});if(results.dataset.count==='0')window.dabTrack?.('archive_zero_results');}}));
      for(const id of ['archive-reset','archive-clear'])document.querySelector('#'+id).addEventListener('click',()=>{window.dabTrack?.('archive_reset_click');reset();if(view==='items')controls.query.focus();});
      tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>setView(i===0?'items':'editions'));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-i;setView(next===0?'items':'editions');tabs[next].focus();}});});
      document.querySelectorAll('[data-archive-show-date]').forEach(button=>{button.hidden=false;button.addEventListener('click',()=>{reset();controls.from.value=button.dataset.archiveShowDate;controls.to.value=button.dataset.archiveShowDate;render();setView('items');tabs[0].focus();});});
      document.querySelectorAll('.archive-browser .archive-controls[hidden],.archive-view-switch').forEach(el=>el.hidden=false);
      render();setView(view);
    })
    .catch(() => {window.dabTrack?.('archive_load_failed',{result:'failed'}); document.querySelector('#archive-result-count').textContent = 'Search index unavailable; chronological archive remains below.'; });
})();
