/* Genius Lab core: storage, scoring, routing and shared UI helpers. */
(function () {
  'use strict';

  const GL = (window.GL = {});
  const KEY = 'geniuslab.v1';

  // ---------- storage ----------

  function fresh() {
    return { results: {}, xp: 0, days: [] };
  }

  let S;
  try {
    S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {});
  } catch (e) {
    S = fresh();
  }
  GL.data = S;

  GL.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
  };

  GL.reset = function () {
    S.results = {};
    S.xp = 0;
    S.days = [];
    GL.save();
    GL.refreshChrome();
  };

  // ---------- small utils ----------

  GL.clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  GL.avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  GL.$ = (sel, root = document) => root.querySelector(sel);
  GL.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  GL.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  GL.dayKey = function (d = new Date()) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  GL.fmtTime = function (sec) {
    sec = Math.max(0, Math.round(sec));
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  };

  GL.ago = function (t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    const d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  };

  // Deterministic PRNG so IQ items and option orders are identical for everyone.
  GL.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  GL.shuffle = function (arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  GL.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  GL.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Standard normal CDF (Abramowitz-Stegun approximation).
  GL.normCdf = function (z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };

  // ---------- modules, domains & scoring ----------

  // Chart series colours: a categorical palette validated for CVD separation on the dark surface.
  GL.DOMAINS = [
    { id: 'speed', name: 'Speed', color: '#3987e5' },
    { id: 'memory', name: 'Memory', color: '#d95926' },
    { id: 'focus', name: 'Focus', color: '#199e70' },
    { id: 'numeracy', name: 'Numeracy', color: '#c98500' },
    { id: 'verbal', name: 'Verbal', color: '#d55181' },
    { id: 'reasoning', name: 'Reasoning', color: '#008300' },
    { id: 'perception', name: 'Perception', color: '#9085e9' },
  ];

  GL.modules = {};
  GL.moduleOrder = [];
  GL.defineModule = function (m) {
    m.route = m.route || '#/train/' + m.id;
    m.section = m.section || 'core';
    GL.modules[m.id] = m;
    GL.moduleOrder.push(m.id);
  };

  GL.history = (id) => S.results[id] || [];

  // A module's current strength: best normalised score among its last 10 sessions.
  GL.moduleScore = function (id) {
    const h = GL.history(id).slice(-10);
    return h.length ? Math.max(...h.map((e) => e.norm)) : null;
  };

  GL.bestEntry = function (id) {
    const h = GL.history(id);
    return h.length ? h.reduce((b, e) => (e.norm > b.norm ? e : b)) : null;
  };

  GL.domainScores = function () {
    return GL.DOMAINS.map((d) => {
      const mods = GL.moduleOrder.map((id) => GL.modules[id]).filter((m) => m.domains.includes(d.id));
      const scores = mods.map((m) => GL.moduleScore(m.id)).filter((v) => v !== null);
      return Object.assign({}, d, { score: scores.length ? Math.round(GL.avg(scores)) : 0, has: scores.length > 0, mods });
    });
  };

  GL.geniusScore = () => Math.round(GL.avg(GL.domainScores().map((d) => d.score)) * 10);

  GL.LEVELS = [
    [0, 'Novice'], [120, 'Apprentice'], [350, 'Thinker'], [700, 'Scholar'], [1200, 'Strategist'],
    [2000, 'Savant'], [3200, 'Genius'], [5000, 'Polymath'],
  ];

  GL.level = function () {
    let i = 0;
    while (i + 1 < GL.LEVELS.length && S.xp >= GL.LEVELS[i + 1][0]) i++;
    const [from, name] = GL.LEVELS[i];
    const next = GL.LEVELS[i + 1];
    const progress = next ? (S.xp - from) / (next[0] - from) : 1;
    return { index: i + 1, name, xp: S.xp, next: next ? next[0] : null, nextName: next ? next[1] : null, progress };
  };

  GL.streak = function () {
    const set = new Set(S.days);
    const d = new Date();
    if (!set.has(GL.dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(GL.dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  GL.doneToday = (id) => GL.history(id).some((e) => GL.dayKey(new Date(e.t)) === GL.dayKey());

  GL.totalSessions = () => Object.values(S.results).reduce((n, l) => n + l.length, 0);

  GL.record = function (id, data) {
    const m = GL.modules[id];
    const entry = Object.assign({ t: Date.now() }, data);
    entry.norm = Math.round(GL.clamp(m.norm(entry)));
    const list = (S.results[id] = S.results[id] || []);
    const prevBest = list.length ? Math.max(...list.map((e) => e.norm)) : null;
    const before = GL.level().index;
    list.push(entry);
    if (list.length > 300) list.shift();
    const gain = 10 + Math.round(entry.norm / 4);
    S.xp += gain;
    const today = GL.dayKey();
    if (!S.days.includes(today)) S.days.push(today);
    GL.save();
    GL.refreshChrome();
    const lvl = GL.level();
    if (lvl.index > before) GL.toast('Level up! You are now a ' + lvl.name + '.');
    return { entry, gain, first: prevBest === null, isBest: prevBest !== null && entry.norm > prevBest };
  };

  // ---------- scoped timers / listeners (auto-cleaned on navigation) ----------

  GL.scope = function () {
    const timers = new Set();
    const intervals = new Set();
    const frames = new Set();
    const listeners = [];
    let alive = true;
    return {
      get alive() { return alive; },
      timeout(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms);
        timers.add(id);
        return id;
      },
      clearTimeout(id) { clearTimeout(id); timers.delete(id); },
      interval(fn, ms) {
        const id = setInterval(() => { if (alive) fn(); }, ms);
        intervals.add(id);
        return id;
      },
      clearInterval(id) { clearInterval(id); intervals.delete(id); },
      frame(fn) {
        const id = requestAnimationFrame((t) => { frames.delete(id); if (alive) fn(t); });
        frames.add(id);
        return id;
      },
      on(el, ev, fn, opts) { el.addEventListener(ev, fn, opts); listeners.push([el, ev, fn, opts]); },
      dispose() {
        alive = false;
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        frames.forEach(cancelAnimationFrame);
        listeners.forEach(([el, ev, fn, o]) => el.removeEventListener(ev, fn, o));
      },
    };
  };

  // ---------- icons ----------

  const ICONS = {
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h4v-5h4v5h4V9.5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-2 2-2 4-3 5-1-2-1-3-3-5-1 3-4 5-4 9a7 7 0 0 0 7 7z"/>',
    puzzle: '<path d="M10 3h4v2a2 2 0 1 0 4 0V3h3v7h-2a2 2 0 1 0 0 4h2v7h-7v-2a2 2 0 1 0-4 0v2H3v-7h2a2 2 0 1 0 0-4H3V3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    pulse: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  };

  GL.icon = function (name, cls = '') {
    return '<svg class="ic ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  // ---------- charts ----------

  GL.sparkline = function (values, opts = {}) {
    const w = opts.w || 140;
    const h = opts.h || 40;
    const color = opts.color || 'var(--accent)';
    if (values.length < 2) {
      return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><line x1="0" y1="' + (h - 2) + '" x2="' + w + '" y2="' + (h - 2) + '" stroke="var(--line-strong)" stroke-dasharray="3 4"/></svg>';
    }
    const lo = opts.min !== undefined ? opts.min : Math.min(...values);
    const hi = opts.max !== undefined ? opts.max : Math.max(...values);
    const span = hi - lo || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - lo) / span) * (h - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      '<path d="' + d + ' L' + last[0].toFixed(1) + ' ' + h + ' L3 ' + h + ' Z" fill="' + color + '" opacity="0.12"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="' + color + '"/></svg>';
  };

  GL.radar = function (domains, size = 260) {
    const c = size / 2;
    const R = c - 58;
    const n = domains.length;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, r) => [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r];
    let s = '<svg class="radar" viewBox="-44 0 ' + (size + 88) + ' ' + size + '" role="img" aria-label="Skill profile">';
    [0.25, 0.5, 0.75, 1].forEach((k) => {
      s += '<polygon points="' + domains.map((_, i) => pt(i, R * k).join(',')).join(' ') + '" fill="none" stroke="var(--line-strong)" stroke-width="1"/>';
    });
    domains.forEach((d, i) => {
      const [x, y] = pt(i, R);
      s += '<line x1="' + c + '" y1="' + c + '" x2="' + x + '" y2="' + y + '" stroke="var(--line-strong)"/>';
      const [lx, ly] = pt(i, R + 16);
      const anchor = Math.abs(lx - c) < 8 ? 'middle' : lx > c ? 'start' : 'end';
      s += '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" dominant-baseline="middle" class="radar-label">' + d.name + '</text>';
    });
    const poly = domains.map((d, i) => pt(i, R * Math.max(0.04, d.score / 100)).join(',')).join(' ');
    s += '<polygon points="' + poly + '" fill="var(--accent)" fill-opacity="0.22" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>';
    domains.forEach((d, i) => {
      const [x, y] = pt(i, R * Math.max(0.04, d.score / 100));
      s += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + d.color + '" stroke="var(--surface)" stroke-width="2"/>';
    });
    return s + '</svg>';
  };

  // ---------- chrome (nav, level, theme, toast) ----------

  GL.NAV = [
    { key: '', label: 'Home', icon: 'home', href: '#/' },
    { key: 'train', label: 'Train', icon: 'bolt', href: '#/train' },
    { key: 'read', label: 'Read', icon: 'book', href: '#/read' },
    { key: 'iq', label: 'IQ Test', icon: 'brain', href: '#/iq' },
    { key: 'bio', label: 'Biometrics', icon: 'pulse', href: '#/bio' },
    { key: 'coach', label: 'Quiblee', icon: 'chat', href: '#/coach' },
  ];

  function buildNav() {
    const links = GL.NAV.map((n) => '<a href="' + n.href + '" data-nav="' + n.key + '">' + GL.icon(n.icon) + '<span>' + n.label + '</span></a>').join('');
    GL.$('#side-nav').innerHTML = links;
    GL.$('#tabbar').innerHTML = links;
  }

  GL.refreshChrome = function () {
    const box = GL.$('#side-level');
    if (!box) return;
    const lvl = GL.level();
    box.innerHTML =
      '<div class="lvl-top"><span class="lvl-name">Lv ' + lvl.index + ' &middot; ' + lvl.name + '</span><span class="lvl-streak">' + GL.icon('flame') + GL.streak() + '</span></div>' +
      '<div class="bar"><div style="width:' + Math.round(lvl.progress * 100) + '%"></div></div>' +
      '<div class="lvl-foot">' + lvl.xp + ' XP' + (lvl.next ? ' &middot; ' + (lvl.next - lvl.xp) + ' to ' + lvl.nextName : ' &middot; max level') + '</div>';
  };

  let toastTimer = null;
  GL.toast = function (msg) {
    const t = GL.$('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  };

  // ---------- router ----------

  const routes = {};
  GL.route = (key, handler) => { routes[key] = handler; };

  let current = null;
  function go() {
    if (current) current.dispose();
    const parts = location.hash.replace(/^#\/?/, '').split('#')[0].split('/').filter(Boolean);
    const key = routes[parts[0]] ? parts[0] : '';
    const view = GL.$('#view');
    const scope = GL.scope();
    current = scope;
    view.innerHTML = '';
    view.classList.remove('enter');
    void view.offsetWidth;
    view.classList.add('enter');
    routes[key](view, parts.slice(1), scope);
    GL.$$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === key));
    window.scrollTo(0, 0);
  }

  GL.start = function () {
    buildNav();
    GL.refreshChrome();
    window.addEventListener('hashchange', go);
    go();
  };

  // ---------- shared page pieces ----------

  GL.historyCard = function (id) {
    const m = GL.modules[id];
    const h = GL.history(id);
    const best = GL.bestEntry(id);
    let s = '<h3>Your progress</h3>';
    if (!h.length) return s + '<p class="muted small">No sessions yet. Your scores and trend will appear here.</p>';
    s += '<div class="hist-top"><div><div class="hist-label">Personal best</div><div class="hist-best">' + m.fmt(best) + '</div></div>' +
      '<div class="hist-score"><b>' + GL.moduleScore(id) + '</b><span>/100</span></div></div>';
    s += '<div class="hist-spark">' + GL.sparkline(h.slice(-20).map((e) => e.norm), { w: 260, h: 54, min: 0, max: 100, color: m.color }) + '</div>';
    s += '<ul class="hist-list">' + h.slice(-5).reverse().map((e) => '<li><span>' + m.fmt(e) + '</span><span class="muted">' + GL.ago(e.t) + '</span></li>').join('') + '</ul>';
    s += '<div class="muted small">' + h.length + ' session' + (h.length === 1 ? '' : 's') + ' total</div>';
    return s;
  };

  // Standard page layout for a training game: header, stage, side panel.
  GL.shell = function (view, id, backHref = '#/train', backLabel = 'Training') {
    const m = GL.modules[id];
    view.innerHTML =
      '<header class="page-head">' +
        '<a class="back" href="' + backHref + '">' + GL.icon('back') + backLabel + '</a>' +
        '<div class="title-row"><div class="mod-icon" style="--c:' + m.color + '">' + GL.icon(m.icon) + '</div>' +
        '<div><h1>' + m.title + '</h1><p class="muted">' + m.desc + '</p></div></div>' +
      '</header>' +
      '<div class="game-layout">' +
        '<section class="card stage-card"><div class="stage" id="stage"></div></section>' +
        '<aside class="side">' +
          '<div class="card howto"><h3>How it works</h3>' + m.howto + '</div>' +
          '<div class="card" id="hist"></div>' +
        '</aside>' +
      '</div>';
    const hist = GL.$('#hist', view);
    const refresh = () => { hist.innerHTML = GL.historyCard(id); };
    refresh();
    return { stage: GL.$('#stage', view), refresh };
  };

  GL.resultHtml = function (o) {
    const badge = o.rec.isBest ? 'New personal best!' : o.rec.first ? 'First score recorded' : 'Session complete';
    return '<div class="result">' +
      '<div class="result-badge' + (o.rec.isBest ? ' best' : '') + '">' + GL.icon(o.rec.isBest ? 'trophy' : 'check') + badge + '</div>' +
      '<div class="result-big">' + o.big + '<span>' + (o.unit || '') + '</span></div>' +
      (o.sub ? '<div class="result-sub">' + o.sub + '</div>' : '') +
      (o.extra || '') +
      '<div class="result-rows">' + (o.rows || []).map((r) => '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div>' +
      '<div class="result-xp"><span>+' + o.rec.gain + ' XP</span><span>Skill score ' + o.rec.entry.norm + '/100</span></div>' +
      '<div class="btn-row"><button class="btn primary" data-act="again">' + GL.icon('play') + (o.againLabel || 'Play again') + '</button>' +
      '<a class="btn ghost" href="' + (o.backHref || '#/train') + '">' + (o.backLabel || 'All training') + '</a></div>' +
    '</div>';
  };

  GL.intro = function (o) {
    return '<div class="intro">' +
      '<div class="intro-icon" style="--c:' + o.color + '">' + GL.icon(o.icon) + '</div>' +
      '<h2>' + o.title + '</h2>' +
      '<p class="muted">' + o.text + '</p>' +
      (o.controls || '') +
      '<button class="btn primary big" data-act="start">' + GL.icon('play') + (o.button || 'Start') + '</button>' +
      (o.foot ? '<div class="muted small">' + o.foot + '</div>' : '') +
    '</div>';
  };

  GL.segmented = function (name, options, value) {
    return '<div class="seg" data-seg="' + name + '">' + options.map((o) =>
      '<button type="button" data-val="' + o[0] + '" class="' + (String(o[0]) === String(value) ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  };

  GL.bindSegmented = function (root, name, onChange) {
    const seg = GL.$('[data-seg="' + name + '"]', root);
    if (!seg) return;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      GL.$$('button', seg).forEach((x) => x.classList.toggle('on', x === b));
      onChange(b.dataset.val);
    });
  };
})();
