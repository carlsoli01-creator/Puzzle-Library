(() => {
  const N = 4;
  const BOX = 2;
  // Only 4 empty cells keeps each one a quick single-candidate deduction,
  // so a casual solver clears the grid in about 30 seconds.
  const GIVENS = 12;

  const boardEl = document.getElementById('sudoku-board');
  const padRow = document.getElementById('pad-row');
  const filledCountEl = document.getElementById('filled-count');
  const timerEl = document.getElementById('timer');
  const conflictCountEl = document.getElementById('conflict-count');
  const heroStatusEl = document.getElementById('hero-status');
  const heroBadge = document.getElementById('hero-badge');
  const heroBadgeText = document.getElementById('hero-badge-text');
  const notesToggle = document.getElementById('notes-toggle');
  const winOverlay = document.getElementById('win-overlay');
  const winDetail = document.getElementById('win-detail');
  const winNext = document.getElementById('win-next');
  const newGridBtn = document.getElementById('new-grid-btn');
  const eraseBtn = document.getElementById('erase-btn');

  let grid = []; // 16 cells, 0 = empty
  let given = []; // 16 booleans
  let selected = -1;
  let seconds = 0;
  let timerId = null;
  let running = false;
  let solved = false;
  let showConflicts = true;

  const idx = (r, c) => r * N + c;

  function digitColor(v) {
    const hue = Math.round(((v - 1) * 360) / N);
    return `hsl(${hue}, 78%, 58%)`;
  }

  function generateSolved() {
    const g = Array(N * N).fill(0);
    function valid(r, c, v) {
      for (let cc = 0; cc < N; cc++) if (g[idx(r, cc)] === v) return false;
      for (let rr = 0; rr < N; rr++) if (g[idx(rr, c)] === v) return false;
      const br = Math.floor(r / BOX) * BOX, bc = Math.floor(c / BOX) * BOX;
      for (let rr = br; rr < br + BOX; rr++) {
        for (let cc = bc; cc < bc + BOX; cc++) {
          if (g[idx(rr, cc)] === v) return false;
        }
      }
      return true;
    }
    function fill(pos) {
      if (pos === N * N) return true;
      const r = Math.floor(pos / N), c = pos % N;
      const vals = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
      for (const v of vals) {
        if (valid(r, c, v)) {
          g[idx(r, c)] = v;
          if (fill(pos + 1)) return true;
          g[idx(r, c)] = 0;
        }
      }
      return false;
    }
    fill(0);
    return g;
  }

  function conflictsAt(r, c) {
    const v = grid[idx(r, c)];
    if (!v) return false;
    for (let cc = 0; cc < N; cc++) if (cc !== c && grid[idx(r, cc)] === v) return true;
    for (let rr = 0; rr < N; rr++) if (rr !== r && grid[idx(rr, c)] === v) return true;
    const br = Math.floor(r / BOX) * BOX, bc = Math.floor(c / BOX) * BOX;
    for (let rr = br; rr < br + BOX; rr++) {
      for (let cc = bc; cc < bc + BOX; cc++) {
        if ((rr !== r || cc !== c) && grid[idx(rr, cc)] === v) return true;
      }
    }
    return false;
  }

  function render() {
    boardEl.innerHTML = '';
    let conflictCount = 0;
    let filled = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(r, c);
        const v = grid[i];
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (given[i]) cell.classList.add('given');
        if (i === selected) cell.classList.add('selected');
        if (v) {
          filled += 1;
          cell.textContent = v;
          if (!given[i]) cell.style.setProperty('--tile-color', digitColor(v));
          const hasConflict = conflictsAt(r, c);
          if (hasConflict) {
            conflictCount += 1;
            if (showConflicts) cell.classList.add('conflict');
          }
        }
        cell.addEventListener('click', () => selectCell(i));
        boardEl.appendChild(cell);
      }
    }
    filledCountEl.textContent = filled;
    conflictCountEl.textContent = conflictCount;
    updateHeroStatus(filled, conflictCount);
    return { filled, conflictCount };
  }

  function updateHeroStatus(filled, conflictCount) {
    if (solved) {
      heroStatusEl.textContent = 'solved — nice work';
    } else if (conflictCount > 0) {
      heroStatusEl.textContent = `${conflictCount} conflict${conflictCount === 1 ? '' : 's'} to fix`;
    } else {
      heroStatusEl.textContent = 'every row, column & box needs 1–4';
    }
  }

  function selectCell(i) {
    if (solved || given[i]) {
      selected = given[i] ? -1 : i;
      render();
      return;
    }
    selected = i === selected ? -1 : i;
    render();
  }

  function setValue(v) {
    if (solved || selected === -1 || given[selected]) return;
    grid[selected] = grid[selected] === v ? 0 : v;
    startTimer();
    const { filled, conflictCount } = render();
    checkWin(filled, conflictCount);
  }

  function eraseSelected() {
    if (solved || selected === -1 || given[selected]) return;
    grid[selected] = 0;
    render();
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

  function checkWin(filled, conflictCount) {
    if (filled === N * N && conflictCount === 0) {
      solved = true;
      stopTimer();
      winDetail.textContent = `${timerEl.textContent} to solve`;
      winOverlay.hidden = false;
      heroBadge.classList.add('solved');
      heroBadgeText.textContent = 'SOLVED';
      updateHeroStatus(filled, conflictCount);
    }
  }

  function newGrid() {
    const solvedGrid = generateSolved();
    given = Array(N * N).fill(false);
    const positions = [...Array(N * N).keys()].sort(() => Math.random() - 0.5).slice(0, GIVENS);
    positions.forEach(p => { given[p] = true; });
    grid = solvedGrid.map((v, i) => (given[i] ? v : 0));

    selected = -1;
    seconds = 0;
    solved = false;
    stopTimer();
    timerEl.textContent = '00:00';
    winOverlay.hidden = true;
    heroBadge.classList.remove('solved');
    heroBadgeText.textContent = 'IN PROGRESS';
    render();
  }

  function renderPad() {
    padRow.innerHTML = '';
    for (let v = 1; v <= N; v++) {
      const btn = document.createElement('button');
      btn.className = 'pad-btn';
      btn.textContent = v;
      btn.style.setProperty('--tile-color', digitColor(v));
      btn.addEventListener('click', () => setValue(v));
      padRow.appendChild(btn);
    }
  }

  notesToggle.addEventListener('click', () => {
    showConflicts = !showConflicts;
    notesToggle.setAttribute('aria-pressed', String(showConflicts));
    render();
  });

  newGridBtn.addEventListener('click', newGrid);
  eraseBtn.addEventListener('click', eraseSelected);
  winNext.addEventListener('click', newGrid);

  renderPad();
  newGrid();
})();
