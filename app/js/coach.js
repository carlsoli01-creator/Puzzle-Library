/* Quiblee: a personal AI coach in a chat.
   Works fully offline with a built-in, stats-aware coach. If the user adds their
   own Anthropic API key, replies come from Claude with the same stats as context. */
(function () {
  'use strict';

  const HIST_KEY = 'geniuslab.coach';
  const API_KEY = 'geniuslab.apikey';
  const MODEL = 'claude-opus-5';

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };

  // ---------- user snapshot ----------

  function snapshot() {
    const doms = GL.domainScores();
    const lvl = GL.level();
    const mods = GL.moduleOrder.map((id) => {
      const m = GL.modules[id];
      const h = GL.history(id);
      return { id, title: m.title, route: m.route, section: m.section, domains: m.domains, sessions: h.length, score: GL.moduleScore(id), best: h.length ? m.fmt(GL.bestEntry(id)).replace(/&middot;/g, '·') : null, doneToday: GL.doneToday(id) };
    });
    const iq = GL.history('iq').slice(-1)[0];
    return {
      index: GL.geniusScore(),
      indexWeekAgo: GL.indexAt ? GL.indexAt(Date.now() - 7 * 86400000) : null,
      level: lvl.name, xp: lvl.xp, streak: GL.streak(), totalSessions: GL.totalSessions(),
      domains: doms.map((d) => ({ name: d.name, score: d.score, tried: d.has })),
      lastIq: iq ? { iq: iq.iq, raw: iq.raw, total: iq.total } : null,
      activities: mods,
    };
  }

  function plan(s) {
    const byDomain = GL.domainScores().slice().sort((a, b) => a.score - b.score);
    const picks = [];
    byDomain.forEach((d) => {
      if (picks.length >= 3) return;
      const cands = d.mods.filter((m) => m.id !== 'iq' && !GL.doneToday(m.id) && !picks.includes(m));
      if (!cands.length) return;
      cands.sort((a, b) => GL.history(a.id).length - GL.history(b.id).length);
      picks.push(cands[0]);
    });
    return picks;
  }
  GL.dailyPlan = () => plan(snapshot());

  // ---------- built-in coach ----------

  const TIPS = {
    memory: ['Use **spaced repetition**: review new material after 1 day, 3 days, then a week.', 'Chunk long strings: 4-1-7-9-2-6 becomes 417-926.', 'Turn facts into vivid images and place them along a familiar route (the "memory palace").', 'Push [N-Back](#/train/nback) up a level once you score 80%+.'],
    focus: ['Work in 25–45 minute blocks with your phone in another room.', 'A 10-minute walk restores attention better than scrolling.', 'The [Stroop test](#/train/stroop) trains ignoring distractions. Aim for accuracy first, then speed.'],
    speed: ['Reaction time is best when you are rested and warmed up. Do a few practice clicks first.', 'Caffeine and sleep both measurably shift reaction time. Test at consistent times to see real progress.', 'Train decision speed with [Choice Reaction](#/train/choice), not just raw reflexes.'],
    reading: ['Preview headings and the first sentence of each paragraph before reading.', 'Summarise each paragraph in five words in your head as you go.', 'If comprehension drops below 75%, slow down. Effective speed = wpm × comprehension.'],
    math: ['Break problems apart: 38 × 7 = 30 × 7 + 8 × 7 = 210 + 56.', 'For percentages, swap: 16% of 25 = 25% of 16 = 4.', 'Learn squares to 25 and the 11–19 times tables; they unlock fast estimation.'],
    reasoning: ['On matrix puzzles, check rows AND columns for each attribute separately: shape, count, shading, rotation.', 'For number series, write the differences underneath, then the differences of the differences.', 'In syllogisms, sketch circles. "Some" means at least one overlap, nothing more.'],
    general: ['**Sleep** 7–9 hours. Memory consolidation happens overnight.', '**Move**: aerobic exercise is one of the best-supported ways to boost cognition.', '**Learn something hard**: new skills (languages, instruments) build lasting reserve.', '**Vary training**: rotate domains so you build broad ability, not just test skill.'],
  };

  const md = (t) => GL.esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\((#\/[a-z0-9/_-]*)\)/gi, '<a href="$2">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m.replace(/\n/g, '') + '</ul>')
    .replace(/\n/g, '<br>');

  function localReply(text) {
    const s = snapshot();
    const q = text.toLowerCase();
    const has = (...w) => w.some((x) => q.includes(x));
    const doms = s.domains.slice().sort((a, b) => b.score - a.score);
    const link = (m) => '[' + m.title + '](' + m.route + ')';
    const tips = (k, n) => GL.shuffle(TIPS[k]).slice(0, n || 2).map((t) => '- ' + t).join('\n');

    if (!s.totalSessions && !has('help', 'what can', 'who are')) {
      return 'Welcome! I\'m **Quiblee**, your brain coach. You haven\'t trained yet, so let\'s get a baseline.\n- Start with the [Reaction Time](#/train/reaction) test (30 seconds)\n- Then try [Digit Span](#/train/digits) for memory\n- When you have 25 minutes, take the [IQ Test](#/iq)\nCome back after and I\'ll read your stats.';
    }
    if (has('hello', 'hi ', 'hey') || q.trim() === 'hi') {
      return 'Hey! Your Cognitive Index is **' + s.index + '/1000** and you\'re on a **' + s.streak + '-day streak**. Want a training plan, a progress review, or tips for a skill?';
    }
    if (has('plan', 'what should', 'today', 'recommend', 'next', 'train')) {
      const p = plan(s);
      if (!p.length) return 'You\'ve covered every domain today. Impressive! Rest is part of training. If you want more, retake a weak spot or read an [article](#/read).';
      return 'Here\'s today\'s plan, targeting your weakest domains:\n' + p.map((m) => '- ' + link(m) + ' (' + GL.DOMAINS.find((d) => d.id === m.domains[0]).name + ')').join('\n') + '\nAbout 10 minutes total. Tell me how it goes!';
    }
    if (has('how am i', 'progress', 'doing', 'stats', 'score', 'index', 'improv')) {
      const d = s.indexWeekAgo !== null ? s.index - s.indexWeekAgo : 0;
      return 'Your **Cognitive Index is ' + s.index + '/1000** (' + (d >= 0 ? '+' : '') + d + ' this week), level **' + s.level + '**, ' + s.totalSessions + ' sessions logged.\n- Strongest: **' + doms[0].name + '** (' + doms[0].score + ')\n- Most room to grow: **' + doms[doms.length - 1].name + '** (' + doms[doms.length - 1].score + ')\nSee the full breakdown in [Biometrics](#/bio).';
    }
    if (has('iq')) {
      if (!s.lastIq) return 'You haven\'t taken the [IQ Test](#/iq) yet. It\'s 30 questions in 25 minutes across pattern, numeric, verbal and logic sections. Find a quiet spot first!';
      return 'Your latest IQ estimate is **' + s.lastIq.iq + '** (' + s.lastIq.raw + '/' + s.lastIq.total + ' correct), which is **' + GL.iqClass(s.lastIq.iq) + '**. The [report](#/iq/report) shows your weakest section. Reasoning tips:\n' + tips('reasoning', 2) + '\nThe [Logic Lab](#/train) drills are the best practice.';
    }
    if (has('memory', 'remember', 'forget', 'digit', 'n-back', 'nback')) return 'Memory boosters:\n' + tips('memory', 3);
    if (has('focus', 'concentrat', 'distract', 'attention', 'stroop')) return 'To sharpen focus:\n' + tips('focus', 3);
    if (has('reaction', 'speed', 'fast', 'reflex')) return 'On speed:\n' + tips('speed', 3);
    if (has('read', 'comprehen', 'wpm', 'vocab', 'word')) return 'Reading and verbal tips:\n' + tips('reading', 2) + '\nPair [Read & Recall](#/read) with the Word Lab\'s [Vocabulary Builder](#/train/vocab).';
    if (has('math', 'number', 'arithmetic', 'calcul')) return 'Mental maths tricks:\n' + tips('math', 3) + '\nPractise in the [Mental Math Sprint](#/train/math).';
    if (has('logic', 'reason', 'puzzle', 'pattern')) return 'Reasoning strategies:\n' + tips('reasoning', 3);
    if (has('smart', 'genius', 'intellig', 'brain', 'sleep', 'exercise', 'diet', 'better')) return 'The habits with the best evidence behind them:\n' + tips('general', 4) + '\nBrain games sharpen specific skills; lifestyle lifts everything.';
    if (has('tired', 'bored', 'motivat', 'lazy', 'give up', 'hard')) return 'Totally normal. Progress in cognitive training is uneven: plateaus come before jumps. Do just **one** 60-second drill right now; momentum beats willpower. Your streak is ' + s.streak + ' day' + (s.streak === 1 ? '' : 's') + '. Keep it alive!';
    if (has('work', 'calculat', 'how does', 'explain', 'mean')) return 'Each session becomes a 0–100 **skill score** against benchmarks for that activity. Your activity score is the best of your last 10 sessions; domains average their activities; the **Cognitive Index** is the average of the seven domains × 10.';
    if (has('help', 'what can', 'who are')) return 'I\'m **Quiblee**, your personal coach. Ask me to:\n- "Plan my training"\n- "How am I doing?"\n- "Explain my IQ result"\n- "Tips for memory / focus / speed / reading / maths"\n- "How can I get smarter?"' + (store.get(API_KEY, '') ? '' : '\nTip: add a Claude API key (key icon above) for open-ended conversations.');
    return 'Good question! I\'m best at training advice. Try "plan my training", "how am I doing?" or "tips for memory". Right now I\'d suggest ' + link(plan(s)[0] || GL.modules.reaction) + '.' + (store.get(API_KEY, '') ? '' : '\nFor free-form chat, add your Claude API key with the key icon.');
  }

  // ---------- Claude (optional) ----------

  let sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) sdkPromise = import('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm').then((m) => m.default || m.Anthropic);
    return sdkPromise;
  }

  function systemPrompt() {
    const routes = GL.moduleOrder.map((id) => GL.modules[id]).map((m) => '- ' + m.title + ': ' + m.route).join('\n');
    return 'You are Quiblee, the friendly, encouraging and sharp personal brain-training coach inside the Genius Lab app. ' +
      'You help the user improve reaction time, memory, focus, numeracy, verbal skill, reasoning and perception, using their real training data below. ' +
      'Keep replies short (under 120 words), warm and specific. Use **bold** for key numbers. When recommending an activity, link it with markdown using ONLY these in-app routes:\n' + routes +
      '\n- Biometrics dashboard: #/bio\n- IQ report: #/iq/report\n' +
      'Be honest that the IQ score is an estimate, not a clinical assessment. Give evidence-based advice (sleep, exercise, spaced repetition) and never make medical claims.\n\n' +
      'User data (JSON):\n' + JSON.stringify(snapshot());
  }

  async function claudeReply(history, onText) {
    const Anthropic = await loadSdk();
    const client = new Anthropic({ apiKey: store.get(API_KEY, ''), dangerouslyAllowBrowser: true });
    const messages = history.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20).map((m) => ({ role: m.role, content: m.text }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt(),
      messages,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    let text = '';
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
        text += ev.delta.text;
        onText(text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { refusal: true });
    return text;
  }

  // ---------- page ----------

  const CHIPS = ['Plan my training', 'How am I doing?', 'How can I get smarter?', 'Explain my IQ result', 'Tips for memory', 'Help me focus'];

  GL.route('coach', (view, parts, scope) => {
    let history = store.get(HIST_KEY, []);
    let busy = false;

    view.innerHTML =
      '<div class="chat">' +
        '<header class="chat-head">' +
          '<div class="quiblee-avatar">' + quibleeFace() + '</div>' +
          '<div class="chat-title"><h1 class="display">Quiblee</h1><div class="muted small" id="chat-mode"></div></div>' +
          '<button class="icon-btn" id="chat-key" title="Claude API key">' + GL.icon('key') + '</button>' +
          '<button class="icon-btn" id="chat-clear" title="Clear chat">' + GL.icon('x') + '</button>' +
        '</header>' +
        '<div class="key-panel card" id="key-panel" hidden>' +
          '<h3>Connect Claude (optional)</h3>' +
          '<p class="small muted">Quiblee works offline with a built-in coach. Paste your own Anthropic API key for open-ended conversations powered by Claude. The key is kept only in this browser and sent only to Anthropic.</p>' +
          '<form id="key-form" class="dr-form"><input class="mm-input" id="key-in" type="password" placeholder="sk-ant-…" autocomplete="off"><button class="btn primary">Save</button></form>' +
          '<button class="btn ghost small" id="key-remove">Remove key</button>' +
        '</div>' +
        '<div class="chat-log" id="chat-log" aria-live="polite"></div>' +
        '<div class="chips" id="chat-chips">' + CHIPS.map((c) => '<button class="chip-btn">' + c + '</button>').join('') + '</div>' +
        '<form class="chat-input" id="chat-form"><input id="chat-in" placeholder="Ask Quiblee anything…" autocomplete="off" aria-label="Message"><button class="send" aria-label="Send">' + GL.icon('send') + '</button></form>' +
      '</div>';

    const log = GL.$('#chat-log', view);
    const input = GL.$('#chat-in', view);

    function paintMode() {
      GL.$('#chat-mode', view).innerHTML = store.get(API_KEY, '') ? '<span class="dot live"></span>Powered by Claude' : '<span class="dot"></span>Built-in coach &middot; offline';
    }

    function bubble(m) {
      return '<div class="msg ' + m.role + '">' + (m.role === 'assistant' ? '<div class="msg-av">' + quibleeFace() + '</div>' : '') + '<div class="msg-body">' + (m.role === 'assistant' ? md(m.text) : GL.esc(m.text)) + '</div></div>';
    }

    function paint() {
      const intro = { role: 'assistant', text: 'Hi, I\'m **Quiblee**, your personal brain coach. I read your training stats and help you build a sharper mind. What would you like to work on?' };
      log.innerHTML = [intro].concat(history).map(bubble).join('');
      log.scrollTop = log.scrollHeight;
    }

    async function send(text) {
      text = text.trim();
      if (!text || busy) return;
      busy = true;
      input.value = '';
      history.push({ role: 'user', text });
      paint();
      log.insertAdjacentHTML('beforeend', '<div class="msg assistant pending"><div class="msg-av">' + quibleeFace() + '</div><div class="msg-body"><span class="typing"><i></i><i></i><i></i></span></div></div>');
      log.scrollTop = log.scrollHeight;
      const body = GL.$('.pending .msg-body', log);
      let reply;
      if (store.get(API_KEY, '')) {
        try {
          reply = await claudeReply(history, (t) => { if (scope.alive) { body.innerHTML = md(t); log.scrollTop = log.scrollHeight; } });
        } catch (e) {
          const status = e && e.status;
          const why = e && e.refusal ? 'Claude declined that one.' : status === 401 ? 'Your API key was rejected.' : status === 429 ? 'Claude is rate-limited right now.' : 'I couldn\'t reach Claude.';
          reply = '_' + why + ' Here\'s my built-in answer:_\n' + localReply(text);
          reply = reply.replace(/^_(.*?)_/, '**$1**');
        }
      } else {
        await new Promise((r) => setTimeout(r, 450 + Math.random() * 450));
        reply = localReply(text);
      }
      history.push({ role: 'assistant', text: reply });
      history = history.slice(-60);
      store.set(HIST_KEY, history);
      busy = false;
      if (scope.alive) paint();
    }

    GL.$('#chat-form', view).onsubmit = (e) => { e.preventDefault(); send(input.value); };
    GL.$('#chat-chips', view).onclick = (e) => { const b = e.target.closest('button'); if (b) send(b.textContent); };
    GL.$('#chat-clear', view).onclick = () => { history = []; store.del(HIST_KEY); paint(); };
    GL.$('#chat-key', view).onclick = () => { const p = GL.$('#key-panel', view); p.hidden = !p.hidden; };
    GL.$('#key-form', view).onsubmit = (e) => {
      e.preventDefault();
      const k = GL.$('#key-in', view).value.trim();
      if (!k) return;
      store.set(API_KEY, k);
      GL.$('#key-in', view).value = '';
      GL.$('#key-panel', view).hidden = true;
      paintMode();
      GL.toast('Claude connected. Quiblee just got smarter.');
    };
    GL.$('#key-remove', view).onclick = () => { store.del(API_KEY); paintMode(); GL.toast('API key removed'); };

    paintMode();
    paint();
    input.focus();
  });

  function quibleeFace() {
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="var(--sand)"/><path d="M9 17c1-7 6-11 11-11s10 4 11 11" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="19" r="2.4" fill="var(--bg)"/><circle cx="25" cy="19" r="2.4" fill="var(--bg)"/><path d="M14.5 25.5c3 2.6 8 2.6 11 0" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="5" r="2.2" fill="var(--sand)"/></svg>';
  }
  GL.quibleeFace = quibleeFace;
})();
