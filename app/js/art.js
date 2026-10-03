/* Generative art engine.
   Every activity, page and nav item gets its own abstract composition: wobbly
   blobs, rainbow arches, striped moons, eyes, petals, spirals and squiggles,
   seeded from a string so each piece is unique but never changes. */
(function () {
  'use strict';

  const PAL = ['#e8553a', '#4361ee', '#f2c14e', '#6cc4a1', '#f19fbf', '#a99cf0', '#efe6d6', '#f08a3c', '#9dbf5a'];
  const INK = '#141413';
  const CREAM = '#efe6d6';

  GL.ART_PALETTE = PAL;

  GL.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  };

  let uid = 0;
  const f = (n) => (Math.round(n * 10) / 10).toString();
  const pt = (p) => f(p[0]) + ' ' + f(p[1]);

  // Smooth closed Catmull-Rom curve through the points.
  function smooth(pts) {
    const n = pts.length;
    let d = 'M' + pt(pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
    }
    return d + 'Z';
  }

  function blobPath(cx, cy, r, rnd, n, wob) {
    const off = rnd() * Math.PI * 2;
    return smooth(Array.from({ length: n || 7 }, (_, i) => {
      const a = off + (i / (n || 7)) * Math.PI * 2;
      const rr = r * (1 - (wob || 0.3) / 2 + rnd() * (wob || 0.3));
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    }));
  }

  // ---------- primitives: (rnd, cx, cy, size, colour, colour2) -> svg ----------

  const P = {
    blob: (r, x, y, s, c) => '<path d="' + blobPath(x, y, s, r, 7, 0.38) + '" fill="' + c + '"/>',
    circle: (r, x, y, s, c) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s) + '" fill="' + c + '"/>',
    ring: (r, x, y, s, c) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * 0.82) + '" fill="none" stroke="' + c + '" stroke-width="' + f(s * 0.3) + '"' + (r() < 0.4 ? ' stroke-dasharray="' + f(s * 0.35) + ' ' + f(s * 0.22) + '"' : '') + '/>',
    half: (r, x, y, s, c) => '<path d="M' + f(x - s) + ' ' + f(y) + 'A' + f(s) + ' ' + f(s) + ' 0 0 1 ' + f(x + s) + ' ' + f(y) + 'Z" fill="' + c + '" transform="rotate(' + Math.round(r() * 360) + ' ' + f(x) + ' ' + f(y) + ')"/>',
    arches(r, x, y, s, c, c2) {
      const cols = [c, c2, CREAM];
      const rot = Math.round(r() * 4) * 90;
      return '<g transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')" fill="none" stroke-width="' + f(s * 0.24) + '">' + [0, 1, 2].map((k) => {
        const rr = s * (1 - k * 0.3);
        return '<path d="M' + f(x - rr) + ' ' + f(y) + 'A' + f(rr) + ' ' + f(rr) + ' 0 0 1 ' + f(x + rr) + ' ' + f(y) + '" stroke="' + cols[k] + '"/>';
      }).join('') + '</g>';
    },
    stripes(r, x, y, s, c, c2) {
      const id = 'gc' + uid++;
      const rot = Math.round(r() * 180);
      let l = '';
      for (let k = -s; k <= s; k += s * 0.32) l += '<line x1="' + f(x - s) + '" y1="' + f(y + k) + '" x2="' + f(x + s) + '" y2="' + f(y + k) + '"/>';
      return '<clipPath id="' + id + '"><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s) + '"/></clipPath><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s) + '" fill="' + c2 + '"/>' +
        '<g clip-path="url(#' + id + ')" stroke="' + c + '" stroke-width="' + f(s * 0.16) + '" transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')">' + l + '</g>';
    },
    dots(r, x, y, s, c) {
      let d = '';
      const n = 4, step = (s * 2) / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d += '<circle cx="' + f(x - s + step / 2 + i * step) + '" cy="' + f(y - s + step / 2 + j * step) + '" r="' + f(step * 0.22) + '"/>';
      return '<g fill="' + c + '" transform="rotate(' + Math.round(r() * 90) + ' ' + f(x) + ' ' + f(y) + ')">' + d + '</g>';
    },
    squiggle(r, x, y, s, c) {
      const w = s * 2.6, amp = s * 0.28, seg = 5;
      let d = 'M' + f(x - w / 2) + ' ' + f(y);
      for (let i = 0; i < seg; i++) {
        const x0 = x - w / 2 + (i * w) / seg;
        d += 'Q' + f(x0 + w / seg / 2) + ' ' + f(y + (i % 2 ? amp : -amp) * 2) + ' ' + f(x0 + w / seg) + ' ' + f(y);
      }
      return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + f(s * 0.16) + '" stroke-linecap="round" transform="rotate(' + Math.round(r() * 180 - 90) + ' ' + f(x) + ' ' + f(y) + ')"/>';
    },
    spiral(r, x, y, s, c) {
      let d = '';
      const turns = 2.6;
      for (let t = 0; t <= turns * Math.PI * 2; t += 0.3) {
        const rr = (t / (turns * Math.PI * 2)) * s;
        d += (t ? 'L' : 'M') + f(x + Math.cos(t) * rr) + ' ' + f(y + Math.sin(t) * rr);
      }
      return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + f(s * 0.12) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    burst(r, x, y, s, c) {
      let l = '';
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        l += '<line x1="' + f(x + Math.cos(a) * s * 0.35) + '" y1="' + f(y + Math.sin(a) * s * 0.35) + '" x2="' + f(x + Math.cos(a) * s) + '" y2="' + f(y + Math.sin(a) * s) + '"/>';
      }
      return '<g stroke="' + c + '" stroke-width="' + f(s * 0.12) + '" stroke-linecap="round">' + l + '</g>';
    },
    tri: (r, x, y, s, c) => '<polygon points="' + [0, 1, 2].map((k) => { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3; return pt([x + Math.cos(a) * s, y + Math.sin(a) * s]); }).join(' ') + '" fill="' + c + '" stroke="' + c + '" stroke-width="' + f(s * 0.2) + '" stroke-linejoin="round" transform="rotate(' + Math.round(r() * 120) + ' ' + f(x) + ' ' + f(y) + ')"/>',
    eye(r, x, y, s, c) {
      const rot = Math.round(r() * 60 - 30);
      return '<g transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"><path d="M' + f(x - s) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y - s * 1.15) + ' ' + f(x + s) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y + s * 1.15) + ' ' + f(x - s) + ' ' + f(y) + 'Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="' + f(s * 0.1) + '"/>' +
        '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * 0.42) + '" fill="' + c + '"/><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * 0.2) + '" fill="' + INK + '"/><circle cx="' + f(x + s * 0.12) + '" cy="' + f(y - s * 0.12) + '" r="' + f(s * 0.07) + '" fill="' + CREAM + '"/></g>';
    },
    flower(r, x, y, s, c, c2) {
      let p = '';
      const n = 5 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        p += '<circle cx="' + f(x + Math.cos(a) * s * 0.55) + '" cy="' + f(y + Math.sin(a) * s * 0.55) + '" r="' + f(s * 0.42) + '"/>';
      }
      return '<g fill="' + c + '">' + p + '</g><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * 0.36) + '" fill="' + c2 + '"/>';
    },
    pill: (r, x, y, s, c) => '<rect x="' + f(x - s) + '" y="' + f(y - s * 0.38) + '" width="' + f(s * 2) + '" height="' + f(s * 0.76) + '" rx="' + f(s * 0.38) + '" fill="' + c + '" transform="rotate(' + Math.round(r() * 180) + ' ' + f(x) + ' ' + f(y) + ')"/>',
    checker(r, x, y, s, c) {
      let q = '';
      const n = 3, w = (s * 2) / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2 === 0) q += '<rect x="' + f(x - s + i * w) + '" y="' + f(y - s + j * w) + '" width="' + f(w) + '" height="' + f(w) + '"/>';
      return '<g fill="' + c + '" transform="rotate(' + Math.round(r() * 90) + ' ' + f(x) + ' ' + f(y) + ')">' + q + '</g>';
    },
    plus: (r, x, y, s, c) => '<path d="M' + f(x - s) + ' ' + f(y) + 'H' + f(x + s) + 'M' + f(x) + ' ' + f(y - s) + 'V' + f(y + s) + '" stroke="' + c + '" stroke-width="' + f(s * 0.45) + '" stroke-linecap="round" transform="rotate(' + Math.round(r() * 90) + ' ' + f(x) + ' ' + f(y) + ')"/>',
  };

  const BASE = ['blob', 'blob', 'circle', 'half', 'stripes', 'flower'];
  const MID = ['ring', 'arches', 'stripes', 'checker', 'half', 'tri', 'blob', 'flower', 'dots'];
  const ACCENT = ['eye', 'tri', 'pill', 'circle', 'flower', 'eye', 'plus'];
  const LINE = ['squiggle', 'spiral', 'burst', 'squiggle'];

  function layer(inner, r, k) {
    const dx = f((r() - 0.5) * 16), dy = f((r() - 0.5) * 16), dr = Math.round((r() - 0.5) * 50);
    return '<g class="L" style="--dx:' + dx + 'px;--dy:' + dy + 'px;--dr:' + dr + 'deg;--k:' + k + '">' + inner + '</g>';
  }

  // A full composition in a 120 x 120 box.
  GL.artwork = function (key, cls) {
    const r = GL.rng(GL.hash(String(key)));
    const cols = GL.shuffle(PAL, r);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const L = [];
    L.push(P[pick(BASE)](r, 56 + r() * 14, 60 + r() * 12, 30 + r() * 12, cols[0], cols[4]));
    L.push(P[pick(MID)](r, 30 + r() * 20, 34 + r() * 18, 16 + r() * 10, cols[1], cols[5]));
    L.push(P[pick(MID)](r, 80 + r() * 18, 82 + r() * 16, 12 + r() * 9, cols[2], cols[6]));
    L.push(P[pick(ACCENT)](r, 40 + r() * 40, 50 + r() * 30, 8 + r() * 7, cols[3], cols[0]));
    L.push(P[pick(LINE)](r, 50 + r() * 30, 40 + r() * 50, 12 + r() * 8, r() < 0.5 ? INK : CREAM));
    let sprinkles = '';
    for (let i = 0; i < 3 + Math.floor(r() * 3); i++) sprinkles += '<circle cx="' + f(10 + r() * 100) + '" cy="' + f(10 + r() * 100) + '" r="' + f(1.6 + r() * 2.4) + '" fill="' + (r() < 0.5 ? CREAM : cols[(i + 2) % cols.length]) + '"/>';
    L.push(sprinkles);
    return '<svg viewBox="0 0 120 120" class="artwork ' + (cls || '') + '" aria-hidden="true">' + L.map((g, i) => layer(g, r, i)).join('') + '</svg>';
  };

  GL.art = (key) => '<div class="tile-art" aria-hidden="true">' + GL.artwork(key) + '</div>';

  // A small abstract mark used in place of conventional icons.
  GL.glyph = function (key, cls) {
    const r = GL.rng(GL.hash('glyph:' + key));
    const cols = GL.shuffle(PAL.slice(0, 8), r);
    const [a, b, c] = cols;
    const t = Math.floor(r() * 8);
    let s;
    switch (t) {
      case 0: s = P.circle(r, 10, 13, 8, a) + P.half(r, 15, 11, 7, b) + P.circle(r, 17, 17, 2.4, INK); break;
      case 1: s = '<path d="' + blobPath(12, 12, 9, r, 6, 0.45) + '" fill="' + a + '"/>' + P.ring(r, 14.5, 9.5, 4.5, b); break;
      case 2: s = P.arches(r, 12, 15, 10, a, b) + P.circle(r, 12, 15, 2.2, c); break;
      case 3: s = P.tri(r, 11, 13, 8, a) + P.circle(r, 16, 9, 4.2, b); break;
      case 4: s = '<rect x="4" y="4" width="16" height="16" rx="4" fill="' + a + '" transform="rotate(' + Math.round(r() * 40) + ' 12 12)"/>' + P.eye(r, 12, 12, 6.5, b); break;
      case 5: s = P.flower(r, 12, 12, 9, a, b); break;
      case 6: s = P.pill(r, 12, 12, 9, a) + P.circle(r, 7, 7, 2.2, b) + P.circle(r, 17, 17, 2.2, c); break;
      default: s = P.stripes(r, 12, 12, 9.5, a, b);
    }
    return '<svg viewBox="0 0 24 24" class="glyph ' + (cls || '') + '" aria-hidden="true">' + s + '</svg>';
  };

  // Quiblee: a wobbly, many-coloured blob creature.
  GL.quibleeFace = function () {
    const r = GL.rng(7);
    return '<svg viewBox="0 0 48 48" class="quiblee" aria-hidden="true">' +
      '<path class="q-ant" d="M26 10 Q30 4 35 5" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="5" r="3.2" fill="#4361ee"/>' +
      '<path class="q-body" d="' + blobPath(24, 27, 18, r, 8, 0.22) + '" fill="#f2c14e"/>' +
      '<path d="M8 30 Q24 44 40 30 Q38 42 24 44 Q10 42 8 30Z" fill="#e8553a" opacity="1"/>' +
      '<circle cx="18" cy="24" r="4.4" fill="' + CREAM + '"/><circle cx="19" cy="24.6" r="2.3" fill="' + INK + '"/>' +
      '<circle cx="30" cy="24" r="4.4" fill="' + CREAM + '"/><circle cx="31" cy="24.6" r="2.3" fill="' + INK + '"/>' +
      '<path d="M20 32 Q24 35.5 28 32" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="12" cy="17" r="1.6" fill="' + CREAM + '"/></svg>';
  };
})();
