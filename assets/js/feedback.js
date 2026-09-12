(() => {
  'use strict';
  const groups = [...document.querySelectorAll('[data-feedback-story-id][data-feedback-brief-date]')]
    .filter(group => group.querySelector('[data-feedback-rating]'));
  if (!groups.length) return;

  const endpoint = 'https://daily-ai-brief-ratings.gtome.chatgpt.site/api/ratings';
  const storageKey = storyId => 'dab-feedback:' + storyId;
  const confirmedKey = storyId => 'dab-feedback-confirmed:' + storyId;
  const syncKey = storyId => 'dab-feedback-sync:' + storyId;
  const sessionKey = storyId => 'dab-feedback-session:' + storyId;
  const read = key => {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  };
  const remove = key => {
    try { localStorage.removeItem(key); } catch (_) {}
  };
  const readSession = key => {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  };
  const writeSession = (key, value) => {
    try { sessionStorage.setItem(key, value); return true; } catch (_) { return false; }
  };
  const sessionBallot = storyId => {
    try { return JSON.parse(readSession(sessionKey(storyId)) || 'null'); } catch (_) { return null; }
  };
  const storedRating = storyId => read(storageKey(storyId));

  const legacyStars={most_useful:'5',useful:'4',neutral:'3',not_useful:'1'};
  const meanings=['Not useful','Slightly useful','Useful','Very useful','Extremely useful'];
  const selection = rating => {const star=Number(legacyStars[rating]||rating);return star>=1&&star<=5?`Your rating: ${star}★ · ${meanings[star-1]}`:`Your rating: ${rating}`;};
  const pendingMessage = "Your rating hasn’t reached us yet. We’ll retry when you reopen this page.";
  const finish = (story, rating, message, allowChanges = false) => {
    delete story.dataset.feedbackPending;
    story.querySelectorAll('[data-feedback-rating]').forEach(button => {
      button.disabled = !allowChanges;
      if(story.dataset.feedbackScale==='stars'){button.textContent=Number(button.dataset.feedbackRating)<=Number(legacyStars[rating]||rating)?'★':'☆';}
      button.setAttribute('aria-pressed', button.dataset.feedbackRating === (story.dataset.feedbackScale==='stars'?(legacyStars[rating]||rating):rating) ? 'true' : 'false');
    });
    story.querySelector('.feedback-status').textContent = message;
  };

  const send = async (briefDate, storyId, rating, operationId, revision) => {
    const response = await fetch(endpoint, {
      method: 'POST', mode: 'cors', cache: 'no-store', credentials: 'omit',
      headers: {'content-type': 'application/json','x-operation-id':operationId,'x-rating-revision':String(revision)},
      body: JSON.stringify({brief_date: briefDate, item_id: storyId, rating:/^[1-5]$/.test(rating)?Number(rating):rating})
    });
    if (!response.ok) throw new Error('feedback transport unavailable');
    const result = await response.json();
    if (result.recorded !== true) throw new Error('feedback persistence unconfirmed');
  };

  const synchronize = async (story, briefDate, storyId, rating, ballot) => {
    let queued;
    try {queued=JSON.parse(read(syncKey(storyId))||'null');}catch{}
    if(queued?.createdAt && Date.now()-queued.createdAt>29*86400000){finish(story,rating,selection(rating) + ' · Delivery could not be confirmed. Automatic retries have ended.');return;}
    const operationId=ballot?.operationId || queued?.operationId || crypto.randomUUID();
    const revision=ballot?.revision || queued?.revision || 1;
    write(syncKey(storyId),JSON.stringify({briefDate,storyId,rating,operationId,revision,createdAt:queued?.createdAt||Date.now()}));
    try {
      await send(briefDate, storyId, rating, operationId, revision);
      window.dabTrack?.('rating_submit_result',{item:storyId,edition:briefDate,result:'success'});write(confirmedKey(storyId), 'true');
      remove(syncKey(storyId));
      finish(story, rating, '✓ ' + selection(rating) + '\nRecorded. You can change this rating while this page session stays open.', Boolean(sessionBallot(storyId)));
    } catch (_) {

      window.dabTrack?.('rating_submit_failed',{item:storyId,edition:briefDate,result:'unconfirmed'});finish(story, rating, selection(rating) + '\n' + pendingMessage, Boolean(sessionBallot(storyId)));
    }
  };

  groups.forEach(story => {
    const storyId = story.dataset.feedbackStoryId;
    const briefDate = story.dataset.feedbackBriefDate;
    const prior = storedRating(storyId);
    const queued = read(syncKey(storyId));
    const activeBallot = sessionBallot(storyId);

    if (prior) {
      finish(story, prior, queued
        ? selection(prior) + '\n' + pendingMessage
        : (read(confirmedKey(storyId)) ? '✓ ' : '') + selection(prior) + (read(confirmedKey(storyId)) ? (activeBallot?'\nRecorded. You can change this rating while this page session stays open.':'\nThank you. Your anonymous rating was recorded.') : ''), Boolean(activeBallot));
      if (queued) {let pending;try{pending=JSON.parse(queued);}catch{}synchronize(story, briefDate, storyId, prior, activeBallot || pending);}
    }

    story.addEventListener('click', async event => {
      const button = event.target.closest('[data-feedback-rating]');
      if (!button || button.disabled || story.dataset.feedbackPending === 'true') return;
      const rating = button.dataset.feedbackRating;
      const current = storedRating(storyId);
      const existingBallot = sessionBallot(storyId);
      if (current && !existingBallot) return;
      if (current === rating && read(confirmedKey(storyId))) return;
      const ballot={operationId:existingBallot?.operationId || crypto.randomUUID(),revision:(existingBallot?.revision || 0)+1};
      if(!writeSession(sessionKey(storyId),JSON.stringify(ballot))){story.querySelector('.feedback-status').textContent='This browser could not keep the rating session open. Please refresh and try again.';return;}
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
      await synchronize(story, briefDate, storyId, rating, ballot);
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
