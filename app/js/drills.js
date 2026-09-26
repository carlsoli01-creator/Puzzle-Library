/* Drill engine plus three labs of ten quick activities each:
   Logic Lab (reasoning), Word Lab (verbal) and Visual Lab (perception).
   Each drill is ten generated questions; score blends accuracy and speed. */
(function () {
  'use strict';

  const R = GL.randInt;
  const P = GL.pick;
  const SH = (a) => GL.shuffle(a);
  const ROUNDS = 10;

  GL.SECTIONS = [
    { id: 'core', title: 'Core Training', blurb: 'The flagship brain games: speed, memory, focus and maths.' },
    { id: 'logic', title: 'Logic Lab', blurb: 'Ten reasoning drills: sequences, deduction, codes and more.' },
    { id: 'word', title: 'Word Lab', blurb: 'Ten verbal drills to grow vocabulary and language precision.' },
    { id: 'visual', title: 'Visual Lab', blurb: 'Ten perception drills for sharper eyes and spatial thinking.' },
  ];

  // ---------- helpers ----------

  function uniq(a) { return Array.from(new Set(a)); }

  function mcq(correct, wrongs, extra, fixed) {
    let options;
    if (fixed) options = fixed;
    else {
      const w = uniq(wrongs.map(String)).filter((x) => x !== String(correct));
      options = SH([String(correct)].concat(SH(w).slice(0, 3)));
    }
    return Object.assign({ options, answer: options.indexOf(String(correct)) }, extra || {});
  }

  function nearNums(ans, extra) {
    const c = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 3, ans - 3].concat(extra || []);
    return c.filter((v) => v >= 0 && v !== ans);
  }

  const esc = GL.esc;

  // ---------- engine ----------

  function drill(def) {
    GL.defineModule({
      id: def.id,
      title: def.title,
      icon: def.icon,
      color: def.color,
      tone: def.tone,
      section: def.section,
      domains: def.domains,
      desc: def.desc,
      howto: '<p>' + def.how + '</p><p class="muted small">Ten questions. Your score blends accuracy with speed (target: about ' + def.target + 's per question).</p>',
      norm: (e) => e.acc * 100 * Math.min(1, 0.55 + 0.45 * (def.target / Math.max(0.5, e.avg))),
      fmt: (e) => Math.round(e.acc * ROUNDS) + '/' + ROUNDS + ' &middot; ' + e.avg.toFixed(1) + 's',
      render(view, scope) {
        const ui = GL.shell(view, def.id);
        const st = ui.stage;
        let n, correct, times, q, shownAt, locked, keyFn;

        function intro() {
          keyFn = null;
          st.innerHTML = GL.intro({ icon: def.icon, color: def.color, title: def.title, text: def.desc, button: 'Start drill', foot: 'Ten questions &middot; keys 1&ndash;4 work for most answers' });
          GL.$('[data-act="start"]', st).onclick = () => { n = 0; correct = 0; times = []; next(); };
        }

        function next() {
          if (n >= ROUNDS) return finish();
          q = def.gen(n);
          locked = false;
          const opts = q.input
            ? '<form class="dr-form" autocomplete="off"><input class="mm-input" id="dr-in" aria-label="Answer" placeholder="' + (q.placeholder || 'Type your answer') + '"><button class="btn primary">Enter</button></form>'
            : '<div class="dr-opts ' + (q.layout || '') + '" style="--cols:' + (q.cols || (q.options.length === 2 || q.options.length === 4 ? 2 : q.options.length === 3 ? 3 : 2)) + '">' +
              q.options.map((o, i) => '<button data-o="' + i + '">' + (q.html ? o : esc(o)) + '</button>').join('') + '</div>';
          st.innerHTML = '<div class="span-head"><span>' + (n + 1) + ' / ' + ROUNDS + '</span><span class="muted">' + correct + ' correct</span></div>' +
            '<div class="nb-bar"><div style="width:' + (n / ROUNDS) * 100 + '%"></div></div>' +
            '<div class="dr-prompt">' + q.prompt + '</div>' +
            (q.visual ? '<div class="dr-visual">' + q.visual + '</div>' : '') + opts +
            '<div class="dr-fb" id="dr-fb"></div>';
          shownAt = performance.now();
          if (q.hideAfter) scope.timeout(() => { const v = GL.$('.dr-visual', st); if (v && !locked) v.innerHTML = '<div class="dr-hidden">?</div>'; }, q.hideAfter);
          if (q.input) {
            const inp = GL.$('#dr-in', st);
            inp.focus();
            GL.$('.dr-form', st).onsubmit = (e) => {
              e.preventDefault();
              if (locked) return;
              const v = inp.value.trim().toUpperCase();
              answer(v === String(q.answer).toUpperCase(), q.answer);
            };
            keyFn = null;
          } else {
            GL.$('.dr-opts', st).onclick = (e) => { const b = e.target.closest('button'); if (b && !locked) choose(+b.dataset.o); };
            keyFn = q.options.length > 6 ? null : (e) => {
              if (/^[1-9]$/.test(e.key) && +e.key <= q.options.length) choose(+e.key - 1);
            };
          }
        }

        function choose(i) {
          const btns = GL.$$('.dr-opts button', st);
          btns[i].classList.add(i === q.answer ? 'good' : 'bad');
          if (i !== q.answer) btns[q.answer].classList.add('good');
          answer(i === q.answer, q.html ? null : q.options[q.answer]);
        }

        function answer(ok, shown) {
          locked = true;
          keyFn = null;
          times.push((performance.now() - shownAt) / 1000);
          if (ok) correct++;
          const v = GL.$('.dr-visual', st);
          if (v && q.hideAfter && q.visual) v.innerHTML = q.visual;
          GL.$('#dr-fb', st).innerHTML = ok
            ? '<span class="good">' + GL.icon('check') + 'Correct</span>'
            : '<span class="bad">' + GL.icon('x') + (shown !== null && shown !== undefined ? 'Answer: <b>' + esc(shown) + '</b>' : 'Not quite') + '</span>' + (q.why ? '<span class="muted small">' + q.why + '</span>' : '');
          n++;
          scope.timeout(next, ok ? 550 : 1700);
        }

        function finish() {
          keyFn = null;
          const acc = correct / ROUNDS;
          const avg = GL.avg(times);
          const rec = GL.record(def.id, { acc, avg, correct });
          st.innerHTML = GL.resultHtml({
            rec, big: correct, unit: '/ ' + ROUNDS, sub: def.title + ' &middot; ' + avg.toFixed(1) + 's per question',
            rows: [['Accuracy', Math.round(acc * 100) + '%'], ['Avg time', avg.toFixed(1) + 's'], ['Target pace', def.target + 's']],
          });
          GL.$('[data-act="again"]', st).onclick = () => { n = 0; correct = 0; times = []; next(); };
          ui.refresh();
        }

        scope.on(document, 'keydown', (e) => { if (keyFn && !locked && e.target.tagName !== 'INPUT') keyFn(e); });
        intro();
      },
    });
  }

  // =====================================================================
  // LOGIC LAB
  // =====================================================================

  const LOGIC = { section: 'logic', domains: ['reasoning'], color: '#c9b99a' };
  const lg = (o) => drill(Object.assign({}, LOGIC, o));

  lg({
    id: 'seq', title: 'Number Sequences', icon: 'hash', tone: 'stone', target: 8,
    desc: 'Spot the rule and find the next number.',
    how: 'Each row of numbers follows a hidden rule: steps, multiplication, alternation, squares or running sums. Pick the next term.',
    gen() {
      const t = R(0, 5);
      let s = [];
      let why;
      if (t === 0) { const a = R(2, 40), d = R(3, 13); s = [0, 1, 2, 3, 4, 5].map((i) => a + i * d); why = 'Add ' + d + ' each time.'; }
      else if (t === 1) { const a = R(1, 4), r = P([2, 3]); s = [0, 1, 2, 3, 4, 5].map((i) => a * r ** i); why = 'Multiply by ' + r + '.'; }
      else if (t === 2) { const a = R(5, 30), x = R(4, 9), y = R(1, 3); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? x : -y)); why = 'Alternate +' + x + ' and &minus;' + y + '.'; }
      else if (t === 3) { const b = R(1, 5), k = R(-1, 4); s = [0, 1, 2, 3, 4, 5].map((i) => (b + i) ** 2 + k); why = 'Squares ' + (k ? (k > 0 ? 'plus ' + k : 'minus ' + -k) : '') + '.'; }
      else if (t === 4) { s = [R(1, 5), R(2, 7)]; for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); why = 'Each term is the sum of the two before it.'; }
      else { const a = R(1, 20), d = R(1, 4), g = R(1, 3); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d + (i - 1) * g); why = 'The gap grows by ' + g + ' each step.'; }
      const ans = s.pop();
      return mcq(ans, nearNums(ans, [ans + 10, ans - 10, s[4] * 2]), { prompt: '<span class="seq">' + s.join(', ') + ', <b>?</b></span>', why });
    },
  });

  const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  lg({
    id: 'oddnum', title: 'Odd Number Out', icon: 'target', tone: 'olive', target: 7,
    desc: 'Four numbers share a property. Find the one that doesn\'t.',
    how: 'Look for what four of the numbers have in common: even, prime, a perfect square or multiples of the same number.',
    gen() {
      const t = R(0, 3);
      let group, odd, why;
      if (t === 0) { group = SH([...Array(40).keys()].map((i) => i * 2 + 12)).slice(0, 4); odd = R(6, 45) * 2 + 1; why = 'The others are even.'; }
      else if (t === 1) { group = SH(PRIMES).slice(0, 4); odd = P([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91]); why = 'The others are prime.'; }
      else if (t === 2) { group = SH([16, 25, 36, 49, 64, 81, 100, 121, 144, 169]).slice(0, 4); odd = P([18, 24, 35, 48, 63, 80, 99, 120, 143]); why = 'The others are perfect squares.'; }
      else { const k = R(6, 9); group = SH([...Array(12).keys()].map((i) => k * (i + 3))).slice(0, 4); do { odd = R(k * 3, k * 14); } while (odd % k === 0); why = 'The others are multiples of ' + k + '.'; }
      const options = SH(group.concat(odd).map(String));
      return { prompt: 'Which number doesn\'t belong?', options, answer: options.indexOf(String(odd)), why, cols: 5 };
    },
  });

  const SYM = ['<b class="sym s1">&#9650;</b>', '<b class="sym s2">&#9679;</b>', '<b class="sym s3">&#9632;</b>'];
  lg({
    id: 'balance', title: 'Balance Scales', icon: 'layers', tone: 'clay', target: 12,
    desc: 'Chain weight equivalences in your head.',
    how: 'Use the two facts to convert between shapes. Multiply through the chain.',
    gen() {
      const a = R(2, 4), b = R(2, 4), n = R(2, 5);
      const ans = n * a * b;
      return mcq(ans, [n * a, n * b, a * b, ans + a, ans - b, n + a + b], {
        prompt: '1 ' + SYM[0] + ' = ' + a + ' ' + SYM[1] + '<br>1 ' + SYM[1] + ' = ' + b + ' ' + SYM[2] + '<br><span class="muted">How many</span> ' + SYM[2] + ' <span class="muted">balance</span> ' + n + ' ' + SYM[0] + '?',
        why: n + ' &times; ' + a + ' &times; ' + b + ' = ' + ans + '.',
      });
    },
  });

  const NONSENSE = ['bloops', 'razzies', 'lazzies', 'florps', 'quibs', 'zents', 'morks', 'trills', 'vexes', 'drabs', 'glims', 'snarps'];
  const SYLL = [
    ['All A are B.', 'All B are C.', 'All A are C.', 'True'],
    ['All A are B.', 'Some B are C.', 'Some A are C.', 'Can\'t tell'],
    ['No A are B.', 'All C are A.', 'No C are B.', 'True'],
    ['All A are B.', 'No B are C.', 'Some A are C.', 'False'],
    ['Some A are B.', 'All B are C.', 'Some A are C.', 'True'],
    ['All A are B.', '', 'All B are A.', 'Can\'t tell'],
    ['No A are B.', '', 'Some B are A.', 'False'],
    ['All A are B.', 'All C are B.', 'All A are C.', 'Can\'t tell'],
    ['All A are B.', 'Some C are A.', 'Some C are B.', 'True'],
    ['Some A are not B.', '', 'All A are B.', 'False'],
    ['No A are B.', 'Some C are A.', 'Some C are not B.', 'True'],
    ['Some A are B.', 'Some B are C.', 'Some A are C.', 'Can\'t tell'],
  ];
  lg({
    id: 'syllogism', title: 'Syllogisms', icon: 'brain', tone: 'slate', target: 10,
    desc: 'Does the conclusion follow? True, false or can\'t tell.',
    how: 'Assume the statements are true, even with made-up words. Decide whether the conclusion must be true, must be false, or cannot be determined.',
    gen() {
      const [A, B, C] = SH(NONSENSE);
      const t = P(SYLL);
      const sub = (s) => s.replace(/\bA\b/g, '<i>' + A + '</i>').replace(/\bB\b/g, '<i>' + B + '</i>').replace(/\bC\b/g, '<i>' + C + '</i>');
      return mcq(t[3], [], {
        prompt: '<div class="premises">' + sub(t[0]) + (t[1] ? '<br>' + sub(t[1]) : '') + '</div><div class="concl">Therefore: ' + sub(t[2]) + '</div>',
      }, ['True', 'False', 'Can\'t tell']);
    },
  });

  function quantity() {
    const t = R(0, 2);
    if (t === 0) { const p = P([10, 20, 25, 30, 40, 50, 60, 75, 80]); const x = R(2, 12) * 20; return { text: p + '% of ' + x, val: (p * x) / 100 }; }
    if (t === 1) { const d = P([2, 3, 4, 5, 6, 8]); const nn = R(1, d - 1); const x = d * R(3, 15); return { text: nn + '/' + d + ' of ' + x, val: (nn * x) / d }; }
    const a = R(4, 19), b = R(3, 12); return { text: a + ' &times; ' + b, val: a * b };
  }
  lg({
    id: 'compare', title: 'Quantity Compare', icon: 'chart', tone: 'ash', target: 8,
    desc: 'Which is bigger: A, B, or are they equal?',
    how: 'Work out both quantities and compare. Fractions, percentages and products are mixed together.',
    gen() {
      let A = quantity();
      let B = quantity();
      if (Math.random() < 0.25) { const f = eqForm(B.val); if (f) A = { text: f, val: B.val }; }
      while (A.text === B.text) B = quantity();
      const ans = A.val > B.val ? 'A' : A.val < B.val ? 'B' : 'Equal';
      return mcq(ans, [], { prompt: '<div class="cmp"><div><span>A</span>' + A.text + '</div><div><span>B</span>' + B.text + '</div></div>', why: 'A = ' + A.val + ', B = ' + B.val + '.' }, ['A', 'B', 'Equal']);
    },
  });
  function eqForm(v) {
    if (v % 2 === 0 && v >= 20) return '50% of ' + v * 2;
    if (v % 4 === 0) return '25% of ' + v * 4;
    return null;
  }

  function fmtClock(mins) {
    mins = ((mins % 720) + 720) % 720;
    const h = Math.floor(mins / 60) || 12;
    return h + ':' + String(mins % 60).padStart(2, '0');
  }
  lg({
    id: 'clockmath', title: 'Time Arithmetic', icon: 'clock', tone: 'taupe', target: 10,
    desc: 'Add and subtract time on a 12-hour clock.',
    how: 'Add the duration to the start time. Watch for carrying past 60 minutes and past 12 o\'clock.',
    gen() {
      const start = R(1, 12) * 60 + R(0, 11) * 5;
      const add = R(1, 5) * 60 + R(1, 11) * 5;
      const sub = Math.random() < 0.3;
      const res = sub ? start - add : start + add;
      const ans = fmtClock(res);
      return mcq(ans, [fmtClock(res + 10), fmtClock(res - 10), fmtClock(res + 60), fmtClock(res - 60), fmtClock(res + 40)], {
        prompt: 'It is <b>' + fmtClock(start) + '</b>. What time was it ' + (sub ? '' : 'going to be ') + '<b>' + Math.floor(add / 60) + ' h ' + (add % 60) + ' min</b> ' + (sub ? 'earlier' : 'later') + '?',
      });
    },
  });

  const CODEWORDS = ['CAT', 'DOG', 'SUN', 'MAP', 'BIRD', 'FISH', 'LAMP', 'TREE', 'GOLD', 'MILK', 'ROSE', 'KING', 'BOOK', 'WIND', 'FROG', 'STAR', 'MOON', 'LION'];
  const shift = (w, k) => w.split('').map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65)).join('');
  const nums = (w) => w.split('').map((c) => c.charCodeAt(0) - 64).join('-');
  lg({
    id: 'codes', title: 'Code Breaker', icon: 'key', tone: 'rust', target: 12,
    desc: 'Crack the letter code and apply it to a new word.',
    how: 'Codes either shift every letter along the alphabet or replace letters with their position (A = 1).',
    gen() {
      const [w1, w2] = SH(CODEWORDS);
      if (Math.random() < 0.5) {
        const k = P([1, 2, 3, -1]);
        const ans = shift(w2, k);
        return mcq(ans, [shift(w2, k + 1), shift(w2, -k), shift(w2, k - 1), w2.slice(0, 1) + ans.slice(1)], { prompt: 'If <b>' + w1 + '</b> is coded as <b>' + shift(w1, k) + '</b>, how is <b>' + w2 + '</b> coded?', why: 'Each letter moves ' + Math.abs(k) + (k > 0 ? ' forward.' : ' back.') });
      }
      const ans = nums(w2);
      const alt = w2.split('').map((c) => c.charCodeAt(0) - 64);
      return mcq(ans, [alt.map((v, i) => (i === 0 ? v + 1 : v)).join('-'), alt.slice().reverse().join('-'), alt.map((v, i) => (i === alt.length - 1 ? v - 1 : v)).join('-'), alt.map((v) => 27 - v).join('-')], { prompt: 'If <b>' + w1 + '</b> = ' + nums(w1) + ', what is <b>' + w2 + '</b>?', why: 'Each letter becomes its position in the alphabet.' });
    },
  });

  lg({
    id: 'numgrid', title: 'Number Grids', icon: 'grid', tone: 'moss', target: 12,
    desc: 'Every row follows the same rule. Fill the gap.',
    how: 'Work out how the third number in each row comes from the first two (add, subtract, multiply), then solve for the missing cell.',
    gen() {
      const op = P(['+', '-', '×']);
      const rows = [0, 1, 2].map(() => {
        const a = op === '×' ? R(2, 9) : R(6, 30);
        const b = op === '×' ? R(2, 9) : op === '-' ? R(1, a - 1) : R(2, 25);
        return [a, b, op === '+' ? a + b : op === '-' ? a - b : a * b];
      });
      const hr = R(0, 2), hc = R(0, 2);
      const ans = rows[hr][hc];
      const grid = '<table class="numgrid">' + rows.map((r, ri) => '<tr>' + r.map((v, ci) => '<td class="' + (ri === hr && ci === hc ? 'gap' : '') + '">' + (ri === hr && ci === hc ? '?' : v) + '</td>').join('') + '</tr>').join('') + '</table>';
      return mcq(ans, nearNums(ans, [ans + 5, ans - 5, ans * 2]), { prompt: 'Find the missing number', visual: grid, why: 'Each row: first ' + op + ' second = third.' });
    },
  });

  lg({
    id: 'binary', title: 'Binary Translator', icon: 'calc', tone: 'slate', target: 10,
    desc: 'Convert between binary and decimal.',
    how: 'Binary place values from the right are 1, 2, 4, 8, 16, 32. Add up the places that hold a 1.',
    gen() {
      const v = R(5, 63);
      const b = v.toString(2);
      if (Math.random() < 0.5) return mcq(v, nearNums(v, [v + 8, v - 8, v + 16]), { prompt: 'What is <b class="mono">' + b + '</b> in decimal?' });
      return mcq(b, [v + 1, v - 1, v + 2, v ^ 4, v ^ 8].filter((x) => x > 0).map((x) => x.toString(2)), { prompt: 'What is <b>' + v + '</b> in binary?' });
    },
  });

  const NAMES = ['Ava', 'Ben', 'Cal', 'Dia', 'Eli', 'Fay', 'Gus', 'Ivy'];
  lg({
    id: 'ordering', title: 'Order Deduction', icon: 'flag', tone: 'clay', target: 14,
    desc: 'Use the clues to rank four people.',
    how: 'Build the order from the clues, oldest to youngest, then answer the question. Clues are shuffled.',
    gen() {
      const order = SH(NAMES).slice(0, 4);
      const clues = SH([0, 1, 2].map((i) => (Math.random() < 0.5 ? order[i] + ' is older than ' + order[i + 1] : order[i + 1] + ' is younger than ' + order[i])));
      const pos = R(0, 3);
      const label = ['the oldest', 'second oldest', 'third oldest', 'the youngest'][pos];
      const options = SH(order.slice());
      return { prompt: '<div class="premises">' + clues.join('.<br>') + '.</div>Who is <b>' + label + '</b>?', options, answer: options.indexOf(order[pos]), why: 'Order: ' + order.join(' > ') + '.' };
    },
  });

  // =====================================================================
  // WORD LAB
  // =====================================================================

  const WORD = { section: 'word', domains: ['verbal'], color: '#9cc08a' };
  const wd = (o) => drill(Object.assign({}, WORD, o));

  const SYN = [['Rapid', 'Swift'], ['Candid', 'Frank'], ['Benevolent', 'Kind'], ['Diligent', 'Hardworking'], ['Obscure', 'Unclear'], ['Meticulous', 'Careful'], ['Vivid', 'Bright'], ['Tranquil', 'Calm'], ['Abundant', 'Plentiful'], ['Reluctant', 'Unwilling'], ['Ponder', 'Consider'], ['Fragile', 'Delicate'], ['Resilient', 'Tough'], ['Ambiguous', 'Vague'], ['Eloquent', 'Articulate'], ['Hostile', 'Unfriendly'], ['Lucid', 'Clear'], ['Frugal', 'Thrifty'], ['Mimic', 'Imitate'], ['Vast', 'Huge'], ['Prudent', 'Wise'], ['Scarce', 'Rare'], ['Tedious', 'Boring'], ['Gregarious', 'Sociable'], ['Pragmatic', 'Practical'], ['Zealous', 'Eager'], ['Ominous', 'Threatening'], ['Serene', 'Peaceful'], ['Adept', 'Skilled'], ['Feeble', 'Weak']];
  wd({
    id: 'synonyms', title: 'Synonyms', icon: 'book', tone: 'moss', target: 5,
    desc: 'Pick the word closest in meaning.',
    how: 'Choose the option that means most nearly the same as the word shown.',
    gen() {
      const [w, s] = P(SYN);
      return mcq(s, SYN.filter((p) => p[1] !== s).map((p) => p[1]), { prompt: 'Closest in meaning to <b class="word">' + w + '</b>' });
    },
  });

  const ANT = [['Ancient', 'Modern'], ['Generous', 'Stingy'], ['Expand', 'Contract'], ['Brave', 'Cowardly'], ['Rigid', 'Flexible'], ['Victory', 'Defeat'], ['Humble', 'Arrogant'], ['Accept', 'Reject'], ['Transparent', 'Opaque'], ['Optimist', 'Pessimist'], ['Praise', 'Criticise'], ['Temporary', 'Permanent'], ['Shallow', 'Deep'], ['Include', 'Exclude'], ['Vague', 'Precise'], ['Ascend', 'Descend'], ['Hasty', 'Deliberate'], ['Artificial', 'Natural'], ['Frequent', 'Rare'], ['Maximum', 'Minimum'], ['Innocent', 'Guilty'], ['Import', 'Export'], ['Hollow', 'Solid'], ['Fertile', 'Barren'], ['Scarce', 'Plentiful']];
  wd({
    id: 'antonyms', title: 'Antonyms', icon: 'shuffle', tone: 'clay', target: 5,
    desc: 'Pick the word that means the opposite.',
    how: 'Choose the option most nearly opposite in meaning to the word shown.',
    gen() {
      const [w, a] = P(ANT);
      return mcq(a, ANT.filter((p) => p[1] !== a).map((p) => p[1]), { prompt: 'Opposite of <b class="word">' + w + '</b>' });
    },
  });

  const ANAGRAMS = ['PLANET', 'BRAIN', 'PUZZLE', 'PENCIL', 'MARKET', 'WINTER', 'BRIDGE', 'GUITAR', 'ISLAND', 'JUNGLE', 'MIRROR', 'ROCKET', 'TURTLE', 'VALLEY', 'WIZARD', 'YELLOW', 'MEMORY', 'GENIUS', 'LOGIC', 'THINK', 'FOCUS', 'SPEED', 'CLOUD', 'GARLIC', 'PICNIC', 'CACTUS', 'KITTEN', 'MUSEUM', 'OXYGEN', 'SPIRAL'];
  wd({
    id: 'anagram', title: 'Anagram Solver', icon: 'puzzle', tone: 'olive', target: 12,
    desc: 'Unscramble the letters into a word.',
    how: 'Type the word hidden in the scrambled letters and press Enter. Leave it blank and press Enter to skip.',
    gen() {
      const w = P(ANAGRAMS);
      let s;
      do { s = SH(w.split('')).join(''); } while (s === w);
      return { input: true, answer: w, prompt: '<div class="letters">' + s.split('').map((c) => '<i>' + c + '</i>').join('') + '</div><span class="muted small">' + w.length + ' letters</span>' };
    },
  });

  const ANALOG = [['Bird', 'Nest', 'Bee', 'Hive'], ['Finger', 'Hand', 'Toe', 'Foot'], ['Painter', 'Brush', 'Writer', 'Pen'], ['Puppy', 'Dog', 'Kitten', 'Cat'], ['Doctor', 'Hospital', 'Teacher', 'School'], ['Glove', 'Hand', 'Sock', 'Foot'], ['Author', 'Novel', 'Composer', 'Symphony'], ['Eye', 'See', 'Ear', 'Hear'], ['Pilot', 'Plane', 'Captain', 'Ship'], ['Seed', 'Tree', 'Egg', 'Bird'], ['Thermometer', 'Temperature', 'Clock', 'Time'], ['Wool', 'Sheep', 'Honey', 'Bee'], ['Chapter', 'Book', 'Scene', 'Play'], ['Hunger', 'Food', 'Thirst', 'Water'], ['Page', 'Book', 'Brick', 'Wall'], ['Lion', 'Pride', 'Wolf', 'Pack'], ['Carpenter', 'Wood', 'Sculptor', 'Stone'], ['Kilometre', 'Distance', 'Kilogram', 'Mass'], ['Cub', 'Bear', 'Calf', 'Cow'], ['Library', 'Books', 'Orchard', 'Trees'], ['Caterpillar', 'Butterfly', 'Tadpole', 'Frog']];
  wd({
    id: 'analogies', title: 'Analogies', icon: 'layers', tone: 'stone', target: 8,
    desc: 'A is to B as C is to …?',
    how: 'Work out the relationship between the first pair, then find the word that has the same relationship with the third.',
    gen() {
      const [a, b, c, d] = P(ANALOG);
      return mcq(d, ANALOG.filter((x) => x[3] !== d).map((x) => x[3]), { prompt: '<b>' + a + '</b> is to <b>' + b + '</b> as <b>' + c + '</b> is to &hellip;' });
    },
  });

  const SPELL = [['Accommodate', 'Acommodate', 'Accomodate', 'Acomodate'], ['Necessary', 'Neccessary', 'Necessery', 'Neccesary'], ['Definitely', 'Definately', 'Definitly', 'Defanitely'], ['Separate', 'Seperate', 'Separete', 'Seperete'], ['Rhythm', 'Rythm', 'Rhythem', 'Rythym'], ['Conscience', 'Concience', 'Conscence', 'Consciense'], ['Embarrass', 'Embarass', 'Embarras', 'Emberrass'], ['Millennium', 'Millenium', 'Milennium', 'Millenniem'], ['Occurrence', 'Occurence', 'Ocurrence', 'Occurrance'], ['Privilege', 'Priviledge', 'Privelege', 'Privilige'], ['Receive', 'Recieve', 'Receve', 'Resieve'], ['Recommend', 'Reccomend', 'Recomend', 'Reccommend'], ['Maintenance', 'Maintainance', 'Maintenence', 'Maintanance'], ['Guarantee', 'Garantee', 'Guarentee', 'Guarrantee'], ['Harass', 'Harrass', 'Haras', 'Harrase'], ['Liaison', 'Liason', 'Liasion', 'Leaison'], ['Mischievous', 'Mischievious', 'Mischevous', 'Mischievos'], ['Questionnaire', 'Questionaire', 'Questionnair', 'Qestionnaire'], ['Weird', 'Wierd', 'Weerd', 'Wiered'], ['Calendar', 'Calender', 'Calandar', 'Callendar']];
  wd({
    id: 'spelling', title: 'Spelling Spotter', icon: 'eye', tone: 'slate', target: 6,
    desc: 'Only one is spelled correctly. Which?',
    how: 'These are the most commonly misspelled words in English. Spot the correct spelling.',
    gen() {
      const s = P(SPELL);
      return mcq(s[0], s.slice(1), { prompt: 'Which spelling is correct?' });
    },
  });

  const LONG = ['ELEPHANT', 'BICYCLE', 'CHOCOLATE', 'DINOSAUR', 'UMBRELLA', 'HOSPITAL', 'KANGAROO', 'MOUNTAIN', 'TELESCOPE', 'VOLCANO', 'LANGUAGE', 'ALPHABET', 'CALENDAR', 'ORCHESTRA', 'SANDWICH', 'TREASURE', 'MAGAZINE', 'PINEAPPLE', 'SCIENTIST', 'BUTTERFLY', 'CROCODILE', 'HARMONICA', 'LIBRARY', 'PENGUIN'];
  wd({
    id: 'missing', title: 'Missing Letter', icon: 'hash', tone: 'taupe', target: 5,
    desc: 'Fill the gap to complete the word.',
    how: 'One letter is missing from the word. Choose the letter that completes it.',
    gen() {
      const w = P(LONG);
      const i = R(1, w.length - 2);
      const letter = w[i];
      const others = SH('ABCDEFGHIJKLMNOPRSTUVWY'.split('').filter((c) => c !== letter));
      return mcq(letter, others, { prompt: '<div class="letters">' + w.split('').map((c, j) => '<i class="' + (j === i ? 'gap' : '') + '">' + (j === i ? '?' : c) + '</i>').join('') + '</div>', cols: 4 });
    },
  });

  const CATS = {
    fruits: ['Apple', 'Mango', 'Cherry', 'Banana', 'Grape', 'Peach', 'Plum', 'Kiwi'],
    tools: ['Hammer', 'Wrench', 'Chisel', 'Pliers', 'Saw', 'Drill', 'Screwdriver'],
    instruments: ['Violin', 'Trumpet', 'Piano', 'Drum', 'Oboe', 'Guitar', 'Cello'],
    metals: ['Iron', 'Copper', 'Silver', 'Zinc', 'Nickel', 'Tin', 'Aluminium'],
    trees: ['Oak', 'Maple', 'Birch', 'Willow', 'Cedar', 'Pine', 'Elm'],
    birds: ['Sparrow', 'Eagle', 'Robin', 'Heron', 'Falcon', 'Owl', 'Parrot'],
    emotions: ['Joy', 'Anger', 'Fear', 'Envy', 'Pride', 'Grief', 'Hope'],
    countries: ['Peru', 'Kenya', 'Norway', 'Japan', 'Chile', 'Egypt', 'Canada'],
    planets: ['Mars', 'Venus', 'Saturn', 'Neptune', 'Jupiter', 'Uranus'],
  };
  wd({
    id: 'category', title: 'Category Sort', icon: 'grid', tone: 'rust', target: 5,
    desc: 'Four words share a category. Find the outsider.',
    how: 'Identify the category most of the words belong to, then pick the one that doesn\'t fit.',
    gen() {
      const [c1, c2] = SH(Object.keys(CATS));
      const group = SH(CATS[c1]).slice(0, 4);
      const odd = P(CATS[c2]);
      const options = SH(group.concat(odd));
      return { prompt: 'Which word doesn\'t belong?', options, answer: options.indexOf(odd), why: 'The others are ' + c1 + '.', cols: 5 };
    },
  });

  const DEFS = [['Ubiquitous', 'Found everywhere'], ['Ephemeral', 'Lasting a very short time'], ['Candor', 'Openness and honesty'], ['Cacophony', 'A harsh mix of sounds'], ['Empathy', 'Understanding others\' feelings'], ['Frugal', 'Careful with money'], ['Gregarious', 'Fond of company'], ['Hypothesis', 'A proposed explanation to test'], ['Inevitable', 'Certain to happen'], ['Juxtapose', 'Place side by side for contrast'], ['Lethargic', 'Sluggish and lacking energy'], ['Meticulous', 'Showing great attention to detail'], ['Nostalgia', 'Sentimental longing for the past'], ['Obsolete', 'No longer in use'], ['Paradox', 'A seemingly contradictory truth'], ['Quintessential', 'The purest example of something'], ['Resilient', 'Able to recover quickly'], ['Skeptical', 'Not easily convinced'], ['Tenacious', 'Persistent; holding firmly'], ['Verbose', 'Using more words than needed'], ['Whimsical', 'Playfully fanciful'], ['Zenith', 'The highest point'], ['Altruism', 'Selfless concern for others'], ['Pragmatic', 'Dealing with things practically'], ['Serendipity', 'A happy accident']];
  wd({
    id: 'vocab', title: 'Vocabulary Builder', icon: 'star', tone: 'ash', target: 7,
    desc: 'Match advanced words to their meanings.',
    how: 'Pick the definition that best matches the word. A rich vocabulary is one of the strongest predictors of verbal IQ.',
    gen() {
      const [w, d] = P(DEFS);
      return mcq(d, DEFS.filter((x) => x[1] !== d).map((x) => x[1]), { prompt: 'What does <b class="word">' + w + '</b> mean?', cols: 1 });
    },
  });

  const COMPOUND = [['FIRE', 'WORK', 'HOUSE'], ['SUN', 'FLOWER', 'POT'], ['FOOT', 'BALL', 'ROOM'], ['RAIN', 'BOW', 'TIE'], ['BOOK', 'CASE', 'WORK'], ['WATER', 'FALL', 'OUT'], ['HEAD', 'LINE', 'UP'], ['KEY', 'BOARD', 'ROOM'], ['SNOW', 'MAN', 'HOLE'], ['TOOTH', 'BRUSH', 'FIRE'], ['BACK', 'PACK', 'AGE'], ['MOON', 'LIGHT', 'HOUSE'], ['SEA', 'SIDE', 'WALK'], ['TIME', 'TABLE', 'CLOTH'], ['STAR', 'FISH', 'BOWL'], ['DOOR', 'BELL', 'HOP'], ['AIR', 'PORT', 'HOLE'], ['PAN', 'CAKE', 'WALK'], ['HAND', 'SHAKE', 'DOWN'], ['EAR', 'RING', 'SIDE']];
  wd({
    id: 'compound', title: 'Word Bridges', icon: 'spark', tone: 'moss', target: 10,
    desc: 'Find the word that joins two others.',
    how: 'The missing word finishes the first word and starts the second, making two compound words (FIRE + WORK, WORK + HOUSE).',
    gen() {
      const [a, m, b] = P(COMPOUND);
      return mcq(m, COMPOUND.filter((x) => x[1] !== m).map((x) => x[1]), { prompt: '<div class="bridge"><b>' + a + '</b><span>____</span><b>' + b + '</b></div>', why: a + m + ' and ' + m + b + '.' });
    },
  });

  const USAGE = [['The students left ___ books on the bus.', 'their', 'there', 'they\'re'], ['The cat licked ___ paw.', 'its', 'it\'s', 'its\''], ['Lack of sleep can ___ your memory.', 'affect', 'effect', 'effects'], ['She is taller ___ her brother.', 'than', 'then', 'that'], ['There were ___ people than expected.', 'fewer', 'less', 'lesser'], ['Don\'t ___ your keys again.', 'lose', 'loose', 'loss'], ['___ coat is this?', 'Whose', 'Who\'s', 'Whom'], ['___ going to love this puzzle.', 'You\'re', 'Your', 'Yore'], ['She paid him a ___ on his work.', 'compliment', 'complement', 'complimint'], ['Honesty is a core ___.', 'principle', 'principal', 'principel'], ['The car was ___ at the lights.', 'stationary', 'stationery', 'stationairy'], ['Everyone came ___ Tom.', 'except', 'accept', 'expect'], ['Can you ___ me on this?', 'advise', 'advice', 'advize'], ['I need to ___ down for a nap.', 'lie', 'lay', 'laid'], ['To ___ should I address the letter?', 'whom', 'who', 'whose'], ['From her smile, I ___ she was pleased.', 'inferred', 'implied', 'inferrred'], ['The joke failed to ___ a laugh.', 'elicit', 'illicit', 'elecit'], ['Please be ___ about the surprise.', 'discreet', 'discrete', 'discrate']];
  wd({
    id: 'usage', title: 'Word Usage', icon: 'check', tone: 'olive', target: 6,
    desc: 'Pick the right word for the sentence.',
    how: 'Choose the word that correctly completes the sentence. These are the classic confusable pairs.',
    gen() {
      const u = P(USAGE);
      return mcq(u[1], u.slice(2), { prompt: esc(u[0]).replace('___', '<span class="blank">_____</span>'), cols: 3 });
    },
  });

  // =====================================================================
  // VISUAL LAB
  // =====================================================================

  const VIS = { section: 'visual', domains: ['perception'], color: '#8fb3d9' };
  const vs = (o) => drill(Object.assign({}, VIS, o));

  function scatter(n, w, h, r, seed) {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard++ < 3000) {
      const x = r + Math.random() * (w - 2 * r), y = r + Math.random() * (h - 2 * r);
      if (pts.every((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 > (2.6 * r) ** 2)) pts.push([x, y]);
    }
    return pts;
  }

  vs({
    id: 'dotcount', title: 'Flash Count', icon: 'spark', tone: 'slate', target: 4,
    desc: 'Dots flash for under a second. How many?',
    how: 'The dots vanish after 0.9 seconds. Count or estimate, then choose. This trains rapid enumeration.',
    gen(i) {
      const n = R(5, 9 + i);
      const pts = scatter(n, 240, 150, 8);
      return mcq(n, nearNums(n), { prompt: 'How many dots?', visual: '<svg viewBox="0 0 240 150" class="vis-svg">' + pts.map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="8" fill="var(--c-perception)"/>').join('') + '</svg>', hideAfter: 900 });
    },
  });

  vs({
    id: 'oddcolor', title: 'Colour Sense', icon: 'eye', tone: 'olive', target: 5,
    desc: 'One tile is a slightly different shade. Find it.',
    how: 'Tap the tile that differs. The difference shrinks as you go, testing fine colour discrimination.',
    gen(i) {
      const size = i < 4 ? 4 : 5;
      const hue = R(0, 359), sat = R(35, 60), light = R(42, 58);
      const delta = Math.max(4, 16 - i * 1.3) * P([1, -1]);
      const odd = R(0, size * size - 1);
      const options = Array.from({ length: size * size }, (_, k) => '<span class="swatch" style="background:hsl(' + hue + ',' + sat + '%,' + (k === odd ? light + delta : light) + '%)"></span>');
      return { prompt: 'Tap the odd shade', options, answer: odd, html: true, layout: 'tiles', cols: size };
    },
  });

  const GLYPHS = ['F', 'R', 'G', 'J', 'L', 'P', 'Q', '4', '7'];
  const glyph = (g, rot, flip, size) => '<svg viewBox="0 0 100 100" class="glyph" width="' + (size || 70) + '" height="' + (size || 70) + '"><g transform="translate(50 50) rotate(' + rot + ') scale(' + (flip ? -1 : 1) + ' 1)"><text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="70" font-weight="800" font-family="Inter, Arial, sans-serif" fill="currentColor">' + g + '</text></g></svg>';
  vs({
    id: 'rotation', title: 'Mental Rotation', icon: 'shuffle', tone: 'clay', target: 7,
    desc: 'Which one is the same shape, only rotated?',
    how: 'Three options are mirror images. One is the original, just turned. Rotate it in your mind rather than tilting your head!',
    gen() {
      const g = P(GLYPHS);
      const rots = SH([45, 90, 135, 180, 225, 270, 315]);
      const correct = glyph(g, rots[0], false);
      const options = SH([correct, glyph(g, rots[1], true), glyph(g, rots[2], true), glyph(g, rots[3], true)]);
      return { prompt: 'Same shape, only rotated:', visual: glyph(g, P([0, 30, -30]), false, 96), options, answer: options.indexOf(correct), html: true, cols: 4, layout: 'tiles glyphs' };
    },
  });

  function gridSvg(cells, n, cls) {
    const s = 100 / n;
    return '<svg viewBox="0 0 100 100" class="vis-svg ' + (cls || '') + '">' + cells.map((on, k) => '<rect x="' + ((k % n) * s + 1) + '" y="' + (Math.floor(k / n) * s + 1) + '" width="' + (s - 2) + '" height="' + (s - 2) + '" rx="2" fill="' + (on ? 'var(--c-perception)' : 'var(--mx-faint)') + '"/>').join('') + '</svg>';
  }

  vs({
    id: 'symmetry', title: 'Symmetry Check', icon: 'layers', tone: 'stone', target: 4,
    desc: 'Is the pattern perfectly mirror-symmetric?',
    how: 'Compare the left and right halves across the vertical centre line. One wrong cell breaks the symmetry.',
    gen() {
      const n = 6;
      const cells = [];
      for (let r = 0; r < n; r++) {
        const half = Array.from({ length: n / 2 }, () => Math.random() < 0.45);
        cells.push(...half, ...half.slice().reverse());
      }
      const sym = Math.random() < 0.5;
      if (!sym) { const k = R(0, n * n - 1); cells[k] = !cells[k]; }
      return mcq(sym ? 'Symmetric' : 'Not symmetric', [], { prompt: 'Mirror-symmetric left to right?', visual: gridSvg(cells, n, 'sym') }, ['Symmetric', 'Not symmetric']);
    },
  });

  vs({
    id: 'moredots', title: 'Quick Estimate', icon: 'chart', tone: 'taupe', target: 3,
    desc: 'Which side has more dots? No time to count.',
    how: 'The panels disappear after 1.2 seconds. Go with your gut. This trains your approximate number sense.',
    gen(i) {
      const a = R(10, 22);
      const b = a + P([1, 2, 3, -1, -2, -3].slice(0, i < 5 ? 6 : 4));
      const panel = (n) => '<svg viewBox="0 0 120 120" class="vis-svg half">' + scatter(n, 120, 120, 5).map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5" fill="var(--c-perception)"/>').join('') + '</svg>';
      return mcq(a > b ? 'Left' : 'Right', [], { prompt: 'Which side has more?', visual: '<div class="pair">' + panel(a) + panel(b) + '</div>', hideAfter: 1200, why: a + ' vs ' + b + '.' }, ['Left', 'Right']);
    },
  });

  function clockSvg(h, m) {
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    let s = '<svg viewBox="0 0 120 120" class="vis-svg clock"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="3"/>';
    for (let k = 0; k < 12; k++) { const a = (k * 30 * Math.PI) / 180; s += '<line x1="' + (60 + Math.sin(a) * 46) + '" y1="' + (60 - Math.cos(a) * 46) + '" x2="' + (60 + Math.sin(a) * 52) + '" y2="' + (60 - Math.cos(a) * 52) + '" stroke="currentColor" stroke-width="' + (k % 3 ? 1.5 : 3) + '"/>'; }
    s += '<line x1="60" y1="60" x2="' + (60 + Math.sin((ha * Math.PI) / 180) * 28) + '" y2="' + (60 - Math.cos((ha * Math.PI) / 180) * 28) + '" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>';
    s += '<line x1="60" y1="60" x2="' + (60 + Math.sin((ma * Math.PI) / 180) * 44) + '" y2="' + (60 - Math.cos((ma * Math.PI) / 180) * 44) + '" stroke="var(--c-perception)" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="3.5" fill="currentColor"/></svg>';
    return s;
  }
  vs({
    id: 'clockread', title: 'Clock Reader', icon: 'clock', tone: 'rust', target: 5,
    desc: 'Read the analogue clock at a glance.',
    how: 'The short hand shows the hour, the long coloured hand the minutes. No numbers on the dial!',
    gen() {
      const h = R(1, 12), m = R(0, 11) * 5;
      const t = h * 60 + m;
      const swap = (m / 5 || 12) * 60 + ((h % 12) * 5);
      return mcq(fmtClock(t), [fmtClock(t + 5), fmtClock(t - 5), fmtClock(t + 60), fmtClock(t - 60), fmtClock(swap)], { prompt: 'What time is it?', visual: clockSvg(h, m) });
    },
  });

  const PAIRS = [['O', 'Q'], ['E', 'F'], ['6', '9'], ['b', 'd'], ['M', 'N'], ['p', 'q'], ['8', '3'], ['C', 'G'], ['V', 'Y'], ['P', 'R'], ['5', 'S'], ['I', 'l']];
  vs({
    id: 'search', title: 'Visual Search', icon: 'target', tone: 'moss', target: 5,
    desc: 'Find the single odd character hiding in the grid.',
    how: 'Scan the grid and tap the one character that differs. Systematic scanning beats random searching.',
    gen(i) {
      const [t, d] = SH(P(PAIRS));
      const size = i < 5 ? 5 : 6;
      const at = R(0, size * size - 1);
      const options = Array.from({ length: size * size }, (_, k) => '<span class="ch">' + esc(k === at ? t : d) + '</span>');
      return { prompt: 'Find the <b class="mono">' + esc(t) + '</b>', options, answer: at, html: true, layout: 'tiles chars', cols: size };
    },
  });

  vs({
    id: 'fraction', title: 'Proportion Sense', icon: 'chart', tone: 'ash', target: 4,
    desc: 'Estimate how much of the shape is filled.',
    how: 'Judge the filled share of the bar or pie. Options are 10 or more percentage points apart.',
    gen() {
      const p = R(2, 18) * 5;
      let vis;
      if (Math.random() < 0.5) vis = '<svg viewBox="0 0 240 40" class="vis-svg bar"><rect x="2" y="2" width="236" height="36" rx="8" fill="var(--mx-faint)"/><rect x="2" y="2" width="' + (236 * p) / 100 + '" height="36" rx="8" fill="var(--c-perception)"/></svg>';
      else {
        const a = (p / 100) * 2 * Math.PI;
        const x = 60 + Math.sin(a) * 50, y = 60 - Math.cos(a) * 50;
        vis = '<svg viewBox="0 0 120 120" class="vis-svg"><circle cx="60" cy="60" r="50" fill="var(--mx-faint)"/><path d="M60 60 L60 10 A50 50 0 ' + (p > 50 ? 1 : 0) + ' 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Z" fill="var(--c-perception)"/></svg>';
      }
      const wr = [p - 10, p + 10, p - 20, p + 20, p - 15, p + 15].filter((v) => v > 0 && v < 100);
      return mcq(p + '%', wr.map((v) => v + '%'), { prompt: 'How much is filled?', visual: vis });
    },
  });

  vs({
    id: 'twin', title: 'Twin Finder', icon: 'grid', tone: 'clay', target: 7,
    desc: 'Find the exact copy of the pattern.',
    how: 'Three options differ from the target by a single cell. Tap the exact twin.',
    gen() {
      const n = 4;
      const base = Array.from({ length: n * n }, () => Math.random() < 0.45);
      const flips = SH([...Array(n * n).keys()]).slice(0, 3);
      const correct = gridSvg(base, n);
      const options = SH([correct].concat(flips.map((k) => gridSvg(base.map((v, j) => (j === k ? !v : v)), n))));
      return { prompt: 'Which one matches exactly?', visual: gridSvg(base, n, 'target'), options, answer: options.indexOf(correct), html: true, layout: 'tiles pats', cols: 4 };
    },
  });
})();
