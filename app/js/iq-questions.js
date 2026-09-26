/* IQ test item bank: procedurally drawn matrix-reasoning items plus
   number series, verbal and logic questions. Everything is seeded, so
   every test-taker sees identical items and option orders. */
(function () {
  'use strict';

  // ---------- matrix drawing ----------

  const POS = {
    1: [[50, 50]],
    2: [[29, 50], [71, 50]],
    3: [[50, 28], [28, 70], [72, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  };
  const RADIUS = { 1: 30, 2: 19, 3: 17, 4: 15.5, 5: 12.5 };

  // bits: 0 top, 1 bottom, 2 left, 3 right, 4 diag \, 5 diag /, 6 vertical mid, 7 horizontal mid
  const LINES = [[14, 14, 86, 14], [14, 86, 86, 86], [14, 14, 14, 86], [86, 14, 86, 86], [14, 14, 86, 86], [86, 14, 14, 86], [50, 14, 50, 86], [14, 50, 86, 50]];

  function poly(pts) { return '<polygon points="' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>'; }
  function ring(n, r, off = -Math.PI / 2) { return Array.from({ length: n }, (_, i) => [Math.cos(off + (i * 2 * Math.PI) / n) * r, Math.sin(off + (i * 2 * Math.PI) / n) * r]); }

  function shapeSvg(shape, r) {
    switch (shape) {
      case 'circle': return '<circle r="' + r + '"/>';
      case 'square': return '<rect x="' + -r * 0.82 + '" y="' + -r * 0.82 + '" width="' + r * 1.64 + '" height="' + r * 1.64 + '" rx="' + r * 0.12 + '"/>';
      case 'triangle': return poly(ring(3, r * 1.08).map(([x, y]) => [x, y + r * 0.14]));
      case 'diamond': return poly(ring(4, r * 1.05));
      case 'hexagon': return poly(ring(6, r, 0));
      case 'star': return poly(ring(10, 1).map(([x, y], i) => [x * (i % 2 ? r * 0.45 : r * 1.08), y * (i % 2 ? r * 0.45 : r * 1.08)]));
      case 'arrow': return poly([[0, -r], [r * 0.72, -r * 0.08], [r * 0.28, -r * 0.08], [r * 0.28, r], [-r * 0.28, r], [-r * 0.28, -r * 0.08], [-r * 0.72, -r * 0.08]]);
      default: return '';
    }
  }

  GL.mxCell = function (c) {
    let s = '<svg viewBox="0 0 100 100" class="mx-svg" aria-hidden="true">';
    if (c.lines !== undefined) {
      s += '<rect x="14" y="14" width="72" height="72" fill="none" stroke="var(--mx-faint)" stroke-width="1.5" stroke-dasharray="3 4"/>';
      LINES.forEach((l, i) => {
        if ((c.lines >> i) & 1) s += '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>';
      });
    } else {
      const n = c.count || 1;
      const r = RADIUS[n] * (c.size || 1);
      const fill = c.fill === 'solid' ? 'currentColor' : c.fill === 'gray' ? 'var(--mx-gray)' : 'none';
      s += '<g fill="' + fill + '" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round">';
      POS[n].forEach(([x, y]) => { s += '<g transform="translate(' + x + ' ' + y + ') rotate(' + (c.rot || 0) + ')">' + shapeSvg(c.shape, r) + '</g>'; });
      s += '</g>';
    }
    return s + '</svg>';
  };

  // ---------- matrix item builder ----------

  const key = (c) => (c.lines !== undefined ? 'L' + c.lines : [c.shape, c.count || 1, c.fill, c.rot || 0, c.size || 1].join('|'));
  const ALL = {
    shape: ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star'],
    count: [1, 2, 3, 4, 5],
    fill: ['solid', 'gray', 'empty'],
    rot: [0, 45, 90, 135, 180, 225, 270, 315],
    size: [0.55, 0.78, 1],
  };

  function attrDistractors(ans, grid, rnd) {
    const groups = [];
    Object.keys(ALL).forEach((attr) => {
      const seen = new Set(grid.map((c) => c[attr] === undefined ? 'x' : c[attr]));
      if (seen.size < 2 && attr !== 'fill') return;
      if (attr === 'rot' && ans.shape !== 'arrow') return;
      if (attr === 'shape' && ans.shape === 'arrow') return;
      let vals = ALL[attr].filter((v) => v !== ans[attr] && (ans[attr] === undefined ? v !== (attr === 'count' || attr === 'size' ? 1 : 0) : true));
      if (attr === 'count') vals = vals.filter((v) => Math.abs(v - (ans.count || 1)) <= 2);
      const inGrid = vals.filter((v) => seen.has(v));
      const outGrid = vals.filter((v) => !seen.has(v));
      groups.push(GL.shuffle(inGrid, rnd).concat(GL.shuffle(outGrid, rnd)).map((v) => Object.assign({}, ans, { [attr]: v })));
    });
    const out = [];
    for (let round = 0; out.length < 12 && round < 8; round++) groups.forEach((g) => { if (g[round]) out.push(g[round]); });
    return out;
  }

  function lineDistractors(ans, grid, rnd) {
    const a = grid[6].lines;
    const b = grid[7].lines;
    const out = [{ lines: a | b }, { lines: a & b }, { lines: a }, { lines: b }];
    GL.shuffle([0, 1, 2, 3, 4, 5, 6, 7], rnd).forEach((bit) => out.push({ lines: ans.lines ^ (1 << bit) }));
    return out;
  }

  function matrix(seed, fn, why, lines) {
    const rnd = GL.rng(seed);
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(fn(r, c));
    const ans = cells[8];
    const pool = (lines ? lineDistractors : attrDistractors)(ans, cells, rnd);
    const keys = new Set([key(ans)]);
    const options = [ans];
    pool.forEach((d) => { if (options.length < 6 && !keys.has(key(d)) && (d.lines === undefined || d.lines > 0)) { keys.add(key(d)); options.push(d); } });
    const order = GL.shuffle(options.map((_, i) => i), rnd);
    return { type: 'matrix', section: 'Pattern', cells, options: order.map((i) => options[i]), answer: order.indexOf(0), prompt: 'Which option completes the pattern?', why };
  }

  function text(seed, section, prompt, opts, why) {
    const rnd = GL.rng(seed * 7919);
    const order = GL.shuffle(opts.map((_, i) => i), rnd);
    return { type: 'text', section, prompt, options: order.map((i) => String(opts[i])), answer: order.indexOf(0), why };
  }

  const S3 = (arr, i) => arr[((i % 3) + 3) % 3];

  const M = [
    matrix(101, (r, c) => ({ shape: ['circle', 'square', 'triangle'][r], count: c + 1, fill: 'solid' }),
      'Each row keeps one shape and the count rises 1, 2, 3 across the row, so the answer is three triangles.'),
    matrix(102, (r, c) => ({ shape: S3(['circle', 'triangle', 'diamond'], r + c), fill: ['solid', 'gray', 'empty'][r] }),
      'Every row and column contains each shape once, and shading is set by row: the bottom row is unshaded.'),
    matrix(103, (r, c) => ({ shape: 'arrow', rot: (90 * c + 45 * r) % 360, fill: 'solid' }),
      'Arrows turn 90° clockwise across each row, and each row starts 45° further round than the row above.'),
    matrix(104, (r, c) => ({ shape: S3(['square', 'star', 'hexagon'], r + 2 * c), count: S3([1, 2, 3], r + c), fill: 'gray' }),
      'Shape and count each follow their own Latin square: every row and column has each shape once and each count once.'),
    matrix(105, (r, c) => ({ shape: ['diamond', 'circle', 'hexagon'][r], size: [0.55, 0.78, 1][c], fill: S3(['solid', 'gray', 'empty'], 2 * r + c) }),
      'Size grows across each row, shape is fixed per row, and each row and column uses every shading once.'),
    matrix(106, (r, c) => {
      const rows = [[5, 20], [72, 65], [162, 36]];
      return { lines: c < 2 ? rows[r][c] : rows[r][0] ^ rows[r][1] };
    }, 'The third picture keeps lines that appear in exactly one of the first two. Lines they share cancel out.', true),
    matrix(107, (r, c) => ({ shape: ['triangle', 'circle', 'diamond'][c], count: r + c + 1, fill: ['empty', 'gray', 'solid'][r] }),
      'Count = row + column + 1, shape is fixed per column, shading per row: five solid diamonds.'),
    matrix(108, (r, c) => {
      const rows = [[21, 25], [194, 70], [169, 166]];
      return { lines: c < 2 ? rows[r][c] : rows[r][0] & rows[r][1] };
    }, 'The third picture keeps only the lines the first two have in common.', true),
    matrix(109, (r, c) => ({ shape: S3(['circle', 'square', 'star'], r + c), fill: S3(['solid', 'gray', 'empty'], r + 2 * c), count: S3([1, 2, 3], 2 * r + c) }),
      'Three independent Latin squares: every row and column contains each shape, each shading and each count exactly once.'),
    matrix(110, (r, c) => {
      const counts = [[1, 1, 2], [2, 1, 3], [1, 3, 4]];
      return { shape: ['hexagon', 'triangle', 'circle'][r], count: counts[r][c], fill: ['solid', 'empty', 'gray'][c] };
    }, 'In each row, the third count is the sum of the first two (1 + 3 = 4); shading is fixed by column.'),
  ];

  const N = [
    text(1, 'Numeric', 'What comes next?  2, 4, 8, 16, …', [32, 24, 30, 36, 64], 'Each number doubles.'),
    text(2, 'Numeric', 'What comes next?  2, 6, 12, 20, 30, …', [42, 40, 36, 44, 48], 'Differences grow by 2 (4, 6, 8, 10, 12). Also n × (n + 1).'),
    text(3, 'Numeric', 'What comes next?  4, 9, 7, 12, 10, …', [15, 13, 8, 17, 14], 'Alternate +5 and −2.'),
    text(4, 'Numeric', 'What comes next?  3, 5, 9, 17, 33, …', [65, 49, 66, 57, 64], 'Each term is double the previous minus 1.'),
    text(5, 'Numeric', 'What comes next?  7, 10, 16, 28, 52, …', [100, 76, 96, 104, 88], 'The differences double: 3, 6, 12, 24, 48.'),
    text(6, 'Numeric', 'What comes next?  1, 4, 27, 256, …', [3125, 625, 1024, 1296, 2500], 'nⁿ: 1¹, 2², 3³, 4⁴, 5⁵ = 3125.'),
    text(7, 'Numeric', 'Which letter comes next?  A, C, F, J, O, …', ['U', 'T', 'V', 'S', 'W'], 'The gaps grow: +2, +3, +4, +5, +6. O + 6 = U.'),
  ];

  const V = [
    text(11, 'Verbal', 'Book is to Library as Painting is to …', ['Gallery', 'Artist', 'Frame', 'Brush', 'Colour'], 'A library is where books are collected and displayed, like a gallery for paintings.'),
    text(12, 'Verbal', 'Ephemeral is to Permanent as Scarce is to …', ['Abundant', 'Rare', 'Brief', 'Costly', 'Hidden'], 'Opposites: ephemeral ↔ permanent, scarce ↔ abundant.'),
    text(13, 'Verbal', 'Which one does not belong?', ['Flute', 'Violin', 'Cello', 'Harp', 'Viola'], 'All the others are string instruments; the flute is a woodwind.'),
    text(14, 'Verbal', 'Which one does not belong?', ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'], 'The Moon is a satellite; the rest are planets.'),
    text(15, 'Verbal', 'Rearrange the letters CIFAIPC. The result is the name of …', ['an ocean', 'a city', 'an animal', 'a river', 'a country'], 'CIFAIPC → PACIFIC.'),
    text(16, 'Verbal', 'Which word is closest in meaning to LACONIC?', ['Concise', 'Lazy', 'Talkative', 'Nervous', 'Gloomy'], 'Laconic means using very few words.'),
  ];

  const L = [
    text(21, 'Logic', 'All bloops are razzies, and all razzies are lazzies. Are all bloops definitely lazzies?', ['Yes', 'No', 'Cannot be determined'], 'Bloops ⊂ razzies ⊂ lazzies, so every bloop is a lazzie.'),
    text(22, 'Logic', 'Tom is taller than Ann. Ann is taller than Joe. Kim is shorter than Joe. Who is the shortest?', ['Kim', 'Joe', 'Ann', 'Tom', 'Cannot tell'], 'Tom > Ann > Joe > Kim.'),
    text(23, 'Logic', 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?', ['5 cents', '10 cents', '1 cent', '15 cents', '50 cents'], 'Ball = x, bat = x + 1.00, so 2x + 1.00 = 1.10 and x = 0.05.'),
    text(24, 'Logic', 'If 5 machines take 5 minutes to make 5 widgets, how long do 100 machines take to make 100 widgets?', ['5 minutes', '100 minutes', '20 minutes', '1 minute', '50 minutes'], 'Each machine makes one widget in 5 minutes, regardless of how many machines there are.'),
    text(25, 'Logic', 'A patch of lily pads doubles in size every day. It takes 48 days to cover the whole lake. How many days to cover half the lake?', ['47', '24', '46', '36', '12'], 'It doubles daily, so it was half-covered one day before it was fully covered.'),
    text(26, 'Logic', 'What is the smaller angle between the hour and minute hands of a clock at 3:15?', ['7.5°', '0°', '15°', '5°', '10°'], 'The hour hand moves 0.5° per minute, so at 3:15 it is 7.5° past the 3, where the minute hand points.'),
    text(27, 'Logic', 'Some managers are engineers. All engineers are punctual. Which statement must be true?', ['Some managers are punctual', 'All managers are punctual', 'No managers are punctual', 'All punctual people are engineers', 'Some engineers are not managers'], 'The managers who are engineers must be punctual. Nothing more is guaranteed.'),
  ];

  // Interleaved so difficulty ramps up gradually across sections.
  const ORDER = [M[0], N[0], V[0], L[0], M[1], V[1], N[1], M[2], L[1], V[2], M[3], N[2], L[2], M[4], V[3], N[3], L[3], M[5], V[4], N[4], M[6], L[4], V[5], M[7], N[5], L[5], M[8], N[6], L[6], M[9]];
  ORDER.forEach((q, i) => { q.id = i; });

  GL.IQ_QUESTIONS = ORDER;
  GL.IQ_SECTIONS = ['Pattern', 'Numeric', 'Verbal', 'Logic'];
})();
