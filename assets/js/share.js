(() => {
  'use strict';

  const EVENTS_ENDPOINT = 'https://daily-ai-brief-ratings.gtome.chatgpt.site/api/events';
  const main = document.querySelector('main.main-content, main#content');
  if (!main) return;

  const state = new Map();
  const flushes = new Map();

  function siteBasePath() {
    const p = window.location.pathname;
    const briefIndex = p.indexOf('/briefs/');
    if (briefIndex >= 0) return p.slice(0, briefIndex + 1);
    if (p.endsWith('/')) return p;
    return p.slice(0, p.lastIndexOf('/') + 1);
  }

  function monthNumber(name) {
    return {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    }[String(name).toLowerCase()];
  }

  function deriveBriefDate() {
    const fromLayout = document.body.dataset.briefDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromLayout || '')) return fromLayout;

    const m = window.location.pathname.match(/\/briefs\/(\d{4}-\d{2}-\d{2})\/?/);
    if (m) return m[1];

    const heading = main.querySelector('h1');
    const text = heading ? heading.textContent : '';
    const d = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i);
    if (!d) return '';
    return `${d[3]}-${monthNumber(d[1])}-${String(d[2]).padStart(2, '0')}`;
  }

  const briefDate = deriveBriefDate();

  function canonicalBaseUrl() {
    const prefix = siteBasePath();
    if (briefDate) return `${window.location.origin}${prefix}briefs/${briefDate}/`;
    return `${window.location.origin}${window.location.pathname}`;
  }

  function counterKey(itemId) {
    if (/^dab-(?:story|video)-/.test(itemId)) return itemId;
    const kind = String(itemId).startsWith('video-') ? 'video' : 'story';
    return `dab-${kind}-${briefDate || 'undated'}-${itemId}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 140);
  }

  function localCounterKey(key) {
    return `daily-ai-brief-share-count:${key}`;
  }

  function pendingCounterKey(key) {
    return `daily-ai-brief-share-pending:${key}`;
  }

  function readLocalCount(key) {
    try {
      const n = Number(localStorage.getItem(localCounterKey(key)) || 0);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (_) {
      return 0;
    }
  }

  function writeLocalCount(key, value) {
    try { localStorage.setItem(localCounterKey(key), String(value)); } catch (_) {}
  }

  function readPendingCount(key) {
    try {
      const n = Number(localStorage.getItem(pendingCounterKey(key)) || 0);
      return Number.isInteger(n) && n >= 0 ? n : 0;
    } catch (_) {
      return 0;
    }
  }

  function writePendingCount(key, value) {
    try {
      if (value > 0) localStorage.setItem(pendingCounterKey(key), String(value));
      else localStorage.removeItem(pendingCounterKey(key));
    } catch (_) {}
  }

  async function fetchRemoteCount(key) {
    const query = new URLSearchParams({brief_date: briefDate, item_id: key});
    const response = await fetch(`${EVENTS_ENDPOINT}?${query}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response.ok) {
      throw new Error(`Counter read failed: ${response.status}`);
    }
    const data = await response.json();
    const value = Number(data.totals?.share_initiations ?? 0);
    if (!Number.isFinite(value)) throw new Error('Counter response did not include a number');
    return value;
  }

  async function incrementRemoteCount(key) {
    const response = await fetch(EVENTS_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({brief_date: briefDate, item_id: key, metric: 'share_initiations'})
    });
    if (!response.ok) throw new Error(`Counter increment failed: ${response.status}`);
    const data = await response.json();
    if (data.recorded !== true) throw new Error('Share persistence was not confirmed');
    const value = Number(data.count ?? 0);
    if (!Number.isFinite(value)) throw new Error('Counter response did not include a number');
    return value;
  }

  function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function updateCountDisplay(key, value) {
    state.set(key, value);
    const safeKey = escapeSelectorValue(key);
    document.querySelectorAll(`[data-share-counter-key="${safeKey}"] .brief-share-count`).forEach((el) => {
      el.textContent = String(value);
      el.setAttribute('aria-label', `${value} shares`);
    });
  }

  async function loadCount(key) {
    const local = readLocalCount(key);
    updateCountDisplay(key, local);
    try {
      const remote = await fetchRemoteCount(key);
      let pending = readPendingCount(key);
      // Recover counts created by the earlier optimistic-only implementation.
      if (pending === 0 && local > remote) {
        pending = local - remote;
        writePendingCount(key, pending);
      }
      updateCountDisplay(key, remote + pending);
      writeLocalCount(key, remote + pending);
      flushPending(key);
    } catch (_) {
      flushPending(key);
    }
  }

  function flushPending(key) {
    if (flushes.has(key)) return flushes.get(key);
    const task = (async () => {
      let pending = readPendingCount(key);
      while (pending > 0) {
        try {
          const remote = await incrementRemoteCount(key);
          pending -= 1;
          writePendingCount(key, pending);
          updateCountDisplay(key, remote + pending);
          writeLocalCount(key, remote + pending);
        } catch (_) {
          break;
        }
      }
    })().finally(() => flushes.delete(key));
    flushes.set(key, task);
    return task;
  }

  function incrementCount(key) {
    writePendingCount(key, readPendingCount(key) + 1);
    const optimistic = Math.max(state.get(key) ?? 0, readLocalCount(key)) + 1;
    updateCountDisplay(key, optimistic);
    writeLocalCount(key, optimistic);
    return flushPending(key);
  }

  function toast(message) {
    document.querySelector('.brief-share-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'brief-share-toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function shareUrl(itemId) {
    return `${canonicalBaseUrl()}#${itemId}`;
  }

  function shareText(title) {
    return `${title} — Daily Generative AI Brief`;
  }

  function makeButton(item) {
    const wrap = document.createElement('div');
    wrap.className = 'brief-share-wrap';
    wrap.dataset.shareCounterKey = item.counterKey;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'brief-share-button';
    button.setAttribute('aria-label', `Share ${item.title}`);

    const icon = document.createElement('span');
    icon.className = 'brief-share-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '↗';

    const label = document.createElement('span');
    label.textContent = 'Share';

    const count = document.createElement('span');
    count.className = 'brief-share-count';
    count.textContent = '0';
    count.setAttribute('aria-label', '0 shares');

    button.append(icon, label, count);
    button.addEventListener('click', () => handleShare(item));
    wrap.appendChild(button);
    loadCount(item.counterKey);
    return wrap;
  }

  async function copyLink(item) {
    try {
      await navigator.clipboard.writeText(item.url);
      toast('Daily Brief link copied');
      return true;
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = item.url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      input.remove();
      if (ok) {
        toast('Daily Brief link copied');
      }
      return ok;
    }
  }

  function socialUrl(kind, item) {
    const u = encodeURIComponent(item.url);
    const t = encodeURIComponent(shareText(item.title));
    const body = encodeURIComponent(`${shareText(item.title)}\n\n${item.url}`);
    const subject = encodeURIComponent(item.title);
