/* Speed training: simple reaction time and four-choice reaction time. */
(function () {
  'use strict';

  function rating(ms) {
    if (ms < 180) return 'Lightning';
    if (ms < 220) return 'Elite';
    if (ms < 260) return 'Sharp';
    if (ms < 310) return 'Average';
    return 'Warming up';
  }

  function trialBars(times, color) {
    const max = Math.max(...times, 400);
    return '<div class="trial-bars">' + times.map((t, i) =>
      '<div class="trial-bar"><div class="trial-fill" style="height:' + Math.round((t / max) * 100) + '%;background:' + color + '"></div><span>' + t + '</span><em>#' + (i + 1) + '</em></div>').join('') + '</div>';
  }

  // ---------- simple reaction ----------

  GL.defineModule({
    id: 'reaction',
    title: 'Reaction Time',
    icon: 'bolt',
    color: '#e0b25c',
    tone: 'clay',
    domains: ['speed'],
    desc: 'Hit the moment the panel turns green.',
    howto: '<p>Wait for the panel to turn <b>green</b>, then click, tap or press <kbd>Space</kbd> as fast as you can. Five trials; reacting early is a false start and the trial repeats.</p><p class="muted small">Typical adults: 250&ndash;300 ms. Trained gamers: under 200 ms.</p>',
    unit: 'ms',
    metric: (e) => e.avg,
    lowerIsBetter: true,
    norm: (e) => ((400 - e.avg) / (400 - 170)) * 100,
    fmt: (e) => e.avg + ' ms avg',
    render(view, scope) {
      const ui = GL.shell(view, 'reaction');
      const st = ui.stage;
      const TRIALS = 5;
      let times = [];
      let state = 'intro';
      let goAt = 0;
      let waitId = null;

      function panel(cls, big, title, sub) {
        st.innerHTML = '<div class="rt-panel ' + cls + '"><div class="rt-big">' + big + '</div><div class="rt-title">' + title + '</div><div class="rt-sub">' + sub + '</div>' +
          '<div class="rt-dots">' + Array.from({ length: TRIALS }, (_, i) => '<i class="' + (i < times.length ? 'on' : '') + '"></i>').join('') + '</div></div>';
      }

      function intro() {
        times = [];
        state = 'intro';
        panel('idle', GL.icon('bolt'), 'Reaction test', 'Click anywhere here, or press Space, to begin');
      }

      function arm() {
        state = 'wait';
        panel('wait', '&bull;&bull;&bull;', 'Wait for green&hellip;', 'Trial ' + (times.length + 1) + ' of ' + TRIALS);
        waitId = scope.timeout(() => {
          state = 'go';
          panel('go', 'NOW', 'Click!', '');
          goAt = performance.now();
        }, 1300 + Math.random() * 2700);
      }

      function press() {
        if (state === 'intro' || state === 'between') return arm();
        if (state === 'wait') {
          scope.clearTimeout(waitId);
          state = 'between';
          return panel('early', 'Too soon', 'False start', 'Click to retry this trial');
        }
        if (state === 'go') {
          const ms = Math.round(performance.now() - goAt);
          times.push(ms);
          if (times.length >= TRIALS) return finish();
          state = 'between';
          panel('hit', ms + '<small>ms</small>', rating(ms), 'Click for trial ' + (times.length + 1));
        }
      }

      function finish() {
        state = 'done';
        const avg = Math.round(GL.avg(times));
        const best = Math.min(...times);
        const rec = GL.record('reaction', { avg, best, times });
        st.innerHTML = GL.resultHtml({
          rec, big: avg, unit: 'ms', sub: rating(avg) + ' average reaction',
          extra: trialBars(times, 'var(--c-speed)'),
          rows: [['Fastest', best + ' ms'], ['Slowest', Math.max(...times) + ' ms'], ['Spread', Math.max(...times) - best + ' ms']],
        });
        GL.$('[data-act="again"]', st).onclick = intro;
        ui.refresh();
      }

      scope.on(st, 'pointerdown', (e) => {
        if (state === 'done' || e.button > 0) return;
        e.preventDefault();
        press();
      });
      scope.on(document, 'keydown', (e) => {
        if (e.code !== 'Space' || state === 'done') return;
        e.preventDefault();
        if (!e.repeat) press();
      });
      intro();
    },
  });

  // ---------- choice reaction ----------

  const PADS = [
    { key: 'KeyD', label: 'D', color: '#d97a68' },
    { key: 'KeyF', label: 'F', color: '#e0b25c' },
    { key: 'KeyJ', label: 'J', color: '#9cc08a' },
    { key: 'KeyK', label: 'K', color: '#8fb3d9' },
  ];

  GL.defineModule({
    id: 'choice',
    title: 'Choice Reaction',
    icon: 'target',
    color: '#e0b25c',
    tone: 'olive',
    domains: ['speed', 'focus'],
    desc: 'Four pads. One lights up. Hit the right one, fast.',
    howto: '<p>When a pad lights up, tap it or press its key: <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd>. Twelve trials. Wrong pads and early presses count as errors.</p><p class="muted small">Choice reaction trains decision speed, not just reflexes. 400&ndash;500 ms is typical.</p>',
    norm: (e) => ((750 - e.avg) / (750 - 360)) * 100 * e.acc,
    fmt: (e) => e.avg + ' ms &middot; ' + Math.round(e.acc * 100) + '%',
    render(view, scope) {
      const ui = GL.shell(view, 'choice');
      const st = ui.stage;
      const TRIALS = 12;
      let times, errors, target, litAt, state, n;

      function intro() {
        state = 'intro';
        st.innerHTML = GL.intro({ icon: 'target', color: 'var(--c-speed)', title: 'Choice reaction', text: 'Twelve trials. Keep your fingers on D F J K, or get ready to tap.', button: 'Start' });
        GL.$('[data-act="start"]', st).onclick = start;
      }

      function start() {
        times = [];
        errors = 0;
        n = 0;
        st.innerHTML = '<div class="cr-head"><span id="cr-count">Trial 1 / ' + TRIALS + '</span><span id="cr-msg" class="muted">Get ready&hellip;</span></div>' +
          '<div class="cr-pads">' + PADS.map((p, i) => '<button class="cr-pad" data-i="' + i + '" style="--pc:' + p.color + '"><span>' + p.label + '</span></button>').join('') + '</div>';
        GL.$$('.cr-pad', st).forEach((b) => scope.on(b, 'pointerdown', (e) => { e.preventDefault(); hit(+b.dataset.i); }));
        next();
      }

      function next() {
        state = 'wait';
        target = -1;
        GL.$$('.cr-pad', st).forEach((b) => b.classList.remove('lit', 'bad', 'good'));
        GL.$('#cr-count', st).textContent = 'Trial ' + (n + 1) + ' / ' + TRIALS;
        scope.timeout(() => {
          state = 'lit';
          target = Math.floor(Math.random() * 4);
          GL.$$('.cr-pad', st)[target].classList.add('lit');
          GL.$('#cr-msg', st).textContent = 'Go!';
          litAt = performance.now();
        }, 700 + Math.random() * 1400);
      }

      function hit(i) {
        if (state === 'wait') {
          errors++;
          GL.$('#cr-msg', st).textContent = 'Too early!';
          GL.$$('.cr-pad', st)[i].classList.add('bad');
          scope.timeout(() => GL.$$('.cr-pad', st)[i] && GL.$$('.cr-pad', st)[i].classList.remove('bad'), 250);
          return;
        }
        if (state !== 'lit') return;
        const pad = GL.$$('.cr-pad', st)[i];
        if (i !== target) {
          errors++;
          pad.classList.add('bad');
          GL.$('#cr-msg', st).textContent = 'Wrong pad';
          return;
        }
        const ms = Math.round(performance.now() - litAt);
        times.push(ms);
        pad.classList.add('good');
        GL.$('#cr-msg', st).textContent = ms + ' ms';
        state = 'gap';
        n++;
        if (n >= TRIALS) scope.timeout(finish, 300);
        else scope.timeout(next, 350);
      }

      function finish() {
        state = 'done';
        const avg = Math.round(GL.avg(times));
        const acc = TRIALS / (TRIALS + errors);
        const rec = GL.record('choice', { avg, acc, errors });
        st.innerHTML = GL.resultHtml({
          rec, big: avg, unit: 'ms', sub: 'average choice reaction',
          extra: trialBars(times, 'var(--c-speed)'),
          rows: [['Accuracy', Math.round(acc * 100) + '%'], ['Errors', errors], ['Fastest', Math.min(...times) + ' ms']],
        });
        GL.$('[data-act="again"]', st).onclick = start;
        ui.refresh();
      }

      scope.on(document, 'keydown', (e) => {
        const i = PADS.findIndex((p) => p.key === e.code);
        if (i < 0 || e.repeat) return;
        if (state === 'intro' && (e.code === 'Space')) return;
        if (state === 'wait' || state === 'lit') { e.preventDefault(); hit(i); }
      });
      intro();
    },
  });
})();
