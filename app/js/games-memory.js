/* Memory training: digit span, visual grid memory and position n-back. */
(function () {
  'use strict';

  // ---------- digit span ----------

  GL.defineModule({
    id: 'digits',
    title: 'Digit Span',
    icon: 'hash',
    color: '#b59ad6',
    tone: 'slate',
    domains: ['memory'],
    desc: 'Hold a growing string of digits in working memory.',
    howto: '<p>Digits flash one at a time. Type them back in order (or <b>backwards</b> in reverse mode). Each success adds a digit; two misses ends the run.</p><p class="muted small">Average forward span is about 7. Backward span is harder and trains manipulation, not just storage.</p>',
    norm: (e) => ((e.span + (e.mode === 'backward' ? 1 : 0) - 3) / 9) * 100,
    fmt: (e) => e.span + ' digits' + (e.mode === 'backward' ? ' (rev)' : ''),
    render(view, scope) {
      const ui = GL.shell(view, 'digits');
      const st = ui.stage;
      let mode = 'forward';
      let len, strikes, best, seq;

      function intro() {
        st.innerHTML = GL.intro({
          icon: 'hash', color: 'var(--c-memory)', title: 'Digit span',
          text: 'Watch the digits, then enter them. Starts at 3 digits.',
          controls: GL.segmented('mode', [['forward', 'Forward'], ['backward', 'Backward']], mode),
        });
        GL.bindSegmented(st, 'mode', (v) => { mode = v; });
        GL.$('[data-act="start"]', st).onclick = () => { len = 3; strikes = 0; best = 0; round(); };
      }

      function round() {
        seq = Array.from({ length: len }, () => GL.randInt(0, 9));
        for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = (seq[i] + GL.randInt(1, 8)) % 10;
        st.innerHTML = '<div class="span-head"><span>' + len + ' digits</span><span>' + '&#9679;'.repeat(2 - strikes) + '<span class="muted">' + '&#9675;'.repeat(strikes) + '</span></span></div><div class="flash" id="flash"></div>';
        const flash = GL.$('#flash', st);
        let i = 0;
        const show = () => {
          if (i >= seq.length) return scope.timeout(ask, 300);
          flash.textContent = seq[i];
          flash.classList.remove('pop');
          void flash.offsetWidth;
          flash.classList.add('pop');
          scope.timeout(() => { flash.textContent = ''; i++; scope.timeout(show, 220); }, 680);
        };
        scope.timeout(show, 600);
      }

      function ask() {
        st.innerHTML = '<div class="span-head"><span>' + (mode === 'backward' ? 'Enter them in <b>reverse</b>' : 'Enter the digits') + '</span><span class="muted">' + len + ' digits</span></div>' +
          '<div class="entry" id="entry"></div>' +
          '<div class="numpad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<button data-d="' + d + '">' + d + '</button>').join('') +
          '<button data-d="del" class="soft">&larr;</button><button data-d="0">0</button><button data-d="ok" class="go">' + GL.icon('check') + '</button></div>';
        let typed = '';
        const entry = GL.$('#entry', st);
        const paint = () => { entry.innerHTML = Array.from({ length: len }, (_, i) => '<i class="' + (i < typed.length ? 'on' : '') + '">' + (typed[i] || '') + '</i>').join(''); };
        const key = (d) => {
          if (d === 'del') typed = typed.slice(0, -1);
          else if (d === 'ok') return submit(typed);
          else if (typed.length < len) typed += d;
          paint();
          if (typed.length === len) scope.timeout(() => submit(typed), 150);
        };
        paint();
        GL.$('.numpad', st).onclick = (e) => { const b = e.target.closest('button'); if (b) key(b.dataset.d); };
        keyHandler = (e) => {
          if (/^[0-9]$/.test(e.key)) key(e.key);
          else if (e.key === 'Backspace') key('del');
          else if (e.key === 'Enter') key('ok');
        };
      }

      let keyHandler = null;
      scope.on(document, 'keydown', (e) => { if (keyHandler) keyHandler(e); });

      function submit(typed) {
        keyHandler = null;
        const want = (mode === 'backward' ? seq.slice().reverse() : seq).join('');
        const ok = typed === want;
        if (ok) best = len;
        else strikes++;
        st.innerHTML = '<div class="verdict ' + (ok ? 'good' : 'bad') + '">' + GL.icon(ok ? 'check' : 'x') + '<div>' + (ok ? 'Correct' : 'Not quite') + '</div>' +
          (ok ? '' : '<div class="muted small">It was <b>' + want + '</b></div>') + '</div>';
        if (strikes >= 2) return scope.timeout(finish, 1100);
        if (ok) len++;
        scope.timeout(round, ok ? 700 : 1500);
      }

      function finish() {
        const span = Math.max(best, 2);
        const rec = GL.record('digits', { span, mode });
        st.innerHTML = GL.resultHtml({
          rec, big: span, unit: 'digits', sub: (mode === 'backward' ? 'backward' : 'forward') + ' digit span',
          rows: [['Mode', mode === 'backward' ? 'Backward' : 'Forward'], ['Population avg', mode === 'backward' ? '~5' : '~7'], ['Next target', span + 1 + ' digits']],
        });
        GL.$('[data-act="again"]', st).onclick = intro;
        ui.refresh();
      }

      intro();
    },
  });

  // ---------- visual grid memory ----------

  GL.defineModule({
    id: 'grid',
    title: 'Pattern Memory',
    icon: 'grid',
    color: '#b59ad6',
    tone: 'moss',
    domains: ['memory'],
    desc: 'Memorise which tiles light up, then recreate the pattern.',
    howto: '<p>A set of tiles lights up briefly. Tap them all from memory. The grid and the pattern grow as you level up. Three lives.</p><p class="muted small">Trains visuospatial working memory, the sketchpad your mind uses for maps and diagrams.</p>',
    norm: (e) => (e.level / 14) * 100,
    fmt: (e) => 'Level ' + e.level,
    render(view, scope) {
      const ui = GL.shell(view, 'grid');
      const st = ui.stage;
      let level, lives, targets, found, locked;

      function intro() {
        st.innerHTML = GL.intro({ icon: 'grid', color: 'var(--c-memory)', title: 'Pattern memory', text: 'Watch the lit tiles, then tap them back. Three lives.' });
        GL.$('[data-act="start"]', st).onclick = () => { level = 1; lives = 3; round(); };
      }

      function round() {
        const size = level <= 2 ? 3 : level <= 5 ? 4 : level <= 9 ? 5 : 6;
        const count = Math.min(level + 2, size * size - 2);
        targets = new Set(GL.shuffle([...Array(size * size).keys()]).slice(0, count));
        found = new Set();
        locked = true;
        st.innerHTML = '<div class="span-head"><span>Level ' + level + '</span><span>' + '&#9829;'.repeat(lives) + '<span class="muted">' + '&#9825;'.repeat(3 - lives) + '</span></span></div>' +
          '<div class="mgrid" style="--n:' + size + '">' + Array.from({ length: size * size }, (_, i) => '<button data-i="' + i + '"></button>').join('') + '</div>' +
          '<div class="muted small center" id="grid-msg">Memorise&hellip;</div>';
        const cells = GL.$$('.mgrid button', st);
        scope.timeout(() => targets.forEach((i) => cells[i].classList.add('lit')), 450);
        scope.timeout(() => {
          targets.forEach((i) => cells[i].classList.remove('lit'));
          locked = false;
          GL.$('#grid-msg', st).textContent = 'Tap the ' + count + ' tiles';
        }, 450 + 900 + count * 110);
        GL.$('.mgrid', st).onclick = (e) => {
          const b = e.target.closest('button');
          if (!b || locked) return;
          const i = +b.dataset.i;
          if (found.has(i)) return;
          if (targets.has(i)) {
            found.add(i);
            b.classList.add('good');
            if (found.size === targets.size) {
              locked = true;
              level++;
              scope.timeout(round, 650);
            }
          } else {
            locked = true;
            b.classList.add('bad');
            lives--;
            targets.forEach((t) => { if (!found.has(t)) cells[t].classList.add('miss'); });
            GL.$('#grid-msg', st).textContent = lives ? 'Missed one. Try this level again.' : 'Out of lives';
            scope.timeout(lives ? round : finish, 1300);
          }
        };
      }

      function finish() {
        const reached = level - 1;
        const rec = GL.record('grid', { level: reached });
        st.innerHTML = GL.resultHtml({
          rec, big: reached, unit: 'levels', sub: 'patterns recalled',
          rows: [['Largest pattern', reached ? reached + 2 + ' tiles' : '&mdash;'], ['Lives used', '3 / 3']],
        });
        GL.$('[data-act="again"]', st).onclick = intro;
        ui.refresh();
      }

      intro();
    },
  });

  // ---------- n-back ----------

  GL.defineModule({
    id: 'nback',
    title: 'N-Back',
    icon: 'layers',
    color: '#b59ad6',
    tone: 'taupe',
    domains: ['memory', 'focus'],
    desc: 'The classic working-memory workout used in research.',
    howto: '<p>A square appears in a 3&times;3 grid, one position at a time. Press <b>Match</b> (or <kbd>Space</kbd>) when the position is the same as it was <b>N steps back</b>.</p><p class="muted small">Scored on hits minus false alarms. Move up a level once you consistently score above 80%.</p>',
    norm: (e) => Math.max(0, e.sens) * (20 + 20 * e.n),
    fmt: (e) => e.n + '-back &middot; ' + Math.round(Math.max(0, e.sens) * 100) + '%',
    render(view, scope) {
      const ui = GL.shell(view, 'nback');
      const st = ui.stage;
      const last = GL.history('nback').slice(-1)[0];
      let N = last ? last.n : 2;
      let seq, idx, pressed, hits, misses, fas, crs, running;

      function intro() {
        running = false;
        st.innerHTML = GL.intro({
          icon: 'layers', color: 'var(--c-memory)', title: 'Position n-back',
          text: 'Pick a level. Each round has ' + (20 + N) + ' steps at 2.5 seconds each.',
          controls: GL.segmented('n', [[1, '1-back'], [2, '2-back'], [3, '3-back'], [4, '4-back']], N),
        });
        GL.bindSegmented(st, 'n', (v) => { N = +v; });
        GL.$('[data-act="start"]', st).onclick = start;
      }

      function makeSeq() {
        const len = 20 + N;
        const s = [];
        for (let i = 0; i < len; i++) {
          if (i >= N && Math.random() < 0.3) s.push(s[i - N]);
          else {
            let p;
            do { p = GL.randInt(0, 8); } while (i >= N && p === s[i - N]);
            s.push(p);
          }
        }
        return s;
      }

      function start() {
        seq = makeSeq();
        idx = -1;
        hits = misses = fas = crs = 0;
        running = true;
        st.innerHTML = '<div class="span-head"><span>' + N + '-back</span><span id="nb-count" class="muted"></span></div>' +
          '<div class="nb-grid">' + Array.from({ length: 9 }, () => '<div></div>').join('') + '</div>' +
          '<div class="nb-bar"><div id="nb-prog"></div></div>' +
          '<button class="btn primary big nb-match" id="nb-match">Match <kbd>Space</kbd></button>';
        GL.$('#nb-match', st).onclick = press;
        step();
      }

      function score() {
        if (idx < N) return;
        const isTarget = seq[idx] === seq[idx - N];
        if (isTarget && pressed) hits++;
        else if (isTarget) misses++;
        else if (pressed) fas++;
        else crs++;
      }

      function step() {
        if (idx >= 0) score();
        idx++;
        if (idx >= seq.length) return finish();
        pressed = false;
        const cells = GL.$$('.nb-grid div', st);
        cells.forEach((c) => c.classList.remove('on', 'hit', 'fa'));
        GL.$('#nb-match', st).classList.remove('hit', 'fa');
        GL.$('#nb-count', st).textContent = idx + 1 + ' / ' + seq.length;
        GL.$('#nb-prog', st).style.width = ((idx + 1) / seq.length) * 100 + '%';
        scope.timeout(() => cells[seq[idx]].classList.add('on'), 60);
        scope.timeout(() => cells[seq[idx]].classList.remove('on'), 60 + 700);
        scope.timeout(step, 2500);
      }

      function press() {
        if (!running || pressed || idx < 0) return;
        pressed = true;
        const good = idx >= N && seq[idx] === seq[idx - N];
        GL.$('#nb-match', st).classList.add(good ? 'hit' : 'fa');
      }

      function finish() {
        running = false;
        const targets = hits + misses;
        const hitRate = targets ? hits / targets : 0;
        const faRate = fas + crs ? fas / (fas + crs) : 0;
        const sens = hitRate - faRate;
        const rec = GL.record('nback', { n: N, sens, hits, misses, fas });
        const up = sens >= 0.8 && N < 4;
        st.innerHTML = GL.resultHtml({
          rec, big: Math.round(Math.max(0, sens) * 100), unit: '%', sub: N + '-back accuracy (hits &minus; false alarms)',
          rows: [['Hits', hits + ' / ' + targets], ['False alarms', fas], ['Missed', misses]],
          extra: up ? '<div class="note good">' + GL.icon('spark') + 'Ready for ' + (N + 1) + '-back. Level raised.</div>' : '',
        });
        if (up) N++;
        GL.$('[data-act="again"]', st).onclick = start;
        ui.refresh();
      }

      scope.on(document, 'keydown', (e) => {
        if (e.code === 'Space' && running) { e.preventDefault(); press(); }
      });
      intro();
    },
  });
})();
