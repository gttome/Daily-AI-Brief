(() => {
  'use strict';
  const ENDPOINT = 'https://countapi.mileshilliard.com/api/v1/hit';
  const briefDate = document.body.dataset.briefDate;
  const bodyStory = document.body.dataset.storyId;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(briefDate || '')) return;
  const storyIdFor = element => bodyStory || element?.closest('main')?.querySelector('.story-data[data-story-id]')?.dataset.storyId || '';
  const key = (storyId, metric) => `dab-v1-${briefDate}-${storyId}-${metric}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
  const record = (metric, storyId = bodyStory) => {
    if (!storyId) return;
    fetch(`${ENDPOINT}/${encodeURIComponent(key(storyId, metric))}`, {method: 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit', keepalive: true}).catch(() => {});
  };
  const once = (name, callback) => { try { if (sessionStorage.getItem(name)) return; sessionStorage.setItem(name, '1'); } catch (_) {} callback(); };
  if (bodyStory) {
    once(`dab-view:${bodyStory}`, () => record('views'));
    setTimeout(() => { if (!document.hidden) once(`dab-retention:${bodyStory}`, () => record('retention_30s')); }, 30000);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]'); if (!link) return;
    const storyId = bodyStory || link.closest('.dab-story')?.querySelector('.story-data')?.dataset.storyId || storyIdFor(link);
    if (/youtube\.com|youtu\.be/i.test(link.href)) record('worth_watching_clicks', storyId);
    else if (link.closest('p')?.querySelector('strong:first-child')?.textContent.trim() === 'Source:') record('source_clicks', storyId);
  });
  document.addEventListener('dab:share', event => record('share_initiations', event.detail?.storyId || bodyStory));
})();
