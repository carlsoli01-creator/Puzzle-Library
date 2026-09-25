/* Focus and numeracy training: Stroop colour-word test and a mental-maths sprint. */
(function () {
  'use strict';

  // ---------- Stroop ----------

  const INKS = [
    { name: 'RED', color: '#e2604f' },
    { name: 'BLUE', color: '#6f9ae0' },
    { name: 'GREEN', color: '#7fc07a' },
    { name: 'YELLOW', color: '#e6c14f' },
  ];

  GL.defineModule({
    id: 'stroop',
    title: 'Stroop Focus',
    icon: 'eye',
    color: '#d97a68',
    tone: 'rust',
    domains: ['focus'],
    desc: 'Name the ink colour, not the word. Beat your own brain.',
    howto: '<p>A colour word appears in a coloured ink. Choose the <b>ink colour</b>, ignoring what the word says. Keys <kbd>1</kbd>&ndash;<kbd>4</kbd> work too. You have 45 seconds.</p><p class="muted small">Score = correct &minus; wrong. Trains inhibitory control, the skill of ignoring distractions.</p>',
    norm: (e) => (e.score / 42) * 100,
    fmt: (e) => e.score + ' pts &middot; ' + Math.round(e.acc * 100) + '%',
    render(view, scope) {
      const ui = GL.shell(view, 'stroop');
      const st = ui.stage;
      const DURATION = 45;
      let right, wrong, ink, endAt, running, rts, shownAt;

      function intro() {
        running = false;
        st.innerHTML = GL.intro({ icon: 'eye', color: 'var(--c-focus)', title: 'Stroop test', text: 'Pick the colour of the ink. 45 seconds. Speed and accuracy both count.' });
        GL.$('[data-act="start"]', st).onclick = start;
      }

      function start() {
        right = wrong = 0;
        rts = [];
        running = true;
        endAt = performance.now() + DURATION * 1000;
        st.innerHTML = '<div class="span-head"><span id="sp-score">0 pts</span><span id="sp-time">' + DURATION + 's</span></div>' +
          '<div class="nb-bar"><div id="sp-bar" style="width:100%"></div></div>' +
          '<div class="stroop-word" id="sp-word"></div>' +
          '<div class="stroop-btns">' + INKS.map((c, i) => '<button data-i="' + i + '"><i style="background:' + c.color + '"></i>' + c.name.toLowerCase() + '<kbd>' + (i + 1) + '</kbd></button>').join('') + '</div>';
        GL.$('.stroop-btns', st).onclick = (e) => { const b = e.target.closest('button'); if (b) answer(+b.dataset.i); };
        next();
        const tick = () => {
          if (!running) return;
          const left = (endAt - performance.now()) / 1000;
          if (left <= 0) return finish();
          GL.$('#sp-time', st).textContent = Math.ceil(left) + 's';
          GL.$('#sp-bar', st).style.width = (left / DURATION) * 100 + '%';
          scope.frame(tick);
        };
        scope.frame(tick);
      }

      function next() {
        const word = Math.floor(Math.random() * 4);
        ink = Math.random() < 0.25 ? word : (word + 1 + Math.floor(Math.random() * 3)) % 4;
        const w = GL.$('#sp-word', st);
        w.textContent = INKS[word].name;
        w.style.color = INKS[ink].color;
        w.classList.remove('pop');
        void w.offsetWidth;
        w.classList.add('pop');
        shownAt = performance.now();
      }

      function answer(i) {
        if (!running) return;
        if (i === ink) { right++; rts.push(performance.now() - shownAt); } else {
          wrong++;
          const w = GL.$('#sp-word', st);
          w.classList.add('shake');
          scope.timeout(() => w.classList.remove('shake'), 300);
        }
        GL.$('#sp-score', st).textContent = right - wrong + ' pts';
        next();
      }

      function finish() {
        running = false;
        const score = right - wrong;
        const acc = right + wrong ? right / (right + wrong) : 0;
        const rt = Math.round(GL.avg(rts));
        const rec = GL.record('stroop', { score, acc, right, wrong, rt });
        st.innerHTML = GL.resultHtml({
          rec, big: score, unit: 'pts', sub: 'Stroop score in 45 seconds',
          rows: [['Correct', right], ['Wrong', wrong], ['Accuracy', Math.round(acc * 100) + '%'], ['Avg response', rt ? rt + ' ms' : '&mdash;']],
        });
        GL.$('[data-act="again"]', st).onclick = start;
        ui.refresh();
      }

      scope.on(document, 'keydown', (e) => {
        if (running && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
      });
      intro();
    },
  });

  // ---------- mental maths sprint ----------

  function problem(level) {
    const r = GL.randInt;
    let a, b, op;
    switch (level) {
      case 1: a = r(2, 9); b = r(2, 9); op = GL.pick(['+', '+', '-']); break;
      case 2: a = r(11, 49); b = r(3, 29); op = GL.pick(['+', '-']); break;
      case 3: a = r(3, 12); b = r(3, 12); op = GL.pick(['×', '×', '+']); if (op === '+') { a = r(25, 99); b = r(25, 99); } break;
      case 4: {
        op = GL.pick(['×', '÷', '-']);
        if (op === '×') { a = r(12, 29); b = r(3, 9); } else if (op === '÷') { b = r(3, 12); a = b * r(4, 15); } else { a = r(101, 399); b = r(27, 99); }
        break;
      }
      default: {
        op = GL.pick(['×', '÷', '+', '%']);
        if (op === '×') { a = r(13, 39); b = r(11, 19); } else if (op === '÷') { b = r(6, 19); a = b * r(11, 29); } else if (op === '+') { a = r(245, 899); b = r(178, 899); } else { a = GL.pick([10, 15, 20, 25, 30, 40, 75]); b = r(2, 20) * 20; }
      }
    }
    if (op === '-' && b > a) [a, b] = [b, a];
    const ans = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : op === '÷' ? a / b : (a * b) / 100;
    const text = op === '%' ? a + '% of ' + b : a + ' ' + op + ' ' + b;
    return { text, ans };
  }

  GL.defineModule({
    id: 'math',
    title: 'Mental Math Sprint',
    icon: 'calc',
    color: '#7fb8a8',
    tone: 'stone',
    domains: ['numeracy'],
    desc: 'Sixty seconds of arithmetic that gets harder as you streak.',
    howto: '<p>Type the answer; it auto-submits when correct. Three correct in a row raises the difficulty (up to level 5). A wrong answer on <kbd>Enter</kbd> drops you a level.</p><p class="muted small">Points = difficulty level for each correct answer.</p>',
    norm: (e) => (e.points / 70) * 100,
    fmt: (e) => e.points + ' pts &middot; L' + e.maxLevel,
    render(view, scope) {
      const ui = GL.shell(view, 'math');
      const st = ui.stage;
      const DURATION = 60;
      let level, streak, points, correct, wrong, maxLevel, cur, endAt, running;

      function intro() {
        running = false;
        st.innerHTML = GL.intro({ icon: 'calc', color: 'var(--c-numeracy)', title: 'Mental maths sprint', text: '60 seconds. Adaptive difficulty. How far can you climb?' });
        GL.$('[data-act="start"]', st).onclick = start;
      }

      function start() {
        level = 1; streak = 0; points = 0; correct = 0; wrong = 0; maxLevel = 1;
        running = true;
        endAt = performance.now() + DURATION * 1000;
        st.innerHTML = '<div class="span-head"><span id="mm-pts">0 pts</span><span id="mm-lvl" class="chip">Level 1</span><span id="mm-time">60s</span></div>' +
          '<div class="nb-bar"><div id="mm-bar" style="width:100%"></div></div>' +
          '<div class="mm-problem" id="mm-q"></div>' +
          '<input class="mm-input" id="mm-in" inputmode="decimal" autocomplete="off" aria-label="Answer">' +
          '<div class="muted small center">Press Enter to submit a guess or skip</div>';
        const inp = GL.$('#mm-in', st);
        inp.focus();
        inp.oninput = () => {
          if (inp.value.trim() !== '' && Number(inp.value) === cur.ans) good();
        };
        inp.onkeydown = (e) => {
          if (e.key !== 'Enter') return;
          if (Number(inp.value) === cur.ans && inp.value.trim() !== '') return good();
          wrong++;
          streak = 0;
          level = Math.max(1, level - 1);
          inp.classList.add('shake');
          scope.timeout(() => inp.classList.remove('shake'), 300);
          next();
        };
        next();
        const tick = () => {
          if (!running) return;
          const left = (endAt - performance.now()) / 1000;
          if (left <= 0) return finish();
          GL.$('#mm-time', st).textContent = Math.ceil(left) + 's';
          GL.$('#mm-bar', st).style.width = (left / DURATION) * 100 + '%';
          scope.frame(tick);
        };
        scope.frame(tick);
      }

      function good() {
        correct++;
        points += level;
        streak++;
        if (streak >= 3 && level < 5) { level++; streak = 0; }
        maxLevel = Math.max(maxLevel, level);
        next();
      }

      function next() {
        cur = problem(level);
        GL.$('#mm-q', st).textContent = cur.text + ' =';
        GL.$('#mm-in', st).value = '';
        GL.$('#mm-pts', st).textContent = points + ' pts';
        GL.$('#mm-lvl', st).textContent = 'Level ' + level;
      }

      function finish() {
        running = false;
        const rec = GL.record('math', { points, correct, wrong, maxLevel });
        st.innerHTML = GL.resultHtml({
          rec, big: points, unit: 'pts', sub: correct + ' problems solved in 60 seconds',
          rows: [['Correct', correct], ['Wrong / skipped', wrong], ['Peak level', maxLevel + ' / 5']],
        });
        GL.$('[data-act="again"]', st).onclick = start;
        ui.refresh();
      }

      intro();
    },
  });
})();
