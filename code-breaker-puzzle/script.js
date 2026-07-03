(() => {
  const CODE_LENGTH = 4;
  const MAX_GUESSES = 8;
  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const heroNumberEl = document.getElementById('guess-count');
  const heroStatusEl = document.getElementById('hero-status');
  const heroBadge = document.getElementById('hero-badge');
  const heroBadgeText = document.getElementById('hero-badge-text');
  const timerEl = document.getElementById('timer');
  const attemptsLeftEl = document.getElementById('attempts-left');
  const hintToggle = document.getElementById('hint-toggle');
  const historyListEl = document.getElementById('history-list');
  const inputRowEl = document.getElementById('input-row');
  const padGridEl = document.getElementById('pad-grid');
  const winOverlay = document.getElementById('win-overlay');
  const winTitle = document.getElementById('win-title');
  const winDetail = document.getElementById('win-detail');
  const winNext = document.getElementById('win-next');
  const submitBtn = document.getElementById('submit-btn');
  const newCodeBtn = document.getElementById('new-code-btn');

  let secret = [];
  let currentInput = [];
  let history = []; // [{ guess: [...], feedback: [...] }]
  let ruledOut = new Set();
  let seconds = 0;
  let timerId = null;
  let running = false;
  let solved = false;
  let lost = false;
  let hintOn = true;

  function digitColor(d) {
    const hue = Math.round((d * 360) / 10);
    return `hsl(${hue}, 78%, 58%)`;
  }

  function randomSecret() {
    const pool = DIGITS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, CODE_LENGTH);
  }

  function evaluate(guess) {
    return guess.map((d, i) => {
      if (secret[i] === d) return 'exact';
      if (secret.includes(d)) return 'close';
      return 'absent';
    });
  }

  function renderHistory() {
    historyListEl.innerHTML = '';
    history.forEach(({ guess, feedback }) => {
      const row = document.createElement('div');
      row.className = 'history-row';

      const tiles = document.createElement('div');
      tiles.className = 'history-tiles';
      guess.forEach((d, i) => {
        const tile = document.createElement('div');
        tile.className = `mini-tile ${feedback[i]}`;
        tile.textContent = d;
        tiles.appendChild(tile);
      });

      const exact = feedback.filter(f => f === 'exact').length;
      const close = feedback.filter(f => f === 'close').length;
      const summary = document.createElement('span');
      summary.className = 'history-summary';
      summary.textContent = `${exact} exact · ${close} close`;

      row.appendChild(tiles);
      row.appendChild(summary);
      historyListEl.appendChild(row);
    });
    historyListEl.scrollTop = historyListEl.scrollHeight;
  }

  function renderInput() {
    inputRowEl.innerHTML = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      const slot = document.createElement('div');
      if (i < currentInput.length) {
        slot.className = 'input-slot filled';
        slot.style.setProperty('--tile-color', digitColor(currentInput[i]));
        slot.textContent = currentInput[i];
        slot.addEventListener('click', () => removeDigit(i));
      } else {
        slot.className = 'input-slot empty';
      }
      inputRowEl.appendChild(slot);
    }
  }

  function renderPad() {
    padGridEl.innerHTML = '';
    DIGITS.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'pad-btn';
      btn.textContent = d;
      btn.style.setProperty('--tile-color', digitColor(d));
      const isRuledOut = hintOn && ruledOut.has(d);
      if (isRuledOut) btn.classList.add('ruled-out');
      const gameOver = solved || lost;
      btn.disabled = gameOver || currentInput.length >= CODE_LENGTH || currentInput.includes(d);
      btn.addEventListener('click', () => addDigit(d));
      padGridEl.appendChild(btn);
    });
  }

  function render() {
    renderHistory();
    renderInput();
    renderPad();
    attemptsLeftEl.textContent = MAX_GUESSES - history.length;
    submitBtn.disabled = currentInput.length !== CODE_LENGTH || solved || lost;
  }

  function updateHeroStatus() {
    if (solved) {
      heroStatusEl.textContent = 'cracked — nice work';
    } else if (lost) {
      heroStatusEl.textContent = `the code was ${secret.join('')}`;
    } else if (history.length > 0) {
      const last = history[history.length - 1];
      const exact = last.feedback.filter(f => f === 'exact').length;
      const close = last.feedback.filter(f => f === 'close').length;
      heroStatusEl.textContent = `${exact} exact · ${close} close`;
    } else {
      heroStatusEl.textContent = 'crack the 4-digit code — no repeated digits';
    }
  }

  function startTimer() {
    if (running || solved || lost) return;
    running = true;
    timerId = setInterval(() => {
      seconds += 1;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    running = false;
    clearInterval(timerId);
  }

  function addDigit(d) {
    if (solved || lost || currentInput.length >= CODE_LENGTH || currentInput.includes(d)) return;
    currentInput.push(d);
    startTimer();
    render();
  }

  function removeDigit(i) {
    if (solved || lost) return;
    currentInput.splice(i, 1);
    render();
  }

  function submitGuess() {
    if (currentInput.length !== CODE_LENGTH || solved || lost) return;
    const guess = currentInput.slice();
    const feedback = evaluate(guess);
    history.push({ guess, feedback });
    feedback.forEach((f, i) => { if (f === 'absent') ruledOut.add(guess[i]); });

    const exact = feedback.filter(f => f === 'exact').length;
    currentInput = [];
    heroNumberEl.textContent = history.length;

    if (exact === CODE_LENGTH) {
      solved = true;
      stopTimer();
      winTitle.textContent = 'Cracked it!';
      winDetail.textContent = `${history.length} guess${history.length === 1 ? '' : 'es'} · ${timerEl.textContent}`;
      winOverlay.hidden = false;
      heroBadge.classList.add('solved');
      heroBadgeText.textContent = 'CRACKED';
    } else if (history.length >= MAX_GUESSES) {
      lost = true;
      stopTimer();
      winTitle.textContent = 'So close';
      winDetail.textContent = `the code was ${secret.join('')}`;
      winOverlay.hidden = false;
      heroBadge.classList.add('lost');
      heroBadgeText.textContent = 'OUT OF TRIES';
    }

    render();
    updateHeroStatus();
  }

  function newGame() {
    secret = randomSecret();
    currentInput = [];
    history = [];
    ruledOut = new Set();
    seconds = 0;
    solved = false;
    lost = false;
    stopTimer();
    heroNumberEl.textContent = '0';
    timerEl.textContent = '00:00';
    winOverlay.hidden = true;
    heroBadge.classList.remove('solved', 'lost');
    heroBadgeText.textContent = 'IN PROGRESS';
    render();
    updateHeroStatus();
  }

  hintToggle.addEventListener('click', () => {
    hintOn = !hintOn;
    hintToggle.setAttribute('aria-pressed', String(hintOn));
    render();
  });

  submitBtn.addEventListener('click', submitGuess);
  newCodeBtn.addEventListener('click', newGame);
  winNext.addEventListener('click', newGame);

  newGame();
})();
