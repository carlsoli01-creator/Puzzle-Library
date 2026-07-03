(() => {
  const TARGETS = [10, 8, 12];
  const PAIR_COUNT = 8;

  const heroNumberEl = document.getElementById('matches');
  const heroStatusEl = document.getElementById('hero-status');
  const heroBadge = document.getElementById('hero-badge');
  const heroBadgeText = document.getElementById('hero-badge-text');
  const timerEl = document.getElementById('timer');
  const pairsLeftEl = document.getElementById('pairs-left');
  const targetToggle = document.getElementById('target-toggle');
  const targetMeta = document.getElementById('target-meta');
  const boardEl = document.getElementById('sum-board');
  const winOverlay = document.getElementById('win-overlay');
  const winDetail = document.getElementById('win-detail');
  const winNext = document.getElementById('win-next');
  const newGameBtn = document.getElementById('new-game-btn');
  const reshuffleBtn = document.getElementById('reshuffle-btn');

  let targetIndex = 0;
  let target = TARGETS[targetIndex];
  let board = []; // [{ value, matched }]
  let selected = -1;
  let wrongPair = null;
  let taps = 0;
  let matches = 0;
  let seconds = 0;
  let timerId = null;
  let running = false;
  let solved = false;

  function tileColor(v) {
    const hue = Math.round(((v - 1) * 360) / 9);
    return `hsl(${hue}, 78%, 58%)`;
  }

  function buildPairPool(t) {
    const pool = [];
    for (let a = 1; a <= 9; a++) {
      const b = t - a;
      if (b >= 1 && b <= 9) pool.push([a, b]);
    }
    return pool;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generateValues(t) {
    const pool = buildPairPool(t);
    const values = [];
    for (let i = 0; i < PAIR_COUNT; i++) {
      const [a, b] = pool[Math.floor(Math.random() * pool.length)];
      values.push(a, b);
    }
    return shuffleArray(values);
  }

  function render() {
    boardEl.innerHTML = '';
    board.forEach((tile, i) => {
      const el = document.createElement('div');
      el.className = 'num-tile';
      if (tile.matched) {
        el.classList.add('matched');
      } else {
        el.style.setProperty('--tile-color', tileColor(tile.value));
        el.textContent = tile.value;
        if (i === selected) el.classList.add('selected');
        if (wrongPair && wrongPair.includes(i)) el.classList.add('shake');
        el.addEventListener('click', () => handleTileClick(i));
      }
      boardEl.appendChild(el);
    });
    pairsLeftEl.textContent = PAIR_COUNT - matches;
  }

  function updateHeroStatus() {
    if (solved) {
      heroStatusEl.textContent = 'solved — nice work';
    } else if (taps > 0) {
      const left = PAIR_COUNT - matches;
      heroStatusEl.textContent = `${left} pair${left === 1 ? '' : 's'} left`;
    } else {
      heroStatusEl.textContent = `tap two tiles that add up to ${target}`;
    }
  }

  function startTimer() {
    if (running || solved) return;
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

  function handleTileClick(i) {
    if (solved || wrongPair || board[i].matched) return;

    if (selected === -1) {
      selected = i;
      render();
      return;
    }
    if (selected === i) {
      selected = -1;
      render();
      return;
    }

    taps += 1;
    startTimer();
    updateHeroStatus();

    const sum = board[selected].value + board[i].value;
    if (sum === target) {
      board[selected].matched = true;
      board[i].matched = true;
      matches += 1;
      selected = -1;
      heroNumberEl.textContent = matches;
      render();
      updateHeroStatus();
      checkWin();
    } else {
      wrongPair = [selected, i];
      render();
      setTimeout(() => {
        wrongPair = null;
        selected = -1;
        render();
      }, 400);
    }
  }

  function checkWin() {
    if (matches === PAIR_COUNT) {
      solved = true;
      stopTimer();
      winDetail.textContent = `${taps} taps · ${timerEl.textContent}`;
      winOverlay.hidden = false;
      heroBadge.classList.add('solved');
      heroBadgeText.textContent = 'SOLVED';
      updateHeroStatus();
    }
  }

  function newGame({ keepValues = false } = {}) {
    const values = keepValues && board.length
      ? shuffleArray(board.map(t => t.value))
      : generateValues(target);
    board = values.map(v => ({ value: v, matched: false }));

    selected = -1;
    wrongPair = null;
    taps = 0;
    matches = 0;
    seconds = 0;
    solved = false;
    stopTimer();
    heroNumberEl.textContent = '0';
    timerEl.textContent = '00:00';
    winOverlay.hidden = true;
    heroBadge.classList.remove('solved');
    heroBadgeText.textContent = 'IN PROGRESS';
    targetMeta.textContent = target;
    render();
    updateHeroStatus();
  }

  targetToggle.addEventListener('click', () => {
    targetIndex = (targetIndex + 1) % TARGETS.length;
    target = TARGETS[targetIndex];
    targetToggle.textContent = target;
    newGame();
  });

  newGameBtn.addEventListener('click', () => newGame());
  reshuffleBtn.addEventListener('click', () => newGame({ keepValues: true }));
  winNext.addEventListener('click', () => newGame());

  newGame();
})();
