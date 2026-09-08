(() => {
  'use strict';
  const panel = document.querySelector('.weekly-feedback[data-feedback-brief-date]');
  if (!panel) return;
  const endpoint = 'https://countapi.mileshilliard.com/api/v1/hit';
  const briefDate = panel.dataset.feedbackBriefDate;
  const storageKey = storyId => 'dab-feedback:' + storyId;
  const counterKey = (storyId, rating) => ('dab-v1-' + briefDate + '-' + storyId + '-feedback_' + rating).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);

  const storedRating = storyId => {
    try { return localStorage.getItem(storageKey(storyId)); } catch (_) { return null; }
  };
  const rememberRating = (storyId, rating) => {
    try { localStorage.setItem(storageKey(storyId), rating); } catch (_) {}
  };
  const finish = (story, rating, message) => {
    story.querySelectorAll('[data-feedback-rating]').forEach(button => {
      button.disabled = true;
      button.setAttribute('aria-pressed', button.dataset.feedbackRating === rating ? 'true' : 'false');
    });
    story.querySelector('.feedback-status').textContent = message;
  };

  panel.querySelectorAll('.feedback-story[data-feedback-story-id]').forEach(story => {
    const storyId = story.dataset.feedbackStoryId;
    const prior = storedRating(storyId);
    if (prior) finish(story, prior, 'Your rating is saved in this browser.');
    story.addEventListener('click', async event => {
      const button = event.target.closest('[data-feedback-rating]');
      if (!button || button.disabled || story.dataset.feedbackPending === 'true' || storedRating(storyId)) return;
      const rating = button.dataset.feedbackRating;
      story.dataset.feedbackPending = 'true';
      story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = true; });
      story.querySelector('.feedback-status').textContent = 'Recording…';
      try {
        const response = await fetch(endpoint + '/' + encodeURIComponent(counterKey(storyId, rating)), {method: 'GET', mode: 'cors', cache: 'no-store', credentials: 'omit'});
        if (!response.ok) throw new Error('feedback transport unavailable');
        rememberRating(storyId, rating);
        finish(story, rating, 'Thank you—your anonymous rating was recorded.');
      } catch (_) {
        delete story.dataset.feedbackPending;
        story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = false; });
        story.querySelector('.feedback-status').textContent = 'Your rating could not be recorded. Please try again.';
      }
    });
  });

  document.querySelector('#share-feedback-page')?.addEventListener('click', async () => {
    const data = {title: document.title, text: 'Rate this week’s Daily Generative AI Brief.', url: location.href};
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
