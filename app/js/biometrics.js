/* Cognitive Biometrics: a statistics dashboard for your improvement. */
(function () {
  'use strict';

  // ---------- statistics ----------

  const S = {
    mean: (a) => GL.avg(a),
    sd(a) {
      if (a.length < 2) return 0;
      const m = GL.avg(a);
      return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
    },
    slope(a) {
      const n = a.length;
      if (n < 2) return 0;
      const mx = (n - 1) / 2;
      const my = GL.avg(a);
      let num = 0, den = 0;
      a.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2; });
      return num / den;
    },
    gain(a) {
      if (a.length < 2) return 0;
      const k = Math.min(3, Math.floor(a.length / 2));
      return GL.avg(a.slice(-k)) - GL.avg(a.slice(0, k));
    },
  };
  GL.stats = S;

  // Cognitive Index (0-1000) as it stood at time t.
  function indexAt(t) {
    const domainScores = GL.DOMAINS.map((d) => {
      const scores = GL.moduleOrder.map((id) => GL.modules[id]).filter((m) => m.domains.includes(d.id)).map((m) => {
        const h = GL.history(m.id).filter((e) => e.t <= t).slice(-10);
        return h.length ? Math.max(...h.map((e) => e.norm)) : null;
      }).filter((v) => v !== null);
      return scores.length ? GL.avg(scores) : 0;
    });
    return Math.round(GL.avg(domainScores) * 10);
  }
  GL.indexAt = indexAt;

  GL.percentile = (index) => GL.normCdf((index / 10 - 50) / 20) * 100;

  function allEntries() {
    const out = [];
    GL.moduleOrder.forEach((id) => GL.history(id).forEach((e) => out.push(Object.assign({ mod: id }, e))));
    return out.sort((a, b) => a.t - b.t);
  }

  // ---------- charts ----------

  function lineChart(points) {
    const W = 640, H = 220, L = 40, Rr = 14, T = 16, B = 30;
    if (points.length < 2) return '<div class="empty-chart">Train on at least two different days to see your trend line.</div>';
    const vals = points.map((p) => p.v);
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 40) / 100) * 100);
    const hi = Math.min(1000, Math.ceil((Math.max(...vals) + 40) / 100) * 100);
    const x = (i) => L + (i / (points.length - 1)) * (W - L - Rr);
    const y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
    let s = '<svg class="line-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cognitive Index over time">';
    for (let g = lo; g <= hi; g += (hi - lo) / 4) {
      s += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="grid"/><text x="' + (L - 8) + '" y="' + y(g) + '" class="axis-label" text-anchor="end" dominant-baseline="middle">' + Math.round(g) + '</text>';
    }
    const step = Math.max(1, Math.ceil(points.length / 6));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" class="axis-label" text-anchor="middle">' + p.label + '</text>';
    });
    const d = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
    s += '<path d="' + d + ' L' + x(points.length - 1) + ' ' + (H - B) + ' L' + L + ' ' + (H - B) + ' Z" fill="var(--sand)" opacity="0.1"/>';
    s += '<path d="' + d + '" fill="none" stroke="var(--sand)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    const last = points[points.length - 1];
    s += '<circle cx="' + x(points.length - 1) + '" cy="' + y(last.v) + '" r="4.5" fill="var(--sand)" stroke="var(--surface)" stroke-width="2"/>';
    s += '<line class="xhair" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" visibility="hidden"/><circle class="xdot" r="5" cx="0" cy="0" visibility="hidden" fill="var(--sand)" stroke="var(--surface)" stroke-width="2"/>';
    const colW = (W - L - Rr) / (points.length - 1);
    points.forEach((p, i) => {
      s += '<rect class="hit" x="' + (x(i) - colW / 2) + '" y="' + T + '" width="' + colW + '" height="' + (H - T - B) + '" data-cx="' + x(i) + '" data-cy="' + y(p.v) + '" data-tip="<b>' + p.label + '</b><br>Index ' + p.v + (p.sessions ? '<br>' + p.sessions + ' session' + (p.sessions > 1 ? 's' : '') : '') + '"/>';
    });
    return s + '</svg>';
  }

  function heatmap(entries) {
    const weeks = 16;
    const counts = {};
    entries.forEach((e) => { const k = GL.dayKey(new Date(e.t)); counts[k] = (counts[k] || 0) + 1; });
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - ((weeks - 1) * 7 + end.getDay()));
    const cell = 13, gap = 3;
    let s = '<svg class="heat" viewBox="0 0 ' + (weeks * (cell + gap) + 28) + ' ' + (7 * (cell + gap) + 4) + '" role="img" aria-label="Training activity, last 16 weeks">';
    ['Mon', 'Wed', 'Fri'].forEach((l, i) => { s += '<text x="0" y="' + ((i * 2 + 1) * (cell + gap) + cell - 2) + '" class="axis-label">' + l + '</text>'; });
    const d = new Date(start);
    for (let w = 0; w < weeks; w++) {
      for (let day = 0; day < 7; day++) {
        if (d <= end) {
          const k = GL.dayKey(d);
          const c = counts[k] || 0;
          const lvl = c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 7 ? 3 : 4;
          s += '<rect x="' + (28 + w * (cell + gap)) + '" y="' + (day * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="3" class="h' + lvl + '" data-tip="<b>' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</b><br>' + c + ' session' + (c === 1 ? '' : 's') + '"/>';
        }
        d.setDate(d.getDate() + 1);
      }
    }
    return s + '</svg><div class="heat-legend"><span>Less</span><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><span>More</span></div>';
  }

  function hbars(rows, max, unit) {
    return '<div class="hbars">' + rows.map((r) =>
      '<div class="hbar" data-tip="<b>' + r.label + '</b><br>' + r.tip + '"><span class="hbar-label">' + r.label + '</span><div class="hbar-track"><div class="hbar-fill" style="width:' + (max ? (r.v / max) * 100 : 0) + '%;background:' + (r.color || 'var(--sand)') + '"></div></div><b>' + r.show + (unit || '') + '</b></div>').join('') + '</div>';
  }

  function bindTips(root, scope) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    root.appendChild(tip);
    scope.on(root, 'pointermove', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t) { tip.classList.remove('show'); hideX(); return; }
      tip.innerHTML = t.dataset.tip;
      tip.classList.add('show');
      const rb = root.getBoundingClientRect();
      let left = e.clientX - rb.left + 14;
      if (left + 180 > rb.width) left = e.clientX - rb.left - 180;
      tip.style.left = left + 'px';
      tip.style.top = e.clientY - rb.top + 14 + 'px';
      if (t.classList.contains('hit')) {
        const svg = t.ownerSVGElement;
        const xh = svg.querySelector('.xhair'), xd = svg.querySelector('.xdot');
        xh.setAttribute('x1', t.dataset.cx); xh.setAttribute('x2', t.dataset.cx); xh.setAttribute('visibility', 'visible');
        xd.setAttribute('cx', t.dataset.cx); xd.setAttribute('cy', t.dataset.cy); xd.setAttribute('visibility', 'visible');
      } else hideX();
    });
    scope.on(root, 'pointerleave', () => { tip.classList.remove('show'); hideX(); });
    function hideX() { GL.$$('.xhair,.xdot', root).forEach((el) => el.setAttribute('visibility', 'hidden')); }
  }

  const fmtSigned = (v, d) => (v > 0 ? '+' : v < 0 ? '&minus;' : '&plusmn;') + Math.abs(v).toFixed(d || 0);

  // ---------- page ----------

  GL.route('bio', (view, parts, scope) => {
    const entries = allEntries();
    const now = Date.now();
    const index = GL.geniusScore();
    const weekAgo = indexAt(now - 7 * 86400000);
    const delta = index - weekAgo;
    const pct = GL.percentile(index);
    const domains = GL.domainScores();
    const last7 = entries.filter((e) => e.t > now - 7 * 86400000).length;

    // daily index series
    const days = [];
    entries.forEach((e) => {
      const k = GL.dayKey(new Date(e.t));
      const last = days[days.length - 1];
      if (last && last.k === k) { last.t = e.t; last.sessions++; } else days.push({ k, t: e.t, sessions: 1 });
    });
    const series = days.slice(-30).map((d) => ({ label: new Date(d.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), v: indexAt(d.t), sessions: d.sessions }));

    // vital signs
    const rt = GL.history('reaction');
    const rtAll = rt.flatMap((e) => e.times || [e.avg]);
    const rtCv = rtAll.length > 2 ? (S.sd(rtAll) / S.mean(rtAll)) * 100 : null;
    const digits = GL.history('digits').filter((e) => e.mode !== 'backward');
    const readH = GL.history('reading');
    const iqH = GL.history('iq');
    const nb = GL.history('nback');
    const stroop = GL.history('stroop');
    const vital = (label, value, unit, sub, dom) => '<div class="vital"><div class="vital-top"><span>' + label + '</span>' + (dom ? '<i style="background:' + GL.DOMAINS.find((d) => d.id === dom).color + '"></i>' : '') + '</div><b>' + (value === null || value === undefined ? '&mdash;' : value) + '<small>' + (value === null || value === undefined ? '' : unit) + '</small></b><em>' + sub + '</em></div>';

    // per-module stats
    const rows = GL.moduleOrder.map((id) => {
      const m = GL.modules[id];
      const h = GL.history(id).map((e) => e.norm);
      return { m, n: h.length, mean: S.mean(h), sd: S.sd(h), best: h.length ? Math.max(...h) : 0, last: h[h.length - 1], gain: S.gain(h), slope: S.slope(h.slice(-10)), h };
    }).filter((r) => r.n);

    // time-of-day
    const buckets = [['Morning', 5, 12], ['Afternoon', 12, 17], ['Evening', 17, 22], ['Night', 22, 29]].map(([label, a, b]) => {
      const es = entries.filter((e) => { let hr = new Date(e.t).getHours(); if (hr < 5) hr += 24; return hr >= a && hr < b; });
      return { label, v: es.length ? S.mean(es.map((e) => e.norm)) : 0, n: es.length };
    });
    const bestTime = buckets.filter((b) => b.n >= 2).sort((a, b) => b.v - a.v)[0];

    // insights
    const insights = [];
    const improving = rows.filter((r) => r.n >= 3).sort((a, b) => b.gain - a.gain);
    if (improving[0] && improving[0].gain > 0) insights.push(['spark', 'Most improved: <b>' + improving[0].m.title + '</b>, up ' + Math.round(improving[0].gain) + ' points from your first sessions.']);
    const weakest = domains.slice().sort((a, b) => a.score - b.score)[0];
    insights.push(['target', 'Biggest opportunity: <b>' + weakest.name + '</b> (' + weakest.score + '/100). Raising it lifts your index fastest.']);
    if (bestTime) insights.push(['clock', 'You perform best in the <b>' + bestTime.label.toLowerCase() + '</b> (avg ' + Math.round(bestTime.v) + '/100). Schedule hard sessions then.']);
    if (rtCv !== null) insights.push(['bolt', 'Reaction consistency: coefficient of variation <b>' + rtCv.toFixed(1) + '%</b>. ' + (rtCv < 12 ? 'Very steady.' : 'Lower is steadier; sleep and focus help.')]);
    const plateau = rows.find((r) => r.n >= 6 && Math.abs(r.slope) < 0.3);
    if (plateau) insights.push(['layers', '<b>' + plateau.m.title + '</b> has plateaued. Push difficulty or switch focus for a while.']);
    if (!entries.length) insights.length = 0;

    view.innerHTML =
      '<header class="page-head"><div class="eyebrow">Biometrics</div><h1 class="display">Your cognitive vitals</h1>' +
      '<p class="muted lede">Every session feeds a live statistical model of your mind: speed, memory, focus, numeracy, verbal, reasoning and perception.</p></header>' +
      (entries.length ? '' : '<div class="card empty-state">' + GL.icon('pulse') + '<div><b>No data yet.</b> Complete any activity and your biometrics will come alive.</div><a class="btn primary" href="#/train">Start training</a></div>') +
      '<section class="bio-hero card tone-ash">' +
        '<div class="bio-index"><div class="eyebrow">Cognitive Index</div><div class="bio-num">' + index + '<small>/1000</small></div>' +
          '<div class="bio-delta ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') + '">' + fmtSigned(delta) + ' <span>vs 7 days ago</span></div>' +
          '<div class="bio-meta"><span>Est. percentile <b>' + (entries.length ? Math.round(pct) + 'th' : '&mdash;') + '</b></span><span>Sessions (7d) <b>' + last7 + '</b></span><span>Streak <b>' + GL.streak() + 'd</b></span><span>Total <b>' + entries.length + '</b></span></div>' +
        '</div>' +
        '<div class="bio-radar">' + GL.radar(domains, 280) + '</div>' +
      '</section>' +
      '<section class="vitals">' +
        vital('Reaction time', rt.length ? Math.min(...rt.map((e) => e.avg)) : null, 'ms', rt.length ? 'best avg &middot; last ' + rt[rt.length - 1].avg + ' ms' : 'take the reaction test', 'speed') +
        vital('Consistency', rtCv !== null ? rtCv.toFixed(1) : null, '% CV', 'reaction time variability', 'speed') +
        vital('Working memory', digits.length ? Math.max(...digits.map((e) => e.span)) : null, 'digits', 'forward digit span &middot; avg 7', 'memory') +
        vital('N-back level', nb.length ? Math.max(...nb.filter((e) => e.sens >= 0.6).map((e) => e.n).concat([0])) || 1 : null, '-back', 'highest level at 60%+', 'memory') +
        vital('Inhibition', stroop.length ? Math.max(...stroop.map((e) => e.score)) : null, 'pts', 'best Stroop score', 'focus') +
        vital('Reading speed', readH.length ? Math.round(S.mean(readH.slice(-5).map((e) => e.wpm))) : null, 'wpm', readH.length ? Math.round(S.mean(readH.slice(-5).map((e) => e.acc)) * 100) + '% comprehension' : 'read an article', 'verbal') +
        vital('IQ estimate', iqH.length ? iqH[iqH.length - 1].iq : null, '', iqH.length ? GL.iqClass(iqH[iqH.length - 1].iq) : 'take the IQ test', 'reasoning') +
        vital('Training load', last7, 'sessions', 'in the last 7 days', null) +
      '</section>' +
      '<div class="bio-grid">' +
        '<section class="card chart-card" id="trend"><div class="card-head"><h3>Cognitive Index trend</h3><span class="muted small">daily, last 30 active days</span></div>' + lineChart(series) + '</section>' +
        '<section class="card chart-card" id="heat"><div class="card-head"><h3>Training activity</h3><span class="muted small">last 16 weeks</span></div>' + heatmap(entries) + '</section>' +
      '</div>' +
      '<div class="bio-grid">' +
        '<section class="card chart-card" id="doms"><div class="card-head"><h3>Domain scores</h3><span class="muted small">0&ndash;100 &middot; best of last 10 per activity</span></div>' +
          hbars(domains.map((d) => ({ label: d.name, v: d.score, show: d.score, color: d.color, tip: d.score + '/100 &middot; ' + d.mods.filter((m) => GL.history(m.id).length).length + ' of ' + d.mods.length + ' activities tried' })), 100) + '</section>' +
        '<section class="card chart-card" id="tod"><div class="card-head"><h3>Performance by time of day</h3><span class="muted small">average skill score</span></div>' +
          hbars(buckets.map((b) => ({ label: b.label, v: b.v, show: b.n ? Math.round(b.v) : '&ndash;', tip: b.n + ' sessions &middot; avg ' + Math.round(b.v) })), 100) +
          '<h3 class="mt">Insights</h3><ul class="insights">' + (insights.length ? insights.map(([ic, t]) => '<li>' + GL.icon(ic) + '<span>' + t + '</span></li>').join('') : '<li class="muted">Insights appear after a few sessions.</li>') + '</ul></section>' +
      '</div>' +
      '<section class="card"><div class="card-head"><h3>Activity statistics</h3><span class="muted small">skill scores 0&ndash;100 &middot; trend = slope over last 10</span></div>' +
        (rows.length ? '<div class="table-wrap"><table class="stats-table"><thead><tr><th>Activity</th><th>n</th><th>Mean</th><th>SD</th><th>Best</th><th>Last</th><th>Gain</th><th>Trend</th><th></th></tr></thead><tbody>' +
          rows.map((r) => '<tr><td><a href="' + r.m.route + '">' + r.m.title + '</a></td><td>' + r.n + '</td><td>' + r.mean.toFixed(1) + '</td><td>' + r.sd.toFixed(1) + '</td><td>' + r.best + '</td><td>' + r.last + '</td>' +
            '<td class="' + (r.gain > 0 ? 'up' : r.gain < 0 ? 'down' : '') + '">' + fmtSigned(r.gain) + '</td><td class="' + (r.slope > 0 ? 'up' : r.slope < 0 ? 'down' : '') + '">' + fmtSigned(r.slope, 1) + '/s</td><td>' + GL.sparkline(r.h.slice(-15), { w: 90, h: 26, min: 0, max: 100, color: 'var(--sand)' }) + '</td></tr>').join('') +
          '</tbody></table></div>' : '<p class="muted small">Your per-activity statistics will appear here.</p>') +
      '</section>' +
      '<section class="card method"><h3>How the numbers work</h3><p class="small muted">Every session is normalised to a 0&ndash;100 skill score using benchmarks for that activity. An activity\'s score is your best of its last ten sessions; a domain is the average of its activities; the Cognitive Index is the average of all seven domains &times; 10. The percentile is an estimate assuming a typical adult scores 50 &plusmn; 20 per domain. Gain compares your first and latest three sessions; trend is the least-squares slope in points per session.</p>' +
        '<div class="btn-row"><button class="btn ghost" id="bio-export">Export data (JSON)</button><button class="btn ghost danger" id="bio-reset">Reset all data</button></div></section>';

    GL.$$('.chart-card', view).forEach((c) => bindTips(c, scope));
    GL.$('#bio-reset', view).onclick = () => {
      if (window.confirm('Delete all training history, XP and scores? This cannot be undone.')) { GL.reset(); location.hash = '#/bio/'; }
    };
    GL.$('#bio-export', view).onclick = () => {
      const blob = new Blob([JSON.stringify(GL.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'genius-lab-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
  });
})();
