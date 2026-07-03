(() => {
  // Coding terms with no repeated letters, so every tile maps to exactly
  // one position and there's never ambiguity about which "S" goes where.
  const WORDS = [
    'BYTE', 'CODE', 'EDIT', 'FILE', 'LINK', 'LIST', 'MAIN', 'PATH', 'PUSH', 'SORT', 'TYPE',
    'STACK', 'DEBUG', 'QUERY', 'PATCH', 'TOKEN', 'INPUT', 'LOGIC',
  ];

  const heroNumberEl = document.getElementById('taps');
  const heroStatusEl = document.getElementById('hero-status');
  const heroBadge = document.getElementById('hero-badge');
  const heroBadgeText = document.getElementById('hero-badge-text');
  const timerEl = document.getElementById('timer');
  const lettersLeftEl = document.getElementById('letters-left');
  const hintLabelEl = document.getElementById('hint-label');
  const hintToggle = document.getElementById('hint-toggle');
  const wordBoard = document.getElementById('word-board');
  const answerRowEl = document.getElementById('answer-row');
  const poolRowEl = document.getElementById('pool-row');
  const winOverlay = document.getElementById('win-overlay');
  const winDetail = document.getElementById('win-detail');
  const winNext = document.getElementById('win-next');
  const newWordBtn = document.getElementById('new-word-btn');
  const reshuffleBtn = document.getElementById('reshuffle-btn');

  let target = '';
  let pool = []; // array of letters not yet placed
  let answer = []; // array of letters placed, in order
  let taps = 0;
  let seconds = 0;
  let timerId = null;
  let running = false;
  let solved = false;
  let hintOn = false;

  function letterColor(letter) {
    const idx = target.indexOf(letter);
    const hue = Math.round((idx * 360) / target.length);
    return `hsl(${hue}, 78%, 58%)`;
  }

  function scrambledOrder(word) {
    const letters = word.split('');
    let attempt = letters.slice();
    do {
      for (let i = attempt.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [attempt[i], attempt[j]] = [attempt[j], attempt[i]];
      }
    } while (attempt.join('') === word && word.length > 1);
    return attempt;
  }

  function render() {
    answerRowEl.innerHTML = '';
    for (let i = 0; i < target.length; i++) {
      const el = document.createElement('div');
      if (i < answer.length) {
        const letter = answer[i];
        el.className = 'letter-tile filled';
        el.style.setProperty('--tile-color', letterColor(letter));
        el.textContent = letter;
        el.addEventListener('click', () => removeFromAnswer(i));
      } else {
        el.className = 'letter-tile empty-slot';
      }
      answerRowEl.appendChild(el);
    }

    poolRowEl.innerHTML = '';
    pool.forEach((letter, i) => {
      const el = document.createElement('div');
      el.className = 'letter-tile pool';
      el.style.setProperty('--tile-color', letterColor(letter));
      el.textContent = letter;
      el.addEventListener('click', () => placeFromPool(i));
      poolRowEl.appendChild(el);
    });

    lettersLeftEl.textContent = target.length - answer.length;
    updateHint();
  }

  function updateHint() {
    const base = `${target.length} letters`;
    hintLabelEl.textContent = hintOn ? `${base} · starts with ${target[0]}` : base;
  }

  function updateHeroStatus() {
    if (solved) {
      heroStatusEl.textContent = 'solved — nice work';
      return;
    }
    const left = target.length - answer.length;
    heroStatusEl.textContent = taps === 0
      ? 'unscramble the coding term'
      : `${left} letter${left === 1 ? '' : 's'} left`;
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

  function placeFromPool(poolIndex) {
    if (solved) return;
    const [letter] = pool.splice(poolIndex, 1);
    answer.push(letter);
    taps += 1;
    heroNumberEl.textContent = taps;
    startTimer();
    render();
    updateHeroStatus();
    checkAnswer();
  }

  function removeFromAnswer(answerIndex) {
    if (solved) return;
    const [letter] = answer.splice(answerIndex, 1);
    pool.push(letter);
    taps += 1;
    heroNumberEl.textContent = taps;
    render();
    updateHeroStatus();
  }

  function checkAnswer() {
    if (answer.length !== target.length) return;
    if (answer.join('') === target) {
      solved = true;
      stopTimer();
      winDetail.textContent = `${taps} taps · ${timerEl.textContent}`;
      winOverlay.hidden = false;
      heroBadge.classList.add('solved');
      heroBadgeText.textContent = 'SOLVED';
      updateHeroStatus();
    } else {
      wordBoard.classList.add('shake');
      setTimeout(() => {
        wordBoard.classList.remove('shake');
        pool = pool.concat(answer);
        answer = [];
        render();
        updateHeroStatus();
      }, 450);
    }
  }

  function newWord({ keepWord = false } = {}) {
    if (!keepWord) {
      let next = target;
      if (WORDS.length > 1) {
        while (next === target) {
          next = WORDS[Math.floor(Math.random() * WORDS.length)];
        }
      } else {
        next = WORDS[0];
      }
      target = next;
    }
    pool = scrambledOrder(target);
    answer = [];
    taps = 0;
    seconds = 0;
    solved = false;
    stopTimer();
    heroNumberEl.textContent = '0';
    timerEl.textContent = '00:00';
    winOverlay.hidden = true;
    heroBadge.classList.remove('solved');
    heroBadgeText.textContent = 'IN PROGRESS';
    render();
    updateHeroStatus();
  }

  hintToggle.addEventListener('click', () => {
    hintOn = !hintOn;
    hintToggle.setAttribute('aria-pressed', String(hintOn));
    updateHint();
  });

  newWordBtn.addEventListener('click', () => newWord());
  reshuffleBtn.addEventListener('click', () => newWord({ keepWord: true }));
  winNext.addEventListener('click', () => newWord());

  newWord();
})();
