(() => {
  'use strict';
  const groups = [...document.querySelectorAll('[data-feedback-story-id][data-feedback-brief-date]')]
    .filter(group => group.querySelector('[data-feedback-rating]'));
  if (!groups.length) return;

  const endpoint = 'https://daily-ai-brief-ratings.gtome.chatgpt.site/api/ratings';
  const storageKey = storyId => 'dab-feedback:' + storyId;
  const syncKey = storyId => 'dab-feedback-sync:' + storyId;
  const read = key => {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  };
  const remove = key => {
    try { localStorage.removeItem(key); } catch (_) {}
  };
  const storedRating = storyId => read(storageKey(storyId));

  const finish = (story, rating, message) => {
    delete story.dataset.feedbackPending;
    story.querySelectorAll('[data-feedback-rating]').forEach(button => {
      button.disabled = true;
      button.setAttribute('aria-pressed', button.dataset.feedbackRating === rating ? 'true' : 'false');
    });
    story.querySelector('.feedback-status').textContent = message;
  };

  const send = async (briefDate, storyId, rating) => {
    const response = await fetch(endpoint, {
      method: 'POST', mode: 'cors', cache: 'no-store', credentials: 'omit',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({brief_date: briefDate, item_id: storyId, rating})
    });
    if (!response.ok) throw new Error('feedback transport unavailable');
    const result = await response.json();
    if (result.recorded !== true || !Number.isInteger(result.count)) throw new Error('feedback persistence unconfirmed');
  };

  const synchronize = async (story, briefDate, storyId, rating, quiet = false) => {
    try {
      await send(briefDate, storyId, rating);
      remove(syncKey(storyId));
      finish(story, rating, 'Thank you—your anonymous rating was recorded.');
    } catch (_) {
      write(syncKey(storyId), JSON.stringify({briefDate, storyId, rating}));
      finish(story, rating, quiet
        ? 'Your rating is saved on this device; synchronization is pending.'
        : 'Rating saved on this device; synchronization pending.');
    }
  };

  groups.forEach(story => {
    const storyId = story.dataset.feedbackStoryId;
    const briefDate = story.dataset.feedbackBriefDate;
    const prior = storedRating(storyId);
    const queued = read(syncKey(storyId));

    if (prior) {
      finish(story, prior, queued
        ? 'Your rating is saved on this device; synchronization is pending.'
        : 'Your rating is saved in this browser.');
      if (queued) synchronize(story, briefDate, storyId, prior, true);
    }

    story.addEventListener('click', async event => {
      const button = event.target.closest('[data-feedback-rating]');
      if (!button || button.disabled || story.dataset.feedbackPending === 'true' || storedRating(storyId)) return;
      const rating = button.dataset.feedbackRating;
      story.dataset.feedbackPending = 'true';
      story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = true; });
      story.querySelector('.feedback-status').textContent = 'Saving…';

      if (!write(storageKey(storyId), rating)) {
        delete story.dataset.feedbackPending;
        story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = false; });
        story.querySelector('.feedback-status').textContent = 'This browser blocked local storage. Please allow site storage and try again.';
        return;
      }

      finish(story, rating, 'Rating saved on this device; synchronizing…');
      await synchronize(story, briefDate, storyId, rating);
    });
  });

  document.querySelector('#share-feedback-page')?.addEventListener('click', async () => {
    const data = {title: document.title, text: 'Rate today’s Daily Generative AI Brief.', url: location.href};
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(location.href);
      document.querySelector('#share-feedback-page').textContent = 'Link copied';
    } catch (_) {
      location.href = 'mailto:?subject=' + encodeURIComponent(data.title) + '&body=' + encodeURIComponent(data.text + '\n\n' + data.url);
    }
  });
})();
