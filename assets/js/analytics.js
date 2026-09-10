(() => {
  'use strict';
  const ENDPOINT = 'https://daily-ai-brief-ratings.gtome.chatgpt.site/api/events';
  const briefDate = document.body.dataset.briefDate;
  const bodyStory = document.body.dataset.storyId;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(briefDate || '')) return;
  const storyIdFor = element => bodyStory || element?.closest('main')?.querySelector('.story-data[data-story-id]')?.dataset.storyId || '';
  const record = (metric, storyId = bodyStory) => {
    if (!storyId) return;
    fetch(ENDPOINT, {
      method: 'POST', mode: 'cors', cache: 'no-store', credentials: 'omit', keepalive: true,
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({brief_date: briefDate, item_id: storyId, metric})
    }).catch(() => {});
  };
  const once = (name, callback) => { try { if (sessionStorage.getItem(name)) return; sessionStorage.setItem(name, '1'); } catch (_) {} callback(); };
  if (bodyStory) {
    once(`dab-view:${bodyStory}`, () => record('views'));
    setTimeout(() => { if (!document.hidden) once(`dab-retention:${bodyStory}`, () => record('retention_30s')); }, 30000);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]'); if (!link) return;
    let section = link.closest('p,li,div');
    let sectionId = '';
    while (section && !/^H[12]$/.test(section.tagName)) { sectionId = section.matches?.('.podcast-data') ? section.dataset.podcastId : section.querySelector?.('.podcast-data')?.dataset.podcastId; if (sectionId) break; section = section.previousElementSibling; }
    const storyId = bodyStory || sectionId || link.closest('.dab-story')?.querySelector('.story-data')?.dataset.storyId || storyIdFor(link);
    if (/youtube\.com|youtu\.be/i.test(link.href)) record('worth_watching_clicks', storyId);
    else if (sectionId) record('source_clicks', storyId);
    else if (link.closest('p')?.querySelector('strong:first-child')?.textContent.trim() === 'Source:') record('source_clicks', storyId);
  });
})();
