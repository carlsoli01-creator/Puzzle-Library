/* Reading comprehension: timed reading, then a quiz with the text hidden. */
(function () {
  'use strict';

  GL.defineModule({
    id: 'reading',
    title: 'Read & Recall',
    icon: 'book',
    color: '#9cc08a',
    tone: 'moss',
    domains: ['verbal'],
    route: '#/read',
    desc: 'Read a short article at your natural pace, then answer questions from memory.',
    howto: '<p>The timer measures your reading speed. When you finish, the article is hidden and you answer four questions.</p><p class="muted small">Effective speed = words per minute &times; comprehension. Average adult: about 240 wpm at 70&ndash;80% comprehension.</p>',
    norm: (e) => ((e.eff - 100) / 350) * 100,
    fmt: (e) => e.wpm + ' wpm &middot; ' + Math.round(e.acc * 100) + '%',
  });

  function articleBest(id) {
    const list = GL.history('reading').filter((e) => e.article === id);
    return list.length ? list.reduce((b, e) => (e.norm > b.norm ? e : b)) : null;
  }

  function listPage(view) {
    const h = GL.history('reading');
    const avgWpm = h.length ? Math.round(GL.avg(h.slice(-5).map((e) => e.wpm))) : null;
    const avgAcc = h.length ? Math.round(GL.avg(h.slice(-5).map((e) => e.acc)) * 100) : null;
    view.innerHTML =
      '<header class="page-head"><div class="eyebrow">Reading room</div><h1 class="display">Read &amp; Recall</h1>' +
      '<p class="muted lede">Short, true stories from science and history. Read at your natural pace, then prove you understood.</p></header>' +
      '<div class="kpis">' +
        '<div class="kpi"><span>Articles read</span><b>' + new Set(h.map((e) => e.article)).size + '<small>/' + GL.ARTICLES.length + '</small></b></div>' +
        '<div class="kpi"><span>Recent speed</span><b>' + (avgWpm || '&mdash;') + '<small>' + (avgWpm ? 'wpm' : '') + '</small></b></div>' +
        '<div class="kpi"><span>Comprehension</span><b>' + (avgAcc !== null ? avgAcc : '&mdash;') + '<small>' + (avgAcc !== null ? '%' : '') + '</small></b></div>' +
      '</div>' +
      '<div class="tiles">' + GL.ARTICLES.map((a, i) => {
        const best = articleBest(a.id);
        return '<a class="tile tone-' + a.tone + '" href="#/read/' + a.id + '" style="--i:' + i + '">' +
          '<div class="tile-label">' + a.title + '</div>' +
          '<div class="tile-meta">' + a.topic + ' &middot; ' + a.level + ' &middot; ' + Math.ceil(a.words / 230) + ' min</div>' +
          (best ? '<div class="tile-badge">' + GL.icon('check') + Math.round(best.acc * 100) + '%</div>' : '') +
          GL.art('book', i) +
        '</a>';
      }).join('') + '</div>';
  }

  function articlePage(view, id, scope) {
    const a = GL.ARTICLES.find((x) => x.id === id);
    if (!a) { location.hash = '#/read'; return; }
    view.innerHTML =
      '<header class="page-head"><a class="back" href="#/read">' + GL.icon('back') + 'Reading room</a>' +
      '<div class="eyebrow">' + a.topic + ' &middot; ' + a.level + ' &middot; ' + a.words + ' words</div><h1 class="display">' + a.title + '</h1></header>' +
      '<div class="game-layout"><section class="card stage-card"><div class="stage read-stage" id="stage"></div></section>' +
      '<aside class="side"><div class="card howto"><h3>How it works</h3>' + GL.modules.reading.howto + '</div><div class="card" id="hist"></div></aside></div>';
    const st = GL.$('#stage', view);
    GL.$('#hist', view).innerHTML = GL.historyCard('reading');
    let startAt;

    function intro() {
      st.innerHTML = GL.intro({ icon: 'book', color: 'var(--c-verbal)', title: 'Ready to read?', text: 'Read at your normal pace, as if you want to remember it. The timer starts when you press Start.', button: 'Start reading' });
      GL.$('[data-act="start"]', st).onclick = read;
    }

    function read() {
      startAt = performance.now();
      st.innerHTML = '<div class="read-bar"><span class="chip" id="rd-time">' + GL.icon('clock') + '00:00</span><span class="muted small">Take your time, the text will be hidden afterwards</span></div>' +
        '<article class="prose">' + a.text.map((p) => '<p>' + GL.esc(p) + '</p>').join('') + '</article>' +
        '<button class="btn primary big" id="rd-done">' + GL.icon('check') + 'I\'m done reading</button>';
      scope.interval(() => {
        const el = GL.$('#rd-time', st);
        if (el) el.innerHTML = GL.icon('clock') + GL.fmtTime((performance.now() - startAt) / 1000);
      }, 500);
      GL.$('#rd-done', st).onclick = quiz;
      window.scrollTo({ top: view.offsetTop, behavior: 'smooth' });
    }

    function quiz() {
      const secs = (performance.now() - startAt) / 1000;
      const wpm = Math.round(a.words / (secs / 60));
      const rnd = GL.rng(a.id.length * 97 + 13);
      const qs = a.questions.map((q) => {
        const order = GL.shuffle(q.opts.map((_, i) => i), rnd);
        return { q: q.q, why: q.why, opts: order.map((i) => q.opts[i]), answer: order.indexOf(0) };
      });
      const picks = qs.map(() => -1);
      st.innerHTML = '<div class="read-bar"><span class="chip">' + GL.icon('clock') + wpm + ' wpm</span><span class="muted small">Answer from memory</span></div>' +
        qs.map((q, qi) => '<div class="quiz-q" data-q="' + qi + '"><div class="quiz-n">Question ' + (qi + 1) + '</div><div class="quiz-text">' + GL.esc(q.q) + '</div>' +
          '<div class="options">' + q.opts.map((o, oi) => '<button class="option" data-o="' + oi + '"><span class="opt-key">' + 'ABCD'[oi] + '</span>' + GL.esc(o) + '</button>').join('') + '</div></div>').join('') +
        '<button class="btn primary big" id="rd-submit" disabled>Submit answers</button>';
      st.onclick = (e) => {
        const b = e.target.closest('.option');
        if (!b) return;
        const qi = +b.closest('.quiz-q').dataset.q;
        picks[qi] = +b.dataset.o;
        GL.$$('.option', b.parentNode).forEach((x) => x.classList.toggle('picked', x === b));
        GL.$('#rd-submit', st).disabled = picks.includes(-1);
      };
      GL.$('#rd-submit', st).onclick = () => { st.onclick = null; results(qs, picks, wpm, secs); };
    }

    function results(qs, picks, wpm, secs) {
      const right = qs.filter((q, i) => picks[i] === q.answer).length;
      const acc = right / qs.length;
      const eff = Math.round(wpm * acc);
      const rec = GL.record('reading', { article: a.id, wpm, acc, eff, secs: Math.round(secs) });
      const verdict = acc === 1 && wpm >= 300 ? 'Speed and precision. Excellent.' : acc === 1 ? 'Perfect recall. Try reading a little faster next time.' : acc < 0.75 && wpm > 300 ? 'You may be reading too fast. Slow down a little.' : 'Solid. Aim for 100% at a steady pace.';
      st.innerHTML = GL.resultHtml({
        rec, big: eff, unit: 'eff. wpm', sub: verdict,
        rows: [['Reading speed', wpm + ' wpm'], ['Comprehension', right + ' / ' + qs.length], ['Time', GL.fmtTime(secs)]],
        againLabel: 'Next article', backHref: '#/read', backLabel: 'Reading room',
        extra: '<div class="review">' + qs.map((q, i) => {
          const ok = picks[i] === q.answer;
          return '<div class="review-item ' + (ok ? 'good' : 'bad') + '">' + GL.icon(ok ? 'check' : 'x') + '<div><b>' + GL.esc(q.q) + '</b>' +
            (ok ? '' : '<div class="small">You chose: ' + GL.esc(q.opts[picks[i]]) + '</div>') +
            '<div class="small">Answer: ' + GL.esc(q.opts[q.answer]) + '. <span class="muted">' + GL.esc(q.why) + '</span></div></div></div>';
        }).join('') + '</div>',
      });
      GL.$('[data-act="again"]', st).onclick = () => {
        const done = new Set(GL.history('reading').map((e) => e.article));
        const next = GL.ARTICLES.find((x) => !done.has(x.id)) || GL.ARTICLES[(GL.ARTICLES.indexOf(a) + 1) % GL.ARTICLES.length];
        location.hash = '#/read/' + next.id;
      };
      GL.$('#hist', view).innerHTML = GL.historyCard('reading');
    }

    intro();
  }

  GL.route('read', (view, parts, scope) => {
    if (parts[0]) articlePage(view, parts[0], scope);
    else listPage(view);
  });
})();
