(() => {
  'use strict';
  const groups = [...document.querySelectorAll('[data-feedback-story-id][data-feedback-brief-date]')]
    .filter(group => group.querySelector('[data-feedback-rating]'));
  if (!groups.length) return;

  const endpoint = 'https://daily-ai-brief-ratings.gtome.chatgpt.site/api/ratings';
  const storageKey = storyId => 'dab-feedback:' + storyId;
  const confirmedKey = storyId => 'dab-feedback-confirmed:' + storyId;
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

  const legacyStars={most_useful:'5',useful:'4',neutral:'3',not_useful:'1'};
  const meanings=['Not useful','Slightly useful','Useful','Very useful','Extremely useful'];
  const selection = rating => {const star=Number(legacyStars[rating]||rating);return star>=1&&star<=5?`Your rating: ${star}★ · ${meanings[star-1]}`:`Your rating: ${rating}`;};
  const pendingMessage = "Your rating hasn’t reached us yet. We’ll retry when you reopen this page.";
  const finish = (story, rating, message) => {
    delete story.dataset.feedbackPending;
    story.querySelectorAll('[data-feedback-rating]').forEach(button => {
      button.disabled = true;
      if(story.dataset.feedbackScale==='stars'){button.textContent=Number(button.dataset.feedbackRating)<=Number(legacyStars[rating]||rating)?'★':'☆';}
      button.setAttribute('aria-pressed', button.dataset.feedbackRating === (story.dataset.feedbackScale==='stars'?(legacyStars[rating]||rating):rating) ? 'true' : 'false');
    });
    story.querySelector('.feedback-status').textContent = message;
  };

  const send = async (briefDate, storyId, rating, operationId) => {
    const response = await fetch(endpoint, {
      method: 'POST', mode: 'cors', cache: 'no-store', credentials: 'omit',
      headers: {'content-type': 'application/json','x-operation-id':operationId},
      body: JSON.stringify({brief_date: briefDate, item_id: storyId, rating:/^[1-5]$/.test(rating)?Number(rating):rating})
    });
    if (!response.ok) throw new Error('feedback transport unavailable');
    const result = await response.json();
    if (result.recorded !== true) throw new Error('feedback persistence unconfirmed');
  };

  const synchronize = async (story, briefDate, storyId, rating, quiet = false) => {
    let queued;
    try {queued=JSON.parse(read(syncKey(storyId))||'null');}catch{}
    if(queued?.createdAt && Date.now()-queued.createdAt>29*86400000){finish(story,rating,selection(rating) + ' · Delivery could not be confirmed. Automatic retries have ended.');return;}
    const operationId=queued?.operationId || crypto.randomUUID();
    write(syncKey(storyId),JSON.stringify({briefDate,storyId,rating,operationId,createdAt:queued?.createdAt||Date.now()}));
    try {
      await send(briefDate, storyId, rating, operationId);
      window.dabTrack?.('rating_submit_result',{item:storyId,edition:briefDate,result:'success'});write(confirmedKey(storyId), 'true');
      remove(syncKey(storyId));
      finish(story, rating, '✓ ' + selection(rating) + '\nThank you. Your anonymous rating was recorded.');
    } catch (_) {

      window.dabTrack?.('rating_submit_failed',{item:storyId,edition:briefDate,result:'unconfirmed'});finish(story, rating, selection(rating) + '\n' + pendingMessage);
    }
  };

  groups.forEach(story => {
    const storyId = story.dataset.feedbackStoryId;
    const briefDate = story.dataset.feedbackBriefDate;
    const prior = storedRating(storyId);
    const queued = read(syncKey(storyId));

    if (prior) {
      finish(story, prior, queued
        ? selection(prior) + '\n' + pendingMessage
        : (read(confirmedKey(storyId)) ? '✓ ' : '') + selection(prior) + (read(confirmedKey(storyId)) ? '\nThank you. Your anonymous rating was recorded.' : ''));
      if (queued) synchronize(story, briefDate, storyId, prior, true);
    }

    story.addEventListener('click', async event => {
      const button = event.target.closest('[data-feedback-rating]');
      if (!button || button.disabled || story.dataset.feedbackPending === 'true' || storedRating(storyId)) return;
      const rating = button.dataset.feedbackRating;
      story.dataset.feedbackPending = 'true';
      story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = true; });
      story.querySelector('.feedback-status').textContent = 'Recording your rating…';

      if (!write(storageKey(storyId), rating)) {
        delete story.dataset.feedbackPending;
        story.querySelectorAll('[data-feedback-rating]').forEach(item => { item.disabled = false; });
        story.querySelector('.feedback-status').textContent = 'This browser blocked local storage. Please allow site storage and try again.';
        return;
      }

      finish(story, rating, 'Recording your rating…');
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
