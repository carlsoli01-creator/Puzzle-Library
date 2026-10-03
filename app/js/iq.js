/* The built-in IQ test: 30 timed items across four sections, with a full report. */
(function () {
  'use strict';

  const LIMIT = 25 * 60;

  GL.defineModule({
    id: 'iq',
    title: 'IQ Test',
    icon: 'brain',
    color: '#c9b99a',
    tone: 'stone',
    domains: ['reasoning'],
    route: '#/iq',
    desc: '30 questions. 25 minutes. Pattern, numeric, verbal and logical reasoning.',
    howto: '',
    norm: (e) => ((e.iq - 70) / 75) * 100,
    fmt: (e) => 'IQ ' + e.iq + ' &middot; ' + e.raw + '/' + e.total,
  });

  let active = null; // survives navigation so a test in progress can be resumed

  function iqFromRaw(raw, total) {
    const z = (raw / total - 0.5) / 0.17;
    return Math.round(GL.clamp(100 + 15 * z, 55, 150));
  }

  GL.iqClass = function (iq) {
    if (iq >= 145) return 'Exceptionally gifted';
    if (iq >= 130) return 'Very superior';
    if (iq >= 120) return 'Superior';
    if (iq >= 110) return 'High average';
    if (iq >= 90) return 'Average';
    if (iq >= 80) return 'Low average';
    return 'Developing';
  };

  function bell(iq) {
    const W = 520, H = 170, lo = 55, hi = 145;
    const x = (v) => ((v - lo) / (hi - lo)) * (W - 20) + 10;
    const y = (v) => H - 28 - Math.exp(-((v - 100) ** 2) / (2 * 15 * 15)) * (H - 50);
    let d = '';
    for (let v = lo; v <= hi; v += 1) d += (v === lo ? 'M' : 'L') + x(v).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
    let fill = '';
    for (let v = lo; v <= Math.min(iq, hi); v += 1) fill += (v === lo ? 'M' : 'L') + x(v).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
    const mx = x(GL.clamp(iq, lo, hi));
    let s = '<svg class="bell" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Your score on the population curve">';
    s += '<path d="' + fill + 'L' + mx + ' ' + (H - 28) + ' L' + x(lo) + ' ' + (H - 28) + ' Z" fill="var(--sand)" opacity="0.18"/>';
    s += '<path d="' + d + '" fill="none" stroke="var(--ink-soft)" stroke-width="1.6"/>';
    [70, 85, 100, 115, 130].forEach((v) => {
      s += '<line x1="' + x(v) + '" x2="' + x(v) + '" y1="' + (H - 28) + '" y2="' + (H - 22) + '" stroke="var(--ink-soft)"/>';
      s += '<text x="' + x(v) + '" y="' + (H - 8) + '" text-anchor="middle" class="axis-label">' + v + '</text>';
    });
    s += '<line x1="' + mx + '" x2="' + mx + '" y1="14" y2="' + (H - 28) + '" stroke="var(--sand)" stroke-width="2.5"/>';
    s += '<circle cx="' + mx + '" cy="' + y(GL.clamp(iq, lo, hi)) + '" r="5" fill="var(--sand)"/>';
    s += '<text x="' + GL.clamp(mx, 30, W - 30) + '" y="10" text-anchor="middle" class="axis-label strong">You &middot; ' + iq + '</text>';
    return s + '</svg>';
  }

  function optionHtml(q, i, cls) {
    if (q.type === 'matrix') return '<button class="mx-opt ' + (cls || '') + '" data-o="' + i + '"><span class="opt-key">' + 'ABCDEF'[i] + '</span>' + GL.mxCell(q.options[i]) + '</button>';
    return '<button class="option ' + (cls || '') + '" data-o="' + i + '"><span class="opt-key">' + 'ABCDEF'[i] + '</span>' + GL.esc(q.options[i]) + '</button>';
  }

  function matrixHtml(q) {
    return '<div class="mx-grid">' + q.cells.map((c, i) => '<div class="mx-cell">' + (i === 8 ? '<span class="mx-q">?</span>' : GL.mxCell(c)) + '</div>').join('') + '</div>';
  }

  // ---------- intro ----------

  function intro(view) {
    const h = GL.history('iq');
    const last = h[h.length - 1];
    const best = GL.bestEntry('iq');
    const counts = GL.IQ_SECTIONS.map((s) => [s, GL.IQ_QUESTIONS.filter((q) => q.section === s).length]);
    view.innerHTML =
      '<header class="page-head"><div class="eyebrow">Assessment</div><h1 class="display">The Genius Lab <em>IQ</em> Test</h1>' +
      '<p class="muted lede">Thirty original questions, from warm-up to fiendish. Work steadily: you can skip and come back to any question before you submit.</p></header>' +
      '<div class="iq-intro">' +
        '<section class="card iq-hero tone-stone">' +
          '<div class="iq-facts">' +
            '<div><b>30</b><span>questions</span></div><div><b>25</b><span>minutes</span></div><div><b>4</b><span>sections</span></div>' +
          '</div>' +
          '<div class="iq-sections">' + counts.map(([s, n]) => '<span class="chip">' + s + ' &middot; ' + n + '</span>').join('') + '</div>' +
          '<ul class="iq-rules"><li>Find a quiet spot. No calculators or searching.</li><li>Use <kbd>A</kbd>&ndash;<kbd>F</kbd> to answer and <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to move.</li><li>Unanswered questions count as wrong.</li></ul>' +
          '<button class="btn primary big" id="iq-start">' + GL.icon('play') + 'Begin test</button>' +
          GL.art('iq-test-hero') +
        '</section>' +
        '<aside class="side">' +
          '<div class="card"><h3>Your results</h3>' + (h.length
            ? '<div class="hist-top"><div><div class="hist-label">Best</div><div class="hist-best">IQ ' + best.iq + '</div></div><div class="hist-score"><b>' + last.iq + '</b><span>latest</span></div></div>' +
              '<div class="hist-spark">' + GL.sparkline(h.map((e) => e.iq), { w: 260, h: 54, color: 'var(--sand)' }) + '</div>' +
              '<a class="btn ghost" href="#/iq/report">View latest report</a>'
            : '<p class="muted small">No attempts yet. Your first result becomes your baseline.</p>') + '</div>' +
          '<div class="card note-card"><h3>About this test</h3><p class="muted small">Scores are estimated by assuming the average adult answers about half the items correctly (SD &asymp; 17%), then mapped to the IQ scale (mean 100, SD 15). It is a practice and training tool, not a clinical assessment.</p></div>' +
        '</aside>' +
      '</div>';
    GL.$('#iq-start', view).onclick = () => {
      active = { start: Date.now(), answers: GL.IQ_QUESTIONS.map(() => -1), flags: [], idx: 0 };
      location.hash = '#/iq/test';
    };
  }

  // ---------- test ----------

  function test(view, scope) {
    const Q = GL.IQ_QUESTIONS;
    view.innerHTML =
      '<div class="iq-top card">' +
        '<div class="iq-top-row"><span id="iq-count" class="strong"></span><span class="chip" id="iq-sec"></span><span class="chip" id="iq-timer">' + GL.icon('clock') + '</span></div>' +
        '<div class="nb-bar"><div id="iq-prog"></div></div>' +
      '</div>' +
      '<section class="card iq-q" id="iq-q"></section>' +
      '<div class="iq-nav"><button class="btn ghost" id="iq-prev">' + GL.icon('back') + 'Back</button>' +
        '<button class="btn ghost" id="iq-flag">' + GL.icon('flag') + 'Flag</button>' +
        '<button class="btn primary" id="iq-next">Next</button></div>' +
      '<div class="iq-dots card" id="iq-dots"></div>';

    function paint() {
      const q = Q[active.idx];
      GL.$('#iq-count', view).textContent = 'Question ' + (active.idx + 1) + ' of ' + Q.length;
      GL.$('#iq-sec', view).textContent = q.section;
      const done = active.answers.filter((a) => a >= 0).length;
      GL.$('#iq-prog', view).style.width = (done / Q.length) * 100 + '%';
      const box = GL.$('#iq-q', view);
      box.innerHTML = '<div class="quiz-text big">' + GL.esc(q.prompt) + '</div>' +
        (q.type === 'matrix' ? matrixHtml(q) : '') +
        '<div class="' + (q.type === 'matrix' ? 'mx-opts' : 'options') + '">' + q.options.map((_, i) => optionHtml(q, i, active.answers[active.idx] === i ? 'picked' : '')).join('') + '</div>';
      GL.$('#iq-prev', view).disabled = active.idx === 0;
      GL.$('#iq-next', view).innerHTML = active.idx === Q.length - 1 ? GL.icon('check') + 'Finish' : 'Next &rarr;';
      GL.$('#iq-flag', view).classList.toggle('on', active.flags.includes(active.idx));
      GL.$('#iq-dots', view).innerHTML = Q.map((_, i) => '<button data-i="' + i + '" class="' + [active.answers[i] >= 0 ? 'done' : '', i === active.idx ? 'cur' : '', active.flags.includes(i) ? 'flag' : ''].join(' ') + '">' + (i + 1) + '</button>').join('');
    }

    function pick(i) {
      active.answers[active.idx] = i;
      paint();
      if (active.idx < Q.length - 1) scope.timeout(() => { active.idx++; paint(); }, 260);
    }

    function go(d) {
      const n = active.idx + d;
      if (n < 0) return;
      if (n >= Q.length) return confirmFinish();
      active.idx = n;
      paint();
    }

    function confirmFinish() {
      const left = active.answers.filter((a) => a < 0).length;
      if (left && !window.confirm(left + ' question' + (left > 1 ? 's are' : ' is') + ' unanswered. Submit anyway?')) return;
      finish();
    }

    function finish() {
      const secs = Math.min(LIMIT, Math.round((Date.now() - active.start) / 1000));
      const raw = Q.filter((q, i) => active.answers[i] === q.answer).length;
      const iq = iqFromRaw(raw, Q.length);
      const rec = GL.record('iq', { iq, raw, total: Q.length, secs, answers: active.answers.slice() });
      active = null;
      GL.lastIqRecord = rec;
      location.hash = '#/iq/report';
    }

    GL.$('#iq-q', view).onclick = (e) => { const b = e.target.closest('[data-o]'); if (b) pick(+b.dataset.o); };
    GL.$('#iq-prev', view).onclick = () => go(-1);
    GL.$('#iq-next', view).onclick = () => go(1);
    GL.$('#iq-flag', view).onclick = () => {
      const f = active.flags;
      const at = f.indexOf(active.idx);
      if (at >= 0) f.splice(at, 1); else f.push(active.idx);
      paint();
    };
    GL.$('#iq-dots', view).onclick = (e) => { const b = e.target.closest('button'); if (b) { active.idx = +b.dataset.i; paint(); } };
    scope.on(document, 'keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = e.key.toUpperCase();
      const q = Q[active.idx];
      const oi = 'ABCDEF'.indexOf(k);
      if (oi >= 0 && oi < q.options.length && k.length === 1) pick(oi);
      else if (/^[1-6]$/.test(k) && +k <= q.options.length) pick(+k - 1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    });
    const tick = () => {
      if (!active) return;
      const left = LIMIT - (Date.now() - active.start) / 1000;
      if (left <= 0) { GL.toast('Time is up!'); return finish(); }
      const t = GL.$('#iq-timer', view);
      t.innerHTML = GL.icon('clock') + GL.fmtTime(left);
      t.classList.toggle('warn', left < 120);
    };
    scope.interval(tick, 500);
    tick();
    paint();
  }

  // ---------- report ----------

  function report(view) {
    const h = GL.history('iq');
    const e = h[h.length - 1];
    if (!e) { location.hash = '#/iq'; return; }
    const rec = GL.lastIqRecord && GL.lastIqRecord.entry === e ? GL.lastIqRecord : null;
    GL.lastIqRecord = null;
    const Q = GL.IQ_QUESTIONS;
    const ans = e.answers || [];
    const pct = Math.round(GL.normCdf((e.iq - 100) / 15) * 1000) / 10;
    const secs = GL.IQ_SECTIONS.map((s) => {
      const qs = Q.filter((q) => q.section === s);
      return [s, qs.filter((q) => ans[q.id] === q.answer).length, qs.length];
    });
    const strongest = secs.slice().sort((a, b) => b[1] / b[2] - a[1] / a[2])[0][0];
    const weakest = secs.slice().sort((a, b) => a[1] / a[2] - b[1] / b[2])[0][0];

    view.innerHTML =
      '<header class="page-head"><a class="back" href="#/iq">' + GL.icon('back') + 'IQ Test</a><div class="eyebrow">Report &middot; ' + new Date(e.t).toLocaleDateString() + '</div><h1 class="display">Your IQ <em>estimate</em></h1></header>' +
      '<div class="report-grid">' +
        '<section class="card iq-score tone-stone">' +
          (rec ? '<div class="result-badge' + (rec.isBest ? ' best' : '') + '">' + GL.icon(rec.isBest ? 'trophy' : 'check') + (rec.isBest ? 'New personal best' : rec.first ? 'Baseline set' : 'Test complete') + ' &middot; +' + rec.gain + ' XP</div>' : '') +
          '<div class="iq-big">' + e.iq + '</div>' +
          '<div class="iq-class">' + GL.iqClass(e.iq) + '</div>' +
          '<div class="muted">Higher than about <b>' + pct + '%</b> of the population</div>' +
          bell(e.iq) +
        '</section>' +
        '<section class="card">' +
          '<h3>Section breakdown</h3>' +
          secs.map(([s, c, t]) => '<div class="meter"><div class="meter-top"><span>' + s + '</span><b>' + c + '/' + t + '</b></div><div class="bar"><div style="width:' + (c / t) * 100 + '%"></div></div></div>').join('') +
          '<div class="kpis tight"><div class="kpi"><span>Raw score</span><b>' + e.raw + '<small>/' + e.total + '</small></b></div><div class="kpi"><span>Time used</span><b>' + GL.fmtTime(e.secs) + '</b></div></div>' +
          '<p class="small">Strongest area: <b>' + strongest + '</b>. Most room to grow: <b>' + weakest + '</b>. ' + tip(weakest) + '</p>' +
          '<div class="btn-row"><a class="btn primary" href="#/coach">' + GL.icon('chat') + 'Ask Quiblee about it</a><button class="btn ghost" id="iq-retake">Retake</button></div>' +
        '</section>' +
      '</div>' +
      '<section class="card"><h3>Answer review</h3><div class="review">' + Q.map((q, i) => {
        const ok = ans[i] === q.answer;
        const mine = ans[i] >= 0 ? (q.type === 'matrix' ? 'ABCDEF'[ans[i]] : q.options[ans[i]]) : 'no answer';
        const right = q.type === 'matrix' ? 'ABCDEF'[q.answer] : q.options[q.answer];
        return '<details class="review-item ' + (ok ? 'good' : 'bad') + '"><summary>' + GL.icon(ok ? 'check' : 'x') + '<span><b>Q' + (i + 1) + '</b> &middot; ' + q.section + ' &middot; ' + GL.esc(q.type === 'matrix' ? 'Matrix pattern' : q.prompt) + '</span></summary>' +
          '<div class="review-body">' + (q.type === 'matrix' ? '<div class="review-mx">' + matrixHtml(q) + '<div class="mx-opt picked">' + GL.mxCell(q.options[q.answer]) + '</div></div>' : '') +
          '<div class="small">Your answer: <b>' + GL.esc(mine) + '</b> &middot; Correct: <b>' + GL.esc(right) + '</b></div><div class="small muted">' + GL.esc(q.why) + '</div></div></details>';
      }).join('') + '</div></section>' +
      '<p class="muted small center">An estimate for practice and self-tracking, not a clinical or diagnostic assessment.</p>';
    GL.$('#iq-retake', view).onclick = () => { location.hash = '#/iq'; };
  }

  function tip(section) {
    return {
      Pattern: 'Try Pattern Memory and the Visual Lab to sharpen visual reasoning.',
      Numeric: 'The Mental Math Sprint and Logic Lab sequence drills will help.',
      Verbal: 'Daily reading and the Word Lab will build vocabulary and analogies.',
      Logic: 'Logic Lab drills train careful, step-by-step deduction.',
    }[section];
  }

  GL.route('iq', (view, parts, scope) => {
    if (parts[0] === 'report') return report(view);
    if (parts[0] === 'test' && active) return test(view, scope);
    if (active) {
      view.innerHTML = '<div class="card center resume"><h2 class="display">Test in progress</h2><p class="muted">You have a test running. The clock keeps ticking while you are away.</p>' +
        '<div class="btn-row"><a class="btn primary" href="#/iq/test">Resume test</a><button class="btn ghost" id="iq-abandon">Abandon</button></div></div>';
      GL.$('#iq-abandon', view).onclick = () => { active = null; location.hash = '#/iq/'; };
      return;
    }
    intro(view);
  });
})();
