(() => {
  'use strict';
  const results = document.querySelector('#archive-results');
  if (!results) return;
  const base = document.body.dataset.baseurl || '';
  const controls = {
    query: document.querySelector('#archive-query'), from: document.querySelector('#archive-from'), to: document.querySelector('#archive-to'),
    focus: document.querySelector('#archive-focus'), evidence: document.querySelector('#archive-evidence'), status: document.querySelector('#archive-status'), trend: document.querySelector('#archive-trend')
  };
  const pretty = value => value.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
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
      const render = () => {
        const q = controls.query.value.trim().toLowerCase();
        const filtered = stories.filter(story => {
          const haystack = [story.content_type, story.headline, story.summary, ...(story.topics || []), ...(story.companies || [])].join(' ').toLowerCase();
          return (!q || haystack.includes(q)) && (!controls.from.value || story.brief_date >= controls.from.value) && (!controls.to.value || story.brief_date <= controls.to.value) && (!controls.focus.value || story.focus === controls.focus.value) && (!controls.evidence.value || story.evidence_type === controls.evidence.value) && (!controls.status.value || story.availability_status === controls.status.value) && (!controls.trend.value || (story.trends || []).includes(controls.trend.value));
        });
        results.replaceChildren(...filtered.map(story => {
          const article = document.createElement('article'); article.className = 'archive-story';
          const meta = document.createElement('p'); meta.className = 'archive-story-meta'; meta.textContent = `${story.brief_date} · ${story.content_type || "Article"} · ${pretty(story.focus)}`;
          const heading = document.createElement('h2'); const link = document.createElement('a'); link.href = /^https:\/\//.test(story.url)?story.url:`${base}${story.url}`; Object.assign(link.dataset,{itemId:story.story_id,editionDate:story.brief_date,action:'permanent_page_clicks'}); link.textContent = story.headline; heading.appendChild(link);
          const summary = document.createElement('p'); summary.textContent = story.summary;
          article.append(meta, heading, summary); return article;
        }));
        document.querySelector('#archive-result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`;
      };
      Object.values(controls).forEach(control => control.addEventListener(control.type === 'search' ? 'input' : 'change', render));
      document.querySelector('#archive-reset').addEventListener('click', () => { Object.values(controls).forEach(control => { control.value = ''; }); render(); controls.query.focus(); });
      render();
    })
    .catch(() => { document.querySelector('#archive-result-count').textContent = 'Search index unavailable; chronological archive remains below.'; });
})();
