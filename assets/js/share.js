(() => {
  'use strict';

  const COUNTER_BASE = 'https://api.countapi.xyz';
  const COUNTER_NAMESPACE = 'daily-ai-brief-shares';
  const main = document.querySelector('main.main-content, main#content');
  if (!main) return;

  const state = new Map();

  const slug = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

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
    const datePart = briefDate || 'undated';
    return `${datePart}-${itemId}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  }

  function localCounterKey(key) {
    return `daily-ai-brief-share-count:${key}`;
  }

  function readLocalCount(key) {
    const n = Number(localStorage.getItem(localCounterKey(key)) || 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function writeLocalCount(key, value) {
    try { localStorage.setItem(localCounterKey(key), String(value)); } catch (_) {}
  }

  async function fetchRemoteCount(key) {
    const response = await fetch(`${COUNTER_BASE}/get/${COUNTER_NAMESPACE}/${encodeURIComponent(key)}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response.ok) throw new Error(`Counter read failed: ${response.status}`);
    const data = await response.json();
    const value = Number(data.value ?? data.count ?? data.data ?? 0);
    if (!Number.isFinite(value)) throw new Error('Counter response did not include a number');
    return value;
  }

  async function incrementRemoteCount(key) {
    const response = await fetch(`${COUNTER_BASE}/hit/${COUNTER_NAMESPACE}/${encodeURIComponent(key)}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response.ok) throw new Error(`Counter increment failed: ${response.status}`);
    const data = await response.json();
    const value = Number(data.value ?? data.count ?? data.data ?? 0);
    if (!Number.isFinite(value)) throw new Error('Counter response did not include a number');
    return value;
  }

  function updateCountDisplay(key, value) {
    state.set(key, value);
    document.querySelectorAll(`[data-share-counter-key="${CSS.escape(key)}"] .brief-share-count`).forEach((el) => {
      el.textContent = String(value);
      el.setAttribute('aria-label', `${value} shares`);
    });
  }

  async function loadCount(key) {
    const local = readLocalCount(key);
    updateCountDisplay(key, local);
    try {
      const remote = await fetchRemoteCount(key);
      updateCountDisplay(key, remote);
      writeLocalCount(key, remote);
    } catch (_) {
      // The share feature remains usable if the external counter is temporarily unavailable.
    }
  }

  async function incrementCount(key) {
    const optimistic = Math.max(state.get(key) ?? 0, readLocalCount(key)) + 1;
    updateCountDisplay(key, optimistic);
    writeLocalCount(key, optimistic);
    try {
      const remote = await incrementRemoteCount(key);
      updateCountDisplay(key, remote);
      writeLocalCount(key, remote);
    } catch (_) {
      // Preserve an immediate local count while the global counter service is unavailable.
    }
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
      await incrementCount(item.counterKey);
      toast('Daily Brief story link copied');
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
        await incrementCount(item.counterKey);
        toast('Daily Brief story link copied');
      }
      return ok;
    }
  }

  function socialUrl(kind, item) {
    const u = encodeURIComponent(item.url);
    const t = encodeURIComponent(shareText(item.title));
    const body = encodeURIComponent(`${shareText(item.title)}\n\n${item.url}`);
    const subject = encodeURIComponent(item.title);
    const urls = {
      email: `mailto:?subject=${subject}&body=${body}`,
      whatsapp: `https://wa.me/?text=${body}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`
    };
    return urls[kind];
  }

  function openFallback(item) {
    const dialog = document.createElement('dialog');
    dialog.className = 'brief-share-dialog';

    const panel = document.createElement('div');
    panel.className = 'brief-share-panel';

    const heading = document.createElement('h3');
    heading.textContent = 'Share this Daily Brief story';
    const note = document.createElement('p');
    note.textContent = 'Share the Daily AI Brief link for this item, not just the external source.';

    const options = document.createElement('div');
    options.className = 'brief-share-options';

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'brief-share-copy';
    copy.textContent = 'Copy link';
    copy.addEventListener('click', async () => {
      if (await copyLink(item)) dialog.close();
    });
    options.appendChild(copy);

    [
      ['email', 'Email'],
      ['whatsapp', 'WhatsApp'],
      ['linkedin', 'LinkedIn'],
      ['facebook', 'Facebook'],
      ['x', 'X']
    ].forEach(([kind, label]) => {
      const a = document.createElement('a');
      a.className = 'brief-share-option';
      a.href = socialUrl(kind, item);
      a.target = kind === 'email' ? '_self' : '_blank';
      if (kind !== 'email') a.rel = 'noopener noreferrer';
      a.textContent = label;
      a.addEventListener('click', () => {
        incrementCount(item.counterKey);
        setTimeout(() => dialog.close(), 150);
      });
      options.appendChild(a);
    });

    const closeRow = document.createElement('div');
    closeRow.className = 'brief-share-close-row';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'brief-share-close';
    close.textContent = 'Cancel';
    close.addEventListener('click', () => dialog.close());
    closeRow.appendChild(close);

    panel.append(heading, note, options, closeRow);
    dialog.appendChild(panel);
    dialog.addEventListener('close', () => dialog.remove());
    document.body.appendChild(dialog);

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      // Very old browsers: copy the permanent Daily Brief item link instead.
      copyLink(item);
      dialog.remove();
    }
  }

  async function handleShare(item) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText(item.title),
          url: item.url
        });
        await incrementCount(item.counterKey);
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        // Unsupported payload or platform issue: fall through to the in-page share panel.
      }
    }
    openFallback(item);
  }

  function addStoryButtons() {
    const headings = [...main.querySelectorAll('h2')].filter((h) => /^\s*\d+\./.test(h.textContent || ''));
    headings.forEach((heading) => {
      const m = heading.textContent.match(/^\s*(\d+)\.\s*(.+)$/);
      if (!m) return;
      const number = m[1];
      const title = m[2].trim();
      const id = `story-${number}`;
      heading.id = id;
      heading.classList.add('brief-share-target');
      const key = counterKey(id);
      const item = { id, title, counterKey: key, url: shareUrl(id) };
      heading.insertAdjacentElement('afterend', makeButton(item));
    });
  }

  function addVideoButtons() {
    const worth = [...main.querySelectorAll('h2')].find((h) => /worth watching/i.test(h.textContent || ''));
    if (!worth) return;

    let node = worth.nextElementSibling;
    const seen = new Set();
    let index = 0;

    while (node && node.tagName !== 'H2') {
      const anchors = [...node.querySelectorAll?.('a[href]') || []].filter((a) => /(?:youtube\.com|youtu\.be)/i.test(a.href));
      anchors.forEach((a) => {
        if (seen.has(a.href)) return;
        seen.add(a.href);
        index += 1;
        const id = `video-${index}`;
        const target = a.closest('p, li, blockquote, div') || a;
        if (!target.id) target.id = id;
        target.classList.add('brief-share-target');
        const title = (a.textContent || `Worth Watching video ${index}`).trim();
        const key = counterKey(id);
        const item = { id, title, counterKey: key, url: shareUrl(id) };
        target.insertAdjacentElement('afterend', makeButton(item));
      });
      node = node.nextElementSibling;
    }
  }

  addStoryButtons();
  addVideoButtons();
})();
