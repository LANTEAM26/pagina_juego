/* ============================================================
   ABEJA PROGRAMADORA – script.js
   Tablero 5×5 · Niveles progresivos · Estrellas · Sonidos
   Pensamiento computacional para niños 🐝
   ============================================================ */

(() => {
  'use strict';

  // ============================================================
  //  CONSTANTES
  // ============================================================
  const GRID_SIZE     = 5;                          // 👈 tablero 5×5
  const DIRS          = [[-1,0],[0,1],[1,0],[0,-1]]; // ↑ → ↓ ←
  const DIR_ROTATION  = [0, 90, 180, 270];
  const STORAGE_KEY   = 'abeja-programadora-v1';
  const MAX_LEVEL     = 20;

  const CMD_LABELS = {
    forward:  { icon: '⬆️', text: 'Adelante' },
    backward: { icon: '⬇️', text: 'Atrás'    },
    left:     { icon: '↩️', text: 'Izq.'     },
    right:    { icon: '↪️', text: 'Der.'     }
  };

  // ============================================================
  //  ESTADO
  // ============================================================
  const state = {
    bee:        { row: 0, col: 0, dir: 2 },
    goal:       { row: 4, col: 4 },
    obstacles:  new Set(),
    optimal:    0,
    sequence:   [],
    visited:    new Set(),
    isRunning:  false,
    isPaused:   false,
    currentStep: 0,
    soundEnabled: true,
    level:      1,
    totalStars: 0,
    bestStars:  {}     // { "1": 3, "2": 2, ... }
  };

  // ============================================================
  //  DOM
  // ============================================================
  const $ = (id) => document.getElementById(id);

  const gridEl        = $('grid');
  const sequenceBox   = $('sequenceBox');
  const statusBar     = $('statusBar');
  const btnGo         = $('btnGo');
  const btnPause      = $('btnPause');
  const btnClear      = $('btnClear');
  const btnNew        = $('btnNew');
  const btnSound      = $('btnSound');
  const btnHelp       = $('btnHelp');
  const btnCloseHelp  = $('btnCloseHelp');
  const btnCloseHelp2 = $('btnCloseHelp2');
  const btnStart      = $('btnStart');
  const btnNextLevel  = $('btnNextLevel');
  const startOverlay  = $('startOverlay');
  const helpOverlay   = $('helpOverlay');
  const winOverlay    = $('winOverlay');
  const levelValue    = $('levelValue');
  const starsValue    = $('starsValue');
  const movesValue    = $('movesValue');
  const chipCounter   = $('chipCounter');
  const feedback      = $('feedback');
  const feedbackEmoji = $('feedbackEmoji');
  const feedbackMsg   = $('feedbackMsg');
  const confettiLayer = $('confettiLayer');
  const winStars      = $('winStars');
  const winSteps      = $('winSteps');
  const winLevel      = $('winLevel');
  const winMsg        = $('winMsg');

  // ============================================================
  //  SVG DE LA ABEJA
  // ============================================================
  const BEE_SVG = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beeBodyGrad" cx="45%" cy="35%">
          <stop offset="0%"  stop-color="#ffe680"/>
          <stop offset="70%" stop-color="#ffc107"/>
          <stop offset="100%" stop-color="#f39c00"/>
        </radialGradient>
        <radialGradient id="beeHeadGrad" cx="40%" cy="30%">
          <stop offset="0%"  stop-color="#ffe680"/>
          <stop offset="100%" stop-color="#f5a300"/>
        </radialGradient>
      </defs>

      <!-- Alas con aleteo (SMIL) -->
      <g>
        <ellipse cx="27" cy="33" rx="13" ry="21" fill="#e9f7ff" opacity="0.92"
                 transform="rotate(-28 27 33)" stroke="#a5d8f3" stroke-width="1.4">
          <animate attributeName="ry" values="21;13;21" dur="0.22s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="73" cy="33" rx="13" ry="21" fill="#e9f7ff" opacity="0.92"
                 transform="rotate(28 73 33)" stroke="#a5d8f3" stroke-width="1.4">
          <animate attributeName="ry" values="21;13;21" dur="0.22s" repeatCount="indefinite"/>
        </ellipse>
      </g>

      <!-- Cuerpo -->
      <ellipse cx="50" cy="62" rx="25" ry="29"
               fill="url(#beeBodyGrad)" stroke="#c77d00" stroke-width="2"/>

      <!-- Rayas -->
      <path d="M27 50 Q50 56 73 50" stroke="#3b2f2f" stroke-width="7"
            fill="none" stroke-linecap="round"/>
      <path d="M27 66 Q50 72 73 66" stroke="#3b2f2f" stroke-width="7"
            fill="none" stroke-linecap="round"/>

      <!-- Cabeza -->
      <circle cx="50" cy="29" r="17"
              fill="url(#beeHeadGrad)" stroke="#c77d00" stroke-width="2"/>

      <!-- Ojos -->
      <circle cx="43" cy="26" r="4.6" fill="#3b2f2f"/>
      <circle cx="57" cy="26" r="4.6" fill="#3b2f2f"/>
      <circle cx="44.4" cy="24.2" r="1.7" fill="#fff"/>
      <circle cx="58.4" cy="24.2" r="1.7" fill="#fff"/>

      <!-- Mejillas -->
      <circle cx="36" cy="33" r="3.4" fill="#ff8a8a" opacity="0.65"/>
      <circle cx="64" cy="33" r="3.4" fill="#ff8a8a" opacity="0.65"/>

      <!-- Sonrisa -->
      <path d="M44 34 Q50 39.5 56 34" stroke="#3b2f2f" stroke-width="2.3"
            fill="none" stroke-linecap="round"/>

      <!-- Antenas -->
      <line x1="43" y1="15" x2="37" y2="5" stroke="#3b2f2f"
            stroke-width="2.5" stroke-linecap="round"/>
      <line x1="57" y1="15" x2="63" y2="5" stroke="#3b2f2f"
            stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="37" cy="5" r="3.2" fill="#3b2f2f"/>
      <circle cx="63" cy="5" r="3.2" fill="#3b2f2f"/>
    </svg>
  `;

  // ============================================================
  //  ESTILOS EXTRA INYECTADOS
  //  (obstáculo + temblor de la abeja + grid 5×5 por si acaso)
  // ============================================================
  const extraStyle = document.createElement('style');
  extraStyle.textContent = `
    .cell.obstacle {
      background:
        radial-gradient(circle at 30% 25%, rgba(255,255,255,.25), transparent 55%),
        linear-gradient(145deg, #b08a6a, #6b4a2e);
      box-shadow: inset 0 -3px 0 rgba(0,0,0,.25),
                  inset 0 2px 0 rgba(255,255,255,.15);
    }
    .cell.obstacle::after {
      content: '🪨';
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: clamp(18px, 3vw, 36px);
      filter: drop-shadow(0 2px 2px rgba(0,0,0,.3));
    }
    .cell.obstacle.highlight { transform: none !important; }

    .bee.shake {
      animation: bee-shake .45s ease-in-out;
    }
    @keyframes bee-shake {
      0%,100% { transform: translate(-50%,-55%) rotate(var(--rot,0deg)); }
      15%     { transform: translate(calc(-50% - 9px),-55%) rotate(var(--rot,0deg)); }
      30%     { transform: translate(calc(-50% + 9px),-55%) rotate(var(--rot,0deg)); }
      45%     { transform: translate(calc(-50% - 7px),-55%) rotate(var(--rot,0deg)); }
      60%     { transform: translate(calc(-50% + 7px),-55%) rotate(var(--rot,0deg)); }
      80%     { transform: translate(calc(-50% - 4px),-55%) rotate(var(--rot,0deg)); }
    }
  `;
  document.head.appendChild(extraStyle);

  // ============================================================
  //  AUDIO (Web Audio API)
  // ============================================================
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* sin audio */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function blip(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
    if (!audioCtx) return;
    const t0   = audioCtx.currentTime + delay;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function melody(notes, step, type = 'sine', vol = 0.14) {
    notes.forEach((f, i) => blip(f, step * 1.7, type, vol, i * step));
  }

  function playSound(name) {
    if (!state.soundEnabled) return;
    ensureAudio();
    if (!audioCtx) return;

    switch (name) {
      case 'click':  blip(520, 0.06, 'triangle', 0.08); break;
      case 'add':    blip(620, 0.08, 'sine', 0.12);
                     blip(880, 0.10, 'sine', 0.10, 0.06); break;
      case 'move':   blip(520, 0.10, 'sine', 0.12);
                     blip(700, 0.08, 'sine', 0.08, 0.05); break;
      case 'turn':   blip(430, 0.08, 'triangle', 0.10);
                     blip(570, 0.10, 'triangle', 0.09, 0.06); break;
      case 'go':     melody([523, 659, 784], 0.09, 'sine', 0.13); break;
      case 'pause':  blip(400, 0.14, 'triangle', 0.12); break;
      case 'clear':  blip(340, 0.08, 'sawtooth', 0.07);
                     blip(240, 0.14, 'sawtooth', 0.06, 0.07); break;
      case 'win':    melody([523, 659, 784, 1047], 0.13, 'sine', 0.15); break;
      case 'error':  blip(220, 0.15, 'triangle', 0.11);
                     blip(160, 0.22, 'triangle', 0.09, 0.13); break;
    }
  }

  // ============================================================
  //  UTILIDADES
  // ============================================================
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const randInt = (n) => Math.floor(Math.random() * n);
  const cellKey = (r, c) => `${r},${c}`;
  const manhattan = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  const inBounds = (r, c) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;

  function getCell(row, col) {
    return gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  // ============================================================
  //  BFS – Camino óptimo sobre el espacio (r, c, dir)
  //  Cada comando cuesta 1 (avanzar, retroceder o girar).
  // ============================================================
  function bfsOptimal(start, startDir, goal, obstacles) {
    const key = (r, c, d) => (r * 100) + (c * 10) + d;
    const queue = [[start.row, start.col, startDir, 0]];
    const seen  = new Set([key(start.row, start.col, startDir)]);

    while (queue.length) {
      const [r, c, d, dist] = queue.shift();
      if (r === goal.row && c === goal.col) return dist;

      // Avanzar
      const [fdr, fdc] = DIRS[d];
      const fr = r + fdr, fc = c + fdc;
      if (inBounds(fr, fc) && !obstacles.has(cellKey(fr, fc))) {
        const k = key(fr, fc, d);
        if (!seen.has(k)) { seen.add(k); queue.push([fr, fc, d, dist + 1]); }
      }

      // Retroceder (sin girar)
      const [bdr, bdc] = DIRS[(d + 2) % 4];
      const br = r + bdr, bc = c + bdc;
      if (inBounds(br, bc) && !obstacles.has(cellKey(br, bc))) {
        const k = key(br, bc, d);
        if (!seen.has(k)) { seen.add(k); queue.push([br, bc, d, dist + 1]); }
      }

      // Girar izquierda
      const dl = (d + 3) % 4;
      const kl = key(r, c, dl);
      if (!seen.has(kl)) { seen.add(kl); queue.push([r, c, dl, dist + 1]); }

      // Girar derecha
      const dr = (d + 1) % 4;
      const kr = key(r, c, dr);
      if (!seen.has(kr)) { seen.add(kr); queue.push([r, c, dr, dist + 1]); }
    }
    return Infinity;
  }

  // ============================================================
  //  GENERADOR DE NIVELES
  // ============================================================
  function generateLevel(level) {
    // Obstáculos crecen con el nivel (0 en nivel 1 y 2)
    const obstacleTarget =
      level <= 2 ? 0 :
      level <= 4 ? 1 :
      level <= 6 ? 2 :
      level <= 9 ? 3 : 4;

    for (let attempt = 0; attempt < 250; attempt++) {
      // ---- Abeja en un borde ----
      const side = randInt(4);
      let bee;
      if (side === 0)      bee = { row: 0,            col: randInt(GRID_SIZE), dir: 2 }; // arriba → mira abajo
      else if (side === 1) bee = { row: GRID_SIZE - 1, col: randInt(GRID_SIZE), dir: 0 }; // abajo → mira arriba
      else if (side === 2) bee = { row: randInt(GRID_SIZE), col: 0,            dir: 1 }; // izq → mira derecha
      else                 bee = { row: randInt(GRID_SIZE), col: GRID_SIZE - 1, dir: 3 }; // der → mira izquierda

      // ---- Meta alejada ----
      const goal = { row: randInt(GRID_SIZE), col: randInt(GRID_SIZE) };
      if (goal.row === bee.row && goal.col === bee.col) continue;
      if (manhattan(bee, goal) < 4) continue;

      // ---- Obstáculos ----
      const obstacles = new Set();
      let placed = 0, tries = 0;
      while (placed < obstacleTarget && tries < 120) {
        tries++;
        const r = randInt(GRID_SIZE), c = randInt(GRID_SIZE);
        const k = cellKey(r, c);
        if (k === cellKey(bee.row, bee.col))   continue;
        if (k === cellKey(goal.row, goal.col)) continue;
        if (obstacles.has(k))                  continue;
        obstacles.add(k);
        placed++;
      }

      // ---- Comprobar que hay camino ----
      const optimal = bfsOptimal(bee, bee.dir, goal, obstacles);
      if (optimal !== Infinity && optimal >= 3 && optimal <= 22) {
        return { bee, goal, obstacles, optimal };
      }
    }

    // Fallback garantizado
    const bee   = { row: 0, col: 0, dir: 2 };
    const goal  = { row: 4, col: 4 };
    const optimal = bfsOptimal(bee, 2, goal, new Set());
    return { bee, goal, obstacles: new Set(), optimal };
  }

  // ============================================================
  //  CREAR EL TABLERO 5×5
  // ============================================================
  function createGrid() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridEl.style.gridTemplateRows    = `repeat(${GRID_SIZE}, 1fr)`;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        gridEl.appendChild(cell);
      }
    }
  }

  // ============================================================
  //  RENDER DEL NIVEL
  // ============================================================
  function renderLevel() {
    // Limpiar celdas
    document.querySelectorAll('.cell').forEach((c) => {
      c.classList.remove('goal', 'obstacle', 'visited', 'highlight');
    });

    // Obstáculos
    state.obstacles.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const cell = getCell(r, c);
      if (cell) cell.classList.add('obstacle');
    });

    // Meta
    const goalCell = getCell(state.goal.row, state.goal.col);
    if (goalCell) goalCell.classList.add('goal');

    // Abeja
    placeBee();
    highlightCell(state.bee.row, state.bee.col, true);
    setTimeout(() => highlightCell(state.bee.row, state.bee.col, false), 500);

    updateHUD();
    updateSequenceUI();
  }

  // ============================================================
  //  ABEJA
  // ============================================================
  function placeBee() {
    const old = gridEl.querySelector('.bee');
    if (old) old.remove();

    const cell = getCell(state.bee.row, state.bee.col);
    if (!cell) return;

    const beeEl = document.createElement('div');
    beeEl.className = 'bee';
    beeEl.style.setProperty('--rot', DIR_ROTATION[state.bee.dir] + 'deg');
    beeEl.innerHTML = BEE_SVG;
    cell.appendChild(beeEl);
  }

  /* Movimiento FLIP: reparenta y anima la transición entre celdas */
  function moveBeeTo(newRow, newCol) {
    const beeEl = gridEl.querySelector('.bee');
    if (!beeEl) return;

    const oldRect = beeEl.getBoundingClientRect();
    const newCell = getCell(newRow, newCol);
    if (!newCell) return;

    newCell.appendChild(beeEl);

    const newRect = beeEl.getBoundingClientRect();
    const dx = oldRect.left - newRect.left;
    const dy = oldRect.top  - newRect.top;
    if (dx === 0 && dy === 0) return;

    beeEl.style.transition = 'none';
    beeEl.style.transform  =
      `translate(-50%, -55%) translate(${dx}px, ${dy}px) rotate(var(--rot, 0deg))`;
    void beeEl.offsetWidth; // forzar reflow

    requestAnimationFrame(() => {
      beeEl.style.transition = '';
      beeEl.style.transform  = '';
    });
  }

  function shakeBee() {
    const beeEl = gridEl.querySelector('.bee');
    if (!beeEl) return;
    beeEl.classList.remove('shake');
    void beeEl.offsetWidth;
    beeEl.classList.add('shake');
    setTimeout(() => beeEl.classList.remove('shake'), 500);
  }

  // ============================================================
  //  CELDAS
  // ============================================================
  function highlightCell(row, col, on) {
    const cell = getCell(row, col);
    if (!cell) return;
    cell.classList.toggle('highlight', on);
  }

  function markVisited(row, col) {
    const cell = getCell(row, col);
    if (cell) cell.classList.add('visited');
  }

  // ============================================================
  //  HUD
  // ============================================================
  function updateHUD() {
    levelValue.textContent = state.level;
    starsValue.textContent = state.totalStars;
    movesValue.textContent = state.sequence.length;
    chipCounter.textContent = state.sequence.length === 1
      ? '1 paso'
      : `${state.sequence.length} pasos`;
  }

  // ============================================================
  //  SECUENCIA
  // ============================================================
  function addCommand(cmd) {
    if (state.isRunning) return;
    if (state.sequence.length >= 40) {
      statusBar.textContent = '⚠️ ¡Demasiados pasos! Borra algunos.';
      return;
    }
    state.sequence.push(cmd);
    updateSequenceUI();
    updateHUD();
    playSound('add');

    statusBar.classList.remove('error', 'running');
    statusBar.textContent = `➕ ${CMD_LABELS[cmd].text}`;
    setTimeout(() => {
      if (!state.isRunning) {
        statusBar.textContent = `Pasos: ${state.sequence.length}`;
      }
    }, 700);
  }

  function updateSequenceUI() {
    sequenceBox.innerHTML = '';

    if (state.sequence.length === 0) {
      sequenceBox.innerHTML = `
        <div class="seq-empty">
          <span class="seq-empty-icon">✨</span>
          <span>Aquí aparecen tus pasos…</span>
        </div>`;
      return;
    }

    state.sequence.forEach((cmd, i) => {
      const chip = document.createElement('div');
      chip.className = 'seq-chip';
      if (state.isRunning && i < state.currentStep)  chip.classList.add('done');
      if (state.isRunning && i === state.currentStep) chip.classList.add('executing');
      chip.innerHTML = `
        <span class="chip-icon">${CMD_LABELS[cmd].icon}</span>
        <span class="chip-label">${CMD_LABELS[cmd].text}</span>`;
      sequenceBox.appendChild(chip);
    });

    // Auto-scroll al chip activo
    const active = sequenceBox.querySelector('.seq-chip.executing');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      sequenceBox.scrollLeft = sequenceBox.scrollWidth;
    }
  }

  function clearSequence() {
    if (state.isRunning) return;
    state.sequence = [];
    updateSequenceUI();
    updateHUD();
    playSound('clear');
    statusBar.classList.remove('error');
    statusBar.textContent = '🧹 Memoria borrada';
    setTimeout(() => {
      if (!state.isRunning) {
        statusBar.textContent = '¡Programa el camino de la abeja!';
      }
    }, 1200);
  }

  // ============================================================
  //  EJECUCIÓN
  // ============================================================
  function setControlsRunning(running) {
    btnGo.disabled    = running;
    btnPause.disabled = !running;
    btnClear.disabled = running;
    btnNew.disabled   = running;
    document.querySelectorAll('.cmd-btn').forEach((b) => (b.disabled = running));
  }

  async function runSequence() {
    if (state.isRunning || state.sequence.length === 0) return;

    state.isRunning   = true;
    state.isPaused    = false;
    state.currentStep = 0;
    state.visited     = new Set([cellKey(state.bee.row, state.bee.col)]);
    markVisited(state.bee.row, state.bee.col);

    setControlsRunning(true);
    btnPause.innerHTML = '<span class="action-icon">⏸️</span><span>Pausa</span>';
    playSound('go');
    statusBar.classList.remove('error');
    statusBar.classList.add('running');
    statusBar.textContent = '🚀 ¡La abeja está volando!';
    updateSequenceUI();

    let aborted = false;

    for (let i = 0; i < state.sequence.length; i++) {
      // Pausa
      while (state.isPaused && state.isRunning) await sleep(100);
      if (!state.isRunning) return; // cancelado

      state.currentStep = i;
      updateSequenceUI();

      const ok = await executeCommand(state.sequence[i]);
      if (!ok) { aborted = true; break; }

      await sleep(300);
    }

    finishRun(aborted);
  }

  async function executeCommand(cmd) {
    const beeEl = gridEl.querySelector('.bee');
    if (!beeEl) return false;

    // ---- Girar ----
    if (cmd === 'left' || cmd === 'right') {
      state.bee.dir = cmd === 'left'
        ? (state.bee.dir + 3) % 4
        : (state.bee.dir + 1) % 4;
      beeEl.style.setProperty('--rot', DIR_ROTATION[state.bee.dir] + 'deg');
      beeEl.classList.add('turning');
      playSound('turn');
      setTimeout(() => beeEl.classList.remove('turning'), 500);
      return true;
    }

    // ---- Avanzar / retroceder ----
    const dirIdx = cmd === 'forward'
      ? state.bee.dir
      : (state.bee.dir + 2) % 4;
    const [dr, dc] = DIRS[dirIdx];
    const nr = state.bee.row + dr;
    const nc = state.bee.col + dc;

    // Borde
    if (!inBounds(nr, nc)) {
      playSound('error');
      shakeBee();
      statusBar.classList.remove('running');
      statusBar.classList.add('error');
      statusBar.textContent = '🚧 ¡Ups! La abeja chocó con el borde';
      await sleep(700);
      return false;
    }

    // Obstáculo
    if (state.obstacles.has(cellKey(nr, nc))) {
      playSound('error');
      shakeBee();
      statusBar.classList.remove('running');
      statusBar.classList.add('error');
      statusBar.textContent = '🪨 ¡Hay una piedra en el camino!';
      await sleep(700);
      return false;
    }

    // Mover
    const prevRow = state.bee.row;
    const prevCol = state.bee.col;
    state.bee.row = nr;
    state.bee.col = nc;

    moveBeeTo(nr, nc);
    playSound('move');

    highlightCell(prevRow, prevCol, false);
    highlightCell(nr, nc, true);
    markVisited(nr, nc);
    state.visited.add(cellKey(nr, nc));

    await sleep(320);
    highlightCell(nr, nc, false);
    return true;
  }

  function finishRun(aborted) {
    state.isRunning = false;
    state.isPaused  = false;
    setControlsRunning(false);
    btnPause.innerHTML = '<span class="action-icon">⏸️</span><span>Pausa</span>';
    statusBar.classList.remove('running');
    updateSequenceUI();

    if (aborted) {
      // El error ya se mostró; solo feedback suave
      setTimeout(() => {
        if (state.bee.row === state.goal.row && state.bee.col === state.goal.col) {
          onWin();
        } else {
          showFeedback('😅', '¡Casi! Prueba otra vez', true);
        }
      }, 900);
      return;
    }

    if (state.bee.row === state.goal.row && state.bee.col === state.goal.col) {
      onWin();
    } else {
      playSound('error');
      statusBar.classList.add('error');
      statusBar.textContent = '🤔 La abeja no llegó a la flor. ¡Inténtalo de nuevo!';
      showFeedback('😅', '¡Casi! Prueba otra vez', true);
    }
  }

  function togglePause() {
    if (!state.isRunning) return;
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      btnPause.innerHTML = '<span class="action-icon">▶️</span><span>Seguir</span>';
      statusBar.classList.remove('running');
      statusBar.textContent = '⏸️ En pausa…';
      playSound('pause');
    } else {
      btnPause.innerHTML = '<span class="action-icon">⏸️</span><span>Pausa</span>';
      statusBar.classList.add('running');
      statusBar.textContent = '🚀 ¡La abeja está volando!';
      playSound('go');
    }
  }

  // ============================================================
  //  VICTORIA · ESTRELLAS
  // ============================================================
  function computeStars(used, optimal) {
    if (used <= optimal + 2) return 3;
    if (used <= optimal + 6) return 2;
    return 1;
  }

  function onWin() {
    playSound('win');
    statusBar.classList.remove('error');
    statusBar.classList.add('running');
    statusBar.textContent = '🎉 ¡Lo lograste! La abeja llegó a la flor';

    const beeEl = gridEl.querySelector('.bee');
    if (beeEl) beeEl.classList.add('celebrating');

    const stars = computeStars(state.sequence.length, state.optimal);

    // Actualizar récord del nivel
    const prevBest = state.bestStars[state.level] || 0;
    if (stars > prevBest) {
      state.totalStars += (stars - prevBest);
      state.bestStars[state.level] = stars;
      saveProgress();
    }

    updateHUD();
    launchConfetti();

    // Mostrar overlay tras un pequeño delay para ver la celebración
    setTimeout(() => {
      showWinOverlay(stars);
    }, 900);
  }

  function showWinOverlay(stars) {
    // Estrellas del overlay
    const starEls = winStars.querySelectorAll('.win-star');
    starEls.forEach((el, i) => {
      el.classList.toggle('hidden', i >= stars);
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });

    winSteps.textContent = state.sequence.length;
    winLevel.textContent = state.level;
    winMsg.textContent   = stars === 3
      ? '¡Perfecto! Usaste los pasos justos 🌟'
      : stars === 2
        ? '¡Muy bien! Puedes usar menos pasos 💪'
        : '¡Lo lograste! Intenta ser más eficiente 🐝';

    showOverlay(winOverlay);
  }

  // ============================================================
  //  OVERLAYS
  // ============================================================
  function showOverlay(el) { el.classList.add('show'); }
  function hideOverlay(el) { el.classList.remove('show'); }

  function showFeedback(emoji, msg, isError = false) {
    feedbackEmoji.textContent = emoji;
    feedbackMsg.textContent   = msg;
    feedback.classList.toggle('error', isError);
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 2200);
  }

  // ============================================================
  //  CONFETI
  // ============================================================
  function launchConfetti() {
    const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff9ff3','#feca57','#fb8500'];
    const count  = 70;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left            = (Math.random() * 100) + 'vw';
      piece.style.background      = colors[randInt(colors.length)];
      piece.style.animationDelay  = (Math.random() * 0.5) + 's';
      piece.style.animationDuration= (1.8 + Math.random() * 1.4) + 's';
      piece.style.width           = (8 + Math.random() * 8) + 'px';
      piece.style.height          = piece.style.width;
      if (Math.random() > 0.6) piece.style.borderRadius = '50%';
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 3600);
    }
  }

  // ============================================================
  //  NUEVO RETO / SIGUIENTE NIVEL
  // ============================================================
  function loadLevel(level, { resetStars = false } = {}) {
    if (resetStars) {
      state.totalStars = 0;
      state.bestStars  = {};
      saveProgress();
    }
    state.level = level;
    const lvl = generateLevel(level);

    state.bee       = { ...lvl.bee };
    state.goal      = { ...lvl.goal };
    state.obstacles = lvl.obstacles;
    state.optimal   = lvl.optimal;

    state.sequence  = [];
    state.visited   = new Set();
    state.isRunning = false;
    state.isPaused  = false;
    state.currentStep = 0;

    renderLevel();
    statusBar.classList.remove('error', 'running');
    statusBar.textContent = `¡Nivel ${level}! Programa el camino 🐝`;
  }

  function newChallenge() {
    if (state.isRunning) return;
    // Mismo nivel, nuevo layout
    const lvl = generateLevel(state.level);
    state.bee       = { ...lvl.bee };
    state.goal      = { ...lvl.goal };
    state.obstacles = lvl.obstacles;
    state.optimal   = lvl.optimal;
    state.sequence  = [];
    state.visited   = new Set();

    renderLevel();
    playSound('click');
    statusBar.classList.remove('error', 'running');
    statusBar.textContent = '🔄 ¡Nuevo reto! Programa el camino';
  }

  function nextLevel() {
    hideOverlay(winOverlay);
    const next = Math.min(state.level + 1, MAX_LEVEL);
    if (next === state.level && state.level === MAX_LEVEL) {
      // Reiniciar progresión
      loadLevel(1, { resetStars: true });
    } else {
      loadLevel(next);
    }
  }

  // ============================================================
  //  PERSISTENCIA
  // ============================================================
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level:      state.level,
        totalStars: state.totalStars,
        bestStars:  state.bestStars,
        sound:      state.soundEnabled
      }));
    } catch (e) { /* ignora */ }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.level === 'number')      state.level      = data.level;
      if (typeof data.totalStars === 'number') state.totalStars = data.totalStars;
      if (data.bestStars && typeof data.bestStars === 'object') state.bestStars = data.bestStars;
      if (typeof data.sound === 'boolean')     state.soundEnabled = data.sound;
    } catch (e) { /* ignora */ }
  }

  // ============================================================
  //  EVENTOS
  // ============================================================
  function bindEvents() {
    // --- Botones de movimiento ---
    document.querySelectorAll('.cmd-btn').forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        if (state.isRunning) return;
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 130);
        playSound('click');
        addCommand(btn.dataset.cmd);
      };
      btn.addEventListener('click', handler);
      btn.addEventListener('touchend', handler, { passive: false });
    });

    // --- GO ---
    const goHandler = (e) => {
      e.preventDefault();
      btnGo.classList.add('pressed');
      setTimeout(() => btnGo.classList.remove('pressed'), 130);
      runSequence();
    };
    btnGo.addEventListener('click', goHandler);
    btnGo.addEventListener('touchend', goHandler, { passive: false });

    // --- PAUSA ---
    const pauseHandler = (e) => {
      e.preventDefault();
      btnPause.classList.add('pressed');
      setTimeout(() => btnPause.classList.remove('pressed'), 130);
      togglePause();
    };
    btnPause.addEventListener('click', pauseHandler);
    btnPause.addEventListener('touchend', pauseHandler, { passive: false });

    // --- BORRAR ---
    const clearHandler = (e) => {
      e.preventDefault();
      btnClear.classList.add('pressed');
      setTimeout(() => btnClear.classList.remove('pressed'), 130);
      clearSequence();
    };
    btnClear.addEventListener('click', clearHandler);
    btnClear.addEventListener('touchend', clearHandler, { passive: false });

    // --- NUEVO RETO ---
    const newHandler = (e) => {
      e.preventDefault();
      btnNew.classList.add('pressed');
      setTimeout(() => btnNew.classList.remove('pressed'), 130);
      newChallenge();
    };
    btnNew.addEventListener('click', newHandler);
    btnNew.addEventListener('touchend', newHandler, { passive: false });

    // --- SONIDO ---
    const soundHandler = (e) => {
      e.preventDefault();
      state.soundEnabled = !state.soundEnabled;
      btnSound.classList.toggle('muted', !state.soundEnabled);
      btnSound.querySelector('span').textContent = state.soundEnabled ? '🔊' : '🔇';
      if (state.soundEnabled) playSound('click');
      saveProgress();
    };
    btnSound.addEventListener('click', soundHandler);
    btnSound.addEventListener('touchend', soundHandler, { passive: false });

    // --- AYUDA ---
    btnHelp.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('click');
      showOverlay(helpOverlay);
    });
    btnCloseHelp.addEventListener('click',  () => hideOverlay(helpOverlay));
    btnCloseHelp2.addEventListener('click', () => hideOverlay(helpOverlay));

    // --- START ---
    btnStart.addEventListener('click', (e) => {
      e.preventDefault();
      ensureAudio();
      playSound('click');
      hideOverlay(startOverlay);
      // pequeño retardo para que se vea la animación de salida
      setTimeout(() => loadLevel(state.level || 1), 250);
    });

    // --- SIGUIENTE NIVEL ---
    btnNextLevel.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('click');
      nextLevel();
    });

    // --- Audio al primer toque ---
    document.body.addEventListener('click',      () => ensureAudio(), { once: true });
    document.body.addEventListener('touchstart', () => ensureAudio(), { once: true, passive: true });

    // --- Teclado (útil en pizarra / teclado físico) ---
    window.addEventListener('keydown', (e) => {
      if (startOverlay.classList.contains('show')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btnStart.click();
        }
        return;
      }
      if (helpOverlay.classList.contains('show')) {
        if (e.key === 'Escape') hideOverlay(helpOverlay);
        return;
      }
      if (winOverlay.classList.contains('show')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btnNextLevel.click();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); addCommand('forward');  break;
        case 'ArrowDown':  e.preventDefault(); addCommand('backward'); break;
        case 'ArrowLeft':  e.preventDefault(); addCommand('left');     break;
        case 'ArrowRight': e.preventDefault(); addCommand('right');    break;
        case 'Enter':      e.preventDefault(); runSequence();          break;
        case 'Backspace':  e.preventDefault(); clearSequence();        break;
        case ' ':
          if (state.isRunning) { e.preventDefault(); togglePause(); }
          break;
      }
    });
  }

  // ============================================================
  //  INIT
  // ============================================================
  function init() {
    loadProgress();

    // Reflejar sonido guardado
    btnSound.classList.toggle('muted', !state.soundEnabled);
    btnSound.querySelector('span').textContent = state.soundEnabled ? '🔊' : '🔇';

    createGrid();
    // Nivel de muestra detrás del overlay de inicio
    loadLevel(state.level, { resetStars: false });
    bindEvents();
    // El overlay de inicio se muestra por defecto (clase show en HTML no está…)
    showOverlay(startOverlay);
  }

  // Arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();