/* Home dashboard, the training hub, tile artwork and app start-up. */
(function () {
  'use strict';

  // ---------- tile artwork: a tilted "object" peeking out of each card ----------

  const PATTERNS = [
    (id) => '<pattern id="' + id + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="var(--art-line)" stroke-width="3"/></pattern>',
    (id) => '<pattern id="' + id + '" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="var(--art-line)"/></pattern>',
    (id) => '<pattern id="' + id + '" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8 Q4 2 8 8 T16 8" fill="none" stroke="var(--art-line)" stroke-width="1.6"/></pattern>',
    (id) => '<pattern id="' + id + '" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="var(--art-line)" stroke-width="1"/></pattern>',
    (id) => '<pattern id="' + id + '" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--art-line)" stroke-width="1.4"/><circle cx="20" cy="20" r="8" fill="none" stroke="var(--art-line)" stroke-width="1.4"/></pattern>',
  ];
  let artSeq = 0;

  GL.art = function (icon, i) {
    const id = 'ap' + artSeq++;
    const rot = [-9, 7, -5, 11, -12, 6][i % 6];
    return '<div class="tile-art" style="--rot:' + rot + 'deg" aria-hidden="true"><svg viewBox="0 0 120 120">' +
      '<defs>' + PATTERNS[i % PATTERNS.length](id) + '</defs>' +
      '<rect width="120" height="120" rx="18" fill="var(--art-a)"/><rect width="120" height="120" rx="18" fill="url(#' + id + ')"/>' +
      '<rect x="1" y="1" width="118" height="118" rx="17" fill="none" stroke="var(--art-line)" stroke-width="2"/>' +
      '<g transform="translate(34 30) scale(2.2)" fill="none" stroke="var(--art-ink)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + GL.icon(icon).replace(/<svg[^>]*>|<\/svg>/g, '') + '</g>' +
      '</svg></div>';
  };

  function tile(m, i, extra) {
    const score = GL.moduleScore(m.id);
    return '<a class="tile tone-' + (m.tone || 'stone') + '" href="' + m.route + '" style="--i:' + i + '">' +
      '<div class="tile-label">' + m.title + '</div>' +
      '<div class="tile-meta">' + (extra || m.desc) + '</div>' +
      (score !== null ? '<div class="tile-badge">' + score + '</div>' : '') +
      (GL.doneToday(m.id) ? '<div class="tile-done">' + GL.icon('check') + '</div>' : '') +
      GL.art(m.icon, i) +
    '</a>';
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Burning the midnight oil' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  // ---------- home ----------

  GL.route('', (view, parts, scope) => {
    const lvl = GL.level();
    const index = GL.geniusScore();
    const planMods = GL.dailyPlan();
    const recent = [];
    GL.moduleOrder.forEach((id) => GL.history(id).forEach((e) => recent.push([id, e])));
    recent.sort((a, b) => b[1].t - a[1].t);
    const iqDone = GL.history('iq').length > 0;

    const discover = [
      { title: 'Core Training', meta: '7 flagship brain games', href: '#/train#core', icon: 'bolt', tone: 'ash' },
      { title: 'Logic Lab', meta: '10 reasoning drills', href: '#/train#logic', icon: 'brain', tone: 'stone' },
      { title: 'Word Lab', meta: '10 verbal drills', href: '#/train#word', icon: 'book', tone: 'moss' },
      { title: 'Visual Lab', meta: '10 perception drills', href: '#/train#visual', icon: 'eye', tone: 'clay' },
      { title: 'Read & Recall', meta: GL.ARTICLES.length + ' short articles', href: '#/read', icon: 'book', tone: 'olive' },
      { title: 'IQ Test', meta: '30 questions &middot; 25 min', href: '#/iq', icon: 'brain', tone: 'taupe' },
      { title: 'Biometrics', meta: 'Your stats &amp; trends', href: '#/bio', icon: 'pulse', tone: 'slate' },
      { title: 'Ask Quiblee', meta: 'Your AI brain coach', href: '#/coach', icon: 'chat', tone: 'rust' },
    ];

    view.innerHTML =
      '<header class="home-head"><div class="eyebrow">' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>' +
        '<h1 class="display huge">' + greeting() + '</h1></header>' +
      '<label class="search">' + GL.icon('target') + '<input id="search" placeholder="Search ' + GL.moduleOrder.length + ' activities…" autocomplete="off" aria-label="Search activities"></label>' +
      '<div id="search-results"></div>' +
      '<div id="home-main">' +
        '<section class="home-hero">' +
          '<a class="card hero-card tone-ash" href="#/bio">' +
            '<div class="eyebrow">Cognitive Index</div>' +
            '<div class="hero-num">' + index + '<small>/1000</small></div>' +
            '<div class="hero-row"><span class="chip">Lv ' + lvl.index + ' &middot; ' + lvl.name + '</span><span class="chip">' + GL.icon('flame') + GL.streak() + '-day streak</span></div>' +
            '<div class="bar"><div style="width:' + Math.round(lvl.progress * 100) + '%"></div></div>' +
            '<div class="muted small">' + lvl.xp + ' XP' + (lvl.next ? ' &middot; ' + (lvl.next - lvl.xp) + ' XP to ' + lvl.nextName : '') + '</div>' +
            GL.art('pulse', 2) +
          '</a>' +
          '<a class="card coach-card" href="#/coach"><div class="quiblee-avatar big">' + GL.quibleeFace() + '</div><div><div class="eyebrow">Your coach</div><div class="coach-line">' + coachLine(index, planMods) + '</div><span class="link">Chat with Quiblee &rarr;</span></div></a>' +
        '</section>' +
        '<section><div class="sec-head"><h2 class="display">Today\'s plan</h2><span class="muted small">picked for your weakest areas</span></div>' +
          (planMods.length ? '<div class="tiles three">' + planMods.map((m, i) => tile(m, i + 1, GL.DOMAINS.find((d) => d.id === m.domains[0]).name + ' &middot; ' + (GL.history(m.id).length ? m.fmt(GL.history(m.id).slice(-1)[0]) : 'new'))).join('') + '</div>'
            : '<div class="card muted">Every domain trained today. Superb work.</div>') +
          (!iqDone ? '<a class="card banner" href="#/iq">' + GL.icon('brain') + '<div><b>Set your baseline.</b> Take the IQ test to anchor your progress.</div><span class="link">Start &rarr;</span></a>' : '') +
        '</section>' +
        '<section><div class="sec-head"><h2 class="display">Discover</h2></div>' +
          '<div class="tiles discover">' + discover.map((d, i) => '<a class="tile tone-' + d.tone + '" href="' + d.href + '" style="--i:' + i + '"><div class="tile-label">' + d.title + '</div><div class="tile-meta">' + d.meta + '</div>' + GL.art(d.icon, i) + '</a>').join('') + '</div>' +
        '</section>' +
        (recent.length ? '<section><div class="sec-head"><h2 class="display">Recent</h2><a class="link" href="#/bio">All stats &rarr;</a></div><div class="card"><ul class="recent">' +
          recent.slice(0, 6).map(([id, e]) => '<li><a href="' + GL.modules[id].route + '"><span class="mod-dot" style="--c:' + GL.modules[id].color + '">' + GL.icon(GL.modules[id].icon) + '</span><span class="grow"><b>' + GL.modules[id].title + '</b><span class="muted small">' + GL.modules[id].fmt(e) + '</span></span><span class="score-pill">' + e.norm + '</span><span class="muted small">' + GL.ago(e.t) + '</span></a></li>').join('') +
          '</ul></div></section>' : '') +
      '</div>';

    const input = GL.$('#search', view);
    const results = GL.$('#search-results', view);
    const main = GL.$('#home-main', view);
    input.oninput = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; main.hidden = false; return; }
      const hits = GL.moduleOrder.map((id) => GL.modules[id]).filter((m) => (m.title + ' ' + m.desc + ' ' + m.section + ' ' + m.domains.join(' ')).toLowerCase().includes(q));
      main.hidden = true;
      results.innerHTML = hits.length ? '<div class="tiles">' + hits.map((m, i) => tile(m, i)).join('') + '</div>' : '<div class="card muted">No activities match &ldquo;' + GL.esc(q) + '&rdquo;.</div>';
    };
  });

  function coachLine(index, plan) {
    if (!GL.totalSessions()) return 'Welcome! Let\'s find your baseline. Start with a 30-second reaction test.';
    if (plan.length) return 'Your ' + GL.DOMAINS.find((d) => d.id === plan[0].domains[0]).name.toLowerCase() + ' has the most headroom. Try ' + plan[0].title + ' next.';
    return 'Everything trained today. Rest well; sleep is when memories consolidate.';
  }

  // ---------- training hub ----------

  GL.route('train', (view, parts, scope) => {
    if (parts[0] && GL.modules[parts[0]] && GL.modules[parts[0]].render) {
      GL.modules[parts[0]].render(view, scope);
      return;
    }
    const secs = GL.SECTIONS.map((s) => {
      const mods = GL.moduleOrder.map((id) => GL.modules[id]).filter((m) => m.section === s.id && m.render);
      return Object.assign({}, s, { mods });
    });
    view.innerHTML =
      '<header class="page-head"><div class="eyebrow">Training</div><h1 class="display">Train your mind</h1>' +
      '<p class="muted lede">' + secs.reduce((n, s) => n + s.mods.length, 0) + ' activities across four labs. Each one feeds your biometrics.</p></header>' +
      '<nav class="seg sec-tabs">' + secs.map((s) => '<a href="#/train" data-jump="' + s.id + '">' + s.title + '</a>').join('') + '<a href="#/train" data-jump="puzzles">Puzzles</a></nav>' +
      secs.map((s) => {
        const tried = s.mods.filter((m) => GL.history(m.id).length).length;
        return '<section id="sec-' + s.id + '"><div class="sec-head"><h2 class="display">' + s.title + '</h2><span class="muted small">' + tried + '/' + s.mods.length + ' tried</span></div><p class="muted small sec-blurb">' + s.blurb + '</p>' +
          '<div class="tiles">' + s.mods.map((m, i) => tile(m, i)).join('') + '</div></section>';
      }).join('') +
      '<section id="sec-puzzles"><div class="sec-head"><h2 class="display">Classic puzzles</h2></div><p class="muted small sec-blurb">The original Puzzle Library games, for a relaxed break between sessions.</p><div class="tiles">' +
        '<a class="tile tone-slate" href="puzzles/number-puzzle-for-coders/index.html" style="--i:0"><div class="tile-label">Number Puzzle</div><div class="tile-meta">4&times;4 sliding tiles</div>' + GL.art('grid', 0) + '</a>' +
        '<a class="tile tone-olive" href="puzzles/word-puzzle-for-coders/index.html" style="--i:1"><div class="tile-label">Word Puzzle</div><div class="tile-meta">Unscramble coding terms</div>' + GL.art('puzzle', 1) + '</a>' +
      '</div></section>';
    const jump = (id) => { const el = GL.$('#sec-' + id, view); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    GL.$('.sec-tabs', view).onclick = (e) => { const a = e.target.closest('[data-jump]'); if (a) { e.preventDefault(); jump(a.dataset.jump); } };
    const target = location.hash.split('#')[2];
    if (target) scope.timeout(() => jump(target), 60);
  });

  GL.start();
})();
