(() => {
  const PATTERNS = {
    box: {
      label: 'Box · 4-4-4-4',
      steps: [
        { key: 'in', label: 'Breathe In', duration: 4 },
        { key: 'hold', label: 'Hold', duration: 4 },
        { key: 'out', label: 'Breathe Out', duration: 4 },
        { key: 'hold', label: 'Hold', duration: 4 },
      ],
    },
    calm: {
      label: 'Calm · 4-7-8',
      steps: [
        { key: 'in', label: 'Breathe In', duration: 4 },
        { key: 'hold', label: 'Hold', duration: 7 },
        { key: 'out', label: 'Breathe Out', duration: 8 },
      ],
    },
    simple: {
      label: 'Simple · 4-6',
      steps: [
        { key: 'in', label: 'Breathe In', duration: 4 },
        { key: 'out', label: 'Breathe Out', duration: 6 },
      ],
    },
  };

  const breathCircle = document.getElementById('breath-circle');
  const phaseLabel = document.getElementById('phase-label');
  const phaseCount = document.getElementById('phase-count');
  const progressBar = document.getElementById('progress-bar');
  const startBtn = document.getElementById('start-btn');
  const startLabel = document.getElementById('start-label');
  const startIcon = document.getElementById('start-icon');
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');
  const patternRow = document.getElementById('pattern-row');
  const durationRow = document.getElementById('duration-row');
  const cycleCountEl = document.getElementById('cycle-count');
  const timeRemainingEl = document.getElementById('time-remaining');
  const sessionMetaEl = document.getElementById('session-meta');
  const heroBadge = document.getElementById('hero-badge');
  const heroBadgeText = document.getElementById('hero-badge-text');
  const completeOverlay = document.getElementById('complete-overlay');
  const completeDetail = document.getElementById('complete-detail');
  const completeRestart = document.getElementById('complete-restart');

  const RING_RADIUS = 112;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  progressBar.style.strokeDasharray = String(RING_CIRCUMFERENCE);
  progressBar.style.strokeDashoffset = String(RING_CIRCUMFERENCE);

  let patternKey = 'box';
  let sessionSeconds = 20;
  let soundOn = true;
  let running = false;
  let sessionState = 'idle'; // 'idle' | 'running' | 'paused'
  let cycles = 0;

  let stepIndex = 0;
  let stepTimer = null;
  let stepCountdownTimer = null;
  let stepRemaining = 0;
  let stepStartedAt = 0;
  let stepDurationMs = 0;
  let pausedStepRemainingMs = 0;

  let sessionElapsed = 0;
  let sessionTicker = null;

  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function chime(freq) {
    if (!soundOn) return;
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.7);
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function setChipActive(row, attr, value) {
    row.querySelectorAll('.chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset[attr] === String(value));
    });
  }

  function setHeroBadge(text) {
    heroBadgeText.textContent = text;
    heroBadge.classList.toggle('active', sessionState === 'running');
  }

  function setStartButton(label, icon) {
    startLabel.textContent = label;
    startIcon.textContent = icon;
  }

  const ICON_PLAY = '▶';
  const ICON_PAUSE = '❚❚';

  patternRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn || running) return;
    patternKey = btn.dataset.pattern;
    setChipActive(patternRow, 'pattern', patternKey);
    sessionMetaEl.textContent = PATTERNS[patternKey].label;
  });

  durationRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn || running) return;
    sessionSeconds = Number(btn.dataset.duration);
    setChipActive(durationRow, 'duration', sessionSeconds);
    timeRemainingEl.textContent = formatTime(sessionSeconds);
  });

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundIcon.textContent = soundOn ? '♪' : '✕';
  });

  function setStageDisabled(disabled) {
    [...patternRow.querySelectorAll('.chip'), ...durationRow.querySelectorAll('.chip')]
      .forEach(chip => { chip.disabled = disabled; });
  }

  // Schedules the end of the current step (countdown display + advance to the
  // next step) using an explicit duration, so a resumed step can pick up with
  // only its remaining time rather than restarting from the full duration.
  function scheduleStepEnd(durationMs) {
    clearInterval(stepCountdownTimer);
    stepRemaining = Math.ceil(durationMs / 1000);
    phaseCount.textContent = stepRemaining > 0 ? String(stepRemaining) : '';
    stepCountdownTimer = setInterval(() => {
      stepRemaining -= 1;
      phaseCount.textContent = stepRemaining > 0 ? String(stepRemaining) : '';
      if (stepRemaining <= 0) clearInterval(stepCountdownTimer);
    }, 1000);

    stepTimer = setTimeout(() => {
      const steps = PATTERNS[patternKey].steps;
      stepIndex += 1;
      if (stepIndex % steps.length === 0) {
        cycles += 1;
        cycleCountEl.textContent = String(cycles);
      }
      if (running) runStep();
    }, durationMs);
  }

  function runStep() {
    const steps = PATTERNS[patternKey].steps;
    const step = steps[stepIndex % steps.length];

    phaseLabel.style.opacity = 0;
    setTimeout(() => {
      phaseLabel.textContent = step.label;
      phaseLabel.style.opacity = 1;
    }, 150);

    breathCircle.style.transitionDuration = `${step.duration}s`;
    if (step.key === 'in') {
      breathCircle.classList.remove('shrink');
      breathCircle.classList.add('grow');
      chime(392);
    } else if (step.key === 'out') {
      breathCircle.classList.remove('grow');
      breathCircle.classList.add('shrink');
      chime(294);
    } else {
      chime(349);
    }

    stepStartedAt = performance.now();
    stepDurationMs = step.duration * 1000;
    scheduleStepEnd(stepDurationMs);
  }

  function tickSession() {
    sessionElapsed += 1;
    const remaining = Math.max(0, sessionSeconds - sessionElapsed);
    timeRemainingEl.textContent = formatTime(remaining);
    const progress = Math.min(1, sessionElapsed / sessionSeconds);
    progressBar.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
    if (sessionElapsed >= sessionSeconds) {
      finishSession();
    }
  }

  function startSession() {
    running = true;
    sessionState = 'running';
    cycles = 0;
    stepIndex = 0;
    sessionElapsed = 0;
    cycleCountEl.textContent = '0';
    timeRemainingEl.textContent = formatTime(sessionSeconds);
    progressBar.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
    setStartButton('Pause', ICON_PAUSE);
    setHeroBadge('IN SESSION');
    setStageDisabled(true);
    runStep();
    sessionTicker = setInterval(tickSession, 1000);
  }

  function pauseSession() {
    running = false;
    sessionState = 'paused';
    clearTimeout(stepTimer);
    clearInterval(stepCountdownTimer);
    clearInterval(sessionTicker);

    // CSS transitions keep animating even after their JS timers are cleared,
    // so freeze the circle at its current on-screen size instead of letting
    // it silently finish growing/shrinking while "paused".
    const computed = getComputedStyle(breathCircle).transform;
    breathCircle.style.transition = 'none';
    breathCircle.style.transform = computed;
    void breathCircle.offsetWidth;

    pausedStepRemainingMs = Math.max(0, stepDurationMs - (performance.now() - stepStartedAt));
    setStartButton('Resume', ICON_PLAY);
    setHeroBadge('PAUSED');
  }

  function resumeSession() {
    running = true;
    sessionState = 'running';
    setStartButton('Pause', ICON_PAUSE);
    setHeroBadge('IN SESSION');

    // Release the freeze and let the circle continue toward its target over
    // only the time that was left in this step, not the full step duration.
    breathCircle.style.transition = '';
    breathCircle.style.transform = '';
    void breathCircle.offsetWidth;

    const remainingMs = Math.max(50, pausedStepRemainingMs);
    breathCircle.style.transitionDuration = `${remainingMs / 1000}s`;
    stepStartedAt = performance.now() - (stepDurationMs - remainingMs);
    scheduleStepEnd(remainingMs);
    sessionTicker = setInterval(tickSession, 1000);
  }

  function finishSession() {
    running = false;
    sessionState = 'idle';
    clearTimeout(stepTimer);
    clearInterval(stepCountdownTimer);
    clearInterval(sessionTicker);
    breathCircle.style.transitionDuration = '1.2s';
    breathCircle.classList.remove('grow');
    breathCircle.classList.add('shrink');
    phaseLabel.textContent = 'Complete';
    phaseCount.textContent = '';
    completeDetail.textContent = `${cycles} cycle${cycles === 1 ? '' : 's'} · ${formatTime(sessionSeconds)} of breathing`;
    completeOverlay.hidden = false;
    setStartButton('Begin', ICON_PLAY);
    setHeroBadge('COMPLETE');
    setStageDisabled(false);
  }

  function resetToIdle() {
    running = false;
    sessionState = 'idle';
    clearTimeout(stepTimer);
    clearInterval(stepCountdownTimer);
    clearInterval(sessionTicker);
    stepIndex = 0;
    sessionElapsed = 0;
    cycles = 0;
    breathCircle.classList.remove('grow', 'shrink');
    breathCircle.style.transitionDuration = '4s';
    phaseLabel.textContent = 'Ready?';
    phaseCount.textContent = '';
    cycleCountEl.textContent = '0';
    timeRemainingEl.textContent = formatTime(sessionSeconds);
    progressBar.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
    setStartButton('Begin', ICON_PLAY);
    setHeroBadge('READY');
    setStageDisabled(false);
  }

  startBtn.addEventListener('click', () => {
    ensureAudio();
    if (sessionState === 'idle') {
      startSession();
    } else if (sessionState === 'running') {
      pauseSession();
    } else {
      resumeSession();
    }
  });

  completeRestart.addEventListener('click', () => {
    completeOverlay.hidden = true;
    resetToIdle();
  });

  resetToIdle();
})();
